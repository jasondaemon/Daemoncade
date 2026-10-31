import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';
import {CITY_BLOCKS} from './city-layout.js';
import {CAMP_SITES,campDry} from './habitats.js';
import {cityPermutation} from './layout-variation.js';
const signature=r=>JSON.stringify(r.objects.map(o=>[o.type,o.x,o.z,o.yaw,o.site]));
test('same seed reproduces each world; different seeds vary all five without losing required objects',()=>{
 for(const world of['metro','basecamp','deep','alien','orbit']){
  const variants=new Set();
  for(const seed of[1,2,3,17,91]){
   const a=new DistrictRun({world,seed}),b=new DistrictRun({world,seed});assert.equal(signature(a),signature(b));variants.add(signature(a));assert.ok(a.objects.every(o=>Number.isFinite(o.x+o.z+o.radius)&&Math.abs(o.x)<=56&&Math.abs(o.z)<=56));
   assert.equal(a.objects.filter(o=>o.type==='landmark').length,1);
   if(world==='basecamp'){assert.equal(a.total,241);assert.ok(a.campSwaps>0);assert.equal(a.objects.filter(o=>o.type==='tent').length,18);assert.equal(a.objects.filter(o=>o.type==='rv').length,4);for(const o of a.objects.filter(o=>o.site!==undefined))assert.ok(campDry(o.x,o.z,o.radius));}
   if(world==='alien'){assert.equal(a.objects.filter(o=>o.relay).length,6);assert.equal(a.objects.filter(o=>o.type==='pod').length,18);assert.ok(a.objects.filter(o=>['spore','shard'].includes(o.type)).length>=110);}
  }
  assert.equal(variants.size,5,world);
 }
});
test('Metro moves full lots, keeps road actors fixed and moves the tower among valid lots',()=>{
 const baseline=new DistrictRun(),locations=new Set();
 for(let seed=1;seed<=24;seed++){
  const r=new DistrictRun({seed}),order=cityPermutation(seed);assert.equal(new Set(order).size,16);assert.equal(r.total,240);
  for(const [i,o]of r.objects.entries()){
   const original=baseline.objects[i];if(o.traffic||o.parked||o.signal||o.walker){assert.equal(o.x,original.x);assert.equal(o.z,original.z);continue;}
   let at=0,d=Infinity;CITY_BLOCKS.forEach((b,i)=>{const n=Math.hypot(original.x-b.x,original.z-b.z);if(n<d){at=i;d=n;}});
   const from=CITY_BLOCKS[at],to=CITY_BLOCKS[order[at]];assert.ok(Math.abs(o.x-original.x-(to.x-from.x))<1e-9);assert.ok(Math.abs(o.z-original.z-(to.z-from.z))<1e-9);
  }
  const tower=r.objects.find(o=>o.type==='landmark'),park=r.cityBlocks.find(b=>b.kind==='park'),fountain=r.objects.find(o=>o.type==='fountain');assert.equal(fountain.x,park.x);assert.equal(fountain.z,park.z);assert.ok(CITY_BLOCKS.some(b=>b.x===tower.x&&b.z===tower.z));locations.add(tower.x+','+tower.z);
 }
 assert.ok(locations.size>=10);assert.deepEqual(signature(new ArenaRun()),signature(new ArenaRun()));
});
