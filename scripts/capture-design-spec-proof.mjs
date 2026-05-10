import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'screenshots/design-spec-20260509/landing-mobile.png' });
await page.getByRole('button', { name: /create room/i }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: 'screenshots/design-spec-20260509/room-mobile.png', fullPage: false });
const metrics = await page.evaluate(() => {
  const offenders = [...document.querySelectorAll('body *')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, cls: el.className?.toString?.() ?? '', text: (el.textContent ?? '').trim().slice(0, 80), left: r.left, right: r.right, width: r.width };
    })
    .filter((x) => x.width > 0 && (x.left < -1 || x.right > window.innerWidth + 1));
  return {
    innerWidth: window.innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    offenders,
    roomText: document.body.innerText.slice(0, 1600),
  };
});
console.log(JSON.stringify(metrics, null, 2));
await browser.close();
