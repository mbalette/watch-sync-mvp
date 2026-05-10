import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = '/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/vizio-site-pairing-live-20260510';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
await page.goto('https://app.kyrosdirect.tech/', { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Matt');
await page.locator('[data-action="create-room"]').click();
await page.locator('[data-action="pick-category-tv-builtin"]').click();
await page.locator('[data-action="select-device-vizio"]').click();
await page.getByLabel('VIZIO TV IP address').fill('10.0.0.22');
await page.screenshot({ path: path.join(outDir, '01-vizio-site-live-form.png'), fullPage: false });
await page.getByRole('button', { name: 'Start pairing' }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(outDir, '02-vizio-site-after-start.png'), fullPage: false });
const body = await page.locator('body').innerText();
await fs.writeFile(path.join(outDir, 'body.txt'), body);
console.log(JSON.stringify({ outDir, bodyExcerpt: body.slice(0, 1000) }, null, 2));
await browser.close();
