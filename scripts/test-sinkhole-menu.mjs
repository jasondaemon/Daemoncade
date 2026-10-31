import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1180,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get phase(){return phase},get run(){return run},get audio(){return audio}};'});});
 await page.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=arcade38`);await page.waitForFunction(()=>!document.querySelector('#title-play').disabled);
 assert.equal(await page.locator('#title-play').textContent(),'Start game');assert.ok(await page.locator('#panel').isHidden());assert.ok(await page.locator('header').isHidden());
 const before=await page.evaluate(()=>localStorage.getItem('sinkhole.metro.career.v1'));
 for(const viewport of[{width:1180,height:760},{width:430,height:932},{width:360,height:640},{width:932,height:430}]){
  await page.setViewportSize(viewport);
  for(const id of['game-logo','title-play','title-settings','title-collection']){const b=await page.locator('#'+id).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1,`title ${id} ${JSON.stringify(viewport)}`);}
  await page.screenshot({path:`/tmp/sinkhole-arcade38-title-${viewport.width}.png`});
 }
 await page.locator('#title-settings').click();assert.ok(await page.locator('#options-menu').isVisible());await page.locator('#sound').click();await page.locator('#ambience').click();await page.keyboard.press('Escape');assert.ok(await page.locator('#options-menu').isHidden());assert.ok(await page.locator('#title-screen').isVisible());
 await page.locator('#title-play').click();assert.ok(await page.locator('#title-screen').isHidden());assert.ok(await page.locator('#panel').isVisible());assert.equal(await page.locator('#contracts button').count(),3);assert.ok(await page.locator('#sound').isHidden());assert.ok(await page.locator('#pace').isHidden());
 for(const viewport of[{width:1180,height:760},{width:430,height:932},{width:360,height:640},{width:932,height:430}]){
  await page.setViewportSize(viewport);
  for(const id of['back-title','worlds','title','contracts','start','customize']){const b=await page.locator('#'+id).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1,`world menu ${id} ${JSON.stringify(viewport)} ${JSON.stringify(b)}`);}
  await page.screenshot({path:`/tmp/sinkhole-arcade38-worlds-${viewport.width}.png`});
 }
 await page.locator('#medal-details summary').click();assert.ok(await page.locator('#pace').isVisible());await page.locator('#medal-details summary').click();
 await page.locator('#customize').click();assert.ok(await page.locator('#export-save').isHidden());await page.locator('#save-tools summary').click();assert.ok(await page.locator('#export-save').isVisible());await page.locator('#close-locker').click();
 await page.locator('#back-title').click();assert.equal(await page.evaluate(()=>localStorage.getItem('sinkhole.metro.career.v1')),before,'title navigation must not erase or create progress');
 await page.locator('#title-play').click();await page.locator('#start').click();assert.ok(await page.locator('header').isVisible());assert.ok(await page.locator('#title-screen').isHidden());
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__qa.phase),'paused');assert.ok(await page.locator('#back-title').isHidden());await page.screenshot({path:'/tmp/sinkhole-arcade38-pause.png'});
 await page.locator('#settings-open').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__qa.phase),'paused');await page.locator('#resume').click();assert.equal(await page.evaluate(()=>__qa.phase),'playing');
 await page.locator('#pause').click();await page.locator('#leave').click();
 await page.evaluate(()=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:40,score:100}}}));});await page.reload();await page.waitForFunction(()=>!document.querySelector('#title-play').disabled).catch(e=>{console.log('RELOAD ERRORS',errors);throw e;});assert.equal(await page.locator('#title-play').textContent(),'Continue campaign');assert.match(await page.locator('#title-progress').innerText(),/3 \/ 54/);
 assert.notEqual(await page.evaluate(()=>__qa.audio.context?.state),'running','menus do not autoplay audio');
 await page.locator('#title-play').click();assert.equal(await page.locator('#worlds button').nth(1).isDisabled(),false);assert.deepEqual(errors,[]);
 // A failed initial model load remains recoverable on the title screen.
 const failed=await browser.newPage({viewport:{width:430,height:932}});
 await failed.route('**/*.glb',route=>route.abort());
 await failed.goto(`${process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197'}/games/sinkhole-city/metro/?revision=arcade38`);await failed.waitForFunction(()=>document.querySelector('#title-play').textContent==='Retry loading');assert.ok(await failed.locator('#title-screen').isVisible());
 await failed.unroute('**/*.glb');await failed.locator('#title-play').click();await failed.waitForFunction(()=>document.querySelector('#title-play').textContent==='Start game');await failed.close();
 console.log('PASS: arcade title, non-destructive Continue, world/mission layout at four sizes, secondary options/save tools, pause/dialog keyboard isolation and no menu autoplay.');
}finally{await browser.close();}
