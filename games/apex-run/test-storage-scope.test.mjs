import assert from "node:assert/strict";

globalThis.location={search:"?track=summit-circuit&testStorage=run-isolated-1234"};
globalThis.document={documentElement:{dataset:{apexTest:"1"}}};
const isolated=await import("./simulation.js?isolated-storage-test");
assert.equal(isolated.BEST_KEY,"apex-run:test:summit-circuit:run-isolated-1234:pb");
assert.equal(isolated.REPLAY_KEY,"apex-run:test:summit-circuit:run-isolated-1234:replay");
globalThis.document={documentElement:{dataset:{}}};
const production=await import("./simulation.js?production-storage-test");
assert.equal(production.BEST_KEY,"apex-run:track:summit-circuit:pb:v6","production accepted a test storage query");
assert.equal(production.REPLAY_KEY,"apex-run:track:summit-circuit:replay:v7","production accepted a test storage query");
delete globalThis.location;delete globalThis.document;
console.log("Apex Run test-only storage scope passed");
