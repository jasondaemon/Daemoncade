import assert from "node:assert/strict";
import { meshMaterialCounts, terrainMeshFaces } from "./terrain-mesh.mjs";

const square=(heights)=>[{x:0,y:0,h:heights[0]},{x:1,y:0,h:heights[1]},{x:1,y:1,h:heights[2]},{x:0,y:1,h:heights[3]}];
const sea=terrainMeshFaces(square([0,1,1,0]),1.4);
assert.equal(sea.length,1,"fully submerged tiles become one continuous sea face");
assert.equal(sea[0].material,"water");
assert.ok(sea[0].points.every(point=>point.h===1.4),"every sea corner shares one flat water elevation");
const coast=terrainMeshFaces(square([1,2,3,2]),1.4),coastCounts=meshMaterialCounts(coast);
assert.ok(coastCounts.earth>=1,"coastal faces expose earth at the waterline");
assert.ok(coastCounts.land>=1,"the upper bank retains surface cover");
assert.ok(coastCounts.water>=1,"a mixed shore includes a clipped water surface rather than an open or submerged triangle");
assert.ok(coast.filter(face=>face.material==="water").every(face=>face.points.every(point=>point.h===1.4)),"every mixed-shore water vertex stays on the common sea plane");
assert.ok(coast.filter(face=>face.material!=="water").flatMap(face=>face.points).some(point=>point.h===1.4),"the earth bank meets the water at an interpolated shoreline");
const hill=terrainMeshFaces(square([2,4,3,3]),1.4);
assert.equal(hill.length,4,"dry terrain uses a stable four-face shape");
assert.ok(hill.some(face=>face.light!==hill[0].light),"opposed faces receive distinct material lighting without outlines");
console.log("Meddle terrain mesh: flat sea and deterministic four-face material bank OK");
