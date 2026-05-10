/**
 * Capture Watch Sync stateful flow screenshots by walking real clicks
 * through AppFlow.tsx. Saves PNGs into the requested screenshot folder
 * and writes a small text proof of state progression.
 */

import { chromium, type Page } from "playwright";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const OUT = join(
  ROOT,
  "screenshots",
  "kramer-watchsync-stateful-flow-20260509",
);
const APP_URL = "http://localhost:5173/";

const VIEWPORT = { width: 390, height: 844 };

async function waitForScreen(page: Page, screen: string) {
  await page.waitForSelector(`.ref-screen[data-flow-screen="${screen}"]`, {
    timeout: 5000,
  });
}

async function snap(page: Page, file: string) {
  const path = join(OUT, file);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function sha256(path: string) {
  const data = await readFile(path);
  return createHash("sha256").update(data).digest("hex");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const proofLines: string[] = [];

  async function step(file: string, describe: string, capture: (page: Page) => Promise<void>) {
    await capture(page);
    const screen = await page.$eval(
      ".ref-screen",
      (node) => node.getAttribute("data-flow-screen") ?? "(unknown)",
    );
    const path = await snap(page, file);
    const stats = await stat(path);
    const hash = await sha256(path);
    proofLines.push(
      `${file}  screen=${screen}  ${stats.size}B  sha256=${hash}  // ${describe}`,
    );
    console.log(`saved ${file} (screen=${screen})`);
  }

  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await waitForScreen(page, "landing");

  // 01 landing initial
  await step(
    "01-landing-initial.png",
    "landing — name field + Create a room visible",
    async () => {
      await waitForScreen(page, "landing");
    },
  );

  // 02 after create room -> step 1 photo
  await step(
    "02-step1-photo.png",
    "after Create a room — Step 1 photo ID screen, no countdown/tracker stacked below",
    async () => {
      await page.click('[data-action="create-room"]');
      await waitForScreen(page, "step1-photo");
    },
  );

  // 03 photo card clicked -> bottom sheet
  await step(
    "03-photo-bottom-sheet.png",
    "tap photo hero — bottom sheet open with Take/Choose/Pick manually",
    async () => {
      await page.click('[data-action="open-photo-sheet"]');
      await waitForScreen(page, "photo-sheet");
    },
  );

  // 04 pick manually -> Step 1 category (no preselection)
  await step(
    "04-step1-category-empty.png",
    "Pick manually instead — Step 1 category screen with progress dots, no selection",
    async () => {
      await page.click('[data-action="pick-manually"]');
      await waitForScreen(page, "step1-category");
    },
  );

  // 05 select streaming-stick category
  await step(
    "05-step1-category-selected.png",
    "tap Streaming stick or box — selected highlight + Next active",
    async () => {
      await page.click('[data-action="select-category-streaming-stick"]');
    },
  );

  // 06 next -> step 2 device picker
  await step(
    "06-step2-device-picker.png",
    "Next — Step 2 device picker, 7 devices, Roku preselected",
    async () => {
      await page.click('[data-action="next-from-category"]');
      await waitForScreen(page, "step2-device");
    },
  );

  // 07 select different device (LG) to show selection state changes
  await step(
    "07-step2-device-selected-lg.png",
    "tap LG TV — selected indicator moves to LG",
    async () => {
      await page.click('[data-action="select-device-lg"]');
    },
  );

  // 08 reset to roku and continue
  await step(
    "08-step2-roku-reselected.png",
    "tap Roku/Roku TV — selected back on Roku before advancing",
    async () => {
      await page.click('[data-action="select-device-roku"]');
    },
  );

  // 09 next -> step 3 roku setup
  await step(
    "09-step3-roku-setup.png",
    "Next — Step 3 Roku setup numbered cards + Connect & test",
    async () => {
      await page.click('[data-action="next-from-device"]');
      await waitForScreen(page, "step3-roku");
    },
  );

  // 10 connect & test -> success result
  await step(
    "10-result-success.png",
    "Connect & test — success result screen (Auto Play ready)",
    async () => {
      await page.click('[data-action="connect-and-test"]');
      await waitForScreen(page, "result-success");
    },
  );

  // 11 continue -> countdown auto
  await step(
    "11-countdown-auto.png",
    "Continue to countdown — auto-play countdown with both ready chips",
    async () => {
      await page.click('[data-action="continue-to-countdown"]');
      await waitForScreen(page, "countdown-auto");
      // Capture before the countdown ticks down
      await page.waitForTimeout(150);
    },
  );

  // Wait for countdown to finish auto-advance to post-title
  await step(
    "12-post-title-prompt.png",
    "after countdown finishes — post-session title prompt screen",
    async () => {
      await page.waitForSelector(
        '.ref-screen[data-flow-screen="post-title"]',
        { timeout: 8000 },
      );
    },
  );

  // 13 type a title via suggestion + save -> tracker
  await step(
    "13-tracker-titled.png",
    "Save title via suggestion — Watch Tracker (free) with titled latest entry",
    async () => {
      await page.click('[data-action="suggest-dune-part-two"]');
      await page.click('[data-action="save-watch-title"]');
      await waitForScreen(page, "tracker");
    },
  );

  // 14 paywall via See Pro
  await step(
    "14-paywall.png",
    "tap See what's in Pro — paywall comparison screen",
    async () => {
      await page.click('[data-action="see-pro"]');
      await waitForScreen(page, "paywall");
    },
  );

  // back to tracker -> browse
  await page.click('[data-action="paywall-not-now"]');
  await waitForScreen(page, "tracker");

  await step(
    "15-browse-find-watch.png",
    "Find watch — browse screen with mock catalog rows + Add buttons",
    async () => {
      await page.click('[data-action="open-browse"]');
      await waitForScreen(page, "browse");
    },
  );

  // add 2 to tonight's list
  await step(
    "16-browse-two-added.png",
    "Tap Add on two titles — Added pill turns green",
    async () => {
      await page.click('[data-action="toggle-tonight-dune-2"]');
      await page.click('[data-action="toggle-tonight-the-bear"]');
    },
  );

  // back to tracker -> tonights list
  await page.click(".flow-back");
  await waitForScreen(page, "tracker");

  await step(
    "17-tonights-list.png",
    "tap Tonight's list — saved picks screen with 2 entries",
    async () => {
      await page.click('[data-action="open-tonights"]');
      await waitForScreen(page, "tonights");
    },
  );

  // Now demo failure path: reset -> create -> manual -> stick -> roku -> demo fail
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await waitForScreen(page, "landing");
  await page.click('[data-action="create-room"]');
  await waitForScreen(page, "step1-photo");
  await page.click('[data-action="pick-category-streaming-stick"]');
  await waitForScreen(page, "step1-category");
  await page.click('[data-action="next-from-category"]');
  await waitForScreen(page, "step2-device");
  await page.click('[data-action="next-from-device"]');
  await waitForScreen(page, "step3-roku");

  await step(
    "18-result-failed.png",
    "Demo failure toggle — failure result screen with Retry / Try different / Manual anyway",
    async () => {
      await page.click('[data-action="demo-fail"]');
      await waitForScreen(page, "result-fail");
    },
  );

  await step(
    "19-countdown-manual.png",
    "Start movie night anyway — manual countdown with Auto Play not set up banner",
    async () => {
      await page.click('[data-action="manual-anyway"]');
      await waitForScreen(page, "countdown-manual");
      await page.waitForTimeout(150);
    },
  );

  // Apple TV steer path: reset -> create -> Console category
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await waitForScreen(page, "landing");
  await page.click('[data-action="create-room"]');
  await waitForScreen(page, "step1-photo");

  await step(
    "20-apple-tv-steer.png",
    "tap Console / cable / other — Apple TV steer screen",
    async () => {
      await page.click('[data-action="pick-category-console-other"]');
      await waitForScreen(page, "apple-steer");
    },
  );

  await browser.close();

  await writeFile(
    join(OUT, "_state-progression.txt"),
    proofLines.join("\n") + "\n",
    "utf8",
  );
  console.log(`\nProof written to ${join(OUT, "_state-progression.txt")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
