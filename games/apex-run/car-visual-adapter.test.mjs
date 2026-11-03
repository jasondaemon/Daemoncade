import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {createRaceCarVisual,createStaticCarVisual,inspectAuthoredCar} from "./car-visual-adapter.js";

const scene=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(2,1,4),new THREE.MeshStandardMaterial({name:"Paint 1 Apex Cyan",color:0xffffff}));body.name="Body";scene.add(body);
for(const[name,x,z]of[["WheelFrontL",-1,-1.35],["WheelFrontR",1,-1.35],["WheelRearL",-1,1.35],["WheelRearR",1,1.35]]){const group=new THREE.Group();group.name=name;group.position.set(x,-.55,z);const tire=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.3,12),new THREE.MeshStandardMaterial({name:"Tiretread"}));tire.rotation.z=Math.PI/2;group.add(tire);scene.add(group)}
const inspection=inspectAuthoredCar(scene,THREE);assert.equal(inspection.wheels.length,4);assert.ok(inspection.wheels.every(wheel=>wheel.size.every(value=>value>0)));
const visual=createRaceCarVisual({THREE,sourceScene:scene,palette:{primary:"#0794ad",secondary:"#f5c41f",accent:"#ffffff"},targetLength:4.55});assert.equal(visual.wheels.length,4);assert.ok(Math.abs(visual.metrics.targetLength-4.55)<1e-9);assert.notEqual(body.material.color.getHexString(),"0794ad","source material was mutated");
visual.setWheelState(0,{steering:.2,rotation:1.7,suspensionOffset:-.1});assert.equal(visual.wheels[0].root.rotation.y,.2);assert.equal(visual.wheels[0].roll.rotation.z,1.7);const firstCenter=visual.wheels[0].center;assert.ok(Math.abs(visual.wheels[0].root.position.y-(firstCenter.y-.1/visual.metrics.scale))<1e-9);
visual.setChassisPose(new THREE.Vector3(1,2,3),new THREE.Quaternion(0,0,0,1));assert.deepEqual(visual.root.position.toArray(),[1,2,3]);visual.dispose();
const staticScene=new THREE.Group();staticScene.add(new THREE.Mesh(new THREE.BoxGeometry(2,1,5),new THREE.MeshStandardMaterial({name:"Body_BaseColor_0",color:0xffffff})));const staticVisual=createStaticCarVisual({THREE,sourceScene:staticScene,palette:{primary:"#123456"},targetLength:5});assert.ok(Math.abs(staticVisual.metrics.scale-1)<1e-9);assert.equal(staticVisual.model.children[0].material.color.getHexString(),"123456");staticVisual.dispose();
console.log("Apex Run car visual adapter passed");
