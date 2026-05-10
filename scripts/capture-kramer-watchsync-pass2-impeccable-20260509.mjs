import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const baseUrl = process.env.BASE_URL || "http://localhost:5173/";
const outDir =
  "/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-watchsync-pass2-impeccable-20260509";
await fs.mkdir(outDir, { recursive: true });

const demoScreens = [
  "01-landing",
  "02-step1-photo-id",
  "03-photo-bottom-sheet",
  "04-manual-step1-category",
  "05-manual-step2-device-picker",
  "06-manual-step3-roku-setup",
  "07-result-success",
  "08-result-failed",
  "09-apple-tv-steer",
  "10-countdown-auto-play",
  "11-countdown-no-auto-play",
  "12-watch-tracker-free",
  "13-watch-tracker-pro",
  "14-paywall-session-6",
  "15-post-session-title-prompt",
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const metrics = [];

async function shot(name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const data = await page.evaluate(() => ({
    text: document.body.innerText,
    scrollY: window.scrollY,
    innerWidth: innerWidth,
    innerHeight: innerHeight,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  metrics.push({ name, file, ...data });
}

// ---- Reference-faithful demo screens (1-15) ---------------------
for (const id of demoScreens) {
  const url = `${baseUrl}?demo=${id}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(".ref-screen");
  await page.waitForTimeout(220);
  await shot(`ref-${id}`);
}

// ---- Running app screens (room flow) ----------------------------
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.goto(baseUrl, { waitUntil: "networkidle" });
await shot("app-01-landing-create-room");

await page.getByLabel("Your name").fill("Alex");
await page.getByRole("button", { name: "Create a room" }).click();
await page.waitForSelector(".early-remote-onboarding");
await page.evaluate(() => window.scrollTo(0, 0));
await shot("app-02-step1-photo-id");

await page
  .getByRole("button", { name: /Open photo options/i })
  .first()
  .click();
await page.waitForSelector(".photo-chooser-sheet");
await shot("app-03-photo-bottom-sheet");

await page.getByText("Pick manually instead").click();
await page.waitForSelector(".photo-chooser-sheet", { state: "detached" });
await page
  .getByRole("button", { name: /TV app built into my TV/i })
  .first()
  .click();
await page.waitForTimeout(500);

const scrollTo = (sel) =>
  page.evaluate((s) => {
    document.querySelector(s)?.scrollIntoView({ block: "start" });
  }, sel);

await scrollTo('[data-remote-step="1"]');
await page.waitForTimeout(220);
await shot("app-04-manual-step1-category");

await scrollTo('[data-remote-step="2"]');
await page.waitForTimeout(220);
await shot("app-05-manual-step2-device-picker");

await page
  .getByRole("button", { name: /Roku \/ Roku TV/i })
  .first()
  .click();
await page.waitForTimeout(500);
await scrollTo('[data-remote-step="3"]');
await page.waitForTimeout(220);
await shot("app-06-manual-step3-roku-setup");

await scrollTo(".countdown-hero");
await page.waitForTimeout(220);
await shot("app-07-countdown-section");

await scrollTo(".watch-history-card");
await page.waitForTimeout(220);
await shot("app-08-watch-tracker-section");

await scrollTo(".pricing-section-card");
await page.waitForTimeout(220);
await shot("app-09-pricing-section");

await scrollTo(".queue-section");
await page.waitForTimeout(220);
await shot("app-10-tonights-list");

await page
  .getByRole("button", { name: /Browse by streaming service/i })
  .click();
await page.waitForSelector(".recommend-panel");
await scrollTo(".recommend-panel");
await page.waitForTimeout(220);
await shot("app-11-browse-service");

// ---- Build a contact sheet by rendering HTML and screenshotting --
async function buildContactSheet(label, fileNames, columns = 3) {
  const tiles = await Promise.all(
    fileNames.map(async (file) => {
      const buf = await fs.readFile(path.join(outDir, file));
      return {
        file,
        b64: buf.toString("base64"),
      };
    }),
  );
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body { margin: 0; padding: 0; background: #050509; }
  body { padding: 28px 28px 36px; }
  h1 { color: #EDEAE5; font: 700 22px -apple-system, "SF Pro Display", system-ui;
       margin: 0 0 18px; letter-spacing: -0.02em; }
  .grid { display: grid; grid-template-columns: repeat(${columns}, minmax(0, 1fr));
          gap: 18px; }
  figure { margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  img { display: block; width: 100%; height: auto; border-radius: 26px;
        border: 1px solid rgba(255,255,255,0.06); background: #000; }
  figcaption { color: #8A8895; font: 600 11px -apple-system, "SF Pro Text", system-ui;
               letter-spacing: 0.04em; text-align: center; }
</style></head><body>
  <h1>${label}</h1>
  <div class="grid">
    ${tiles
      .map(
        (t) => `
      <figure>
        <img src="data:image/png;base64,${t.b64}" />
        <figcaption>${t.file.replace(/\.png$/, "")}</figcaption>
      </figure>`,
      )
      .join("")}
  </div>
</body></html>`;
  const sheetPage = await context.newPage();
  await sheetPage.setViewportSize({ width: 1320, height: 800 });
  await sheetPage.setContent(html, { waitUntil: "networkidle" });
  await sheetPage.waitForTimeout(180);
  const file = path.join(outDir, `${label}.png`);
  await sheetPage.screenshot({ path: file, fullPage: true });
  await sheetPage.close();
  return file;
}

const refSheetFile = await buildContactSheet(
  "contact-sheet-reference-screens",
  demoScreens.map((id) => `ref-${id}.png`),
  3,
);
const appSheetFile = await buildContactSheet(
  "contact-sheet-running-app",
  [
    "app-01-landing-create-room.png",
    "app-02-step1-photo-id.png",
    "app-03-photo-bottom-sheet.png",
    "app-04-manual-step1-category.png",
    "app-05-manual-step2-device-picker.png",
    "app-06-manual-step3-roku-setup.png",
    "app-07-countdown-section.png",
    "app-08-watch-tracker-section.png",
    "app-09-pricing-section.png",
    "app-10-tonights-list.png",
    "app-11-browse-service.png",
  ],
  3,
);

const fullSheetFile = await buildContactSheet(
  "contact-sheet",
  [
    ...demoScreens.map((id) => `ref-${id}.png`),
    "app-01-landing-create-room.png",
    "app-02-step1-photo-id.png",
    "app-03-photo-bottom-sheet.png",
    "app-04-manual-step1-category.png",
    "app-05-manual-step2-device-picker.png",
    "app-06-manual-step3-roku-setup.png",
    "app-07-countdown-section.png",
    "app-08-watch-tracker-section.png",
    "app-09-pricing-section.png",
    "app-10-tonights-list.png",
    "app-11-browse-service.png",
  ],
  3,
);

metrics.push({ name: "contact-sheet-reference-screens", file: refSheetFile });
metrics.push({ name: "contact-sheet-running-app", file: appSheetFile });
metrics.push({ name: "contact-sheet", file: fullSheetFile });

// ---- Hash everything for receipt --------------------------------
function getPngDimensions(buf) {
  // PNG: 8-byte signature, then 4-byte length + "IHDR" + width(4) + height(4)
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { width: w, height: h };
}

async function sha256OfFile(file) {
  const buf = await fs.readFile(file);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

const proofRecords = [];
for (const m of metrics) {
  if (!m.file) continue;
  const stat = await fs.stat(m.file);
  const buf = await fs.readFile(m.file);
  let dim = { width: 0, height: 0 };
  try {
    dim = getPngDimensions(buf);
  } catch {
    /* not a png */
  }
  proofRecords.push({
    name: m.name,
    file: m.file,
    bytes: stat.size,
    width: dim.width,
    height: dim.height,
    sha256: await sha256OfFile(m.file),
  });
}

await fs.writeFile(
  path.join(outDir, "metrics.json"),
  JSON.stringify(metrics, null, 2),
);
await fs.writeFile(
  path.join(outDir, "proof-index.json"),
  JSON.stringify(proofRecords, null, 2),
);
const metricsHash = await sha256OfFile(path.join(outDir, "metrics.json"));
const proofIndexHash = await sha256OfFile(
  path.join(outDir, "proof-index.json"),
);

await browser.close();
console.log(
  JSON.stringify(
    {
      outDir,
      proofRecords: proofRecords.length,
      metricsHash,
      proofIndexHash,
    },
    null,
    2,
  ),
);
