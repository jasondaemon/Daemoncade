import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addHarborCoastalDistricts,coastalDistrictSpecs,FERRY_LAYOUT,shorelinePoint} from "./harbor-coastal-districts.js";

globalThis.location={search:"?track=harbor-run"};
const {ROAD_SAMPLES}=await import("./track-model.js?coastal=harbor");
const bounds=part=>({left:part.x-part.width/2,right:part.x+part.width/2,near:part.z-part.depth/2,far:part.z+part.depth/2});
const overlaps=(a,b)=>{const aa=bounds(a),bb=bounds(b);return aa.left<=bb.right&&aa.right>=bb.left&&aa.near<=bb.far&&aa.far>=bb.near};
assert.ok(overlaps(FERRY_LAYOUT.apron,FERRY_LAYOUT.terminal),"apron joins terminal");
assert.ok(overlaps(FERRY_LAYOUT.apron,FERRY_LAYOUT.pier),"apron joins pier");
assert.ok(overlaps(FERRY_LAYOUT.apron,FERRY_LAYOUT.causeway),"apron joins causeway");

for(const quality of ["low","medium","high"]){
  const specs=coastalDistrictSpecs(quality);
  assert.equal(specs.length,quality==="low"?2:3);
  assert.equal(new Set(specs.map(spec=>spec.kind)).size,specs.length);
  for(const spec of specs)assert.deepEqual({x:spec.x,z:spec.z,rotation:spec.rotation},shorelinePoint(spec.angle,spec.outset));
  const scene=new THREE.Scene(),built=addHarborCoastalDistricts(THREE,scene,quality);
  scene.updateMatrixWorld(true);
  assert.equal(built.groups.length,specs.length);
  assert.ok(built.drawCalls<=18,`${quality} batched calls ${built.drawCalls}`);
  let minimum=Infinity,waterParts=0,casters=0,lowestWater=Infinity;
  const point=new THREE.Vector3();
  for(const group of built.groups)group.traverse(object=>{
    if(!object.isMesh)return;
    if(object.userData.waterStructure)waterParts++;
    if(object.castShadow)casters++;
    const position=object.geometry.getAttribute("position");
    for(let index=0;index<position.count;index++){
      point.fromBufferAttribute(position,index).applyMatrix4(object.matrixWorld);
      if(object.userData.waterStructure)lowestWater=Math.min(lowestWater,point.y);
      for(const sample of ROAD_SAMPLES)minimum=Math.min(minimum,Math.hypot(point.x-sample.x,point.z-sample.z)-sample.width/2);
    }
  });
  assert.ok(minimum>=10,`${quality} coastal clearance ${minimum}`);
  assert.ok(waterParts>=2);
  assert.ok(lowestWater<=FERRY_LAYOUT.seabedY+.4,`${quality} piles reach seabed ${lowestWater}`);
  assert.equal(casters>0,quality==="high",`${quality} shadow policy`);
}
console.log("Apex Harbor coastal districts passed");
