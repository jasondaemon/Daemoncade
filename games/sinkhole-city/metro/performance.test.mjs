import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NearbyObjects} from './spatial.js';
import {RenderPacer} from './pacing.js';
import {DistrictRun} from './simulation.js';
import {RunClock} from '../runtime.js';

const snapshot=r=>({time:r.time,player:r.player,score:r.score,eaten:r.eaten,counts:r.counts,combo:r.combo,won:r.won,done:r.done,objects:r.objects.map(o=>({id:o.id,x:o.x,z:o.z,phase:o.phase,owner:o.owner||null,body:o.body||null,angle:o.rockAngle||0,velocity:o.rockVelocity||0,swimY:o.swimY||0,orbitY:o.orbitY||0}))});
test('nearby queries preserve order, retain distant falls/rocking and tolerate moves/replacement',()=>{
 const index=new NearbyObjects(),objects=[{id:3,x:40,z:40,radius:1,phase:'falling'},{id:1,x:1,z:0,radius:1,phase:'buried'},{id:2,x:40,z:-40,radius:1,phase:'idle'},{id:4,x:-40,z:40,radius:1,phase:'idle',rockAngle:.01}];
 index.sync(objects);assert.deepEqual(index.query({x:0,z:0,radius:1.2}).map(o=>o.id),[3,1,4]);
 objects[2].x=objects[2].z=0;index.sync(objects);assert.deepEqual(index.query({x:0,z:0,radius:1.2}).map(o=>o.id),[3,1,2,4]);
 objects[0]={id:5,x:50,z:50,radius:1,phase:'idle'};objects[1].phase='consumed';objects[3].rockAngle=0;index.sync(objects);assert.deepEqual(index.query({x:0,z:0,radius:1.2}).map(o=>o.id),[2]);assert.equal(index.entries.size,3);assert.ok(index.cells.size<=3);
 index.sync([]);assert.equal(index.entries.size,0);assert.equal(index.cells.size,0);
});
test('cell queries include every object inside the original broad-phase distance at boundaries',()=>{
 const index=new NearbyObjects(),objects=Array.from({length:800},(_,id)=>({id,x:Math.sin(id*13.7)*54,z:Math.cos(id*7.1)*54,radius:.2+id%24*.2,phase:'idle'}));index.sync(objects);
 for(const x of[-51,-8,0,8,51])for(const z of[-51,0,51])for(const radius of[1.2,4,8.5]){
  const found=new Set(index.query({x,z,radius}));for(const o of objects)if(Math.hypot(o.x-x,o.z-z)<radius+o.radius*1.2)assert.ok(found.has(o));
 }
});
test('incremental maintenance tracks movers and distant falls without rebuilding stationary scenery',()=>{
 const index=new NearbyObjects(),stationary={x:40,z:40,radius:1,phase:'idle'},moving={x:40,z:40,radius:1,phase:'idle',swim:{}},objects=[stationary,moving];
 index.update(objects);const version=index.version;
 moving.x=moving.z=0;index.update(objects);assert.equal(index.version,version);assert.deepEqual(index.query({x:0,z:0,radius:1}),[moving]);
 stationary.phase='contact';index.track(stationary);assert.deepEqual(index.query({x:0,z:0,radius:1}),objects);
 stationary.body={x:-40,z:-40};stationary.phase='falling';index.track(stationary);index.update(objects);assert.ok(index.query({x:0,z:0,radius:1}).includes(stationary));
 stationary.phase='consumed';index.track(stationary);assert.ok(!index.entries.has(stationary));assert.ok(!index.active.has(stationary));
 objects.push({x:0,z:0,radius:1,phase:'buried'});index.update(objects);assert.ok(index.version>version);assert.equal(index.query({x:0,z:0,radius:1}).length,2);
});
for(const world of['metro','basecamp','deep','alien','orbit'])test(`${world}: indexed collection matches full scans through continuous growth`,()=>{
 const fast=new DistrictRun({world,free:true}),reference=new DistrictRun({world,free:true,spatial:false});let target;
 for(let tick=0;tick<60*35&&!reference.done;tick++){
  const p=reference.player;if(target?.phase==='consumed')target=null;
  if(!target)target=reference.objects.filter(o=>reference.eligible(o)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1,input={x:d<.12?0:x/d,y:d<.12?0:y/d};
  fast.step(1/60,input);reference.step(1/60,input);fast.events.length=reference.events.length=0;
  if(tick%120===0)assert.deepEqual(snapshot(fast),snapshot(reference));
 }
 assert.deepEqual(snapshot(fast),snapshot(reference));
 const fresh=new DistrictRun({world,free:true});fresh.step(1/60,{x:0,y:0});
 if(world==='orbit')assert.equal(fresh.nearby,null,'mostly moving worlds retain the cheaper direct scan');
 else assert.ok(fresh.nearby.query(fresh.player).length<fresh.objects.length*.5,'starting contact candidates must be substantially below a full-world scan');
});
test('wreck reveals retain same-tick authored-order collection and Arena does not use the new broad phase',()=>{
 const runs=[true,false].map(spatial=>{const r=new DistrictRun({world:'deep',free:true,spatial});const wreck=r.objects.find(o=>o.type==='wreck');r.objects=r.objects.filter(o=>o===wreck||o.type==='treasure');r.total=r.objects.length;r.player.x=wreck.x;r.player.z=wreck.z;r.player.radius=8.5;r.player.area=72.25;return r;});
 for(let i=0;i<240&&!runs[0].done;i++){for(const r of runs){r.step(1/60,{x:0,y:0});r.events.length=0;}assert.deepEqual(snapshot(runs[0]),snapshot(runs[1]));}
 assert.equal(runs[0].counts.treasure,6);
 const arena=new DistrictRun();arena.arena=true;arena.step(1/60,{x:0,y:0});assert.equal(arena.nearby,null);
});
test('render pacing caps draws at 30/60 across native refresh rates without accumulating lag',()=>{
 for(const native of[30,60,90,120,144])for(const rate of[30,60]){
  const pacer=new RenderPacer(rate),draws=[];for(let i=0;i<=native*10;i++){const now=i*1000/native,dt=pacer.take(now);if(dt!==null)draws.push({now,dt});}
  assert.ok(Math.abs(draws.length-(Math.min(native,rate)*10+1))<=1,`${native}/${rate}: ${draws.length}`);assert.ok(draws.every(d=>d.dt>0&&d.dt<=.1));
 }
 const p=new RenderPacer(30);assert.equal(p.take(0),1/30);assert.equal(p.take(8),null);assert.ok(p.take(8,true)>=0);p.reset();assert.equal(p.take(5000),1/30);p.setRate(999);assert.equal(p.rate,60);assert.equal(p.take(NaN),null);
});
test('30 FPS and 60 FPS rendering preserve identical fixed-clock movement, growth, score and time',()=>{
 const results=[];
 for(const native of[30,60,120])for(const rate of[30,60]){
  const run=new DistrictRun({free:true}),clock=new RunClock(),pacer=new RenderPacer(rate);
  for(let i=0;i<=native*5;i++){clock.advance(i*1000/native,dt=>run.step(dt,{x:1,y:0}));pacer.take(i*1000/native);run.events.length=0;}
  results.push(snapshot(run));
 }
 for(const r of results.slice(1))assert.deepEqual(r,results[0]);
});
