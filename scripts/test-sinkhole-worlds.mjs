import {enterWorldMenu,openCollection} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
import {DistrictRun} from '../games/sinkhole-city/metro/simulation.js';
import {sourceKey} from '../games/sinkhole-city/metro/world-dressing.js';
import {BASECAMP_CONTRACTS} from '../games/sinkhole-city/metro/worlds.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},get world(){return world},get career(){return career},pause,resume};'});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=package37`);await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.locator('#worlds button').nth(1).isDisabled(),true);
 assert.equal(await page.locator('#worlds button').nth(2).isDisabled(),true);
 assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('tree_pineTallA')||r.name.includes('tent_smallOpen'))),false,'Metro must not preload Basecamp models');
 await page.locator('#start').click();
 // Accelerate deterministic routes while the render clock is paused, then explicitly resume.
 // Otherwise a slow test-machine loop legitimately trips the game's long-stall pause guard.
 await page.evaluate(()=>{__qa.pause();const r=__qa.run;let target;for(let tick=0;tick<90*60+1&&!r.done;tick++){
  const p=r.player;if(target?.phase==='consumed')target=null;if(!target)target=r.objects.filter(o=>r.eligible(o)&&['cone','bin','hydrant','bench','lamp','crate'].includes(o.type)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});r.events.length=0;
 }__qa.resume();});await page.waitForFunction(()=>__qa.phase==='ended');assert.ok(await page.evaluate(()=>__qa.career.records.cleanup.medal>=3));
 await page.locator('#return-menu').click();await page.locator('#worlds button').nth(1).click();await page.waitForFunction(()=>__qa.world==='basecamp'&&!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));
 assert.equal(await page.locator('#title').innerText(),'Pinewood Basecamp');assert.equal(await page.locator('#arena').isDisabled(),true);assert.equal(await page.locator('#contracts button').count(),3);
 const shapes=await page.evaluate(async()=>{const {sourceKey}=await import('/games/sinkhole-city/metro/world-dressing.js?v=art19');return Object.fromEntries(__qa.run.objects.map(o=>[sourceKey(o),o.shape]));});
 for(const contract of BASECAMP_CONTRACTS){
  const r=new DistrictRun({contract});for(const o of r.objects)o.shape=shapes[sourceKey(o)];let target;
  for(let tick=0;tick<contract.duration*60+1&&!r.done;tick++){
   const p=r.player,eligible=r.objects.filter(o=>r.eligible(o)),goals=eligible.filter(o=>contract.kind==='clutter'?['cooler','log','firepit','picnic'].includes(o.type):contract.kind==='camp'?['tent','rv'].includes(o.type):o.type==='landmark');
   if(target?.phase==='consumed')target=null;if(!target)target=(goals.length?goals:eligible).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
   const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});r.events.length=0;
  }
  assert.ok(r.won,`${contract.title} must be reachable with actual model dimensions`);console.log('BASECAMP ROUTE',contract.id,Math.round(r.time*10)/10+'s');
 }
 await page.screenshot({path:'/tmp/sinkhole-basecamp-menu.png'});await page.locator('#start').click();
 await page.evaluate(()=>{__qa.pause();const r=__qa.run;let target;for(let tick=0;tick<100*60+1&&!r.done;tick++){
  const p=r.player;if(target?.phase==='consumed')target=null;if(!target)target=r.objects.filter(o=>r.eligible(o)&&['cooler','log','firepit','picnic'].includes(o.type)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});r.events.length=0;
 }__qa.resume();});await page.waitForFunction(()=>__qa.phase==='ended');assert.equal(await page.evaluate(()=>__qa.career.records['camp-cleanup'].medal),3);assert.equal(await page.locator('#contracts button').nth(1).isDisabled(),false);assert.equal(await page.locator('#worlds button').nth(2).isDisabled(),false,'earning Basecamp medals opens Deep Sink');
 await page.locator('#free').click();await page.waitForFunction(()=>__qa.phase==='playing');await page.screenshot({path:'/tmp/sinkhole-basecamp-play.png'});
 const stats=await page.evaluate(()=>({calls:__qa.renderer.renderer.info.render.calls,objects:__qa.run.total,geometry:__qa.renderer.renderer.info.memory.geometries}));assert.ok(stats.calls<100);console.log('BASECAMP',stats);
 await page.locator('#pause').click();await page.locator('#leave').click();await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.evaluate(()=>__qa.world),'basecamp');assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).some(r=>r.name.includes('water-tower')||r.name.includes('delivery.glb')||r.name.includes('tree_oak'))),false,'cold Basecamp entry must not load Metro models');
 const baseline=await page.evaluate(()=>({...__qa.renderer.renderer.info.memory}));
 const resources={basecamp:baseline};
 for(let i=0;i<8;i++){await page.locator('#worlds button').nth(i%2===0?0:1).click();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);const snapshot=await page.evaluate(()=>({world:__qa.world,memory:{...__qa.renderer.renderer.info.memory}}));if(resources[snapshot.world])assert.deepEqual(snapshot.memory,resources[snapshot.world],'world resources must remain stable on repeated entry');else resources[snapshot.world]=snapshot.memory;}
 const after=await page.evaluate(()=>({...__qa.renderer.renderer.info.memory}));console.log('WORLD MEMORY',{baseline,after});assert.deepEqual(after,baseline,'returning to Basecamp must release old geometry and textures');
 assert.equal(await page.evaluate(()=>__qa.career.records.cleanup.medal),3);
 for(const viewport of[{width:360,height:640},{width:932,height:430}]){await page.setViewportSize(viewport);const box=await page.locator('#panel .card').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=viewport.height,`world menu fits ${JSON.stringify(viewport)}: ${JSON.stringify(box)}`);}
 await openCollection(page);const older={app:'sinkhole-city-metro',version:1,career:{version:1,records:{cleanup:{medal:1,time:80,score:500}}}};
 await page.locator('#import-save').setInputFiles({name:'old-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(older))});await page.waitForFunction(()=>!document.querySelector('#apply-save').disabled);await page.locator('#apply-save').click();await page.locator('#close-locker').click();
 await page.waitForFunction(()=>__qa.world==='metro'&&!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#worlds button').nth(1).isDisabled(),true);assert.equal(await page.evaluate(()=>__qa.career.records['camp-cleanup']),undefined);
 assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);console.log('PASS: medal-gated world entry, actual-model routes, world-specific assets, Free Roam, persistence and bounded geometry across switches.');
}finally{await browser.close();}
