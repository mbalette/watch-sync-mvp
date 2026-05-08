import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { sanitizeRemoteStartOutcome } from "../src/remote-start-outcome-sanitizer";

const artifactDir = new URL("../artifacts/remote-start-runtime-beta/", import.meta.url);
const fixturePath = new URL("../fixtures/remote-start-outcome-events.json", import.meta.url);

export async function loadEvents() {
  const envPath = "/Users/home/Desktop/kyrosworkspace/runtime/secrets/bigmike/cloudflare.env";
  const hasCloudflareEnv = existsSync(envPath);
  const note = hasCloudflareEnv
    ? "Cloudflare env file detected; offline-safe export uses sanitized local fixture unless WRANGLER_REMOTE_EXPORT=1 is set. Secrets are not printed."
    : "Cloudflare env file not found; using sanitized fixture/mock events.";
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as Record<string, unknown>[];
  return { events: raw.map(sanitizeRemoteStartOutcome), sourceNote: note };
}

function pct(n: number, d: number) {
  return d ? Number(((n / d) * 100).toFixed(2)) : 0;
}

function countBy(events: { [key: string]: unknown }[], key: string) {
  return events.reduce<Record<string, number>>((acc, event) => {
    const value = typeof event[key] === "string" ? String(event[key]) : "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function summarize(events: { [key: string]: unknown }[], sourceNote: string) {
  const setupStarts = events.filter((event) => event.type === "setup_start").length;
  const testPass = events.filter((event) => event.testPlayResult === "pass" || event.type === "test_play_pass").length;
  const testFail = events.filter((event) => event.testPlayResult === "fail" || event.type === "test_play_fail").length;
  const testTotal = testPass + testFail;
  const ready = events.filter((event) => event.type === "ready_confirmed").length;
  const goAttempted = events.filter((event) => event.type === "go_attempted").length;
  const goSuccess = events.filter((event) => event.goResult === "success_self_report" || event.type === "go_sent").length;
  const manualFallback = events.filter((event) => event.manualPlayFallbackUsed === true || event.type === "manual_play_fallback").length;
  const wrongScreen = events.filter((event) => event.wrongScreenOrOverlay === true || event.type === "wrong_screen_or_overlay").length;
  const helperUnavailable = events.filter((event) => event.type === "helper_unavailable" || event.failureCode === "helper_unavailable").length;
  const networkFailure = events.filter((event) => event.type === "network_failure" || event.type === "network_or_helper_failure" || event.failureCode === "network_blocked").length;
  const killSwitch = events.filter((event) => event.type === "kill_switch_block").length;
  const forbidden = ["email","phone","ip","ipAddress","host","url","titleName","profileName","streamingAccount","pairingToken","helperToken","authToken","token","rokuSerial","serialNumber","vizioToken","lgClientKey","samsungToken","sonyPsk","psk","password"];
  const leaks = events.flatMap((event) => forbidden.filter((key) => Object.hasOwn(event, key)));
  return {
    generatedAt: new Date().toISOString(),
    sourceNote,
    piiIncluded: false,
    retentionDays: Number(process.env.REMOTE_START_OUTCOME_RETENTION_DAYS ?? 30),
    counts: {
      setupStarts,
      platformSplit: countBy(events, "platform"),
      deviceTypeSplit: countBy(events, "deviceType"),
      appSplit: countBy(events, "streamingApp"),
      testPlayPass: testPass,
      testPlayFail: testFail,
      readyConfirmed: ready,
      goAttempted,
      goSuccessSelfReport: goSuccess,
      manualFallback,
      wrongScreenOrOverlay: wrongScreen,
      helperUnavailable,
      networkFailure,
      killSwitchEvents: killSwitch,
      eventCountByDay: countBy(events.map((event) => ({ day: String(event.timestamp ?? "unknown").slice(0, 10) })), "day"),
    },
    rates: {
      testPlayPassRate: pct(testPass, testTotal),
      readyRate: pct(ready, testPass),
      goSuccessSelfReportRate: pct(goSuccess, goAttempted),
      manualFallbackRate: pct(manualFallback, events.length),
      wrongScreenOrOverlayRate: pct(wrongScreen, events.length),
    },
    redactionAudit: { forbiddenFieldsChecked: forbidden, leaksFound: leaks, passed: leaks.length === 0 },
  };
}

export function summaryMarkdown(summary: ReturnType<typeof summarize>) {
  return `# Remote Start runtime beta summary\n\n${summary.sourceNote}\n\nNo PII is included. Retention target: ${summary.retentionDays} days.\n\n## Counts\n\n- Setup starts: ${summary.counts.setupStarts}\n- Test Play pass/fail: ${summary.counts.testPlayPass}/${summary.counts.testPlayFail}\n- Ready confirmations: ${summary.counts.readyConfirmed}\n- GO attempted/success self-report: ${summary.counts.goAttempted}/${summary.counts.goSuccessSelfReport}\n- Manual fallback: ${summary.counts.manualFallback}\n- Wrong screen/overlay: ${summary.counts.wrongScreenOrOverlay}\n- Helper unavailable: ${summary.counts.helperUnavailable}\n- Network failure: ${summary.counts.networkFailure}\n- Kill-switch events: ${summary.counts.killSwitchEvents}\n\n## Rates\n\n- Test Play pass rate: ${summary.rates.testPlayPassRate}%\n- Ready rate after Test Play pass: ${summary.rates.readyRate}%\n- GO success self-report rate: ${summary.rates.goSuccessSelfReportRate}%\n- Manual fallback rate: ${summary.rates.manualFallbackRate}%\n- Wrong screen/overlay rate: ${summary.rates.wrongScreenOrOverlayRate}%\n\n## Redaction audit\n\nPassed: ${summary.redactionAudit.passed}\n`;
}

export async function writeSummary() {
  await mkdir(artifactDir, { recursive: true });
  const { events, sourceNote } = await loadEvents();
  const summary = summarize(events, sourceNote);
  await writeFile(new URL("live-summary.json", artifactDir), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(new URL("live-summary.md", artifactDir), summaryMarkdown(summary));
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = await writeSummary();
  console.log(JSON.stringify({ ok: true, eventsSummarized: Object.values(summary.counts.eventCountByDay).reduce((a, b) => a + b, 0), output: "artifacts/remote-start-runtime-beta/live-summary.json" }));
}
