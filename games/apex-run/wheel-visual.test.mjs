import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {makeWheelVisual,setWheelVisualPose} from "./wheel-visual.js";

const visual=makeWheelVisual(THREE,new THREE.MeshBasicMaterial(),new THREE.MeshBasicMaterial());
const chassis=new THREE.Quaternion().setFromEuler(new THREE.Euler(.18,-.42,.13));
const position=new THREE.Vector3(4,2,-7),localAxle=new THREE.Vector3(0,0,1);
for(const steering of[-.4,-.12,0,.16,.43]){
  let expected;
  for(const roll of[-18,-3.2,0,.7,8.4,51]){
    setWheelVisualPose(THREE,visual,position,chassis,steering,roll);
    visual.root.updateMatrixWorld(true);
    const axle=localAxle.clone().transformDirection(visual.roll.matrixWorld);
    expected??=axle.clone();
    assert.ok(axle.distanceTo(expected)<1e-10,`roll ${roll} moved axle at steering ${steering}`);
    assert.ok(visual.root.position.distanceTo(position)<1e-10);
  }
}
setWheelVisualPose(THREE,visual,position,chassis,-.35,0);visual.root.updateMatrixWorld(true);const left=localAxle.clone().transformDirection(visual.roll.matrixWorld);
setWheelVisualPose(THREE,visual,position,chassis,.35,0);visual.root.updateMatrixWorld(true);const right=localAxle.clone().transformDirection(visual.roll.matrixWorld);
assert.ok(left.distanceTo(right)>.4,"steering must rotate the front axle");
console.log("Apex Run wheel visual axle invariance passed");
