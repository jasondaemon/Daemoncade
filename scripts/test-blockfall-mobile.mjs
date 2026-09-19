import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:430,height:900},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Read-only inspection added to this isolated test response, never production.
 await page.route('**/blockfall/game.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('  main();','  window.__blockfallQA = {get state(){return state;}};\n  main();')});});
 await page.goto(process.env.BLOCKFALL_URL||'http://127.0.0.1:4197/games/blockfall/');
 await page.locator('#startMode').click();
 await page.waitForFunction(()=>window.__blockfallQA.state.running);
 await page.waitForFunction(()=>!window.__blockfallQA.state.musicAudio.paused);
 await page.clock.install();
 const state=()=>page.evaluate(()=>{const s=window.__blockfallQA.state;return {x:s.piece.x,shape:s.piece.shape,rot:s.piece.rot,board:JSON.stringify(s.board),score:s.score,paused:s.paused,musicPaused:s.musicAudio.paused};});
 const board=await page.locator('#boardCanvas').boundingBox(),x=board.x+board.width/2,y=board.y+board.height*.3;
 const c=await page.context().newCDPSession(page);
 const touch=(type,points)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 let before=await state();
 await touch('touchStart',[{x,y,id:1}]);await touch('touchMove',[{x:x+board.width*.21,y:y+2,id:1}]);await touch('touchEnd',[]);
 assert.equal((await state()).x,before.x+2);
 before=await state();await touch('touchStart',[{x,y,id:2}]);await touch('touchEnd',[]);if(before.shape!=='O')assert.notEqual((await state()).rot,before.rot);
 before=await state();await touch('touchStart',[{x,y,id:3}]);await touch('touchMove',[{x,y:y+80,id:3}]);assert.equal((await state()).board,before.board);await touch('touchEnd',[]);assert.notEqual((await state()).board,before.board);
 before=await state();await touch('touchStart',[{x,y,id:4}]);await touch('touchMove',[{x,y:y+80,id:4}]);await touch('touchCancel',[]);assert.equal((await state()).board,before.board);
 assert.equal(await page.locator('[data-control="hard"]').isVisible(),false);
 assert.equal(await page.locator('[data-control="rotate"]').isVisible(),false);
 assert.equal(await page.locator('[data-control="hold"]').isVisible(),true);
 const soft=await page.locator('[data-control="soft"]').boundingBox();
 assert.ok(soft.y+soft.height<=900,'Soft-down stays inside mobile viewport');
 await touch('touchStart',[{x:soft.x+soft.width/2,y:soft.y+soft.height/2,id:5}]);await page.clock.runFor(450);await touch('touchEnd',[]);
 assert.ok((await state()).score>before.score,'Soft-down repeats while held');
 const score=(await state()).score;await page.clock.runFor(350);assert.equal((await state()).score,score,'Repeat stops after release');
 await page.screenshot({path:'/tmp/blockfall-mobile-gestures.png'});
 await page.evaluate(()=>dispatchEvent(new Event('pagehide')));
 assert.equal((await state()).paused,true);assert.equal((await state()).musicPaused,true);
 await page.evaluate(()=>dispatchEvent(new Event('pageshow')));assert.equal((await state()).musicPaused,true,'No automatic music restart');
 await page.locator('#resumeGame').click();assert.equal((await state()).paused,false);
 await page.waitForFunction(()=>!window.__blockfallQA.state.musicAudio.paused);
 await page.evaluate(()=>dispatchEvent(new Event('blur')));assert.equal((await state()).musicPaused,true);assert.equal((await state()).paused,true);
 for(const [width,height] of [[390,667],[430,900]]){
  await page.setViewportSize({width,height});
  const rect=await page.locator('[data-control="soft"]').boundingBox();assert.ok(rect.y+rect.height<=height,`Soft down fits ${width}x${height}`);
 }
 assert.equal(await page.evaluate(()=>scrollY),0);assert.deepEqual(errors,[]);
 console.log('PASS: swipe, tap, release-only drop, cancellation, soft-down repeat, mobile layout, background music stop and explicit resume.');
}finally{await browser.close();}
