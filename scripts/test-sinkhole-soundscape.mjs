import {enterWorldMenu,clickOption} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{if(!localStorage.getItem('soundscape-seeded')){localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({sound:false}));localStorage.setItem('soundscape-seeded','1');}});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={audio,get phase(){return phase},get run(){return run},pause,resume};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=sound33');await page.waitForFunction(()=>document.querySelector('#start').textContent==='Start run'&&!document.querySelector('#start').disabled);await enterWorldMenu(page);
 assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#ambience').getAttribute('aria-pressed'),'false','legacy mute applies to both channels');assert.ok(await page.evaluate(()=>!__qa.audio.context));
 for(const size of[{width:360,height:640},{width:932,height:430},{width:430,height:932}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);const b=await page.locator('#panel .card').boundingBox();assert.ok(b.y>=0&&b.y+b.height<=size.height+1,JSON.stringify({size,b}));
  await page.locator('#settings-open').click();const targets=await page.locator('.settings button').evaluateAll(bs=>bs.map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));assert.ok(targets.every(b=>b.w>=44&&b.h>=44),JSON.stringify(targets));await page.locator('#close-options').click();
 }
 await clickOption(page,'ambience');await page.locator('#free').click();await page.waitForFunction(()=>__qa.audio.ambience.bed&&__qa.audio.context.state==='running');assert.equal(await page.evaluate(()=>__qa.audio.voices.size),0,'ambience without collection effects');
 await page.locator('#pause').click();assert.ok(await page.evaluate(()=>!__qa.audio.ambience.bed&&!__qa.audio.ambience.detail&&__qa.audio.context.state==='suspended'));
 await page.locator('#resume').click();await page.waitForFunction(()=>__qa.audio.ambience.bed);
 await page.evaluate(()=>document.querySelector('#ambience').click());await page.waitForFunction(()=>__qa.audio.context.state==='suspended');assert.ok(await page.evaluate(()=>!__qa.audio.ambience.bed));
 await page.evaluate(()=>document.querySelector('#sound').click());await page.waitForFunction(()=>__qa.audio.context.state==='running');
 const effects=await page.evaluate(()=>{__qa.audio.play({type:'car',radius:1});return {voices:__qa.audio.voices.size,bed:!!__qa.audio.ambience.bed};});assert.ok(effects.voices>0&&!effects.bed,'effects remain independent');
 await page.locator('#pause').click();await clickOption(page,'ambience');await page.locator('#resume').click();await page.waitForFunction(()=>__qa.audio.ambience.bed);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 assert.ok(await page.evaluate(()=>__qa.phase==='paused'&&!__qa.audio.ambience.bed&&!__qa.audio.ambience.detail&&__qa.audio.voices.size===0&&__qa.audio.context.state==='suspended'));
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__qa.phase),'paused','foreground does not restart sound/gameplay automatically');
 await page.locator('#leave').click();
 const interruptedReward=await page.evaluate(async()=>{const a=__qa.audio;a.unlock();await a.context.resume();a.cue('win');document.querySelector('#sound').click();return {state:a.context.state,voices:a.voices.size,bed:!!a.ambience.bed};});
 assert.deepEqual(interruptedReward,{state:'suspended',voices:0,bed:false},'changing a menu setting cannot leave an interrupted reward context running');await clickOption(page,'sound');
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await enterWorldMenu(page);assert.equal(await page.locator('#ambience').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');assert.ok(await page.evaluate(()=>!__qa.audio.context),'menu does not autoplay after reload');
 // Render actual browser audio offline. These bounds catch silence, clipping
 // and invalid samples; they are not subjective speaker/headphone mix approval.
 const rendered=await page.evaluate(async()=>{
  const {Soundscape}=await import('/games/sinkhole-city/metro/soundscape.js?v=sound33'),results=[];
  for(const world of['metro','basecamp','deep','alien','orbit']){
   const c=new OfflineAudioContext(1,48000*4,48000),master=c.createGain();master.gain.value=.55;master.connect(c.destination);
   const context={state:'running',sampleRate:c.sampleRate,get currentTime(){return c.currentTime;},createBuffer:c.createBuffer.bind(c),createGain:c.createGain.bind(c),createBufferSource:c.createBufferSource.bind(c),createOscillator:c.createOscillator.bind(c),createBiquadFilter:c.createBiquadFilter.bind(c)};
   const s=new Soundscape({context,master});s.update(world,0,true);s.update(world,6,true);const b=await c.startRendering(),data=b.getChannelData(0);let sum=0,peak=0,finite=true;
   for(const value of data){finite&&=Number.isFinite(value);sum+=value*value;peak=Math.max(peak,Math.abs(value));}
   results.push({world,rms:Math.sqrt(sum/data.length),peak,finite});s.stop();
  }
  return results;
 });for(const r of rendered)assert.ok(r.finite&&r.rms>.0002&&r.peak<.15,JSON.stringify(r));assert.equal(new Set(rendered.map(r=>r.rms.toFixed(5))).size,5);assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/sinkhole-sound33-settings.png'});console.log('SOUNDSCAPES',rendered);console.log('PASS: independent persisted channels, legacy mute migration, mobile fit/targets, native audio rendering, pause/hidden suspension and no menu autoplay.');
}finally{await browser.close();}
