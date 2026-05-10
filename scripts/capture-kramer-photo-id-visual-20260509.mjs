import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const outDir = '/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-visual-20260509';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const metrics = [];

async function record(name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const data = await page.evaluate(() => ({
    text: document.body.innerText,
    scrollY: window.scrollY,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  metrics.push({ name, file, ...data });
}

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Alex');
await page.getByRole('button', { name: 'Create a room' }).click();
await page.waitForSelector('.early-remote-onboarding', { state: 'visible' });
await page.evaluate(() => window.scrollTo(0, 0));
await record('01-auto-play-step1-photo-id');

await page.getByRole('button', { name: /Open photo options/i }).first().click();
await page.waitForSelector('.photo-chooser-sheet', { state: 'visible' });
await record('02-photo-bottom-sheet');
await page.getByRole('button', { name: 'Cancel' }).click();
await page.waitForSelector('.photo-chooser-sheet', { state: 'detached' });

await page.getByRole('button', { name: /TV app built into my TV/i }).first().click();
await page.waitForTimeout(500);
await page.evaluate(() => {
  const el = document.querySelector('[data-remote-step="1"]');
  if (el) el.scrollIntoView({ block: 'start' });
});
await record('03-manual-step1-category-selected');

await page.evaluate(() => {
  const el = document.querySelector('[data-remote-step="2"]');
  if (el) el.scrollIntoView({ block: 'start' });
});
await page.waitForSelector('[data-remote-step="2"]', { state: 'visible' });
await record('04-manual-step2-device-picker');

await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
await browser.close();
console.log(JSON.stringify({ outDir, count: metrics.length, names: metrics.map(m => m.name) }, null, 2));
