import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4197/games/racecar/');await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
 await page.evaluate(async()=>{
  const [{RoadScene},{Run},{careerTrack},{CARS}]=await Promise.all([import('./view.js?v=39'),import('./rules.js?v=39'),import('./career-tracks.js?v=39'),import('./garage.js?v=39')]);
  const host=document.createElement('div');host.style.cssText='width:800px;height:600px;position:fixed;inset:0';document.body.append(host);
  const view=await new Promise((resolve,reject)=>new RoadScene(host,{ready:resolve,error:reject,frame:()=>{},progress:()=>{}}));
  window.soak={view,Run,careerTrack,CARS,canvas:document.createElement('canvas')};window.soak.canvas.width=160;window.soak.canvas.height=80;
 });
 const memory=[];
 for(let cycle=0;cycle<6;cycle++) {
  const result=await page.evaluate(cycle=>{
   const {view,Run,careerTrack,CARS,canvas}=window.soak;
   for(let circuit=0;circuit<5;circuit++){
    const r=new Run({mode:'race'});r.route=careerTrack(circuit,cycle%4);r.phase='playing';
    for(let i=0;i<120;i++){r.time+=1/60;r.player.z+=.5;r.player.speed=30;if(i%10===0)view.draw(r,1/60,true);}
   }
   for(const car of CARS)view.previewCar(canvas,car.id,undefined,false,cycle*.3);
   return {...view.renderer.info.memory};
  },cycle);
  memory.push(result);console.log('Scene/garage cycle',cycle+1,result);
 }
 assert.ok(memory.at(-1).geometries<=memory[1].geometries+10,JSON.stringify(memory));
 assert.ok(memory.at(-1).textures<=memory[1].textures+2,JSON.stringify(memory));
 assert.deepEqual(errors,[]);console.log('PASS: 30 scene rebuilds and 150 car previews; renderer resources remain bounded.');
} finally {await browser.close();}
