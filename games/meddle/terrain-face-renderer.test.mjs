import assert from "node:assert/strict";
import {terrainFaceDepth,terrainFaceMaterialCounts,terrainMaterialFaces} from "./terrain-face-renderer.mjs";

const tile=heights=>[{x:0,y:0,h:heights[0]},{x:1,y:0,h:heights[1]},{x:1,y:1,h:heights[2]},{x:0,y:1,h:heights[3]}];
const flatSea=terrainMaterialFaces(tile([0,1,1,0]),1.4);assert.deepEqual(terrainFaceMaterialCounts(flatSea),{water:1});assert.ok(flatSea[0].points.every(point=>point.h===1.4));
const coast=terrainMaterialFaces(tile([1,2,2,1]),1.4),coastCounts=terrainFaceMaterialCounts(coast);for(const material of ["water","earth","bank","cover"])assert.ok(coastCounts[material]>=1,`coast emits ${material} geometry`);
const hill=terrainMaterialFaces(tile([2,3,3,2]),1.4),hillCounts=terrainFaceMaterialCounts(hill);for(const material of ["earth","bank","cover"])assert.ok(hillCounts[material]>=1,`slope emits ${material} geometry`);
for(const face of [...coast,...hill])for(const point of face.points)assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.h));
const rotate=(x,y)=>({x,y});assert.ok(terrainFaceDepth({points:[{x:2,y:2,h:1},{x:3,y:2,h:1},{x:2,y:3,h:1}]},rotate)>terrainFaceDepth({points:[{x:0,y:0,h:1},{x:1,y:0,h:1},{x:0,y:1,h:1}]},rotate));
console.log("Meddle face-aware terrain bands and depth ordering: OK");
