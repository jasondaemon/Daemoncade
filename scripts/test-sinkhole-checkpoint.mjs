import assert from 'node:assert/strict';
import {ALL_CONTRACTS,WORLDS} from '../games/sinkhole-city/metro/worlds.js';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
const base=process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(records=>{if(!localStorage.getItem('sinkhole.metro.career.v1'))localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));if(!localStorage.getItem('sinkhole.metro.preferences.v1'))localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false,music:false,ambience:false}));},Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__qa={get run(){return run},get phase(){return phase},get renderer(){return renderer},chooseWorld,pause,checkpoint};'});});
 const url=base+'/games/sinkhole-city/metro/?revision=release48';await page.goto(url);await page.waitForFunction(()=>!document.querySelector('#title-play').disabled);await page.locator('#title-play').click();
 const results=[];
 for(const world of WORLDS.map(w=>w.id)){
  await page.evaluate(world=>__qa.chooseWorld(world),world);await page.locator('#free').click();await page.locator('#pause').click();
  const before=await page.evaluate(()=>{const r=__qa.run,o=r.objects.find(o=>r.eligible(o));r.player.x=o.x;r.player.z=o.z;for(let i=0;i<120;i++)r.step(1/60,{x:.1,y:0});__qa.checkpoint();return JSON.parse(localStorage.getItem('sinkhole.metro.run.v1'));});
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#title-play').disabled);assert.equal(await page.locator('#title-play').textContent(),'Resume run');
  for(const viewport of[{width:360,height:640},{width:932,height:430},{width:390,height:844}]){await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>['title-play','title-browse'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;})));}
  await page.locator('#title-play').click();await page.waitForFunction(()=>__qa.phase==='paused').catch(async e=>{console.log('RESTORE FAILURE',world,errors,await page.evaluate(()=>({phase:__qa.phase,title:document.querySelector('#title').textContent,description:document.querySelector('#description').textContent,status:document.querySelector('#status').textContent})));throw e;});
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.run.v1')));assert.deepEqual(after,before,world+' exact checkpoint round trip');
  const time=await page.evaluate(()=>__qa.run.time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__qa.run.time),time);assert.equal(await page.evaluate(()=>[...document.querySelectorAll('audio')].some(a=>!a.paused)),false);
  results.push({world,objects:before.objects.length,bytes:JSON.stringify(before).length,eaten:before.state.eaten});
  await page.locator('#resume').click();await page.waitForFunction(time=>__qa.run.time>time,time);await page.locator('#pause').click();await page.locator('#leave').click();assert.equal(await page.evaluate(()=>localStorage.getItem('sinkhole.metro.run.v1')),null);
 }
 // A saved run can be browsed without being lost; replacement requires an
 // explicit choice, and cancelling keeps the exact checkpoint bytes.
 await page.locator('#free').click();await page.locator('#pause').click();await page.reload();await page.waitForFunction(()=>!document.querySelector('#title-play').disabled);
 const bytes=await page.evaluate(()=>localStorage.getItem('sinkhole.metro.run.v1'));await page.locator('#title-browse').click();await page.locator('#free').click();assert.equal(await page.locator('#replace-run').isVisible(),true);await page.locator('#cancel-replace').click();assert.equal(await page.evaluate(()=>localStorage.getItem('sinkhole.metro.run.v1')),bytes);await page.locator('#free').click();await page.locator('#confirm-replace').click();await page.waitForFunction(()=>__qa.phase==='playing');
 assert.deepEqual(errors,[]);console.log(results);console.log('PASS: six native-model run reloads, frozen restored clock/audio, saved-run phone layouts, explicit replacement and end-run cleanup.');
}finally{await browser.close();}
