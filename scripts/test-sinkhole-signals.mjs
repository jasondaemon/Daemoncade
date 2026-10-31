import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:640},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false})));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=identity23');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));await page.locator('#free').click();
 const stats=await page.evaluate(()=>{__qa.pause();const r=__qa.run,v=__qa.renderer,b=v.batches.find(b=>b.objects[0].signal);return {signals:r.objects.filter(o=>o.signal).length,batches:v.batches.filter(b=>b.objects[0].signal).length,lenses:[...new Set(b.mesh.geometry.attributes.signalLens.array)].sort(),axes:[...new Set(b.mesh.geometry.attributes.signalAxis.array)].sort(),time:r.time};});
 assert.equal(stats.signals,5);assert.equal(stats.batches,1);assert.deepEqual(stats.lenses,[0,1,2,3]);assert.deepEqual(stats.axes,[0,1]);
 const frames=[];for(const time of[0,6.5,7.5,8.5,14.5,15.5]){
  await page.evaluate(time=>{
   for(const id of['panel','hud','map'])document.getElementById(id).hidden=true;document.querySelector('header').hidden=true;
   const r=__qa.run,v=__qa.renderer,o=r.objects.find(o=>o.signal);r.time=time;v.render(r,0);
   for(const b of v.batches)b.mesh.visible=Boolean(b.objects[0].signal);v.ground.visible=v.well.visible=v.debris.visible=false;
   const y=o.shape.height*.78;v.camera.position.set(o.x+2.2,y+.8,o.z+3);v.camera.lookAt(o.x,y,o.z);v.renderer.render(v.scene,v.camera);
  },time);
  frames.push(await page.locator('#world canvas').screenshot({path:`/tmp/sinkhole-signals-${time}.png`}));
 }
 assert.ok(!frames[0].equals(frames[1])&&!frames[0].equals(frames[3]),'amber and opposite green phases change real rendered lamps');assert.ok(frames[2].equals(frames[5]),'both clearance phases render exactly the same all-red lamps');
 const before=await page.evaluate(()=>__qa.renderer.signalTime.value);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__qa.renderer.signalTime.value),before);assert.equal(await page.evaluate(()=>__qa.renderer.marineTime.value),0);assert.deepEqual(errors,[]);
 console.log('SIGNALS',stats);console.log('PASS: five collectible dual-axis signals in one batch, real rendered green/amber/all-red phases, opposite green, shared paused clock and clean shader compilation.');
}finally{await browser.close();}
