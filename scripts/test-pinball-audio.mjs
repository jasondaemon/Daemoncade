import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PINBALL_URL||'http://127.0.0.1:4197/games/pinball/rebuild/');
 const result=await page.evaluate(async()=>{
  const {AudioEngine}=await import('./audio.js');const a=new AudioEngine();await a.unlock();
  const analyser=a.context.createAnalyser();a.master.connect(analyser);let audible=0;
  for(const type of ['flipper','release','bumper','sling','target','spinner','rollover','launch','ramp','lock','drain','nudge','jackpot']){
   a.sound(type);await new Promise(r=>setTimeout(r,25));const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);if(data.some(x=>Math.abs(x)>.0001))audible++;
  }
  for(let i=0;i<200;i++){a.last.clear();a.sound('jackpot');}const max=a.voices;
  await new Promise(r=>setTimeout(r,1100));const remaining=a.voices;
  a.update([{body:{linvel:()=>({x:10,z:5})}}],true);a.suspend();await new Promise(r=>setTimeout(r,50));const state=a.context.state;
  await a.unlock();a.enabled=false;a.last.clear();a.sound('flipper');const muted=a.voices;
  document.querySelector('#touchLeft').classList.add('held');const style=getComputedStyle(document.querySelector('#touchLeft'));
  const glow=[style.backgroundImage,style.boxShadow];await a.context.close();return {audible,max,remaining,state,muted,glow};
 });
 assert.ok(result.audible>0);assert.ok(result.max<=48);assert.equal(result.remaining,0);assert.equal(result.state,'suspended');assert.equal(result.muted,0);assert.deepEqual(result.glow,['none','none']);assert.deepEqual(errors,[]);
 console.log('PASS: synthesized output, bounded voices and cleanup, suspend/mute, no full-side flipper glow.');
}finally{await browser.close();}
