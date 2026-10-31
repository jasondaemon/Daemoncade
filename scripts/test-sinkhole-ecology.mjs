import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1180,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:40,score:500},'camp-cleanup':{medal:3,time:40,score:500}}}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'deep',sound:false}));});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=reef27');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);await page.locator('#free').click();
 const stats=await page.evaluate(()=>{
  __qa.pause();document.querySelector('#panel').hidden=true;const r=__qa.run,v=__qa.renderer;r.player.x=r.player.z=50;
  for(let i=0;i<90*60;i++){r.step(1/60,{x:0,y:0});r.events.length=0;}
  for(let i=0;i<24*60&&!r.marine.some(o=>o.type==='dolphin'&&Math.abs(Math.sin(o.swimRoll||0))>.7);i++){r.step(1/60,{x:0,y:0});r.events.length=0;}
  const whale=r.marine.find(o=>o.type==='whale');r.player.x=whale.x;r.player.z=whale.z+6;v.snapCamera(r);v.growthCamera.span=30;v.render(r,0);
  const batch=v.batches.find(b=>b.type==='dolphin'),normal=Array.from(batch.mesh.instanceMatrix.array);v.reduced=true;v.render(r,0);const reduced=Array.from(batch.mesh.instanceMatrix.array);v.reduced=false;v.render(r,0);
  const pivots=batch.objects.map((o,i)=>{const h=o.shape.height*.28,n=i*16;return [4,5,6].map((k,j)=>Math.abs(normal[n+k]*h+normal[n+12+j]-reduced[n+k]*h-reduced[n+12+j]));});
  return {normal,reduced,pivots,animals:r.marine.length,marineEaten:r.counts.marine,groups:[...r.schools.values()].map(g=>({type:g.type,behavior:g.behavior,tightness:g.tightness,leader:g.leader})),calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,memory:{...v.renderer.info.memory},time:r.time};
 });
 assert.equal(stats.animals,97);assert.equal(stats.marineEaten,0);assert.notDeepEqual(stats.normal,stats.reduced,'cosmetic rolling is present in native instance transforms and suppressed for reduced motion');
 assert.ok(stats.pivots.flat().every(d=>d<.00001),'rolls preserve the torso axis instead of orbiting the ground origin');
 assert.equal(stats.groups.filter(g=>g.behavior==='migrating').length,2);assert.equal(stats.groups.filter(g=>g.behavior==='escorting').length,4);assert.equal(stats.groups.filter(g=>g.behavior==='hunting').length,3);assert.ok(stats.groups.some(g=>g.behavior==='baitball'));assert.ok(stats.calls<=50&&stats.triangles<650000);
 await page.screenshot({path:'/tmp/sinkhole-reef27-pod.png'});
 const canvas=page.locator('#world canvas'),frozen=await canvas.screenshot();await page.waitForTimeout(150);assert.deepEqual(await canvas.screenshot(),frozen,'paused ecology and rolls freeze');
 await page.setViewportSize({width:430,height:932});await page.waitForTimeout(200);await page.screenshot({path:'/tmp/sinkhole-reef27-mobile.png'});
 await page.evaluate(()=>{__qa.renderer.quality(true);__qa.renderer.render(__qa.run,0);});assert.deepEqual(await page.evaluate(()=>({...__qa.renderer.renderer.info.memory})),stats.memory);assert.deepEqual(errors,[]);
 console.log('ECOLOGY',{animals:stats.animals,calls:stats.calls,triangles:stats.triangles,memory:stats.memory,time:stats.time});console.log('PASS: real migrating/escort/hunting groups, native rolling transforms, pause/reduced motion, phone resize and unchanged draw/resource budgets.');
}finally{await browser.close();}
