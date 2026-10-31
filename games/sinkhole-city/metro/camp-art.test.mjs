import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three/three.module.min.js';
import {MetroRenderer} from './renderer.js';
import {campPrimitive} from './camp-art.js';

test('overland rig shells are finite, bounded and have real open wheel arches',()=>{
 const r=Object.create(MetroRenderer.prototype);r.materials=new Map();
 for(const rig of['roof-jeep','popup-pickup','fj-suv','explore-trailer']){
  const root=campPrimitive(r,'rv:'+rig);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());let triangles=0,body;
  root.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position;assert.ok(p.array.every(Number.isFinite));triangles+=(m.geometry.index?.count||p.count)/3;if(m.userData.wheelArches)body=m;});
  assert.ok(size.x>1.5&&size.y>1&&size.z>3);assert.ok(triangles>800&&triangles<14000,`${rig}: ${triangles}`);
  if(rig!=='explore-trailer'){
   assert.ok(body);const ray=new THREE.Raycaster(new THREE.Vector3(3,.7,1.3),new THREE.Vector3(-1,0,0));assert.equal(ray.intersectObject(body).length,0,'wheel well must not be a solid body box');
   ray.set(new THREE.Vector3(3,.7,0),new THREE.Vector3(-1,0,0));assert.ok(ray.intersectObject(body).length>0,'body remains solid between the wheels');
  }
 }
});

test('reference rigs preserve the flat Project M roof and curved dual Explore wings',()=>{
 const r=Object.create(MetroRenderer.prototype);r.materials=new Map();
 const pickup=campPrimitive(r,'rv:popup-pickup');pickup.updateMatrixWorld(true);
 let roof;pickup.traverse(m=>{if(m.userData.referencePart==='project-m-flat-white-roof')roof=m;});
 assert.ok(roof);assert.equal(roof.material.color.getHex(),0xf4f3ea);
 const size=new THREE.Box3().setFromObject(roof).getSize(new THREE.Vector3());
 assert.ok(size.y<.15&&size.z<3&&size.x>1.9,'thin, flat roof stays over the pickup bed');
 const trailer=campPrimitive(r,'rv:explore-trailer');trailer.updateMatrixWorld(true);const wings=[];let shell;
 trailer.traverse(m=>{if(m.userData.referencePart==='explore-arched-canvas')wings.push(m);if(m.userData.referencePart==='explore-rounded-nose')shell=m;});
 assert.equal(wings.length,2);assert.ok(shell);
 const bounds=wings.map(m=>new THREE.Box3().setFromObject(m));
 assert.ok(bounds[0].max.x<0&&bounds[1].min.x>0,'separate deployed wings extend to opposite sides');
 for(const wing of wings){const points=wing.geometry.parameters.shapes.getPoints(20),highest=Math.max(...points.map(p=>p.y));assert.ok(highest>2.35);assert.ok(points.filter(p=>p.y>2&&p.y<highest-.02).length>5,'fabric roof has curved shoulders rather than a hard flat box');}
});
