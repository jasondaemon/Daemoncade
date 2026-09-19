import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/games/racecar/');
 await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');await page.locator('#start').click();
 assert.match(await page.locator('#purchase-curve').getAttribute('aria-label'),/Current Metro, dotted line/);
 await page.locator('[data-car="touring"]').click();
 assert.match(await page.locator('#purchase-curve').getAttribute('aria-label'),/^Touring: stock/);
 assert.match(await page.locator('#purchase-curve').getAttribute('aria-label'),/Current Metro, dotted line/);
 await page.locator('[data-car="metro"]').click();
 await page.clock.install();
 const preview=()=>page.locator('#garage-preview').evaluate(c=>c.toDataURL());
 await page.clock.runFor(100);
 const before=await preview();await page.clock.runFor(1500);
 assert.notEqual(await preview(),before,'Showroom car rotates');
 for(const [width,height] of [[1280,800],[1215,900],[390,844],[390,667]]) {
  await page.setViewportSize({width,height});
  for(const panel of ['garage','upgrades','map']) {
   await page.locator('#show-'+panel).click();
   const sizes=await page.evaluate(()=>{
    const card=document.querySelector('.menu-card'),overlay=document.querySelector('#overlay');
    return {card:[card.scrollHeight,card.clientHeight],overlay:[overlay.scrollHeight,overlay.clientHeight]};
   });
   assert.ok(sizes.card[0]<=sizes.card[1]+2,`${width}x${height} ${panel} card overflows ${JSON.stringify(sizes)}`);
   assert.ok(sizes.overlay[0]<=sizes.overlay[1]+2,`${width} ${panel} overlay scrolls`);
   await page.screenshot({path:`/tmp/racecar-${width}-${height}-${panel}.png`});
  }
 }
 assert.equal(await page.locator('a[href="../../"]').count(),0);
 await page.locator('#title-screen').click();await page.locator('#settings summary').click();await page.locator('#reduced').check();await page.locator('#start').click();
 await page.clock.runFor(100);const still=await preview();await page.clock.runFor(1000);
 assert.equal(await preview(),still,'Reduced effects keeps the preview still');
 assert.deepEqual(errors,[]);console.log('PASS: three views fit four viewport sizes; no external Games link or browser errors.');
} finally {await browser.close();}
