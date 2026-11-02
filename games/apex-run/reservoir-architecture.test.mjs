import assert from "node:assert/strict";
import {reservoirLayout} from "./reservoir-architecture.js";

const terrain=.35,start={x:-338.03,y:39.91,z:222.47},end={x:-352.55,y:39.46,z:204.44},layout=reservoirLayout(start,end,terrain);
assert.ok(layout.bankBottom<=terrain,"reservoir embankment does not connect to terrain");
assert.ok(layout.bankTop<layout.waterY&&layout.waterY-layout.bankTop<.3,"water is not contained by the authored bank top");
assert.ok(layout.topRadius-layout.waterRadius>=8,"shoreline is too thin to cover the water perimeter from oblique views");
assert.ok(layout.bottomRadius>layout.topRadius+20,"embankment does not visibly support the elevated reservoir");
assert.ok(layout.wallHeight>=4,"retaining wall is too shallow to read from the airborne approach");
console.log("Summit grounded reservoir layout passed",layout);
