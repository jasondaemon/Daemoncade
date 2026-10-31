import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {campDry} from './habitats.js';
import {updateCampLife} from './camp-life.js';
import {RunClock} from '../runtime.js';

test('camp includes four distinct rigs, families, hikers, anglers and woodland animals',()=>{
 const r=new DistrictRun({world:'basecamp',free:true});assert.equal(r.total,241);
 assert.deepEqual(r.objects.filter(o=>o.rig).map(o=>o.rig).sort(),['explore-trailer','fj-suv','popup-pickup','roof-jeep']);
 assert.equal(r.people.filter(o=>o.type==='person').length,21);assert.equal(r.people.filter(o=>o.type==='deer').length,8);assert.equal(r.people.filter(o=>o.type==='fox').length,4);
 assert.equal(r.people.filter(o=>o.walker.role==='fishing').length,3);assert.equal(r.people.filter(o=>o.art===4).length,4);
 const tow=r.objects.find(o=>o.rig==='fj-suv'),trailer=r.objects.find(o=>o.rig==='explore-trailer');assert.equal(tow.site,trailer.site);assert.equal(tow.yaw,trailer.yaw);assert.ok(Math.abs(Math.hypot(tow.x-trailer.x,tow.z-trailer.z)-3.35)<1e-7);
 for(const o of r.objects.filter(o=>!o.walker))assert.ok(campDry(o.x,o.z),`${o.type} should not be parked/planted in the pond`);
});

test('camp life moves continuously, stays dry and pauses; caught actors stop locomotion',()=>{
 const r=new DistrictRun({world:'basecamp',free:true}),start=r.people.map(o=>({x:o.x,z:o.z})),hole={x:54,z:54,radius:1.2};
 for(let i=0;i<5400;i++){
  const old=r.people.map(o=>({x:o.x,z:o.z}));updateCampLife(r.people,1/60,i/60,hole,r.campObstacles);
  for(const [j,o]of r.people.entries()){assert.ok(Math.hypot(o.x-old[j].x,o.z-old[j].z)<.06);assert.ok(campDry(o.x,o.z));assert.ok(Math.abs(o.x)<=51&&Math.abs(o.z)<=51);}
 }
 assert.ok(r.people.filter((o,i)=>o.walker.role!=='fishing'&&Math.hypot(o.x-start[i].x,o.z-start[i].z)>1).length>=22,'most walkers and animals make useful progress');
 for(const [i,o]of r.people.entries())if(o.walker.role==='fishing')assert.ok(Math.hypot(o.x-start[i].x,o.z-start[i].z)<.001);
 const o=r.people[0];o.phase='falling';const frozen=[o.x,o.z,o.walker.gait];updateCampLife(r.people,1/60,91,hole,r.campObstacles);assert.deepEqual([o.x,o.z,o.walker.gait],frozen);
 r.done=true;const snapshot=JSON.stringify(r.people);r.step(1/60,{x:1,y:0});assert.equal(JSON.stringify(r.people),snapshot);
});

test('camp life follows the fixed clock at 20–120 FPS and nearby anglers react to the hole',()=>{
 const snapshots=[];
 for(const fps of[20,30,60,120]){
  const r=new DistrictRun({world:'basecamp',free:true}),clock=new RunClock();r.player.x=54;r.player.z=54;clock.advance(0,()=>{});
  for(let i=1;i<=fps*3;i++)clock.advance(i*1000/fps,dt=>r.step(dt,{x:0,y:0}));
  snapshots.push(r.people.map(o=>[o.x,o.z,o.walker.gait]));
 }
 for(const s of snapshots.slice(1))assert.deepEqual(s,snapshots[0]);
 const r=new DistrictRun({world:'basecamp'}),o=r.people.find(o=>o.walker.role==='fishing'),before={x:o.x,z:o.z};
 for(let i=0;i<60;i++)updateCampLife(r.people,1/60,i/60,{x:before.x-.5,z:before.z,radius:1.2},r.campObstacles);
 assert.ok(Math.hypot(o.x-before.x,o.z-before.z)>.3);assert.ok(o.walker.panicUntil>1);
});
