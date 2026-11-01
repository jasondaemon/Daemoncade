import assert from "node:assert/strict";
import {ROUTE_PATH,routeGuides} from "./track-model.js";

const guides=routeGuides(27);
assert.ok(guides.length>=20,"route needs frequent visible arrows");
for(const guide of guides){
  const a=ROUTE_PATH[guide.segment],b=ROUTE_PATH[guide.segment+1],length=Math.hypot(b.x-a.x,b.z-a.z);
  const tangent={x:(b.x-a.x)/length,z:(b.z-a.z)/length};
  // Three.js rotates a +X ground arrow with rotation.y = -heading.
  const renderedForward={x:Math.cos(-guide.heading),z:-Math.sin(-guide.heading)};
  const dot=renderedForward.x*tangent.x+renderedForward.z*tangent.z;
  assert.ok(dot>.999999,`arrow ${JSON.stringify(guide)} points against route tangent ${dot}`);
}
console.log("Apex Run route guidance tangents passed",JSON.stringify({points:ROUTE_PATH.length,guides:guides.length}));
