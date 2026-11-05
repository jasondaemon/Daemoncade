import assert from "node:assert/strict";
globalThis.location={search:"?track=skyline-gauntlet"};
const[{skylineJumpIdentitySpecs},{ROAD_SAMPLES,SURFACE_GAPS}]=await Promise.all([import("./skyline-jump-identity.js"),import("./track-model.js")]);
const specs=skylineJumpIdentitySpecs(ROAD_SAMPLES,SURFACE_GAPS);
assert.equal(specs.jumps.length,3);assert.equal(specs.markings.length,54);assert.equal(specs.pylons.length,6);assert.equal(specs.drawCalls,2);
assert.deepEqual(specs.jumps.map(jump=>jump.palette),["glacier","solar","magenta"]);
for(const [jumpIndex,gap] of SURFACE_GAPS.entries()){
  const jump=specs.jumps[jumpIndex];assert.ok(jump.approach.every(index=>index<gap.start));assert.ok(jump.landing.every(index=>index>gap.end));assert.ok(jump.landingGate>gap.end&&jump.landingGate<=gap.end+18,"landing pylons must be visible at touchdown rather than hidden beyond the crest");
  const markers=specs.markings.filter(marker=>marker.gapId===gap.id);assert.ok(markers.filter(marker=>marker.zone==="approach").every(marker=>marker.index<gap.start));assert.ok(markers.filter(marker=>marker.zone==="landing").every(marker=>marker.index>gap.end));assert.ok(markers.every(marker=>marker.lift>=.075&&marker.height<=.035),"surface identity must sit above the road without a coplanar face");
  const brackets=markers.filter(marker=>marker.kind==="landing-bracket");assert.equal(brackets.length,12,"each landing edge follows the road with six short segments");assert.ok(brackets.every(marker=>marker.length<5.2),"landing edge identity must not bridge a crest with a long tangent strip");for(const marker of brackets){const sample=ROAD_SAMPLES[marker.index],clearance=(marker.x-sample.x)*marker.up.x+(marker.y-sample.y)*marker.up.y+(marker.z-sample.z)*marker.up.z;assert.ok(Math.abs(clearance-marker.lift)<1e-6,"landing edge identity must be lifted from its own road sample")}
}
console.log("Skyline jump identity passed",{jumps:specs.jumps.map(jump=>({id:jump.id,palette:jump.palette,gate:jump.landingGate})),drawCalls:specs.drawCalls});
