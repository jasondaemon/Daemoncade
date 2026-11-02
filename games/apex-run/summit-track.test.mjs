import assert from "node:assert/strict";

const previous=globalThis.location;
globalThis.location={search:"?track=summit-circuit"};
const model=await import("./track-model.js?summit-circuit-test");
const catalog=await import("./track-catalog.js");
const graphics=await import("./graphics-quality.js");
assert.equal(model.ACTIVE_TRACK_ID,"summit-circuit");
assert.equal(model.CHECKPOINTS.length,7);
assert.equal(model.RECOVERY_SPOTS.length,7);
assert.equal(catalog.trackStorageKeys("summit-circuit").pb,"apex-run:track:summit-circuit:pb:v7");
let length=0;
for(let index=1;index<model.ROAD_SAMPLES.length;index++){
  const a=model.ROAD_SAMPLES[index-1],b=model.ROAD_SAMPLES[index],gap=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  length+=gap;
  assert.ok(gap<3.01,`road tessellation gap at ${index}: ${gap}`);
}
assert.ok(length>4100&&length<4300,`Summit Circuit misses its authored advanced-course scale: ${length.toFixed(1)} m`);
assert.ok(model.ROAD_SAMPLES.some(sample=>sample.phase==="loop"&&sample.up.y<-.98),"Summit Circuit lacks a genuinely inverted road section");
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
for(const profile of Object.values(graphics.QUALITY_PROFILES))for(const sample of model.ROAD_SAMPLES.filter((_,index)=>index%40===0)){const placement=graphics.shadowPlacement(sample,profile),relative={x:sample.x-placement.target.x,y:sample.y-placement.target.y,z:sample.z-placement.target.z},right=Math.abs(relative.x*placement.basis.right.x+relative.y*placement.basis.right.y+relative.z*placement.basis.right.z),up=Math.abs(relative.x*placement.basis.up.x+relative.y*placement.basis.up.y+relative.z*placement.basis.up.z);assert.ok(right<=placement.texel*.51&&up<=placement.texel*.51,`${profile.id} shadow anchor lost the local car/road at ${sample.x}/${sample.z}`)}
// Nonadjacent roads may only approach within a road-width-plus-camera corridor
// when there is a genuine grade-separated crossing with ample deck clearance.
let minimumCrossingClearance=Infinity;
for(let i=0;i<model.ROAD_SAMPLES.length;i+=4)for(let j=i+model.ROAD_STEPS_PER_SEGMENT*2;j<model.ROAD_SAMPLES.length;j+=4){
  const a=model.ROAD_SAMPLES[i],b=model.ROAD_SAMPLES[j],planar=Math.hypot(a.x-b.x,a.z-b.z);
  if(planar<45&&!a.stunt&&!b.stunt){const upper=a.y>=b.y?a:b,lower=upper===a?b:a,upperUnderside=Math.min(upper.left.y,upper.right.y)-1.1,lowerRailTop=Math.max(lower.left.y,lower.right.y)+model.RAIL_PROFILE.height,clearance=upperUnderside-lowerRailTop;minimumCrossingClearance=Math.min(minimumCrossingClearance,clearance);assert.ok(clearance>8,`banked deck/rail crossing lacks full vehicle/camera clearance at ${i}/${j}: ${clearance}`)}
}
let minimumFinalRadius=Infinity;const finalStart=model.START_EXTENSION_SAMPLES+16*model.ROAD_STEPS_PER_SEGMENT;for(let index=finalStart+1;index<model.ROAD_SAMPLES.length-1;index++){const a=model.ROAD_SAMPLES[index-1],b=model.ROAD_SAMPLES[index],c=model.ROAD_SAMPLES[index+1];if(a.stunt||b.stunt||c.stunt)continue;const first=Math.atan2(b.z-a.z,b.x-a.x),second=Math.atan2(c.z-b.z,c.x-b.x),turn=Math.abs(Math.atan2(Math.sin(second-first),Math.cos(second-first))),distance=(Math.hypot(b.x-a.x,b.z-a.z)+Math.hypot(c.x-b.x,c.z-b.z))/2;minimumFinalRadius=Math.min(minimumFinalRadius,distance/Math.max(turn,1e-9))}assert.ok(minimumFinalRadius>55,`final sector still contains a hidden high-speed hairpin: ${minimumFinalRadius}`);
// Venue structures reserve the full road half-width plus a chase-camera and
// sightline corridor, rather than merely checking their center points.
for(const stand of model.VENUE.stands){
  let clearance=Infinity;const cosine=Math.cos(-stand.rotation),sine=Math.sin(-stand.rotation);
  for(const sample of model.ROAD_SAMPLES){const dx=sample.x-stand.x,dz=sample.z-stand.z,lx=dx*cosine-dz*sine,lz=dx*sine+dz*cosine,qx=Math.max(Math.abs(lx)-(stand.length/2+6),0),qz=Math.max(Math.abs(lz)-17,0);clearance=Math.min(clearance,Math.hypot(qx,qz))}
  assert.ok(clearance>=45,`grandstand enters road/camera corridor: ${clearance.toFixed(2)} m`);
}
console.log("Summit Circuit geometry",JSON.stringify({meters:+length.toFixed(1),samples:model.ROAD_SAMPLES.length,checkpoints:model.CHECKPOINTS.length,maxY:+Math.max(...model.ROAD_SAMPLES.map(sample=>sample.y)).toFixed(1),minimumCrossingClearance:+minimumCrossingClearance.toFixed(1),minimumFinalRadius:+minimumFinalRadius.toFixed(1)}));
if(previous===undefined)delete globalThis.location;else globalThis.location=previous;
