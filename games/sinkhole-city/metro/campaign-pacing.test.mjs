import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';
import {ALL_CONTRACTS} from './worlds.js';
import {normalizeCareer,recordResult,encodeBackup,decodeBackup} from './career.js';
import {GrowthCamera,cameraSpan} from './camera.js';

test('campaign and free-roam growth retain intermediate size tiers; Arena rules stay original',()=>{
 for(const world of ['metro','basecamp','deep','alien','orbit']){
  const r=new DistrictRun({world,free:true}),o=r.objects.find(o=>o.phase==='idle'),area=r.player.area;
  const factor=world==='basecamp'?.36:world==='orbit'?.32:.25;
  r.consume(r,o);assert.ok(Math.abs(r.player.area-area-o.mass*factor)<1e-10);
  const after=r.player.area;r.consume(r,o);assert.equal(r.player.area,after);
 }
 const r=new ArenaRun(),o=r.objects[0],area=r.player.area;r.consume(r,o);assert.equal(r.player.area,area+o.mass);assert.equal(r.rulesVersion,1);
});
test('campaign traversal is measured without adding input lag; Arena retains its movement',()=>{
 const campaign=new DistrictRun({contract:ALL_CONTRACTS[0]}),arena=new ArenaRun();
 for(const r of [campaign,arena])for(let i=0;i<60;i++)r.move(r,1/60,{x:1,y:0});
 assert.ok(campaign.player.vx>9&&campaign.player.vx<10);assert.ok(arena.player.vx>13);
 assert.ok(campaign.player.x>-18,'steering remains responsive, not a delayed gesture');
});
test('camera holds the early scale and takes several seconds to settle after a large reward',()=>{
 for(const world of ['metro','basecamp','deep','alien','orbit']){
  const start=cameraSpan(world,1.2);assert.ok(cameraSpan(world,1.8)<start*1.15);
  const c=new GrowthCamera();c.reset(world,1.2);for(let i=0;i<60;i++)c.update(world,8.5,1/60);
  const fraction=(c.span-start)/(cameraSpan(world,8.5)-start);assert.ok(fraction>.5&&fraction<.6);
 }
});
test('earlier campaign records retain medals and unlocks, but not incomparable speed records',()=>{
 const old=normalizeCareer({version:1,records:Object.fromEntries(ALL_CONTRACTS.slice(0,15).map(c=>[c.id,{medal:3,time:8,score:9000,rulesVersion:c.world==='deep'?2:1}]))});
 assert.equal(Object.keys(old.records).length,15);assert.deepEqual(decodeBackup(encodeBackup(old)),old);
 for(const c of ALL_CONTRACTS.slice(0,15)){
  const next=recordResult(old,{contract:c,won:true,time:190,score:100});assert.equal(next.records[c.id].medal,3);assert.equal(next.records[c.id].time,190);assert.equal(next.records[c.id].score,100);assert.equal(next.records[c.id].rulesVersion,4);
 }
 assert.deepEqual(normalizeCareer({records:{cleanup:{medal:3,time:8,score:9000,rulesVersion:5}}}).records,{});
});
