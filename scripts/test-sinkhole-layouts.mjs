import assert from 'node:assert/strict';
import {DistrictRun} from '../games/sinkhole-city/metro/simulation.js';
import {ALL_CONTRACTS,objectiveMatches} from '../games/sinkhole-city/metro/worlds.js';
import {sourceKey} from '../games/sinkhole-city/metro/world-dressing.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
function drive(r,budget){
 let target,chosen=0,best=Infinity;const defer=new Map();
 for(let tick=0;tick<budget*60&&!r.done;tick++){
  const p=r.player;if(target?.phase==='consumed')target=null;
  if(target){const d=Math.hypot(target.x-p.x,target.z-p.z);if(d<best-.2){best=d;chosen=r.time;}if(r.time-chosen>5){defer.set(target.id,r.time+8);target=null;}}
  if(!target){const eligible=r.objects.filter(o=>r.eligible(o)&&!(defer.get(o.id)>r.time)),goals=r.contract?eligible.filter(o=>objectiveMatches(r.contract,o)):[];target=(goals.length?goals:eligible).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];chosen=r.time;best=Infinity;}
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.1?0:x/d,y:d<.1?0:y/d});r.events.length=0;
 }
}
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(records=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false}));},Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:"import {sourceKey} from './world-dressing.js?v=parks42';\n"+await response.text()+`\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause,chooseWorld,preview(world,seed){run=new DistrictRun({world,seed,free:true});renderer.reset(run);renderer.snapCamera(run);renderer.ground.traverse(m=>{if(m.isMesh)m.frustumCulled=false;});renderer.render(run,0);return Object.fromEntries(run.objects.map(o=>[sourceKey(o),o.shape]));}};`});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=layouts43');await page.waitForFunction(()=>!document.querySelector('#title-play').disabled);await page.locator('#title-play').click();
 const live=[];for(let i=0;i<3;i++){await page.locator('#free').click();const seed=await page.evaluate(()=>__qa.run.seed);assert.ok(seed>0);await page.locator('#pause').click();assert.equal(await page.evaluate(()=>__qa.run.seed),seed);await page.locator('#resume').click();assert.equal(await page.evaluate(()=>__qa.run.seed),seed);await page.locator('#pause').click();await page.locator('#leave').click();live.push(seed);}assert.equal(new Set(live).size,3,'new runs reroll but pause/resume does not');
 const routes=[];
 for(const world of['metro','basecamp','deep','alien','orbit']){
  await page.evaluate(world=>__qa.chooseWorld(world),world);
  const shapes=await page.evaluate(world=>__qa.preview(world,0),world);
  const memory=await page.evaluate(()=>({...__qa.renderer.renderer.info.memory}));
  for(const seed of[1,7,23]){
   for(const contract of ALL_CONTRACTS.filter(c=>c.world===world)){
    const r=new DistrictRun({world,seed,contract});for(const o of r.objects){assert.ok(shapes[sourceKey(o)],sourceKey(o));o.shape=shapes[sourceKey(o)];}drive(r,r.duration);assert.ok(r.won,`${world} seed ${seed}: ${contract.id} ${JSON.stringify(r.counts)}`);routes.push({id:contract.id,seed,time:Math.round(r.time)});
   }
   const r=new DistrictRun({world,seed,free:true});for(const o of r.objects)o.shape=shapes[sourceKey(o)];drive(r,900);assert.equal(r.eaten,r.total,`${world} seed ${seed} full clear`);
   await page.evaluate(({world,seed})=>__qa.preview(world,seed),{world,seed});assert.deepEqual(await page.evaluate(()=>({...__qa.renderer.renderer.info.memory})),memory,'no layout-dependent render resource growth');
   if(world==='metro'&&seed!==23){await page.evaluate(()=>{const v=__qa.renderer;document.querySelector('#panel').hidden=true;v.camera.position.set(0,125,95);v.camera.lookAt(0,0,0);const fog=v.scene.fog;v.scene.fog=null;v.renderer.render(v.scene,v.camera);v.scene.fog=fog;});await page.screenshot({path:`/tmp/sinkhole-layouts43-metro-${seed}.png`});}
  }
  console.log('SEEDED WORLD',world,'9 missions + 3 full clears passed');
 }
 assert.deepEqual(errors,[]);console.log('SEEDED ROUTES',JSON.stringify(routes));console.log('PASS: real fresh-run randomness, pause retention, 45 actual-model seeded missions, 15 full clears and bounded renderer resources.');
}finally{await browser.close();}
