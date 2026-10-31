import {enterWorldMenu,openCollection} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
import {ALL_CONTRACTS} from '../games/sinkhole-city/metro/career.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(records=>{
  if(!localStorage.getItem('sinkhole.metro.career.v1'))localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records}));
  if(!localStorage.getItem('sinkhole.metro.preferences.v1'))localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'orbit',rim:'nova',sound:false}));
 },Object.fromEntries(ALL_CONTRACTS.slice(0,14).map(c=>[c.id,{medal:3,time:1,score:100}])));
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+`\nwindow.__qa={get run(){return run},get renderer(){return renderer},get phase(){return phase},get rim(){return rim},RIMS,pause};`});});
 const url=`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=mastery18`;await page.goto(url);await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);
 await openCollection(page);assert.equal(await page.locator('#rims button').count(),11);assert.match(await page.locator('#collection-progress').innerText(),/42.*Eclipse.*45.*3 to go/);assert.equal(await page.locator('.rim-eclipse').isDisabled(),true);
 for(const viewport of[{width:360,height:640},{width:932,height:430},{width:430,height:932}]){
  await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>{const d=document.querySelector('#locker').getBoundingClientRect();return d.top>=0&&d.bottom<=innerHeight+1&&d.left>=0&&d.right<=innerWidth+1;}));
  await page.locator('#close-locker').click();await openCollection(page);await page.locator('#export-save').scrollIntoViewIfNeeded();assert.ok(await page.locator('#export-save').isVisible());await page.locator('#close-locker').scrollIntoViewIfNeeded();
 }
 await page.locator('#close-locker').click();await page.locator('#start').click();await page.evaluate(()=>{__qa.run.won=__qa.run.done=true;__qa.run.time=1;});await page.waitForFunction(()=>__qa.phase==='ended');
 assert.match(await page.locator('#description').innerText(),/Unlocked: Eclipse rim/);assert.match(await page.locator('#title').innerText(),/Contract complete/);
 for(const viewport of[{width:360,height:640},{width:932,height:430}]){await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>{const d=document.querySelector('#panel .card').getBoundingClientRect();return d.top>=0&&d.bottom<=innerHeight+1;}),'mastery result fits without cutting off its controls');}
 await page.setViewportSize({width:430,height:932});await openCollection(page);assert.match(await page.locator('#collection-progress').innerText(),/45.*Singularity.*54/);await page.locator('.rim-eclipse').click();assert.equal(await page.locator('.rim-eclipse').getAttribute('aria-pressed'),'true');
 const stats=await page.evaluate(()=>{
  const v=__qa.renderer,styles=new Set(),rivals=v.rivalWells.map(w=>w.children[2].geometry);
  for(const r of __qa.RIMS){v.setRim(r.color,r.style);styles.add(v.well.children[2].geometry);}
  const memory=v.renderer.info.memory.geometries,calls=v.renderer.info.render.calls;
  for(let pass=0;pass<4;pass++)for(const r of __qa.RIMS)v.setRim(r.color,r.style);
  return {styles:styles.size,memory,after:v.renderer.info.memory.geometries,calls,afterCalls:v.renderer.info.render.calls,rivalsUnchanged:v.rivalWells.every((w,i)=>w.children[2].geometry===rivals[i])};
 });assert.equal(stats.styles,11);assert.equal(stats.after,stats.memory);assert.equal(stats.afterCalls,stats.calls);assert.equal(stats.rivalsUnchanged,true);
 await page.screenshot({path:'/tmp/sinkhole-mastery18-collection.png'});
 await page.locator('#close-locker').click();await page.locator('#free').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>__qa.run.player.radius),1.2);await page.screenshot({path:'/tmp/sinkhole-mastery18-play.png'});
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.evaluate(()=>__qa.rim),'eclipse');
 await openCollection(page);await page.locator('#import-save').setInputFiles({name:'fresh.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'sinkhole-city-metro',version:1,career:{version:1,records:{}}}))});await page.locator('#apply-save').click();await page.waitForFunction(()=>__qa.rim==='mint');assert.equal(await page.locator('.rim-eclipse').isDisabled(),true);assert.match(await page.locator('#collection-progress').innerText(),/0.*Treasure Mimic.*3/);
 await page.locator('#close-locker').click();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);await page.locator('#free').click();assert.equal(await page.locator('#target-pin,#contact-hint').count(),0);assert.equal(await page.locator('#notice').isHidden(),true);
 await page.locator('#pause').click();await page.locator('#leave').click();await openCollection(page);
 await page.locator('#import-save').setInputFiles({name:'mastered.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'sinkhole-city-metro',version:1,career:{version:1,records:Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}]))}}))});await page.locator('#apply-save').click();assert.equal(await page.locator('.rim-singularity').isDisabled(),false);await page.locator('.rim-singularity').click();assert.equal(await page.locator('.rim-singularity').getAttribute('aria-pressed'),'true');assert.match(await page.locator('#collection-progress').innerText(),/54.*Collection complete/);await page.screenshot({path:'/tmp/sinkhole-release48-singularity.png'});
 assert.deepEqual(errors,[]);console.log('MASTERY',stats);console.log('PASS: 54-medal capstone, prior unlocks, persistence/import downgrade, mobile fit, eleven cached one-draw styles, unchanged rivals and quiet play.');
}finally{await browser.close();}
