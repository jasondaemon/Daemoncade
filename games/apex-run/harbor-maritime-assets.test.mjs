import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addHarborBuoys,BUOY_SAMPLE_INDICES,harborWaterContains} from "./harbor-maritime-assets.js";

globalThis.location={search:"?track=harbor-run"};
const {ROAD_SAMPLES,VENUE}=await import("./track-model.js?buoys=88b");
const source=new THREE.Group(),mesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,8,8),new THREE.MeshStandardMaterial());
mesh.position.y=4;source.add(mesh);

assert.equal(addHarborBuoys(THREE,new THREE.Scene(),source,ROAD_SAMPLES,VENUE,"low").length,0);
assert.equal(harborWaterContains({x:-693.54,z:-246.71},VENUE,3),false,"reviewed land placement rejected");
for(const quality of["medium","high"]){
  const scene=new THREE.Scene(),buoys=addHarborBuoys(THREE,scene,source,ROAD_SAMPLES,VENUE,quality);
  assert.equal(buoys.length,quality==="high"?7:5,`${quality} uses the actual production water-filtered count`);
  for(const buoy of buoys){
    assert.ok(BUOY_SAMPLE_INDICES.includes(buoy.userData.sampleIndex));
    assert.ok(harborWaterContains(buoy.position,VENUE,3),"full buoy radius remains in water");
    const box=new THREE.Box3().setFromObject(buoy);assert.ok(Math.abs(box.min.y-.39)<.001);
    buoy.traverse(object=>{if(object.isMesh)assert.equal(object.castShadow,false)});
  }
}
console.log("Apex Harbor maritime assets passed");
