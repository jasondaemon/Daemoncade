import assert from "node:assert/strict";
import {roadMeshUV,ribbonUV} from "./road-uv.js";

const samples=[
  {x:0,y:0,z:0,width:14},
  {x:3,y:4,z:0,width:21},
  {x:9,y:4,z:0,width:14},
];
const uv=roadMeshUV(samples);
assert.equal(uv.length,samples.length*8*2,"road UV cardinality must exactly match eight vertices per sample");
assert.ok(Math.abs(uv[16]-5/7)<1e-6,"UV progression must use 3D physical arc length");
assert.equal(uv[19],3,"road width must map continuously across the surface");
for(const value of uv)assert.ok(Number.isFinite(value));

const ribbon=[0,0,0,7,0,0, 0,0,7,14,0,7, 0,3,14,7,3,14];
const junctionUV=ribbonUV(ribbon);
assert.equal(junctionUV.length,ribbon.length/3*2,"junction UV cardinality must match its top-only vertex pairs");
assert.ok(Math.abs(junctionUV[4]-Math.hypot(3.5,7)/7)<1e-6,"junction progression must use midpoint arc length");
assert.equal(junctionUV[7],2,"junction width must be physically scaled");
assert.doesNotThrow(()=>roadMeshUV(samples),"UV generation must not depend on successful map loading");
globalThis.location={search:"?track=summit-circuit"};
const track=await import("./track-model.js?road-uv-coverage");
const main=track.buildRoadMesh();
assert.equal(roadMeshUV(main.samples).length,main.positions.length/3*2,"main road UVs must cover every rendered vertex");
for(const branch of track.BRANCH_ROADS)assert.equal(roadMeshUV(branch.surfaceSamples).length,branch.mesh.positions.length/3*2,"branch UVs must cover every rendered vertex");
for(const junction of track.BRANCH_JUNCTIONS)assert.equal(ribbonUV(junction.positions).length,junction.positions.length/3*2,"junction UVs must cover every rendered vertex");
console.log("Apex Run road UV coverage passed");
