import assert from 'node:assert/strict';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const base=process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197',page=await browser.newPage(),career=JSON.stringify({version:1,records:{cleanup:{medal:3,time:40,score:100}}});
 await page.addInitScript(career=>{if(!localStorage.getItem('sinkhole.metro.career.v1'))localStorage.setItem('sinkhole.metro.career.v1',career);},career);
 await page.route('**/metro/checkpoint.js*',route=>route.abort('failed'));
 await page.goto(base+'/games/sinkhole-city/metro/');await page.waitForFunction(()=>document.querySelector('#title-play').textContent==='Retry loading',{},{timeout:20000});assert.equal(await page.locator('#title-play').isEnabled(),true);
 await page.unroute('**/metro/checkpoint.js*');await page.locator('#title-play').click();await page.waitForFunction(()=>document.querySelector('#title-play').textContent==='Continue campaign');assert.equal(await page.evaluate(()=>localStorage.getItem('sinkhole.metro.career.v1')),career);
 await page.close();
 const slow=await browser.newPage();await slow.route('**/kenney-cars/*.glb',()=>{});await slow.goto(base+'/games/sinkhole-city/metro/');await slow.waitForFunction(()=>document.querySelector('#title-play').textContent==='Retry loading',{},{timeout:25000});assert.match(await slow.locator('#status').textContent(),/could not load/);await slow.close();
 console.log('PASS: failed module graph offers reload, retry retains progress, and stalled model requests reach a recoverable error.');
}finally{await browser.close();}
