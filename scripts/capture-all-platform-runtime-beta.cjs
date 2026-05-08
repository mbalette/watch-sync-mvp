const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const outDir = path.join(__dirname, '..', 'docs', 'screenshots', 'all-platform-runtime-beta');
fs.mkdirSync(outDir, { recursive: true });
const base = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4173';
async function shot(page, name) { await page.screenshot({ path: path.join(outDir, name), fullPage: true }); }
async function routeConfig(page, kill=false) {
  await page.unroute('**/api/remote-start-runtime-config').catch(()=>{});
  await page.route('**/api/remote-start-runtime-config', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ remoteStartPublicEnabled:false, remoteStartRuntimeBetaAudience:'internal', remoteStartKillSwitchEnabled:kill, rokuRuntimeBetaEnabled:true, vizioRuntimeBetaEnabled:false, lgRuntimeBetaEnabled:false, samsungRuntimeBetaEnabled:false, sonyRuntimeBetaEnabled:false }) }));
}
async function clickFirst(page, text) { const loc=page.getByText(text,{exact:false}).first(); if(await loc.count().catch(()=>0)){ await loc.click({timeout:1500}).catch(()=>{}); return true;} return false; }
async function room(page, url='/?remoteStartBeta=internal', kill=false) { await routeConfig(page, kill); await page.goto(base+url,{waitUntil:'networkidle'}); await clickFirst(page,'Create room'); await page.waitForTimeout(300); }
async function choose(page, methodText, deviceText) { await page.getByText(methodText,{exact:false}).first().click().catch(()=>{}); await page.waitForTimeout(150); await page.getByText(deviceText,{exact:false}).first().click().catch(()=>{}); await page.waitForTimeout(250); }
async function main(){
 const browser=await chromium.launch({headless:true}); const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}); const page=await context.newPage();
 await routeConfig(page); await page.goto(base+'/',{waitUntil:'networkidle'}); await shot(page,'01-public-no-beta.png');
 await room(page); await shot(page,'02-internal-roku-beta.png'); await choose(page,'Streaming stick or box','Roku / Roku TV'); await shot(page,'03-roku-setup.png');
 await page.goto(base+'/?remoteStartBeta=off',{waitUntil:'networkidle'}); await clickFirst(page,'Create room'); await page.waitForTimeout(200); await shot(page,'04-manual-play.png');
 await room(page,'/?remoteStartBeta=internal',true); await shot(page,'05-kill-switch-on.png');
 for (const [name,label] of [['vizio','VIZIO TV'],['lg','LG TV'],['sony','Sony'],['samsung','Samsung']]) { await room(page,`/?remoteStartBeta=internal&qaBetaPlatform=${name}`); await choose(page,'TV app built into my TV',label); await shot(page,`0${['vizio','lg','sony','samsung'].indexOf(name)+6}-${name}-beta-qa-only.png`); }
 await page.evaluate(()=>localStorage.setItem('watch-sync.linkedTvDevice.v1', JSON.stringify({platform:'roku',label:'Roku / Roku TV',host:'192.168.1.2',helperUrl:'http://127.0.0.1:8790',useRemoteStartAtGo:false})));
 await room(page); await choose(page,'Streaming stick or box','Roku / Roku TV'); await shot(page,'10-confirm-did-video-start.png');
 await page.evaluate(()=>localStorage.setItem('watch-sync.linkedTvDevice.v1', JSON.stringify({platform:'roku',label:'Roku / Roku TV',host:'192.168.1.2',helperUrl:'http://127.0.0.1:8790',lastTestedAt:new Date().toISOString(),useRemoteStartAtGo:true})));
 await room(page); await choose(page,'Streaming stick or box','Roku / Roku TV'); await shot(page,'11-ready-after-confirmation.png');
 await clickFirst(page,'Try solo countdown'); await page.waitForTimeout(1200); await shot(page,'12-post-go-outcome.png');
 await browser.close(); console.log(outDir);
}
main().catch(e=>{ console.error(e); process.exit(1); });
