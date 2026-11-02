import assert from "node:assert/strict";
import {QUALITY_PROFILES,resolveQuality,shadowPlacement} from "./graphics-quality.js";

assert.deepEqual(Object.keys(QUALITY_PROFILES),["high","medium","low"]);
assert.equal(resolveQuality("unknown"),QUALITY_PROFILES.high);
assert.ok(QUALITY_PROFILES.high.shadowMap>QUALITY_PROFILES.medium.shadowMap);
assert.ok(QUALITY_PROFILES.medium.shadowMap>QUALITY_PROFILES.low.shadowMap);
assert.ok(QUALITY_PROFILES.high.sceneryRatio>QUALITY_PROFILES.medium.sceneryRatio);
assert.ok(QUALITY_PROFILES.medium.sceneryRatio>QUALITY_PROFILES.low.sceneryRatio);
for(const profile of Object.values(QUALITY_PROFILES)){
  const a=shadowPlacement({x:410,y:31,z:-280},profile);
  assert.ok(Math.abs(a.lightSpace.right/a.texel-Math.round(a.lightSpace.right/a.texel))<1e-8,"shadow right axis is not texel-snapped");
  assert.ok(Math.abs(a.lightSpace.up/a.texel-Math.round(a.lightSpace.up/a.texel))<1e-8,"shadow up axis is not texel-snapped");
  const direction={x:a.light.x-a.target.x,y:a.light.y-a.target.y,z:a.light.z-a.target.z};
  assert.deepEqual(direction,{x:-60,y:110,z:35},"player following changed the world sun direction");
  assert.ok(a.texel<.56,"local car shadow is no sharper than the old giant map");
}
console.log("Apex Run graphics quality profiles",JSON.stringify(QUALITY_PROFILES));
