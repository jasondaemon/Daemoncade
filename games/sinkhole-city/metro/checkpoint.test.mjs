import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeCheckpoint,restoreCheckpoint,bindCheckpointBodies} from './checkpoint.js';
import {DistrictRun} from './simulation.js';
import {createBody} from './rim.js';
import {ALL_CONTRACTS,WORLDS} from './worlds.js';
import {normalizeCareer} from './career.js';
const career=normalizeCareer({records:Object.fromEntries(ALL_CONTRACTS.map(c=>[c.id,{medal:3,time:1,score:100}]))});
const serialized=r=>JSON.parse(JSON.stringify(makeCheckpoint(r)));
for(const world of WORLDS.map(w=>w.id))test(`${world}: checkpoint preserves moving actors and subsequent simulation`,()=>{
 const r=new DistrictRun({world,free:true,seed:35});
 for(let i=0;i<180;i++)r.step(1/60,{x:.4,y:-.2});
 const data=serialized(r),restored=restoreCheckpoint(data,career);assert.ok(restored);assert.deepEqual(serialized(restored),data);assert.ok(JSON.stringify(data).length<250000);
 for(let i=0;i<120;i++){const input={x:Math.sin(i*.03),y:-.2};r.step(1/60,input);restored.step(1/60,input);}
 assert.deepEqual(serialized(restored),serialized(r));assert.deepEqual(restored.events,r.events.slice(-restored.events.length));
});
test('committed falling body keeps its pose, intake and model-derived contacts after loading',()=>{
 const r=new DistrictRun({free:true}),o=r.objects[0];o.shape={width:.5,height:2,depth:.6,contacts:[{x:0,y:-1,z:0}],supports:[{x:0,z:0}]};o.body=createBody(o);Object.assign(o.body,{y:-.5,committed:true,intake:{x:2,z:3,radius:2},ceiling:.3});o.phase='falling';
 const resumed=restoreCheckpoint(serialized(r),career),other=resumed.objects[0];assert.ok(resumed);other.shape=o.shape;bindCheckpointBodies(resumed);assert.deepEqual(other.body,o.body);
});
test('Infinity final intake resumes without skipping time or granting duplicate score',()=>{
 const r=new DistrictRun({world:'ascension',free:true});for(const o of r.objects)if(o.scaleStage<17)o.phase='consumed';r.eaten=r.objects.filter(o=>o.phase==='consumed').length;
 for(const o of r.objects.filter(o=>o.scaleStage===17))r.consume(r,o);for(let i=0;i<120;i++)r.step(1/60,{x:0,y:0});
 // Use an unfinished, moving finale with matter still in flight.
 const a=new DistrictRun({world:'ascension',free:true}),last=a.objects.find(o=>o.scaleStage===17);for(const o of a.objects)if(o!==a.objects[0]&&o!==last)o.phase='consumed';a.eaten=a.total-2;a.consume(a,last);for(let i=0;i<90;i++)a.step(1/60,{x:0,y:0});
 const b=restoreCheckpoint(serialized(a),career);assert.ok(b);assert.equal(b.time,a.time);for(let i=0;i<240;i++){a.step(1/60,{x:0,y:0});b.step(1/60,{x:0,y:0});}assert.ok(a.done&&b.done);assert.equal(a.score,b.score);assert.equal(b.eaten,b.total);
});
test('corrupt, incompatible, inaccessible and finished checkpoints cannot replace career progress',()=>{
 const r=new DistrictRun({free:true}),data=serialized(r);
 for(const mutate of[d=>d.version=99,d=>d.rules='old',d=>d.world='missing',d=>d.objects.pop(),d=>d.state.eaten++,d=>d.player.x=null,d=>d.state.score=-1,d=>d.objects[0].state.phase='missing',d=>{const o=d.objects.find(o=>o.state.traffic);o.state.traffic={};}]){const bad=structuredClone(data);mutate(bad);assert.equal(restoreCheckpoint(bad,career),null);}
 assert.equal(restoreCheckpoint(serialized(new DistrictRun({world:'orbit',free:true})),normalizeCareer({})),null);r.done=true;assert.equal(makeCheckpoint(r),null);assert.equal(makeCheckpoint({arena:true}),null);
});
