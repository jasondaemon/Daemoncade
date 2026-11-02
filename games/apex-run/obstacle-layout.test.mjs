import assert from "node:assert/strict";
globalThis.location={search:"?track=summit-circuit"};
const {CHECKPOINTS,INTENTIONAL_OBSTACLES,ROAD_SAMPLES}=await import("./track-model.js");

const islands=INTENTIONAL_OBSTACLES.filter(obstacle=>obstacle.profile==="island");
assert.equal(islands.length,2,"paddock should have two readable alternating traffic islands");
for(const island of islands){
  const road=ROAD_SAMPLES[island.sampleIndex],dx=island.x-road.x,dy=island.y-island.height/2-road.y,dz=island.z-road.z,lx=road.left.x-road.right.x,ly=road.left.y-road.right.y,lz=road.left.z-road.right.z,ll=Math.hypot(lx,ly,lz);
  const lateral=(dx*lx+dy*ly+dz*lz)/ll;
  const openLane=road.width/2+Math.abs(lateral)-island.radius;
  assert.ok(island.height<=.8,"paddock island regressed into a support-column silhouette");
  assert.ok(openLane>=5.5,`traffic island leaves only ${openLane.toFixed(2)}m for the intended Formula-car line`);
  for(const gate of CHECKPOINTS){
    const distance=Math.hypot(island.x-gate.x,island.y-gate.y,island.z-gate.z);
    assert.ok(distance>28,`traffic island entered checkpoint/recovery clearance at ${distance.toFixed(2)}m`);
  }
}
assert.ok(INTENTIONAL_OBSTACLES.filter(obstacle=>obstacle.profile==="column").every(obstacle=>obstacle.branchId==="inside-line"),"tall columns must remain confined to the explicitly risky branch");
console.log("Summit readable obstacle corridors passed",islands.map(({id,height,radius})=>({id,height,radius})));
