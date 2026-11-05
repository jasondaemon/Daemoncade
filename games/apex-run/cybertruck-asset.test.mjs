import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../vendor/three/three.module.min.js";
import {GLTFLoader} from "../vendor/three/addons/loaders/GLTFLoader.js";
import {RACE_WHEEL_TARGETS,createRaceCarVisual} from "./car-visual-adapter.js";

const url=new URL("./assets/tesla-cybertruck.glb",import.meta.url),bytes=fs.readFileSync(url);
assert.ok(bytes.length<450_000,"Cybertruck runtime asset lost its lightweight budget");
const jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString("utf8").trim());
assert.equal(gltf.asset.extras?.license,"CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)");
assert.equal(gltf.asset.extras?.author,"Lexyc16 (https://sketchfab.com/Lexyc16)");
assert.equal(gltf.meshes.reduce((sum,mesh)=>sum+mesh.primitives.length,0),14);
assert.match(fs.readFileSync(new URL("./assets/TESLA-CYBERTRUCK-NOTICE.md",import.meta.url),"utf8"),/Lexyc16[\s\S]*CC BY 4\.0/);

globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),source=await new Promise((resolve,reject)=>new GLTFLoader().parse(buffer,"",result=>resolve(result.scene),reject));
const sourceWheels=["Circle002_9","Circle001_8","Circle003_10","Circle_7"].map(name=>source.getObjectByName(name));
assert.ok(sourceWheels.every(Boolean),"original four Cybertruck wheel pivots were not retained");
assert.equal(new Set(sourceWheels.map(node=>node.uuid)).size,4,"Cybertruck wheels do not have independent pivots");
const visual=createRaceCarVisual({THREE,sourceScene:source,palette:{primary:"#8e9da3",secondary:"#17242a",accent:"#bff7ff"},profile:"cybertruck"});
assert.deepEqual(visual.wheels.map(wheel=>wheel.name),["Circle002_9","Circle001_8","Circle003_10","Circle_7"]);
for(let index=0;index<4;index++)visual.setWheelState(index,{steering:index<2?.22:0,rotation:.7,suspensionOffset:0});
visual.model.updateMatrixWorld(true);
for(let index=0;index<4;index++){
  const center=new THREE.Box3().setFromObject(visual.wheels[index].root).getCenter(new THREE.Vector3()),target=RACE_WHEEL_TARGETS[index];
  assert.ok(Math.abs(center.x-target.x)<.1&&Math.abs(center.y-target.y)<.08&&Math.abs(center.z-target.z)<.1,`Cybertruck wheel ${index} misses the physical axle`);
  assert.equal(visual.wheels[index].roll.rotation.x,.7);
}
assert.equal(visual.wheels[0].root.rotation.y,.22,"front Cybertruck wheels do not steer independently");
assert.equal(visual.wheels[2].root.rotation.y,0,"rear Cybertruck wheels should not steer");
const front=visual.wheels[0].center.clone().applyAxisAngle(new THREE.Vector3(0,1,0),visual.model.rotation.y),rear=visual.wheels[2].center.clone().applyAxisAngle(new THREE.Vector3(0,1,0),visual.model.rotation.y);
assert.ok(front.x>rear.x,"Cybertruck nose is reversed in race space");
assert.ok(visual.metrics.drawMeshes<=16,"Cybertruck exceeds its race draw budget");
visual.dispose();
console.log("Apex Run Cybertruck asset passed",{bytes:bytes.length,drawMeshes:visual.metrics.drawMeshes});
