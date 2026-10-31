import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:Object.fromEntries(['cleanup','camp-cleanup','deep-cleanup','alien-forage'].map(id=>[id,{medal:3,time:40,score:500}]))}));
  localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'metro',sound:false}));
 });
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},pause,chooseWorld};'});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=contact15`);await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#start').textContent(),'Start run',errors.join('\n'));
 const worlds=[];
 for(const id of['metro','basecamp','deep','alien','orbit']){
  await page.evaluate(id=>__qa.chooseWorld(id),id);
  const result=await page.evaluate(()=>{
   const v=__qa.renderer,r=__qa.run,ground=r.objects.filter(o=>!o.swim&&!o.orbital&&o.type!=='pod'),shapes=[...new Set(ground.map(o=>o.shape))];
   const before=ground[0]?.shape,memory=v.renderer.info.memory.geometries;v.reset(r);v.render(r,0);
   // Compile every live prop shader: ground clipping must never leak into props.
   const shaders=v.batches.map(b=>{const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>\n#include <begin_vertex>',fragmentShader:'#include <alphatest_fragment>\n#include <roughnessmap_fragment>'};b.mesh.material.onBeforeCompile(shader,v.renderer);return shader.fragmentShader;});
   const solid=shaders.every(s=>!s.includes('vCutWorld')&&!s.includes('gl_FragCoord')&&!s.includes('uniform vec3 hole;'));
   return {world:r.world,solid,profiles:shapes.length,valid:shapes.every(s=>s.profile==='model'&&s.supports.length<=12&&s.contacts.length<=36&&s.contacts.every(p=>Number.isFinite(p.x+p.y+p.z))),cached:!ground.length||r.objects.find(o=>o.id===ground[0].id).shape===before,memory,after:v.renderer.info.memory.geometries};
  });assert.equal(result.solid,true,'no enlarged circular cutaway on props in '+id);assert.equal(result.valid,true,JSON.stringify(result));assert.equal(result.cached,true);assert.equal(result.after,result.memory);worlds.push(result);
  if(id==='basecamp'){
   await page.evaluate(()=>{const r=__qa.run,v=__qa.renderer,o=r.objects.find(o=>o.type==='cabin');r.player.x=o.x+2;r.player.z=o.z-1;r.player.radius=2.3;r.player.area=2.3**2;document.querySelector('#panel').hidden=true;v.snapCamera(r);v.render(r,0);});
   await page.screenshot({path:'/tmp/sinkhole-solid36-cabin.png'});
   await page.evaluate(()=>{document.querySelector('#panel').hidden=false;});
  }
 }
 await page.evaluate(()=>__qa.chooseWorld('metro'));await page.locator('#free').click();
 await page.evaluate(()=>{const r=__qa.run,o=r.objects.find(o=>o.type==='building');r.player.x=o.x;r.player.z=o.z;r.player.vx=r.player.vz=0;__qa.renderer.snapCamera(r);});
 await page.waitForTimeout(250);assert.equal(await page.locator('#contact-hint,#target-pin').count(),0);assert.equal(await page.locator('#notice').isHidden(),true);
 await page.screenshot({path:'/tmp/sinkhole-contact-size.png'});
 for(const viewport of[{width:360,height:640},{width:932,height:430}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);assert.equal(await page.locator('#contact-hint,#target-pin').count(),0);assert.equal(await page.locator('#notice').isHidden(),true);
 }
 await page.locator('#pause').click();await page.locator('#resume').click();
 await page.evaluate(()=>{__qa.run.player.radius=6;__qa.run.player.area=36;});await page.waitForTimeout(250);assert.equal(await page.locator('#notice').isHidden(),true);
 await page.locator('#pause').click();await page.locator('#leave').click();await page.evaluate(()=>__qa.chooseWorld('alien'));await page.locator('#free').click();
 await page.evaluate(()=>{const r=__qa.run,pod=r.objects.find(o=>o.type==='pod');r.player.x=pod.x;r.player.z=pod.z;r.player.vx=r.player.vz=0;__qa.renderer.snapCamera(r);});
 await page.waitForTimeout(250);assert.equal(await page.locator('#contact-hint,#target-pin').count(),0);assert.equal(await page.locator('#notice').isHidden(),true);await page.screenshot({path:'/tmp/sinkhole-contact-sealed.png'});
 assert.deepEqual(errors,[]);console.log('CONTACT',JSON.stringify(worlds));console.log('PASS: bounded/cached model profiles, dedicated-mode isolation, and no instructional popups on start, blocked targets, growth, sealed pods or mobile orientation changes.');
}finally{await browser.close();}
