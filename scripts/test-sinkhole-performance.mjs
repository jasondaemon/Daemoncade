import {enterWorldMenu,clickOption} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{if(!localStorage.getItem('sinkhole.metro.preferences.v1'))localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false}));});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+`
 window.__qa={get phase(){return phase},get run(){return run},get pacer(){return pacer},pause,
 measure(rate,native,seconds){
  pause();cancelAnimationFrame(raf);raf=0;run=new DistrictRun({free:true});renderer.reset(run);clock.reset();pacer.setRate(rate);mapTime=-1;phase='playing';input.x=.4;input.y=-.2;
  const render=renderer.render;let draws=0;renderer.render=()=>{draws++};
  try{for(let i=0;i<=native*seconds;i++){frame(i*1000/native);cancelAnimationFrame(raf);raf=0;}}
  finally{renderer.render=render;pause();renderer.render(run,0);}
  return {draws,time:run.time,player:{...run.player},score:run.score,eaten:run.eaten,counts:{...run.counts},candidates:run.nearby.query(run.player).length,total:run.objects.length};
 }};`});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=perf17`);await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));
 for(const viewport of[{width:360,height:640},{width:932,height:430},{width:430,height:932}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>{const r=document.querySelector('#panel .card').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;}),'four-button settings row fits the mission deck');
  await page.locator('#settings-open').click();const size=await page.locator('#frame-rate').boundingBox();assert.ok(size.height>=44);await page.locator('#close-options').click();
 }
 assert.equal(await page.locator('#frame-rate').innerText(),'30 FPS');await clickOption(page,'frame-rate');assert.equal(await page.locator('#frame-rate').innerText(),'60 FPS');await clickOption(page,'frame-rate');assert.equal(await page.locator('#frame-rate').innerText(),'30 FPS');
 await clickOption(page,'quality');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.preferences.v1')).fps),30);
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#frame-rate').innerText(),'30 FPS');assert.equal(await page.locator('#quality').getAttribute('aria-pressed'),'true');
 const results=[];for(const [rate,native]of[[30,120],[60,120],[30,30],[60,60]]){
  const result=await page.evaluate(([rate,native])=>__qa.measure(rate,native,3),[rate,native]);results.push({rate,native,...result});assert.ok(Math.abs(result.draws-rate*3-1)<=1);assert.ok(Math.abs(result.time-3)<1e-8);assert.ok(result.candidates<result.total/2);
 }
 const gameplay=r=>({time:r.time,player:r.player,score:r.score,eaten:r.eaten,counts:r.counts});for(const r of results.slice(1))assert.deepEqual(gameplay(r),gameplay(results[0]));
 assert.equal(await page.locator('#target-pin,#contact-hint').count(),0);assert.equal(await page.locator('#notice').isHidden(),true);
 await page.locator('#resume').click();await page.waitForFunction(()=>__qa.phase==='playing');await page.evaluate(()=>window.postMessage({type:'daemoncade:suspend'},location.origin));await page.waitForFunction(()=>__qa.phase==='paused');const time=await page.evaluate(()=>__qa.run.time);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>__qa.run.time),time);
 assert.deepEqual(errors,[]);console.log('PERFORMANCE',JSON.stringify(results));console.log('PASS: main-loop render cap, unchanged 60 Hz gameplay, nearby candidate reduction, independent/persisted FPS/effects settings, mobile menu fit, quiet play and app suspension.');
}finally{await browser.close();}
