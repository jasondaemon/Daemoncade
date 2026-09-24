import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/rebuild/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const game=new Game();','const game=new Game();window.__qa=game;')});});
 await page.goto(process.env.PINBALL_URL||'http://127.0.0.1:4197/games/pinball/rebuild/');await page.locator('#start').click();
 assert.equal(await page.locator('.display-shell').isVisible(),false);
 await page.screenshot({path:'/tmp/pinball-beta3-table.png'});
 await page.evaluate(()=>{__qa.phase='playing';__qa.launchBall=null;__qa.hit({type:'mode-scoop'},__qa.physics.balls[0]);});
 await page.locator('[data-mode="redline"]').click();
 await page.waitForFunction(()=>document.body.classList.contains('cinematic'));
 assert.equal(await page.evaluate(()=>__qa.physics.balls.length),0);
 const time=await page.evaluate(()=>__qa.physics.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__qa.physics.time),time);
 await page.screenshot({path:'/tmp/pinball-beta3-display.png'});
 await page.waitForFunction(()=>__qa.physics.balls.length===1);assert.equal(await page.evaluate(()=>__qa.rules.mode),'redline');
 assert.equal(await page.locator('.display-shell').isVisible(),false);
 // Even a high-priority display request must not interrupt live multiball.
 await page.evaluate(()=>{__qa.physics.addBall(0,10);__qa.ruleEvent({type:'multiball',title:'MULTIBALL',priority:8});});
 await page.waitForTimeout(150);assert.equal(await page.locator('.display-shell').isVisible(),false);
 await page.locator('#camera').click();assert.equal(await page.locator('#camera').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{__qa.rules.lockLit=true;});await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>__qa.physics.targetColliders.every(c=>!c.isEnabled())));
 assert.deepEqual(errors,[]);console.log('PASS: playfield-first layout, selectable pit-stop modes, safe display hold/release, no multiball interruption, fixed-view toggle, opening garage.');
}finally{await browser.close();}
