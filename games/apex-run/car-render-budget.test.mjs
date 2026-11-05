import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../vendor/three/three.module.min.js";
import {GLTFLoader} from "../vendor/three/addons/loaders/GLTFLoader.js";
import {createRaceCarVisual} from "./car-visual-adapter.js";

const bytes=fs.readFileSync(new URL("./assets/car-concept-race.glb",import.meta.url));
const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length).toString("utf8").trim());
const wheelMeshes=new Set();
for(let index=0;index<gltf.nodes.length;index++)if(gltf.nodes[index].extras?.apexWheel){
  const pending=[index];
  while(pending.length){const node=gltf.nodes[pending.pop()];if(node.mesh!==undefined)wheelMeshes.add(node.mesh);pending.push(...(node.children||[]))}
}
const bodyMaterials=new Set(),wheelPrimitives=[...wheelMeshes].reduce((total,index)=>total+gltf.meshes[index].primitives.length,0);
for(let index=0;index<gltf.meshes.length;index++)if(!wheelMeshes.has(index))for(const primitive of gltf.meshes[index].primitives)bodyMaterials.add(primitive.material??-1);
const cockpitDrawMeshes=1,nonShadowMaterials=new Set([...bodyMaterials].filter(index=>/glass|headlight|brakelight|signallight/i.test(gltf.materials[index]?.name||""))),bodyDrawMeshes=bodyMaterials.size+cockpitDrawMeshes,wheelDrawMeshes=4*2,totalDrawMeshes=bodyDrawMeshes+wheelDrawMeshes,shadowDrawMeshes=bodyDrawMeshes-cockpitDrawMeshes-nonShadowMaterials.size+wheelDrawMeshes;
assert.ok(bodyDrawMeshes<=9,`GT body needs ${bodyDrawMeshes} material batches`);
assert.equal(wheelPrimitives,12,"race asset wheel primitive inventory changed");
assert.ok(totalDrawMeshes<=17,`GT race visual predicts ${totalDrawMeshes} draw meshes`);
const source=fs.readFileSync(new URL("./car-visual-adapter.js",import.meta.url),"utf8");
assert.match(source,/mergeStaticBody/);assert.match(source,/startsWith\("Tire"\)\?tires:metals/);assert.match(source,/\["Hub",metals/);
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),gltfScene=await new Promise((resolve,reject)=>new GLTFLoader().parse(buffer,"",result=>resolve(result.scene),reject)),visual=createRaceCarVisual({THREE,sourceScene:gltfScene,palette:{primary:"#0794ad",secondary:"#f5c41f",accent:"#effcfe"}});
assert.equal(visual.metrics.bodyMeshes,9);assert.equal(visual.metrics.drawMeshes,17);assert.equal(visual.model.children.filter(child=>child.isMesh&&child.castShadow).length,4,"glass, cockpit, and lamp batches should not repeat in the shadow pass");assert.ok(visual.metrics.bodyVerticalOffset<-.7,"actual GT body was not lowered onto the physical axles");assert.ok(visual.wheels.every(wheel=>wheel.roll.children.length===2),"race wheels must retain independently animated tire and hub meshes");for(let index=0;index<4;index++)visual.setWheelState(index,{steering:index<2?.18:0,rotation:Math.PI/3});visual.model.updateMatrixWorld(true);for(const wheel of visual.wheels){const wheelBounds=new THREE.Box3().setFromObject(wheel.root),wheelSize=wheelBounds.getSize(new THREE.Vector3());assert.ok(wheel.root.parent===visual.model,`${wheel.name} is detached from the race model`);assert.ok(wheelSize.x>.18&&wheelSize.y>.25&&wheelSize.z>.18,`${wheel.name} is not visibly sized in race space`);assert.ok(wheel.root.position.distanceTo(wheel.center)<1e-9,`${wheel.name} left its authored wheel arch`)}const frontX=visual.wheels[0].center.clone().applyAxisAngle(new THREE.Vector3(0,1,0),visual.model.rotation.y).x,rearX=visual.wheels[2].center.clone().applyAxisAngle(new THREE.Vector3(0,1,0),visual.model.rotation.y).x;assert.ok(frontX>rearX,"race visual nose is reversed relative to vehicle forward");assert.deepEqual(visual.wheels.map(wheel=>wheel.name),["WheelFrontR","WheelFrontL","WheelRearR","WheelRearL"],"race wheels were not remapped after model rotation");assert.equal(visual.wheels[0].root.rotation.y,.18);assert.equal(visual.wheels[0].roll.rotation.x,Math.PI/3);visual.dispose();
console.log("Apex Run GT race draw budget",{bodyDrawMeshes,wheelDrawMeshes,totalDrawMeshes,shadowDrawMeshes,colorPlusShadowPasses:totalDrawMeshes+shadowDrawMeshes});
