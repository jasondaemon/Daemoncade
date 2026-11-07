import assert from "node:assert/strict";
import { currentApproximationSupport, experimentalCropOwnership, experimentalSupport, fixtureMap, SOURCE_CHECK_LIFE_OFFSETS, sourceLikeLifeScore, sourceLikePaintFarmland, sourceLikeStencilCount, sourceStencilSiteClear } from "./support-prototype.mjs";

const settlement = (id, faction, x, y, level = 1) => ({ id, faction, x, y, level });
const sorted = offsets => offsets.map(([x, y]) => `${x},${y}`).sort();
const expectedStencil = [[0,0],[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1],[0,-2],[2,0],[0,2],[-2,0],[2,-2],[2,2],[-2,2],[-2,-2]];
assert.deepEqual(sorted(SOURCE_CHECK_LIFE_OFFSETS), sorted(expectedStencil), "literal 17-offset source set is exact");
assert.ok(SOURCE_CHECK_LIFE_OFFSETS.some(([x, y]) => x === 1 && y === -1), "+1,-1 is retained");
assert.ok(!SOURCE_CHECK_LIFE_OFFSETS.some(([x, y]) => x === -1 && y === -2), "the 25th offset is excluded");
for (const [x, y] of SOURCE_CHECK_LIFE_OFFSETS) {
  assert.ok(SOURCE_CHECK_LIFE_OFFSETS.some(([rx, ry]) => rx === -x && ry === y), "horizontal symmetry");
  assert.ok(SOURCE_CHECK_LIFE_OFFSETS.some(([rx, ry]) => rx === x && ry === -y), "vertical symmetry");
  assert.ok(SOURCE_CHECK_LIFE_OFFSETS.some(([rx, ry]) => rx === y && ry === x), "axis-exchange symmetry");
}

{
  const map = fixtureMap(), home = settlement(1, "player", 7, 7, 4), fields = sourceLikePaintFarmland(map, [home]);
  assert.equal(sourceLikeLifeScore(map, home, fields), 3050, "17 accepted source cells trigger the special castle score");
  map.trees = new Set(["7,6"]);
  assert.equal(sourceLikeLifeScore(map, home, fields), 3050, "tree overlays do not alter the terrain score");
  map.rocks = new Set(["5,5"]);
  assert.equal(sourceLikeLifeScore(map, home, fields), 275, "rock block 47 applies the source's fifteen-point penalty");
  const hostileCenter = new Map(fields); hostileCenter.set("7,7", "rival");
  assert.equal(sourceLikeLifeScore(map, home, hostileCenter), 0, "an invalid central field zeroes settlement life");
}

{
  const map = fixtureMap(), first = settlement(1, "player", 7, 7, 2), ally = settlement(2, "player", 9, 7, 2), rival = settlement(3, "rival", 9, 7, 2);
  const alliedFields = sourceLikePaintFarmland(map, [first, ally]);
  assert.equal(sourceLikeStencilCount(map, first, alliedFields), 17, "same-faction farmland remains valid across the fixed stencil");
  const hostileFields = sourceLikePaintFarmland(map, [first, rival]);
  assert.ok(sourceLikeStencilCount(map, rival, hostileFields) < 17, "previously painted hostile farmland is not valid support");
  map.obstacles.add("7,6");
  assert.equal(sourceLikeStencilCount(map, first, alliedFields), 17, "tree/rock overlays are not subtracted by the source-like check_life translation");
  const reversedFields = sourceLikePaintFarmland(map, [rival, first]);
  assert.notEqual(sourceLikeStencilCount(map, first, hostileFields), sourceLikeStencilCount(map, first, reversedFields), "source-like faction painting preserves founding chronology rather than inventing ID arbitration");
}

{
  const map = fixtureMap(), home = settlement(1, "player", 7, 7, 4);
  assert.deepEqual(experimentalSupport(map, home, [home]), { foundationCells: 9, cropCells: 16, total: 25 }, "foundation and crops remain distinct");
  map.obstacles.add("5,5");
  assert.equal(currentApproximationSupport(map, home), 25, "current approximation counts a blocked field");
  assert.equal(experimentalSupport(map, home, [home]).total, 24, "obstacle removes support");
  map.obstacles.delete("5,5");
  assert.equal(experimentalSupport(map, home, [home]).total, 25, "clearing restores support");
}

{
  const map = fixtureMap(), home = settlement(1, "player", 7, 7, 1);
  for (let y = 5; y <= 9; y += 1) map.obstacles.add(`6,${y}`);
  assert.equal(experimentalSupport(map, home, [home]).total, 15, "disconnected fields beyond a wall do not count");
}

{
  const map = fixtureMap(5, 5), edge = settlement(1, "player", 0, 0, 1);
  assert.equal(experimentalSupport(map, edge, [edge]).total, 9, "edge clipping is bounded");
}

{
  const map = fixtureMap(), first = settlement(11, "player", 5, 7, 2), second = settlement(22, "rival", 8, 7, 2);
  const result = list => { const crops = experimentalCropOwnership(map, list); return list.map(home => experimentalSupport(map, home, list, crops).total); };
  const forward = result([first, second]), reverse = result([second, first]).reverse();
  assert.deepEqual(forward, reverse, "insertion order does not alter results");
  assert.deepEqual(result([{ ...first, id: 22 }, { ...second, id: 11 }]), forward, "IDs do not arbitrate ownership");
  assert.equal(forward[0], forward[1], "equal rivals remain symmetric");
}

{
  const existing = settlement(1, "player", 7, 7, 1);
  assert.equal(sourceStencilSiteClear(settlement(2, "player", 9, 7, 1), [existing]), false, "source stencil rejects distance two");
  assert.equal(sourceStencilSiteClear(settlement(2, "player", 10, 7, 1), [existing]), true, "beyond the stencil is clear");
}

console.log("Meddle isolated field prototype: OK");
