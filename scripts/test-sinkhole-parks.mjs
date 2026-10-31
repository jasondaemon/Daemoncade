import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false})));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=parks42');await page.waitForFunction(()=>!document.querySelector('#title-play').disabled);await page.locator('#title-play').click();await page.locator('#free').click();
 const stats=await page.evaluate(()=>{
  __qa.pause();document.querySelector('#panel').hidden=true;const r=__qa.run,v=__qa.renderer;r.player.x=-36;r.player.z=23;r.player.radius=1.2;v.snapCamera(r);v.render(r,0);
  const b=v.batches.find(b=>b.type==='fountain'),a=b.mesh.geometry.attributes.parkWater;
  return {objects:r.total,calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,geometry:v.renderer.info.memory.geometries,program:b.mesh.material.customProgramCacheKey(),water:[...new Set(a.array)],sources:[...v.sources.keys()],valid:r.objects.every(o=>o.shape&&Number.isFinite(o.shape.width+o.shape.depth+o.shape.height))};
 });assert.equal(stats.objects,240);assert.ok(stats.calls<100&&stats.valid);assert.equal(stats.program,'park-fountain-flow-v1');assert.deepEqual(stats.water.sort(),[0,1]);for(const key of['tree:park-linden','tree:park-birch','tree:park-cedar','fence:short','fence:long','gate:open'])assert.ok(stats.sources.includes(key));
 await page.screenshot({path:'/tmp/sinkhole-parks42-overview.png'});
 const before=await page.evaluate(()=>__qa.renderer.waterTime.value);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>__qa.renderer.waterTime.value),before,'paused fountain freezes');
 const views=[];for(const time of[1,1.3]){await page.evaluate(time=>{const r=__qa.run,v=__qa.renderer;r.time=time;r.player.x=-38;r.player.z=17;v.camera.position.set(-33,8,24);v.camera.lookAt(-38,0,15);v.waterTime.value=time;v.renderer.render(v.scene,v.camera);},time);views.push(await page.screenshot({path:`/tmp/sinkhole-parks42-fountain-${time}.png`}));}assert.notDeepEqual(views[0],views[1],'native fountain flow changes over simulation time');
 await page.evaluate(()=>{const v=__qa.renderer;v.reduced=true;v.render(__qa.run,0);});assert.equal(await page.evaluate(()=>__qa.renderer.waterTime.value),0);
 await page.setViewportSize({width:430,height:932});await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer;r.player.x=-38;r.player.z=23;v.snapCamera(r);v.render(r,0);});await page.screenshot({path:'/tmp/sinkhole-parks42-mobile.png'});assert.deepEqual(errors,[]);
 console.log('PARKS',JSON.stringify(stats));console.log('PASS: fenced green blocks/open gates, three tree sources, actual-model dimensions, native water shader motion, pause/reduced-motion and mobile rendering.');
}finally{await browser.close();}
