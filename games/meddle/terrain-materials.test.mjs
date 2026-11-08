import assert from "node:assert/strict";
import { upperTerrainPolygon } from "./terrain-materials.mjs";

const flat = [{x:0,y:0,h:2},{x:1,y:0,h:2},{x:1,y:1,h:2},{x:0,y:1,h:2}];
assert.deepEqual(upperTerrainPolygon(flat), flat, "flat plots keep their full surface material");
const ramp = [{x:0,y:0,h:3},{x:1,y:0,h:3},{x:1,y:1,h:1},{x:0,y:1,h:1}];
assert.deepEqual(upperTerrainPolygon(ramp), [{x:0,y:0,h:3},{x:1,y:0,h:3},{x:1,y:.5,h:2},{x:0,y:.5,h:2}], "a slope exposes its lower half while retaining the upper material");
const rotatedRamp = [{x:0,y:1,h:1},{x:0,y:0,h:3},{x:1,y:0,h:3},{x:1,y:1,h:1}];
assert.deepEqual(upperTerrainPolygon(rotatedRamp), [{x:0,y:.5,h:2},{x:0,y:0,h:3},{x:1,y:0,h:3},{x:1,y:.5,h:2}], "splitting follows world heights rather than screen direction");
assert.deepEqual(upperTerrainPolygon([{x:0,y:0,h:0},{x:1,y:0,h:Number.NaN},{x:0,y:1,h:1}]), [], "invalid faces fail closed");
console.log("Meddle terrain material splitting: OK");
