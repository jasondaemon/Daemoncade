import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const [testPage,productionPage,runner]=await Promise.all([readFile(new URL("./test.html",import.meta.url),"utf8"),readFile(new URL("./index.html",import.meta.url),"utf8"),readFile(new URL("./test-lifecycle-ui.js",import.meta.url),"utf8")]);
assert.match(testPage,/id="run-lifecycle"/);
assert.match(testPage,/test-lifecycle-ui\.js/);
assert.doesNotMatch(productionPage,/run-lifecycle|test-lifecycle-ui/,"local lifecycle runner leaked into production entry");
assert.match(runner,/controller\.stepBatch/,"runner does not exercise the real runtime controller");
assert.match(runner,/location\.reload\(\)/,"runner does not verify a production-style reload");
assert.doesNotMatch(runner,/localStorage\.setItem|localStorage\.clear/,"runner synthesizes or destroys PB storage instead of finishing the race");
console.log("Apex Run visible test-only lifecycle runner passed");
