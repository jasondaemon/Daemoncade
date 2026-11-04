import assert from "node:assert/strict";

globalThis.location={search:"?track=skyline-gauntlet"};
const model=await import("./track-model.js?skyline-track-test");
const catalog=await import("./track-catalog.js");

assert.equal(model.ACTIVE_TRACK_ID,"skyline-gauntlet");
assert.equal(catalog.resolveTrack("skyline-gauntlet").status,"playable");
assert.equal(model.CHECKPOINTS.length,8);
assert.equal(model.RECOVERY_SPOTS.length,8);
assert.equal(model.SURFACE_GAPS.length,3);
assert.equal(new Set(model.SURFACE_GAPS.map(gap=>gap.id)).size,3);

let length=0;
for(let index=1;index<model.ROAD_SAMPLES.length;index++){
  const a=model.ROAD_SAMPLES[index-1],b=model.ROAD_SAMPLES[index];
  const step=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  length+=step;
  assert.ok(step<3.01,`disconnected road tessellation at ${index}: ${step}`);
}
const loop=model.ROAD_SAMPLES.filter(sample=>sample.phase==="loop");
assert.ok(length>3300,"course is not long-form");
assert.ok(loop.length>200,"vertical loop is undersampled");
assert.ok(loop.some(sample=>sample.up.y<-.98),"loop never becomes genuinely inverted");
assert.ok(Math.max(...model.ROAD_SAMPLES.map(sample=>sample.y))>52,"elevated shelf identity is missing");

for(const gap of model.SURFACE_GAPS){
  assert.ok(gap.end-gap.start>=9,"jump gap is only decorative");
  const takeoff=model.ROAD_SAMPLES[gap.start-1],landing=model.ROAD_SAMPLES[gap.end+1];
  assert.ok(Math.hypot(landing.x-takeoff.x,landing.z-takeoff.z)>14,"jump lacks meaningful air distance");
  const collider=model.buildRoadColliderMesh();
  const stride=5;let bridged=false;
  for(let offset=0;offset<collider.indices.length;offset+=3){const rows=[0,1,2].map(index=>Math.floor(collider.indices[offset+index]/stride));if(rows.includes(gap.start)&&rows.includes(gap.start+1)){bridged=true;break}}
  assert.equal(bridged,false,"surface gap remains physically bridged");
}
for(const [index,checkpoint] of model.CHECKPOINTS.entries()){
  assert.equal(model.checkpointAdvance(index,{x:checkpoint.x,y:checkpoint.y+1.5,z:checkpoint.z}),index+1);
}
const finish=model.CHECKPOINTS.at(-1),finishSample=model.ROAD_SAMPLES.at(-1);
assert.ok(Math.hypot(finish.x-finishSample.x,finish.y-finishSample.y,finish.z-finishSample.z)<.01,"finish is not on the loop exit");
console.log("Skyline Gauntlet topology",{meters:+length.toFixed(1),samples:model.ROAD_SAMPLES.length,jumps:model.SURFACE_GAPS.length,loopSamples:loop.length,maxY:+Math.max(...model.ROAD_SAMPLES.map(sample=>sample.y)).toFixed(1)});
