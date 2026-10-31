// Diagnostic routes, NOT evidence of human enjoyment or physical-device FPS.
import {writeFile} from 'node:fs/promises';
import {DistrictRun} from '../games/sinkhole-city/metro/simulation.js';
import {ALL_CONTRACTS,WORLDS,objectiveMatches} from '../games/sinkhole-city/metro/worlds.js';
import {sourceKey} from '../games/sinkhole-city/metro/world-dressing.js';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
const report={build:'qualification52',method:'Actual loaded model contacts; nearest eligible objective, otherwise nearest eligible growth; full directional input; fixed 60 Hz; seeds 1/7/23. Not a human playtest.',worlds:[],routes:[]},shapes={};
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(records=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false,music:false,ambience:false}));},Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause,chooseWorld,paintHUD};'});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=qualification52`);await page.waitForFunction(()=>document.querySelector('#title-play').textContent==='Continue campaign');await page.locator('#title-play').click();
 for(const {id:world}of WORLDS){
  await page.evaluate(world=>__qa.chooseWorld(world),world);await page.locator('#free').click();await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;});
  const data=await page.evaluate(async()=>{
   const {sourceKey}=await import('/games/sinkhole-city/metro/world-dressing.js?v=camp-life32'),r=__qa.run,v=__qa.renderer;
   return {shapes:Object.fromEntries(r.objects.map(o=>[sourceKey(o),o.shape])),objects:r.total,geometries:v.renderer.info.memory.geometries,textures:v.renderer.info.memory.textures};
  });shapes[world]=data.shapes;delete data.shapes;
  for(const view of world==='ascension'?[0,8.5,17.5]:[1.2,4,8.5]){
   await page.evaluate(view=>{const r=__qa.run,v=__qa.renderer;if(r.world==='ascension'){r.scaleProgress=view;r.scaleStage=Math.min(17,Math.floor(view));r.player.radius=1.2*3.4**view;r.scaleZoom=Math.max(1,r.player.radius/1.8);}else r.player.radius=view;r.player.area=r.player.radius*r.player.radius;v.snapCamera(r);v.render(r,0);__qa.paintHUD();},view);
   await page.screenshot({path:`/tmp/sinkhole-qualification52-${world}-${view}.png`});
   const render=await page.evaluate(()=>({radius:__qa.run.player.radius,scaleProgress:__qa.run.scaleProgress||0,calls:__qa.renderer.renderer.info.render.calls,triangles:__qa.renderer.renderer.info.render.triangles}));report.worlds.push({world,view,...data,...render});
  }
  await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
for(const contract of ALL_CONTRACTS)for(const seed of[1,7,23]){
 const r=new DistrictRun({contract,seed});for(const o of r.objects)if(shapes[r.world][sourceKey(o)])o.shape=shapes[r.world][sourceKey(o)];
 let target,first=null,last=0,maxGap=0,previous=0,stale=0;const milestones=[];
 for(let tick=0;tick<=contract.duration*60&&!r.done;tick++){
  if(target?.phase==='consumed')target=null;
  if(!target){let best=Infinity,goal=false;for(const o of r.objects){if(!r.eligible(o))continue;const match=objectiveMatches(contract,o),d=Math.hypot(o.x-r.player.x,o.z-r.player.z);if(match&&!goal){goal=true;best=Infinity;}if(match!==goal)continue;if(d<best){best=d;target=o;}}}
  const x=target?target.x-r.player.x:0,y=target?target.z-r.player.z:0,d=Math.hypot(x,y)||1;
  r.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});r.events.length=0;
  if(r.eaten!==previous){if(first===null)first=r.time;maxGap=Math.max(maxGap,r.time-last);last=r.time;previous=r.eaten;stale=0;}else stale++;
  if(stale>1200){target=null;stale=0;}
  if(r.world==='ascension'&&r.scaleStage>milestones.length)milestones.push({scale:r.scaleStage,time:Number(r.time.toFixed(1))});
 }
 const result={contract:contract.id,world:r.world,seed,won:r.won,time:Number(r.time.toFixed(1)),firstIntake:first===null?null:Number(first.toFixed(2)),longestCollectionGap:Number(maxGap.toFixed(1)),eaten:r.eaten,goal:r.counts[contract.kind],target:contract.target,limit:contract.duration,medal:!r.won?0:r.time<=contract.gold?3:r.time<=contract.silver?2:1,milestones};
 report.routes.push(result);console.log(JSON.stringify(result));
}
await writeFile('/tmp/sinkhole-qualification52-pacing.json',JSON.stringify(report,null,2));
console.log('REPORT /tmp/sinkhole-qualification52-pacing.json');if(report.routes.some(r=>!r.won))process.exitCode=1;
