import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:20,score:100},'camp-cleanup':{medal:3,time:20,score:100}}}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'deep',sound:false}));});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause,chooseWorld};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=reef24');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));await page.locator('#free').click();
 const stats=await page.evaluate(()=>{
  __qa.pause();const r=__qa.run,v=__qa.renderer;document.querySelector('#panel').hidden=true;
  const terrain=v.ground.children.find(m=>m.geometry.attributes.color),p=terrain.geometry.attributes.position,paint=terrain.geometry.attributes.color,shades=new Set();let flat=true;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(Math.abs(x)<=54&&Math.abs(z)<=54&&Math.abs(p.getY(i)-.012)>1e-5)flat=false;shades.add([paint.getX(i),paint.getY(i),paint.getZ(i)].map(v=>v.toFixed(2)).join(':'));}
  r.player.radius=4;r.player.area=16;r.player.x=-8;r.player.z=34;v.snapCamera(r);v.render(r,0);const high=v.renderer.info.render.triangles;v.quality(true);const low=v.renderer.info.render.triangles;v.quality(false);
  return {flat,shades:shades.size,terrainVertices:p.count,high,low,animals:r.marine.length,memory:{...v.renderer.info.memory},time:r.time};
 });assert.equal(stats.flat,true);assert.ok(stats.shades>100);assert.ok(stats.high<650000);assert.ok(stats.low<stats.high);assert.equal(stats.animals,97);
 await page.screenshot({path:'/tmp/sinkhole-reef24-mobile.png'});await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>__qa.run.time),stats.time);
 await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});for(const world of['metro','deep','basecamp','deep'])await page.evaluate(world=>__qa.chooseWorld(world),world);
 assert.deepEqual(await page.evaluate(()=>({...__qa.renderer.renderer.info.memory})),stats.memory);assert.deepEqual(errors,[]);console.log('SEABED',stats);console.log('PASS: continuous baked terrain colors, flat playable collision plane, 97 retained creatures, bounded high/low geometry budget, pause and stable world resources.');
}finally{await browser.close();}
