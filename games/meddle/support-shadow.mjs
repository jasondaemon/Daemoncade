import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { SETTLEMENT_STAGES, seededRandom, settlementStageForSupport } from "./rules.mjs";
import { buildingCells, currentApproximationSupport, experimentalCropOwnership, experimentalSupport, fieldCells, fixtureMap, sourceLikeLifeScore, sourceLikePaintFarmland, sourceLikeStencilCount } from "./support-prototype.mjs";

const fixtureUrl = new URL("./support-shadow-fixtures.json", import.meta.url);
const key = (x, y) => `${x},${y}`;
const clone = value => JSON.parse(JSON.stringify(value));

export async function readShadowFixtures(url = fixtureUrl) {
  return clone(JSON.parse(await readFile(fileURLToPath(url), "utf8")));
}

function seededCells(fixture, count, random, reserved, pool) {
  const cells = new Set();
  for (let attempts = 0; cells.size < count && attempts < count * 100; attempts += 1) {
    const candidate = pool[Math.floor(random() * pool.length)], x = candidate.x, y = candidate.y, cellKey = key(x, y);
    if (!reserved.has(cellKey)) cells.add(cellKey);
  }
  return cells;
}

export function materializeShadowFixture(serialized) {
  const fixture = clone(serialized), map = fixtureMap(fixture.width, fixture.height), random = seededRandom(fixture.seed);
  const pool = [...new Map(fixture.settlements.flatMap(fieldCells).filter(cell => cell.x >= 0 && cell.y >= 0 && cell.x < fixture.width && cell.y < fixture.height).map(cell => [key(cell.x, cell.y), cell])).values()];
  const centers = new Set(fixture.settlements.map(home => key(home.x, home.y)));
  const foundations = new Set(fixture.settlements.flatMap(buildingCells).map(cell => key(cell.x, cell.y)));
  for (const cellKey of seededCells(fixture, fixture.terrainDamage, random, centers, pool)) map.flat.delete(cellKey);
  map.obstacles = seededCells(fixture, fixture.obstacleCount, random, foundations, pool);
  map.rocks = new Set([...map.obstacles].filter((_, index) => index % 2 === 0));
  map.trees = new Set([...map.obstacles].filter((_, index) => index % 2 === 1));
  return { fixture, map };
}

const estimate = (home, support) => {
  const stage = settlementStageForSupport(support), cap = stage.cap;
  return { support, stage: stage.name, level: stage.level, estimatedDisplaced: Math.max(0, home.pop - cap) };
};

export function compareShadowFixture(serialized) {
  const { fixture, map } = materializeShadowFixture(serialized), crops = experimentalCropOwnership(map, fixture.settlements), sourceFarmland = sourceLikePaintFarmland(map, fixture.settlements);
  const settlements = fixture.settlements.map(home => {
    const current = estimate(home, currentApproximationSupport(map, home));
    const experimentalDetail = experimentalSupport(map, home, fixture.settlements, crops);
    const experimental = { ...estimate(home, experimentalDetail.total), ...experimentalDetail };
    const sourceLike = { stencilUsableDiagnostic: sourceLikeStencilCount(map, home, sourceFarmland), lifeScore: sourceLikeLifeScore(map, home, sourceFarmland), stageNotEstimated: true, overlayConflictChecksOmitted: true };
    return { id: home.id, faction: home.faction, existingStage: SETTLEMENT_STAGES[home.level].name, population: home.pop, current, sourceLike, experimental, supportDelta: experimental.support - current.support, largeDelta: Math.abs(experimental.support - current.support) >= 5 };
  });
  const equalPeers = [];
  for (let left = 0; left < settlements.length; left += 1) for (let right = left + 1; right < settlements.length; right += 1) {
    const a = fixture.settlements[left], b = fixture.settlements[right];
    if (a.level === b.level && a.pop === b.pop) equalPeers.push({ ids: [a.id, b.id], experimentalDifference: Math.abs(settlements[left].experimental.support - settlements[right].experimental.support) });
  }
  return { name: fixture.name, seed: fixture.seed, settlements, asymmetry: equalPeers.filter(pair => pair.experimentalDifference > 0) };
}

export async function runShadowSuite() {
  const serializedFixtures = await readShadowFixtures(), before = JSON.stringify(serializedFixtures), start = performance.now();
  const results = serializedFixtures.map(compareShadowFixture), durationMs = performance.now() - start;
  if (JSON.stringify(serializedFixtures) !== before) throw new Error("shadow fixtures were mutated");
  return {
    facts: ["this source is the 1993 Amiga v2.7 rerelease", "check_life reads a fixed 17-cell stencil", "farmland is faction-coded", "set_town paints neutral flat cells: 17 normally or 25 for castles", "check_life uses weighted scoring with zero-reset and rock penalties", "tree overlays are not directly rejected by its terrain checks", "existing-building support and new-site search use different paths"],
    experiments: ["contiguous-only support", "obstacles reduce support", "neutral equal hostile claims", "larger-stage claim priority", "distance claim priority", "Meddle stage mapping and displacement estimates"],
    fixtureCount: results.length,
    settlementCount: results.reduce((sum, result) => sum + result.settlements.length, 0),
    durationMs,
    largeDeltaCount: results.flatMap(result => result.settlements).filter(home => home.largeDelta).length,
    asymmetryCount: results.reduce((sum, result) => sum + result.asymmetry.length, 0),
    results,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await runShadowSuite(), null, 2));
