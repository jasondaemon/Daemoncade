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
const source=fs.readFileSync(new URL("./paddock-architecture.js",import.meta.url),"utf8");
assert.match(source,/recessed garage rhythm/);
assert.match(source,/ExtrudeGeometry/,"architecture should retain rounded/beveled silhouettes");
assert.doesNotMatch(source,/pitsGarage|pitsOffice|grandStandCovered/,"authored paddock must not depend on low-poly kit hero assets");
console.log("Apex Run authored paddock architecture budget passed",{...PADDOCK_BUDGET,triangles});
