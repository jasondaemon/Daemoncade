// Short isolated rendering and touch-input sweep for every career environment.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
const out=process.env.QA_OUTPUT||'/tmp/racecar-career-qa';await mkdir(out,{recursive:true});
const url=process.env.RACECAR_URL||'http://127.0.0.1:4197/games/racecar/';
const errors=[];
function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.location().url+': '+m.text());});}
try {
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();watch(page);
  await page.clock.install();await page.goto(url);await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');await page.locator('#start').click();
  for(let circuit=0;circuit<5;circuit++) {
    await page.evaluate(async index=>{
      const {newCareer}=await import('./career.js?v=15');const p=newCareer('normal');p.admitted=[0,1,2,3,4];p.podiums=[0,1,2,3];p.circuit=index;p.car=['metro','hatch','sport','apex','formula'][index];p.owned.push(p.car);
      localStorage.setItem('racecar_careers_v1',JSON.stringify({active:'normal',profiles:{normal:p}}));
    },circuit);
    await page.reload();await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');await page.locator('#start').click();
    await page.locator('#start').click();await page.keyboard.down('ArrowUp');await page.clock.runFor(8000);
    await page.screenshot({path:`${out}/environment-${circuit}.png`});await page.keyboard.up('ArrowUp');
    await page.keyboard.press('p');console.log('Environment',circuit,'rendered without failure');
  }
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const touch=await mobile.newPage();watch(touch);await touch.clock.install();await touch.goto(url);await touch.waitForFunction(()=>document.querySelector('#start').textContent==='START');await touch.locator('#start').click();
  await touch.locator('#show-garage').click();
  while(!await touch.locator('[data-car="formula"]').count())await touch.getByRole('button',{name:'Next cars',exact:true}).click();
  await touch.locator('[data-car="formula"]').click();
  await touch.locator('#title-screen').click();
  assert.ok(await touch.locator('[data-difficulty="normal"]').isVisible());
  await touch.screenshot({path:out+'/mobile-title.png'});
  await touch.locator('#start').click();
  await touch.screenshot({path:out+'/mobile-garage.png'});
  assert.ok(await touch.locator('#garage-preview').isVisible());
  await touch.locator('#start').click();await touch.clock.runFor(3300);
  const field=await touch.locator('#host').boundingBox();
  assert.ok(field,'Gesture playfield visible');
  assert.equal(await touch.locator('.touch').isVisible(),false);
  const cdp=await mobile.newCDPSession(touch);
  const x=field.x+field.width*.4,y=field.y+field.height*.65;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  assert.equal(await touch.locator('#steering-stick').isVisible(),true);
  const anchor=await touch.locator('#steering-stick').evaluate(e=>[e.style.left,e.style.top]);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-15,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-15,y,id:1},{x:x+100,y,id:2}]});
  await touch.clock.runFor(2000);assert.ok(Number(await touch.locator('#speed').innerText())>0);
  assert.equal(await touch.locator('#steering-stick').evaluate(e=>e.classList.contains('is-drifting')),true);
  assert.deepEqual(await touch.locator('#steering-stick').evaluate(e=>[e.style.left,e.style.top]),anchor);
  await touch.screenshot({path:out+'/mobile-steering-stick.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:x-15,y,id:1}]});
  const beforeBrake=Number(await touch.locator('#speed').innerText());
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await touch.locator('#steering-stick').isVisible(),false);
  await touch.clock.runFor(1000);assert.ok(Number(await touch.locator('#speed').innerText())<beforeBrake,'Finger release brakes');
  assert.equal(await touch.evaluate(()=>window.scrollY),0,'Gestures do not scroll the page');
  await touch.screenshot({path:out+'/mobile-driving.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:4}]});
  assert.equal(await touch.locator('#steering-stick').isVisible(),true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await touch.locator('#steering-stick').isVisible(),false);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:5}]});
  await touch.locator('#pause').click();assert.equal(await touch.locator('#title').innerText(),'PAUSED');
  assert.equal(await touch.locator('#steering-stick').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('PASS: five environments, mobile garage, gesture steering/acceleration, second finger, release braking, no scrolling and pause; no browser errors.');
} finally {await browser.close();}
