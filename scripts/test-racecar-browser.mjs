// Isolated Chromium QA. Never connects to the user's browser/profile.
// PLAYWRIGHT_MODULE can point at an externally installed Playwright index.mjs.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const page=await context.newPage(),errors=[];
// Read-only simulation access exists only in this intercepted test response.
// The controller sends events through the production input handlers.
await page.route('**/racecar/game.js?*',async route=>{
 const source=await readFile(new URL('../games/racecar/game.js',import.meta.url),'utf8');
 await route.fulfill({contentType:'text/javascript',body:source+'\nwindow.__raceQA={get run(){return run;}};'});
});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',msg=>{if(msg.type()==='error'&&!msg.location().url.includes('favicon'))errors.push(msg.location().url+': '+msg.text());});
const base=process.env.RACECAR_URL||'http://127.0.0.1:4197/games/racecar/';
const output=process.env.QA_OUTPUT||'/tmp/racecar-career-qa';await mkdir(output,{recursive:true});
async function enterGarage(){await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');await page.locator('#start').click();assert.equal(await page.locator('#splash').isVisible(),false);assert.equal(await page.locator('#overlay').isVisible(),true);}
async function inspectCar(id){await page.locator('#show-garage').click();while(!await page.getByRole('button',{name:'Previous cars',exact:true}).isDisabled())await page.getByRole('button',{name:'Previous cars',exact:true}).click();for(let i=0;i<6;i++){if(await page.locator(`[data-car="${id}"]`).count()){await page.locator(`[data-car="${id}"]`).click();return;}await page.getByRole('button',{name:'Next cars',exact:true}).click();}throw Error('Car not found');}
try {
  await page.clock.install();
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
  await page.screenshot({path:output+'/title-screen.png'});
  await enterGarage();
  assert.match(await page.locator('#career-status').innerText(),/1 \/ 25/);
  await inspectCar('formula');
  assert.match(await page.locator('#garage-preview').getAttribute('aria-label'),/grayscale/);
  assert.ok(await page.locator('#car-actions button').isDisabled());
  await page.screenshot({path:output+'/garage-locked.png'});
  await inspectCar('touring');
  assert.doesNotMatch(await page.locator('#garage-preview').getAttribute('aria-label'),/grayscale/);
  assert.ok(await page.locator('#car-actions button').isDisabled());
  console.log('Fresh career: 25 previews, next car visible, future car gray, unaffordable purchase blocked.');
  // Fixture is written only to this temporary browser context.
  await page.evaluate(async()=>{
    const {newCareer}=await import('./career.js?v=15');const p=newCareer('normal');
    p.wallet=24000;p.podiums=[0];p.series[0]={round:3,points:[30,12,18,6]};
    localStorage.setItem('racecar_progress_v2','legacy-sentinel');
    localStorage.setItem('racecar_careers_v1',JSON.stringify({active:'normal',profiles:{normal:p}}));
  });
  await page.reload();await enterGarage();
  await page.locator('[data-car="touring"]').click();await page.locator('#car-actions button').click();
  await page.locator('#show-upgrades').click();
  await page.getByRole('button',{name:'Upgrade Engine for $700',exact:true}).click();
  await page.locator('#show-garage').click();
  await page.locator('[data-paint="red"]').click();
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('racecar_careers_v1')));
  assert.equal(state.profiles.normal.wallet,15800);assert.equal(state.profiles.normal.car,'touring');
  assert.equal(state.profiles.normal.paint.touring,'#ff3048');
  await page.locator('#title-screen').click();await page.locator('[data-difficulty="hard"]').click();await enterGarage();assert.match(await page.locator('#career-status').innerText(),/^\$0/);
  await page.locator('#title-screen').click();await page.locator('[data-difficulty="normal"]').click();await enterGarage();
  await page.locator('#show-map').click();await page.locator('#buy-circuit').click();
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('racecar_careers_v1')));
  assert.equal(state.profiles.normal.wallet,6800);assert.deepEqual(state.profiles.normal.admitted,[0,1]);
  assert.ok(await page.locator('#buy-circuit').isDisabled());
  await page.getByRole('button',{name:'Sunshore',exact:true}).click();
  await page.reload();await enterGarage();
  assert.match(await page.locator('#stage-label').innerText(),/RACE 4 \/ 4/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('racecar_progress_v2')),'legacy-sentinel');
  console.log('Purchases, upgrades, free paint, difficulty isolation, sequential admission, reload and legacy preservation passed.');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:output+'/mobile-career.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:1280,height:900});
  await page.locator('#start').click();await page.keyboard.down('ArrowUp');
  const box=await page.locator('#host').boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.6);await page.mouse.down();
  await page.evaluate(async box=>{
    const {driver}=await import('./driving-test-helper.mjs');
    window.qaDriveTimer=setInterval(()=>{
      const run=window.__raceQA.run,input=driver(run);
      document.querySelector('#host').dispatchEvent(new PointerEvent('pointermove',{pointerId:1,clientX:box.x+box.width*.5+input.steer*box.width/2.4,clientY:box.y+box.height*.6}));
      window.dispatchEvent(new KeyboardEvent(input.brake?'keydown':'keyup',{key:'ArrowDown'}));
    },50);
  },box);
  for(let elapsed=0;elapsed<400;elapsed+=5) {
    await page.clock.runFor(5000);
    if(elapsed===5)await page.screenshot({path:output+'/sunshore-race.png'});
    if(await page.locator('#result').isVisible())break;
    if(elapsed%30===0)console.log('Race clock',await page.locator('#score').innerText());
  }
  await page.evaluate(()=>clearInterval(window.qaDriveTimer));
  await page.mouse.up();await page.keyboard.up('ArrowUp');
  assert.ok(await page.locator('#result').isVisible(),'Race must reach results');
  assert.match(await page.locator('#result').innerText(),/EARNED/);
  assert.match(await page.locator('#title').innerText(),/CHAMPIONSHIP/);
  await page.screenshot({path:output+'/championship-result.png'});
  assert.ok(await page.locator('.podium-scene').isVisible());
  await page.setViewportSize({width:390,height:667});
  await page.screenshot({path:output+'/championship-mobile.png'});
  const actionBox=await page.locator('#start').boundingBox();assert.ok(actionBox.y>=0&&actionBox.y+actionBox.height<=667);
  await page.setViewportSize({width:1280,height:900});
  await page.locator('#start').click();
  assert.match(await page.locator('#stage-label').innerText(),/RACE 1 \/ 4/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('racecar_progress_v2')),'legacy-sentinel');
  assert.deepEqual(errors,[]);
  console.log('PASS: complete browser race → championship rewards → garage; no runtime errors.',output);
} finally {await browser.close();}
