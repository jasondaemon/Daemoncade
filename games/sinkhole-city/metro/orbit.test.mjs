import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {ORBIT_CONTRACTS,ALL_CONTRACTS,objectiveMatches} from './worlds.js';
import {normalizeCareer,recordResult,worldUnlocked,encodeBackup,decodeBackup} from './career.js';
import {updateOrbit,orbitContraction} from './orbit.js';
import {RunClock} from '../runtime.js';

test('each consumed planet progressively tightens belts without moving the other planets',()=>{
 const run=new DistrictRun({world:'orbit',free:true}),reference=new DistrictRun({world:'orbit',free:true});
 const debris=run.orbiters.find(o=>o.type==='debris');
 for(let stage=1;stage<=4;stage++){
  run.consume(run,run.objects.find(o=>o.type==='planet'&&o.phase==='idle'));
  const previous=debris.orbital.contraction,score=run.score,eaten=run.eaten;
  updateOrbit(run.orbiters,1/60,run.time,run.counts.planets);updateOrbit(reference.orbiters,1/60,run.time);
  assert.ok(debris.orbital.contraction<previous&&previous-debris.orbital.contraction<.002,'no instant contraction');
  for(let tick=1;tick<1800;tick++){
   const x=debris.x,z=debris.z;
   updateOrbit(run.orbiters,1/60,tick/60,run.counts.planets);updateOrbit(reference.orbiters,1/60,tick/60);
   assert.ok(Math.hypot(debris.x-x,debris.z-z)<.1,'bounded motion through every transition');
  }
  assert.ok(Math.abs(debris.orbital.contraction-orbitContraction(stage))<.001);
  const b=debris.orbital;
  assert.ok(Math.abs(Math.hypot(debris.x/b.rx,debris.z/b.rz)-b.contraction)<.002);
  for(const planet of run.orbiters.filter(o=>o.type==='planet'&&o.phase==='idle')){
   const other=reference.orbiters.find(o=>o.id===planet.id);assert.equal(planet.x,other.x);assert.equal(planet.z,other.z);
  }
  assert.equal(run.eaten,eaten);assert.equal(run.score,score,'collapse never collects or scores remotely');
  assert.equal(run.objects.filter(o=>o.phase==='consumed').length,stage);
 }
 assert.equal(orbitContraction(4),.52);assert.equal(orbitContraction(99),.52);assert.equal(orbitContraction(-3),1);assert.equal(orbitContraction(NaN),1);
});

test('collapse is fixed-clock deterministic, run-local and frozen after completion',()=>{
 const snapshots=[];
 for(const fps of[20,30,60,120]){
  const run=new DistrictRun({world:'orbit',free:true}),clock=new RunClock();
  run.player.x=-54;run.player.z=-54;run.consume(run,run.objects.find(o=>o.type==='planet'));clock.advance(0,()=>{});
  for(let i=1;i<=fps*8;i++)clock.advance(i*1000/fps,dt=>run.step(dt,{x:0,y:0}));
  snapshots.push(run.orbiters.map(o=>[o.x,o.z,o.orbital.contraction]));
  run.done=true;const before=JSON.stringify(run.orbiters);run.step(1/60,{x:1,y:0});assert.equal(JSON.stringify(run.orbiters),before);
 }
 for(const snapshot of snapshots.slice(1))assert.deepEqual(snapshot,snapshots[0]);
 const fresh=new DistrictRun({world:'orbit',free:true});assert.ok(fresh.orbiters.every(o=>o.orbital.contraction===1));
 const before=JSON.stringify(fresh.orbiters);updateOrbit(fresh.orbiters,0,0,4);assert.equal(JSON.stringify(fresh.orbiters),before);
});

test('collapse leaves committed intake in world space instead of snapping it to a belt',()=>{
 const run=new DistrictRun({world:'orbit',free:true}),o=run.orbiters.find(o=>o.type==='satellite');
 run.player.radius=3;run.player.area=9;run.player.x=o.x;run.player.z=o.z;
 for(let i=0;i<100&&!o.intake?.committed;i++)run.collect(run,1/60);
 assert.equal(o.intake.committed,true);assert.equal(o.phase,'diving');
 const before={x:o.x,z:o.z,y:o.orbitY,wellX:o.intake.x,wellZ:o.intake.z};
 updateOrbit(run.orbiters,1/60,1,4);
 assert.deepEqual({x:o.x,z:o.z,y:o.orbitY,wellX:o.intake.x,wellZ:o.intake.z},before);
 run.player.x=-54;run.player.z=-54;
 for(let i=0;i<120&&o.phase!=='consumed';i++)run.collect(run,1/60);
 assert.equal(o.phase,'consumed');assert.equal(run.counts.spacecraft,1);
});

test('orbital motion remains identical under fixed-clock rendering at 20–120 FPS',()=>{
 const snapshots=[];
 for(const fps of[20,30,60,120]){
  const run=new DistrictRun({world:'orbit',free:true}),clock=new RunClock();clock.advance(0,()=>{});
  for(let i=1;i<=fps*5;i++)clock.advance(i*1000/fps,dt=>run.step(dt,{x:0,y:0}));
  snapshots.push(run.orbiters.map(o=>[o.x,o.z,o.orbitY,o.phase]));
 }
 for(const snapshot of snapshots.slice(1))assert.deepEqual(snapshot,snapshots[0]);
});

test('Orbit requires Alien medals and all earlier gates, and preserves save compatibility',()=>{
 let career=normalizeCareer({});assert.equal(worldUnlocked(career,'orbit'),false);
 assert.equal(worldUnlocked(normalizeCareer({records:{'alien-forage':{medal:3,time:40,score:500}}}),'orbit'),false);
 for(const id of['cleanup','camp-cleanup','deep-cleanup','alien-forage','orbit-debris'])career=recordResult(career,{contract:ALL_CONTRACTS.find(c=>c.id===id),won:true,time:40,score:500});
 assert.equal(worldUnlocked(career,'orbit'),true);assert.ok(career.records['orbit-debris']);assert.deepEqual(decodeBackup(encodeBackup(career)),career);
});
test('orbital routes move continuously, stay bounded and freeze after completion',()=>{
 const run=new DistrictRun({world:'orbit',free:true}),ship=run.objects.find(o=>o.type==='shuttle'),start={x:ship.x,z:ship.z};
 for(let i=0;i<7200;i++){
  const old={x:ship.x,z:ship.z};updateOrbit(run.orbiters,1/60,i/60);
  for(const o of run.orbiters)assert.ok(Number.isFinite(o.x+o.z+o.orbitY)&&Math.abs(o.x)<48&&Math.abs(o.z)<42);
  assert.ok(Math.hypot(ship.x-old.x,ship.z-old.z)<.1);
 }
 assert.ok(Math.hypot(ship.x-start.x,ship.z-start.z)>3);run.done=true;const before=JSON.stringify(run.orbiters);run.step(1/60,{x:1,y:0});assert.equal(JSON.stringify(run.orbiters),before);
});
test('solar finale stays sealed until all four planets are fully swallowed, exactly once',()=>{
 const run=new DistrictRun({world:'orbit',free:true}),sun=run.objects.find(o=>o.variant==='sun'),planets=run.objects.filter(o=>o.type==='planet');
 run.consume(run,sun);assert.equal(run.score,0);assert.equal(run.eligible(sun),false);
 for(const p of planets.slice(0,3))run.consume(run,p);
 assert.equal(sun.phase,'sealed');run.consume(run,planets[3]);const score=run.score;run.consume(run,planets[3]);
 assert.equal(run.counts.planets,4);assert.equal(run.score,score);assert.equal(sun.phase,'idle');assert.equal(run.events.filter(e=>e.type==='solar').length,1);
});
test('orbital descent has no pavement body, deep intake survives a moving well, and scores only below its envelope',()=>{
 const run=new DistrictRun({world:'orbit',free:true}),o=run.objects.find(o=>o.type==='probe');run.objects=[o];run.player.radius=3;run.player.area=9;run.player.x=o.x;run.player.z=o.z;
 for(let i=0;i<100&&o.phase!=='consumed';i++){
  if(o.intake?.committed)run.player.x+=.5;
  run.collect(run,1/60);
  if(o.phase!=='consumed')assert.equal(run.score,0);
 }
 assert.equal(o.phase,'consumed');assert.ok(o.intake.committed);assert.equal(o.body,undefined);assert.equal(run.counts.spacecraft,1);
 const score=run.score;run.collect(run,1/60);assert.equal(run.score,score);
});
test('abandoned shallow capture recovers continuously, and oversized planets stay out',()=>{
 const run=new DistrictRun({world:'orbit',free:true}),o=run.objects.find(o=>o.type==='satellite'),p=run.objects.find(o=>o.type==='planet');run.player.radius=2;run.player.x=o.x;run.player.z=o.z;run.collect(run,1/60);assert.equal(o.phase,'diving');
 run.player.x=50;run.player.z=50;run.collect(run,1/60);assert.equal(o.phase,'idle');
 const x=o.x,z=o.z;updateOrbit(run.orbiters,1/60,1);assert.ok(Math.hypot(o.x-x,o.z-z)<.1);
 run.player.radius=1.2;run.player.x=p.x;run.player.z=p.z;run.collect(run,1/60);assert.equal(p.phase,'idle');assert.equal(run.counts.planets,0);
});
for(const contract of ORBIT_CONTRACTS)test(`${contract.title}: ordinary continuous interception completes`,()=>{
 const run=new DistrictRun({contract});let target;
 for(let tick=0;tick<contract.duration*60+1&&!run.done;tick++){
  const p=run.player,available=run.objects.filter(o=>run.eligible(o)),objective=available.filter(o=>objectiveMatches(contract,o));
  if(target?.phase==='consumed')target=null;
  if(!target)target=(objective.length?objective:available).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;
 }
 assert.equal(run.won,true,`${run.time}s: ${JSON.stringify(run.counts)} radius ${run.player.radius}`);assert.ok(run.counts[contract.kind]>=contract.target);
 if(contract.kind==='landmark')assert.equal(run.counts.planets,4);
});
