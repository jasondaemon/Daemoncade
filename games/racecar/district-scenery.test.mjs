import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.min.js';
import {districtSites,islandOutline,insideLand} from './district-sites.js';
import {addDistrictScenery} from './district-scenery.js';
import {careerTrack} from './career-tracks.js';
import {buildTrack} from './world-track.js';
import {canyonBounds,inCanyon} from './canyon.js';
import {sceneryGeometry} from './scenery-geometry.js';
test('boat silhouettes have a tapered bow and curved sails with valid geometry',()=>{
 const hull=sceneryGeometry('hull'),sail=sceneryGeometry('sail');
 for(const g of [hull,sail]){assert.ok([...g.attributes.position.array].every(Number.isFinite));assert.ok([...g.attributes.normal.array].every(Number.isFinite));}
 const pos=hull.attributes.position;
 const bow=[];for(let i=0;i<pos.count;i++)if(pos.getZ(i)<-.49)bow.push(pos.getX(i));
 assert.ok(bow.length>0&&bow.every(x=>Math.abs(x)<.01));
 assert.ok([...sail.attributes.position.array].some((n,i)=>i%3===2&&n>.1));
 hull.dispose();sail.dispose();
});
test('all twenty layouts have bounded settlements clear of the road and canyon',()=>{
 for(let c=0;c<5;c++)for(let r=0;r<4;r++){
  const route=careerTrack(c,r),track=buildTrack(route),a=districtSites(track,route.environment);
  assert.deepEqual(a,districtSites(track,route.environment));assert.ok(a.sites.length>5&&a.sites.length<60);
  for(const s of a.sites){assert.ok(track.points.every(p=>Math.hypot(p.x-s.x,p.y-s.z)>25));assert.equal(inCanyon(canyonBounds(track),s.x,s.z,18),false);}
  if(c===0){assert.ok(a.marine.length>=2);for(const s of a.marine){assert.equal(insideLand(islandOutline(track),s.x,s.z),false);assert.equal(insideLand(islandOutline(track),s.anchor.x,s.anchor.z),true);}}
 }
});
test('district details batch into bounded owned meshes with finite transforms',()=>{
 for(let c=0;c<5;c++){
  const route=careerTrack(c,0),group=new THREE.Group();addDistrictScenery(group,buildTrack(route),route.environment);
  assert.ok(group.children.length>0&&group.children.length<40);
  for(const mesh of group.children){assert.ok(mesh.isInstancedMesh&&mesh.userData.owned);assert.ok([...mesh.instanceMatrix.array].every(Number.isFinite));mesh.dispose();mesh.geometry.dispose();mesh.material.dispose();}
 }
});
