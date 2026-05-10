import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const outDir = '/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-visual-20260509-final';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const records = [];

async function record(name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const buf = await fs.readFile(file);
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  const dim = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  records.push({ name, file, sha256: sha, viewport: dim, bytes: buf.byteLength });
}

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Alex');
await page.getByRole('button', { name: 'Create a room' }).click();
await page.waitForSelector('.early-remote-onboarding', { state: 'visible' });
await page.evaluate(() => window.scrollTo(0, 0));
await record('01-auto-play-step1-photo-id');

await page.evaluate(() => {
  const card = document.querySelector('.early-remote-onboarding');
  if (card) card.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(200);
await record('01b-auto-play-step1-photo-id-card-aligned');

await page.getByRole('button', { name: /Open photo options/i }).first().click();
await page.waitForSelector('.photo-chooser-sheet', { state: 'visible' });
await page.waitForTimeout(300);
await record('02-photo-bottom-sheet');

await page.getByRole('button', { name: 'Pick manually instead' }).click();
await page.waitForSelector('.photo-chooser-sheet', { state: 'detached' });

await page.getByRole('button', { name: /TV app built into my TV/i }).first().click();
await page.waitForTimeout(500);
await page.evaluate(() => {
  const el = document.querySelector('[data-remote-step="1"]');
  if (el) el.scrollIntoView({ block: 'start' });
});
await record('03-drawer-step1-after-method-pick');

await page.evaluate(() => {
  const el = document.querySelector('[data-remote-step="2"]');
  if (el) el.scrollIntoView({ block: 'start' });
});
await page.waitForSelector('[data-remote-step="2"]', { state: 'visible' });
await record('04-drawer-step2-device-picker');

await fs.writeFile(path.join(outDir, 'records.json'), JSON.stringify(records, null, 2));
await browser.close();
console.log(JSON.stringify({ outDir, count: records.length, records }, null, 2));
