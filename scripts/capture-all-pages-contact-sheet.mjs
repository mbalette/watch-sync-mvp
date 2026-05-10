import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5173/';
const OUT_DIR = path.resolve('screenshots/all-pages-copy-pass-20260509');
fs.mkdirSync(OUT_DIR, { recursive: true });

const shots = [];
async function shot(page, name, label) {
  const file = path.join(OUT_DIR, `${String(shots.length + 1).padStart(2, '0')}-${name}.png`);
  await page.waitForTimeout(350);
  await page.screenshot({ path: file, fullPage: false });
  shots.push({ file, label });
  console.log(`${shots.length}. ${label}: ${file}`);
}
async function clickIfVisible(page, locator, timeout = 1200) {
  const loc = locator.first();
  try {
    await loc.waitFor({ state: 'visible', timeout });
    await loc.click();
    return true;
  } catch {
    return false;
  }
}
async function safeClickText(page, text, timeout = 1200) {
  return clickIfVisible(page, page.getByText(text, { exact: false }), timeout);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
const page = await context.newPage();
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Alex');
await shot(page, 'landing-create-room', 'Landing / Create room');

await clickIfVisible(page, page.getByRole('button', { name: /enter a code/i }));
await shot(page, 'landing-enter-code', 'Landing / Enter code');

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Alex');
await clickIfVisible(page, page.getByRole('button', { name: /^create a room$/i }));
await page.waitForTimeout(600);
await shot(page, 'room-home', 'Room home / Remote Start top');

await safeClickText(page, 'Set up your TV');
await page.waitForTimeout(600);
await shot(page, 'remote-setup-step-1', 'Remote Start setup / Step 1');

await clickIfVisible(page, page.getByRole('button', { name: /TV app built into my TV/i }));
await page.waitForTimeout(600);
await shot(page, 'remote-setup-tv-method', 'Remote Start / TV app method');

await clickIfVisible(page, page.getByRole('button', { name: /Roku/i }));
await page.waitForTimeout(600);
await shot(page, 'remote-setup-roku', 'Remote Start / Roku setup');

await clickIfVisible(page, page.getByRole('button', { name: /Streaming stick or box/i }));
await page.waitForTimeout(600);
await shot(page, 'remote-setup-streaming-device', 'Remote Start / streaming device method');

await clickIfVisible(page, page.getByRole('button', { name: /Fire TV|Android TV|Google TV/i }));
await page.waitForTimeout(600);
await shot(page, 'remote-setup-fire-android-google', 'Remote Start / Fire Android Google setup');

await safeClickText(page, 'Find next watch');
await page.waitForTimeout(600);
await shot(page, 'room-picks', 'Room Picks / Find next watch');

await safeClickText(page, 'Chat');
await page.waitForTimeout(600);
await shot(page, 'chat', 'Chat drawer');

await safeClickText(page, "I'm ready");
await page.waitForTimeout(300);
await safeClickText(page, 'Try solo countdown');
await page.waitForTimeout(900);
await shot(page, 'countdown', 'Countdown / Play moment');

const metrics = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  docScrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
  text: document.body.innerText.slice(0, 1000),
}));
fs.writeFileSync(path.join(OUT_DIR, 'capture-metrics.json'), JSON.stringify({ shots, metrics }, null, 2));
await browser.close();
console.log(JSON.stringify({ outDir: OUT_DIR, shots }, null, 2));
