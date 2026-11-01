import assert from "node:assert/strict";
import {CHECKPOINTS,RECOVERY_SPOTS,ROUTE_PATH,TRACK_BOXES,buildRoadMesh,isOnRoad} from "./track-model.js";
const road=buildRoadMesh(22),{samples,positions,indices}=road;
assert.equal(TRACK_BOXES.filter(box=>box.surface!=="grass").length,0,"road collision must not fall back to hidden boxes");
assert.ok(samples.length>200&&indices.length>2000,"road ribbon resolution is too low");
const elevations=samples.map(sample=>sample.y),banks=samples.map(sample=>Math.abs(sample.left.y-sample.right.y));
assert.ok(Math.max(...elevations)-Math.min(...elevations)>18,"course needs genuine hills and jump elevation");
assert.ok(Math.max(...banks)>3,"course needs visible banked corners");
for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];assert.ok(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)<15,`road seam too large at ${i}`)}
for(let i=0;i<indices.length;i+=3){const ia=indices[i]*3,ib=indices[i+1]*3,ic=indices[i+2]*3,ab=[positions[ib]-positions[ia],positions[ib+1]-positions[ia+1],positions[ib+2]-positions[ia+2]],ac=[positions[ic]-positions[ia],positions[ic+1]-positions[ia+1],positions[ic+2]-positions[ia+2]],area=Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]);assert.ok(area>.0001,`degenerate road triangle ${i/3}`)}
for(const [index,spot] of RECOVERY_SPOTS.entries())assert.ok(isOnRoad(spot),`recovery ${index} is off spline road`);
for(const [index,gate] of CHECKPOINTS.entries())assert.ok(isOnRoad(gate),`gate ${index} is off spline road`);
assert.equal(ROUTE_PATH.length,12);
console.log("Apex Run spline geometry passed",JSON.stringify({samples:samples.length,triangles:indices.length/3,elevation:[+Math.min(...elevations).toFixed(1),+Math.max(...elevations).toFixed(1)],maxBankRise:+Math.max(...banks).toFixed(1)}));
