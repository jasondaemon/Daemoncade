import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../vendor/three/three.module.min.js";
import {PADDOCK_BUDGET,addPaddockArchitecture} from "./paddock-architecture.js";

const scene=new THREE.Scene(),group=addPaddockArchitecture(THREE,scene,{x:0,y:0,z:0,width:10},new THREE.Quaternion());
let drawMeshes=0,triangles=0;const materials=new Set();group.traverse(object=>{if(!object.isMesh)return;drawMeshes++;const count=object.geometry.index?.count??object.geometry.attributes.position.count,instances=object.isInstancedMesh?object.count:1;triangles+=count/3*instances;const list=Array.isArray(object.material)?object.material:[object.material];list.forEach(material=>materials.add(material))});
assert.equal(drawMeshes,PADDOCK_BUDGET.drawMeshes,"declared paddock draw-mesh budget does not match constructed scene content");
assert.ok(triangles<=PADDOCK_BUDGET.maxTriangles,`paddock exceeds triangle budget: ${triangles}`);
assert.equal(materials.size,PADDOCK_BUDGET.uniqueMaterials,"declared paddock material budget does not match constructed scene content");
assert.ok(PADDOCK_BUDGET.uniqueMaterials<=8,"paddock material family is no longer cohesive");
globalThis.location={search:"?track=summit-circuit"};const model=await import("./track-model.js?paddock-clearance"),start=model.ROAD_SAMPLES[model.START_SPAWN_SAMPLE_INDEX],pose=model.roadPoseNear(start),worldScene=new THREE.Scene(),worldGroup=addPaddockArchitecture(THREE,worldScene,start,pose.rotation);worldScene.updateMatrixWorld(true);let minimumClearance=Infinity,closest=null;const point=new THREE.Vector3(),worldPoint=new THREE.Vector3(),instanceMatrix=new THREE.Matrix4(),combined=new THREE.Matrix4();worldGroup.traverse(object=>{if(!object.isMesh)return;const positions=object.geometry.getAttribute("position");if(!positions)return;const instances=object.isInstancedMesh?object.count:1;for(let instance=0;instance<instances;instance++){if(object.isInstancedMesh){object.getMatrixAt(instance,instanceMatrix);combined.multiplyMatrices(object.matrixWorld,instanceMatrix)}else combined.copy(object.matrixWorld);for(let vertex=0;vertex<positions.count;vertex++){point.fromBufferAttribute(positions,vertex);worldPoint.copy(point).applyMatrix4(combined);for(const sample of model.ROAD_SAMPLES.slice(0,260)){const clearance=Math.hypot(worldPoint.x-sample.x,worldPoint.y-sample.y,worldPoint.z-sample.z)-sample.width/2;if(clearance<minimumClearance){minimumClearance=clearance;closest={object:object.type,instance,vertex,point:worldPoint.toArray(),sample:[sample.x,sample.y,sample.z],width:sample.width}}}}}});assert.ok(minimumClearance>=7.5,`constructed paddock envelope crowds curved road: ${minimumClearance.toFixed(2)}m ${JSON.stringify(closest)}`);
const source=fs.readFileSync(new URL("./paddock-architecture.js",import.meta.url),"utf8");
assert.match(source,/recessed garage rhythm/);
assert.match(source,/ExtrudeGeometry/,"architecture should retain rounded/beveled silhouettes");
assert.doesNotMatch(source,/pitsGarage|pitsOffice|grandStandCovered/,"authored paddock must not depend on low-poly kit hero assets");
console.log("Apex Run authored paddock architecture budget passed",{...PADDOCK_BUDGET,triangles,minimumClearance:+minimumClearance.toFixed(2)});
