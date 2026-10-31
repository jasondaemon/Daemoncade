import assert from 'node:assert/strict';
import {ALL_CONTRACTS} from '../games/sinkhole-city/metro/worlds.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(records=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'ascension',sound:false,music:false}));},Object.fromEntries(ALL_CONTRACTS.slice(0,15).map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()','1')+`\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause,paintHUD,map,preview(progress){run.scaleProgress=progress;run.scaleStage=Math.min(17,Math.floor(progress));run.player.radius=1.2*3.4**progress;run.player.area=run.player.radius**2;run.scaleZoom=Math.max(1,run.player.radius/1.8);run.player.x=run.player.z=0;renderer.snapCamera(run);renderer.render(run,0);paintHUD();mapTime=-1;map();},advance(seconds){for(let i=0;i<seconds*60;i++)run.step(1/60,{x:0,y:0});renderer.render(run,0);}};`});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=finale47`);
 await page.waitForFunction(()=>!document.querySelector('#title-play').disabled);await page.locator('#title-play').click();
 assert.equal(await page.locator('#worlds button').count(),6);await page.waitForFunction(()=>!document.querySelector('#free').disabled);assert.deepEqual(errors,[]);await page.locator('#free').click();await page.locator('#pause').click();await page.evaluate(()=>document.querySelector('#panel').hidden=true);
 const stages=[];
 for(const progress of[0,.65,1.3,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5,16.5,17.5]){
  const stats=await page.evaluate(progress=>{__qa.preview(progress);const v=__qa.renderer,r=__qa.run,zoom=r.scaleZoom;return {progress,sources:v.sources.size,batches:v.batches.length,visible:v.batches.filter(b=>b.mesh.visible).reduce((n,b)=>n+b.objects.filter(o=>o.phase!=='consumed'&&o.radius/zoom>.055&&o.radius/zoom<14&&Math.hypot(o.x/zoom,o.z/zoom)<65+o.radius/zoom).length,0),ranges:[...new Set(r.objects.filter(o=>o.radius/zoom>.18&&o.radius/zoom<14&&Math.hypot(o.x/zoom,o.z/zoom)<25).map(o=>o.scaleStage))],calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,memory:{...v.renderer.info.memory}};},progress);
  assert.ok(stats.ranges.length>=2,JSON.stringify(stats));assert.ok(stats.visible>50,JSON.stringify(stats));assert.ok(stats.calls<45&&stats.triangles<1200000,JSON.stringify(stats));stages.push(stats);
  await page.screenshot({path:`/tmp/sinkhole-finale47-${progress}.png`});
 }
 console.log(JSON.stringify(stages,null,2));
 const memory=await page.evaluate(()=>{__qa.preview(0);return {...__qa.renderer.renderer.info.memory};});
 assert.equal(memory.geometries,stages.at(-1).memory.geometries,'returning to atoms creates no additional geometry');
 assert.ok(memory.geometries<=stages[0].sources+8,'bounded lazy GPU uploads');
 await page.evaluate(()=>__qa.preview(.65));const first=await page.locator('#world canvas').screenshot();
 await page.evaluate(()=>__qa.advance(2));const moving=await page.locator('#world canvas').screenshot();assert.notDeepEqual(first,moving,'visible motion while simulation advances');
 const frozen=await page.locator('#world canvas').screenshot();await page.waitForTimeout(200);assert.deepEqual(frozen,await page.locator('#world canvas').screenshot(),'paused world must freeze');
 for(const viewport of[{width:390,height:844},{width:932,height:430}]){await page.setViewportSize(viewport);await page.evaluate(()=>__qa.preview(2.3));await page.screenshot({path:`/tmp/sinkhole-finale47-phone-${viewport.width}.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 // Reproduce reaching maximum size with unconsumed matter, then finish the
 // final galaxy. No test-only completion flags or direct visual hiding.
 await page.evaluate(()=>{__qa.preview(18);const r=__qa.run;for(const o of r.objects)o.phase='consumed';const atom=r.objects[0],galaxy=r.objects.find(o=>o.scaleStage===17);atom.phase=galaxy.phase='idle';r.eaten=r.total-2;r.done=r.won=false;r.consume(r,galaxy);__qa.renderer.render(r,0);__qa.paintHUD();});
 assert.equal(await page.locator('#coverage').textContent(),'JOURNEY 99%');
 await page.evaluate(()=>__qa.advance(2));await page.screenshot({path:'/tmp/sinkhole-finale47-collapse.png'});
 assert.equal(await page.evaluate(()=>Boolean(__qa.run.done)),false);
 await page.evaluate(()=>{__qa.advance(3);__qa.paintHUD();});
 const ending=await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer;return {complete:r.infinityComplete,eaten:r.eaten,total:r.total,visible:v.batches.filter(b=>b.mesh.visible).length,stars:v.infinitySpace.value,sky:v.scene.background.getHex(),ground:v.infinitySurface.color.getHex(),well:v.well.visible};});
 assert.ok(ending.complete);assert.equal(ending.eaten,ending.total);assert.equal(ending.visible,0);assert.equal(ending.stars,0);assert.equal(ending.sky,0);assert.equal(ending.ground,0);assert.equal(ending.well,false);assert.equal(await page.locator('#coverage').textContent(),'JOURNEY 100%');
 await page.screenshot({path:'/tmp/sinkhole-finale47-empty.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify(stages,null,2));console.log('PASS: overlapping ranges, animated/paused frames, stable resources, phone layouts and an actual completed intake ending in empty blackness.');
}finally{await browser.close();}
