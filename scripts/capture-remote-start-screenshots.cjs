const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const outDir = path.join(__dirname, '..', 'docs', 'screenshots', 'roku-internal-beta');
fs.mkdirSync(outDir, { recursive: true });
const base = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4173';
const config = (kill=false) => ({ remoteStartPublicEnabled:false, remoteStartRuntimeBetaAudience:'internal', remoteStartKillSwitchEnabled:kill, rokuRuntimeBetaEnabled:true, vizioRuntimeBetaEnabled:false, lgRuntimeBetaEnabled:false, samsungRuntimeBetaEnabled:false, sonyRuntimeBetaEnabled:false });
async function shot(page, name) { await page.screenshot({ path: path.join(outDir, name), fullPage: true }); }
async function clickFirst(page, label) { const loc = page.getByText(label, { exact:false }).first(); if (await loc.count().catch(()=>0)) { await loc.click({timeout:1500}); return true; } return false; }
async function setConfigRoute(page, routeConfig) {
  await page.unroute('**/api/remote-start-runtime-config').catch(()=>{});
  await page.route('**/api/remote-start-runtime-config', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(routeConfig) }));
}
async function createRoom(page, routeConfig=config(false)) {
  await setConfigRoute(page, routeConfig);
  await page.goto(base + '/?remoteStartBeta=internal', { waitUntil:'networkidle' });
  await clickFirst(page, 'Create room');
  await page.waitForTimeout(300);
}
async function chooseRoku(page) {
  await page.getByText('Streaming stick or box', { exact:false }).first().click();
  await page.waitForTimeout(200);
  await page.getByText('Roku / Roku TV', { exact:false }).first().click();
  await page.waitForTimeout(300);
}
async function main() {
  const browser = await chromium.launch({ headless:true });
  const context = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const page = await context.newPage();
  await setConfigRoute(page, config(false));
  await page.goto(base + '/', { waitUntil:'networkidle' }); await shot(page, '01-public-no-beta.png');
  await createRoom(page); await shot(page, '02-internal-roku-beta-entry.png');
  await chooseRoku(page); await shot(page, '03-roku-beta-device-list.png');
  await shot(page, '04-roku-beta-setup.png');
  await clickFirst(page, 'Check Roku'); await page.waitForTimeout(500); await shot(page, '05-test-play-failed.png');
  await page.evaluate(() => localStorage.setItem('watch-sync.linkedTvDevice.v1', JSON.stringify({ platform:'roku', label:'Roku / Roku TV', host:'192.168.1.2', helperUrl:'http://127.0.0.1:8790', useRemoteStartAtGo:false })));
  await createRoom(page); await chooseRoku(page); await shot(page, '06-confirm-did-video-start.png');
  await page.evaluate(() => localStorage.setItem('watch-sync.linkedTvDevice.v1', JSON.stringify({ platform:'roku', label:'Roku / Roku TV', host:'192.168.1.2', helperUrl:'http://127.0.0.1:8790', lastTestedAt:new Date().toISOString(), useRemoteStartAtGo:true })));
  await createRoom(page); await chooseRoku(page); await shot(page, '07-ready-after-confirmation.png');
  await clickFirst(page, 'Try solo countdown'); await page.waitForTimeout(1200); await shot(page, '08-post-go-outcome.png');
  await page.goto(base + '/?remoteStartBeta=off', { waitUntil:'networkidle' }); await clickFirst(page, 'Create room'); await page.waitForTimeout(300); await shot(page, '09-manual-play.png');
  await createRoom(page, config(true)); await shot(page, '10-kill-switch-on.png');
  await browser.close(); console.log(outDir);
}
main().catch((err)=>{ console.error(err); process.exit(1); });
