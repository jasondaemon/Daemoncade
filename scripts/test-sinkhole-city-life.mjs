import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false})));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},pause};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=life21');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));await page.locator('#free').click();
 const stats=await page.evaluate(()=>{
  __qa.pause();const r=__qa.run,v=__qa.renderer;r.player.x=45;r.player.z=45;
  const before=r.people.map(o=>[o.x,o.z]),cars=r.traffic.map(o=>[o.x,o.z]);for(let i=0;i<180;i++)r.step(1/60,{x:0,y:0});v.render(r,0);
  const movingPeople=r.people.filter((o,i)=>Math.hypot(o.x-before[i][0],o.z-before[i][1])>.1).length,movingCars=r.traffic.filter((o,i)=>Math.hypot(o.x-cars[i][0],o.z-cars[i][1])>.1).length,batches=v.batches.filter(b=>b.type==='person');
  return {movingPeople,movingCars,people:r.people.length,cars:r.traffic.length,personBatches:batches.length,limbs:[...new Set(batches[0].mesh.geometry.attributes.walkLimb.array)].sort(),calls:v.renderer.info.render.calls,time:r.time};
 });assert.equal(stats.people,24);assert.equal(stats.cars,16);assert.equal(stats.personBatches,3);assert.ok(stats.movingPeople>=20);assert.ok(stats.movingCars>=8);assert.deepEqual(stats.limbs,[-1,-2,0,1,2]);assert.ok(stats.calls<100);
 await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>__qa.run.time),stats.time);
 await page.evaluate(()=>{const r=__qa.run,o=r.people[0];r.player.x=o.x-.1;r.player.z=o.z;for(let i=0;i<60;i++)r.step(1/60,{x:0,y:0});});
 assert.ok(await page.evaluate(()=>__qa.run.people[0].walker.pace>1.8||__qa.run.people[0].phase!=='idle'));
 // Isolate a real GPU-rigged person, keeping all transforms/camera fixed except gait.
 const frames=[];
 for(const phase of[0,Math.PI/2,Math.PI*1.5]){
  await page.evaluate(phase=>{
   document.querySelector('#panel').hidden=true;document.querySelector('header').hidden=true;document.querySelector('#hud').hidden=document.querySelector('#map').hidden=true;
   const r=__qa.run,v=__qa.renderer,o=r.people.find(o=>o.phase==='idle'&&!o.body);o.walker.gait=phase;o.walker.pace=1;v.render(r,0);
   for(const b of v.batches)b.mesh.visible=b.type==='person'&&b.objects.includes(o);v.ground.visible=v.well.visible=false;v.debris.visible=false;
   v.camera.position.set(o.x+2.2,2.4,o.z+3);v.camera.lookAt(o.x,.6,o.z);v.renderer.render(v.scene,v.camera);
  },phase);
  frames.push(await page.locator('#world canvas').screenshot({path:`/tmp/sinkhole-gait-${frames.length}.png`}));
 }
 assert.ok(!frames[0].equals(frames[1])&&!frames[1].equals(frames[2]),'opposite gait poses must actually deform rendered pixels');
 assert.deepEqual(errors,[]);console.log('CITY LIFE',stats);console.log('PASS: live traffic and sidewalk movement, panic, paused simulation, three batched rigs, opposite rendered gait poses, shadow shader compilation and mobile draw budget.');
}finally{await browser.close();}
