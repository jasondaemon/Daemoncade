import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {BASECAMP_CONTRACTS,ALL_CONTRACTS} from './worlds.js';
import {normalizeCareer,worldUnlocked,unlocked,recordResult,medalCount,encodeBackup,decodeBackup} from './career.js';

test('Basecamp requires three Metro medals; its own contracts unlock sequentially',()=>{
 let career=normalizeCareer({});assert.equal(worldUnlocked(career,'basecamp'),false);assert.equal(unlocked(career,3),false);
 career=recordResult(career,{contract:ALL_CONTRACTS[0],won:true,time:40,score:500});assert.equal(worldUnlocked(career,'basecamp'),true);assert.equal(unlocked(career,3),true);assert.equal(unlocked(career,4),false);
 career=recordResult(career,{contract:ALL_CONTRACTS[3],won:true,time:49,score:600});assert.equal(unlocked(career,4),true);assert.equal(unlocked(career,5),false);assert.equal(medalCount(career,'metro'),3);assert.equal(medalCount(career,'basecamp'),3);assert.equal(medalCount(career),6);assert.deepEqual(decodeBackup(encodeBackup(career)),career);
});
test('old campaign-only saves retain their Metro records; locked-world results are rejected',()=>{
 const old={version:1,records:{cleanup:{medal:1,time:80,score:500}}},clean=normalizeCareer(old);assert.deepEqual(clean.records,old.records);assert.equal(worldUnlocked(clean,'basecamp'),false);
 const bad={...old,records:{...old.records,'camp-cleanup':{medal:3,time:10,score:500}}};assert.equal(normalizeCareer(bad).records['camp-cleanup'],undefined);assert.throws(()=>decodeBackup(JSON.stringify({app:'sinkhole-city-metro',version:1,career:bad})));
});
for(const contract of BASECAMP_CONTRACTS)test(`${contract.title}: a continuous collection route can complete`,()=>{
 const run=new DistrictRun({contract});assert.equal(run.world,'basecamp');let target;
 for(let tick=0;tick<contract.duration*60+1&&!run.done;tick++){
  const p=run.player,available=run.objects.filter(o=>run.eligible(o)),objective=available.filter(o=>contract.kind==='clutter'?['cooler','log','firepit','picnic'].includes(o.type):contract.kind==='camp'?['tent','rv'].includes(o.type):o.type==='landmark');
  if(target?.phase==='consumed')target=null;
  if(!target)target=(objective.length?objective:available).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;
 }
 assert.equal(run.won,true);assert.ok(run.counts[contract.kind]>=contract.target);assert.ok(run.time<contract.duration);
});
