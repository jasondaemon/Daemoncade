import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const game=await readFile(new URL("game.js",import.meta.url),"utf8");
const html=await readFile(new URL("index.html",import.meta.url),"utf8");

assert.match(game,/Changing graphics quality reloads Apex Run and abandons the current run/);
assert.match(game,/if\(race\.state==="ready"\)\{apply\(\);return\}/);
assert.match(game,/localStorage\.setItem\("apex-run:quality:v1",next\).*location\.reload\(\)/);
assert.match(game,/select\.value=qualityProfile\.id/);
assert.doesNotMatch(game,/function setQuality\(event\)\{quality=resolveQuality\(event\.currentTarget\.value\)\.id;applyQuality\(\)\}/);
assert.match(html,/Graphics quality reloads the game; other settings preserve this run\./);
console.log("Apex Run quality reload contract passed");
