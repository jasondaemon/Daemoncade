import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/games/racecar/');await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
 await page.evaluate(async()=>{
  const [{RoadScene},{Run},{careerTrack},{tunedCar,newCareer}]=await Promise.all([import('./view.js?v=27'),import('./rules.js?v=27'),import('./career-tracks.js?v=27'),import('./career.js?v=27')]);
  document.querySelector('#overlay').hidden=true;const host=document.createElement('div');host.id='canyon-qa';host.style.cssText='position:fixed;inset:0;z-index:999;width:1000px;height:800px';document.body.append(host);
  const view=await new Promise((resolve,reject)=>new RoadScene(host,{ready:resolve,error:reject,frame:()=>{},progress:()=>{}}));
  const run=new Run({mode:'race'});run.route=careerTrack(1,2);run.car=tunedCar(newCareer('normal'));run.phase='playing';
  const corner=run.route.circuit.reduce((a,b)=>a.x>b.x?a:b);run.player.z=corner.z-55;run.player.speed=25;
  view.draw(run,0,false);window.desertQA={view,run,corner};
 });
 await page.locator('#canyon-qa canvas').first().screenshot({path:'/tmp/racecar-canyon-entry.png'});
 await page.evaluate(()=>{const {view,run,corner}=window.desertQA;run.player.z=corner.z+50;view.cameraReady=false;view.draw(run,0,false);});
 await page.locator('#canyon-qa canvas').first().screenshot({path:'/tmp/racecar-canyon-bend.png'});
 await page.evaluate(async()=>{const {desertSites}=await import('./desert.js?v=27');const {view}=window.desertQA;const tree=desertSites(view.track).trees[3];view.camera.position.set(tree.x+14,8,tree.z+18);view.camera.lookAt(tree.x,tree.height*.5,tree.z);view.renderer.render(view.scene,view.camera);});
 await page.locator('#canyon-qa canvas').first().screenshot({path:'/tmp/racecar-joshua-detail.png'});
 assert.deepEqual(errors,[]);console.log('PASS: canyon approach and bend rendered without runtime errors.');
} finally {await browser.close();}
