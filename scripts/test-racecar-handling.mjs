// Isolated simulation + WebGL integration; never accesses the user's save/profile.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4197/games/racecar/');
 await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
 const result=await page.evaluate(async()=>{
  const [{RoadScene},{Run},{driver},{careerTrack}]=await Promise.all([import('./view.js?v=28'),import('./rules.js?v=28'),import('./driving-test-helper.mjs'),import('./career-tracks.js?v=28')]);
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999';document.body.append(host);
  const view=await new Promise((resolve,reject)=>new RoadScene(host,{ready:resolve,error:reject,frame:()=>{},progress:()=>{}}));
  const run=new Run({mode:'race',difficulty:'normal'});run.route=careerTrack(0,0);run.route.laps=1;run.goal=run.route.length;run.phase='playing';run.rivals=[];
  for(let i=0;i<18000&&run.phase==='playing';i++){run.update(1/60,driver(run));if(i%60===0)view.draw(run,1/60,true);}
  const result={phase:run.phase,collisions:run.collisions,time:run.time};
  // Exercise both effect buffers and the reduced-effects branch.
  run.phase='playing';run.player.x=1;run.player.speed=25;run.player.slipping=true;run.player.steering=1;run.time+=.1;
  view.draw(run,1/60,true);result.dust=view.drivingEffects.dust.count;result.skids=view.drivingEffects.skids.count;
  view.reduced=true;view.draw(run,1/60,true);result.reduced=view.drivingEffects.dust.count+view.drivingEffects.skids.count;
  return result;
 });
 assert.equal(result.phase,'finished');assert.equal(result.collisions,0);assert.ok(result.dust>0);assert.ok(result.skids>0);assert.equal(result.reduced,0);assert.deepEqual(errors,[]);
 console.log('PASS: actively steered/braked lap with WebGL, dust/skids and reduced effects.',result);
} finally {await browser.close();}
