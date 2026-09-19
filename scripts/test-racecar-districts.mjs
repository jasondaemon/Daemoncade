import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4197/games/racecar/');await page.waitForFunction(()=>document.querySelector('#start').textContent==='START');
 await page.evaluate(async()=>{
  const [{RoadScene},{Run},{careerTrack},{districtSites}]=await Promise.all([import('./view.js?v=35'),import('./rules.js?v=35'),import('./career-tracks.js?v=35'),import('./district-sites.js?v=35')]);
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999';document.body.append(host);
  const view=await new Promise((resolve,reject)=>new RoadScene(host,{ready:resolve,error:reject,frame:()=>{},progress:()=>{}}));window.districtQA={view,Run,careerTrack,districtSites};
 });
 for(let c=0;c<5;c++){
  const stats=await page.evaluate(c=>{
   const {view,Run,careerTrack,districtSites}=window.districtQA,run=new Run({mode:'race'});run.route=careerTrack(c,0);view.draw(run,0,false);
   const sites=districtSites(view.track,run.route.environment),s=c===0?sites.marine[0]:sites.sites[2];
   view.camera.position.set(s.x+32,23,s.z+42);view.camera.lookAt(s.x,2,s.z+(c===0?10:0));view.renderer.render(view.scene,view.camera);
   return {calls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles};
  },c);
  await page.screenshot({path:`/tmp/racecar-district-${c}.png`});console.log('District',c,stats);
 }
 assert.deepEqual(errors,[]);console.log('PASS: five districts rebuild and render without browser errors.');
} finally {await browser.close();}
