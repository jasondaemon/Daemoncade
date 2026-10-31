import {enterWorldMenu,clickOption} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
import {DistrictRun} from '../games/sinkhole-city/metro/simulation.js';
import {ALL_CONTRACTS} from '../games/sinkhole-city/metro/worlds.js';
import {sourceKey} from '../games/sinkhole-city/metro/world-dressing.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
function drive(r,budget){
 let target,chosen=0,bestDistance=Infinity;const defer=new Map();
 for(let tick=0;tick<budget*60&&!r.done;tick++){
  const p=r.player;if(target?.phase==='consumed')target=null;
  if(target){const distance=Math.hypot(target.x-p.x,target.z-p.z);if(distance<bestDistance-.2){bestDistance=distance;chosen=r.time;}}
  // Defer a genuinely stalled interception, not an ordinary long walk across
  // a nearly empty map. A five-second travel timeout can oscillate forever
  // between the final two props despite both being directly reachable.
  if(target&&r.time-chosen>5){defer.set(target.id,r.time+8);target=null;}
  if(!target){target=r.objects.filter(o=>r.eligible(o)&&!(defer.get(o.id)>r.time)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];chosen=r.time;bestDistance=Infinity;}
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.10?0:x/d,y:d<.10?0:y/d});r.events.length=0;
 }
}
try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(records=>{if(!localStorage.getItem('payoff-qa-seeded')){localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false}));localStorage.setItem('payoff-qa-seeded','1');}},Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},get career(){return career},audio,pause,resume,chooseWorld};\nwindow.__drive='+drive.toString()+';'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=payoff26');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);await page.locator('#start').click();
 await page.evaluate(()=>{__qa.pause();__drive(__qa.run,__qa.run.duration);__qa.resume();});await page.waitForFunction(()=>__qa.phase==='ended');
 assert.ok(await page.locator('#run-results').isVisible());assert.ok(await page.locator('#keep-clearing').isVisible());assert.match(await page.locator('#title').innerText(),/Contract complete/);
 for(const size of [{width:430,height:932},{width:360,height:640},{width:932,height:430}]){
  await page.setViewportSize(size);await page.waitForTimeout(400);const b=await page.locator('#panel .card').boundingBox();assert.ok(b.y>=0&&b.y+b.height<=size.height+1,`result card fits ${size.width}×${size.height}`);await page.screenshot({path:`/tmp/sinkhole-payoff26-results-${size.width}.png`});
 }
 const continuation=await page.evaluate(()=>{
  const r=__qa.run,objects=r.objects,player=r.player,record=JSON.stringify(__qa.career.records.cleanup),before={eaten:r.eaten,area:r.player.area,time:r.time,score:r.score,phases:r.objects.map(o=>o.phase)};
  document.querySelector('#keep-clearing').click();__qa.pause();
  return {same:r===__qa.run&&objects===r.objects&&player===r.player,free:r.free,contract:r.contract,before,after:{eaten:r.eaten,area:r.player.area,time:r.time,score:r.score,phases:r.objects.map(o=>o.phase)},recordUnchanged:record===JSON.stringify(__qa.career.records.cleanup),coverage:document.querySelector('#coverage').textContent};
 });assert.ok(continuation.same&&continuation.free&&continuation.recordUnchanged);assert.equal(continuation.contract,null);assert.deepEqual(continuation.before,continuation.after);
 const medalBefore=await page.evaluate(()=>JSON.stringify(__qa.career.records.cleanup));
 await page.evaluate(()=>{__drive(__qa.run,900);__qa.resume();});await page.waitForFunction(()=>__qa.phase==='ended');
 assert.equal(await page.locator('#title').innerText(),'World cleared');assert.equal(await page.locator('#result-coverage').innerText(),'100%');assert.ok(await page.locator('#keep-clearing').isHidden());
 assert.equal(await page.evaluate(()=>JSON.stringify(__qa.career.records.cleanup)),medalBefore,'continuing must not re-award a medal or change its score/time');
 await page.setViewportSize({width:430,height:932});await page.waitForTimeout(400);await page.screenshot({path:'/tmp/sinkhole-payoff26-full-clear.png'});
 await page.locator('#return-menu').click();assert.ok(await page.locator('#world-best').isVisible());await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.ok(await page.locator('#world-best').isVisible());assert.match(await page.locator('#world-best').innerText(),/WORLD CLEARED/);
 const routes=[];
 for(const world of ['metro','basecamp','deep','alien','orbit']){
  await page.evaluate(world=>__qa.chooseWorld(world),world);
  const shapes=await page.evaluate(async()=>{const {sourceKey}=await import('/games/sinkhole-city/metro/world-dressing.js?v=identity23');return Object.fromEntries(__qa.run.objects.map(o=>[sourceKey(o),o.shape]));});
  const r=new DistrictRun({world,free:true});for(const o of r.objects)o.shape=shapes[sourceKey(o)];drive(r,900);
  const left=r.objects.filter(o=>o.phase!=='consumed').map(o=>({type:o.type,phase:o.phase,radius:o.radius,x:o.x,z:o.z,body:o.body,shape:o.shape,player:r.player}));
  console.log('FULL CLEAR',world,r.eaten+'/'+r.total,Math.round(r.time)+'s',r.player.radius.toFixed(2),left);assert.ok(r.done&&r.won&&r.eaten===r.total,`${world} can be fully cleared with actual geometry`);routes.push({world,eaten:r.eaten,time:r.time});
 }
 await clickOption(page,'sound');await page.locator('#start').click();await page.waitForFunction(()=>__qa.audio.context?.state==='running');
 await page.evaluate(()=>{__qa.run.done=__qa.run.won=true;__qa.run.time=1;});await page.waitForFunction(()=>__qa.phase==='ended'&&__qa.audio.voices.size>0);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForFunction(()=>__qa.audio.context.state==='suspended');assert.equal(await page.evaluate(()=>__qa.audio.voices.size),0,'reward audio stops even when app hides on the results screen');
 assert.deepEqual(errors,[]);console.log('PASS: actual contract → reward screen → retained exploration, mobile fit, saved coverage and five-world full-clear reachability.',routes);
}finally{await browser.close();}
