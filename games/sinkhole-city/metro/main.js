import {DistrictRun} from './simulation.js?v=release48';
import {MetroRenderer} from './renderer.js?v=qualification52';
import {ArenaRun,DIFFICULTIES} from './arena.js?v=camp-life32';
import {RunClock,readJSON,writeStorage} from '../runtime.js?v=foundation1';
import {ALL_CONTRACTS as CONTRACTS,CAREER_KEY,normalizeCareer,unlocked,recordResult,recordExploration,RIMS,medalCount,rimFor,encodeBackup,decodeBackup,worldUnlocked,nextReward,earnedRewards} from './career.js?v=sculpt51';
import {summarizeRun} from './exploration.js?v=release48';
import {WORLDS,worldFor,BASECAMP_TRAILS,TOTAL_MEDALS,growthInfo,districtLabel} from './worlds.js?v=release48';
import {ALIEN_GROVES} from './alien.js?v=groves30';
import {ORBIT_LANES} from './orbit.js?v=collapse29';
import {SCALE_COUNT,journeyFraction} from './ascension.js?v=release48';
import {GameAudio} from './audio.js?v=release48';
import {MusicPlayer} from './music.js?v=music41';
import {freshSeed} from './layout-variation.js?v=layouts43';
import {PickupFeedback} from './feedback.js?v=framing11';
import {RenderPacer} from './pacing.js?v=perf17';
import {CHECKPOINT_KEY,makeCheckpoint,restoreCheckpoint,bindCheckpointBodies} from './checkpoint.js?v=release48';
const $=id=>document.getElementById(id),clock=new RunClock(),input={x:0,y:0},keys=new Set();
const prefs=readJSON('sinkhole.metro.preferences.v1',{}),audio=new GameAudio(),voices=audio.voices,feedback=new PickupFeedback($('pickups'));let run=new DistrictRun(),renderer,phase='menu',raf=0,pointer=null,origin={x:0,y:0},sound=prefs.sound!==false,low=prefs.low===true,noticeUntil=0,pausedByLoss=false;
let ambience=typeof prefs.ambience==='boolean'?prefs.ambience:sound;
let music=typeof prefs.music==='boolean'?prefs.music:sound;const soundtrack=new MusicPlayer();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Preserve explicit choices. Fresh touch installs favor sustained rendering
// over peak refresh; input, physics and the timer still run at 60 Hz.
let frameRate=[30,60].includes(prefs.fps)?prefs.fps:matchMedia('(pointer: coarse)').matches?30:60;const pacer=new RenderPacer(frameRate);
let atTitle=true;
function screen(name){document.body.dataset.screen=name;$('title-screen').hidden=name!=='title';if(name==='title')$('panel').hidden=true;}
function titleUI(){
 const medals=medalCount(career),played=Object.keys(career.records).length>0||Object.keys(career.exploration).length>0||Object.keys(career.arena).length>0;
 $('title-play').textContent=phase==='error'?'Retry loading':ready?(savedRun?'Resume run':played?'Continue campaign':'Start game'):'Loading…';$('title-play').disabled=!ready&&phase!=='error';
 $('title-browse').hidden=!savedRun;$('title-browse').disabled=!ready;
 $('title-progress').textContent=savedRun?`${worldFor(savedRun.world).title} · Run saved · ${Math.floor(savedRun.state.time/60)}:${String(Math.floor(savedRun.state.time%60)).padStart(2,'0')}`:played?`${worldFor(world).title} · ${medals} / ${TOTAL_MEDALS} medals`:'Campaign · 6 worlds';
 $('title-loading').hidden=ready;$('title-loading').textContent=phase==='error'?'Your world could not load. Try again.':'Preparing your world';$('title-collection').disabled=!ready;
}
let career=normalizeCareer(readJSON(CAREER_KEY,{})),world=worldUnlocked(career,prefs.world)?prefs.world:'metro',selected=0,ready=false,mapTime=-1,hudTime=-1;
let savedRun=readJSON(CHECKPOINT_KEY,null),checkpointTime=0,pendingStart=null;
if(!restoreCheckpoint(savedRun,career))savedRun=null;
selected=bestContract(world);run=new DistrictRun({world,seed:freshSeed()});
function clearCheckpoint(){savedRun=null;try{localStorage.removeItem(CHECKPOINT_KEY);}catch{}checkpointTime=0;}
function checkpoint(){
 if(run.arena||run.done)return true;
 try{savedRun=makeCheckpoint(run);checkpointTime=run.time;return writeStorage(CHECKPOINT_KEY,JSON.stringify(savedRun));}catch{return false;}
}
async function resumeCheckpoint(){
 if(!ready||document.hidden||pausedByLoss)return;
 const restored=restoreCheckpoint(savedRun,career);if(!restored){clearCheckpoint();titleUI();return;}
 release();silence();ready=false;phase='loading';titleUI();
 try{
  run=restored;world=run.world;selected=run.contract?CONTRACTS.findIndex(c=>c.id===run.contract.id):bestContract(world);
  await renderer.load(run,()=>{});bindCheckpointBodies(run);renderer.snapCamera(run);renderer.render(run,0);ready=true;atTitle=false;phase='playing';clock.reset();clock.rebase();pacer.reset();mapTime=-1;paintHUD();map();$('hud').hidden=$('map').hidden=false;
  $('objective').textContent=run.contract?.title||`Explore ${worldFor(world).title}`;pause();$('description').textContent='Your run has been restored. Resume when ready.';save();
 }catch(error){console.error(error);ready=false;phase='error';atTitle=true;screen('title');titleUI();}
}
function bestContract(id){const index=CONTRACTS.findIndex((c,i)=>c.world===id&&unlocked(career,i)&&!career.records[c.id]);return index<0?CONTRACTS.findIndex(c=>c.world===id):index;}
function worldButtons(){
 $('worlds').replaceChildren();for(const w of WORLDS){
  const b=document.createElement('button'),open=worldUnlocked(career,w.id);b.textContent=w.label;
  if(!open&&w.previous){const requirement=document.createElement('small');requirement.textContent=w.requires&&!career.records[w.requires]?'Finish Solar collapse':`${worldFor(w.previous).label} ${medalCount(career,w.previous)}/${w.unlock}★`;b.append(requirement);}
  b.dataset.world=w.id;b.dataset.number=String(WORLDS.indexOf(w)+1).padStart(2,'0');b.title=w.previous?`Earn ${w.unlock} medals in ${worldFor(w.previous).label}`:w.title;b.disabled=(!ready&&phase!=='error')||!open;b.setAttribute('aria-pressed',String(w.id===world));b.onclick=()=>chooseWorld(w.id);$('worlds').append(b);
 }
}
async function chooseWorld(id){
 if((!ready&&phase!=='error')||!worldUnlocked(career,id))return;
 if(id===world){if(phase==='error')await prepare();else menu();return;}
 release();silence();cancelAnimationFrame(raf);raf=0;world=id;selected=bestContract(world);run=new DistrictRun({world,seed:freshSeed()});save();await prepare();
}
let rim=prefs.rim||'mint',pendingBackup=null,rimPreviewJob=0;
let arenaDifficulty=Object.hasOwn(DIFFICULTIES,prefs.arenaDifficulty)?prefs.arenaDifficulty:'normal';
function arenaOptions(){
 $('arena-difficulties').replaceChildren();for(const [id,option]of Object.entries(DIFFICULTIES)){
  const b=document.createElement('button');b.textContent=option.label;b.setAttribute('aria-pressed',String(id===arenaDifficulty));b.onclick=()=>{arenaDifficulty=id;save();arenaOptions();};$('arena-difficulties').append(b);
 }
 const record=career.arena[arenaDifficulty];$('arena-description').textContent=DIFFICULTIES[arenaDifficulty].description;$('arena-record').textContent=record?`Best ${record.score.toLocaleString()} · ${record.wins} wins / ${record.runs} matches`:'No completed matches yet.';
}
function collection(){
 const previewJob=++rimPreviewJob,previewQueue=[],showPreviews=$('locker').open;
 const chosen=rimFor(career,rim),total=medalCount(career),next=nextReward(career);rim=chosen.id;renderer?.setRim(chosen.color,chosen.style);$('rims').replaceChildren();
 $('collection-progress').textContent=next?`${total} / ${TOTAL_MEDALS} medals · ${next.name} at ${next.medals} (${next.medals-total} to go)`:`${total} / ${TOTAL_MEDALS} medals · Collection complete`;
 for(const r of RIMS){const b=document.createElement('button'),label=document.createElement('span'),detail=document.createElement('small'),locked=r.medals>total;label.textContent=r.name;detail.textContent=locked?`${r.medals} medals`:r.id===rim?'Equipped':'Unlocked';b.append(label,detail);b.disabled=locked;b.setAttribute('aria-pressed',String(r.id===rim));b.className=`rim-${r.id} style-${r.style||'plain'}`;
  if(renderer&&showPreviews){const img=document.createElement('img'),cached=renderer.rimPreviews.get(`${r.style||'plain'}:${r.color}`);img.alt='';img.className='rim-preview';img.width=img.height=48;b.prepend(img);b.classList.add('has-preview');if(cached)img.src=cached;else previewQueue.push({img,b,r});}
  b.onclick=()=>{rim=r.id;save();collection();};$('rims').append(b);}
 // Cosmetic readbacks never block startup or run results. Generate at most one
 // missing thumbnail per frame, and cancel obsolete/closed/hidden collections.
 const nextPreview=()=>{
  if(previewJob!==rimPreviewJob||!$('locker').open||document.hidden||!previewQueue.length)return;
  const {img,b,r}=previewQueue.shift();
  try{img.src=renderer.rimPreview(r.color,r.style);}catch{img.remove();b.classList.remove('has-preview');}
  if(previewQueue.length)requestAnimationFrame(nextPreview);
 };
 if(previewQueue.length)requestAnimationFrame(nextPreview);
}
function contracts(){
 const c=CONTRACTS[selected],r=career.records[c.id],comparable=(r?.rulesVersion||1)===(c.rulesVersion||1);$('pace').textContent=`Gold ≤ ${c.gold}s · Silver ≤ ${c.silver}s · Bronze: finish${r?(comparable?` · Best ${r.time.toFixed(1)}s`:' · Earlier medals retained'):''}`;
 $('contracts').replaceChildren();
 CONTRACTS.forEach((c,i)=>{if(c.world!==world)return;const b=document.createElement('button'),r=career.records[c.id],number=CONTRACTS.filter(x=>x.world===world).indexOf(c)+1;b.disabled=!ready||!unlocked(career,i);b.className=i===selected?'selected':'';b.setAttribute('aria-pressed',String(i===selected));b.textContent=`${number}. ${c.title}  ${r?'★'.repeat(r.medal):unlocked(career,i)?'—':'· Locked'}`;b.onclick=()=>{selected=i;$('description').textContent=c.description;contracts();};$('contracts').append(b);});
}
function clearResults(){
 $('panel').classList.remove('results-view');$('run-results').hidden=$('keep-clearing').hidden=$('return-menu').hidden=true;
}
function explorationUI(){
 const best=career.exploration[world];$('world-best').hidden=!best;
 $('world-best').textContent=best?`${best.coverage===10000?'WORLD CLEARED':`Best world clear · ${Math.floor(best.coverage/100)}%`} · Best chain ${best.chain}${best.clearTime?` · ${Math.round(best.clearTime)}s`:''}`:'';
}
function menu(reward=false){phase='menu';release();silence(reward===true);clearResults();explorationUI();$('rival-tags').hidden=$('standings').hidden=true;$('pace').hidden=false;$('worlds').hidden=false;$('panel').hidden=false;$('hud').hidden=$('map').hidden=true;$('resume').hidden=$('leave').hidden=true;$('contracts').hidden=$('choices').hidden=false;$('title').textContent=worldFor(world).title;$('world-kicker').textContent=`WORLD ${String(WORLDS.findIndex(w=>w.id===world)+1).padStart(2,'0')}`;$('description').textContent=CONTRACTS[selected].description;$('status').textContent=`${medalCount(career,world)} / 9 medals · ${medalCount(career)} / ${TOTAL_MEDALS} total`;$('start').textContent='Start run';contracts();collection();worldButtons();titleUI();screen(atTitle?'title':'worlds');}
function showResults(){
 screen('results');
 const s=summarizeRun(run),best=career.exploration[world];$('panel').classList.add('results-view');$('run-results').hidden=$('return-menu').hidden=false;
 $('result-coverage').textContent=`${s.percent}%`;$('run-results').style.setProperty('--clear',s.coverage/100+'%');$('result-catch').textContent=s.largestName;
 $('result-chain').textContent=s.chain?`${s.chain} objects`:'—';$('result-best').textContent=best?`${Math.floor(best.coverage/100)}%`:'—';
 $('result-remaining').textContent=run.world==='ascension'?s.full?'From atomic matter to galaxies. Journey complete.':`${run.eaten} objects collected · Keep growing into the larger forms.`:s.full?'Nothing left behind. World cleared.':`${s.remaining} objects still out there. ${run.won?'Keep your size and finish clearing, without a timer.':'Retry the mission, or explore at your own pace.'}`;
 $('keep-clearing').hidden=!run.won||s.full;
 $('choices').dataset.continue=String(!$('keep-clearing').hidden);
 if(s.full){$('title').textContent=run.world==='ascension'?'Infinity complete':'World cleared';$('description').textContent=run.world==='ascension'?`Atoms to galaxies · ${SCALE_COUNT} scales explored`:worldFor(world).title;}
}
function map(){
 if(run.time-mapTime<.1&&mapTime<=run.time)return;mapTime=run.time;const ctx=$('map').getContext('2d'),s=160/112,zoom=run.world==='ascension'?run.scaleZoom||1:1,pos=v=>(v/zoom+56)*s;
 ctx.clearRect(0,0,160,160);ctx.fillStyle='#16353beb';ctx.fillRect(0,0,160,160);ctx.strokeStyle='#66817c';ctx.lineWidth=6;
 if(run.world==='basecamp'){ctx.strokeStyle='#b3a178';ctx.lineWidth=3;for(const path of BASECAMP_TRAILS){ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(pos(p.x),pos(p.z)):ctx.moveTo(pos(p.x),pos(p.z)));ctx.stroke();}}
 else if(run.world==='orbit'){ctx.strokeStyle='#7186ba';const contraction=run.orbiters[0]?.orbital.contraction??1;for(const {x,z,rx,rz}of ORBIT_LANES){ctx.beginPath();ctx.ellipse(pos(x),pos(z),rx*s*contraction,rz*s*contraction,0,0,Math.PI*2);ctx.stroke();}}
 else if(run.world==='alien'){ctx.strokeStyle='#9884b5';for(const [x,z]of ALIEN_GROVES){ctx.beginPath();ctx.ellipse(pos(x),pos(z),12*s,9*s,0,0,Math.PI*2);ctx.stroke();}}
 else if(run.world==='metro'){for(const x of[-26,0,26]){ctx.beginPath();ctx.moveTo(pos(x),0);ctx.lineTo(pos(x),160);ctx.stroke();}for(const z of[-24,2,28]){ctx.beginPath();ctx.moveTo(0,pos(z));ctx.lineTo(160,pos(z));ctx.stroke();}}
 else if(run.world!=='ascension'){ctx.strokeStyle='#6baca2';ctx.lineWidth=1;for(const radius of[18,36,50]){ctx.beginPath();ctx.ellipse(80,80,radius*s,radius*.8*s,0,0,Math.PI*2);ctx.stroke();}}
 const schools=new Set();for(const o of run.objects){if(['consumed','buried','dormant'].includes(o.phase)||run.world==='ascension'&&(o.radius/zoom<.055||o.radius/zoom>14))continue;if(o.type==='fish'){if(schools.has(o.swim.group))continue;schools.add(o.swim.group);}ctx.fillStyle=o.type==='landmark'?'#ffb878':o.type==='wreck'?'#d4a0e8':o.type==='treasure'?'#ffe18b':run.eligible(o)?'#7de5dc':'#6b847f';const r=['landmark','wreck'].includes(o.type)?4:run.eligible(o)?2:1;
  if(o.type==='planet'){ctx.fillStyle='#c4a9ee';ctx.beginPath();ctx.arc(pos(o.x),pos(o.z),3,0,Math.PI*2);ctx.fill();}
  else if(o.swim||o.orbital&&['satellite','probe','shuttle'].includes(o.type)||o.traffic&&!o.traffic.stopped){if(o.swim||o.orbital)ctx.fillStyle=o.type==='whale'?'#c4b7f5':'#7ed3f0';ctx.save();ctx.translate(pos(o.x),pos(o.z));ctx.rotate(-o.yaw);ctx.beginPath();ctx.moveTo(0,o.type==='whale'?5:4);ctx.lineTo(-2,-2);ctx.lineTo(2,-2);ctx.closePath();ctx.fill();ctx.restore();}
  else {if(o.relay)ctx.fillStyle='#a5f4df';if(o.charged)ctx.fillStyle='#ffe18b';if(o.phase==='sealed')ctx.fillStyle='#8e7ca6';ctx.fillRect(pos(o.x)-r,pos(o.z)-r,r*2,r*2);}
  if(run.world!=='ascension'&&run.total-run.eaten<=8&&run.eligible(o)){ctx.beginPath();ctx.arc(pos(o.x),pos(o.z),5+(reduced?0:Math.sin(run.time*3)*1.5),0,Math.PI*2);ctx.strokeStyle='#ffe6a0';ctx.lineWidth=1;ctx.stroke();}
 }
 ctx.beginPath();ctx.arc(pos(run.player.x),pos(run.player.z),4,0,Math.PI*2);ctx.fillStyle='#ffe18b';ctx.fill();ctx.strokeStyle='#112d34';ctx.lineWidth=1;ctx.stroke();
 for(const r of run.rivals||[]){ctx.beginPath();ctx.arc(pos(r.player.x),pos(r.player.z),3,0,Math.PI*2);ctx.fillStyle=`#${r.color.toString(16).padStart(6,'0')}`;ctx.fill();}
}
function save(){writeStorage('sinkhole.metro.preferences.v1',JSON.stringify({sound,ambience,music,low,rim,arenaDifficulty,world,fps:frameRate}));}
function soundUI(){$('music').textContent=`Music ${music?'on':'off'}`;$('music').setAttribute('aria-pressed',String(music));$('sound').textContent=`Effects ${sound?'on':'off'}`;$('sound').setAttribute('aria-pressed',String(sound));$('ambience').textContent=`Ambience ${ambience?'on':'off'}`;$('ambience').setAttribute('aria-pressed',String(ambience));$('quality').setAttribute('aria-pressed',String(low));$('frame-rate').textContent=`${frameRate} FPS`;$('frame-rate').setAttribute('aria-label',`${frameRate} frames per second. Switch to ${frameRate===60?30:60}.`);}
function unlock(){
 if((sound||ambience)&&!document.hidden)audio.unlock();
}
function consume(o,strike=0){
 if(sound)audio.play(o,strike,low);
}
function silence(keepRunning=false){soundtrack.pause();audio.ambience.stop();if(keepRunning)audio.stopVoices();else audio.suspend();feedback.clear();}
function release(){
 const id=pointer;pointer=null;input.x=input.y=0;keys.clear();$('stick').hidden=true;$('stick').firstElementChild.style.transform='';
 if(id!==null&&$('world').hasPointerCapture(id)){try{$('world').releasePointerCapture(id);}catch{}}
}
function schedule(){if(!raf)raf=requestAnimationFrame(frame);}
function pause(){
 if(phase==='playing')screen('paused');
 release();silence();if(phase!=='playing')return;phase='paused';clearResults();career=recordExploration(career,run);writeStorage(CAREER_KEY,JSON.stringify(career));const stored=checkpoint();clock.rebase();cancelAnimationFrame(raf);raf=0;
 $('worlds').hidden=true;$('rival-tags').hidden=$('standings').hidden=$('pace').hidden=true;$('panel').hidden=false;$('resume').hidden=$('leave').hidden=false;$('choices').hidden=$('contracts').hidden=true;$('title').textContent='Paused';$('description').textContent=pausedByLoss?'The graphics context was interrupted. Resume after it has recovered.':'Your district is waiting.';$('status').textContent=run.arena?`Arena · ${DIFFICULTIES[run.difficulty].label}`:run.free?'Free roam':run.contract.title;
 if(!stored)$('status').textContent+=' · Device storage unavailable; keep this app open to retain the run.';
}
function resume(){if(document.hidden||pausedByLoss)return;release();unlock();if(music)soundtrack.start();phase='playing';screen('playing');clock.rebase();pacer.reset();$('panel').hidden=true;schedule();}
function paintHUD(){
 hudTime=run.time;
 const left=Math.max(0,Math.ceil(run.duration-run.time)),growth=growthInfo(run.world,run.player.radius,run);
 $('time').textContent=run.free?'FREE ROAM':`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;$('time').classList.toggle('urgent',!run.free&&left<=20);
 $('score').textContent=run.score.toLocaleString();$('stage').textContent=growth.stage;$('progress').textContent=run.arena?`#${run.standings().find(r=>r.id==='you').rank} / 4`:run.contract?`${run.counts[run.contract.kind]} / ${run.contract.target}`:`${run.eaten} objects`;
 $('combo').textContent=run.combo>1?`Chain ${run.streak||run.combo} · ×${(1+run.combo*.08).toFixed(2)}`:'';$('growth').value=growth.value;
 $('coverage').hidden=Boolean(run.arena);$('coverage').textContent=run.world==='ascension'?`JOURNEY ${Math.floor(journeyFraction(run)*100)}%`:`WORLD ${run.eaten===run.total?100:Math.floor(run.eaten/Math.max(1,run.total)*100)}%`;
 $('growthlabel').textContent=growth.label+(run.world==='alien'?` · Relays ${run.relays||0}/6`:run.world==='orbit'?` · Planets ${run.counts.planets}/4`:'');$('district').textContent=districtLabel(run.world,run.player,run);
 if(run.world==='ascension'&&run.scaleStage===SCALE_COUNT-1)$('growthlabel').textContent+=run.infinityComplete?' · Complete':run.infinityCollapse?' · Final intake':` · ${run.objects.filter(o=>o.scaleStage===SCALE_COUNT-1&&o.phase!=='consumed').length} remaining`;
 return growth;
}
function start(free,arena=false,replace=false){
 if(savedRun&&!replace){pendingStart={free,arena};$('replace-run').showModal();return;}
 if(ready&&!pausedByLoss&&!document.hidden){atTitle=false;screen('playing');}
 if(!ready||pausedByLoss||document.hidden||arena&&world!=='metro')return;release();silence();clearResults();unlock();run=arena?new ArenaRun({difficulty:arenaDifficulty}):new DistrictRun({world,free,contract:free?null:CONTRACTS[selected],seed:freshSeed()});renderer.reset(run);clock.reset();pacer.reset();mapTime=-1;phase='playing';$('panel').hidden=true;$('hud').hidden=$('map').hidden=false;$('resume').hidden=true;$('objective').textContent=arena?`Arena · ${DIFFICULTIES[arenaDifficulty].label}`:free?'Explore the district':run.contract.title;$('notice').textContent='';$('notice').hidden=true;noticeUntil=-1;
 $('world').setAttribute('aria-label',`${worldFor(run.world).title} playfield`);$('map').setAttribute('aria-label',`District map: yellow is you, cyan is collectible, orange is the ${worldFor(run.world).landmark}${run.world==='deep'?', purple is the shipwreck and gold is revealed treasure':''}`);
 clearCheckpoint();checkpoint();if(music)soundtrack.start(true);if(free)$('objective').textContent=`Explore ${worldFor(world).title}`;paintHUD();map();
 $('rival-tags').replaceChildren();for(const rival of run.rivals||[]){const tag=document.createElement('span');tag.className=`rival-${rival.id}`;tag.textContent=`${rival.name} · AI`;$('rival-tags').append(tag);}schedule();
}
function vector(){let x=input.x+(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),y=input.y+(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);return {x,y};}
function frame(now){
 raf=0;if(phase!=='playing')return;if(document.hidden){pause();return;}
 if(!clock.advance(now,dt=>{run.step(dt,vector());if(run.done)return false;})){pause();return;}
 audio.ambience.update(run.world,run.time,ambience&&!run.done,low);
 for(const event of run.events.splice(0)){
  if(event.actor==='you')renderer.signal(event,run);
  if(event.type==='reveal'&&event.actor==='you'){$('notice').textContent=`Lost cargo uncovered · ${event.count} gold caches`;noticeUntil=run.time+5;}
  if(event.type==='chain'){$('notice').textContent=`Relay ${run.relays} / 6 · ${event.count} pods opened`;noticeUntil=run.time+4;}
  if(event.type==='portal'){$('notice').textContent='All relays discharged · Portal activated';noticeUntil=run.time+6;}
  if(event.type==='solar'){$('notice').textContent='Four planets swallowed · Helios released';noticeUntil=run.time+6;}
  if(event.type==='impact'&&event.rim){renderer.impact(event);if(event.actor==='you')consume(event.object,event.speed);}
  if(event.type==='streak'&&event.actor==='you'&&sound)audio.cue('streak',event.chain,low);
  if(event.type==='consume'){
   if(event.actor==='you'){consume(event.object);feedback.add(event.object,event.points,run.time,low);if(event.object.type==='landmark'){$('notice').textContent=`${worldFor(run.world).landmark} down`;noticeUntil=run.time+4;}}
  }
 }
 const renderDt=pacer.take(now,run.done);
 if(renderDt!==null){
 renderer.render(run,renderDt);feedback.render(renderer,run.time,reduced);map();if(run.done||hudTime>run.time||run.time-hudTime>=.1)paintHUD();
 $('rival-tags').hidden=!run.arena;if(run.arena)run.rivals.forEach((r,i)=>{const v=renderer.screenPosition(r.player),tag=$('rival-tags').children[i];tag.hidden=!v.visible;tag.style.left=v.x+'%';tag.style.top=v.y+'%';});
 $('notice').hidden=run.time>noticeUntil;
 }
 if(!run.done&&run.time-checkpointTime>=10)checkpoint();
 if(run.done){
  if(!run.arena)clearCheckpoint();
  const c=run.contract,before=career;career=recordExploration(recordResult(career,run),run);const rewards=earnedRewards(before,career);const saved=writeStorage(CAREER_KEY,JSON.stringify(career));menu(!run.arena&&run.won&&sound);phase='ended';$('title').textContent=run.arena?(run.won?'Arena victory':'Match complete'):run.won?'Contract complete':'Time’s up';
  $('description').textContent=run.won?`${c?.title||'Free roam'} complete. ${c?'★'.repeat(run.time<=c.gold?3:run.time<=c.silver?2:1):''}`:growthInfo(run.world,1.2).intro;
  $('status').textContent=`${run.score.toLocaleString()} points · ${run.eaten} objects · ${Math.round(run.time)}s${saved?' · Progress saved':' · Storage unavailable: progress lasts this session'}`;
  if(run.arena){
   screen('results');$('panel').classList.add('results-view');$('return-menu').hidden=false;
   $('description').textContent=`${DIFFICULTIES[run.difficulty].label} · Highest score wins. Rivals are AI-controlled.`;$('contracts').hidden=$('pace').hidden=true;$('standings').hidden=false;$('standings').replaceChildren();
   run.standings().forEach(r=>{const row=document.createElement('li');row.textContent=`${r.rank}. ${r.name}${r.id==='you'?'':' · AI'} — ${r.score.toLocaleString()}`;row.className=r.id==='you'?'you':'';$('standings').append(row);});if(!run.won&&run.score>0&&run.standings().find(r=>r.id==='you').rank===1)$('title').textContent='Joint first';$('start').textContent='Start contract';return;
  }
  const next=CONTRACTS.findIndex((x,i)=>x.world===world&&unlocked(career,i)&&!career.records[x.id]);if(run.won&&next>=0)selected=next;contracts();$('start').textContent=run.won&&next>=0?'Next contract':'Play again';
  if(run.won&&c?.id==='infinity-galaxies'&&CONTRACTS.every(c=>career.records[c.id])){$('title').textContent='Expedition complete';$('description').textContent=`All six worlds cleared · ${medalCount(career)} / ${TOTAL_MEDALS} medals. Revisit any world to improve your medals or explore in Free Roam.`;}
  if(rewards.length)$('description').textContent+=` Unlocked: ${rewards.map(r=>r.name).join(', ')} rim${rewards.length>1?'s':''}.`;
  showResults();if(sound&&run.won){unlock();audio.cue('win',10,low);}
  return;
 }
 schedule();
}
const surface=$('world');
surface.addEventListener('pointerdown',e=>{if(phase!=='playing'||pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();unlock();pointer=e.pointerId;origin={x:e.clientX,y:e.clientY};$('stick').hidden=false;$('stick').style.left=e.clientX+'px';$('stick').style.top=e.clientY+'px';surface.setPointerCapture(pointer);});
surface.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-origin.x,dy=e.clientY-origin.y,d=Math.hypot(dx,dy),scale=d>48?48/d:1;input.x=dx*scale/48;input.y=dy*scale/48;$('stick').firstElementChild.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;});
for(const name of['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(name,e=>{if(e.pointerId===pointer)release();});
surface.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if($('locker').open||$('arena-menu').open||$('options-menu').open||$('replace-run').open)return;const k=e.key.toLowerCase();if(k==='escape'){if(!e.repeat){if(phase==='menu'&&!atTitle){atTitle=true;menu();$('title-play').focus();}else(phase==='paused'?resume:pause)();}return;}if(k==='enter'&&atTitle&&e.target===document.body){e.preventDefault();$('title-play').click();return;}if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(k)){e.preventDefault();if(phase==='playing')keys.add(k);}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',pause);addEventListener('pagehide',pause);addEventListener('resize',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});document.addEventListener('freeze',pause);
addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='daemoncade:suspend')pause();});
surface.addEventListener('renderlost',()=>{pausedByLoss=true;pause();$('resume').disabled=true;});surface.addEventListener('renderrestored',()=>{pausedByLoss=false;$('resume').disabled=false;$('status').textContent='Graphics restored. Resume when ready.';});
$('pause').onclick=()=>phase==='paused'?resume():pause();$('resume').onclick=resume;$('start').onclick=()=>start(false);$('free').onclick=()=>start(true);
$('title-play').onclick=()=>{if(phase==='error'){prepare();return;}if(!ready)return;if(savedRun){resumeCheckpoint();return;}atTitle=false;menu();$('start').focus();};
$('title-browse').onclick=()=>{atTitle=false;menu();$('start').focus();};
$('cancel-replace').onclick=()=>{pendingStart=null;$('replace-run').close();};
$('confirm-replace').onclick=()=>{const next=pendingStart;pendingStart=null;$('replace-run').close();if(next)start(next.free,next.arena,true);};
$('back-title').onclick=()=>{atTitle=true;menu();$('title-play').focus();};
for(const id of['title-settings','settings-open'])$(id).onclick=()=>$('options-menu').showModal();
$('close-options').onclick=()=>$('options-menu').close();
$('title-collection').onclick=()=>$('customize').click();
$('leave').onclick=()=>{career=recordExploration(career,run);writeStorage(CAREER_KEY,JSON.stringify(career));if(!run.arena)clearCheckpoint();menu();};$('return-menu').onclick=menu;
$('keep-clearing').onclick=()=>{
 if(phase!=='ended'||pausedByLoss||document.hidden||!run.continueExploring())return;
 release();silence();clearResults();unlock();if(music)soundtrack.start();clock.rebase();pacer.reset();phase='playing';screen('playing');$('panel').hidden=true;$('hud').hidden=$('map').hidden=false;$('objective').textContent='Clear the world';$('notice').hidden=true;noticeUntil=-1;paintHUD();schedule();
 checkpoint();
};
$('arena').onclick=()=>{arenaOptions();$('arena-menu').showModal();};$('close-arena').onclick=()=>$('arena-menu').close();$('play-arena').onclick=()=>{$('arena-menu').close();start(false,true);};
$('customize').onclick=()=>{pendingBackup=null;$('import-save').value='';$('import-save').disabled=$('pick-save').disabled=phase==='paused';$('apply-save').disabled=true;$('backup-status').textContent=phase==='paused'?'End your current run before restoring a save. You can still export a backup.':'Importing replaces this device’s campaign progress. Your five-world beta save is never changed.';$('locker').showModal();collection();};
$('close-locker').onclick=()=>$('locker').close();
$('pick-save').onclick=()=>$('import-save').click();
$('export-save').onclick=()=>{const blob=new Blob([encodeBackup(career)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sinkhole-metro-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('backup-status').textContent='Save exported. Keep this file somewhere safe.';};
$('import-save').onchange=async()=>{
 const file=$('import-save').files[0];pendingBackup=null;$('apply-save').disabled=true;if(!file)return;
 try{if(file.size>65536)throw new Error('Choose a save file smaller than 64 KB.');pendingBackup=decodeBackup(await file.text());$('backup-status').textContent=`Ready to restore ${medalCount(pendingBackup)} / ${TOTAL_MEDALS} medals. Replace your current ${medalCount(career)} medals?`;$('apply-save').disabled=false;}
 catch(error){$('backup-status').textContent=error.message;}
};
$('apply-save').onclick=()=>{
 if(!pendingBackup||phase==='paused')return;career=pendingBackup;pendingBackup=null;clearCheckpoint();const saved=writeStorage(CAREER_KEY,JSON.stringify(career));selected=bestContract(world);rim=rimFor(career,rim).id;save();collection();contracts();$('apply-save').disabled=true;
 $('backup-status').textContent=saved?'Campaign progress restored.':'Restored for this session only: device storage is unavailable.';
 if(!worldUnlocked(career,world))chooseWorld('metro');else if(phase==='menu'||phase==='ended')menu();
};
$('sound').onclick=()=>{sound=!sound;if(!sound)audio.stopVoices();if(phase!=='playing')silence();else if(!sound&&!ambience)audio.suspend();else unlock();save();soundUI();};
$('music').onclick=()=>{music=!music;if(music&&phase==='playing')soundtrack.start();else soundtrack.pause();save();soundUI();};
$('ambience').onclick=()=>{ambience=!ambience;if(!ambience)audio.ambience.stop();if(phase!=='playing')silence();else if(!sound&&!ambience)audio.suspend();else unlock();save();soundUI();};
$('quality').onclick=()=>{low=!low;renderer?.quality(low);save();soundUI();renderer?.render(run,0);};
$('frame-rate').onclick=()=>{frameRate=frameRate===60?30:60;pacer.setRate(frameRate);save();soundUI();};
soundUI();
async function prepare(){
 ready=false;menu();phase='loading';$('start').disabled=$('free').disabled=$('arena').disabled=$('customize').disabled=true;$('title').textContent=worldFor(world).title;
 try{
  renderer??=new MetroRenderer(surface);renderer.quality(low);
  await renderer.load(run,(done,total)=>{$('status').textContent=`Preparing the district… ${Math.round(done/total*100)}%`;});
  renderer.render(run,1);ready=true;menu();$('start').disabled=$('free').disabled=$('customize').disabled=false;$('arena').disabled=world!=='metro';$('arena').title=world==='metro'?'Play against AI rivals':'Arena is currently available in Metro';$('start').onclick=()=>start(false);
 }catch(error){console.error(error);phase='error';titleUI();worldButtons();$('status').textContent='The district could not load. Check your connection, then retry or choose another world.';$('start').textContent='Retry loading';$('start').disabled=false;$('start').onclick=()=>{$('start').disabled=true;prepare();};}
}
prepare();
