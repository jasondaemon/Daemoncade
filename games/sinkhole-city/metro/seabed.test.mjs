import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seabedColor,seabedHeight} from './seabed.js';
import {kelpLeaf} from './deep-art.js';
import {MetroRenderer} from './renderer.js';
import {DistrictRun} from './simulation.js';

test('continuous seabed fields are deterministic, bounded and flat throughout the playable area',()=>{
 const shades=new Set();for(let x=-72;x<=72;x+=3)for(let z=-72;z<=72;z+=3){
  const c=seabedColor(x,z);assert.deepEqual(c,seabedColor(x,z));assert.ok(c.every(v=>Number.isFinite(v)&&v>=0&&v<=1));shades.add(c.map(v=>v.toFixed(2)).join(':'));
  const next=seabedColor(x+.01,z);assert.ok(c.every((v,i)=>Math.abs(v-next[i])<.01));const y=seabedHeight(x,z);assert.ok(y>=-.021&&y<2);
  if(Math.abs(x)<=54&&Math.abs(z)<=54)assert.equal(y,.012);
 }assert.ok(shades.size>100);assert.ok(Math.abs(seabedHeight(72,0)+.02)<1e-10);assert.deepEqual(seabedColor(72,0),[155/255,186/255,173/255]);
});
test('kelp blades retain a shaped midrib and both visible faces at fourteen triangles per leaf',()=>{
 const g=kelpLeaf();assert.equal(g.attributes.position.count/3,14);assert.ok([...g.attributes.position.array,...g.attributes.normal.array].every(Number.isFinite));
 const normals=Array.from({length:g.attributes.normal.count},(_,i)=>g.attributes.normal.getY(i));assert.ok(normals.some(v=>v>.5)&&normals.some(v=>v<-.5));assert.ok(g.attributes.color&&g.attributes.uv);g.dispose();
});
test('small fish/kelp geometry stays bounded without removing fish markings, animals or their animations',()=>{
 const renderer=Object.create(MetroRenderer.prototype);renderer.materials=new Map();
 for(const type of['fish','kelp','whale']){
  const root=renderer.primitive(type);let triangles=0,painted=false;root.traverse(m=>{if(m.isMesh){triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;if(m.geometry.attributes.color)painted=true;m.geometry.dispose();}});
  assert.ok(triangles<(type==='whale'?2000:1000),`${type}: ${triangles}`);if(type==='fish')assert.ok(painted);
 }
 const run=new DistrictRun({world:'deep'});assert.equal(run.total,294);assert.equal(run.marine.length,97);assert.equal(run.marine.filter(o=>o.type==='whale').length,2);
 for(const m of renderer.materials.values())m.dispose();
});
