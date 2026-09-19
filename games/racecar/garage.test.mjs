import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { CARS, career, availableCars, selectedCar } from './garage.js';
import { restore, record } from './progress.js';
import { ImportedVehicles } from './imported-vehicles.js';
import { Run } from './rules.js';

test('new careers start with one car and reject invalid or locked selection',()=>{
  assert.equal(availableCars(restore()).length,1);
  assert.equal(selectedCar(restore({car:'apex'})).id,'metro');
  assert.equal(selectedCar(restore({car:'invalid'})).id,'metro');
});
test('existing progress grants unlocks, retained after campaign reset and reload',()=>{
  const p=restore({cursors:{'race:normal':6},car:'apex'});
  assert.equal(p.car,'apex');
  p.cursors['race:normal']=0;
  assert.equal(selectedCar(restore(p)).id,'apex');
});
test('stars use best difficulty per route, shared across modes',()=>{
  const p=restore({results:{'race:easy:0':{stars:3},'race:hard:0':{stars:2},'highway:easy:0':{stars:3}}});
  assert.equal(career(p).stars,6);
});
test('new-car reward is awarded once and persists',()=>{
  const p=restore(),run=new Run({mode:'race',stage:0,difficulty:'normal'});
  run.phase='finished';run.player.finish=40;
  assert.deepEqual(record(p,run).unlocked,['touring']);
  assert.deepEqual(record(p,run).unlocked,[]);
  assert(availableCars(restore(p)).some(c=>c.id==='touring'));
});
test('each imported model has four grounded, independently animated wheels',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile(url,'utf8'))});
  const factory=new ImportedVehicles();
  try { await factory.load(); } finally { globalThis.fetch=original; }
  for(const car of CARS) {
    if(car.procedural)continue;
    assert(factory.models.get(car.id).length<40,`${car.id}: bounded draw groups`);
    const root=factory.create(0,car.id),v=root.userData.vehicle;
    assert.equal(v.wheels.length,4,car.id);
    assert.equal(v.wheels.filter(w=>w.front).length,2,car.id);
    for(const wheel of v.wheels) {
      assert(wheel.radius>0.1 && wheel.radius<(car.id.startsWith('tractor')||car.id==='loader'?1.3:0.7),car.id);
      assert(Math.abs(wheel.pivot.position.y-wheel.radius)<0.04,car.id);
    }
    factory.update(root,{id:'player',x:0,z:12,speed:30},{x:0,y:0,heading:0},{time:1},false);
    assert(v.wheels.every(w=>Number.isFinite(w.spin.rotation.x)));
    factory.release(root);
  }
});
test('garage performance profiles affect acceleration without changing saved difficulty',()=>{
  const speeds=CARS.map(car=>{
    const run=new Run({mode:'race',stage:0,difficulty:'normal'});
    run.phase='playing';run.car=car;
    for(let i=0;i<60;i++) run.update(1/60,{throttle:true});
    assert.equal(run.difficulty,'normal');
    assert(Number.isFinite(run.player.speed));
    return run.player.speed;
  });
  assert(speeds[4]>speeds[0]);
  assert(speeds[2]<speeds[0]);
});
