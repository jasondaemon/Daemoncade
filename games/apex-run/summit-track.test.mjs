import assert from "node:assert/strict";

const previous=globalThis.location;
globalThis.location={search:"?track=summit-circuit"};
const model=await import("./track-model.js?summit-circuit-test");
const catalog=await import("./track-catalog.js");
assert.equal(model.ACTIVE_TRACK_ID,"summit-circuit");
assert.equal(model.CHECKPOINTS.length,6);
assert.equal(model.RECOVERY_SPOTS.length,6);
assert.equal(catalog.trackStorageKeys("summit-circuit").pb,"apex-run:track:summit-circuit:pb:v1");
let length=0;
for(let index=1;index<model.ROAD_SAMPLES.length;index++){
  const a=model.ROAD_SAMPLES[index-1],b=model.ROAD_SAMPLES[index],gap=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  length+=gap;
  assert.ok(gap<3.01,`road tessellation gap at ${index}: ${gap}`);
}
assert.ok(length>3300&&length<3500,`Summit Circuit misses its authored advanced-course scale: ${length.toFixed(1)} m`);
assert.ok(model.ROAD_SAMPLES.some(sample=>sample.y>30),"Summit Circuit lacks a signature elevated crest");
for(const [index,checkpoint] of model.CHECKPOINTS.entries()){
  assert.equal(model.isOnRoad({...checkpoint,y:checkpoint.y+1.5}),true,`checkpoint ${index} is off its road frame`);
  assert.equal(model.checkpointAdvance(index,{x:checkpoint.x,y:checkpoint.y+1.5,z:checkpoint.z}),index+1);
}
for(const spot of model.RECOVERY_SPOTS){
  const norm=Math.hypot(spot.rotation.x,spot.rotation.y,spot.rotation.z,spot.rotation.w);
  assert.ok(Math.abs(norm-1)<1e-5,"recovery orientation is not normalized");
}
for(const support of model.buildSupportSpecs())assert.ok(Math.min(...support.cornerClearances)>=.179,"Summit support intersects the banked deck");
// Nonadjacent roads may only approach within a road-width-plus-camera corridor
// when there is a genuine grade-separated crossing with ample deck clearance.
for(let i=0;i<model.ROAD_SAMPLES.length;i+=4)for(let j=i+model.ROAD_STEPS_PER_SEGMENT*2;j<model.ROAD_SAMPLES.length;j+=4){
  const a=model.ROAD_SAMPLES[i],b=model.ROAD_SAMPLES[j],planar=Math.hypot(a.x-b.x,a.z-b.z);
  // A crossing must clear the 1.1 m lower deck, Formula body and normal chase
  // camera corridor. This is intentionally stricter than vehicle clearance.
  if(planar<45)assert.ok(Math.abs(a.y-b.y)>13.5,`nonadjacent road overlap lacks vehicle/camera clearance at ${i}/${j}`);
}
// Venue structures reserve the full road half-width plus a chase-camera and
// sightline corridor, rather than merely checking their center points.
for(const stand of model.VENUE.stands){
  let clearance=Infinity;const cosine=Math.cos(-stand.rotation),sine=Math.sin(-stand.rotation);
  for(const sample of model.ROAD_SAMPLES){const dx=sample.x-stand.x,dz=sample.z-stand.z,lx=dx*cosine-dz*sine,lz=dx*sine+dz*cosine,qx=Math.max(Math.abs(lx)-(stand.length/2+6),0),qz=Math.max(Math.abs(lz)-17,0);clearance=Math.min(clearance,Math.hypot(qx,qz))}
  assert.ok(clearance>=45,`grandstand enters road/camera corridor: ${clearance.toFixed(2)} m`);
}
console.log("Summit Circuit geometry",JSON.stringify({meters:+length.toFixed(1),samples:model.ROAD_SAMPLES.length,checkpoints:model.CHECKPOINTS.length,maxY:+Math.max(...model.ROAD_SAMPLES.map(sample=>sample.y)).toFixed(1)}));
if(previous===undefined)delete globalThis.location;else globalThis.location=previous;
