import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three/three.module.min.js';
import {CARS} from './garage.js';
import {careerTrack} from './career-tracks.js';
import {buildTrack} from './world-track.js';
import {desertSites,addDesertLandmarks} from './desert.js';
import {canyonBounds,canyonTerrain,inCanyon} from './canyon.js';
test('Canyon Run has a deep terrain opening beyond the outside bend',()=>{
 const track=buildTrack(careerTrack(1,2)),bounds=canyonBounds(track);
 assert.ok(track.points.every(p=>p.x+18<bounds.edge));
 assert.ok(bounds.end-bounds.start>3000);
 const terrain=canyonTerrain(track,0xb88b60);terrain.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(terrain);assert.ok(box.min.y<-90);
 for(const p of desertSites(track).trees)assert.equal(inCanyon(bounds,p.x,p.z,7),false);
 terrain.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});
});
test('all imported car models have their front axle toward negative Z',()=>{
 for(const car of CARS){
  if(car.procedural)continue;
  const data=JSON.parse(readFileSync(new URL(`assets/${car.source||'quaternius-cars'}/${car.model}.json`,import.meta.url)));
  const axle=prefix=>{const z=data.parts.filter(p=>p.part.startsWith(prefix)).flatMap(p=>p.positions.filter((_,i)=>i%3===2));return z.reduce((a,b)=>a+b,0)/z.length;};
  assert.ok(axle('front')<axle('rear'),car.id);
 }
});
test('desert landmarks remain outside all track sections with bounded batches',()=>{
 for(let round=0;round<4;round++) {
  const track=buildTrack(careerTrack(1,round)),sites=desertSites(track);
  assert.ok(sites.bluffs.length>2);assert.ok(sites.trees.length>10);
  for(const site of [...sites.bluffs,...sites.trees])for(const p of track.points)assert.ok(Math.hypot(site.x-p.x,site.z-p.y)>(site.radius||7)+22);
  const group=new THREE.Group();addDesertLandmarks(group,track);
  assert.ok(group.children.length<=12);assert.ok(group.children.every(m=>m.isInstancedMesh));
  group.children.forEach(m=>{m.geometry.dispose();m.material.dispose();m.dispose();});
 }
});
