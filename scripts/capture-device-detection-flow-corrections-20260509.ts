/**
 * Capture proof for the device-detection-flow corrections (2026-05-09).
 *
 * Drives the live AppFlow at http://localhost:5173/ via Playwright clicks
 * and captures screenshots that show:
 *   - manual category taps advance immediately to device picker / manual-only
 *     (NOT Apple TV detected, NOT a repeated category screen, NO Next gate)
 *   - device row taps advance immediately to per-device setup (no Next)
 *   - all 9 detected-device screens (7 supported brands + Apple TV + unknown),
 *     reachable from the photo path
 */

import { chromium, type Page } from "playwright";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const OUT = join(
  ROOT,
  "screenshots",
  "kramer-device-detection-flow-corrections-20260509",
);
const APP_URL = "http://localhost:5173/";
const VIEWPORT = { width: 390, height: 844 };

const proof: string[] = [];

async function snap(page: Page, file: string, describe: string) {
  const path = join(OUT, file);
  await page.screenshot({ path, fullPage: true });
  const screen = await page.$eval(
    ".ref-screen",
    (node) => node.getAttribute("data-flow-screen") ?? "(unknown)",
  );
  const detected =
    (await page.$eval(
      ".ref-screen",
      (node) => node.getAttribute("data-detected-device") ?? "",
    )) || null;
  const selected =
    (await page.$eval(
      ".ref-screen",
      (node) => node.getAttribute("data-selected-device") ?? "",
    )) || null;
  const stats = await stat(path);
  const buf = await readFile(path);
  const hash = createHash("sha256").update(buf).digest("hex");
  const dim = await page.evaluate(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  proof.push(
    [
      file,
      `screen=${screen}`,
      detected ? `detected=${detected}` : null,
      selected ? `selected=${selected}` : null,
      `viewport=${dim.w}x${dim.h}`,
      `${stats.size}B`,
      `sha256=${hash}`,
      `// ${describe}`,
    ]
      .filter(Boolean)
      .join("  "),
  );
  console.log(`saved ${file} (screen=${screen}${detected ? `, detected=${detected}` : ""})`);
}

async function waitForScreen(page: Page, screen: string) {
  await page.waitForSelector(`.ref-screen[data-flow-screen="${screen}"]`, {
    timeout: 5000,
  });
}

async function freshFlow(page: Page) {
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await waitForScreen(page, "landing");
  await page.click('[data-action="create-room"]');
  await waitForScreen(page, "step1-photo");
}

async function captureDetected(page: Page, file: string, id: string) {
  await freshFlow(page);
  await page.click('[data-action="open-photo-sheet"]');
  await waitForScreen(page, "photo-sheet");
  await page.click('[data-action="take-photo"]');
  await waitForScreen(page, "photo-detect-picker");
  await page.click(`[data-action="demo-detect-${id}"]`);
  await waitForScreen(page, "detected-device");
  await snap(page, file, `Detected device screen for ${id} (photo path)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Step 1 photo screen baseline
  await freshFlow(page);
  await snap(
    page,
    "01-step1-photo.png",
    "Step 1 photo — hero + 3 category cards visible",
  );

  // 2. Tap "TV app built into my TV" -> step2-device DIRECTLY (no category screen)
  await page.click('[data-action="pick-category-tv-builtin"]');
  await waitForScreen(page, "step2-device");
  await snap(
    page,
    "02-tv-builtin-direct-to-device-picker.png",
    "Tap TV app built into my TV → step2-device immediately. No repeat category, no Next.",
  );

  // 3. Tap "Streaming stick or box" -> step2-device DIRECTLY
  await freshFlow(page);
  await page.click('[data-action="pick-category-streaming-stick"]');
  await waitForScreen(page, "step2-device");
  await snap(
    page,
    "03-streaming-stick-direct-to-device-picker.png",
    "Tap Streaming stick or box → step2-device immediately. No repeat category, no Next.",
  );

  // 4. Tap "Console / cable / other" -> manual-unsupported (NOT Apple TV detected)
  await freshFlow(page);
  await page.click('[data-action="pick-category-console-other"]');
  await waitForScreen(page, "manual-unsupported");
  await snap(
    page,
    "04-console-cable-other-manual-only.png",
    "Tap Console / cable / other → manual-unsupported. NOT Apple TV detected.",
  );

  // 5. Photo hero -> bottom sheet
  await freshFlow(page);
  await page.click('[data-action="open-photo-sheet"]');
  await waitForScreen(page, "photo-sheet");
  await snap(page, "05-photo-bottom-sheet.png", "Photo hero opens chooser sheet");

  // 6. Take a photo -> photo-detect-picker
  await page.click('[data-action="take-photo"]');
  await waitForScreen(page, "photo-detect-picker");
  await snap(
    page,
    "06-photo-detect-picker.png",
    "Take a photo → honest demo picker listing 9 detectable devices",
  );

  // 7. Apple TV detected (only reachable from photo path)
  await captureDetected(page, "07-detected-apple-tv.png", "apple-tv");

  // 8. Roku detected
  await captureDetected(page, "08-detected-roku.png", "roku");

  // 9. Fire TV detected
  await captureDetected(page, "09-detected-fire-tv.png", "fire");

  // 10. Google / Android TV detected
  await captureDetected(page, "10-detected-google-android-tv.png", "google");

  // 11. LG TV detected
  await captureDetected(page, "11-detected-lg-tv.png", "lg");

  // 12. Samsung TV detected
  await captureDetected(page, "12-detected-samsung-tv.png", "samsung");

  // 13. VIZIO TV detected
  await captureDetected(page, "13-detected-vizio-tv.png", "vizio");

  // 14. Sony TV detected
  await captureDetected(page, "14-detected-sony-tv.png", "sony");

  // 15. Unknown / manual-only detected
  await captureDetected(page, "15-detected-unknown.png", "unknown");

  // 16. Device row tap on step2-device -> device-setup IMMEDIATELY (no Next)
  await freshFlow(page);
  await page.click('[data-action="pick-category-streaming-stick"]');
  await waitForScreen(page, "step2-device");
  await page.click('[data-action="select-device-roku"]');
  await waitForScreen(page, "device-setup");
  await snap(
    page,
    "16-device-row-tap-direct-to-setup.png",
    "Tap Roku row on step2-device → device-setup immediately. No Next gate.",
  );

  await browser.close();

  await writeFile(
    join(OUT, "_state-progression.txt"),
    proof.join("\n") + "\n",
    "utf8",
  );
  console.log(
    `\nProof written to ${join(OUT, "_state-progression.txt")} (${proof.length} frames)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
