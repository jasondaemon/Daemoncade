import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
 await page.addInitScript(()=>{
  if(!localStorage.getItem('sinkhole.metro.career.v1'))localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:Object.fromEntries(['cleanup','traffic','tower','camp-cleanup','camp-packup','camp-lodge','deep-cleanup','deep-salvage','deep-station','alien-forage','alien-cores','alien-portal'].map(id=>[id,{medal:3,time:40,score:500}]))}));
  localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'orbit',sound:false}));
 });
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+`\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},pause,chooseWorld,routeContract(index){selected=index;start(false);pause();let target;const c=run.contract;for(let tick=0;tick<c.duration*60+1&&!run.done;tick++){const p=run.player,available=run.objects.filter(o=>run.eligible(o)),objective=available.filter(o=>c.kind==='clutter'?o.type==='debris':c.kind==='spacecraft'?['satellite','probe','shuttle'].includes(o.type):['planet','landmark'].includes(o.type));if(target?.phase==='consumed')target=null;if(!target)target=(objective.length?objective:available).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;}const result={won:run.won,time:run.time,counts:run.counts};resume();return result;}};`});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=collapse29');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));assert.equal(await page.locator('#title').innerText(),'Helios Reach');assert.equal(await page.locator('#worlds button').count(),5);
 assert.equal(requests.filter(url=>/\.(glb|webp|png)(\?|$)/.test(url)).length,0,'cold Orbit must not load other world model/image packs');
 for(const viewport of[{width:360,height:640},{width:932,height:430},{width:430,height:932}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);
  const layout=await page.evaluate(()=>{const p=document.querySelector('#panel .card').getBoundingClientRect(),buttons=[...document.querySelectorAll('#worlds button')].map(b=>b.getBoundingClientRect());return {top:p.top,bottom:p.bottom,height:innerHeight,buttons:buttons.map(b=>({left:b.left,right:b.right,height:b.height}))};});
  assert.ok(layout.top>=0&&layout.bottom<=layout.height+1,JSON.stringify(layout));assert.ok(layout.buttons.every(b=>b.left>=0&&b.right<=viewport.width&&b.height>=34));
 }
 await page.screenshot({path:'/tmp/sinkhole-orbit-menu.png'});
 const baseline=await page.evaluate(()=>({g:__qa.renderer.renderer.info.memory.geometries,t:__qa.renderer.renderer.info.memory.textures}));
 for(const id of['metro','basecamp','deep','alien','orbit','metro','orbit'])await page.evaluate(id=>__qa.chooseWorld(id),id);
 assert.deepEqual(await page.evaluate(()=>({g:__qa.renderer.renderer.info.memory.geometries,t:__qa.renderer.renderer.info.memory.textures})),baseline);
 await page.locator('#free').click();await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;});
 const before=await page.evaluate(()=>{const o=__qa.run.objects.find(o=>o.type==='shuttle');return {x:o.x,z:o.z};});
 await page.evaluate(()=>{const r=__qa.run;for(let i=0;i<180;i++)r.step(1/60,{x:0,y:0});__qa.renderer.render(r,0);});
 assert.ok(await page.evaluate(before=>{const o=__qa.run.objects.find(o=>o.type==='shuttle');return Math.hypot(o.x-before.x,o.z-before.z)>1;},before));
 await page.screenshot({path:'/tmp/sinkhole-orbit-play.png'});
 const frozen=await page.evaluate(()=>({time:__qa.run.time,ship:__qa.run.objects.find(o=>o.type==='shuttle').x,span:__qa.renderer.growthCamera.span}));await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>({time:__qa.run.time,ship:__qa.run.objects.find(o=>o.type==='shuttle').x,span:__qa.renderer.growthCamera.span})),frozen);
 // Native model dimensions and real intake, not an artificial planet counter.
 const collapse=await page.evaluate(()=>{
  const r=__qa.run,v=__qa.renderer,planet=r.objects.find(o=>o.type==='planet');
  r.player.radius=5;r.player.area=25;r.player.x=planet.x;r.player.z=planet.z;
  for(let i=0;i<300&&planet.phase!=='consumed';i++)r.collect(r,1/60);
  const captured=planet.phase==='consumed',initial=r.orbiters[0].orbital.contraction;
  r.player.x=-54;r.player.z=-54;
  const score=r.score,eaten=r.eaten;
  for(let i=0;i<1200;i++)r.step(1/60,{x:0,y:0});
  v.render(r,0);
  return {captured,initial,stage:r.counts.planets,scale:r.orbiters[0].orbital.contraction,uniform:v.orbitContraction.value,unchanged:r.score===score&&r.eaten===eaten,memory:{g:v.renderer.info.memory.geometries,t:v.renderer.info.memory.textures},calls:v.renderer.info.render.calls};
 });
 assert.ok(collapse.captured&&collapse.unchanged,JSON.stringify(collapse));assert.equal(collapse.initial,1);assert.equal(collapse.stage,1);
 assert.ok(collapse.scale>.88&&collapse.scale<.885,JSON.stringify(collapse));assert.equal(collapse.uniform,collapse.scale);assert.deepEqual(collapse.memory,baseline);
 const freezeCollapse=await page.evaluate(()=>({scale:__qa.run.orbiters[0].orbital.contraction,time:__qa.run.time}));await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>({scale:__qa.run.orbiters[0].orbital.contraction,time:__qa.run.time})),freezeCollapse);
 // Reduced effects keep route geometry accurate; only decorative motion is suppressed.
 await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer;v.reduced=true;v.low=true;v.look.set(0,0,18);v.growthCamera.reset('orbit',8);v.render(r,0);});
 assert.equal(await page.evaluate(()=>__qa.renderer.orbitContraction.value),collapse.scale);
 await page.screenshot({path:'/tmp/sinkhole-collapse29-orbit.png'});
 await page.evaluate(()=>{__qa.renderer.reduced=false;__qa.renderer.low=false;});
 await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer;for(const p of r.objects.filter(o=>o.type==='planet'))r.consume(r,p);r.player.radius=6;r.player.area=36;r.player.x=0;r.player.z=9;v.snapCamera(r);v.render(r,0);});
 await page.screenshot({path:'/tmp/sinkhole-orbit-solar.png'});
 const calls=await page.evaluate(()=>__qa.renderer.renderer.info.render.calls);assert.ok(calls<75);
 await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});
 const results=[];for(const index of[12,13,14]){const r=await page.evaluate(i=>__qa.routeContract(i),index);assert.equal(r.won,true,JSON.stringify(r));results.push(r);await page.waitForFunction(()=>__qa.phase==='ended');}
 assert.equal(await page.locator('#title').innerText(),'Expedition complete');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.career.v1')));assert.equal(Object.keys(saved.records).length,15);
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.ok((await page.locator('#status').innerText()).includes('/ 54 total'));assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.career.v1'))),saved);
 // Empty-progress mission decks include taller lock-requirement labels.
 await page.evaluate(()=>localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{}})));await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.locator('#worlds button:disabled').count(),4);
 for(const viewport of[{width:360,height:640},{width:932,height:430}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);await page.screenshot({path:`/tmp/sinkhole-orbit-locked-${viewport.width}.png`});const bounds=await page.evaluate(()=>{const p=document.querySelector('#panel .card').getBoundingClientRect();return {top:p.top,bottom:p.bottom,height:innerHeight};});assert.ok(bounds.top>=0&&bounds.bottom<=bounds.height+1,`locked-world menu fits without scroll: ${JSON.stringify({viewport,...bounds})}`);
 }
 assert.deepEqual(errors,[]);console.log('ORBIT',JSON.stringify({baseline,calls,collapse,results}));console.log('PASS: fifth-world cold loading, mobile fit, repeated world resource cleanup, physical planet intake/contraction, synchronized guides, reduced-effects route fidelity, live orbital motion, pause, solar gate and all actual-model routes/persistence.');
}finally{await browser.close();}
