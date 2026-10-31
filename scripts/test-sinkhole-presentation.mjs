import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:Object.fromEntries(['cleanup','camp-cleanup','deep-cleanup','alien-forage'].map(id=>[id,{medal:3,time:40,score:500}]))}));
  localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'alien',sound:false}));
 });
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},pause,chooseWorld};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=quality14');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));
 await page.locator('#free').click();await page.waitForFunction(()=>__qa.phase==='playing');
 assert.equal(await page.locator('#target-pin,#contact-hint').count(),0);
 await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;const r=__qa.run,v=__qa.renderer,pod=r.objects.find(o=>o.type==='pod');r.time=0;r.player.x=pod.x;r.player.z=pod.z+3;v.snapCamera(r);v.render(r,0);});
 const bounds=await page.evaluate(()=>{
  const b=__qa.renderer.batches.find(b=>b.type==='pod'),g=b.mesh.geometry,p=g.attributes.position,d=g.attributes.podOpenOffset,shape=b.objects[0].shape;let moving=0;
  for(let i=0;i<p.count;i++){
   if(Math.hypot(d.getX(i),d.getY(i),d.getZ(i))>.01)moving++;
   if(Math.abs(p.getX(i)+d.getX(i))>shape.width/2+.01||Math.abs(p.getZ(i)+d.getZ(i))>shape.depth/2+.01||p.getY(i)+d.getY(i)<-.01||p.getY(i)+d.getY(i)>shape.height+.01)return {valid:false,i,shape,point:[p.getX(i)+d.getX(i),p.getY(i)+d.getY(i),p.getZ(i)+d.getZ(i)]};
  }
  return {valid:true,moving,display:b.mesh.material.customProgramCacheKey(),depth:b.mesh.customDepthMaterial.customProgramCacheKey()};
 });
 assert.equal(bounds.valid,true,JSON.stringify(bounds));assert.ok(bounds.moving>100);assert.equal(bounds.display,bounds.depth);
 await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer,relay=r.objects.find(o=>o.relay);r.consume(r,relay);for(const e of r.events)v.signal(e,r);r.events.length=0;v.pulses.clear();v.render(r,0);});
 const closed=await page.locator('#world canvas').screenshot();await page.screenshot({path:'/tmp/sinkhole-pod-closed.png'});
 await page.evaluate(()=>{__qa.run.time=.35;__qa.renderer.render(__qa.run,0);});const half=await page.locator('#world canvas').screenshot();
 assert.notDeepEqual(half,closed,'pod vertices must actually animate, not just change a color or score label');
 await page.waitForTimeout(100);assert.deepEqual(await page.locator('#world canvas').screenshot(),half,'paused animation freezes');
 await page.evaluate(()=>{__qa.run.time=.9;__qa.renderer.render(__qa.run,0);});await page.screenshot({path:'/tmp/sinkhole-pod-open.png'});
 await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer;v.signal({type:'chain',object:r.objects.find(o=>o.relay)},r);r.time+=.35;v.render(r,0);});
 assert.ok(await page.evaluate(()=>__qa.renderer.pulses.items.some(i=>i.mesh.visible)));await page.screenshot({path:'/tmp/sinkhole-relay-pulse.png'});
 await page.evaluate(()=>__qa.renderer.quality(true));assert.equal(await page.evaluate(()=>__qa.renderer.pulses.items.filter(i=>i.mesh.visible).length),0);
 await page.evaluate(()=>{__qa.renderer.quality(false);__qa.renderer.reduced=true;__qa.run.time=0;__qa.renderer.render(__qa.run,0);});
 assert.ok(await page.evaluate(()=>{const b=__qa.renderer.batches.find(b=>b.type==='pod');return b.mesh.geometry.attributes.podOpening.getX(0)===1;}));
 const warmAlien=await page.evaluate(()=>({g:__qa.renderer.renderer.info.memory.geometries,t:__qa.renderer.renderer.info.memory.textures}));
 await page.evaluate(()=>{__qa.renderer.reduced=false;document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});await page.evaluate(()=>__qa.chooseWorld('orbit'));await page.locator('#free').click();await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;});
 const planetStats=[];
 for(const variant of['ocean','desert','ringed','ice']){
  const result=await page.evaluate(variant=>{
   const r=__qa.run,v=__qa.renderer,o=r.objects.find(o=>o.variant===variant),b=v.batches.find(b=>b.objects.includes(o)),colors=b.mesh.geometry.attributes.color,unique=new Set();
   for(let i=0;i<colors.count;i++)unique.add([colors.getX(i),colors.getY(i),colors.getZ(i)].map(n=>n.toFixed(2)).join(','));
   r.player.x=o.x;r.player.z=o.z+4;r.player.radius=1.2;v.snapCamera(r);v.render(r,0);return {unique:unique.size,cast:b.mesh.castShadow,calls:v.renderer.info.render.calls};
  },variant);assert.ok(result.unique>30);assert.equal(result.cast,false);planetStats.push({variant,...result});await page.screenshot({path:`/tmp/sinkhole-planet-${variant}.png`});
 }
 for(const id of['alien','orbit','alien','orbit','alien'])await page.evaluate(id=>__qa.chooseWorld(id),id);
 assert.deepEqual(await page.evaluate(()=>({g:__qa.renderer.renderer.info.memory.geometries,t:__qa.renderer.renderer.info.memory.textures})),warmAlien,'the warmed local-effect pool remains bounded across world switches');
 assert.deepEqual(errors,[]);console.log('PRESENTATION',JSON.stringify({bounds,planetStats,warmAlien}));console.log('PASS: real petal deformation and conservative bounds, shadow parity, pause/reduced motion, bounded/suppressible local effects, live target guidance and detailed shadow-free planets.');
}finally{await browser.close();}
