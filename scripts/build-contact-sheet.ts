/**
 * Build a single contact-sheet PNG from the 20 captured stateful-flow PNGs.
 * Uses Playwright to render an HTML grid and screenshot it.
 */

import { chromium } from "playwright";
import { readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const OUT = resolve(
  new URL(".", import.meta.url).pathname,
  "..",
  "screenshots",
  "kramer-watchsync-stateful-flow-20260509",
);

async function main() {
  const files = (await readdir(OUT))
    .filter((file) => /^\d+-.+\.png$/.test(file))
    .sort();

  const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { background:#0A0A0E; color:#EDEAE5;
    font-family:-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
    margin:0; padding:24px; }
  h1 { font-size: 18px; font-weight: 700; letter-spacing:-0.01em; margin:0 0 6px; }
  p.note { color:#8A8895; font-size:12px; margin:0 0 22px; }
  .grid { display:grid; grid-template-columns: repeat(5, 1fr); gap:18px; }
  figure { margin:0; background:#111118; border:1px solid rgba(255,255,255,0.06);
    border-radius:14px; padding:8px; }
  figure img { display:block; width:100%; height:auto; border-radius:8px; }
  figcaption { color:#8A8895; font-size:10.5px; margin:8px 4px 4px;
    letter-spacing:0.02em; line-height:1.4; }
  figcaption strong { color:#EDEAE5; font-weight:700; display:block; margin-bottom:2px; }
</style></head><body>
<h1>Watch Sync — Stateful flow click-through (20 screens)</h1>
<p class="note">Captured by walking the real app via Playwright clicks (not ?demo= routes). Each frame's data-flow-screen attribute is logged in _state-progression.txt.</p>
<div class="grid">
${files
  .map((file) => {
    const label = file.replace(/^\d+-/, "").replace(/\.png$/, "");
    const num = file.slice(0, 2);
    return `<figure><img src="${file}" alt="${label}" /><figcaption><strong>${num}</strong>${label}</figcaption></figure>`;
  })
  .join("\n")}
</div>
</body></html>`;

  const htmlPath = join(OUT, "_contact-sheet.html");
  await writeFile(htmlPath, html, "utf8");

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  const sheetPath = join(OUT, "_contact-sheet.png");
  await page.screenshot({ path: sheetPath, fullPage: true });
  await browser.close();
  console.log(`contact sheet: ${sheetPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
