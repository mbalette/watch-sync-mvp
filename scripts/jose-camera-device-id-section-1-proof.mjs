import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174/';
const OUT_DIR = path.resolve('screenshots/jose-camera-device-id-20260509');
fs.mkdirSync(OUT_DIR, { recursive: true });

const shots = [];
async function shot(page, name, label) {
  await page.waitForTimeout(500);
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const proof = await page.evaluate(() => {
    const visibleNode = (selector) =>
      Array.from(document.querySelectorAll(selector)).find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0 && rect.height > 0;
      }) ?? null;
    const rectForNode = (node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(rect.bottom),
      };
    };
    const photoHero = visibleNode('.photo-identify-card');
    const manualFallback = visibleNode('.early-method-row, .method-choice-grid');
    return {
      photoHeroText: photoHero?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
      manualFallbackText: manualFallback?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
      photoHeroRect: rectForNode(photoHero),
      manualFallbackRect: rectForNode(manualFallback),
      fileInputs: Array.from(document.querySelectorAll('.photo-identify-card input[type="file"], .photo-roll-choice input[type="file"]')).map((input) => ({
        accept: input.getAttribute('accept'),
        capture: input.getAttribute('capture'),
        ariaLabel: input.getAttribute('aria-label'),
      })),
      linkedDeviceStorage: localStorage.getItem('watch-sync.linkedTvDevice.v1'),
    };
  });
  shots.push({ label, file, bodyText: bodyText.slice(0, 1600), proof });
  console.log(`${label}: ${file}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
});
const page = await context.newPage();

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Alex');
await page.getByRole('button', { name: /^create a room$/i }).click();
await page.waitForTimeout(1000);
await shot(page, 'section-1-step-1-room-top.png', 'Section 1 Step 1 top card');

const setupToggle = page.locator('.drawer-toggle').filter({ hasText: 'Set up Auto Play' }).first();
await setupToggle.scrollIntoViewIfNeeded();
const setupOpen = await setupToggle.evaluate((node) => node.classList.contains('open'));
if (!setupOpen) {
  await setupToggle.click();
  await page.waitForTimeout(400);
}
await page.locator('[data-remote-step="1"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await shot(page, 'section-1-step-1-drawer.png', 'Section 1 Step 1 drawer');

fs.writeFileSync(path.join(OUT_DIR, 'section-1-proof.json'), JSON.stringify({ baseUrl: BASE_URL, shots }, null, 2));
await browser.close();
console.log(JSON.stringify({ outDir: OUT_DIR, shots: shots.map((shot) => shot.file) }, null, 2));
