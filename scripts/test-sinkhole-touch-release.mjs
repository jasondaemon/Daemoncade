import assert from 'node:assert/strict';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false,music:false,ambience:false})));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get phase(){return phase},get run(){return run},get input(){return input},get pointer(){return pointer}};'});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=qualification52`);await page.waitForFunction(()=>document.querySelector('#title-play').textContent==='Start game');await page.locator('#title-play').click();await page.locator('#free').click();
 const cdp=await page.context().newCDPSession(page),touch=async(type,x=180,y=500)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:11,radiusX:5,radiusY:5,force:1}]});
 const released=async()=>{await page.waitForFunction(()=>__qa.input.x===0&&__qa.input.y===0,{},{timeout:1000});assert.equal(await page.evaluate(()=>__qa.pointer),null);assert.ok(await page.locator('#stick').isHidden());};
 await touch('touchStart');assert.deepEqual(await page.evaluate(()=>({...__qa.input})),{x:0,y:0});assert.ok(await page.locator('#stick').isVisible());
 const before=await page.evaluate(()=>__qa.run.player.x);await touch('touchMove',250,500);await page.waitForFunction(before=>__qa.run.player.x>before+.15,before);assert.ok(await page.evaluate(()=>__qa.input.x>.9));
 await touch('touchEnd');await released();assert.equal(await page.evaluate(()=>scrollY),0);
 await touch('touchStart');await touch('touchMove',150,530);await page.setViewportSize({width:844,height:390});await released();await touch('touchEnd');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await touch('touchStart');await touch('touchMove',220,510);await touch('touchCancel');await released();
 await touch('touchStart');await touch('touchMove',220,510);await page.keyboard.press('Escape');await released();assert.equal(await page.evaluate(()=>__qa.phase),'paused');await touch('touchEnd');
 await page.locator('#resume').click();await touch('touchStart');await touch('touchMove',230,500);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));await released();assert.equal(await page.evaluate(()=>__qa.phase),'paused');
 const time=await page.evaluate(()=>__qa.run.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__qa.run.time),time);assert.ok(await page.evaluate(()=>Boolean(localStorage.getItem('sinkhole.metro.run.v1'))));
 assert.deepEqual(errors,[]);console.log('PASS: native emulated touch steering, anchored dead center, lift/cancel/resize/Escape/pagehide release, no scroll, silent paused checkpoint and no automatic resume. Not physical-device qualification.');
}finally{await browser.close();}
