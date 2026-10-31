import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
import {ALL_CONTRACTS} from '../games/sinkhole-city/metro/career.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1180,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(records=>{
  localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false}));
 },Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause,chooseWorld};'});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=art19`);await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));
 const results=[];
 for(const world of['metro','basecamp','deep','alien','orbit']){
  await page.evaluate(world=>__qa.chooseWorld(world),world);await page.locator('#free').click();
  if(world==='orbit')assert.equal(await page.evaluate(()=>window.alienGroundDisposed),true,'switching worlds releases the owned blended terrain material');
  const stats=await page.evaluate(()=>{
   const {run:r,renderer:v}=__qa;__qa.pause();document.querySelector('#panel').hidden=true;
   r.player.x=r.world==='basecamp'?-7:r.world==='alien'?-8:r.world==='deep'?-8:-13;r.player.z=r.world==='basecamp'?24:r.world==='alien'?24:r.world==='deep'?34:-11;r.player.radius=4;r.player.area=16;v.snapCamera(r);v.render(r,0);
   return {world:r.world,objects:r.objects.length,calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,geometries:v.renderer.info.memory.geometries,textures:v.renderer.info.memory.textures,valid:r.objects.every(o=>o.shape&&Number.isFinite(o.shape.width+o.shape.height+o.shape.depth)),buildings:r.objects.filter(o=>['building','warehouse'].includes(o.type)).length,models:[...v.sources.keys()]};
  });assert.ok(stats.calls<100);assert.ok(stats.valid);if(world==='metro'){assert.equal(stats.buildings,37);for(const model of['car:sedan','car:suv','van:van','van:flatbed','person@0','person@1','person@2'])assert.ok(stats.models.includes(model));}
  if(world==='deep')assert.ok(stats.triangles<650000,'Deep should retain its optimized full-scene triangle budget');
  if(world==='alien')await page.evaluate(()=>{const owned=__qa.renderer.ground.children.filter(m=>m.userData.ownedMaterial);if(owned.length!==1)throw Error('Expected one owned blended terrain material');window.alienGroundDisposed=false;owned[0].material.addEventListener('dispose',()=>{window.alienGroundDisposed=true;});});
  if(world==='basecamp'){
   assert.ok(stats.triangles<240000,'living camp with four detailed rigs retains a bounded scene workload');
   const terrain=await page.evaluate(()=>{
    const m=__qa.renderer.ground.children.find(m=>m.geometry.attributes.color),p=m.geometry.attributes.position,c=m.geometry.attributes.color,colors=new Set();let level=true;
    for(let i=0;i<p.count;i++){if(Math.abs(p.getX(i))<=54&&Math.abs(p.getZ(i))<=54&&Math.abs(p.getY(i)-.012)>.00001)level=false;colors.add([c.getX(i).toFixed(3),c.getY(i).toFixed(3),c.getZ(i).toFixed(3)].join(','));}
    return {level,colors:colors.size,vertices:p.count};
   });assert.ok(terrain.level&&terrain.colors>100&&terrain.vertices<60000,JSON.stringify(terrain));
   await page.setViewportSize({width:430,height:932});
   for(const [name,x,z]of[['backpacking',-29,31],['caravans',34,7]]){
    await page.evaluate(({x,z})=>{const r=__qa.run,v=__qa.renderer;r.player.x=x;r.player.z=z;r.player.radius=3;r.player.area=9;v.snapCamera(r);v.render(r,0);},{x,z});
    await page.screenshot({path:`/tmp/sinkhole-forest31-${name}.png`});
   }
   await page.setViewportSize({width:1180,height:760});
  }
  results.push(stats);await page.screenshot({path:`/tmp/sinkhole-art19-${world}.png`});await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});
 }
 await page.evaluate(()=>__qa.chooseWorld('metro'));const baseline=await page.evaluate(()=>({...__qa.renderer.renderer.info.memory}));
 for(const world of['deep','orbit','basecamp','alien','metro'])await page.evaluate(world=>__qa.chooseWorld(world),world);
 assert.deepEqual(await page.evaluate(()=>({...__qa.renderer.renderer.info.memory})),baseline);assert.deepEqual(errors,[]);
 console.log('ART',JSON.stringify(results));console.log('PASS: five-world density/variants, six car silhouettes, valid actual-model dimensions, draw budgets and stable world-switch resources; screenshots saved.');
}finally{await browser.close();}
