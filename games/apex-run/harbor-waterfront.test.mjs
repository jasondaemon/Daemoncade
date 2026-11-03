import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addHarborWaterfront,waterfrontPath} from "./harbor-waterfront.js";

globalThis.location={search:"?track=harbor-run"};
const {ROAD_SAMPLES}=await import("./track-model.js?waterfront=89b");

for(const quality of["low","medium","high"]){
  const points=waterfrontPath(quality),scene=new THREE.Scene(),group=addHarborWaterfront(THREE,scene,quality);
  assert.equal(points.length-1,quality==="high"?18:quality==="medium"?12:8);
  scene.updateMatrixWorld(true);
  let clearance=Infinity;
  const point=new THREE.Vector3(),world=new THREE.Matrix4(),instance=new THREE.Matrix4();
  group.traverse(object=>{
    if(!object.isMesh)return;
    const position=object.geometry.attributes.position,count=object.isInstancedMesh?object.count:1;
    for(let item=0;item<count;item++){
      if(object.isInstancedMesh)object.getMatrixAt(item,instance);else instance.identity();
      world.multiplyMatrices(object.matrixWorld,instance);
      for(let index=0;index<position.count;index++){
        point.fromBufferAttribute(position,index).applyMatrix4(world);
        for(const sample of ROAD_SAMPLES)clearance=Math.min(clearance,Math.hypot(point.x-sample.x,point.y-sample.y,point.z-sample.z)-sample.width/2);
      }
    }
  });
  assert.ok(clearance>=8,`${quality} waterfront clearance ${clearance}`);
  assert.ok(group.userData.pileCount>=8);
  assert.ok(group.userData.cargoCount>=3);
  assert.equal(group.userData.jointCount,points.length-2);
  assert.equal(group.userData.drawMeshes,9);
  assert.equal(group.userData.segments,points.length-1);

  const deckJoints=group.children[1],railJoints=group.children[3],matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  assert.equal(deckJoints.count,points.length-2);
  assert.equal(railJoints.count,(points.length-2)*2);
  for(let index=1;index<points.length-1;index++){
    deckJoints.getMatrixAt(index-1,matrix);position.setFromMatrixPosition(matrix);
    assert.ok(position.distanceTo(new THREE.Vector3(points[index].x,.39+1,points[index].z))<1e-3,"deck joint covers the exact segment meeting point");
    for(const offset of[0,1]){
      railJoints.getMatrixAt((index-1)*2+offset,matrix);position.setFromMatrixPosition(matrix);
      assert.ok(Math.hypot(position.x-points[index].x,position.z-points[index].z)<=5.11,"rail joint remains on the deck edge");
    }
  }
}
console.log("Apex Harbor waterfront passed");
