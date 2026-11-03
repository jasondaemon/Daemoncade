import assert from "node:assert/strict";
import {gateCameraOpacity,gateStructureDistance} from "./camera-gate-fade.js";

const gate={halfWidth:9.15,height:5,thickness:.38};
assert.equal(gateStructureDistance({x:0,y:5,z:0},gate),0,"top beam surface must be solid");
assert.equal(gateStructureDistance({x:0,y:2.5,z:0},gate),2.31,"open lane must measure to the beam, not a filled gate AABB");
assert.equal(gateStructureDistance({x:0,y:2.5,z:-9.15},gate),0,"posts must be solid");
assert.equal(gateCameraOpacity(2.8),0,"near-camera structure must disappear completely");
assert.equal(gateCameraOpacity(7),1,"distant gates must remain fully opaque");
let previous=0;
for(let distance=2.8;distance<=7;distance+=.02){const opacity=gateCameraOpacity(distance);assert.ok(opacity>=previous&&opacity<=1,"fade must be smooth and monotonic");previous=opacity}
assert.ok(gateCameraOpacity(4)>0&&gateCameraOpacity(4)<.5,"crossing transition must be gradual");

const crossing=[];
for(let x=12;x>=0;x-=.1)crossing.push(gateCameraOpacity(gateStructureDistance({x,y:5,z:0},gate)));
for(let x=.1;x<=12;x+=.1)crossing.push(gateCameraOpacity(gateStructureDistance({x,y:5,z:0},gate)));
assert.equal(Math.min(...crossing),0,"a camera crossing the beam volume must fully clear it");
assert.equal(crossing[0],1,"the approach must begin fully visible");
assert.equal(crossing.at(-1),1,"the departure must restore full visibility");
const maxStep=Math.max(...crossing.slice(1).map((value,index)=>Math.abs(value-crossing[index])));
assert.ok(maxStep<.04,`crossing fade jumped by ${maxStep}`);
console.log("camera gate fade tests passed");
