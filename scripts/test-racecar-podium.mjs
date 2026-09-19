import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1100,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/games/racecar/');
 await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
 const result=await page.evaluate(async()=>{
   const {RoadScene}=await import('./view.js?v=21');
   const host=document.createElement('div');document.body.append(host);
   const view=await new Promise((resolve,reject)=>new RoadScene(host,{ready:resolve,error:reject,frame:()=>{},progress:()=>{}}));
   const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=510;canvas.id='podium-test';document.body.append(canvas);
   view.podium(canvas,[{carId:'metro',paint:'#ff3048'},{carId:'touring'},{carId:'hatch'}]);
   const first=canvas.toDataURL();view.animatePodium(1500,1.5);const second=canvas.toDataURL();
   view.reduced=true;view.animatePodium(3000,1.5);const still=canvas.toDataURL();
   view.stopPodium();return {moves:first!==second,reduced:second===still,cleared:view.podiumAnimation===null};
 });
 assert.deepEqual(result,{moves:true,reduced:true,cleared:true});
 await page.evaluate(()=>{document.querySelector('#overlay').hidden=true;});
 await page.locator('#podium-test').screenshot({path:'/tmp/racecar-front-podium.png'});
 assert.deepEqual(errors,[]);console.log('PASS: confetti animates, reduced motion holds still, podium cleanup succeeds.');
} finally {await browser.close();}
