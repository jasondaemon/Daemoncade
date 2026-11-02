import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const game=await readFile(new URL("game.js",import.meta.url),"utf8");
const html=await readFile(new URL("index.html",import.meta.url),"utf8");

assert.match(game,/if\(race\.state==="ready"\)\{persistQualityAndReload\(next\);return\}/);
assert.match(game,/localStorage\.setItem\("apex-run:quality:v1",next\).*location\.reload\(\)/);
assert.match(game,/function cancelQualityChange\(\)\{closeQualityConfirm\(\);\$\("pause-quality"\)\.value=qualityProfile\.id/);
assert.match(game,/if\(!\$\("quality-confirm"\)\.hidden\).*event\.code==="Escape".*cancelQualityChange\(\)/);
assert.doesNotMatch(game,/\bconfirm\(/);
assert.match(html,/id="quality-confirm" role="dialog" aria-modal="true"/);
assert.match(html,/id="quality-cancel"/);
assert.match(html,/id="quality-apply"/);
assert.doesNotMatch(game,/function setQuality\(event\)\{quality=resolveQuality\(event\.currentTarget\.value\)\.id;applyQuality\(\)\}/);
assert.match(html,/Graphics quality reloads the game; other settings preserve this run\./);
console.log("Apex Run quality reload contract passed");
