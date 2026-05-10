import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const repo = process.cwd();
const outDir = path.join(repo, 'screenshots', 'vizio-site-local-bridge-20260510');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const page = await context.newPage();

async function probe(originUrl) {
  await page.goto(originUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  return page.evaluate(async () => {
    try {
      const response = await fetch('http://127.0.0.1:8790/health', { method: 'GET' });
      const body = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, bodyOk: body?.ok === true, error: null };
    } catch (error) {
      return { ok: false, status: null, bodyOk: false, error: String(error?.message ?? error) };
    }
  });
}

const productionProbe = await probe('https://app.kyrosdirect.tech/');
const localProbe = await probe('http://127.0.0.1:5173/');

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 45000 });
await page.fill('input[aria-label="Your name"]', 'Matt');
await page.click('button:has-text("Create a room")');
await page.click('button:has-text("TV app built into my TV")');
await page.click('button:has-text("VIZIO TV")');
await page.fill('#vizio-host-input', '10.0.0.22');
await page.screenshot({ path: path.join(outDir, '01-local-vizio-setup.png'), fullPage: true });
const setupText = await page.locator('body').innerText();
const setupMetrics = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  docScrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
  hasLocalSetupCopy: document.body.innerText.includes('Pair from local setup'),
  hasHttpsBlockCopy: document.body.innerText.includes('Public HTTPS browsers can block TV pairing'),
  hasSendTestPlay: document.body.innerText.includes('Send Test Play'),
  hasManualFallback: document.body.innerText.includes('Use manual countdown'),
}));

const result = { productionProbe, localProbe, setupMetrics, setupTextIncludes: {
  vizioTv: setupText.includes('VIZIO TV'),
  findMyVizio: setupText.includes('Find my VIZIO TV'),
  startPairing: setupText.includes('Start pairing'),
  codeCopy: setupText.includes('Enter the code from your TV'),
  sendTestPlay: setupText.includes('Send Test Play'),
}, screenshots: [path.join(outDir, '01-local-vizio-setup.png')] };
await fs.writeFile(path.join(outDir, 'browser-proof.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
