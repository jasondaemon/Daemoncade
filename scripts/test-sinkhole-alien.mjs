import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:40,score:500},'camp-cleanup':{medal:3,time:40,score:500},'deep-cleanup':{medal:3,time:40,score:500}}}));
  localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'alien',sound:false}));
 });
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+`\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},pause,chooseWorld,async routeContract(index){selected=index;start(false);pause();let target;const c=run.contract;for(let tick=0;tick<c.duration*60+1&&!run.done;tick++){const p=run.player,available=run.objects.filter(o=>run.eligible(o)),objective=available.filter(o=>c.kind==='clutter'?['shard','spore'].includes(o.type):c.kind==='cores'?['resonator','pod'].includes(o.type):['resonator','landmark'].includes(o.type));if(target?.phase==='consumed')target=null;if(!target)target=(objective.length?objective:available).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;}const result={won:run.won,time:run.time,counts:run.counts,relays:run.relays};resume();return result;}};`});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=groves30');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));assert.equal(await page.locator('#title').innerText(),'Resonance Basin');
 for(const viewport of[{width:360,height:640},{width:932,height:430},{width:430,height:932}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);
  const layout=await page.evaluate(()=>{const p=document.querySelector('#panel').getBoundingClientRect(),buttons=[...document.querySelectorAll('#worlds button')].map(b=>b.getBoundingClientRect());return {top:p.top,bottom:p.bottom,height:innerHeight,buttons:buttons.map(b=>({left:b.left,right:b.right}))};});
  assert.ok(layout.top>=0&&layout.bottom<=layout.height+1,JSON.stringify(layout));assert.ok(layout.buttons.every(b=>b.left>=0&&b.right<=viewport.width));
 }
 await page.screenshot({path:'/tmp/sinkhole-alien-menu.png'});
 const baseline=await page.evaluate(()=>({g:__qa.renderer.renderer.info.memory.geometries,t:__qa.renderer.renderer.info.memory.textures}));
 for(const id of['metro','basecamp','deep','alien','metro','alien'])await page.evaluate(id=>__qa.chooseWorld(id),id);
 assert.deepEqual(await page.evaluate(()=>({g:__qa.renderer.renderer.info.memory.geometries,t:__qa.renderer.renderer.info.memory.textures})),baseline);
 await page.locator('#free').click();await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;});
 await page.screenshot({path:'/tmp/sinkhole-alien-play.png'});
 const frozen=await page.evaluate(()=>({time:__qa.run.time,span:__qa.renderer.growthCamera.span}));await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>({time:__qa.run.time,span:__qa.renderer.growthCamera.span})),frozen);
 await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer,o=r.objects.find(o=>o.relay);r.player.x=o.x;r.player.z=o.z;r.player.radius=3;r.player.area=9;v.snapCamera(r);v.render(r,0);});
 await page.screenshot({path:'/tmp/sinkhole-groves30-sealed.png'});
 const veins=await page.evaluate(()=>{
  const r=__qa.run,v=__qa.renderer,relay=r.objects.find(o=>o.relay);
  for(let i=0;i<300&&relay.phase!=='consumed';i++)r.collect(r,1/60);
  v.render(r,0);const initial=Array.from(v.alienCharges.value);
  for(let i=0;i<24;i++)r.step(1/60,{x:0,y:0});v.render(r,0);const half=Array.from(v.alienCharges.value);
  for(let i=0;i<24;i++)r.step(1/60,{x:0,y:0});v.render(r,0);
  let petalParts=0;v.sources.get('pod').traverse(m=>{if(m.isMesh&&m.userData.petal)petalParts++;});
  const pod=v.batches.find(b=>b.type==='pod').mesh.geometry.attributes.podOpenOffset;
  return {captured:relay.phase==='consumed',initial,half,final:Array.from(v.alienCharges.value),petalParts,animated:pod.array.some(n=>Math.abs(n)>.01),memory:{g:v.renderer.info.memory.geometries,t:v.renderer.info.memory.textures},calls:v.renderer.info.render.calls};
 });
 assert.ok(veins.captured&&veins.animated);assert.equal(veins.petalParts,12,'six shell surfaces and six attached ribs animate');assert.deepEqual(veins.initial,[0,0,0,0,0,0]);
 assert.ok(Math.abs(veins.half[0]-.5)<.001);assert.deepEqual(veins.final,[1,0,0,0,0,0]);assert.deepEqual(veins.memory,baseline);assert.ok(veins.calls<60);
 await page.screenshot({path:'/tmp/sinkhole-groves30-open.png'});
 const pausedVeins=await page.evaluate(()=>({time:__qa.run.time,charges:Array.from(__qa.renderer.alienCharges.value)}));await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>({time:__qa.run.time,charges:Array.from(__qa.renderer.alienCharges.value)})),pausedVeins);
 await page.evaluate(()=>{const v=__qa.renderer;v.reduced=true;v.render(__qa.run,0);});assert.deepEqual(await page.evaluate(()=>Array.from(__qa.renderer.alienCharges.value)),veins.final);await page.evaluate(()=>{__qa.renderer.reduced=false;});
 await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer;for(const relay of r.objects.filter(o=>o.relay))r.consume(r,relay);r.player.radius=6;r.player.area=36;r.player.x=0;r.player.z=8;v.snapCamera(r);v.render(r,0);});
 await page.screenshot({path:'/tmp/sinkhole-alien-portal.png'});
 await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});
 const results=[];for(const index of[9,10,11]){const r=await page.evaluate(i=>__qa.routeContract(i),index);assert.equal(r.won,true,JSON.stringify(r));results.push(r);await page.waitForFunction(()=>__qa.phase==='ended');}
 assert.deepEqual(errors,[]);console.log('ALIEN',JSON.stringify({baseline,veins,results}));console.log('PASS: fourth-world loading, mobile fit, repeated world resource cleanup, native relay intake/local mineral-vein charge, attached animated shell detail, pause/reduced motion, activated portal and all actual-model contract routes.');
}finally{await browser.close();}
