import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.PROOF_BASE_URL || 'http://127.0.0.1:5174/';
const outDir = process.argv[2] || '/tmp/321play-remote-flow-proof';
fs.mkdirSync(outDir, { recursive: true });

async function createRoom(page) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(base, { waitUntil: 'networkidle' });
  const nameInput = page.locator('input').first();
  await nameInput.fill('Matt');
  const createButton = page.getByRole('button', { name: /create|start|host/i }).first();
  await createButton.click();
  await page.waitForSelector('.early-remote-onboarding', { timeout: 5000 });
}

async function captureState(page, label) {
  await page.screenshot({ path: `${outDir}/${label}.png`, fullPage: false });
  const data = await page.evaluate(() => {
    const rectFor = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height), text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 260) };
    };
    const visibleTexts = [...document.querySelectorAll('button, h2, h3, p, .selected-tv-hint, .empty-next-step')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight && r.width > 0 && r.height > 0;
      })
      .map((el) => el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 180));
    return {
      scrollY: Math.round(window.scrollY),
      activeEarly: [...document.querySelectorAll('.early-method-choice.active')].map((el) => el.textContent?.trim().replace(/\s+/g, ' ')),
      step2: rectFor('[data-remote-step="2"]'),
      step3: rectFor('[data-remote-step="3"]'),
      drawer: rectFor('.tv-remote-panel'),
      visibleTexts,
      linkedDeviceStorage: localStorage.getItem('watch-sync.linkedTvDevice.v1'),
    };
  });
  fs.writeFileSync(`${outDir}/${label}.json`, JSON.stringify(data, null, 2));
  return data;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await createRoom(page);
  await captureState(page, '01-initial');

  const methods = [
    ['tv-built-in', /TV app built into my TV/i],
    ['streaming-stick-box', /Streaming stick or box/i],
    ['console-cable-not-sure', /Console \/ cable \/ not sure|Game console/i],
  ];

  for (const [slug, text] of methods) {
    await page.evaluate(() => { window.scrollTo(0, 0); });
    await page.getByRole('button', { name: text }).first().click();
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: /Continue to device setup|Start guided setup/i }).first().click();
    await page.waitForTimeout(850);
    await captureState(page, `02-after-${slug}`);
  }

  await browser.close();
  console.log(outDir);
}

run().catch((error) => { console.error(error); process.exit(1); });
