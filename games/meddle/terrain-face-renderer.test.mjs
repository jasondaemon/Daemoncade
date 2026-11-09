import assert from "node:assert/strict";
import {terrainFaceDepth,terrainFaceMaterialCounts,terrainMaterialFaces,terrainSlopeClass} from "./terrain-face-renderer.mjs";

const tile=heights=>[{x:0,y:0,h:heights[0]},{x:1,y:0,h:heights[1]},{x:1,y:1,h:heights[2]},{x:0,y:1,h:heights[3]}];
const flatSea=terrainMaterialFaces(tile([0,1,1,0]),1.4);assert.deepEqual(terrainFaceMaterialCounts(flatSea),{water:1});assert.ok(flatSea[0].points.every(point=>point.h===1.4));
const coast=terrainMaterialFaces(tile([1,2,2,1]),1.4),coastCounts=terrainFaceMaterialCounts(coast);assert.ok(coastCounts.water>=1);assert.ok(coastCounts.bank>=1);assert.ok(coast.some(face=>face.coverage==="coast"),"coastal land uses an authored bank face");assert.ok(!coast.some(face=>face.material==="earth"),"coasts are not sliced into bare-earth contour bands");
const hill=terrainMaterialFaces(tile([2,3,3,2]),1.4);assert.equal(hill.length,4,"a dry tile retains the original four geometric faces");assert.ok(hill.some(face=>face.coverage.startsWith("slope-")));assert.ok(!hill.some(face=>face.material==="earth"),"dry slopes are not cut into earth contour loops");
assert.equal(terrainSlopeClass([{x:0,y:0,h:0},{x:1,y:0,h:1},{x:.5,y:.5,h:.5}]),"east");
assert.equal(terrainSlopeClass([{x:0,y:0,h:1},{x:1,y:0,h:0},{x:.5,y:.5,h:.5}]),"west");
for(const face of [...coast,...hill])for(const point of face.points)assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.h));
const rotate=(x,y)=>({x,y});assert.ok(terrainFaceDepth({points:[{x:2,y:2,h:1},{x:3,y:2,h:1},{x:2,y:3,h:1}]},rotate)>terrainFaceDepth({points:[{x:0,y:0,h:1},{x:1,y:0,h:1},{x:0,y:1,h:1}]},rotate));
console.log("Meddle slope-oriented face coverage and depth ordering: OK");
