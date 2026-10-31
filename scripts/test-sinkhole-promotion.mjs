import assert from 'node:assert/strict';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
const base=process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4201';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  if(!localStorage.getItem('sinkhole.metro.career.v1'))localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:90,score:500,rulesVersion:4}}}));
  localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false,music:false,ambience:false}));
  localStorage.setItem('jasondaemon.sinkhole-city.best.v1','12345');localStorage.setItem('jasondaemon.sinkhole-city.best-by-scene.v1','{"metro":12345}');
 });
 await page.goto(base+'/games/sinkhole-city/?release=1.0.0');await page.waitForFunction(()=>document.querySelector('#title-play')?.textContent==='Continue campaign');
 assert.match(page.url(),/\/sinkhole-city\/metro\//);assert.equal(await page.title(),'Sinkhole City · 1.0.0');assert.match(await page.locator('.title-edition').innerText(),/1\.0\.0/);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sinkhole.metro.career.v1')).records.cleanup.medal),3);
 assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('jasondaemon.sinkhole-city.best.v1'),localStorage.getItem('jasondaemon.sinkhole-city.best-by-scene.v1')]),['12345','{"metro":12345}']);
 const game=await page.evaluate(async()=>{const response=await fetch('../game.json?release=1.0.0');return response.json();});assert.equal(game.version,'1.0.0');assert.equal(game.release_stage,'stable');
 const legacy=await page.request.get(base+'/games/sinkhole-city/legacy.html');assert.equal(legacy.status(),200);assert.match(await legacy.text(),/game\.js\?v=20260824-37/);
 const manifest=await page.evaluate(async()=>await(await fetch('../app-manifest.json')).json());assert.equal(manifest.id,'/games/sinkhole-city/app.html');assert.equal(manifest.icons[0].src,'app-icon.png');
 await page.locator('#title-play').click();await page.locator('#free').click();await page.locator('#pause').click();assert.ok(await page.locator('#resume').isVisible());assert.deepEqual(errors,[]);
 console.log('PASS: stable default redirect, accepted 3D version, catalog record, campaign and legacy save preservation, retained beta route, unchanged app identity, playable/pause loop.');
}finally{await browser.close();}
