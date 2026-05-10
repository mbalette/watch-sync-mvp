import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const outDir = '/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/production-321play-deploy-20260509';
await fs.mkdir(outDir, { recursive: true });

const targets = [
  ['app-default', 'https://app.kyrosdirect.tech/'],
  ['321play-default', 'https://321play.kyrosdirect.tech/'],
  ['app-realtime', 'https://app.kyrosdirect.tech/?realtime=1'],
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const records = [];

async function shaFile(file) {
  const buf = await fs.readFile(file);
  return { sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
}

for (const [name, url] of targets) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const text = await page.locator('body').innerText().catch(() => '');
  const hash = await shaFile(file);
  records.push({ name, url, file, ...hash, bodyExcerpt: text.slice(0, 500) });
  await page.close();
}

await fs.writeFile(path.join(outDir, 'records.json'), JSON.stringify(records, null, 2));
await browser.close();
console.log(JSON.stringify({ outDir, records }, null, 2));
