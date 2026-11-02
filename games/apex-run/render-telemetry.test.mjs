import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const root=new URL("./",import.meta.url);
const [game,testEntry,productionEntry,recorder]=await Promise.all([
  readFile(new URL("game.js",root),"utf8"),
  readFile(new URL("test.html",root),"utf8"),
  readFile(new URL("index.html",root),"utf8"),
  readFile(new URL("render-telemetry.js",root),"utf8")
]);

assert.match(testEntry,/data-apex-test="1"/,"integration entry must retain its explicit test marker");
assert.doesNotMatch(productionEntry,/data-apex-test|renderTelemetry|render-telemetry/,"production entry exposed render telemetry");
assert.match(game,/testParams=new URLSearchParams\(location\.search\).*renderTelemetryMode=testMode&&testParams\.get\("renderTelemetry"\)==="1"/,"render telemetry is not doubly gated by test entry and explicit query opt-in");
assert.match(game,/if\(renderTelemetryMode\).*import\("\.\/render-telemetry\.js/,"recorder is not dynamically isolated from normal production");
assert.doesNotMatch(game,/__apexRenderTelemetry|renderTelemetry\.report/,"recorder report leaked onto a production global");
assert.match(recorder,/actual requestAnimationFrame render poses; local test page only/,"recorder output does not identify its bounded source");
assert.doesNotMatch(recorder,/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/,"local recorder contains a network transmission path");
console.log("Apex Run render telemetry isolation passed");
