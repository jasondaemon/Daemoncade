import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three/three.module.min.js';
import {MetroRenderer} from './renderer.js';
import {alienGround} from './alien-art.js';
test('Alien groves and portal basin share one flat blended surface with no interior patch edges',()=>{
 const r=Object.create(MetroRenderer.prototype);r.materials=new Map();const group=new THREE.Group();alienGround(r,group);
 const surfaces=group.children.filter(m=>m.geometry.attributes.color);assert.equal(surfaces.length,1);
 const mesh=surfaces[0],p=mesh.geometry.attributes.position,c=mesh.geometry.attributes.color,n=mesh.geometry.attributes.normal,base=new THREE.Color(0x493a61),colors=new Set();assert.ok(p.count<6000);assert.ok(mesh.material.vertexColors);assert.ok(mesh.userData.ownedMaterial);
 for(let i=0;i<p.count;i++){
  assert.ok(Math.abs(p.getY(i)-.005)<1e-7);assert.ok(n.getY(i)>.99);colors.add([c.getX(i),c.getY(i),c.getZ(i)].join(','));
  if(Math.abs(p.getX(i))===72||Math.abs(p.getZ(i))===72)for(const [value,expected]of [[c.getX(i),base.r],[c.getY(i),base.g],[c.getZ(i),base.b]])assert.ok(Math.abs(value-expected)<1e-6);
 }
 assert.ok(colors.size>300);group.traverse(m=>m.geometry?.dispose());for(const mat of r.materials.values())mat.dispose();mesh.material.dispose();
});
