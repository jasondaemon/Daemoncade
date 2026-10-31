import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../vendor/three/three.module.min.js';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';
import {MetroRenderer} from './renderer.js';
import {CITY_PARKS,animateFountain} from './park-art.js';
import {sourceKey} from './world-dressing.js';
test('three planted blocks have perimeter rail sections and open path entrances',()=>{
 const r=new DistrictRun();assert.equal(r.total,240);assert.equal(r.objects.filter(o=>o.type==='fountain').length,1);
 for(const p of CITY_PARKS){const rails=r.objects.filter(o=>o.type==='fence'&&Math.abs(o.x-p.x)<8&&Math.abs(o.z-p.z)<8),gates=r.objects.filter(o=>o.type==='gate'&&Math.abs(o.x-p.x)<8&&Math.abs(o.z-p.z)<8);assert.equal(rails.length,p.main?8:12);assert.equal(gates.length,p.main?4:2);assert.ok(rails.every(o=>Math.abs(o.x-p.x)>4||Math.abs(o.z-p.z)>6));assert.ok(gates.every(o=>o.x===p.x||p.main&&o.z===p.z));}
 assert.equal(new Set(r.objects.filter(o=>o.treeStyle).map(sourceKey)).size,3);
 assert.equal(new ArenaRun().objects.length,202,'competitive rules-v1 layout is unchanged');
});
test('park props have finite bounded distinct geometry and a simulation-clock water shader',()=>{
 const r=Object.create(MetroRenderer.prototype);r.materials=new Map();const trees=new Set();
 for(const key of['fountain','fence:short','fence:long','gate:open','tree:park-linden','tree:park-birch','tree:park-cedar']){
  const root=r.primitive(key);root.updateMatrixWorld(true);let vertices=0;root.traverse(m=>{if(m.isMesh){const p=m.geometry.attributes.position;assert.ok(p.array.every(Number.isFinite));vertices+=p.count;}});assert.ok(vertices>100&&vertices<20000,key);const size=new T.Box3().setFromObject(root).getSize(new T.Vector3());assert.ok(size.y>1&&size.x>.5);if(key.startsWith('tree:'))trees.add(vertices+':'+size.y.toFixed(2));
 }
 assert.equal(trees.size,3);const mat=new T.MeshStandardMaterial(),clock={value:0};animateFountain(mat,clock);const s={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};mat.onBeforeCompile(s);assert.equal(s.uniforms.parkTime,clock);assert.ok(s.fragmentShader.includes('parkTime*8.0'));
});
