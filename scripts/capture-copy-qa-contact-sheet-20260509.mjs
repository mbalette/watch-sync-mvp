import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174/';
const OUT_DIR = path.resolve('screenshots/copy-qa-20260509-latest');
fs.mkdirSync(OUT_DIR, { recursive: true });

const shots = [];
async function shot(page, name, label) {
  await page.waitForTimeout(450);
  const file = path.join(OUT_DIR, `${String(shots.length + 1).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const text = await page.locator('body').innerText().catch(() => '');
  shots.push({ file, label, text: text.slice(0, 1400) });
  console.log(`${shots.length}. ${label}: ${file}`);
}
async function click(locator, timeout = 2500) {
  const loc = locator.first();
  await loc.waitFor({ state: 'visible', timeout });
  await loc.click();
}
async function clickMaybe(locator, timeout = 1000) {
  try { await click(locator, timeout); return true; } catch { return false; }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const page = await context.newPage();

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Alex');
await page.waitForTimeout(900);
await shot(page, 'landing-create-room', '01 Landing / Create room');

await click(page.getByRole('button', { name: /enter a code/i }));
await page.waitForTimeout(700);
await shot(page, 'landing-enter-code', '02 Landing / Enter code');

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Alex');
await click(page.getByRole('button', { name: /^create a room$/i }));
await page.waitForTimeout(1100);
await shot(page, 'room-home', '03 Room home');

await page.getByText('Your time together, remembered automatically.').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await shot(page, 'watch-tracker-history', '04 Watch tracker / history');

await page.getByText('Auto Play setup').scrollIntoViewIfNeeded();
await clickMaybe(page.getByRole('button', { name: /set up your tv/i }), 1800);
await page.waitForTimeout(600);
await shot(page, 'setup-step-1', '04 Auto Play setup / Step 1');

await click(page.getByRole('button', { name: /TV app built into my TV/i }));
await page.waitForTimeout(800);
await shot(page, 'device-cards-tv-method', '05 Device cards / TV method');

await click(page.getByRole('button', { name: /Roku/i }));
await page.waitForTimeout(800);
await shot(page, 'roku-setup', '06 Roku setup');

await click(page.getByRole('button', { name: /Streaming stick or box/i }));
await page.waitForTimeout(800);
await shot(page, 'streaming-device-method', '07 Streaming device method');

await click(page.getByRole('button', { name: /Fire TV|Android TV|Google TV/i }));
await page.waitForTimeout(800);
await shot(page, 'fire-android-google-setup', '08 Fire / Android / Google TV setup');

await click(page.getByRole('button', { name: /Find watch/i }));
await page.waitForTimeout(800);
await shot(page, 'room-picks', '09 Browse titles / picks');

await click(page.getByRole('button', { name: /^Chat$/i }));
await page.waitForTimeout(800);
await shot(page, 'chat', '10 Chat');

await click(page.getByRole('button', { name: /I'm ready/i }));
await click(page.getByRole('button', { name: /Start without partner/i }));
await page.waitForTimeout(950);
await shot(page, 'countdown', '11 Countdown');

fs.writeFileSync(path.join(OUT_DIR, 'capture-metrics.json'), JSON.stringify({ baseUrl: BASE_URL, shots }, null, 2));
await browser.close();
console.log(JSON.stringify({ outDir: OUT_DIR, count: shots.length }, null, 2));
