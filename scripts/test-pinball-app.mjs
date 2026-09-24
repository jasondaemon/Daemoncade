import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PINBALL_BASE||'http://127.0.0.1:4197';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/rebuild/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const game=new Game();','const game=new Game();window.__qa=game;')});});
 await page.goto(base+'/games/pinball/app.html?install=1');
 const frame=page.frameLocator('#app-game');await frame.locator('#start').click();
 assert.equal(await page.locator('.app-bar').isVisible(),false);
 assert.equal(await page.locator('#app-guide').evaluate(e=>e.open),false);
 const child=page.frames().find(f=>f.url().includes('/rebuild/'));assert.ok(child);
 const surface=await child.evaluate(()=>({launch:getComputedStyle(document.querySelector('#launch')).touchAction,select:getComputedStyle(document.querySelector('.cabinet')).userSelect,zone:document.querySelector('#touchLeft').offsetWidth,stage:document.querySelector('.play-area').offsetWidth}));
 assert.equal(surface.launch,'none');assert.equal(surface.select,'none');assert.ok(Math.abs(surface.zone*2-surface.stage)<=1);
 const cdp=await context.newCDPSession(page),touch=(x,y,id)=>({x,y,id,radiusX:3,radiusY:3,force:1});
 const left=await frame.locator('#touchLeft').boundingBox(),right=await frame.locator('#touchRight').boundingBox(),launch=await frame.locator('#launch').boundingBox();
 const fingers=[touch(left.x+30,left.y+60,1),touch(right.x+30,right.y+60,2)];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:fingers});
 assert.deepEqual(await child.evaluate(()=>__qa.physics.held),[true,true]);
 // Captured fingers can leave the original zones without swapping flippers.
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(right.x+80,right.y+60,1),touch(left.x+10,left.y+60,2)]});
 assert.deepEqual(await child.evaluate(()=>__qa.physics.held),[true,true]);
 await page.evaluate(()=>document.querySelector('#app-game').contentWindow.postMessage({type:'daemoncade:suspend'},location.origin));
 await child.waitForFunction(()=>__qa.paused);
 assert.deepEqual(await child.evaluate(()=>__qa.physics.held),[false,false]);
 assert.equal(await child.evaluate(()=>__qa.pointers.size),0);
 await child.waitForFunction(()=>__qa.audio.context.state==='suspended');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame.locator('#resume').click();
 // Pause while charging clears both charge and pointer ownership; release must not fire.
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(launch.x+20,launch.y+20,3)]});
 assert.equal(await child.evaluate(()=>__qa.charging),true);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await child.waitForFunction(()=>__qa.paused);
 assert.equal(await child.evaluate(()=>__qa.launchPointer),null);assert.equal(await child.evaluate(()=>__qa.charging),false);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame.locator('#resume').click();
 assert.equal(await child.evaluate(()=>__qa.phase),'ready');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(launch.x+20,launch.y+20,4)]});await page.waitForTimeout(600);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await child.evaluate(()=>__qa.phase),'playing');
 assert.ok(await child.evaluate(()=>!document.querySelector('.play-area').dispatchEvent(new Event('contextmenu',{bubbles:true,cancelable:true}))));
 assert.ok(await child.evaluate(()=>!document.querySelector('.play-area').dispatchEvent(new Event('gesturestart',{bubbles:true,cancelable:true}))));
 await page.screenshot({path:'/tmp/pinball-beta-app.png'});
 assert.deepEqual(errors,[]);console.log('PASS: installed app entry, immersive wrapper, enlarged touch zones, independent capture, crossed fingers, parent suspend/audio, interrupted charge recovery, context-menu/gesture protection.');
}finally{await browser.close();}
