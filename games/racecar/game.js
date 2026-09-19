import { Run, safeSpeed, clamp } from "./rules.js?v=39";
import { resultPresentation } from './results.js?v=39';
import { RoadScene } from "./view.js?v=39";
import { FrameDiagnostics } from './performance.js?v=39';
import { captureMotion, interpolateMotion } from './render-motion.js?v=39';
import { Sound } from "./sound.js?v=39";
import {TouchDrive} from './touch-drive.js?v=39';
const touchDrive=new TouchDrive();
import {SecretCode} from './secret-code.js?v=39';
const secretCode=new SecretCode();
import { CAREER_KEY, CIRCUITS, restoreCareers, profile, series, tunedCar, settle, configureCareerRivals } from './career.js?v=39';
import { renderCareerGarage, animateGarage } from './career-ui.js?v=39';
import { careerTrack } from './career-tracks.js?v=39';

const $ = (id) => document.getElementById(id),
  KEY = "racecar_career_preferences_v1";
let careers;
try { careers=restoreCareers(JSON.parse(localStorage.getItem(CAREER_KEY)||'{}')); }
catch { careers=restoreCareers(); }
let previousMotion = null;
let renderedRun=null,renderedScreen=null;
const profiling=new URLSearchParams(location.search).has('profile');
let diagnostics=new FrameDiagnostics(),diagnosticUpdate=0;
let stored = {};
try {
  const raw = localStorage.getItem(KEY);
  stored = JSON.parse(raw || "{}") || {};
} catch {}
const progress = {mode:'race',difficulty:careers.active,sound:stored.sound!==false,reduced:typeof stored.reduced==='boolean'?stored.reduced:null},
  sound = new Sound(progress.sound),
  keys = new Set(),
  touch = {};
let run = new Run(),
  view,
  screen = "loading",
  last = performance.now(),
  accumulator = 0,
  drag = null,
  noticeTime = 0,
  outcome = null,
  loadFailed = false;
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
    localStorage.setItem(CAREER_KEY,JSON.stringify(careers));
    $('save-status').textContent='Saved on this device.';
  } catch { $('save-status').textContent='Storage is unavailable. Back up your careers before closing this page.'; }
};
const reduced =
  progress.reduced ?? matchMedia("(prefers-reduced-motion: reduce)").matches;
$("reduced").checked = reduced;
function clearInput() {
  touchDrive.reset();
  keys.clear();
  for (const name of Object.keys(touch)) touch[name] = false;
  drag = null;
  document
    .querySelectorAll(".touch button")
    .forEach((b) => b.classList.remove("down"));
}
function overlay(title, subtitle = "") {
  view?.stopPodium();
  $('splash').hidden=true;
  $('title-screen').hidden=true;
  document.querySelector('.menu-card').classList.remove('is-splash');
  document.querySelector('.menu-card').classList.remove('is-career');
  document.querySelector('.menu-card').classList.remove('is-results');
  $("overlay").hidden = false;
  $("title").textContent = title;
  $("subtitle").textContent = subtitle;
  $("subtitle").hidden = !subtitle;
  $("options").hidden = true;
  $("stage").hidden = true;
  $("result").hidden = true;
  $("menu").hidden = false;
  $("settings").open = false;
  $('career-tabs').hidden=true;
}
function menuPanel(panel) {
  document.querySelector('.menu-card').dataset.panel=panel;
  $('show-map').setAttribute('aria-pressed',String(panel==='map'));
  $('show-garage').setAttribute('aria-pressed',String(panel==='garage'));
  $('show-upgrades').setAttribute('aria-pressed',String(panel==='upgrades'));
}
$('show-map').onclick=()=>menuPanel('map');
$('show-garage').onclick=()=>{menuPanel('garage');$('garage').open=true;renderGarage();};
$('show-upgrades').onclick=()=>{menuPanel('upgrades');$('garage').open=true;renderGarage();};
function renderGarage() {
  renderCareerGarage(profile(careers),view,()=>{save();menu();});
}
$("garage").ontoggle=()=>{if($("garage").open&&screen==='menu')renderGarage();};
function splash() {
  secretCode.reset();
  sound.pauseMusic();
  screen='splash';sound.stop();clearInput();
  run=new Run({mode:'race',stage:0,difficulty:careers.active});
  overlay('RACECAR');
  document.querySelector('.menu-card').classList.add('is-splash');
  $('splash').hidden=false;$('menu').hidden=true;
  document.querySelectorAll('[data-difficulty]').forEach(b=>{
    const difficulty=b.dataset.difficulty,p=careers.profiles[difficulty];
    b.replaceChildren();
    const name=document.createElement('strong');name.textContent=difficulty.toUpperCase();
    const status=document.createElement('span');status.textContent=p?`${CIRCUITS[p.circuit].name} · $${p.wallet.toLocaleString()}`:'New career';
    const detail=document.createElement('small');detail.textContent=p?`${p.races} races · ${p.owned.length} cars · ${p.admitted.length} / ${CIRCUITS.length} circuits`:({easy:'Relaxed competition',normal:'Balanced competition',hard:'Demanding competition'})[difficulty];
    b.append(name,status,detail);b.setAttribute('aria-pressed',String(difficulty===careers.active));
  });
  $('start').disabled=false;$('start').textContent='START';
  updateHUD();
}
$('title-screen').onclick=splash;
function menu() {
  sound.track('lobby');
  const p=profile(careers), circuit=CIRCUITS[p.circuit], round=series(p).round;
  progress.mode='race';progress.difficulty=p.difficulty;
  screen = "menu";
  sound.stop();
  clearInput();
  outcome = null;
  const stage = round;
  run = new Run({
    mode: progress.mode,
    stage,
    difficulty: progress.difficulty,
  });
  overlay("RACECAR");
  document.querySelector('.menu-card').classList.add('is-career');
  $('title-screen').hidden=false;
  $("options").hidden = false;
  $('career-tabs').hidden=false;
  configureCareer(run);
  renderGarage();
  $("stage").hidden = false;
  $("menu").hidden = true;
  $("start").disabled = false;
  document
    .querySelectorAll("[data-difficulty]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.difficulty === progress.difficulty),
      ),
    );
  updateHUD();
  $('stage-label').textContent=`${p.difficulty.toUpperCase()} CAREER · RACE ${round+1} / 4`;
  $('stage-name').textContent=circuit.tracks[round];
  $('mode-note').textContent=`${circuit.name} · $${p.wallet.toLocaleString()} · Championship points ${series(p).points[0]}`;
  $('start').textContent='RACE';
}
function configureCareer(target) {
  const p=profile(careers), c=CIRCUITS[p.circuit];
  target.car=tunedCar(p);
  target.route=careerTrack(p.circuit,series(p).round);
  // Aim for roughly 2–3 minutes using actual corner speeds, not engine speed.
  let lapSeconds=0;
  for(let s=0;s<target.route.length;s+=20)lapSeconds+=Math.min(20,target.route.length-s)/Math.max(12,Math.min(48+p.circuit*6,safeSpeed(target.route,s)*.8));
  target.route.laps=Math.max(1,Math.min(3,Math.round(150/lapSeconds)));
  target.goal=target.route.length*target.route.laps;
  configureCareerRivals(target,p);
  target.championship={name:c.name};
  delete target.eventIndex;
  target.careerId=crypto.randomUUID();
  target.cashCollected=0;
}
function start() {
  if(screen==='splash') {menuPanel('garage');$('garage').open=true;menu();save();return;}
  if (screen === "error" || screen === 'stale') {
    location.reload();
    return;
  }
  if (screen === "paused") {
    resume();
    return;
  }
  if(screen==='results' && outcome?.qualified) {
    menu();menuPanel('garage');$("garage").open=true;renderGarage();
    $("garage").scrollIntoView({block:'nearest'});
    return;
  }
  if (!view || screen === "loading") return;
  const stage = series(profile(careers)).round;
  run = new Run({
    mode: progress.mode,
    stage,
    difficulty: progress.difficulty,
  });
  screen = "playing";
  diagnostics=new FrameDiagnostics();diagnosticUpdate=0;
  configureCareer(run);
  outcome = null;
  clearInput();
  save();
  accumulator = 0;
  last = performance.now();
  $("overlay").hidden = true;
  $("notice").hidden = true;
  $("host").focus({ preventScroll: true });
  sound.unlock();
  sound.raceMusic(profile(careers).circuit);
}
function pause() {
  if (screen !== "playing") return;
  screen = "paused";
  run.paused = true;
  clearInput();
  sound.stop();
  sound.pauseMusic();
  overlay("PAUSED");
  $("start").textContent = "RESUME";
  $("menu").textContent = "EXIT RACE";
  $("start").focus({ preventScroll: true });
}
function resume() {
  sound.resumeMusic();
  screen = "playing";
  run.paused = false;
  clearInput();
  last = performance.now();
  accumulator = 0;
  $("overlay").hidden = true;
  $("host").focus({ preventScroll: true });
  sound.unlock();
}
const time = (value) => {
  if (!Number.isFinite(value)) return "—";
  const m = Math.floor(value / 60),
    s = (value % 60).toFixed(2).padStart(5, "0");
  return m + ":" + s;
};
function finish() {
  screen = "results";
  sound.stop();
  clearInput();
  const championshipPoints=series(profile(careers)).points;
  const reward=settle(profile(careers),run);
  outcome = {qualified:run.phase==='finished',stars:Math.max(0,4-run.position),unlocked:[]};
  save();
  try {
    if(!profile(careers).ufoDiscount&&run.car?.id!=='ufo')window.GameScores?.record({
      game: "racecar",
      mode: run.mode,
      difficulty: run.difficulty,
      metric: "score",
      value: Math.floor(run.score),
      meta: {
        stage: run.stage + 1,
        completed: run.phase === "finished",
        position: run.mode === "race" ? run.position : undefined,
      },
    });
  } catch {}
  const presentation=resultPresentation(run,outcome);
  if(reward?.championshipPlace) {
    presentation.title=reward.championshipPlace===1?'CHAMPIONSHIP WINNER!':reward.championshipPlace<=3?'CHAMPIONSHIP PODIUM':'CHAMPIONSHIP COMPLETE';
    presentation.subtitle=reward.championshipPlace<=3?'Podium earned. Replay for cash or purchase the next circuit.':'Series complete. Return to the garage and try again.';
    if(profile(careers).circuit===CIRCUITS.length-1&&reward.championshipPlace<=3) {
      presentation.title='CAREER COMPLETE';presentation.subtitle='All five circuits cleared. Replay a championship or complete your car collection.';
    }
  } else if(run.phase==='finished') {
    presentation.subtitle='Earnings saved. Your next race is ready in the garage.';
    if(run.position>1)presentation.title='RACE COMPLETE';
  }
  overlay(presentation.title,presentation.subtitle);
  document.querySelector('.menu-card').classList.add('is-results');
  sound.track(outcome.qualified&&(reward?.championshipPlace||run.position)<=3?'win':'lose',false);
  $("result").hidden = false;
  $("result").replaceChildren();
  if(outcome.qualified) {
    const standings=reward?.championshipPlace?[run.player,...run.rivals].map((actor,index)=>({actor,index})).sort((a,b)=>championshipPoints[b.index]-championshipPoints[a.index]||a.index-b.index).map(item=>item.actor):run.standings();
    const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=510;canvas.className='podium-scene';
    canvas.setAttribute('aria-label',(reward?.championshipPlace?'Championship':'Race')+' podium: '+standings.slice(0,3).map((r,i)=>`${i+1}. ${r.name}`).join(', '));
    view.podium(canvas,standings.slice(0,3).map(r=>({carId:r.id==='you'?run.car.id:r.carId,paint:r.id==='you'?profile(careers).paint[run.car.id]:undefined})));
    const names=document.createElement('div');names.className='podium-names';
    for(const place of [2,1,3]){const label=document.createElement('span');label.textContent=`${place} · ${standings[place-1]?.name||'—'}`;names.append(label);}
    $('result').append(canvas,names);
    if(!reward?.championshipPlace) $('title').textContent=run.position===1?'VICTORY!':run.position<=3?'PODIUM FINISH!':'RACE COMPLETE';
    $('subtitle').textContent=reward?.championshipPlace?`${CIRCUITS[profile(careers).circuit].name} championship · Overall #${reward.championshipPlace} · Race #${run.position}`:run.position===1?'First across the line. Congratulations!':`You finished #${run.position}. Your earnings are saved.`;
  }
  const highlights=document.createElement('div');highlights.className='result-highlights';
  for(const [label,value] of [['EARNED',`$${(reward?.total||0).toLocaleString()}`],['WALLET',`$${profile(careers).wallet.toLocaleString()}`],['BEST LAP',run.lapTimes.length?time(Math.min(...run.lapTimes)):'—']]) {
    const cell=document.createElement('div'),name=document.createElement('span'),amount=document.createElement('strong');name.textContent=label;amount.textContent=value;cell.append(name,amount);highlights.append(cell);
  }
  const breakdown=document.createElement('details');breakdown.className='result-breakdown';
  const summary=document.createElement('summary');summary.textContent='Race results & payout breakdown';breakdown.append(summary);$('result').append(highlights,breakdown);
  const rows =
    run.mode === "race" && run.phase === "finished"
      ? run.standings().map((r, i) => [`${i + 1}. ${r.name}`, r.finish===null?'Behind':time(r.finish)])
      : [
          ["SCORE", Math.floor(run.score).toLocaleString()],
          ["DISTANCE", Math.floor(run.player.z) + " m"],
          ["CLEAN PASSES", run.nearMisses],
          ["CONDITION", run.health + "%"],
        ];
  if (outcome.qualified)
    rows.push([
      "STARS",
      "★".repeat(outcome.stars) + "☆".repeat(3 - outcome.stars),
    ]);
  if (run.mode === "race" && run.lapTimes.length)
    rows.push(["BEST LAP", time(Math.min(...run.lapTimes))]);
  if(reward) {
    rows.push(['RACE PAYOUT','$'+reward.placement],['CLEAN RACE','$'+reward.clean],['TRACK CASH','$'+reward.pickups]);
    if(reward.championshipPlace) rows.push(['CHAMPIONSHIP',`#${reward.championshipPlace}`],['SERIES PRIZE','$'+reward.championship]);
    rows.push(['EARNED','$'+reward.total],['WALLET','$'+profile(careers).wallet.toLocaleString()]);
  }
  for (const [label, value] of rows) {
    const row = document.createElement("div"),
      name = document.createElement("span"),
      number = document.createElement("strong");
    name.textContent = label;
    number.textContent = value;
    row.append(name, number);
    breakdown.append(row);
  }
  $("start").textContent = presentation.primary;
  $("menu").textContent = "GARAGE & EVENTS";
  if(outcome.qualified){$('menu').hidden=true;$('start').textContent='CONTINUE TO GARAGE';}
  $("start").focus({ preventScroll: true });
}
function updateHUD() {
  const racing = run.mode === "race";
  $("route").textContent = run.championship ? `${run.championship.name} · ${run.route.name}` : run.route.name;
  $("speed").textContent = Math.round(run.player.speed * 3.6);
  $("speed-unit").textContent = "KM/H";
  $("main-label").textContent = racing
    ? "POSITION"
    : run.shield
      ? "SHIELDED"
      : "CONDITION";
  $("main-value").textContent = racing
    ? run.position + " / 4"
    : run.health + "%";
  $("sub-label").textContent = racing ? "LAP" : "FUEL";
  $("sub-value").textContent = racing
    ? Math.min(run.lap, run.route.laps) + " / " + run.route.laps
    : Math.ceil(run.fuel) + "%";
  $("score").textContent = racing
    ? time(run.player.finish ?? run.time)
    : Math.floor(run.score).toLocaleString();
  $("score-label").textContent = racing ? "TIME" : "SCORE";
  $("route-progress").value = (run.player.z / run.goal) * 100;
  $("boost").value = run.car?.boost===0?0:run.boost;
  $('boost-title').textContent=run.car?.unlimitedNitro?'NITROUS · ∞':run.car?.boost===0?'NITROUS · UPGRADE IN GARAGE':'NITROUS · SPACE';
  document.querySelector('[data-drive="boost"]').disabled=run.car?.boost===0;
  $("draft").hidden = run.draft < 15;
  $("throttle").hidden = !racing;
  $("countdown").textContent =
    screen === "playing" && run.phase === "countdown"
      ? Math.ceil(run.countdown)
      : screen === "playing" && run.phase === "finishing"
        ? "FINISHED"
        : "";
  $("corner").textContent =
    screen === "playing" && safeSpeed(run.route, run.player.z) < 53
      ? "CORNER · " +
        Math.round(safeSpeed(run.route, run.player.z) * 3.6) +
        " KM/H"
      : "";
  if (run.time > noticeTime) $("notice").hidden = true;
  document.body.classList.toggle("in-game", screen === "playing");
  $("pause").disabled = screen !== "playing";
}
function frame(now) {
  if (!view) return;
  const frameStart=performance.now(), interval=now-last;
  const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
  last = now;
  if (screen === "playing") {
    accumulator += dt;
    while (accumulator + 1e-9 >= 1 / 60 && screen === "playing") {
      previousMotion = captureMotion(run);
      const gesture=touchDrive.read(now);
      run.update(1 / 60, {
        steer: gesture.enabled?gesture.steer:drag?.target ?? ((keys.has("arrowright") || keys.has("d") || touch.right ? 1 : 0) -
          (keys.has("arrowleft") || keys.has("a") || touch.left ? 1 : 0)),
        throttle: gesture.throttle || keys.has("arrowup") || keys.has("w") || touch.throttle,
        brake: gesture.brake || keys.has("arrowdown") || keys.has("s") || touch.brake,
        boost: gesture.boost || keys.has(" ") || touch.boost,
        drift: gesture.drift || keys.has("shift") || touch.drift,
      });
      accumulator -= 1 / 60;
      for (const event of run.drain()) {
        sound.effect(event.type);
        if (event.type === "hit") view.burst();
        const message = {
          hit: "CONTACT",
          "shield-hit": "SHIELD USED",
          shield: "SHIELD READY",
          card: "CARD +250",
          cash: "CASH +$50",
          near: "CLEAN PASS",
          fuel: "FUEL +25",
          overtake: "OVERTAKE",
          lap: "LAP COMPLETE",
        }[event.type];
        if (message) {
          $("notice").textContent = message;
          $("notice").hidden = false;
          noticeTime = run.time + 1.1;
        }
        if (event.type === "end") finish();
      }
    }
  }
  sound.drive(
    run.player.speed,
    screen === "playing" && run.phase === "playing",
  );
  sound.drift(run.player.speed,!run.car?.hover&&run.player.slipping?Math.max(.25,Math.abs(run.player.steering||0))*(run.player.drifting?1:.5):0,screen==='playing'&&run.phase==='playing');
  const displayRun = screen === 'playing'
    ? interpolateMotion(run, previousMotion, accumulator * 60) : run;
  const redraw=screen==='playing'||renderedRun!==run||renderedScreen!==screen||view.needsRender;
  if(redraw) {view.draw(displayRun,dt,screen==='playing');renderedRun=run;renderedScreen=screen;view.needsRender=false;}
  if(screen==='menu'&&document.querySelector('.menu-card').dataset.panel!=='map')animateGarage(view,now,dt);
  if(screen==='results')view.animatePodium(now,dt);
  if(profiling && screen==='playing' && run.phase==='playing' && run.time>2) {
    diagnostics.add(interval,performance.now()-frameStart);
    if(now-diagnosticUpdate>1000) {
      const d=diagnostics.summary(),info=view.renderer.info.render;
      $("performance").hidden=false;
      $("performance").textContent=`Frames ${d.frames} · p50 ${d.p50.toFixed(1)} / p95 ${d.p95.toFixed(1)} / p99 ${d.p99.toFixed(1)} ms · CPU p95 ${d.work95.toFixed(1)} ms · >50ms ${d.longFrames} · worst ${d.worst.toFixed(1)} ms · draws ${info.calls} · triangles ${info.triangles}`;
      diagnosticUpdate=now;
    }
  }
  if(redraw)updateHUD();
}
function fail(message) {
  loadFailed = true;
  screen = "error";
  sound.stop();
  overlay("UNABLE TO LOAD", message);
  $("start").textContent = "RETRY";
  $("start").disabled = false;
  $("menu").hidden = true;
}
const host = $("host");
try {
  new RoadScene(host, {
    frame,
    progress: (p) =>
      ($("start").textContent = "LOADING " + Math.round(p * 100) + "%"),
    error: fail,
    ready: (v) => {
      view = v;
      view.reduced = reduced;
      if (!loadFailed) splash();
    },
  });
} catch {
  fail("Graphics could not start. Reload to retry.");
}
$("start").onclick = start;
$("menu").onclick = ()=>{const fromResults=screen==='results';menu();if(fromResults){$("garage").open=true;renderGarage();}};
$("pause").onclick = pause;
document.querySelectorAll("[data-difficulty]").forEach(
  (b) =>
    (b.onclick = () => {
      if(screen!=='splash')return;
      careers.active=b.dataset.difficulty;
      save();
      splash();
    }),
);
function soundLabel() {
  $("sound").textContent = sound.enabled ? "♪" : "♪̸";
  $("sound").setAttribute(
    "aria-label",
    sound.enabled ? "Mute sound" : "Enable sound",
  );
}
$("sound").onclick = () => {
  sound.enabled = !sound.enabled;
  progress.sound = sound.enabled;
  sound.unlock();
  if(sound.enabled)sound.resumeMusic();else sound.pauseMusic();
  save();
  soundLabel();
};
soundLabel();
$("reduced").onchange = () => {
  progress.reduced = $("reduced").checked;
  if (view) view.reduced = progress.reduced;
  save();
};
$('export-career').onclick=()=>{
  const blob=new Blob([JSON.stringify({format:'racecar-careers',version:1,...careers},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='racecar-careers.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('import-career').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try {
    if(file.size>250000)throw new Error('Backup is too large.');
    const data=JSON.parse(await file.text());
    if(data.format!=='racecar-careers'||data.version!==1||!data.profiles||typeof data.profiles!=='object'||Array.isArray(data.profiles))throw new Error('Choose a Racecar career backup.');
    if(!confirm('Replace the careers on this device with this backup? Export your current careers first if you want to keep them.'))return;
    careers=restoreCareers(data);save();splash();
  } catch(error) { $('save-status').textContent=error.message; }
  finally {event.target.value='';}
};
addEventListener('storage',event=>{
  if(event.key!==CAREER_KEY||!event.newValue)return;
  if(screen==='playing'||screen==='paused') {
    clearInput();sound.stop();screen='stale';run.paused=true;
    overlay('CAREER UPDATED','Another tab saved your career. Reload before racing so its progress is not overwritten.');
    $('start').textContent='RELOAD';$('menu').hidden=true;
  } else {try {careers=restoreCareers(JSON.parse(event.newValue));if(screen==='menu')menu();else if(screen==='splash')splash();}catch{}}
});
$("fullscreen").onclick = () => {
  const action = document.fullscreenElement
    ? document.exitFullscreen?.()
    : $("cabinet").requestFullscreen?.();
  action?.catch(() => {});
};
addEventListener("keydown", (e) => {
  if(screen==='splash'&&!e.repeat){
    const key=e.key.toLowerCase();
    if(key.startsWith('arrow'))e.preventDefault();
    if(secretCode.feed(key,performance.now())){
      profile(careers).ufoDiscount=true;save();sound.unlock();sound.effect('go');
      $('start').textContent='START · VISITOR UNLOCKED · $1';
    }
    return;
  }
  if (["INPUT", "SELECT", "SUMMARY"].includes(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === "p" || k === "escape") {
    e.preventDefault();
    if (!e.repeat) screen === "paused" ? resume() : pause();
    return;
  }
  if (screen !== "playing") return;
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k))touchDrive.reset();
  if (k === " " && e.target.tagName === "BUTTON") return;
  if ([" ", "shift", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(k))
    e.preventDefault();
  keys.add(k);
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {pause();sound.pauseMusic();}
  else if(screen==='menu'||screen==='results')sound.resumeMusic();
});
host.addEventListener("pointerdown", (e) => {
  if(screen==='playing'&&e.pointerType==='touch'){
    e.preventDefault();touchDrive.down(e.pointerId,e.clientX,e.clientY,performance.now());host.setPointerCapture(e.pointerId);return;
  }
  if (screen !== "playing" || e.button !== 0 || drag) return;
  e.preventDefault();
  drag = {
    id: e.pointerId,
    start: e.clientX,
    x: 0,
    target: 0,
  };
  host.setPointerCapture(e.pointerId);
  host.focus({ preventScroll: true });
});
host.addEventListener("pointermove", (e) => {
  if(e.pointerType==='touch'){touchDrive.move(e.pointerId,e.clientX,e.clientY,host.clientWidth);return;}
  if (drag?.id === e.pointerId)
    drag.target = clamp(
      drag.x + ((e.clientX - drag.start) / host.clientWidth) * 2.4,
      -1,
      1,
    );
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  host.addEventListener(type, (e) => {if(e.pointerType==='touch')touchDrive.up(e.pointerId,performance.now(),type!=='pointerup');if(drag?.id===e.pointerId)drag=null;});
host.addEventListener('contextmenu',e=>{if(screen==='playing')e.preventDefault();});
document.querySelectorAll("[data-drive]").forEach((b) => {
  const release = () => {
    touch[b.dataset.drive] = false;
    b.classList.remove("down");
  };
  b.addEventListener("pointerdown", (e) => {
    if (screen !== "playing") return;
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    touch[b.dataset.drive] = true;
    b.classList.add("down");
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(event, release);
});
