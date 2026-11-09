import assert from "node:assert/strict";
import {rotateSlopeClass,terrainFaceDepth,terrainFaceMaterialCounts,terrainFacePlane,terrainMaterialFaces,terrainSlopeClass,terrainUvAt} from "./terrain-face-renderer.mjs";

const tile=heights=>[{x:0,y:0,h:heights[0]},{x:1,y:0,h:heights[1]},{x:1,y:1,h:heights[2]},{x:0,y:1,h:heights[3]}];
const flatSea=terrainMaterialFaces(tile([0,1,1,0]),1.4);assert.deepEqual(terrainFaceMaterialCounts(flatSea),{water:1});assert.ok(flatSea[0].points.every(point=>point.h===1.4));
const coast=terrainMaterialFaces(tile([1,2,2,1]),1.4),coastCounts=terrainFaceMaterialCounts(coast);assert.ok(coastCounts.water>=1);assert.ok(coastCounts.bank>=1);assert.ok(coast.some(face=>face.coverage==="coast"),"coastal land uses an authored bank face");assert.ok(!coast.some(face=>face.material==="earth"),"coasts are not sliced into bare-earth contour bands");
const hill=terrainMaterialFaces(tile([2,3,3,2]),1.4);assert.equal(hill.length,4,"a dry tile retains the original four geometric faces");assert.ok(hill.some(face=>face.coverage.startsWith("slope-")));assert.ok(!hill.some(face=>face.material==="earth"),"dry slopes are not cut into earth contour loops");
assert.equal(terrainSlopeClass([{x:0,y:0,h:0},{x:1,y:0,h:1},{x:.5,y:.5,h:.5}]),"east");
assert.equal(terrainSlopeClass([{x:0,y:0,h:1},{x:1,y:0,h:0},{x:.5,y:.5,h:.5}]),"west");
assert.equal(rotateSlopeClass("north",1),"east");assert.equal(rotateSlopeClass("north",4),"north");assert.equal(rotateSlopeClass("west",-1),"south");
const area=points=>Math.abs(points.reduce((sum,point,index)=>{const next=points[(index+1)%points.length];return sum+point.x*next.y-next.x*point.y;},0))/2;
for(const heights of [[2,2,2,2],[2,3,3,2],[1,2,3,2],[1,2,2,1]]){const faces=terrainMaterialFaces(tile(heights),1.4),total=faces.reduce((sum,face)=>sum+area(face.points),0);assert.ok(Math.abs(total-1)<1e-9,`faces partition tile area for ${heights}`);assert.ok(faces.every(face=>area(face.points)>.0001),"clipping emits no zero-area slivers");}
const plane=terrainFacePlane([{x:2,y:3,h:7},{x:3,y:3,h:9},{x:2,y:4,h:10}]);assert.ok(plane);assert.equal(plane.gx,2);assert.equal(plane.gy,3);assert.equal(plane.heightAt(2.5,3.5),9.5);
const shared={x:5.25,y:8.5,h:2};assert.deepEqual(terrainUvAt(shared,4),{u:1.3125,v:2.125},"shared world points have face-independent UV phase");
for(const face of [...coast,...hill])for(const point of face.points)assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.h));
const rotate=(x,y)=>({x,y});assert.ok(terrainFaceDepth({points:[{x:2,y:2,h:1},{x:3,y:2,h:1},{x:2,y:3,h:1}]},rotate)>terrainFaceDepth({points:[{x:0,y:0,h:1},{x:1,y:0,h:1},{x:0,y:1,h:1}]},rotate));
console.log("Meddle slope-oriented face coverage and depth ordering: OK");
