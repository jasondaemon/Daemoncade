import assert from "node:assert/strict";
import { compareShadowFixture, materializeShadowFixture, readShadowFixtures, runShadowSuite } from "./support-shadow.mjs";

const fixtures = await readShadowFixtures();
assert.equal(fixtures.length, 6, "representative offline fixtures load");
const snapshot = JSON.stringify(fixtures);
for (const fixture of fixtures) {
  assert.deepEqual(materializeShadowFixture(fixture).fixture, fixture, "materialization uses a copy");
  const first = compareShadowFixture(fixture), second = compareShadowFixture(fixture);
  assert.deepEqual(first, second, `${fixture.name} is seed-reproducible`);
}
assert.equal(JSON.stringify(fixtures), snapshot, "comparisons never mutate serialized inputs");

const suite = await runShadowSuite();
assert.equal(suite.fixtureCount, 6);
assert.equal(suite.settlementCount, 9);
assert.ok(suite.durationMs < 100, `shadow suite remains cheap (${suite.durationMs.toFixed(2)}ms)`);
assert.ok(suite.largeDeltaCount > 0, "risky deltas are explicitly flagged");
assert.ok(suite.results.find(result => result.name === "open allied fields").settlements.every(home => home.experimental.support === 25), "allied overlap remains fully usable in this experiment");
assert.ok(suite.results.find(result => result.name === "open rival frontier").settlements.every(home => home.experimental.support < 25), "hostile overlap is visibly contested");
assert.ok(suite.results.find(result => result.name === "quake broken field").settlements[0].experimental.estimatedDisplaced > 0, "damage produces a non-applied displacement estimate");
assert.ok(suite.results.every(result => result.settlements.every(home => home.sourceLike.stageNotEstimated)), "source-like counts are not falsely mapped onto Meddle stages");
assert.ok(suite.results.every(result => result.settlements.every(home => Number.isFinite(home.sourceLike.lifeScore))), "source-like diagnostics expose weighted life scores");
assert.ok(suite.results.every(result => result.settlements.every(home => home.sourceLike.overlayConflictChecksOmitted)), "the unmodeled overlay branch is explicit");
console.log("Meddle offline support shadow: OK");
