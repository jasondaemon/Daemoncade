import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../vendor/three/three.module.min.js";
import {GLTFLoader} from "../vendor/three/addons/loaders/GLTFLoader.js";
import {carById} from "./car-catalog.js";
import {createRaceCarVisual} from "./car-visual-adapter.js";

const url=new URL("./assets/tesla-cybertruck.glb",import.meta.url),bytes=fs.readFileSync(url);
assert.ok(bytes.length<450_000,"Cybertruck runtime asset lost its lightweight budget");
const jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString("utf8").trim());
assert.equal(gltf.asset.extras?.license,"CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)");
assert.equal(gltf.asset.extras?.author,"Lexyc16 (https://sketchfab.com/Lexyc16)");
assert.equal(gltf.meshes.reduce((sum,mesh)=>sum+mesh.primitives.length,0),14);
const notice=fs.readFileSync(new URL("./assets/TESLA-CYBERTRUCK-NOTICE.md",import.meta.url),"utf8"),catalogSource=carById("cybertruck").asset.source;
assert.match(notice,/Lexyc16[\s\S]*CC BY 4\.0/);
assert.ok(notice.includes(catalogSource),"Cybertruck catalog source drifted from its bundled attribution notice");
assert.equal(catalogSource,"https://sketchfab.com/3d-models/tesla-cybertruck-f12e67159f75486bb21213e573520612");

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
  const wheel=visual.wheels[index];
  assert.ok(wheel.root.position.distanceTo(wheel.center)<1e-9,`Cybertruck wheel ${index} left its authored wheel arch`);
  assert.equal(visual.wheels[index].roll.rotation.x,.7);
}
assert.equal(visual.wheels[0].root.rotation.y,.22,"front Cybertruck wheels do not steer independently");
assert.equal(visual.wheels[2].root.rotation.y,0,"rear Cybertruck wheels should not steer");
const front=visual.wheels[0].center.clone().applyAxisAngle(new THREE.Vector3(0,1,0),visual.model.rotation.y),rear=visual.wheels[2].center.clone().applyAxisAngle(new THREE.Vector3(0,1,0),visual.model.rotation.y);
assert.ok(front.x>rear.x,"Cybertruck nose is reversed in race space");
assert.ok(visual.metrics.drawMeshes<=16,"Cybertruck exceeds its race draw budget");
visual.dispose();
console.log("Apex Run Cybertruck asset passed",{bytes:bytes.length,drawMeshes:visual.metrics.drawMeshes});
