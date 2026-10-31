import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONTRACTS,normalizeCareer,recordResult,unlocked,RIMS,rimFor,encodeBackup,decodeBackup} from './career.js';
import {DistrictRun} from './simulation.js';

test('career rejects corrupt records and unlocks sequentially without permanent power',()=>{
 const fresh=normalizeCareer({records:{cleanup:{medal:99,time:1,score:1}}});assert.deepEqual(fresh.records,{});assert.equal(unlocked(fresh,1),false);
 const run={contract:CONTRACTS[0],won:true,time:40,score:500};const career=recordResult(fresh,run);assert.equal(career.records.cleanup.medal,3);assert.equal(unlocked(career,1),true);assert.equal(unlocked(career,2),false);
 const slower=recordResult(career,{...run,time:85,score:1000});assert.equal(slower.records.cleanup.medal,3);assert.equal(slower.records.cleanup.time,40);assert.equal(slower.records.cleanup.score,1000);
 assert.deepEqual(recordResult(career,{...run,won:false}),career);assert.equal(new DistrictRun().player.radius,1.2);
});
test('cosmetic rewards require medals and do not alter the simulation',()=>{
 const empty=normalizeCareer({}),gold=recordResult(empty,{contract:CONTRACTS[0],won:true,time:20,score:500});
 assert.equal(rimFor(empty,'gold').id,'mint');assert.equal(rimFor(gold,'gold').id,'gold');assert.equal(rimFor(gold,'violet').id,'mint');assert.equal(RIMS.length,11);
 assert.deepEqual(new DistrictRun().player,new DistrictRun().player);
});
test('backup round trip is isolated, versioned and rejects corrupt or orphaned records',()=>{
 const c=recordResult(normalizeCareer({}),{contract:CONTRACTS[0],won:true,time:40,score:500});assert.deepEqual(decodeBackup(encodeBackup(c)),c);
 for(const bad of ['invalid','{}',JSON.stringify({app:'other-game',version:1,career:c}),JSON.stringify({app:'sinkhole-city-metro',version:2,career:c}),JSON.stringify({app:'sinkhole-city-metro',version:1,career:{version:1,records:{traffic:{medal:3,time:1,score:500}}}}),' '.repeat(65537)])assert.throws(()=>decodeBackup(bad));
 assert.deepEqual(c.records.cleanup,{medal:3,time:40,score:500,rulesVersion:4});
});
for(const contract of CONTRACTS)test(`${contract.title} is reachable using ordinary growth`,()=>{
 const run=new DistrictRun({contract});let target;
 for(let tick=0;tick<contract.duration*60+1&&!run.done;tick++){
  const p=run.player,eligible=run.objects.filter(o=>run.eligible(o));
  const objective=eligible.filter(o=>contract.kind==='vehicles'?['car','van'].includes(o.type):contract.kind==='landmark'?o.type==='landmark':['cone','bin','hydrant','bench','lamp'].includes(o.type));
  if(target?.phase==='consumed')target=null;
  if(!target)target=(objective.length?objective:eligible).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;
 }
 assert.equal(run.won,true);assert.ok(run.counts[contract.kind]>=contract.target);assert.ok(run.time<contract.duration);
});
