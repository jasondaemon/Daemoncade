import {initPhysics,PinballPhysics,STEP} from './physics.js?v=1.0.0-beta.2';
import {Rules} from './rules.js?v=1.0.0-beta.2';
import {TableScene} from './scene.js?v=1.0.0-beta.2';
import {DMD} from './dmd.js?v=1.0.0-beta.2';
import {AudioEngine} from './audio.js?v=1.0.0-beta.2';
const $=id=>document.getElementById(id);
const BEST_KEY='pinball.midnight-run.v1.best';

class Game {
 constructor(){
  this.phase='menu';this.paused=false;this.practice=false;this.pending=[];this.accumulator=0;this.last=0;this.uiTime=0;this.lastHud='';this.saveUntil=0;this.launchBall=null;this.charging=false;this.chargeStart=0;this.best=0;this.pointers=new Map();this.keys=new Set();
  try{this.best=Number(localStorage.getItem(BEST_KEY))||0;}catch{}
  this.audio=new AudioEngine();this.dmd=new DMD($('dmd'));this.rules=new Rules(e=>this.ruleEvent(e));
 }
 async init(){
  await initPhysics();this.physics=new PinballPhysics((e,b)=>this.hit(e,b));this.scene=new TableScene($('table'),this.physics);
  this.bind();this.resize=new ResizeObserver(()=>this.scene.resize());this.resize.observe($('table'));
  $('loading').hidden=true;$('menu').hidden=false;document.body.className='menu';this.updateHud();requestAnimationFrame(t=>this.frame(t));
 }
 ruleEvent(e){this.dmd.push(e);if(['multiball','jackpot','extra','mission'].includes(e.type))this.audio.sound('jackpot');if(e.type==='tilt')this.releaseInputs();}
 schedule(delay,fn){this.pending.push({at:this.physics.time+delay,fn});}
 serve(auto=false){
  const b=this.physics.addBall();this.launchBall=b;
  if(auto){this.physics.launch(b,.8);this.launchBall=null;this.phase='playing';}
  else {this.phase='ready';this.dmd.push({type:'serve',title:`BALL ${this.rules.ballNumber}`,detail:'HOLD + RELEASE LAUNCH'});}
 }
 start(practice=false){
  this.saveFailed=false;
  this.audio.unlock().catch(()=>{});this.releaseInputs();this.physics.clear();this.rules.reset();this.dmd.clear();this.pending=[];this.practice=practice;this.paused=false;this.accumulator=0;this.saveUntil=0;this.launchBall=null;this.recorded=false;
  $('menu').hidden=true;$('overlay').hidden=true;$('rules').hidden=true;document.body.className='playing';document.activeElement?.blur();this.serve();this.updateHud();
 }
 beginCharge(){if(this.phase!=='ready'||this.paused||!$('rules').hidden)return;this.audio.unlock().catch(()=>{});this.charging=true;this.chargeStart=performance.now();}
 launch(){
  if(!this.charging)return;const power=Math.min(1,(performance.now()-this.chargeStart)/1000);this.charging=false;
  if(this.paused||this.phase!=='ready'||!this.launchBall)return;
  const firstLaunch=!this.launchBall.launched;
  this.physics.launch(this.launchBall,power);this.launchBall=null;this.phase='playing';
  if(firstLaunch){this.saveUntil=this.physics.time+8;this.skillUntil=this.physics.time+4;}
  this.audio.sound('launch');this.updateHud();
 }
 flip(side,up){
  if(this.paused||!['ready','playing'].includes(this.phase)||this.rules.tilted)up=false;
  if(this.physics.held[side]!==up){this.physics.setFlipper(side,up);if(up)this.audio.sound('flipper');}
  $(side===0?'touchLeft':'touchRight').classList.toggle('held',up);
 }
 syncFlippers(){for(let i=0;i<2;i++){const touch=[...this.pointers.values()].some(p=>p.side===i);this.flip(i,touch||(i===0?(this.keys.has('arrowleft')||this.keys.has('z')):(this.keys.has('arrowright')||this.keys.has('m'))));}}
 releaseInputs(){
  this.charging=false;this.keys.clear();
  const captures=[...this.pointers].map(([id,p])=>[id,$(p.side===0?'touchLeft':'touchRight')]);
  if(this.launchPointer!=null)captures.push([this.launchPointer,$('launch')]);
  this.launchPointer=null;this.pointers.clear();
  for(const [id,el] of captures){try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch{}}
  if(this.physics){this.flip(0,false);this.flip(1,false);}
 }
 nudge(side){if(this.phase!=='playing'||this.paused)return;if(this.rules.nudge(this.physics.time)){this.physics.nudge(side);this.audio.sound('nudge');}this.updateHud();}
 hit(e,ball){
  if(e.type==='drain'){this.drain(ball);return;}
  if(e.type==='shooter-return'){
    if(this.phase==='ready')return;
    if(this.rules.multiball)this.physics.launch(ball,.8);
    else {this.launchBall=ball;this.phase='ready';this.dmd.push({type:'return',title:'SHOOT AGAIN',detail:'HOLD + RELEASE LAUNCH'});this.updateHud();}
    return;
  }
  if(e.type==='stuck'){
    ball.body.setLinvel({x:ball.body.translation().x>0?-2:2,y:.3,z:4},true);this.dmd.push({type:'search',title:'BALL SEARCH',detail:'BACK IN THE ACTION'});return;
  }
  if(e.type==='skill'&&this.physics.time<this.skillUntil){this.skillUntil=0;this.rules.award(1500);this.dmd.push({type:'skill',title:'SKILL SHOT',detail:'1,500 POINTS',priority:4});}
  if(e.type==='scoop'){
    const lock=this.rules.lock();this.physics.removeBall(ball);
    if(lock==='multiball'){
      this.audio.sound('lock');this.saveUntil=this.physics.time+12;
      for(let i=0;i<3;i++)this.schedule(.6+i*.75,()=>this.serve(true));
    } else if(lock==='locked'){this.audio.sound('lock');this.schedule(.8,()=>this.serve());}
    else {
      this.rules.award(500);this.schedule(.5,()=>this.physics.addBall(-3.1,16.9,{x:2.5,y:.6,z:-6}));
    }
    this.updateHud();return;
  }
  // Ramp completion requires entry from the elevated side, not a ground-level hit.
  if(e.type==='ramp'){
    if(!ball.rampTransit||ball.body.linvel().z>=-1)return;
    ball.rampTransit=false;
  }
  if(e.type==='orbit'&&ball.body.linvel().z<0)return;
  this.rules.hit(e);this.scene.pulse(e.type,e.id);if(['bumper','target','sling'].includes(e.type))this.audio.sound(e.type);
  this.updateHud();
 }
 drain(ball){
  const waiting=ball===this.launchBall;this.physics.removeBall(ball);if(waiting)this.launchBall=null;
  if(this.phase==='over'||this.phase==='menu')return;
  this.audio.sound('drain');
  if(!this.rules.tilted&&(this.practice||this.physics.time<this.saveUntil)){
    this.dmd.push({type:'save',title:'BALL SAVED',detail:this.practice?'PRACTICE MODE':'STAY IN THE RACE',priority:6});
    this.schedule(.65,()=>this.serve(this.rules.multiball));return;
  }
  if(this.physics.balls.length||this.pending.length){
    if(this.rules.multiball&&this.physics.balls.length===1&&!this.pending.length)this.rules.endMultiball();return;
  }
  this.phase='bonus';if(this.rules.multiball)this.rules.endMultiball();const over=this.rules.endBall();
  this.schedule(1.8,()=>over?this.finish():this.serve());this.updateHud();
 }
 finish(){
  this.phase='over';this.releaseInputs();this.audio.suspend();
  if(!this.recorded&&!this.practice){this.recorded=true;this.best=Math.max(this.best,this.rules.score);try{localStorage.setItem(BEST_KEY,String(this.best));window.GameScores?.record({game:'pinball',mode:'midnight-run-v1',difficulty:'arcade',value:this.rules.score,meta:{table:'midnight-run',rulesVersion:1}});}catch{this.saveFailed=true;}}
  $('overlayTitle').textContent='Night complete';$('overlayText').textContent=`${this.rules.score.toLocaleString()} points · ${this.rules.missions.filter(Boolean).length} / 3 missions · ${this.rules.jackpots} jackpots${this.saveFailed?' · Your browser could not save this score.':''}`;
  $('resume').hidden=true;$('restart').textContent='PLAY AGAIN';$('overlay').hidden=false;this.dmd.push({type:'over',title:'NIGHT COMPLETE',detail:this.rules.score.toLocaleString(),priority:15});this.updateHud();
 }
 pause(){
  this.audio.suspend();this.releaseInputs();if(!['playing','ready','bonus'].includes(this.phase))return;
  this.paused=true;$('overlayTitle').textContent='Paused';$('overlayText').textContent='Your table is waiting. Resume when you are ready.';$('resume').hidden=false;$('restart').textContent='NEW GAME';$('overlay').hidden=false;
 }
 resume(){if(document.hidden)return;this.paused=false;this.last=performance.now();this.accumulator=0;$('overlay').hidden=true;this.audio.unlock().catch(()=>{});}
 menu(){this.releaseInputs();this.physics.clear();this.pending=[];this.phase='menu';this.paused=false;$('overlay').hidden=true;$('menu').hidden=false;document.body.className='menu';this.dmd.clear();this.audio.suspend();this.updateHud();}
 updateHud(){
  const r=this.rules,objective=this.phase==='ready'?'Hold LAUNCH to set the plunger strength':this.practice?'PRACTICE · '+r.objective():r.objective();
  const key=[r.score,r.ballNumber,r.ballsTotal,this.best,objective,this.phase,r.multiball,this.paused].join(':');if(key===this.lastHud)return;this.lastHud=key;
  $('score').textContent=r.score.toLocaleString();$('ball').textContent=r.multiball?'MULTI':`${Math.min(r.ballNumber,r.ballsTotal)} / ${r.ballsTotal}`;$('best').textContent=this.best.toLocaleString();$('objective').textContent=objective;$('launch').disabled=this.phase!=='ready'||this.paused;
 }
 frame(now){
  const elapsed=this.last?(now-this.last)/1000:0;this.last=now;
  if(elapsed>.5&&this.phase==='playing'&&!this.paused)this.pause();
  if(!document.hidden){
    this.uiTime+=Math.min(elapsed,.1);
    if(!this.paused&&['ready','playing','bonus'].includes(this.phase)){
      this.accumulator+=Math.min(elapsed,.1);let steps=0;
      while(this.accumulator>=STEP&&steps++<24){
        this.physics.tick();this.accumulator-=STEP;
        const due=this.pending.filter(p=>p.at<=this.physics.time);this.pending=this.pending.filter(p=>p.at>this.physics.time);due.forEach(p=>p.fn());
      }
    }else this.accumulator=0;
    const charge=this.charging?Math.min(1,(now-this.chargeStart)/1000):0;$('charge').style.width=`${charge*100}%`;
    this.scene.render(this.uiTime,Math.min(1,this.accumulator/STEP),this.rules,charge);this.dmd.draw(this.uiTime,this.rules,this.phase);this.updateHud();
  }
  requestAnimationFrame(t=>this.frame(t));
 }
 bind(){
  $('start').onclick=()=>this.start();$('practice').onclick=()=>this.start(true);$('restart').onclick=()=>this.start(this.practice);$('returnMenu').onclick=()=>this.menu();$('resume').onclick=()=>this.resume();$('pause').onclick=()=>this.paused?this.resume():this.pause();
  $('sound').onclick=()=>{this.audio.enabled=!this.audio.enabled;$('sound').textContent=this.audio.enabled?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',String(this.audio.enabled));if(!this.audio.enabled)this.audio.suspend();else if(!this.paused)this.audio.unlock().catch(()=>{});};
  $('help').onclick=()=>{this.helpWasPaused=this.paused;this.pause();$('overlay').hidden=true;$('rules').hidden=false;};
  $('closeRules').onclick=()=>{$('rules').hidden=true;if(['playing','ready','bonus'].includes(this.phase)){if(this.helpWasPaused)this.pause();else this.resume();}else if(this.phase==='over')$('overlay').hidden=false;};
  const launch=$('launch');this.launchPointer=null;
  launch.addEventListener('pointerdown',e=>{e.preventDefault();if(e.button!==0||this.launchPointer!==null||this.paused||this.phase!=='ready'||!$('rules').hidden)return;this.launchPointer=e.pointerId;launch.setPointerCapture(e.pointerId);this.beginCharge();});
  launch.addEventListener('pointerup',e=>{if(e.pointerId!==this.launchPointer)return;e.preventDefault();this.launchPointer=null;this.launch();});
  for(const name of ['pointercancel','lostpointercapture'])launch.addEventListener(name,e=>{if(e.pointerId===this.launchPointer){this.launchPointer=null;this.charging=false;}});
  ['touchLeft','touchRight'].forEach((id,side)=>{
    const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();if(e.button!==0||this.paused||!['ready','playing'].includes(this.phase)||!$('rules').hidden)return;el.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{side,y:e.clientY,nudged:false});this.audio.unlock().catch(()=>{});this.syncFlippers();});
    el.addEventListener('pointermove',e=>{const p=this.pointers.get(e.pointerId);if(p&&!p.nudged&&p.y-e.clientY>45){p.nudged=true;this.nudge(side===0?1:-1);}});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,e=>{this.pointers.delete(e.pointerId);this.syncFlippers();});
  });
  for(const type of ['contextmenu','selectstart','dragstart'])document.querySelector('.cabinet').addEventListener(type,e=>e.preventDefault());
  // iOS gesture events must not steal a captured two-finger flipper interaction.
  for(const type of ['gesturestart','gesturechange','gestureend'])document.querySelector('.play-area').addEventListener(type,e=>{if(['ready','playing'].includes(this.phase)&&!this.paused&&$('rules').hidden)e.preventDefault();},{passive:false});
  window.addEventListener('orientationchange',()=>this.pause());
  document.addEventListener('freeze',()=>this.pause());
  document.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();if(!['arrowleft','arrowright','z','m',' ','q','e','escape'].includes(k))return;
    if(k===' '&&e.target instanceof HTMLButtonElement)return;e.preventDefault();if(e.repeat)return;
    this.keys.add(k);this.syncFlippers();if(k===' ')this.beginCharge();if(k==='q')this.nudge(1);if(k==='e')this.nudge(-1);if(k==='escape'){if(!$('rules').hidden)$('closeRules').click();else this.paused?this.resume():this.pause();}
  });
  document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();this.keys.delete(k);this.syncFlippers();if(k===' ')this.launch();});
  for(const name of ['blur','pagehide'])window.addEventListener(name,()=>this.pause());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();});
  window.addEventListener('message',e=>{if(e.source===window.parent&&e.origin===location.origin&&e.data?.type==='daemoncade:suspend')this.pause();});
  $('table').addEventListener('webglcontextlost',e=>{e.preventDefault();this.pause();$('overlayText').textContent='Graphics interrupted. Wait a moment before resuming.';});
  $('table').addEventListener('webglcontextrestored',()=>{this.scene.resize();$('overlayText').textContent='Graphics restored. Your table is ready.';});
 }
}

const game=new Game();
game.init().catch(error=>{$('loading').textContent='The table could not start. Please try a current browser with WebGL enabled.';console.error(error);});
