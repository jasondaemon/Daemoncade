import assert from "node:assert/strict";
globalThis.location={search:"?track=summit-circuit"};
const {ROAD_SAMPLES,VENUE}=await import("./track-model.js?venue-clearance");

function standClearance(stand,sample){
  const dx=sample.x-stand.x,dz=sample.z-stand.z,c=Math.cos(-stand.rotation),s=Math.sin(-stand.rotation),x=dx*c-dz*s,z=dx*s+dz*c;
  const halfX=stand.length/2+6.5,minZ=-32,maxZ=16,nearestX=Math.max(-halfX,Math.min(halfX,x)),nearestZ=Math.max(minZ,Math.min(maxZ,z));
  return Math.hypot(x-nearestX,z-nearestZ)-sample.width/2;
}
for(const [index,stand] of VENUE.stands.entries()){
  const clearance=Math.min(...ROAD_SAMPLES.map(sample=>standClearance(stand,sample)));
  assert.ok(clearance>=18,`stand ${index} full roof/paving envelope overlaps the course: ${clearance.toFixed(2)}m`);
}
console.log("Summit full stand envelopes clear the road corridor");
