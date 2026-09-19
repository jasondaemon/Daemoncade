import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_TEST_URL||'http://127.0.0.1:4202';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const catalog=await (await fetch(base+'/games/catalog.json')).json();
 for(const game of catalog.games){
  const root=base+'/games/'+game.slug+'/';
  const response=await fetch(root+'app-manifest.json');
  assert.match(response.headers.get('content-type'),/json/);
  const manifest=await response.json();
  assert.equal(manifest.name,game.title);assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./app.html');assert.equal(manifest.scope,'./');
  assert.equal((await fetch(root+'app-icon.png')).status,200);
  assert.equal((await fetch(root+'app.html')).status,200);
 }
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true,acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/games/racecar/app.html?install=1');
 assert.equal(await page.locator('#app-guide').evaluate(d=>d.open),true);
 await page.locator('#app-backup').click();
 assert.match(await page.locator('#backup-status').textContent(),/No saved careers/);
 const career={active:'normal',profiles:{normal:{wallet:4321,owned:['metro'],car:'metro',admitted:[0],races:3}}};
 await page.evaluate(data=>localStorage.setItem('racecar_careers_v1',JSON.stringify(data)),career);
 const downloadPromise=page.waitForEvent('download');await page.locator('#app-backup').click();
 const download=await downloadPromise;const backup=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(backup.format,'racecar-careers');assert.equal(backup.profiles.normal.wallet,4321);
 await page.locator('#guide-close').click();
 for(const [width,height] of [[430,932],[390,667],[932,430]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const geometry=await page.evaluate(()=>({bar:document.querySelector('.app-bar').getBoundingClientRect().bottom,frame:document.querySelector('iframe').getBoundingClientRect().toJSON(),height:innerHeight,scroll:document.documentElement.scrollHeight}));
  assert.ok(geometry.frame.y>=geometry.bar);assert.ok(geometry.frame.bottom<=geometry.height+1);assert.ok(geometry.scroll<=geometry.height+1);
 }
 // Separate browser storage models installation without altering the original save.
 const installed=await browser.newContext({viewport:{width:430,height:932}});
 await installed.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
 const app=await installed.newPage();app.on('pageerror',e=>errors.push(e.message));app.on('dialog',d=>d.accept());
 await app.goto(base+'/games/racecar/app.html?install=1');
 assert.equal(await app.locator('#app-guide').evaluate(d=>d.open),false);
 const game=app.frameLocator('#app-game');await game.locator('#start').waitFor();
 await game.locator('#settings summary').click();
 await game.locator('#import-career').setInputFiles({name:'racecar-careers.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
 await app.waitForFunction(()=>JSON.parse(localStorage.getItem('racecar_careers_v1')||'{}').profiles?.normal?.wallet===4321);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('racecar_careers_v1')).profiles.normal.wallet),4321);
 await installed.close();
 await page.setViewportSize({width:430,height:932});
 await page.goto(base+'/games/');await page.locator('#include-beta').check();await page.locator('[data-game="racecar"]').click();
 await page.waitForTimeout(500);
 const overlap=await page.evaluate(()=>({bar:document.querySelector('.game-dialog-shell > header').getBoundingClientRect().bottom,frame:document.querySelector('#game-frame').getBoundingClientRect().top}));
 assert.ok(overlap.frame>=overlap.bar,'Website controls must not overlap gameplay');
 assert.match(await page.locator('#game-install').getAttribute('href'),/racecar\/app.html\?install=1$/);
 await page.screenshot({path:'/tmp/game-app-mobile-host.png'});
 await page.locator('#game-close').click();assert.equal(await page.locator('#game-dialog').evaluate(d=>d.open),false);
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${catalog.games.length} app manifests/icons; reserved controls; backup/restore across isolated stores; standalone launch; website close.`);
} finally {await browser.close();}
