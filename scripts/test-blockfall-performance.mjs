import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:430,height:900},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Fixtures and counters exist only in the intercepted test response.
 await page.route('**/blockfall/game.js*',async route=>{
  const r=await route.fetch();let src=await r.text();
  src=src.replace('  function draw() {','  let drawCount=0,statusCount=0;\n  function draw() { drawCount++;');
  src=src.replace('  function updateStatus(extra = "") {','  function updateStatus(extra = "") {statusCount++;');
  src=src.replace('  main();',`window.__perf={state,reset:()=>resetEngine('endless'),theme:applyTheme,pause:pauseGame,drop:hardDrop,
   fixture(){state.board=emptyBoard();for(let y=18;y<22;y++)state.board[y]=Array.from({length:10},(_,x)=>x===4?'':'J');state.piece={shape:'I',rot:1,x:2,y:2};state.clearAnimation=null;state.dropAccumulator=0;},
   stats(){return {drawCount,statusCount,particles:particles.length,cache:cellCache.size,lines:state.lines,clearing:!!state.clearAnimation,piece:!!state.piece,width:boardCanvas.width,cssWidth:boardCanvas.getBoundingClientRect().width};}};\n  main();`);
  await route.fulfill({response:r,body:src});
 });
 await page.goto(process.env.BLOCKFALL_URL||'http://127.0.0.1:4197/games/blockfall/');
 await page.locator('#startMode').click();await page.clock.install();
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 for(const theme of ['modern','eightbit','gameboy']){
  await page.evaluate(theme=>{__perf.theme(theme);__perf.reset();},theme);
  for(let i=0;i<12;i++){
   const before=await page.evaluate(()=>{__perf.fixture();return __perf.stats();});
   await page.evaluate(()=>__perf.drop());
   const during=await page.evaluate(()=>__perf.stats());assert.ok(during.statusCount-before.statusCount<=2,'Hard drop updates HUD once, not per row');
   assert.ok(during.particles<=128,'Particle budget bounded');
   await page.clock.runFor(300);
   const after=await page.evaluate(()=>__perf.stats());assert.equal(after.clearing,false);assert.equal(after.piece,true);assert.equal(after.lines,before.lines+4);
   assert.equal(await page.locator('.cabinet-particle').count(),0);
   assert.equal(await page.locator('#gamePanel').evaluate(e=>getComputedStyle(e,'::after').content),'none');
   if(i===0)await page.screenshot({path:`/tmp/blockfall-perf-${theme}.png`});
  }
  await page.clock.runFor(2000);assert.equal(await page.evaluate(()=>__perf.stats().particles),0);
 }
 // Restart repeatedly, then observe how many board redraws one idle second makes.
 await page.evaluate(()=>{for(let i=0;i<8;i++)__perf.reset();});
 const before=await page.evaluate(()=>__perf.stats());await page.clock.runFor(1000);const after=await page.evaluate(()=>__perf.stats());
 assert.ok(after.drawCount-before.drawCount<=8,'Idle board should not redraw at display refresh rate or multiply on restart');
 assert.ok(after.width<=after.cssWidth*2+1,'DPR capped at 2');assert.ok(after.cache<=192);
 await page.evaluate(()=>{__perf.fixture();__perf.drop();__perf.pause(true);});
 assert.equal(await page.evaluate(()=>__perf.stats().particles),0);
 await page.clock.runFor(2000);await page.evaluate(()=>__perf.pause(false));await page.clock.runFor(300);
 assert.equal(await page.evaluate(()=>__perf.stats().clearing),false);
 assert.deepEqual(errors,[]);console.log('PASS: 36 four-line clears across all themes at 4× CPU slowdown; bounded particles/cache; no white overlay; restart/idle/pause recovery; DPR cap.');
}finally{await browser.close();}
