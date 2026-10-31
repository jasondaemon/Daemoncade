import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';
import {ALL_CONTRACTS} from './worlds.js';
import {summarizeRun} from './exploration.js';
import {normalizeCareer,recordResult,recordExploration,encodeBackup,decodeBackup} from './career.js';

test('a contract victory can continue with exactly the same scene, player and time, once',()=>{
 const r=new DistrictRun({contract:ALL_CONTRACTS[0]}),objects=r.objects,player=r.player;r.consume(r,objects.find(o=>o.type==='cone'));r.done=r.won=true;r.time=80;
 const before={eaten:r.eaten,score:r.score,area:r.player.area,time:r.time,phases:r.objects.map(o=>o.phase)};
 let c=recordResult(normalizeCareer({}),r);const record={...c.records.cleanup};assert.ok(r.continueExploring());
 assert.equal(r.objects,objects);assert.equal(r.player,player);assert.equal(r.free,true);assert.equal(r.contract,null);assert.equal(r.won,false);assert.equal(r.done,false);
 assert.deepEqual({eaten:r.eaten,score:r.score,area:r.player.area,time:r.time,phases:r.objects.map(o=>o.phase)},before);assert.equal(r.continueExploring(),false);
 r.time+=30;r.won=r.done=true;c=recordResult(c,r);assert.deepEqual(c.records.cleanup,record);
 for(const run of [new ArenaRun(),new DistrictRun()])assert.equal(run.continueExploring(),false);
 r.eaten=r.total;assert.equal(r.continueExploring(),false);
});
test('a contract win is not a world clear; coverage never rounds up prematurely',()=>{
 const r=new DistrictRun({free:true});r.total=1000;r.eaten=999;r.won=true;assert.equal(summarizeRun(r).percent,99);assert.equal(summarizeRun(r).full,false);
 r.eaten=1000;assert.equal(summarizeRun(r).percent,100);assert.equal(summarizeRun(r).full,true);
});
test('feeding chains can exceed the score cap without changing its scoring multiplier',()=>{
 const r=new DistrictRun({free:true});for(const o of r.objects.slice(0,30))r.consume(r,o);
 assert.equal(r.combo,10);assert.equal(r.streak,30);assert.equal(r.peakStreak,30);
 assert.deepEqual(r.events.filter(e=>e.type==='streak').map(e=>e.chain),[10,25]);
 r.move(r,2.1,{x:0,y:0});assert.equal(r.streak,0);r.consume(r,r.objects[30]);assert.equal(r.streak,1);assert.equal(r.peakStreak,30);
});
test('exploration personal bests survive old saves, incremental checkpoints and export/import',()=>{
 const r=new DistrictRun({free:true});r.time=12;r.consume(r,r.objects.find(o=>o.type==='car'));r.peakStreak=5;
 const empty=normalizeCareer({version:1,records:{}});assert.deepEqual(empty.exploration,{});
 const c=recordExploration(empty,r),best=c.exploration.metro;assert.equal(best.largest,'car');assert.equal(best.chain,5);assert.ok(best.coverage>0);assert.equal(best.clearTime,null);assert.deepEqual(c.records,{});
 assert.deepEqual(decodeBackup(encodeBackup(c)),c);
 const smaller=recordExploration(c,new DistrictRun({free:true}));assert.deepEqual(smaller,c);
 r.eaten=r.total;r.time=190;const full=recordExploration(c,r);assert.equal(full.exploration.metro.coverage,10000);assert.equal(full.exploration.metro.clearTime,190);
 r.time=200;assert.equal(recordExploration(full,r).exploration.metro.clearTime,190);
 assert.deepEqual(recordExploration(full,new ArenaRun()),full);
});
test('invalid or locked-world exploration imports are rejected without damaging old career data',()=>{
 const r=new DistrictRun({free:true});r.consume(r,r.objects[0]);const good=recordExploration(normalizeCareer({}),r);
 for(const patch of [{coverage:10001},{chain:-1},{largest:'<script>'},{largestRadius:Infinity},{clearTime:-1},{rulesVersion:2}]){
  const bad=JSON.parse(encodeBackup(good));Object.assign(bad.career.exploration.metro,patch);assert.throws(()=>decodeBackup(JSON.stringify(bad)));
 }
 const bad=JSON.parse(encodeBackup(good));bad.career.exploration.deep=bad.career.exploration.metro;assert.throws(()=>decodeBackup(JSON.stringify(bad)));
});
