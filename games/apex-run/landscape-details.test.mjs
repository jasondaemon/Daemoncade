import assert from "node:assert/strict";
import {landscapePlacements,macroTerrainPlacements} from "./landscape-details.js";
import {readFile} from "node:fs/promises";
globalThis.location={search:"?track=summit-circuit"};
const {ROAD_SAMPLES}=await import("./track-model.js?landscape-test");

const tiers={high:94,medium:63,low:31};
for(const [quality,expected] of Object.entries(tiers)){
  const placements=landscapePlacements(ROAD_SAMPLES,quality);
  assert.equal(placements.length,expected,`${quality} landscape count`);
  assert.ok(placements.every(item=>item.y===.35&&item.clearance>=12),`${quality} full bounds must be grounded and clear`);
  assert.ok(new Set(placements.map(item=>item.scale)).size>=6,`${quality} landscape scale variation`);
  assert.ok(new Set(placements.map(item=>item.variant)).size===2,`${quality} model variation`);
  const quarters=[0,1,2,3].map(quarter=>placements.filter(item=>item.quarter===quarter).length);
  assert.ok(Math.min(...quarters)>=Math.floor(expected/4)-1&&Math.max(...quarters)-Math.min(...quarters)<=2,`${quality} quarter distribution`);
  assert.ok(new Set(placements.map(item=>item.rotation.toFixed(2))).size>=expected*.9,`${quality} rotation variation`);
  const terrain=macroTerrainPlacements(ROAD_SAMPLES,quality),terrainExpected=quality==="high"?12:quality==="medium"?8:4;
  assert.equal(terrain.length,terrainExpected,`${quality} macro terrain count`);
  assert.deepEqual([0,1,2,3].map(quarter=>terrain.filter(item=>item.quarter===quarter).length),Array(4).fill(terrainExpected/4),`${quality} macro terrain quarter coverage`);
  assert.ok(terrain.every(item=>item.clearance>=20&&item.height<=8.25&&item.y+item.height<9),`${quality} terrain remains clear and below elevated road`);
}
const game=await readFile(new URL("game.js",import.meta.url),"utf8");
assert.match(game,/const grassMetres=1\.4/);
assert.match(game,/VENUE\.halfX\*2\/grassMetres,VENUE\.halfZ\*2\/grassMetres/);
assert.match(game,/VENUE\.basinRadius\/VENUE\.halfX/);
console.log("Apex Run CC0 landscape placements passed",tiers);
