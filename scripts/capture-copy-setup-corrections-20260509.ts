import { chromium, type Page } from "playwright";
import { mkdir, stat, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const OUT = join(ROOT, "screenshots", "copy-setup-corrections-20260509");
const BASE = "http://127.0.0.1:5173/";
const VIEWPORT = { width: 390, height: 844 };

async function sha(path: string) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function screen(page: Page) {
  return page.$eval(".ref-screen", (node) => ({
    flow: node.getAttribute("data-flow-screen") ?? "",
    device: node.getAttribute("data-selected-device") ?? "",
    detected: node.getAttribute("data-detected-device") ?? "",
    text: (node as HTMLElement).innerText,
  }));
}

async function snap(page: Page, file: string, note: string, lines: string[]) {
  const path = join(OUT, file);
  await page.screenshot({ path, fullPage: true });
  const meta = await screen(page);
  const stats = await stat(path);
  lines.push(`${file} screen=${meta.flow} selected=${meta.device || "-"} detected=${meta.detected || "-"} ${stats.size}B sha256=${await sha(path)} // ${note}`);
}

async function createRoom(page: Page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector('.ref-screen[data-flow-screen="landing"]');
  await page.getByRole("button", { name: "Create a room" }).click();
  await page.waitForSelector('.ref-screen[data-flow-screen="step1-photo"]');
}

async function setupFor(page: Page, action: string) {
  await createRoom(page);
  await page.locator('[data-action="pick-category-streaming-stick"]').click();
  await page.waitForSelector('.ref-screen[data-flow-screen="step2-device"]');
  await page.locator(`[data-action="${action}"]`).click();
  await page.waitForSelector('.ref-screen[data-flow-screen="device-setup"]');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const lines: string[] = [];

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector('.ref-screen[data-flow-screen="landing"]');
  await snap(page, "01-landing-blank-name-new-copy.png", "Landing: 3-2-1 Play / Watch Together / blank name / From Anywhere non-italic via CSS", lines);

  await createRoom(page);
  await page.locator('[data-action="pick-category-console-other"]').click();
  await page.waitForSelector('.ref-screen[data-flow-screen="manual-unsupported"]');
  await snap(page, "02-console-manual-no-apple.png", "Console/cable/other: manual-only, not Apple TV detected", lines);

  const devices: Array<[string, string]> = [
    ["select-device-roku", "03-setup-roku.png"],
    ["select-device-fire", "04-setup-fire-adb.png"],
    ["select-device-google", "05-setup-google-adb.png"],
    ["select-device-lg", "06-setup-lg-webos.png"],
    ["select-device-samsung", "07-setup-samsung-token.png"],
    ["select-device-vizio", "08-setup-vizio-pin.png"],
    ["select-device-sony", "09-setup-sony-bravia.png"],
  ];
  for (const [action, file] of devices) {
    await setupFor(page, action);
    await snap(page, file, `${action} setup instructions`, lines);
  }

  await createRoom(page);
  await page.locator('[data-action="pick-category-streaming-stick"]').click();
  await page.waitForSelector('.ref-screen[data-flow-screen="step2-device"]');
  await page.locator('[data-action="select-device-roku"]').click();
  await page.waitForSelector('.ref-screen[data-flow-screen="device-setup"]');
  await page.locator('[data-action="connect-and-test"]').click();
  await page.waitForSelector('.ref-screen[data-flow-screen="result-success"]');
  await page.locator('[data-action="continue-to-countdown"]').click();
  await page.waitForSelector('.ref-screen[data-flow-screen="countdown-auto"]');
  await snap(page, "10-countdown-empty-room.png", "Countdown: no Alex/Meredith chips; empty-room state", lines);

  await writeFile(join(OUT, "_state-proof.txt"), `${lines.join("\n")}\n`);
  await browser.close();
  console.log(`proof written to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
