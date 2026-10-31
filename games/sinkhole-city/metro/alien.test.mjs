import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {ALIEN_CONTRACTS,ALL_CONTRACTS,objectiveMatches} from './worlds.js';
import {normalizeCareer,recordResult,worldUnlocked,encodeBackup,decodeBackup} from './career.js';
import {ALIEN_GROVES,GROVE_LAYOUTS,groveVein,groveCharge} from './alien.js';

test('six authored groves have distinct pod routes, with veins ending at real targets',()=>{
 const run=new DistrictRun({world:'alien',free:true}),signatures=new Set();
 for(const [i,[x,z]]of ALIEN_GROVES.entries()){
  const pods=run.objects.filter(o=>o.grove===i&&o.type==='pod');assert.equal(pods.length,3);
  signatures.add(pods.map(o=>Math.hypot(o.x-x,o.z-z).toFixed(2)).join(','));
  for(let j=0;j<3;j++){
   const start=groveVein(i,j,0);assert.ok(Math.hypot(start.x,start.z)<1e-8);
   const end=groveVein(i,j,1);assert.ok(Math.hypot(end.x-(pods[j].x-x),end.z-(pods[j].z-z))<1e-8);
   const [dx,dz]=GROVE_LAYOUTS[i].pods[j];assert.ok(Math.abs(groveVein(i,j,.5).x-dx/2)+Math.abs(groveVein(i,j,.5).z-dz/2)>.5,'curved rather than straight spokes');
  }
  const growth=run.objects.filter(o=>o.grove===i&&['shard','spore'].includes(o.type));assert.equal(growth.length,22);
  for(const o of growth)for(const other of run.objects){
   if(o===other||!['resonator','pod','crystal'].includes(other.type))continue;
   assert.ok(Math.hypot(o.x-other.x,o.z-other.z)>=o.radius+other.radius+.18-1e-8,'forage must not hide under a large silhouette');
  }
 }
 assert.equal(signatures.size,6);assert.equal(run.objects.filter(o=>o.relay).length,6);assert.equal(run.objects.filter(o=>o.type==='pod').length,18);
});

test('mineral-vein charge is local, simulation-timed, stable on pause and resets per run',()=>{
 const run=new DistrictRun({world:'alien',free:true}),relay=run.objects.find(o=>o.relay);
 run.time=10;run.consume(run,relay);assert.equal(relay.dischargedAt,10);
 assert.equal(groveCharge(relay,10),0);assert.equal(groveCharge(relay,10.4).toFixed(3),'0.500');assert.equal(groveCharge(relay,11),1);assert.equal(groveCharge(relay,10,true),1);
 assert.ok(run.objects.filter(o=>o.relay&&o!==relay).every(o=>groveCharge(o,20)===0));
 const paused=groveCharge(relay,run.time);assert.equal(groveCharge(relay,run.time),paused);
 run.consume(run,relay);assert.equal(relay.dischargedAt,10);
 assert.ok(new DistrictRun({world:'alien'}).objects.filter(o=>o.relay).every(o=>groveCharge(o,100)===0));
});

test('Alien requires Deep medals and all prior world gates; backups retain the new records',()=>{
 let career=normalizeCareer({});
 assert.equal(worldUnlocked(career,'alien'),false);
 assert.equal(worldUnlocked(normalizeCareer({records:{'deep-cleanup':{medal:3,time:40,score:500}}}),'alien'),false);
 for(const id of ['cleanup','camp-cleanup','deep-cleanup','alien-forage'])career=recordResult(career,{contract:ALL_CONTRACTS.find(c=>c.id===id),won:true,time:40,score:500});
 assert.equal(worldUnlocked(career,'alien'),true);assert.ok(career.records['alien-forage']);assert.deepEqual(decodeBackup(encodeBackup(career)),career);
});
test('relay reward is local and exactly once; sealed pods and portal cannot be consumed',()=>{
 const run=new DistrictRun({world:'alien',free:true}),relay=run.objects.find(o=>o.relay),pods=run.objects.filter(o=>o.type==='pod'),portal=run.objects.find(o=>o.type==='landmark');
 const area=run.player.area;run.consume(run,pods[0]);run.consume(run,portal);assert.equal(run.player.area,area);assert.equal(run.eligible(portal),false);
 run.consume(run,relay);const score=run.score,after=run.player.area;run.consume(run,relay);
 assert.equal(run.relays,1);assert.equal(run.score,score);assert.equal(run.player.area,after);assert.equal(run.counts.cores,0);
 assert.equal(pods.filter(o=>o.phase==='idle').length,3);assert.equal(pods.filter(o=>o.phase==='sealed').length,15);assert.equal(portal.phase,'sealed');
 assert.ok(pods.filter(o=>o.phase==='idle').every(o=>!run.eligible(o)),'opening pods does not bypass their size threshold');
 for(const other of run.objects.filter(o=>o.relay&&o!==relay))run.consume(run,other);
 assert.equal(portal.phase,'idle');assert.equal(run.events.filter(e=>e.type==='portal').length,1);
});
for(const contract of ALIEN_CONTRACTS)test(`${contract.title}: continuous route completes without teleports or automatic rewards`,()=>{
 const run=new DistrictRun({contract});let target;
 for(let tick=0;tick<contract.duration*60+1&&!run.done;tick++){
  const p=run.player,available=run.objects.filter(o=>run.eligible(o)),objective=available.filter(o=>objectiveMatches(contract,o));
  if(target?.phase==='consumed')target=null;
  if(!target)target=(objective.length?objective:available).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;
 }
 assert.equal(run.won,true,`${run.time}s: ${JSON.stringify(run.counts)} radius ${run.player.radius}`);assert.ok(run.counts[contract.kind]>=contract.target);
 if(contract.kind==='landmark')assert.equal(run.relays,6);
});
