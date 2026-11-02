import assert from "node:assert/strict";
globalThis.location={search:"?track=summit-circuit"};
const model=await import("./track-model.js?summit-air-gap");
const gap=model.SURFACE_GAPS[0],collider=model.buildRoadColliderMesh(),visual=model.buildRoadMesh(),lane=model.buildLaneRibbon(),gapCenter=model.ROAD_SAMPLES[Math.round((gap.start+gap.end)/2)];
assert.ok(gap&&gap.end-gap.start>=10,"reservoir jump is not a meaningful air gap");
const crosses=(indices,stride)=>{for(let index=0;index<indices.length;index+=3){const samples=[indices[index],indices[index+1],indices[index+2]].map(vertex=>Math.floor(vertex/stride));if(samples.some(sample=>sample>gap.start&&sample<gap.end))return true}return false};
assert.equal(crosses(collider.indices,5),false,"physical collider secretly bridges the reservoir");
assert.equal(crosses(visual.indices,8),false,"rendered deck secretly bridges the reservoir");
assert.equal(crosses(lane.indices,2),false,"lane stripe floats over the reservoir");
assert.equal(model.isOnRoad({x:gapCenter.x,y:gapCenter.y,z:gapCenter.z}),false,"missing deck is still classified as road");
for(const side of["left","right"]){const rail=model.buildRailColliderMesh(undefined,undefined,model.STUNT_RAIL_GAPS),stride=2,sideOffset=side==="left"?0:model.ROAD_SAMPLES.length*2;for(let index=0;index<rail.indices.length;index+=3){const samples=[rail.indices[index],rail.indices[index+1],rail.indices[index+2]].filter(vertex=>vertex>=sideOffset&&vertex<sideOffset+model.ROAD_SAMPLES.length*2).map(vertex=>Math.floor((vertex-sideOffset)/stride));assert.equal(samples.some(sample=>sample>gap.start&&sample<gap.end),false,`${side} rail bridges the reservoir`)}}
const recovery=model.RECOVERY_SPOTS[2],takeoff=model.ROAD_SAMPLES[gap.start],runup=Math.hypot(recovery.x-takeoff.x,recovery.y-takeoff.y,recovery.z-takeoff.z);assert.ok(runup>350,`preceding recovery has only ${runup.toFixed(1)} m of run-up`);
const widths=model.ROAD_SAMPLES.slice(10,1700).filter(sample=>!sample.stunt).map(sample=>sample.width);assert.ok(Math.min(...widths)<=20&&Math.max(...widths)<=30,"Summit was not narrowed from the old forty-metre ribbon");
console.log("Summit reservoir air gap",{samples:gap.end-gap.start+1,runup:+runup.toFixed(1),widthRange:[Math.min(...widths),Math.max(...widths)]});
