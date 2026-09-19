import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newCareer,restoreCareers,profile,buyCar,upgrade,admit,tunedCar,settle,series,performanceCurve,carPotential} from './career.js';
import {Run} from './rules.js';
import {careerTrack} from './career-tracks.js';
import {circuitPoint} from './circuit.js';
import {driver} from './driving-test-helper.mjs';
test('purchase comparison uses independent stock and maximum builds without changing saves',()=>{
 const p=newCareer('normal');p.parts.metro={engine:1,transmission:2};
 const before=JSON.stringify(p),current=tunedCar(p),{stock,full}=carPotential(p,'metro');
 assert.ok(stock.speed<current.speed&&current.speed<full.speed);
 assert.ok(stock.accel<current.accel&&current.accel<full.accel);
 assert.equal(JSON.stringify(p),before);
 const locked=carPotential(p,'formula');assert.ok(locked.full.speed>locked.stock.speed);
 assert.equal(p.car,'metro');
});
test('careers have independent wallets and restore without legacy data',()=>{
  const saves=restoreCareers({});profile(saves).wallet=1000;saves.active='hard';assert.equal(profile(saves).wallet,0);
  assert.equal(restoreCareers(JSON.parse(JSON.stringify(saves))).profiles.normal.wallet,1000);
  assert.equal(profile(restoreCareers({wallet:999999,owned:['apex']})).owned.length,1);
});
test('purchases and upgrades cannot overspend or duplicate ownership',()=>{
  const p=newCareer('normal');assert.equal(buyCar(p,'touring'),false);p.wallet=8000;
  assert.ok(buyCar(p,'touring'));assert.equal(p.wallet,500);assert.equal(buyCar(p,'touring'),false);
  assert.equal(upgrade(p,'touring','engine'),false);assert.ok(upgrade(p,'touring','transmission'));
  assert.equal(p.wallet,0);assert.ok(tunedCar(p).accel>.21);assert.equal(tunedCar(p).boost,0);
  assert.equal(upgrade(p,'touring','__proto__'),false);assert.equal(p.wallet,0);
});
test('admission requires both podium and money and is permanent',()=>{
  const p=newCareer('normal');p.wallet=20000;assert.equal(admit(p,1),false);p.podiums.push(0);
  assert.ok(admit(p,1));assert.equal(p.wallet,11000);assert.equal(admit(p,1),false);assert.equal(admit(p,2),false);
});
test('cannot skip earlier circuits even with forged podium flags and cash',()=>{
  const p=newCareer('normal');p.wallet=999999;p.podiums=[0,1,2,3];
  assert.equal(admit(p,4),false);assert.equal(admit(p,2),false);assert.equal(p.wallet,999999);
  assert.ok(admit(p,1));assert.ok(admit(p,2));
  const restored=restoreCareers({profiles:{normal:{...p,admitted:[0,3,4]}}});
  assert.deepEqual(restored.profiles.normal.admitted,[0]);
});
test('malformed admission and numbers are bounded during restore',()=>{
  const restored=restoreCareers({profiles:{normal:{wallet:-100,admitted:{},parts:{metro:{engine:999}},owned:['bad','metro'],paint:{metro:'javascript:bad'}}}});
  assert.equal(restored.profiles.normal.wallet,0);assert.equal(restored.profiles.normal.parts.metro.engine,3);
  assert.equal(restored.profiles.normal.paint.metro,undefined);
});
test('typical second places can purchase Touring after five to eight races',()=>{
  const p=newCareer('normal');let races=0;
  while(p.wallet<7500&&races<10) {
    const r=new Run({mode:'race'});r.phase='finished';r.player.finish=140;r.player.z=r.goal;
    r.rivals[0].finish=135;r.rivals[0].z=r.goal;r.careerId='economy'+races;r.cashCollected=100;
    settle(p,r);races++;
  }
  assert.ok(races>=5&&races<=8,String(races));assert.ok(buyCar(p,'touring'));
});
test('four finishes settle a championship once and persist progression',()=>{
  const p=newCareer('normal');
  for(let i=0;i<4;i++) {
    const run=new Run({mode:'race'});run.phase='finished';run.player.finish=120;run.player.z=run.goal;
    run.careerId='race-'+i;run.cashCollected=100;
    const reward=settle(p,run);assert.ok(reward.total>=1300);assert.equal(settle(p,run),null);
  }
  assert.ok(p.podiums.includes(0));assert.equal(series(p).round,0);assert.equal(p.races,4);
  const restored=restoreCareers({active:'normal',profiles:{normal:p}});assert.equal(profile(restored).wallet,p.wallet);
});
test('DNF does not advance series or pay placement; pickups remain capped',()=>{
  const p=newCareer('hard'),run=new Run({mode:'race'});run.phase='lost';run.careerId='dnf';run.cashCollected=99999;
  assert.equal(settle(p,run).total,600);assert.equal(series(p).round,0);
});
test('curves match physics cap; upgrades cap at three',()=>{
  const p=newCareer('normal');p.wallet=100000;
  for(let i=0;i<3;i++)assert.ok(upgrade(p,'metro','engine'));
  assert.equal(upgrade(p,'metro','engine'),false);
  const car=tunedCar(p);assert.ok(performanceCurve(car).at(-1).speed<=66*car.speed*3.6);
});
test('twenty career layouts close cleanly and differ in geometry',()=>{
  const shapes=new Set();
  for(let region=0;region<5;region++)for(let round=0;round<4;round++) {
    const route=careerTrack(region,round),a=circuitPoint(route,0),b=circuitPoint(route,route.length);
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8);
    shapes.add(JSON.stringify(route.circuit.map(p=>[p.x,p.y])));
  }
  assert.equal(shapes.size,20);
});
test('all twenty career tracks finish with active steering and circuit-appropriate cars',()=>{
  for(const difficulty of ['easy','normal','hard'])for(let region=0;region<5;region++)for(let round=0;round<4;round++) {
    const r=new Run({mode:'race',difficulty});r.route=careerTrack(region,round);
    const p=newCareer(difficulty);p.car=['metro','touring','sport','interceptor','apex'][region];
    r.route.laps=2;r.goal=r.route.length*2;r.phase='playing';r.car=tunedCar(p);
    r.careerId=`${difficulty}-${region}-${round}`;r.cashCollected=0;
    for(let i=0;i<24001&&r.phase==='playing';i++)r.update(1/60,driver(r));
    assert.equal(r.phase,'finished',r.careerId);assert.ok(r.time<400);
  }
});
test('career layouts gain corner complexity without crossings or overlapping roads',()=>{
  const totals=[];
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  for(let region=0;region<5;region++) {
    let turning=0;
    for(let round=0;round<4;round++) {
      const route=careerTrack(region,round),p=route.circuit;
      for(let i=0;i<512;i++) {
        const d=p[i+1].heading-p[i].heading;turning+=Math.abs(Math.atan2(Math.sin(d),Math.cos(d)));
        for(let j=i+2;j<512;j++) {
          if(i===0&&j===511)continue;
          const a=p[i],b=p[i+1],c=p[j],d=p[j+1];
          assert.ok(!(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0),`${route.name}: crossed centerline`);
          const gap=Math.min(c.z-a.z,route.length-c.z+a.z);
          if(gap>65)assert.ok(Math.hypot(a.x-c.x,a.y-c.y)>28,`${route.name}: road clearance`);
        }
      }
    }
    totals.push(turning);
  }
  for(let i=1;i<5;i++)assert.ok(totals[i]>totals[i-1],`Region ${i} must add corner complexity`);
});
