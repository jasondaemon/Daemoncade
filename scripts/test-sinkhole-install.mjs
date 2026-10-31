import assert from 'node:assert/strict';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
const base=process.env.SINKHOLE_BASE_URL||'http://127.0.0.1:4197';
try{
 for(const entry of['app.html','app-expedition.html'])for(const standalone of[false,true]){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],pending=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>pending.add(r.url()));for(const event of['requestfinished','requestfailed'])page.on(event,r=>pending.delete(r.url()));
  await page.addInitScript(standalone=>{localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false,music:false}));if(standalone){const original=window.matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:true,addEventListener(){},removeEventListener(){}}:original(q);}},standalone);
  await page.goto(base+'/games/sinkhole-city/'+entry+'?install=1');
  const frame=page.frameLocator('#app-game');await frame.locator('#title-play').waitFor();await page.waitForFunction(()=>!document.querySelector('#app-game').contentDocument.querySelector('#title-play').disabled).catch(async e=>{console.log('LOAD STALL',errors,[...pending],await frame.locator('#status').textContent());throw e;});
  assert.deepEqual(errors,[],'candidate load errors');assert.notEqual(await frame.locator('#title-play').textContent(),'Retry loading');
  assert.equal(await page.locator('#app-game').getAttribute('src'),'metro/index.html?revision=stable-1.0.0');
  const manifest=await page.evaluate(async()=>await(await fetch(document.querySelector('link[rel=manifest]').href)).json());assert.equal(manifest.start_url,'./'+entry);assert.equal(manifest.id,'/games/sinkhole-city/'+entry);assert.equal(manifest.icons[0].src,'app-icon.png');
  assert.equal(await page.locator('.app-bar').isVisible(),!standalone);
  if(!standalone){assert.equal(await page.locator('#app-guide').isVisible(),true);await page.locator('#guide-close').click();}
  await frame.locator('#title-play').click();await frame.locator('#free').click();
  await page.evaluate(()=>document.querySelector('#app-game').contentWindow.postMessage({type:'daemoncade:suspend'},location.origin));
  await frame.locator('#resume').waitFor({state:'visible'});assert.ok(await page.evaluate(()=>Boolean(localStorage.getItem('sinkhole.metro.run.v1'))));
  await page.screenshot({path:`/tmp/sinkhole-release48-app-${standalone?'standalone':'browser'}.png`});assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: candidate wrapper loads the 3D game, own icon/manifest, install help, immersive app mode and parent suspension/checkpoint.');
}finally{await browser.close();}
