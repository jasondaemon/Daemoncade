import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'metro',sound:false})));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get renderer(){return renderer},pause};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=streets28');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 const queue=await page.evaluate(async()=>{
  const {DistrictRun}=await import('/games/sinkhole-city/metro/simulation.js?v=streets28'),{cityPose,CITY_ROUTES}=await import('/games/sinkhole-city/metro/city-life.js?v=streets28');
  __qa.pause();for(const selector of['#panel','header','#hud','#map'])document.querySelector(selector).hidden=true;
  const r=new DistrictRun({free:true}),v=__qa.renderer;v.reset(r);
  const [lead,follow]=r.traffic;for(const [o,d]of[[lead,19],[follow,14]]){o.traffic.route=0;o.traffic.distance=d;o.traffic.speed=3.2;Object.assign(o,cityPose(d,CITY_ROUTES[0]));}
  r.player.x=4;r.player.z=lead.z;for(let i=0;i<360;i++){r.step(1/60,{x:0,y:0});r.events.length=0;}
  v.snapCamera(r);v.render(r,0);window.__street={r,v,lead,follow,cityPose,CITY_ROUTES,DistrictRun};
  return {waiting:[lead.traffic.waiting,follow.traffic.waiting],gap:lead.x-follow.x,lead:lead.x,hole:r.player.x,calls:v.renderer.info.render.calls,memory:{...v.renderer.info.memory},objects:r.total};
 });assert.deepEqual(queue.waiting,[true,true]);assert.ok(queue.gap>2.7);assert.equal(queue.objects,240);assert.ok(queue.calls<100);
 await page.screenshot({path:'/tmp/sinkhole-streets28-queue.png'});
 const released=await page.evaluate(()=>{const {r,v,lead}=__street;r.player.x=r.player.z=50;for(let i=0;i<120;i++){r.step(1/60,{x:0,y:0});r.events.length=0;}v.render(r,0);return lead.x;});assert.ok(released>queue.lead+3);
 const signal=await page.evaluate(()=>{
  const {v,DistrictRun,cityPose,CITY_ROUTES}=__street,r=new DistrictRun({free:true});v.reset(r);const car=r.traffic[0];car.traffic.distance=19;Object.assign(car,cityPose(19,CITY_ROUTES[0]));r.time=8;r.player.x=r.player.z=50;
  for(let i=0;i<180;i++){r.step(1/60,{x:0,y:0});r.events.length=0;}const stopped=car.x,waiting=car.traffic.waiting,pole=r.cityEncounter.signals.find(o=>o.junction.x===0&&o.junction.z===-24);
  r.player.x=pole.x;r.player.z=pole.z;for(let i=0;i<240;i++){r.step(1/60,{x:0,y:0});r.events.length=0;}
  v.snapCamera(r);v.render(r,0);__street.r=r;
  return {waiting,stopped,after:car.x,pole:pole.phase,time:r.time,memory:{...v.renderer.info.memory}};
 });assert.ok(signal.waiting);assert.equal(signal.pole,'consumed');assert.ok(signal.time<16&&signal.after>signal.stopped+1,'real pole intake releases the queue before the original next green');assert.deepEqual(signal.memory,queue.memory);
 await page.screenshot({path:'/tmp/sinkhole-streets28-signal.png'});await page.setViewportSize({width:430,height:932});await page.waitForTimeout(200);await page.screenshot({path:'/tmp/sinkhole-streets28-mobile.png'});
 const before=await page.locator('#world canvas').screenshot();await page.waitForTimeout(100);assert.deepEqual(await page.locator('#world canvas').screenshot(),before,'paused driver/junction state freezes');assert.deepEqual(errors,[]);
 console.log('STREET ENCOUNTER',{queue,signal});console.log('PASS: native-model roadblock/queue/release, actual signal intake affecting traffic, pause, phone resize and stable render resources.');
}finally{await browser.close();}
