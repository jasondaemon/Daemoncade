import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {DEEP_CONTRACTS,ALL_CONTRACTS,WORLDS,growthInfo,districtLabel,objectiveMatches} from './worlds.js';
import {normalizeCareer,recordResult,worldUnlocked,encodeBackup,decodeBackup} from './career.js';

test('Deep Sink requires Basecamp medals as well as the original Metro gate, and saves round-trip',()=>{
 let c=normalizeCareer({});assert.equal(worldUnlocked(c,'deep'),false);assert.equal(worldUnlocked(c,'unknown'),false);
 assert.deepEqual(recordResult(c,{contract:DEEP_CONTRACTS[0],won:true,time:10,score:500}),c);
 c=recordResult(c,{contract:ALL_CONTRACTS[0],won:true,time:40,score:500});assert.equal(worldUnlocked(c,'basecamp'),true);assert.equal(worldUnlocked(c,'deep'),false);
 c=recordResult(c,{contract:ALL_CONTRACTS[3],won:true,time:40,score:500});assert.equal(worldUnlocked(c,'deep'),true);
 c=recordResult(c,{contract:DEEP_CONTRACTS[0],won:true,time:40,score:500});assert.deepEqual(decodeBackup(encodeBackup(c)),c);
 const orphan={version:1,records:{'deep-cleanup':{medal:3,time:40,score:500}}};assert.deepEqual(normalizeCareer(orphan).records,{});
 assert.throws(()=>decodeBackup(JSON.stringify({app:'sinkhole-city-metro',version:1,career:orphan})));
});
test('buried gold is ineligible, unscored and stationary until its wreck is completely swallowed',()=>{
 const run=new DistrictRun({world:'deep',free:true}),gold=run.objects.filter(o=>o.type==='treasure'),wreck=run.objects.find(o=>o.type==='wreck');
 run.objects=gold;run.total=gold.length;run.player.x=0;run.player.z=-17;run.player.radius=6;run.player.area=36;
 for(let i=0;i<180;i++)run.step(1/60,{x:0,y:0});assert.equal(run.eaten,0);assert.ok(gold.every(o=>o.phase==='buried'&&!run.eligible(o)&&!o.body));
 run.objects=[wreck,...gold];run.total=7;
 for(let i=0;i<600&&!run.done;i++){
  run.step(1/60,{x:0,y:0});if(wreck.phase!=='consumed')assert.ok(gold.every(o=>o.phase==='buried'));
 }
 assert.equal(wreck.phase,'consumed');assert.equal(run.counts.treasure,6);assert.equal(run.eaten,7);
 assert.equal(run.events.filter(e=>e.type==='reveal').length,1);assert.equal(run.events.filter(e=>e.type==='consume'&&e.object.type==='treasure').length,6);
 const score=run.score;for(let i=0;i<60;i++)run.step(1/60,{x:0,y:0});assert.equal(run.score,score);
});
test('withdrawing from a shallow wreck contact does not expose or award its buried cargo',()=>{
 const r=new DistrictRun({world:'deep',free:true}),wreck=r.objects.find(o=>o.type==='wreck'),gold=r.objects.filter(o=>o.type==='treasure');
 r.objects=[wreck,...gold];r.total=7;r.player.x=wreck.x;r.player.z=wreck.z;r.player.radius=4.3;r.player.area=4.3**2;
 r.step(1/60,{x:0,y:0});assert.equal(wreck.phase,'contact');r.player.x-=15;
 for(let i=0;i<300;i++)r.step(1/60,{x:0,y:0});
 assert.equal(wreck.phase,'idle');assert.equal(r.counts.treasure,0);assert.ok(gold.every(o=>o.phase==='buried'));
 assert.equal(r.events.some(e=>e.type==='reveal'),false);
});
for(const contract of DEEP_CONTRACTS)test(`${contract.title} is reachable through ordinary growth and wreck discovery`,()=>{
 const run=new DistrictRun({contract});let target;
 for(let i=0;i<contract.duration*60+1&&!run.done;i++){
  const p=run.player,available=run.objects.filter(o=>run.eligible(o)),goals=available.filter(o=>objectiveMatches(contract,o));
  if(target?.phase==='consumed')target=null;
  if(!target)target=(goals.length?goals:available).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;
 }
 assert.equal(run.won,true);assert.ok(run.counts[contract.kind]>=contract.target);
});
test('every world has finite bounded size guidance and its own location labels',()=>{
 for(const w of WORLDS)for(const radius of[1.2,1.5,3.66,5.61,8.5]){const g=growthInfo(w.id,radius);assert.ok(g.index>=0&&g.index<=3);assert.ok(g.value>=0&&g.value<=1);assert.ok(g.stage&&g.hint&&g.message);}
 assert.ok(districtLabel('deep',{x:0,z:-40}).includes('RESEARCH'));assert.equal(growthInfo('deep',8.5).label,'Maximum size');
});
test('retuned wildlife contracts preserve earned medals without comparing times against the old seabed goals',()=>{
 const c=normalizeCareer({version:1,records:{cleanup:{medal:3,time:40,score:500},'camp-cleanup':{medal:3,time:40,score:500},'deep-cleanup':{medal:3,time:1,score:9000}}});
 const next=recordResult(c,{contract:DEEP_CONTRACTS[0],won:true,time:60,score:2000});
 assert.deepEqual(next.records['deep-cleanup'],{medal:3,time:60,score:2000,rulesVersion:4});assert.deepEqual(decodeBackup(encodeBackup(next)),next);
});
