import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const [game,lifecycle]=await Promise.all(["game.js","test-lifecycle-ui.js"].map(file=>readFile(new URL(file,import.meta.url),"utf8")));
const [testPage,skylinePage]=await Promise.all(["test.html","skyline-test.html"].map(file=>readFile(new URL(file,import.meta.url),"utf8")));
assert.match(game,/deterministicLifecyclePhase=\["run","verify"\]\.includes\(lifecyclePhase\)/,"only exact lifecycle phases may select deterministic mode");
assert.match(game,/qaDriveMode=testMode&&!deterministicLifecyclePhase&&testParams\.get\("qaDrive"\)==="1"/,"a lifecycle URL inherited from interactive QA must not start the animation-frame loop");
assert.match(game,/deterministicLifecycleMode=testMode&&garageStorage\.isIsolated&&deterministicLifecyclePhase/,"focus isolation must require the test entry, isolated storage and an exact lifecycle phase");
assert.match(lifecycle,/startIsolated\(\).*url\.searchParams\.delete\("qaDrive"\).*url\.searchParams\.set\("testStorage",token\).*url\.searchParams\.set\("lifecycle","run"\)/,"the lifecycle launcher must remove inherited interactive QA mode");
assert.match(lifecycle,/yieldLifecycle=\(\)=>globalThis\.scheduler\?\.yield\?globalThis\.scheduler\.yield\(\):Promise\.resolve\(\)/,"hidden lifecycle progress must not depend on throttled timers");
for(const page of [testPage,skylinePage])assert.match(page,/test-lifecycle-ui\.js\?v=0\.5\.0-alpha145-route-preview/,"lifecycle entry must not reuse a stale launcher");
assert.match(game,/handleVisibility\(hidden\)\{if\(hidden&&!deterministicLifecycleMode&&\["countdown","racing"\]/,"deterministic lifecycle visibility changes must not pause the synthetic race");
assert.match(game,/addEventListener\("blur",\(\)=>\{if\(!deterministicLifecycleMode&&\["countdown","racing"\]/,"deterministic lifecycle focus changes must not pause the synthetic race");
assert.match(game,/if\(frameGapInvalidates\(elapsed\)&&\["countdown","racing"\]/,"production frame-gap protection must remain enabled");
assert.match(game,/if\(!testMode\|\|interactiveTestMode\)requestAnimationFrame\(frame\)/,"deterministic lifecycle must remain outside the animation-frame loop");
console.log("Apex Run deterministic lifecycle focus isolation passed");
