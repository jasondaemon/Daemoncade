import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addHarborRouteCampus,harborCampusSpecs,metreBox} from "./harbor-route-campus.js";
import {harborWaterContains} from "./harbor-maritime-assets.js";

globalThis.location={search:"?track=harbor-run"};
const {ROAD_SAMPLES,VENUE}=await import("./track-model.js?campus=92"),specs=harborCampusSpecs(ROAD_SAMPLES);
assert.equal(specs.length,6);assert.deepEqual(specs.map(spec=>spec.sampleIndex),[1900,1950,2000,2050,2100,2150]);
assert.equal(addHarborRouteCampus(THREE,new THREE.Scene(),ROAD_SAMPLES,"low"),null);
for(const quality of["medium","high"]){
  const scene=new THREE.Scene(),group=addHarborRouteCampus(THREE,scene,ROAD_SAMPLES,quality);scene.updateMatrixWorld(true);assert.equal(group.userData.districts,6);assert.equal(group.userData.colorDraws,18);assert.equal(group.userData.serviceRoad,true);
  const shells=group.children.filter(child=>child.userData.harborHallShell);assert.equal(shells.length,6);for(const shell of shells){assert.equal(shell.geometry.userData.metresPerTile,2.4);const uv=shell.geometry.attributes.uv,values=Array.from({length:uv.count},(_,index)=>uv.getX(index));assert.ok(Math.max(...values)-Math.min(...values)>=shell.geometry.parameters.width/2.4-.01,"concrete facade UVs retain physical metre scale")}
  assert.ok(group.children.some(child=>child.isInstancedMesh&&child.count===18),"eighteen recessed loading doors/awnings define the facades");assert.ok(group.children.some(child=>child.isInstancedMesh&&child.count===36),"loading-bay frames are authored geometry");assert.equal(metreBox(THREE,24,8,16).userData.metresPerTile,2.4);
  let minRoad=Infinity,vertices=0;const local=new THREE.Vector3(),world=new THREE.Vector3(),instance=new THREE.Matrix4(),combined=new THREE.Matrix4();
  group.traverse(object=>{
    if(!object.isMesh)return;
    const position=object.geometry.attributes.position;if(!position)return;
    const count=object.isInstancedMesh?object.count:1;
    for(let item=0;item<count;item++){
      if(object.isInstancedMesh)object.getMatrixAt(item,instance);else instance.identity();
      combined.multiplyMatrices(object.matrixWorld,instance);
      for(let vertex=0;vertex<position.count;vertex++){
        local.fromBufferAttribute(position,vertex);world.copy(local).applyMatrix4(combined);vertices++;
        assert.equal(harborWaterContains(world,VENUE,.35),false,`${quality} campus vertex ${object.uuid}/${item}/${vertex} is dry`);
        for(const sample of ROAD_SAMPLES)minRoad=Math.min(minRoad,Math.hypot(world.x-sample.x,world.z-sample.z)-sample.width/2);
      }
    }
  });
  assert.ok(vertices>2000,`actual transformed campus coverage ${vertices}`);assert.ok(minRoad>=7.5,`${quality} campus road clearance ${minRoad}`);
  const serviceRoad=group.children.find(child=>child.userData.harborServiceRoad);assert.ok(serviceRoad);assert.ok(serviceRoad.geometry.index.count>150,"continuous service road has connected triangles");
}
console.log("Apex Harbor route campus passed",{districts:specs.length});
