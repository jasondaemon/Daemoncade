import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4197/games/racecar/');await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
 await page.evaluate(async()=>{const {newCareer}=await import('./career.js?v=38');const p=newCareer('normal');p.wallet=1;localStorage.setItem('racecar_careers_v1',JSON.stringify({active:'normal',profiles:{normal:p}}));});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
 for(const key of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'])await page.keyboard.press(key);
 assert.match(await page.locator('#start').innerText(),/VISITOR/);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');await page.locator('#start').click();await page.locator('#show-garage').click();
 while(!await page.locator('[data-car="ufo"]').count())await page.getByRole('button',{name:'Next cars',exact:true}).click();
 await page.locator('[data-car="ufo"]').click();assert.match(await page.locator('#car-actions').innerText(),/BUY · \$1$/);
 await page.locator('#car-actions button').click();assert.match(await page.locator('#car-actions').innerText(),/SELECTED/);
 await page.screenshot({path:'/tmp/racecar-visitor38.png'});
 await page.locator('#start').click();await page.keyboard.down('ArrowUp');await page.keyboard.down(' ');await page.waitForTimeout(4500);await page.keyboard.up('ArrowUp');await page.keyboard.up(' ');assert.match(await page.locator('#boost-title').innerText(),/∞/);await page.screenshot({path:'/tmp/racecar-visitor-driving38.png'});
 // Render both original models in a close-up separate from saved game state.
 await page.evaluate(async()=>{const {RoadScene}=await import('./view.js?v=38');const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999';document.body.append(host);const view=await new Promise((resolve,reject)=>new RoadScene(host,{ready:resolve,error:reject,frame:()=>{},progress:()=>{}}));const c=document.createElement('canvas');c.width=1000;c.height=650;c.style.cssText='width:100%;height:100%;position:fixed;inset:0;z-index:2147483647';host.append(c);window.hoverQA={view,c};view.previewCar(c,'manta',null,false,.5);});
 await page.screenshot({path:'/tmp/racecar-manta38.png'});
 await page.evaluate(()=>window.hoverQA.view.previewCar(window.hoverQA.c,'ufo',null,false,.5));await page.screenshot({path:'/tmp/racecar-ufo38.png'});
 assert.deepEqual(errors,[]);console.log('PASS: code, persistent discount, $1 purchase, infinite-nitro HUD, hover driving and both previews.');
} finally {await browser.close();}
