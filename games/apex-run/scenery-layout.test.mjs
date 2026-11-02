import assert from "node:assert/strict";
import fs from "node:fs";
import {gantryLayout} from "./scenery-layout.js";

for(const width of[10,14,24,30]){
  const layout=gantryLayout(width);
  assert.ok(layout.innerHalf>=width/2+1.15,`gantry post intrudes into the ${width}m road clearance`);
  assert.ok(layout.height>=6,"gantry lacks Formula-car and chase-camera clearance");
}
const source=fs.readFileSync(new URL("./game.js",import.meta.url),"utf8");
assert.doesNotMatch(source,/overheadRound/,"the low-poly outer-bound-fitted arch must not return over the road");
assert.match(source,/group\.quaternion\.set\(pose\.rotation\.x,pose\.rotation\.y,pose\.rotation\.z,pose\.rotation\.w\)/,"gantry must follow the complete banked road frame");
console.log("Apex Run gantry aperture and road-frame checks passed");
