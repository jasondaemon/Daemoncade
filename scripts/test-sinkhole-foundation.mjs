import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--autoplay-policy=no-user-gesture-required']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/sinkhole-city/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('  init();','  window.__qa={state,world,loop,startSolo,endGame,sceneAssets,backgroundMusic};init();')});});
 const url=process.env.SINKHOLE_URL||'http://127.0.0.1:4197/games/sinkhole-city/';
 await page.goto(url);await page.waitForLoadState('networkidle');
 assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.initiatorType==='img').length),0,'menu must not load world images');
 await page.locator('#soloButton').click();await page.waitForFunction(()=>__qa.state.mode==='countdown');
 const images=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.initiatorType==='img').map(x=>x.name));
 assert.equal(images.length,12);assert.ok(images.every(x=>x.includes('basecamp')));
 await page.evaluate(()=>window.postMessage({type:'daemoncade:suspend'},location.origin));await page.waitForFunction(()=>__qa.state.mode==='paused');
 const remaining=await page.evaluate(()=>__qa.state.countdownMs);await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>__qa.state.countdownMs),remaining);assert.equal(await page.evaluate(()=>__qa.backgroundMusic.paused),true);
 await page.locator('#resumeButton').click();await page.waitForFunction(()=>__qa.state.mode==='playing');
 const cdp=await context.newCDPSession(page);
 const touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 await touch('touchStart',[{id:1,x:140,y:650}]);await touch('touchMove',[{id:1,x:210,y:650}]);
 assert.ok(await page.evaluate(()=>__qa.state.input.x>.9));
 await touch('touchStart',[{id:1,x:210,y:650},{id:2,x:300,y:500}]);
 await touch('touchMove',[{id:1,x:210,y:650},{id:2,x:240,y:500}]);
 assert.ok(await page.evaluate(()=>__qa.state.input.x>.9),'secondary touch must not steal steering');
 await page.evaluate(()=>window.postMessage({type:'daemoncade:suspend'},location.origin));await page.waitForFunction(()=>__qa.state.mode==='paused');
 assert.deepEqual(await page.evaluate(()=>({x:__qa.state.input.x,id:__qa.state.input.pointerId,keys:__qa.state.input.keys.size,hidden:joystick.hidden,music:__qa.backgroundMusic.paused})),{x:0,id:null,keys:0,hidden:true,music:true});
 await touch('touchEnd',[]);await page.locator('#resumeButton').click();await page.locator('#pauseButton').click();
 await page.locator('#pauseScreen [data-audio="music"]').click();await page.locator('#pauseScreen [data-audio="sound"]').click();
 await page.locator('#resumeButton').click();assert.equal(await page.evaluate(()=>__qa.backgroundMusic.paused),true);
 await page.evaluate(()=>{Object.defineProperty(Storage.prototype,'setItem',{configurable:true,value(){throw Error('quota')}});__qa.endGame();});
 assert.equal(await page.locator('#endScreen').isVisible(),true);assert.match(await page.locator('#scoreMessage').innerText(),/unavailable/);assert.doesNotMatch(await page.locator('#endRank').innerText(),/wins/);
 await page.locator('#againButton').click();await page.locator('[data-scene="city"]').click();await page.locator('#soloButton').click();await page.waitForFunction(()=>__qa.state.mode==='countdown');
 const active=await page.evaluate(()=>__qa.sceneAssets.entries.filter(e=>e.image.hasAttribute('src')).map(e=>e.url));
 assert.equal(active.length,10);assert.ok(active.every(x=>x.includes('metro')||x.endsWith('basecamp.webp')));
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__qa.state.mode),'paused');assert.equal(await page.evaluate(()=>__qa.backgroundMusic.paused),true);
 for(const [world,count,prefix] of [['underwater',18,'deep-sink'],['space',26,'orbit-collapse'],['alien',18,'alien-world']]){
  await page.goto(url+'?world='+world);await page.locator('#soloButton').click();await page.waitForFunction(()=>__qa.state.mode==='countdown');
  const active=await page.evaluate(()=>__qa.sceneAssets.entries.filter(e=>e.image.hasAttribute('src')).map(e=>e.url));
  assert.equal(active.length,count,world);assert.ok(active.every(x=>x.includes(prefix)),world+' must not load other worlds');
  await page.evaluate(()=>window.postMessage({type:'daemoncade:suspend'},location.origin));await page.waitForFunction(()=>__qa.state.mode==='paused');
 }
 assert.deepEqual(errors,[]);console.log('PASS: lazy world assets, shared tree asset, countdown suspension, independent touch ownership, pause cleanup, audio preferences, blocked storage and scene switching.');
}finally{await browser.close();}
