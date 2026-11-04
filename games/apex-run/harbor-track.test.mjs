import assert from "node:assert/strict";
globalThis.location={search:"?track=harbor-run"};
const {ACTIVE_TRACK_ID,CHECKPOINTS,ROAD_SAMPLES,SURFACE_GAPS,VENUE,buildRoadColliderMesh,buildRoadMesh,checkpointAdvance,roadPoseNear}=await import("./track-model.js?harbor-track");
assert.equal(ACTIVE_TRACK_ID,"harbor-run");assert.equal(CHECKPOINTS.length,9);assert.ok(ROAD_SAMPLES.length>2700,"harbor road sampling");assert.ok(VENUE.halfX>=700&&VENUE.halfZ>=480,"coastal venue footprint");assert.equal(SURFACE_GAPS.length,1);const gap=SURFACE_GAPS[0];assert.ok(gap.end-gap.start>=15,"meaningful channel air gap");
const mesh=buildRoadMesh(),collider=buildRoadColliderMesh(mesh.samples);assert.equal(mesh.indices.length,(mesh.samples.length-1-(gap.end-gap.start))*24,"render deck omits the complete channel gap");
assert.ok(collider.indices.length>0);for(const checkpoint of CHECKPOINTS){const pose=roadPoseNear(checkpoint);assert.ok(Number.isFinite(pose.x)&&Number.isFinite(pose.rotation.w),"checkpoint recovery frame");}
let length=0,minimumSeparation=Infinity;for(let index=1;index<ROAD_SAMPLES.length;index++)length+=Math.hypot(ROAD_SAMPLES[index].x-ROAD_SAMPLES[index-1].x,ROAD_SAMPLES[index].y-ROAD_SAMPLES[index-1].y,ROAD_SAMPLES[index].z-ROAD_SAMPLES[index-1].z);
for(let first=0;first<ROAD_SAMPLES.length;first+=4)for(let second=first+160;second<ROAD_SAMPLES.length;second+=4){const a=ROAD_SAMPLES[first],b=ROAD_SAMPLES[second],clearance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)-(a.width+b.width)/2;minimumSeparation=Math.min(minimumSeparation,clearance)}
for(let current=0;current<CHECKPOINTS.length-1;current++)for(let later=current+1;later<CHECKPOINTS.length;later++)assert.equal(checkpointAdvance(current,{...CHECKPOINTS[later],y:CHECKPOINTS[later].y+1.5}),current,`gate ${later+1} skipped ordered gate ${current+1}`);
assert.ok(length>4000,"Harbor must be a genuinely long course");assert.ok(minimumSeparation>80,"nonadjacent road ribbons must not form accidental near-crossings");
console.log("Apex Run Harbor geometry passed",{samples:ROAD_SAMPLES.length,gap:gap.end-gap.start,checkpoints:CHECKPOINTS.length,length:+length.toFixed(1),minimumSeparation:+minimumSeparation.toFixed(1)});
