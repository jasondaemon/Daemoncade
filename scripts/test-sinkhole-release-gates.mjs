import assert from 'node:assert/strict';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false,music:false,ambience:false})));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
 let hudPaints=0;const realHUD=paintHUD;paintHUD=()=>{hudPaints++;return realHUD();};
 window.__qa={get renderer(){return renderer},get run(){return run},get phase(){return phase},measureHUD(){
  pause();run=new DistrictRun({free:true,seed:1});renderer.reset(run);clock.reset();pacer.setRate(60);hudTime=-1;phase='playing';
  const draw=renderer.render,before=hudPaints;renderer.render=()=>{};
  try{for(let i=0;i<=240;i++){frame(i*1000/120);cancelAnimationFrame(raf);raf=0;}}
  finally{renderer.render=draw;pause();}return {paints:hudPaints-before,time:run.time};
 }};`});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=qualification52`);
 await page.waitForFunction(()=>document.querySelector('#title-play').textContent==='Start game').catch(async error=>{console.log('BOOT DIAGNOSTIC',errors,await page.locator('#title-loading').textContent());throw error;});
 assert.deepEqual(await page.evaluate(()=>({previews:__qa.renderer.rimPreviews.size,styles:__qa.renderer.rimStyles.size})),{previews:0,styles:1});
 assert.equal(await page.locator('#frame-rate').textContent(),'30 FPS','new touch installs default to sustained rendering');
 await page.locator('#title-play').click();assert.equal(await page.evaluate(()=>__qa.renderer.rimPreviews.size),0);
 await page.evaluate(()=>{window.previewOriginal=__qa.renderer.rimPreview;window.failedPreviews=0;__qa.renderer.rimPreview=()=>{failedPreviews++;throw Error('Injected optional thumbnail failure');};});
 await page.locator('#customize').click();await page.waitForFunction(()=>failedPreviews===11);
 assert.equal(await page.locator('#rims button').count(),11);assert.equal(await page.locator('#rims img').count(),0);await page.locator('#close-locker').click();
 await page.evaluate(()=>{__qa.renderer.rimPreview=previewOriginal;document.querySelector('#customize').click();document.querySelector('#close-locker').click();});
 await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__qa.renderer.rimPreviews.size),0,'closing cancels optional GPU work');
 await page.evaluate(()=>{
  window.previewFrames=[];window.previewFrame=0;window.trackFrames=true;
  const tick=()=>{previewFrame++;if(trackFrames)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  __qa.renderer.rimPreview=function(...args){previewFrames.push(previewFrame);return previewOriginal.apply(this,args);};
 });
 await page.locator('#customize').click();await page.waitForFunction(()=>[...document.querySelectorAll('#rims img')].length===11&&[...document.querySelectorAll('#rims img')].every(i=>i.complete&&i.naturalWidth===128));
 const frames=await page.evaluate(()=>{trackFrames=false;return previewFrames;});assert.equal(frames.length,11);assert.equal(new Set(frames).size,11,'at most one missing preview is rendered per browser frame');
 await page.locator('#close-locker').click();await page.locator('#free').click();assert.equal(await page.evaluate(()=>__qa.phase),'playing');
 const hud=await page.evaluate(()=>__qa.measureHUD());assert.ok(Math.abs(hud.time-2)<1e-8);assert.ok(hud.paints>=18&&hud.paints<=21,JSON.stringify(hud));
 await page.locator('#resume').click();await page.evaluate(()=>window.postMessage({type:'daemoncade:suspend'},location.origin));await page.waitForFunction(()=>__qa.phase==='paused');
 assert.deepEqual(errors,[]);console.log('PASS: zero boot/menu previews, injected cosmetic failure cannot block play, cancelled closed-menu work, one preview/frame, 10 Hz HUD with unchanged simulation and app suspension.',hud);
}finally{await browser.close();}
