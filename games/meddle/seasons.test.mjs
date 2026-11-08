import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isSeason, resolveSeason, sceneryCell, seasonForSeed, SEASON_NAMES, winterSnowMaskAlpha, winterTerrainMaterial } from "./seasons.mjs";

const gameScript = readFileSync(new URL("./game.js", import.meta.url), "utf8");
const pngSize = name => {
  const bytes = readFileSync(new URL(`./assets/${name}`, import.meta.url));
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

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
assert.equal(winterTerrainMaterial(4, 7, 3, 1, 1.4, 42).kind, "earth", "winter slopes retain exposed earth");
assert.equal(winterTerrainMaterial(4, 7, 3, 0, 1.4, 42).kind, "ground", "flat winter land retains a ground material beneath snow");
assert.deepEqual(winterTerrainMaterial(4, 7, 3, 0, 1.4, 42), winterTerrainMaterial(4, 7, 3, 0, 1.4, 42), "winter cover is deterministic");
assert.ok(Math.abs(winterSnowMaskAlpha(0,0)-winterSnowMaskAlpha(1,1))<1e-9, "snow mask is seamless at world-space pattern edges");
assert.ok(Math.abs(winterSnowMaskAlpha(.41,.61)-winterSnowMaskAlpha(.411,.611))<.08, "snow coverage changes continuously");
for (let stage=1;stage<=4;stage++) for (let orientation=0;orientation<2;orientation++) {
  assert.deepEqual(pngSize(`building-${stage}-${orientation}-winter.png`), pngSize(`building-${stage}-${orientation}.png`), `winter stage ${stage}, orientation ${orientation} preserves its exact sprite canvas and anchor geometry`);
}
assert.match(gameScript, /season==="winter"\?winterBuildingSprites/, "winter settlements use dedicated snow artwork");
assert.match(gameScript, /group\.name==="BEACON"[^}]+strokeText\(group\.name,labelX,labelY\)/, "beacon edge label has a dark contrast outline");
console.log("Meddle seasonal visuals: OK");
