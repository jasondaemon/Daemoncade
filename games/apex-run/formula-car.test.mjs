import assert from "node:assert/strict";
import {FORMULA_VISUAL} from "./formula-car.js";

assert.equal(FORMULA_VISUAL.frontAxle,1.55);
assert.equal(FORMULA_VISUAL.rearAxle,-1.45);
assert.equal(FORMULA_VISUAL.trackHalf,1.02);
assert.ok(FORMULA_VISUAL.frontWingX>FORMULA_VISUAL.frontAxle+.8);
assert.ok(FORMULA_VISUAL.rearWingX<FORMULA_VISUAL.rearAxle-.6);
assert.ok(FORMULA_VISUAL.width>FORMULA_VISUAL.trackHalf*2+.35);
assert.ok(FORMULA_VISUAL.height<1.5);
assert.ok(FORMULA_VISUAL.length<5.6);
console.log("Apex Run Formula visual invariants passed",FORMULA_VISUAL);
