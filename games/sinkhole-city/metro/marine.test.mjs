import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {MARINE_TYPES,createSchools} from './marine.js';
import {CAMP_SITES,CAMP_TRAILS,REEF_HABITATS} from './habitats.js';
import {RunClock} from '../runtime.js';

test('non-city layouts use irregular habitat clusters and connected clearing trails, not repeated rows',()=>{
 for(const [world,type]of[['basecamp','cooler'],['deep','shell']]){
  const a=new DistrictRun({world}),b=new DistrictRun({world}),objects=a.objects.filter(o=>o.type===type);
  assert.deepEqual(a.objects,b.objects,'layout seeds must be repeatable');
  assert.ok(new Set(objects.map(o=>o.x.toFixed(3))).size/objects.length>.9);
  assert.ok(new Set(objects.map(o=>o.z.toFixed(3))).size/objects.length>.9);
 }
 assert.equal(CAMP_SITES.length,9);assert.equal(REEF_HABITATS.length,8);assert.ok(CAMP_TRAILS.every(path=>path.length>=3));
});
test('living ocean contains schools and all seven animated species, with finite smooth bounded motion',()=>{
 const r=new DistrictRun({world:'deep',free:true});r.player.x=50;r.player.z=50;
 assert.equal(r.marine.filter(o=>o.type==='fish').length,72);assert.deepEqual([...new Set(r.marine.map(o=>o.type))].sort(),[...MARINE_TYPES].sort());
 const start=r.marine.map(o=>[o.x,o.z]);
 for(let i=0;i<60*180;i++){
  const prior=r.marine.map(o=>[o.x,o.z]);r.step(1/60,{x:0,y:0});r.events.length=0;
  for(const [j,o]of r.marine.entries()){
   assert.ok(Number.isFinite(o.x+o.z+o.yaw+o.swimY));assert.ok(Math.abs(o.x)<53&&Math.abs(o.z)<53);
   assert.ok(Math.hypot(o.x-prior[j][0],o.z-prior[j][1])<.1,'swimmers must not teleport on turns or formations');
  }
 }
 assert.ok(r.marine.every((o,i)=>Math.hypot(o.x-start[i][0],o.z-start[i][1])>.1));
});
function fixture(type){
 const r=new DistrictRun({world:'deep',free:true}),o=r.marine.find(o=>o.type===type);r.objects=r.marine=[o];r.schools=createSchools([o]);r.total=1;
 r.player.x=o.x;r.player.z=o.z;r.player.radius=Math.max(1.2,o.radius/.82+.6);r.player.area=r.player.radius**2;return {r,o};
}
test('marine capture starts at swimming height, uses no pavement body and awards only fully submerged swimmers once',()=>{
 for(const type of MARINE_TYPES){
  const {r,o}=fixture(type),y=o.swimY;r.step(1/60,{x:0,y:0});assert.equal(o.phase,'diving');assert.ok(Math.abs(o.swimY-y)<.02);assert.equal(o.body,undefined);assert.equal(r.score,0);
  let committed=false,lastY=Infinity;
  for(let i=0;i<300&&!r.done;i++){
   if(o.water?.committed){committed=true;r.player.x=50;r.player.z=50;assert.ok(o.swimY<=lastY+1e-8);lastY=o.swimY;}
   r.step(1/60,{x:0,y:0});
  }
  assert.ok(committed,type+' must exercise a committed moving-hole dive');assert.equal(o.phase,'consumed');assert.equal(r.eaten,1);assert.equal(r.counts.marine,1);
  assert.equal(r.events.filter(e=>e.type==='consume').length,1);assert.equal(r.counts.giants,type==='whale'?1:0);
 }
});
test('a shallow swimmer escapes an abandoned intake and rejoins without a position snap',()=>{
 const {r,o}=fixture('fish');r.step(1/60,{x:0,y:0});assert.equal(o.phase,'diving');r.player.x-=12;r.step(1/60,{x:0,y:0});assert.equal(o.phase,'idle');
 for(let i=0;i<120;i++){const x=o.x,z=o.z;r.step(1/60,{x:0,y:0});assert.ok(Math.hypot(o.x-x,o.z-z)<.1);}
 assert.equal(r.eaten,0);assert.equal(o.body,undefined);assert.equal(o.water,null);assert.ok(o.swimY>.2);
});
test('small holes cannot capture large animals and completed runs freeze school motion',()=>{
 const {r,o}=fixture('whale');r.player.radius=1.2;r.player.area=1.44;
 for(let i=0;i<120;i++)r.step(1/60,{x:0,y:0});assert.equal(o.phase,'idle');assert.equal(r.eaten,0);
 r.done=true;const snapshot=JSON.stringify([o,r.time,[...r.schools]]);r.step(5,{x:1,y:1});assert.equal(JSON.stringify([o,r.time,[...r.schools]]),snapshot);
});
test('schools turn gradually away from an edible-sized hole, instead of moving on an unresponsive rail',()=>{
 const a=new DistrictRun({world:'deep',free:true}),b=new DistrictRun({world:'deep',free:true}),g=[...a.schools.values()][0];
 a.objects=[];b.objects=[];a.total=b.total=999;a.player.x=g.x-2;a.player.z=g.z;a.player.radius=3;a.player.area=9;b.player.x=50;b.player.z=50;
 for(let i=0;i<120;i++){a.step(1/60,{x:0,y:0});b.step(1/60,{x:0,y:0});}
 assert.ok(Math.abs([...a.schools.values()][0].heading-[...b.schools.values()][0].heading)>.15);
});
test('fixed-clock marine motion is identical at 20, 30, 60 and 120 rendering FPS',()=>{
 const snapshots=[];for(const fps of[20,30,60,120]){
  const r=new DistrictRun({world:'deep',free:true}),clock=new RunClock();r.player.x=r.player.z=50;
  for(let i=0;i<=fps*3;i++)clock.advance(i*1000/fps,dt=>r.step(dt,{x:0,y:0}));
  snapshots.push(r.marine.map(o=>[o.x,o.z,o.yaw,o.swimY]));
 }
 for(const snapshot of snapshots.slice(1))assert.deepEqual(snapshot,snapshots[0]);
});
