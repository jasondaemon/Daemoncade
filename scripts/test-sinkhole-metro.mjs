import {enterWorldMenu,openCollection} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
import {DistrictRun} from '../games/sinkhole-city/metro/simulation.js';
import {rotate} from '../games/sinkhole-city/metro/rim.js';
import {CONTRACTS} from '../games/sinkhole-city/metro/career.js';
import {ArenaRun} from '../games/sinkhole-city/metro/arena.js';
import {sourceKey} from '../games/sinkhole-city/metro/world-dressing.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:((await response.text()).replaceAll('freshSeed()', '0'))+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},get sounds(){return voices.size},audio,feedback,input,pause,resume,clock,frame};'});});
 await page.goto(process.env.SINKHOLE_METRO_URL||'http://127.0.0.1:4197/games/sinkhole-city/metro/');try{await page.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:30000});await enterWorldMenu(page);}catch(error){console.log('STARTUP FAILURE',{errors,failed,status:await page.locator('#status').innerText()});throw error;}
 assert.equal(await page.locator('#start').textContent(),'Start run');
 for(const viewport of[{width:360,height:640},{width:932,height:430}]){
  await page.setViewportSize(viewport);const card=await page.locator('#panel .card').boundingBox();assert.ok(card.y>=0&&card.y+card.height<=viewport.height,`mission deck must fit ${viewport.width}×${viewport.height}`);
 }
 await page.setViewportSize({width:430,height:932});
 const idle=await page.evaluate(()=>{const v=__qa.renderer,r=__qa.run;v.render(r,1/60);const writes=v.transformsWritten,memory=v.renderer.info.memory.geometries;for(let i=0;i<4;i++){v.reset(r);v.render(r,1/60);}return {writes,memory,after:v.renderer.info.memory.geometries};});
 assert.equal(idle.writes,40,'only the 16 traffic cars and 24 pedestrians should rewrite idle transforms');assert.ok(idle.after<=idle.memory+1,'reset must release previous batch geometry');
 const shapes=await page.evaluate(async()=>{const {sourceKey}=await import('/games/sinkhole-city/metro/world-dressing.js?v=art19');return Object.fromEntries(__qa.run.objects.map(o=>[sourceKey(o),o.shape]));});
 const arenaShapes=await page.evaluate(async()=>{const {ArenaRun}=await import('/games/sinkhole-city/metro/arena.js');const r=new ArenaRun();__qa.renderer.reset(r);const result=Object.fromEntries(r.objects.map(o=>[`${o.type}:${o.variant||''}`,o.shape]));__qa.renderer.reset(__qa.run);__qa.renderer.render(__qa.run,0);return result;});
 const competition=new ArenaRun({difficulty:'easy'});for(const o of competition.objects){const {width,depth,height}=arenaShapes[`${o.type}:${o.variant||''}`];o.shape={width,depth,height};}let raceTarget;
 for(let tick=0;tick<7201&&!competition.done;tick++){
  const p=competition.player;if(raceTarget&&(raceTarget.phase==='consumed'||raceTarget.owner&&raceTarget.owner!=='you'))raceTarget=null;
  if(!raceTarget)raceTarget=competition.objects.filter(o=>competition.eligible(o)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=raceTarget?raceTarget.x-p.x:0,y=raceTarget?raceTarget.z-p.z:0,d=Math.hypot(x,y)||1;competition.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});competition.events.length=0;
 }
 assert.ok(competition.won,'a normal collection route must be able to win Easy using actual model dimensions');console.log('ARENA ROUTE',competition.standings().map(r=>({name:r.name,score:r.score,rank:r.rank})));
 for(const contract of CONTRACTS){
  const r=new DistrictRun({contract});for(const o of r.objects)o.shape=shapes[sourceKey(o)];let target;
  for(let tick=0;tick<contract.duration*60+1&&!r.done;tick++){
   const p=r.player,eligible=r.objects.filter(o=>r.eligible(o)),objectives=eligible.filter(o=>contract.kind==='vehicles'?['car','van'].includes(o.type):contract.kind==='landmark'?o.type==='landmark':['cone','bin','hydrant','bench','lamp'].includes(o.type));
   if(target?.phase==='consumed')target=null;
   if(!target)target=(objectives.length?objectives:eligible).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
   const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});r.events.length=0;
  }
  assert.ok(r.won,`${contract.title} must be reachable using actual model shapes`);console.log('CONTRACT',contract.id,Math.round(r.time*10)/10+'s');
 }
 let committedPasses=0;
 for(const type of ['car','building','landmark'])for(const offset of [0,.25,.5])for(const direction of [-1,1]){
  const moving=new DistrictRun({free:true}),o=moving.objects.find(o=>o.type===type);moving.objects=[o];moving.total=1;o.x=o.z=0;o.shape=shapes[sourceKey(o)];
  const p=moving.player;p.radius=o.radius/.82+1.5;p.area=p.radius**2;p.x=direction*(-p.radius-o.radius-2);p.z=p.radius*offset;p.vx=direction*(14-p.radius*.45);
  let lastTop=Infinity,seen=false;
  for(let tick=0;tick<600&&!moving.done;tick++){
   moving.step(1/60,{x:direction,y:0});moving.events.length=0;
   if(o.body?.committed){const top=Math.max(...o.body.points.map(point=>o.body.y+rotate(o.body.q,point).y));assert.ok(top<=lastTop+1e-7,`${type}: deep fall rose after a moving-hole contact`);lastTop=top;seen=true;}
  }
  if(seen){committedPasses++;assert.equal(moving.eaten,1);assert.equal(o.phase,'consumed');}
 }
 assert.ok(committedPasses>=6,'exercise committed drive-through falls with actual model sizes');
 console.log('ACTUAL MODEL DRIVE-THROUGH',{committedPasses});
 const route=new DistrictRun();for(const o of route.objects)o.shape=shapes[sourceKey(o)];
 let target;
 for(let tick=0;tick<120*60&&!route.done;tick++){
  let best=null,distance=Infinity,p=route.player;
  for(const o of route.objects){if(!route.eligible(o))continue;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<distance){best=o;distance=d;}}
  const tower=route.objects.find(o=>o.type==='landmark');if(route.eligible(tower))best=tower;
  if(target?.phase==='consumed')target=null;if(!target||best===tower)target=best;
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;route.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});route.events.length=0;
 }
 console.log('ACTUAL MODEL ROUTE',{won:route.won,time:route.time,eaten:route.eaten,radius:route.player.radius,tower:route.objects.find(o=>o.type==='landmark').phase});
 assert.ok(route.won,'landmark must remain reachable with actual model contact dimensions');
 await page.screenshot({path:'/tmp/sinkhole-metro-menu.png'});await page.locator('#start').click();
 await page.waitForTimeout(250);await page.screenshot({path:'/tmp/sinkhole-metro-start.png'});
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(800);await page.keyboard.up('ArrowUp');
 assert.ok(await page.evaluate(()=>__qa.run.player.z<32));
 const traffic=await page.evaluate(()=>{const r=__qa.run,o=r.traffic[0];return {distance:o.traffic.distance,shape:o.shape};});
 assert.ok(traffic.distance>.1,'traffic advances during actual browser play');assert.ok(traffic.shape.height>0);
 await page.evaluate(()=>{
  const r=__qa.run,o=r.objects.find(o=>o.type==='cone');r.player.x=o.x;r.player.z=o.z;r.player.vx=r.player.vz=0;
  for(let i=0;i<120&&o.phase!=='consumed';i++)r.step(1/60,{x:0,y:0});
 });
 await page.locator('#pickups span:not([hidden])').first().waitFor({state:'visible'});
 assert.equal(await page.locator('#pickups span').count(),8,'feedback uses a fixed pool');
 assert.ok((await page.locator('#pickups span:not([hidden])').first().innerText()).startsWith('+'));
 await page.screenshot({path:'/tmp/sinkhole-metro-traffic.png'});
 const soundCheck=await page.evaluate(()=>{const a=__qa.audio;for(let i=0;i<30;i++)a.play({type:'car',radius:1.35});return {state:a.context.state,count:a.voices.size};});
 assert.equal(soundCheck.state,'running');assert.ok(soundCheck.count>0&&soundCheck.count<=8,'actual Web Audio voice count is capped');
 const cdp=await context.newCDPSession(page),touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 await touch('touchStart',[{id:1,x:140,y:650}]);await touch('touchMove',[{id:1,x:210,y:650}]);
 assert.ok(await page.evaluate(()=>__qa.input.x>.9));
 await touch('touchStart',[{id:1,x:210,y:650},{id:2,x:300,y:500}]);await touch('touchMove',[{id:1,x:210,y:650},{id:2,x:240,y:500}]);
 assert.ok(await page.evaluate(()=>__qa.input.x>.9),'secondary finger cannot steal steering');
 await page.evaluate(()=>window.postMessage({type:'daemoncade:suspend'},location.origin));await page.waitForFunction(()=>__qa.phase==='paused');
 assert.deepEqual(await page.evaluate(()=>({x:__qa.input.x,y:__qa.input.y,hidden:document.querySelector('#stick').hidden})),{x:0,y:0,hidden:true});await touch('touchEnd',[]);
 assert.equal(await page.evaluate(()=>__qa.sounds),0,'pause stops rather than queues old effects');
 assert.equal(await page.locator('#pickups span:not([hidden])').count(),0,'pause clears score feedback');
 await openCollection(page);assert.equal(await page.locator('#import-save').isDisabled(),true);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__qa.phase),'paused');
 const time=await page.evaluate(()=>__qa.run.time);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>__qa.run.time),time);
 await page.locator('#resume').click();
 // Use the real renderer at different growth stages, including an object descending below ground.
 await page.evaluate(()=>{
  __qa.pause();const r=__qa.run;r.free=true;r.player.radius=5.8;r.player.area=5.8**2;r.player.x=-42.6;r.player.z=41;r.player.vx=r.player.vz=0;
  const o=r.objects.find(x=>x.type==='landmark');
  for(let i=0;i<100;i++){r.step(1/60,{x:0,y:0});if(o.body&&Math.hypot(o.body.q.x,o.body.q.z)>.22&&o.phase==='falling')break;}
  __qa.renderer.snapCamera(r);__qa.renderer.render(r,0);document.querySelector('#panel').hidden=true;
 });
 await page.screenshot({path:'/tmp/sinkhole-metro-falling.png'});
 const stats=await page.evaluate(()=>({calls:__qa.renderer.renderer.info.render.calls,triangles:__qa.renderer.renderer.info.render.triangles,resources:performance.getEntriesByType('resource').reduce((s,x)=>s+x.encodedBodySize,0),batches:__qa.renderer.batches.length,falling:__qa.run.objects.some(o=>o.phase==='falling')}));
 assert.ok(stats.calls<100);assert.ok(stats.falling);
 const body=await page.evaluate(()=>{const o=__qa.run.objects.find(x=>x.type==='landmark');return {shape:o.shape,q:o.body?.q,y:o.body?.y,phase:o.phase};});
 assert.ok(Math.hypot(body.q.x,body.q.z)>.2,'actual model must tilt at the rim');console.log('METRO',stats,body);
 const frame=await page.evaluate(()=>__qa.renderer.renderer.info.render.frame);
 await page.setViewportSize({width:932,height:430});await page.waitForFunction(previous=>__qa.renderer.renderer.info.render.frame>previous,frame);await page.screenshot({path:'/tmp/sinkhole-metro-landscape.png'});
 // Complete a real contract, return to the mission deck and verify persisted unlocks.
 await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});
 await page.setViewportSize({width:430,height:932});await page.locator('#start').click();
 await page.evaluate(()=>{
  const r=__qa.run;let target;
  for(let tick=0;tick<r.duration*60+1&&!r.done;tick++){
   const p=r.player,eligible=r.objects.filter(o=>r.eligible(o));
   const fixtures=eligible.filter(o=>['cone','bin','hydrant','bench','lamp','crate'].includes(o.type));
   if(target?.phase==='consumed')target=null;
   if(!target)target=(fixtures.length?fixtures:eligible).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
   const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});r.events.length=0;
  }
 });
 await page.waitForFunction(()=>__qa.phase==='ended');assert.ok(await page.evaluate(()=>__qa.run.won));
 assert.equal(await page.locator('#start').textContent(),'Next contract');assert.equal(await page.locator('#contracts button').nth(1).isDisabled(),false);
 await page.screenshot({path:'/tmp/sinkhole-metro-contract-result.png'});
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.locator('#contracts button').nth(1).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#contracts button').nth(2).isDisabled(),true);
 await page.screenshot({path:'/tmp/sinkhole-metro-career.png'});
 await openCollection(page);await page.locator('#rims button').nth(1).click();
 assert.equal(await page.evaluate(()=>__qa.renderer.rimMaterial.color.getHex()),0xffd26d);assert.equal(await page.locator('#rims button').nth(2).isDisabled(),true);
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-save').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'sinkhole-metro-save.json');
 const before=await page.evaluate(()=>localStorage.getItem('sinkhole.metro.career.v1'));
 await page.locator('#import-save').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});await page.waitForFunction(()=>document.querySelector('#backup-status').textContent.includes('not a supported'));
 assert.equal(await page.locator('#apply-save').isDisabled(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('sinkhole.metro.career.v1')),before);
 const backup=JSON.stringify({app:'sinkhole-city-metro',version:1,career:JSON.parse(before)});
 await page.locator('#import-save').setInputFiles({name:'metro.json',mimeType:'application/json',buffer:Buffer.from(backup)});await page.waitForFunction(()=>!document.querySelector('#apply-save').disabled);
 assert.equal(await page.evaluate(()=>localStorage.getItem('sinkhole.metro.career.v1')),before,'choosing a file must not overwrite a save');await page.locator('#apply-save').click();
 assert.ok((await page.locator('#backup-status').innerText()).includes('restored'));await page.screenshot({path:'/tmp/sinkhole-metro-collection.png'});await page.locator('#close-locker').click();
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.evaluate(()=>__qa.renderer.rimMaterial.color.getHex()),0xffd26d);
 // Arena uses all four actual openings and shared, exactly-once collection.
 const campaignBeforeArena=await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.career.v1')).records);
 await page.locator('#arena').click();await page.locator('#arena-difficulties button').nth(2).click();await page.locator('#play-arena').click();
 await page.waitForFunction(()=>__qa.run.arena&&__qa.phase==='playing');assert.equal(await page.evaluate(()=>__qa.run.difficulty),'hard');
 assert.ok(await page.evaluate(()=>__qa.run.objects.every(o=>!o.shape.profile&&!o.shape.contacts)),'Arena retains its original rules-v1 box contacts');
 assert.equal(await page.evaluate(()=>__qa.renderer.holeCount.value),4);assert.equal(await page.evaluate(()=>__qa.renderer.rivalWells.filter(w=>w.visible).length),3);
 await page.evaluate(()=>{const r=__qa.run;while(r.time<25&&!r.done){r.step(1/60,{x:0,y:0});r.events.length=0;}});
 await page.waitForFunction(()=>__qa.run.rivals.every(r=>r.eaten>0));await page.screenshot({path:'/tmp/sinkhole-metro-arena.png'});
 const arenaCalls=await page.evaluate(()=>__qa.renderer.renderer.info.render.calls);assert.ok(arenaCalls<100);console.log('ARENA RENDER',{calls:arenaCalls});
 await page.locator('#pause').click();const arenaTime=await page.evaluate(()=>__qa.run.time),positions=await page.evaluate(()=>__qa.run.rivals.map(r=>({...r.player})));
 await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>__qa.run.time),arenaTime);assert.deepEqual(await page.evaluate(()=>__qa.run.rivals.map(r=>({...r.player}))),positions);await page.locator('#resume').click();
 await page.evaluate(()=>{const r=__qa.run;for(let i=0;i<120*60+1&&!r.done;i++){r.step(1/60,{x:0,y:0});r.events.length=0;}});await page.waitForFunction(()=>__qa.phase==='ended');
 assert.equal(await page.locator('#standings li').count(),4);assert.equal(await page.locator('#title').innerText(),'Match complete');assert.equal(await page.locator('#rival-tags').isHidden(),true);
 const arenaSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.career.v1')));assert.deepEqual(arenaSaved.records,campaignBeforeArena);assert.equal(arenaSaved.arena.hard.runs,1);assert.equal(arenaSaved.arena.hard.wins,0);assert.ok(arenaSaved.arena.hard.score>=0);
 await page.screenshot({path:'/tmp/sinkhole-metro-arena-results.png'});await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);await page.locator('#arena').click();assert.ok((await page.locator('#arena-record').innerText()).includes('1 matches'));await page.locator('#close-arena').click();
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked storage');};Storage.prototype.setItem=()=>{throw new Error('blocked storage');};});
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);await openCollection(page);
 await page.locator('#import-save').setInputFiles({name:'metro.json',mimeType:'application/json',buffer:Buffer.from(backup)});await page.waitForFunction(()=>!document.querySelector('#apply-save').disabled);await page.locator('#apply-save').click();
 assert.ok((await page.locator('#backup-status').innerText()).includes('session only'));await page.locator('#close-locker').click();await page.locator('#free').click();await page.waitForFunction(()=>__qa.phase==='playing');await page.locator('#pause').click();assert.equal(await page.evaluate(()=>__qa.phase),'paused');
 assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);console.log('PASS: district models/shaders, keyboard steering, wrapper suspension, depth animation, portrait/landscape rendering.');
}finally{await browser.close();}
