import {enterWorldMenu,openCollection} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
import {DistrictRun} from '../games/sinkhole-city/metro/simulation.js';
import {sourceKey} from '../games/sinkhole-city/metro/world-dressing.js';
import {DEEP_CONTRACTS} from '../games/sinkhole-city/metro/worlds.js';
import {rotate} from '../games/sinkhole-city/metro/rim.js';
import {MARINE_TYPES,createSchools} from '../games/sinkhole-city/metro/marine.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
function drive(r){let target;for(let tick=0;tick<r.duration*60+1&&!r.done;tick++){
 const p=r.player,available=r.objects.filter(o=>r.eligible(o)),goals=available.filter(o=>r.contract.kind==='marine'?Boolean(o.swim):r.contract.kind==='giants'?o.type==='whale':r.contract.kind==='clutter'?['shell','amphora','seafan'].includes(o.type):r.contract.kind==='treasure'?['wreck','treasure'].includes(o.type):o.type==='landmark');
 if(target?.phase==='consumed')target=null;
 if(!target)target=(goals.length?goals:available).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
 const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});r.events.length=0;
}}
try{
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.addInitScript(()=>{if(!localStorage.getItem('deep-qa-seeded')){
  localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:40,score:500},'camp-cleanup':{medal:3,time:40,score:500}}}));
  localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'deep',sound:false}));localStorage.setItem('deep-qa-seeded','1');
 }});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},get world(){return world},get career(){return career},pause,resume};\nwindow.__drive='+drive.toString()+';'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=ocean10');
 try{await page.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:30000});await enterWorldMenu(page);}catch(e){console.log({errors,failed,status:await page.locator('#status').innerText()});throw e;}
 assert.equal(await page.locator('#title').innerText(),'Abyssal Bay');assert.equal(await page.locator('#arena').isDisabled(),true);
 if(await page.locator('#start').textContent()!=='Start run')console.log('DEEP STARTUP',{errors,failed,status:await page.locator('#status').innerText()});
 assert.equal(await page.locator('#start').textContent(),'Start run');
 assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('.glb')).length),0,'cold Deep Sink loads no unrelated model packs');
 const shapes=await page.evaluate(async()=>{const {sourceKey}=await import('/games/sinkhole-city/metro/world-dressing.js?v=art19');return Object.fromEntries(__qa.run.objects.map(o=>[sourceKey(o),o.shape]));});
 for(const shape of Object.values(shapes))assert.ok(Number.isFinite(shape.width+shape.height+shape.depth)&&shape.width>0&&shape.height>0&&shape.depth>0);
 for(const contract of DEEP_CONTRACTS){
  const r=new DistrictRun({contract});for(const o of r.objects)o.shape=shapes[sourceKey(o)];drive(r);assert.ok(r.won,`${contract.title} must complete with the rendered proxy dimensions`);console.log('DEEP ROUTE',contract.id,Math.round(r.time*10)/10+'s',r.eaten+' objects');
 }
 let committed=0;
 for(const type of ['wreck','reef','landmark'])for(const direction of [-1,1]){
  const r=new DistrictRun({world:'deep',free:true}),o=r.objects.find(o=>o.type===type);r.objects=[o];r.total=1;o.x=o.z=0;o.shape=shapes[sourceKey(o)];
  const p=r.player;p.radius=o.radius/.82+1.5;p.area=p.radius**2;p.x=direction*(-p.radius-o.radius-2);p.z=0;p.vx=direction*(14-p.radius*.45);
  let top=Infinity,seen=false;
  for(let tick=0;tick<600&&!r.done;tick++){
   r.step(1/60,{x:direction,y:0});r.events.length=0;
   if(o.body?.committed){const upper=Math.max(...o.body.points.map(v=>o.body.y+rotate(o.body.q,v).y));assert.ok(upper<=top+1e-7,`${type} must not pop back through the seabed`);top=upper;seen=true;}
  }
  assert.ok(seen,`${type} fixture must actually commit to falling`);assert.equal(o.phase,'consumed');assert.equal(r.eaten,1);committed++;
 }
 console.log('DEEP DRIVE-THROUGH',committed);
 for(const type of MARINE_TYPES){
  const r=new DistrictRun({world:'deep',free:true}),o=r.marine.find(o=>o.type===type);r.objects=r.marine=[o];r.total=1;r.schools=createSchools([o]);o.shape=shapes[sourceKey(o)];
  r.player.x=o.x;r.player.z=o.z;r.player.radius=Math.max(1.2,o.radius/.82+.6);r.player.area=r.player.radius**2;
  let committed=false;for(let tick=0;tick<360&&!r.done;tick++){if(o.water?.committed){committed=true;r.player.x=50;r.player.z=50;}r.step(1/60,{x:0,y:0});}
  assert.ok(committed,`${type} exercises committed water intake`);assert.equal(o.phase,'consumed');assert.equal(r.eaten,1);assert.equal(o.body,undefined);
 }
 await page.screenshot({path:'/tmp/sinkhole-deep-menu.png'});
 for(const viewport of[{width:360,height:640},{width:932,height:430}]){
  await page.setViewportSize(viewport);const b=await page.locator('#panel .card').boundingBox();assert.ok(b.y>=0&&b.y+b.height<=viewport.height,'three-world mission deck fits without scrolling');
 }
 await page.setViewportSize({width:430,height:932});
 await page.locator('#start').click();
 await page.evaluate(()=>{__qa.pause();__drive(__qa.run);__qa.resume();});
 await page.waitForFunction(()=>__qa.phase==='ended');assert.ok(await page.evaluate(()=>__qa.career.records['deep-cleanup'].medal>=1));
 assert.equal(await page.locator('#contracts button').nth(1).isDisabled(),false);
 await page.locator('#start').click();
 await page.evaluate(()=>{__qa.pause();__drive(__qa.run);__qa.resume();});
 await page.waitForFunction(()=>__qa.phase==='ended');assert.equal(await page.evaluate(()=>__qa.run.counts.treasure),6);assert.ok(await page.evaluate(()=>__qa.career.records['deep-salvage']));
 await page.locator('#free').click();await page.waitForFunction(()=>__qa.phase==='playing');
 await page.screenshot({path:'/tmp/sinkhole-deep-play.png'});
 const initial=await page.evaluate(()=>({memory:{...__qa.renderer.renderer.info.memory},calls:__qa.renderer.renderer.info.render.calls,total:__qa.run.total}));
 assert.ok(initial.calls<70,'Deep Sink stays within its draw budget');
 const hidden=await page.evaluate(()=>{const b=__qa.renderer.batches.find(b=>b.type==='treasure');return b.objects.every((o,i)=>o.phase==='buried'&&b.mesh.instanceMatrix.array[i*16]===0);});assert.ok(hidden,'buried cargo must not render as above-ground chests');
 const motion=await page.evaluate(()=>{
  __qa.pause();document.querySelector('#panel').hidden=true;const v=__qa.renderer,r=__qa.run,w=r.marine.find(o=>o.type==='whale');r.player.x=w.x;r.player.z=w.z+3;v.snapCamera(r);v.quality(true);
  r.time=1;v.render(r,1);const first=v.renderer.domElement.toDataURL();r.time=1.4;v.render(r,1);const second=v.renderer.domElement.toDataURL();
  v.reduced=true;r.time=2;v.render(r,1);const still=v.renderer.domElement.toDataURL();r.time=3;v.render(r,1);const still2=v.renderer.domElement.toDataURL();v.reduced=false;v.quality(false);v.render(r,1);
  return {different:first!==second,reducedStill:still===still2,phaseCounts:v.batches.filter(b=>b.objects[0].swim).map(b=>[b.objects.length,b.mesh.geometry.getAttribute('swimPhase').count])};
 });
 assert.ok(motion.different,'tail/fin deformation must visibly change pixels with every animal position frozen and caustics disabled');assert.ok(motion.reducedStill,'reduced motion freezes purely visual deformation');assert.ok(motion.phaseCounts.every(([objects,phases])=>objects===phases));
 await page.screenshot({path:'/tmp/sinkhole-deep-whale.png'});
 const paused=await page.evaluate(()=>({time:__qa.run.time,animals:__qa.run.marine.map(o=>[o.x,o.z,o.swimY]),animation:__qa.renderer.marineTime.value}));await page.waitForTimeout(180);
 assert.deepEqual(await page.evaluate(()=>({time:__qa.run.time,animals:__qa.run.marine.map(o=>[o.x,o.z,o.swimY]),animation:__qa.renderer.marineTime.value})),paused,'pause freezes swimming and deformation clocks');
 await page.evaluate(()=>{__qa.pause();const r=__qa.run;r.player.x=0;r.player.z=-12;__qa.renderer.snapCamera(r);__qa.renderer.render(r,0);document.querySelector('#panel').hidden=true;});
 await page.screenshot({path:'/tmp/sinkhole-deep-wreck.png'});
 await page.evaluate(()=>{
  const r=__qa.run;r.player.x=0;r.player.z=-17;r.player.radius=4.3;r.player.area=4.3**2;
  const wreck=r.objects.find(o=>o.type==='wreck');for(let i=0;i<600&&wreck.phase!=='consumed';i++)r.step(1/60,{x:0,y:0});
  __qa.renderer.snapCamera(r);__qa.renderer.render(r,0);
 });
 assert.equal(await page.evaluate(()=>__qa.run.objects.filter(o=>o.type==='treasure'&&o.phase!=='buried').length),6);
 await page.screenshot({path:'/tmp/sinkhole-deep-reveal.png'});
 const animation=await page.evaluate(()=>{const v=__qa.renderer,r=__qa.run;r.time=20;v.quality(true);v.render(r,1);const low=v.waterTime.value;v.quality(false);v.render(r,1);return {low,normal:v.waterTime.value};});assert.equal(animation.low,0);assert.equal(animation.normal,20);
 await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.evaluate(()=>__qa.world),'deep');assert.ok(await page.evaluate(()=>__qa.career.records['deep-salvage']));
 // Visit every world repeatedly, including all-authored worlds with no palette textures.
 const resources={};for(const i of[0,1,2,0,1,2,0,1,2]){
  await page.locator('#worlds button').nth(i).click();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
  const snapshot=await page.evaluate(()=>({world:__qa.world,memory:{...__qa.renderer.renderer.info.memory},water:__qa.renderer.underwater.value}));
  assert.equal(snapshot.water,i===2?1:0);if(resources[snapshot.world])assert.deepEqual(snapshot.memory,resources[snapshot.world]);else resources[snapshot.world]=snapshot.memory;
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);await page.locator('#free').click();
 assert.equal(await page.evaluate(()=>{const v=__qa.renderer,r=__qa.run;r.time=25;v.render(r,1);return v.waterTime.value;}),0,'reduced motion freezes the caustic animation');
 await page.locator('#pause').click();await page.locator('#leave').click();
 // Restoring an older save revokes inaccessible worlds without leaving a stale selected world.
 await openCollection(page);const old={app:'sinkhole-city-metro',version:1,career:{version:1,records:{cleanup:{medal:3,time:40,score:500}}}};
 await page.locator('#import-save').setInputFiles({name:'older.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await page.waitForFunction(()=>!document.querySelector('#apply-save').disabled);await page.locator('#apply-save').click();await page.locator('#close-locker').click();
 await page.waitForFunction(()=>__qa.world==='metro'&&!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#worlds button').nth(2).isDisabled(),true);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('DEEP',initial,'WORLD RESOURCES',resources);console.log('PASS: third-world progression, actual-geometry routes, buried-cargo reveal, retained saves, quality scaling and bounded world-switch resources.');
}finally{await browser.close();}
