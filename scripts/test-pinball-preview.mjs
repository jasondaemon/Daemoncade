import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 // Inspection and fixtures are injected only into this isolated browser response.
 await page.route('**/rebuild/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('const game=new Game();','const game=new Game();window.__qa=game;')});});
 await page.goto(process.env.PINBALL_URL||'http://127.0.0.1:4197/games/pinball/rebuild/');await page.locator('#start').click();
 await page.waitForTimeout(1800);assert.equal(await page.evaluate(()=>__qa.rules.ballNumber),1);
 assert.equal(await page.evaluate(()=>__qa.phase),'ready');
 const cdp=await page.context().newCDPSession(page);
 const launch=await page.locator('#launch').boundingBox();
 const touch=(x,y,id=1)=>({x,y,id,radiusX:4,radiusY:4,force:1});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(launch.x+40,launch.y+20)]});await page.waitForTimeout(500);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await page.evaluate(()=>__qa.phase),'ready');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(launch.x+40,launch.y+20)]});await page.waitForTimeout(800);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>__qa.phase),'playing');
 const l=await page.locator('#touchLeft').boundingBox(),r=await page.locator('#touchRight').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(l.x+30,l.y+50,1),touch(r.x+30,r.y+50,2)]});
 assert.deepEqual(await page.evaluate(()=>__qa.physics.held),[true,true]);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.deepEqual(await page.evaluate(()=>__qa.physics.held),[false,false]);
 await page.waitForTimeout(1500);assert.ok(await page.evaluate(()=>__qa.rules.score)>0,'live launch should score');
 await page.screenshot({path:'/tmp/pinball-preview-mobile.png'});
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.ok(await page.evaluate(()=>__qa.paused));
 await page.waitForFunction(()=>__qa.audio.context.state==='suspended');await page.locator('#resume').click();assert.equal(await page.evaluate(()=>__qa.paused),false);
 // Earn target banks, capture each lock, and execute scheduled serves through their actual callbacks.
 const multiball=await page.evaluate(()=>{
  const g=__qa;g.start();g.phase='playing';g.launchBall=null;
  const pending=()=>{const due=g.pending;g.pending=[];due.forEach(e=>e.fn());};
  for(let lock=0;lock<3;lock++){for(let i=0;i<3;i++)g.rules.hit({type:'target',id:i});g.hit({type:'scoop'},g.physics.balls[0]);pending();g.phase='playing';g.launchBall=null;}
  return {active:g.physics.balls.length,multiball:g.rules.multiball,locks:g.rules.locks};
 });assert.deepEqual(multiball,{active:3,multiball:true,locks:3});
 await page.waitForTimeout(150);await page.screenshot({path:'/tmp/pinball-preview-multiball.png'});
 const lifecycle=await page.evaluate(()=>{
  const g=__qa;g.saveUntil=g.physics.time+5;g.drain(g.physics.balls[0]);const saving=g.physics.balls.length===2&&g.pending.length===1;
  let due=g.pending;g.pending=[];due.forEach(e=>e.fn());const replaced=g.physics.balls.length===3;
  g.saveUntil=0;g.drain(g.physics.balls[0]);g.drain(g.physics.balls[0]);const one=g.physics.balls.length===1&&!g.rules.multiball&&g.rules.ballNumber===1;
  g.drain(g.physics.balls[0]);due=g.pending;g.pending=[];due.forEach(e=>e.fn());const next=g.rules.ballNumber===2&&g.phase==='ready';
  g.rules.ballNumber=g.rules.ballsTotal;g.phase='playing';g.launchBall=null;g.drain(g.physics.balls[0]);due=g.pending;g.pending=[];due.forEach(e=>e.fn());
  return {saving,replaced,one,next,over:g.phase==='over'};
 });assert.ok(Object.values(lifecycle).every(Boolean),JSON.stringify(lifecycle));
 await page.locator('#restart').click();assert.equal(await page.evaluate(()=>__qa.rules.score),0);
 for(const size of [{width:390,height:667},{width:430,height:932},{width:932,height:430},{width:1440,height:1000}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);
  const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight+1,footer:document.getElementById('launch').getBoundingClientRect().bottom,stage:document.getElementById('table').getBoundingClientRect().height}));
  assert.equal(layout.scroll,false);assert.ok(layout.footer<=size.height+1);assert.ok(layout.stage>100);
 }
 assert.deepEqual(errors,[]);console.log('PASS: mobile launch/cancel, multitouch flippers, live scoring, pause/audio resume, three locks, multiball saves/drains, results/restart, responsive layouts.');
}finally{await browser.close();}
