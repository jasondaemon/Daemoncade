import { Run, MISSIONS, WEAPONS, DIFFICULTIES, clamp } from './simulation.js?v=1.0.0';
import { Battlefield } from './renderer.js?v=1.0.0';
import { Sound } from './audio.js?v=1.0.0';
import { restoreCampaign, currentStage, completeStage } from './campaign.js?v=1.0.0';

const $=id=>document.getElementById(id),KEY='daemoncade_blitz_campaign_v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
const saved=read();let campaign=restoreCampaign(saved),selected=currentStage(campaign),difficulty=DIFFICULTIES[saved.difficulty]?saved.difficulty:'normal',quality=saved.quality==='low'?'low':'auto',reduced=saved.reduced??matchMedia('(prefers-reduced-motion: reduce)').matches;
let best=typeof saved.best==='object'&&saved.best?saved.best:{},stars=typeof saved.stars==='object'&&saved.stars?saved.stars:{};
stars=Object.fromEntries([0,1,2].map(i=>[i,clamp(Math.floor(Number(stars[i]))||0,0,3)]));
const sound=new Sound(saved.sound!==false);let renderer,run=null,state='loading',last=performance.now(),accumulator=0,noticeUntil=0,resultDelay=0,drag=null,keys=new Set(),frames=0,frameTime=0,diagnostics={fps:0,draws:0,triangles:0};
function save(){try{localStorage.setItem(KEY,JSON.stringify({...campaign,difficulty,quality,reduced,sound:sound.enabled,best,stars}))}catch{}}
function selectMission(){
  document.querySelectorAll('[data-difficulty]').forEach(b=>{b.classList.toggle('active',b.dataset.difficulty===difficulty);b.setAttribute('aria-pressed',String(b.dataset.difficulty===difficulty))});
  $('stage-number').textContent=campaign.completed===3?'CAMPAIGN COMPLETE':`STAGE 0${selected+1} / 03`;
  $('stage-name').textContent=['Harbor Breach','Iron Channel','Last Transmission'][selected];
  document.querySelectorAll('.campaign-track i').forEach((part,i)=>{part.classList.toggle('complete',i<campaign.completed);part.classList.toggle('current',i===selected&&campaign.completed<3)});
  $('district').textContent=MISSIONS[selected].district;
}
function notice(text,kind='good',duration=1.4){$('banner').textContent=text;$('banner').className='banner '+kind;$('banner').hidden=false;noticeUntil=(run?.time||0)+duration;}
function menu(){state='menu';run=null;resultDelay=0;selected=currentStage(campaign);renderer?.reset();$('overlay').hidden=false;document.querySelector('.overlay-card').classList.remove('is-result');$('overlay-title').innerHTML='BLITZ<span>!</span>';$('eyebrow').textContent='HARBOR STRIKE';$('overlay-copy').hidden=true;['campaign-status','mode-picker'].forEach(id=>$(id).hidden=false);document.querySelector('.preferences').open=false;$('result').hidden=true;$('menu').hidden=true;$('start').textContent=campaign.completed===3?'NEW CAMPAIGN':campaign.started?'CONTINUE':'PLAY';$('start').disabled=false;$('boss-hud').hidden=true;$('banner').hidden=true;selectMission();updateHUD();}
function start(){
  sound.unlock();if(state==='paused'){resume();return}if(state==='loading'||state==='playing')return;if(state==='error'){location.reload();return}
  if(campaign.completed===3)campaign=restoreCampaign({completed:0});
  selected=currentStage(campaign);campaign.started=true;save();document.querySelector('.preferences').open=false;
  renderer.reset();run=new Run(selected,difficulty);state='playing';keys.clear();drag=null;accumulator=0;last=performance.now();resultDelay=0;$('overlay').hidden=true;$('boss-hud').hidden=true;$('banner').hidden=true;$('game-host').focus({preventScroll:true});$('hint').textContent='DRAG TO STEER · SHOOT GATES TO GROW';selectMission();updateHUD();
}
function pause(){if(state!=='playing')return;state='paused';keys.clear();drag=null;accumulator=0;$('overlay').hidden=false;document.querySelector('.overlay-card').classList.add('is-result');$('eyebrow').textContent=`STAGE 0${selected+1}`;$('overlay-title').textContent='PAUSED';$('overlay-copy').hidden=true;['campaign-status','mode-picker','result'].forEach(id=>$(id).hidden=true);$('start').textContent='RESUME';$('start').disabled=false;$('menu').hidden=false;$('menu').textContent='EXIT STAGE';$('start').focus({preventScroll:true});}
function resume(){state='playing';keys.clear();drag=null;last=performance.now();accumulator=0;$('overlay').hidden=true;$('game-host').focus({preventScroll:true});}
function finish(win){
  state=win?'won':'lost';keys.clear();drag=null;const key=selected+':'+difficulty;best[key]=Math.max(Number(best[key])||0,run.score);const rating=win?1+(run.force>=20?1:0)+(run.losses<=5?1:0):0;stars[selected]=Math.max(Number(stars[selected])||0,rating);if(win)completeStage(campaign,selected);save();
  try{window.GameScores?.record({game:'blitz',mode:'harbor-'+(selected+1),difficulty,metric:'score',value:run.score,meta:{victory:win,force:run.force,kills:run.kills,stars:rating}})}catch{}
  sound.play(win?'win':'lose');resultDelay=.85;$('boss-hud').hidden=true;$('banner').hidden=true;
}
function results(){
  const win=state==='won';$('overlay').hidden=false;document.querySelector('.overlay-card').classList.add('is-result');$('eyebrow').textContent=`STAGE 0${selected+1} / 03`;$('overlay-title').textContent=win?(campaign.completed===3?'CAMPAIGN COMPLETE':'STAGE CLEAR'):'SQUAD LOST';$('overlay-copy').hidden=win;$('overlay-copy').textContent=run.bossTime>=45?'Time expired.':'Stage not completed.';
  ['campaign-status','mode-picker'].forEach(id=>$(id).hidden=true);$('result').hidden=false;$('result').replaceChildren();
  for(const [label,value] of [['SCORE',run.score.toLocaleString()],['BEST',best[selected+':'+difficulty].toLocaleString()],['HOSTILES CLEARED',run.kills],['SQUAD EXTRACTED',run.force]]){const d=document.createElement('div'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=label;b.textContent=value;d.append(s,b);$('result').append(d)}
  $('start').textContent=win?(campaign.completed===3?'NEW CAMPAIGN':'NEXT STAGE'):'RETRY';$('start').disabled=false;$('menu').hidden=false;$('menu').textContent='MAIN MENU';$('start').focus({preventScroll:true});
}
function processEvents(){for(const e of run.drain()){
  if(e.type==='casualty')renderer.casualty(e.object,e.previous);
  if(e.type==='fire'){sound.play('fire',e.weapon);if(e.weapon==='flame')renderer.burst(e.x,e.z,WEAPONS[e.weapon].color,3)}
  if(e.type==='hit')renderer.burst(e.x,e.z,e.kind==='enemy'?0xffb98b:0xffe1a1,2);
  if(e.type==='explosion'){renderer.burst(e.x,e.z,0xffc379,e.big?90:22,e.big);sound.play('explosion')}
  if(e.type==='hurt'){renderer.burst(e.x,e.z,0x6be3ff,14);sound.play('hurt');notice('−'+e.amount+' SQUAD','bad',.7);renderer.shake=reduced?0:.12;}
  if(e.type==='reward'){notice(e.text);sound.play('reward');renderer.burst(e.x,e.z,0x83f6d3,18)}
  if(e.type==='weapon'){notice(WEAPONS[e.weapon].name+' ONLINE');sound.play('weapon');renderer.burst(e.x,e.z,WEAPONS[e.weapon].color,22)}
  if(e.type==='boost'){notice('OVERDRIVE · FIRE AT WILL');sound.play('boost')}
  if(e.type==='boss'){notice(e.name+' · BREAK THE LINE','bad',1.5);$('hint').textContent='DODGE RED VOLLEYS · DESTROY THE COMMAND TANK'}
  if(e.type==='end')finish(e.win);
}}
function updateHUD(){
  $('force').textContent=run?.force??12;$('power').textContent=WEAPONS[run?.weapon||'rifle'].name;$('score').textContent=String(run?.score||0).padStart(5,'0');
  $('progress').value=run?Math.min(100,run.distance/(run.definition.events.at(-1).at-18)*100):0;$('progress-label').textContent=run?.bossEngaged?'FINAL CONTACT':run?Math.round($('progress').value)+'%':'INSERTION';
  const energy=Math.floor(run?.energy||0);$('energy').value=energy;$('charge').textContent=run?.boost>0?run.boost.toFixed(1)+'s':energy+'%';$('overdrive').disabled=state!=='playing'||energy<100||run?.boost>0;$('overdrive').classList.toggle('ready',energy>=100||run?.boost>0);$('boost-state').textContent=run?.boost>0?'OVERDRIVE ACTIVE':'AUTO FIRE';
  const boss=run?.objects.find(o=>o.kind==='boss');$('boss-hud').hidden=!boss||!run.bossEngaged||state==='won'||state==='lost';if(boss){$('boss-health').value=Math.max(0,boss.hp/boss.maxHp*100);$('boss-name').textContent=run.definition.boss;$('boss-time').textContent=Math.max(0,Math.ceil(45-run.bossTime))+'s'}
  if(run?.time>noticeUntil)$('banner').hidden=true;
  if(run&&!run.bossEngaged&&run.time>8)$('hint').textContent=energy>=100?'OVERDRIVE READY · PRESS SPACE':'RED LANES = INCOMING FIRE';
}
function loop(now){
  const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=now;frames++;frameTime+=elapsed;if(frameTime>=1){diagnostics={fps:Math.round(frames/frameTime),draws:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles};frames=0;frameTime=0;if(['localhost','127.0.0.1'].includes(location.hostname))$('game-host').dataset.diagnostics=JSON.stringify({...diagnostics,state,time:run?.time,geometry:renderer.renderer.info.memory.geometries,textures:renderer.renderer.info.memory.textures,particles:renderer.particles.length});}
  if(state==='playing'){accumulator+=elapsed;while(accumulator>=1/60&&state==='playing'){const direction=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);run.targetX+=direction*8/60;run.update(1/60);processEvents();accumulator-=1/60;}}
  renderer.draw(run,elapsed,state!=='paused');if(resultDelay>0){resultDelay-=elapsed;if(resultDelay<=0)results()}updateHUD();requestAnimationFrame(loop);
}
document.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>{difficulty=b.dataset.difficulty;selectMission();save()}));
$('start').addEventListener('click',start);$('menu').addEventListener('click',menu);$('pause').addEventListener('click',()=>state==='paused'?resume():pause());$('overdrive').addEventListener('click',()=>run?.boostNow());
function soundUI(){$('sound').textContent=sound.enabled?'♪':'♪̸';$('sound').setAttribute('aria-label',sound.enabled?'Mute sound':'Enable sound')}
$('sound').addEventListener('click',()=>{sound.enabled=!sound.enabled;sound.unlock();soundUI();save()});soundUI();$('reduced').checked=reduced;$('quality').value=quality;
$('reduced').addEventListener('change',()=>{reduced=$('reduced').checked;if(renderer)renderer.reduced=reduced;save()});$('quality').addEventListener('change',()=>{quality=$('quality').value;save();if(renderer){renderer.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.6));renderer.renderer.shadowMap.enabled=quality!=='low';renderer.resize()}});
$('fullscreen').addEventListener('click',()=>{const promise=document.fullscreenElement?document.exitFullscreen?.():document.querySelector('.cabinet').requestFullscreen?.();promise?.catch(()=>notice('FULLSCREEN UNAVAILABLE','bad'))});
addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;const key=e.key.toLowerCase();if(key==='p'||key==='escape'){e.preventDefault();if(!e.repeat)state==='paused'?resume():pause();return}if(key===' '&&['BUTTON','A'].includes(e.target.tagName))return;if(['arrowleft','arrowright',' '].includes(key))e.preventDefault();if(key===' '){if(!e.repeat)run?.boostNow();return}keys.add(key)});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
const host=$('game-host');host.addEventListener('pointerdown',e=>{if(state!=='playing'||e.button!==0)return;sound.unlock();drag={id:e.pointerId,x:e.clientX,target:run.targetX};host.setPointerCapture(e.pointerId);host.focus({preventScroll:true})});host.addEventListener('pointermove',e=>{if(state==='playing'&&drag?.id===e.pointerId)run.targetX=clamp(drag.target+(e.clientX-drag.x)/host.clientWidth*11.5,-3.7,3.7)});for(const event of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(event,()=>drag=null);
selectMission();
try{
  renderer=new Battlefield(host,quality,reduced);renderer.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();state='error';$('overlay').hidden=false;$('overlay-title').textContent='DISPLAY PAUSED';$('overlay-copy').hidden=false;$('overlay-copy').textContent='The graphics context was interrupted. Reload to continue.';$('start').textContent='RELOAD';$('start').disabled=false;});
  requestAnimationFrame(loop);await renderer.load(progress=>$('start').textContent='PREPARING SQUAD · '+Math.round(progress*100)+'%');menu();
}catch(error){state='error';console.error('Blitz could not initialize',error);$('overlay-title').textContent='UNABLE TO LOAD';$('overlay-copy').hidden=false;$('overlay-copy').textContent='Check the connection, then retry.';$('start').textContent='RETRY';$('start').disabled=false;}
// Read-only diagnostics for local QA, absent in deployed builds.
if(['localhost','127.0.0.1'].includes(location.hostname))Object.defineProperty(window,'blitzDiagnostics',{get:()=>({state,...diagnostics,force:run?.force,weapon:run?.weapon,time:run?.time,objects:run?.objects.length,particles:renderer?.particles.length,pooledParticles:renderer?.pool.length,geometry:renderer?.renderer.info.memory.geometries,textures:renderer?.renderer.info.memory.textures})});
