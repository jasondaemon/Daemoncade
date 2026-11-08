import assert from "node:assert/strict";
import { isSeason, resolveSeason, sceneryCell, seasonForSeed, SEASON_NAMES } from "./seasons.mjs";

assert.deepEqual(SEASON_NAMES, ["spring", "fall", "winter"]);
assert.equal(isSeason("winter"), true);
assert.equal(isSeason("summer"), false);
for (const seed of [1, 7, 42, 987654321]) {
  assert.equal(seasonForSeed(seed), seasonForSeed(seed), `seed ${seed} keeps its season`);
  assert.ok(SEASON_NAMES.includes(seasonForSeed(seed)));
}
assert.equal(new Set(Array.from({ length: 30 }, (_, seed) => seasonForSeed(seed + 1))).size, 3, "ordinary new-game seeds cover all seasons");
assert.equal(resolveSeason("fall", 42), "fall", "resume preserves the saved season");
assert.equal(resolveSeason("invalid", 42), seasonForSeed(42), "legacy saves derive a stable season from their seed");
assert.equal(resolveSeason("fall", 42, "winter"), "winter", "QA query override is deterministic");
assert.deepEqual(sceneryCell(1600, 800, "tree", 2), { sx: 800, sy: 0, sw: 400, sh: 400 });
assert.deepEqual(sceneryCell(1600, 800, "rock", 5), { sx: 400, sy: 400, sw: 400, sh: 400 });
console.log("Meddle seasonal visuals: OK");
