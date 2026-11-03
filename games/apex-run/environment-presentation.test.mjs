import assert from "node:assert/strict";
import {environmentBudget,mountainGeometry} from "./environment-presentation.js";
import * as THREE from "../vendor/three/three.module.min.js";
assert.deepEqual(environmentBudget("low"),{layers:1,segments:56,rings:4,cloudPuffs:9});
assert.deepEqual(environmentBudget("medium"),{layers:2,segments:88,rings:4,cloudPuffs:12});
assert.deepEqual(environmentBudget("high"),{layers:2,segments:128,rings:5,cloudPuffs:18});
const geometry=mountainGeometry(THREE,{radiusX:100,radiusZ:80,segments:32,rings:5,height:25,seed:2});
assert.equal(geometry.getAttribute("position").count,160);
assert.equal(geometry.index.count,32*4*6);
const positions=geometry.getAttribute("position");
for(let index=0;index<32;index++){assert.equal(positions.getY(index),-12);assert.equal(positions.getY(128+index),-12)}
assert.ok(Array.from({length:32},(_,index)=>positions.getY(64+index)).some(y=>y>10),"middle ridge must rise gradually above buried skirts");
console.log("Apex Run environment presentation budgets passed");
