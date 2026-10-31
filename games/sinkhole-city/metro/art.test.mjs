import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three/three.module.min.js';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';
import {MetroRenderer} from './renderer.js';
import {sourceKey} from './world-dressing.js';
import {CITY_BLOCKS} from './city-layout.js';

test('Metro has varied authored lots, sparse contextual fixtures, six facades and six vehicle silhouettes',()=>{
 const run=new DistrictRun(),buildings=run.objects.filter(o=>['building','warehouse'].includes(o.type));assert.equal(buildings.length,37);
 assert.equal(new Set(buildings.filter(o=>o.type==='building').map(sourceKey)).size,6);
 assert.equal(new Set(run.objects.filter(o=>['car','van'].includes(o.type)).map(sourceKey)).size,6);
 assert.deepEqual([...new Set(CITY_BLOCKS.map(b=>b.plots.length))].sort(),[0,1,2,3,6]);
 assert.ok(run.objects.filter(o=>o.type==='bin').length<=8);assert.equal(run.objects.filter(o=>o.type==='cone').length,4);
 for(const {x,z,plots}of CITY_BLOCKS){
  const block=buildings.filter(o=>Math.abs(o.x-x)<5&&Math.abs(o.z-z)<5);assert.equal(block.length,plots.length);
  // Attached frontages may overlap conservative fit circles, not actual facades.
  for(let i=0;i<block.length;i++)for(let j=i+1;j<block.length;j++)assert.ok(Math.hypot(block[i].x-block[j].x,block[i].z-block[j].z)>=4.6-.001);
 }
 const arena=new ArenaRun();assert.equal(arena.objects.length,202);assert.ok(arena.objects.every(o=>o.art===undefined&&!o.vehicle));
});
test('every world receives deterministic extra density and world-specific source variation',()=>{
 const minimum={metro:240,basecamp:241,deep:294,alien:237,orbit:173};
 for(const world of Object.keys(minimum)){
  const a=new DistrictRun({world}),b=new DistrictRun({world});assert.equal(a.objects.length,minimum[world]);assert.deepEqual(a.objects,b.objects);
  assert.ok(a.objects.every(o=>Math.abs(o.x)<=54&&Math.abs(o.z)<=54));assert.ok(new Set(a.objects.map(sourceKey)).size>=11);
 }
});
test('authored variants contain finite, detailed meshes with genuinely different bounds/geometry',()=>{
 const r=Object.create(MetroRenderer.prototype);r.materials=new Map();
 for(const base of['building:quarter','cabin@','coral@','spore@','debris@']){
  const signatures=new Set();for(let n=0;n<(base.startsWith('building')?6:3);n++){
   const root=r.primitive(base+n);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());let vertices=0;
   root.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position;vertices+=p.count;assert.ok([...p.array].every(Number.isFinite));m.geometry.dispose();});
   assert.ok(vertices>100&&vertices<100000);assert.ok(size.x>0&&size.y>0&&size.z>0);signatures.add(`${vertices}:${size.x.toFixed(3)}:${size.y.toFixed(3)}:${size.z.toFixed(3)}`);
  }assert.ok(signatures.size>=2,base);
 }
 for(const material of r.materials.values())material.dispose();
});
