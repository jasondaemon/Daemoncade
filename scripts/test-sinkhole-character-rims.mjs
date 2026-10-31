import assert from 'node:assert/strict';
import {ALL_CONTRACTS,RIMS} from '../games/sinkhole-city/metro/career.js';
import {enterWorldMenu,openCollection} from './sinkhole-menu-helpers.mjs';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(records=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'metro',sound:false}));},Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause};'});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=sculpt51`);await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 await openCollection(page);assert.match(await page.locator('.rim-coral').innerText(),/Frog/);assert.match(await page.locator('.rim-solar').innerText(),/Dragon/);
 assert.equal(await page.locator('#rims img').count(),11);await page.waitForFunction(()=>[...document.querySelectorAll('#rims img')].every(img=>img.complete&&img.naturalWidth===128));
 for(const r of RIMS){await page.locator(`.rim-${r.id}`).click();assert.equal(await page.locator(`.rim-${r.id}`).getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.preferences.v1')).rim),r.id);}
 const previews=await page.locator('#rims button').evaluateAll(buttons=>buttons.map(b=>({name:b.querySelector('span').textContent,src:b.querySelector('img').src})));
 await page.locator('.rim-coral').click();await page.screenshot({path:'/tmp/sinkhole-sculpt51-collection.png'});await page.locator('#close-locker').click();await page.locator('#free').click();
 await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;const r=__qa.run;r.player.radius=4;r.player.area=16;__qa.renderer.snapCamera(r);});
 for(const cosmetic of RIMS){
  const style=cosmetic.style||'plain',state=await page.evaluate(({style,color})=>{const v=__qa.renderer,r=__qa.run;v.setRim(color,style);v.render(r,0);return {radius:r.player.radius,colors:v.rimMaterial.vertexColors,count:v.well.children[2].geometry.attributes.position.count,calls:v.renderer.info.render.calls};},{style,color:cosmetic.color});
  assert.equal(state.radius,4);assert.equal(state.colors,style!=='plain');await page.screenshot({path:`/tmp/sinkhole-sculpt51-${style}.png`});
  for(const radius of [1.2,12,40]){
   const growth=await page.evaluate(({style,color,radius})=>{const v=__qa.renderer,r=__qa.run;r.player.radius=radius;r.player.area=radius*radius;v.setRim(color,style);v.render(r,0);return {opening:v.hole.z,headScale:v.well.children[2].scale.z};},{style,color:cosmetic.color,radius});
   assert.equal(growth.opening,radius);assert.equal(growth.headScale,style==='plain'?1:radius);
  }
  await page.evaluate(()=>{__qa.run.player.radius=4;__qa.run.player.area=16;});
 }
 await page.setViewportSize({width:800,height:760});await page.evaluate(()=>{
  const v=__qa.renderer,r=__qa.run;v.setRim(0xa4ece1,'serpent');v.render(r,0);
  v.camera.position.set(r.player.x,18,r.player.z+11);v.camera.lookAt(r.player.x,0,r.player.z-.4);v.renderer.render(v.scene,v.camera);
 });await page.screenshot({path:'/tmp/sinkhole-sculpt51-serpent-detail.png'});
 const resources=await page.evaluate(()=>{
  const v=__qa.renderer,before={...v.renderer.info.memory},urls=[...v.rimPreviews.values()];
  for(let pass=0;pass<4;pass++)for(const [key]of v.rimPreviews){const [style,color]=key.split(':');v.rimPreview(Number(color),style);}
  v.render(__qa.run,0);return {before,after:{...v.renderer.info.memory},previews:v.rimPreviews.size,distinct:new Set(urls).size,contexts:document.querySelectorAll('canvas[data-engine]').length};
 });assert.deepEqual(resources.before,resources.after);assert.equal(resources.previews,11);assert.equal(resources.distinct,11);assert.equal(resources.contexts,1);
 const gallery=await browser.newPage({viewport:{width:800,height:720}});await gallery.setContent(`<body style="margin:0;padding:20px;background:#0a1d28;color:#d6e5e8;font:15px system-ui;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${previews.map(p=>`<div style="background:#142c38;border-radius:14px;text-align:center;padding:8px"><img style="width:150px;height:160px;object-fit:contain" src="${p.src}"><div>${p.name}</div></div>`).join('')}</body>`);await gallery.screenshot({path:'/tmp/sinkhole-sculpt51-gallery.png'});
 assert.deepEqual(errors,[]);console.log('PASS: all eleven real collection selections/model previews, phone rendering, material transitions, stable preview resources and unchanged swallowing radius; screenshots saved.');
}finally{await browser.close();}
