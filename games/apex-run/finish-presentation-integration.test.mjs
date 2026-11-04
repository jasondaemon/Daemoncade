import assert from "node:assert/strict";
import fs from "node:fs";
import {CHECKPOINTS} from "./track-model.js";
import {buildFinishRunoffSamples} from "./finish-presentation.js";

const game=fs.readFileSync(new URL("./game.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("./index.html",import.meta.url),"utf8");
const testPage=fs.readFileSync(new URL("./test.html",import.meta.url),"utf8");
assert.match(game,/finish-presentation\.js\?v=0\.5\.0-alpha102/);
assert.match(index,/game\.js\?v=0\.5\.0-alpha102/);
assert.match(testPage,/game\.js\?v=0\.5\.0-alpha102/);
assert.match(game,/ribbonUV\(runoffSurface\.positions\)/,"runoff UV count must follow the actual collider/render vertices");
assert.match(game,/race\.state==="finished"&&finishPresentation\.active/,"finished physics coast must continue after timing stops");
assert.match(game,/finishView\?finishCameraPosition\.clone\(\)/,"finished view must use the stationary line camera");
assert.match(game,/finishPresentation\.showResult&&\$\("result"\)\.hidden/,"result card must be delayed until after the car crosses the line");
const runoff=buildFinishRunoffSamples(CHECKPOINTS.at(-1));
assert.ok(runoff.length>=20);
assert.ok(runoff.every((sample,index)=>!index||Math.hypot(sample.x-runoff[index-1].x,sample.y-runoff[index-1].y,sample.z-runoff[index-1].z)<=4.01));
console.log("Apex Run finish presentation integration passed");
