import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addHarborServiceDistrict,harborServicePose} from "./harbor-service-district.js";

globalThis.location={search:"?track=harbor-run"};
const {ROAD_SAMPLES}=await import("./track-model.js?service=90");
function source(){const root=new THREE.Group();for(const[name,w,h]of[["dado_garage_door_01",4,4],["dado_garage_centered_01",4,4],["window_centered_medium_03",4,2],["cornice03_standard_standard_01",5,1]]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,.4),new THREE.MeshStandardMaterial());mesh.name=name;mesh.position.y=h/2;root.add(mesh)}return root}
assert.equal(addHarborServiceDistrict(THREE,new THREE.Scene(),source(),ROAD_SAMPLES,"medium"),null);
const scene=new THREE.Scene(),group=addHarborServiceDistrict(THREE,scene,source(),ROAD_SAMPLES,"high"),pose=harborServicePose(ROAD_SAMPLES);scene.updateMatrixWorld(true);
assert.equal(group.userData.pose.sampleIndex,2200);assert.equal(group.userData.license,"CC0 factory modules");assert.ok(group.children.length>=17);
let clearance=Infinity;const point=new THREE.Vector3();group.traverse(object=>{if(!object.isMesh)return;const box=new THREE.Box3().setFromObject(object);for(const corner of[[box.min.x,box.min.y,box.min.z],[box.min.x,box.min.y,box.max.z],[box.max.x,box.max.y,box.min.z],[box.max.x,box.max.y,box.max.z]]){point.set(...corner);for(const sample of ROAD_SAMPLES)clearance=Math.min(clearance,Math.hypot(point.x-sample.x,point.y-sample.y,point.z-sample.z)-sample.width/2)}});
assert.ok(clearance>=10,`service district full geometry clearance ${clearance}`);assert.ok(Math.hypot(group.position.x-ROAD_SAMPLES[pose.sampleIndex].x,group.position.z-ROAD_SAMPLES[pose.sampleIndex].z)>40);
console.log("Apex Harbor service district passed",{clearance});
