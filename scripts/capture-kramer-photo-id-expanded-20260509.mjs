import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const outDir = '/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-expanded-20260509';
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const metrics = [];
async function shot(name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const data = await page.evaluate(() => ({ text: document.body.innerText, scrollY: window.scrollY, innerWidth: innerWidth, innerHeight: innerHeight, docScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth }));
  metrics.push({ name, file, ...data });
}
async function scrollTo(selector) {
  await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), selector);
  await page.waitForTimeout(250);
}

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await shot('01-landing-create-room');
await page.getByLabel('Your name').fill('Alex');
await page.getByRole('button', { name: 'Create a room' }).click();
await page.waitForSelector('.early-remote-onboarding');
await page.evaluate(() => scrollTo(0,0));
await shot('02-auto-play-step1-photo-id');
await page.getByRole('button', { name: /Open photo options/i }).first().click();
await page.waitForSelector('.photo-chooser-sheet');
await shot('03-photo-bottom-sheet');
await page.getByRole('button', { name: 'Cancel' }).click();
await page.waitForSelector('.photo-chooser-sheet', { state: 'detached' });
await page.getByRole('button', { name: /TV app built into my TV/i }).first().click();
await page.waitForTimeout(500);
await scrollTo('[data-remote-step="1"]');
await shot('04-manual-step1-category');
await scrollTo('[data-remote-step="2"]');
await shot('05-manual-step2-device-picker');
await page.getByRole('button', { name: /Roku \/ Roku TV/i }).first().click();
await page.waitForTimeout(500);
await scrollTo('[data-remote-step="3"]');
await shot('06-manual-step3-roku-setup');
await scrollTo('.countdown-hero');
await shot('07-countdown-ready-section');
await scrollTo('.watch-history-card');
await shot('08-watch-tracker-section');
await scrollTo('.pricing-section-card');
await shot('09-pricing-section');
await scrollTo('.queue-section');
await shot('10-tonights-list-section');
await page.getByRole('button', { name: /Browse by streaming service/i }).click();
await page.waitForSelector('.recommend-panel');
await scrollTo('.recommend-panel');
await shot('11-browse-service-section');

await fs.writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
await browser.close();
console.log(JSON.stringify({ outDir, count: metrics.length, names: metrics.map(m => m.name) }, null, 2));
