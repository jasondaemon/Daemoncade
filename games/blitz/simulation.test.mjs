import test from 'node:test';
import assert from 'node:assert/strict';
import { Run, MISSIONS, WEAPONS, formation, segmentHit, MAX_FORCE } from './simulation.js';

test('swept collision catches a projectile crossing an entire target between frames',()=>{
  assert.equal(segmentHit(0,8,0,-8,0,0,1,1),7/16);
  assert.equal(segmentHit(2,8,2,-8,0,0,1,1),null);
  assert.equal(segmentHit(0,0,0,0,0,0,1,1),0);
});
test('formations are centered, bounded and have exactly one position per soldier',()=>{
  for(let count=1;count<=MAX_FORCE;count++){
    const p=formation(count);assert.equal(p.length,count);assert.equal(new Set(p.map(q=>q.x+','+q.z)).size,count);
    assert.ok(p.every(q=>Math.abs(q.x)<1.6&&Math.abs(q.z)<2.1));
  }
});
test('invalid mode and mission inputs have safe defaults',()=>{
  const r=new Run(999,'invalid');assert.equal(r.mission,2);assert.equal(r.difficulty,'normal');
});
test('a dead squad is zero, terminal, and cannot fire or score afterwards',()=>{
  const r=new Run();r.hurt(99);assert.equal(r.force,0);assert.equal(r.status,'lost');r.update(1);assert.equal(r.bullets.length,0);assert.equal(r.score,0);
});
test('a volley cannot repeatedly damage the same squad during its recovery window',()=>{
  const r=new Run();r.hurt(2);r.hurt(2);assert.equal(r.force,10);
});
test('enemy visible count decreases exactly with health and kills score only once',()=>{
  const r=new Run();r.spawn({at:20,kind:'enemy',x:0,count:10});const o=r.objects[0];r.hit(o,6,0,o.z);assert.equal(o.remaining,8);assert.equal(r.kills,2);r.hit(o,999,0,o.z);assert.equal(o.remaining,0);assert.equal(r.kills,10);const score=r.score;r.hit(o,999,0,o.z);assert.equal(r.score,score);
});
test('a nearer target intercepts bullets even if inserted after the farther target',()=>{
  const r=new Run();r.nextEvent=99;r.shotClock=100;r.spawn({kind:'supply',at:23,x:0,hp:100,reward:1});r.spawn({kind:'supply',at:13,x:0,hp:100,reward:1});
  const [far,near]=r.objects;r.bullets.push({id:999,team:'blue',x:0,z:0,vx:0,vz:-100,life:3,damage:10});r.update(.3);assert.equal(far.hp,100);assert.equal(near.hp,90);
});
test('red projectiles outside the actual formation do not cause phantom damage',()=>{
  const r=new Run();r.nextEvent=99;r.shotClock=100;r.bullets.push({id:999,team:'red',x:3,z:1,vx:0,vz:100,life:2,damage:3});r.update(.1);assert.equal(r.force,12);
});
test('overdrive consumes a full charge and expires on simulation time',()=>{
  const r=new Run();assert.equal(r.boostNow(),false);r.energy=100;assert.equal(r.boostNow(),true);assert.equal(r.energy,0);assert.equal(r.boostNow(),false);for(let i=0;i<301;i++)r.update(1/60);assert.equal(r.boost,0);
});
test('all four guns are offered and upgrades take effect immediately',()=>{
  const offered=new Set(['rifle',...MISSIONS.flatMap(m=>m.events.filter(e=>e.kind==='weapon').map(e=>e.weapon))]);assert.deepEqual(offered,new Set(Object.keys(WEAPONS)));
  for(const weapon of ['machine','flame','rocket']){const r=new Run();r.spawn({kind:'weapon',at:25,x:0,hp:2,weapon});r.hit(r.objects[0],3,0,0);assert.equal(r.weapon,weapon);assert.equal(r.shotClock,0)}
});
test('boss cannot be destroyed before entering its encounter',()=>{
  const r=new Run();r.spawn({kind:'boss',at:30});r.hit(r.objects[0],99999,0,0);assert.equal(r.status,'playing');assert.ok(r.objects[0].hp>0);
});
function steer(r){
  r.boostNow();
  if(r.bossEngaged){r.targetX=Math.sin(r.time*1.4)*1.5;r.boostNow();return}
  const o=r.objects.filter(o=>o.z<2).sort((a,b)=>b.z-a.z)[0];if(!o)return;
  if(o.kind==='gates'){const value=g=>g.type==='multiply'?r.force*g.value:r.force+g.value;r.targetX=o.choices.reduce((a,b)=>value(a)>value(b)?a:b).x}
  else r.targetX=o.kind==='barrier'?-o.x:o.x;
}
test('each mission and difficulty is completable with route choices and upgrades',()=>{
  for(let mission=0;mission<3;mission++)for(const difficulty of ['easy','normal','hard']){
    const r=new Run(mission,difficulty);let acquired=false;
    for(let i=0;i<9000&&r.status==='playing';i++){steer(r);r.update(1/60);for(const e of r.drain())if(e.type==='weapon')acquired=true}
    assert.equal(r.status,'won',mission+':'+difficulty);assert.ok(acquired);assert.ok(r.bossEngaged);assert.ok(r.force>0&&r.force<=MAX_FORCE);assert.ok(r.time<110);
  }
});
test('final mission punishes ignoring routes and weapon upgrades',()=>{
  const r=new Run(2,'normal');for(let i=0;i<9000&&r.status==='playing';i++){r.update(1/60);r.drain()}assert.equal(r.status,'lost');
});
test('every Hard stage defeats an unattended center-lane run',()=>{
  for(let mission=0;mission<3;mission++){
    const r=new Run(mission,'hard');
    for(let i=0;i<9000&&r.status==='playing';i++){r.update(1/60);r.drain()}
    assert.equal(r.status,'lost',`Hard stage ${mission+1}`);
  }
});
test('difficulty changes visible recruitment rewards and gate charge cost',()=>{
  const rewards=[],charges=[];
  for(const difficulty of ['easy','normal','hard']){
    const r=new Run(0,difficulty);
    r.spawn({kind:'gates',at:30,choices:[{type:'add',value:10},{type:'add',value:-6}]});
    r.spawn({kind:'supply',at:40,x:0,hp:18,reward:10});
    rewards.push(r.objects[0].choices[0].value);charges.push(r.objects[0].choices[0].chargeRequired);
    assert.equal(r.objects[0].choices[1].value,-6);
    assert.equal(r.objects[1].reward,rewards.at(-1));
  }
  assert.deepEqual(rewards,[12,10,8]);assert.deepEqual(charges,[10,14,24]);
});
test('enemy bullets cost one, two, or four troops by difficulty',()=>{
  for(const [difficulty,damage] of [['easy',1],['normal',2],['hard',4]]){
    const r=new Run(0,difficulty);r.spawn({kind:'enemy',at:20,count:8,x:0});
    r.objects[0].aimX=0;r.fireEnemy(r.objects[0]);assert.equal(r.bullets[0].damage,damage);
    r.hurt(r.bullets[0].damage);assert.equal(r.force,12-damage);
  }
});
test('30, 60 and 120 Hz rendering produce identical fixed-step outcomes',()=>{
  function play(hz){const r=new Run();let pending=0;for(let i=0;i<hz*45;i++){pending+=1/hz;while(pending+1e-9>=1/60){steer(r);r.update(1/60);r.drain();pending-=1/60;}}return {force:r.force,score:r.score,weapon:r.weapon,distance:r.distance};}
  assert.deepEqual(play(30),play(60));assert.deepEqual(play(60),play(120));
});
