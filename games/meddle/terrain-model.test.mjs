import assert from "node:assert/strict";
import { applyTerrainShapePlan, maximumNeighborDelta, normalizePopulousTerrain, populousTerrainShapePlan } from "./terrain-model.mjs";

const flat = Array.from({ length: 9 }, () => Array(9).fill(0));
let terrain = flat;
for (let step = 0; step < 4; step += 1) terrain = applyTerrainShapePlan(terrain, populousTerrainShapePlan(terrain, { x: 4, y: 4 }, 1));
assert.equal(terrain[4][4], 4, "four raises create a four-level summit");
assert.equal(terrain[3][3], 3, "diagonal neighbors are raised recursively with cardinal neighbors");
assert.equal(terrain[2][2], 2, "recursive shaping propagates beyond the first ring");
assert.equal(maximumNeighborDelta(terrain), 1, "every cardinal and diagonal neighbor remains within one level");

let lowered = terrain;
for (let step = 0; step < 3; step += 1) lowered = applyTerrainShapePlan(lowered, populousTerrainShapePlan(lowered, { x: 4, y: 4 }, -1));
assert.equal(lowered[4][4], 1, "lowering reverses the selected point");
assert.equal(maximumNeighborDelta(lowered), 1, "lowering recursively preserves the same eight-neighbor invariant");

const ridge = Array.from({ length: 7 }, () => Array(7).fill(5));
const pitPlan = populousTerrainShapePlan(ridge, { x: 3, y: 3 }, -1);
assert.deepEqual(pitPlan.map(({x,y,to})=>({x,y,to})), [{x:3,y:3,to:4}], "one lowering step does not disturb already-valid neighbors");
assert.deepEqual(populousTerrainShapePlan(flat, { x: 4, y: 4 }, -1), [], "sea-floor limit is a no-op");
assert.deepEqual(populousTerrainShapePlan(Array.from({length:3},()=>Array(3).fill(7)), {x:1,y:1}, 1), [], "height ceiling is a no-op");
const generated=[[1,1,1,1],[1,5,5,1],[1,5,5,1],[1,1,1,1]],normalized=normalizePopulousTerrain(generated);
assert.equal(maximumNeighborDelta(normalized),1,"generated terrain can be normalized to the same eight-neighbor invariant");
assert.equal(normalized[1][1],2,"normalization preserves low ground and relaxes unsupported peaks downward");

console.log("Meddle Populous terrain prototype: recursive eight-neighbor shaping OK");
