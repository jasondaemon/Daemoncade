import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.addInitScript(()=>{
  localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:40,score:500},'camp-cleanup':{medal:3,time:40,score:500},'deep-cleanup':{medal:3,time:40,score:500},'alien-forage':{medal:3,time:40,score:500}}}));
  localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'metro',sound:false}));
 });
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},pause};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=framing11');await page.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:30000});await enterWorldMenu(page);
 const measurements=[];
 for(const [world,index]of[['metro',0],['basecamp',1],['deep',2],['alien',3],['orbit',4]]){
  await page.locator('#worlds button').nth(index).click();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));
  await page.locator('#free').click();await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;});
  for(const [orientation,viewport]of[['portrait',{width:430,height:932}],['landscape',{width:932,height:430}]]){
   await page.setViewportSize(viewport);
   await page.waitForFunction(({width,height})=>Math.abs(__qa.renderer.camera.aspect-width/height)<.00001,viewport);
   let previous=0;
   for(const radius of[1.2,4,8.5]){
    const result=await page.evaluate(radius=>{
     const v=__qa.renderer,r=__qa.run;r.player.radius=radius;r.player.area=radius**2;
     const before=v.growthCamera.span;v.render(r,1/60);const first=v.growthCamera.span;
     for(let i=0;i<150;i++)v.growthCamera.update(r.world,radius,1/30,v.reduced);v.render(r,0);
     const points=Array.from({length:64},(_,i)=>{const a=i*Math.PI/32;return v.offset.clone().set(r.player.x+Math.cos(a)*radius,.075,r.player.z+Math.sin(a)*radius).project(v.camera);});
     const x=points.map(p=>(p.x+1)/2),y=points.map(p=>(1-p.y)/2),frame=v.growthCamera.framing(v.camera.aspect);
     document.querySelector('#stage').textContent=r.world;document.querySelector('#progress').textContent=`Radius ${radius}`;
     return {span:v.growthCamera.span,before,first,minX:Math.min(...x),maxX:Math.max(...x),minY:Math.min(...y),maxY:Math.max(...y),distance:v.camera.position.distanceTo(v.offset.clone().set(v.look.x,0,v.look.z-frame.lead)),near:v.scene.fog.near,far:v.scene.fog.far,calls:v.renderer.info.render.calls,time:r.time};
    },radius);
    assert.ok(result.span>previous);previous=result.span;
    if(radius!==1.2)assert.ok(result.first<result.span-.5,'a large growth reward must not cut instantly to the new camera distance');
    assert.ok(result.minX>.035&&result.maxX<.965,`${world}/${orientation}/${radius}: hole must fit horizontally`);
    assert.ok(result.minY>.32&&result.maxY<.88,`${world}/${orientation}/${radius}: hole stays below HUD and above bottom controls`);
    assert.ok(result.distance<result.near&&result.near<result.far,'fog must not obscure the player when zoomed out');
    assert.ok(result.calls<100);measurements.push({world,orientation,radius,span:Math.round(result.span*10)/10,holeWidth:Math.round((result.maxX-result.minX)*100)+'%'});
    await page.screenshot({path:`/tmp/sinkhole-camera-${world}-${orientation}-${radius}.png`});
   }
   const frozen=await page.evaluate(()=>({span:__qa.renderer.growthCamera.span,time:__qa.run.time,camera:__qa.renderer.camera.position.toArray()}));
   await page.waitForTimeout(80);assert.deepEqual(await page.evaluate(()=>({span:__qa.renderer.growthCamera.span,time:__qa.run.time,camera:__qa.renderer.camera.position.toArray()})),frozen);
  }
   const zoomBeforeResize=await page.evaluate(()=>__qa.renderer.growthCamera.span);await page.setViewportSize({width:360,height:640});await page.waitForFunction(()=>Math.abs(__qa.renderer.camera.aspect-360/640)<.00001);
  assert.equal(await page.evaluate(()=>__qa.renderer.growthCamera.span),zoomBeforeResize,'paused orientation redraw must preserve the displayed zoom');
  for(const [x,z]of[[-51,-51],[51,51]]){
   assert.ok(await page.evaluate(({x,z})=>{const v=__qa.renderer,r=__qa.run;r.player.x=x;r.player.z=z;v.snapCamera(r);v.render(r,0);const p=v.screenPosition(r.player);return p.visible&&p.x>10&&p.x<90&&p.y>32&&p.y<88;},{x,z}),'map-edge player remains in the playable screen area');
  }
  await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});await page.locator('#free').click();await page.evaluate(()=>__qa.pause());
  const initial=await page.evaluate(()=>({radius:__qa.run.player.radius,span:__qa.renderer.growthCamera.span}));assert.equal(initial.radius,1.2);assert.ok(initial.span<=20,'new runs must not inherit the previous maximum zoom');
  await page.locator('#leave').click();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('GROWTH CAMERA',measurements);console.log('PASS: per-world growth curves, smooth reward zoom, portrait/landscape framing, HUD clearance, pause/resize stability, fog and new-run reset.');
}finally{await browser.close();}
