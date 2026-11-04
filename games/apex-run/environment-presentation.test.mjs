import assert from "node:assert/strict";
import {WORLD_SUN_DIRECTION,alpineMassSpecs,alpineMountainGeometry,environmentBudget,environmentPalette,mountainGeometry,ridgeComposition} from "./environment-presentation.js";
import * as THREE from "../vendor/three/three.module.min.js";
assert.deepEqual(environmentBudget("low"),{layers:1,segments:56,rings:4});
assert.deepEqual(environmentBudget("medium"),{layers:2,segments:88,rings:4});
assert.deepEqual(environmentBudget("high"),{layers:2,segments:128,rings:5});
assert.notEqual(environmentPalette("harbor-run").top,environmentPalette("summit-circuit").top);assert.ok(environmentPalette("harbor-run").fogDensity>environmentPalette("summit-circuit").fogDensity);
assert.deepEqual(WORLD_SUN_DIRECTION,{x:-60,y:110,z:35},"visible sun must stay aligned with the shadow-casting light");
assert.deepEqual(ridgeComposition("alpine-sprint").map(({scale,height})=>[scale,height]),[[1.82,46],[2.42,72]]);
assert.ok(ridgeComposition("alpine-sprint")[0].scale>1.75,"the Alpine foreground ridge must leave breathing room around the venue");
const geometry=mountainGeometry(THREE,{radiusX:100,radiusZ:80,segments:32,rings:5,height:25,seed:2});
assert.equal(geometry.getAttribute("position").count,160);
assert.equal(geometry.index.count,32*4*6);
const positions=geometry.getAttribute("position");
for(let index=0;index<32;index++){assert.equal(positions.getY(index),-12);assert.equal(positions.getY(128+index),-12)}
assert.ok(Array.from({length:32},(_,index)=>positions.getY(64+index)).some(y=>y>10),"middle ridge must rise gradually above buried skirts");
assert.ok(Array.from({length:32},(_,index)=>positions.getY(64+index)).every(y=>y>5),"shared Harbor/Summit ring geometry must retain its established continuous profile");
const venue={centerX:0,centerZ:-20,halfX:220,halfZ:220};
for(const [quality,count,lobes,triangles] of [["low",3,5,480],["medium",4,8,1536],["high",5,10,3200]]){
  const alpine=alpineMountainGeometry(THREE,venue,quality),specs=alpineMassSpecs(quality),position=alpine.getAttribute("position");
  assert.equal(alpine.userData.massCount,count);assert.equal(alpine.userData.lobeCount,lobes);assert.equal(specs.length,count);
  assert.equal(alpine.index.count/3,triangles,`${quality} Alpine horizon triangle budget drifted`);
  assert.ok(specs.every(spec=>Math.hypot(spec.x,spec.z)>1.5),`${quality} Alpine masses must remain beyond the venue`);
  assert.ok(Math.max(...Array.from({length:position.count},(_,index)=>position.getY(index)))>=42,`${quality} Alpine silhouette lost readable peaks`);
  assert.ok(Math.min(...Array.from({length:position.count},(_,index)=>position.getY(index)))===-5,`${quality} Alpine masses lost buried skirts`);
}
console.log("Apex Run environment presentation budgets passed");
