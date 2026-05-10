import { mkdir, writeFile } from "node:fs/promises";
import { buildRemoteStartSimulatorStateMatrix } from "../src/remote-start-simulator/index";

const legacyOutDir = new URL("../artifacts/remote-start-simulator/", import.meta.url);
const nonHardwareOutDir = new URL("../artifacts/remote-start-nonhardware/", import.meta.url);
await mkdir(legacyOutDir, { recursive: true });
await mkdir(nonHardwareOutDir, { recursive: true });
const matrix = buildRemoteStartSimulatorStateMatrix();
const generatedAt = new Date().toISOString();
const payload = { generatedAt, hardwareValidation: false, matrix };
const json = `${JSON.stringify(payload, null, 2)}\n`;
await writeFile(new URL("state-matrix.json", legacyOutDir), json);
await writeFile(new URL("simulator-matrix.json", nonHardwareOutDir), json);

const byPlatform = new Map<string, { total: number; validPaused: number; commandRows: number }>();
for (const row of matrix) {
  const current = byPlatform.get(row.platform) ?? { total: 0, validPaused: 0, commandRows: 0 };
  current.total += 1;
  if (row.validPausedState) current.validPaused += 1;
  if (row.goCommandsAfterConfirmation > 0) current.commandRows += 1;
  byPlatform.set(row.platform, current);
}
const md = [
  "# Remote Start non-hardware simulator matrix",
  "",
  `Generated: ${generatedAt}`,
  "",
  "All rows are synthetic software checks. `hardwareValidation=false` for every row; no row certifies real TV/app behavior.",
  "",
  "| Platform | Rows | Valid paused-state rows | Rows that would send one command after confirmation |",
  "|---|---:|---:|---:|",
  ...Array.from(byPlatform.entries()).map(([platform, row]) => `| ${platform} | ${row.total} | ${row.validPaused} | ${row.commandRows} |`),
  "",
].join("\n");
await writeFile(new URL("simulator-matrix.md", nonHardwareOutDir), md);
console.log(`remote-start simulator matrix exported: ${matrix.length} rows; hardwareValidation=false`);
