import assert from "node:assert/strict";
globalThis.location={search:"?track=summit-circuit"};
const model=await import("./track-model.js?split-route-test");

assert.equal(model.BRANCH_ROADS.length,1,"Summit must expose one authored route choice");
assert.equal(model.INTENTIONAL_OBSTACLES.length,3,"attack line must contain a readable slalom");
const branch=model.BRANCH_ROADS[0],layout=model.SPLIT_LAYOUT,entry=model.ROAD_SAMPLES[layout.entrySample],merge=model.ROAD_SAMPLES[layout.mergeSample];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),pathLength=samples=>samples.slice(1).reduce((sum,point,index)=>sum+distance(samples[index],point),0);
assert.ok(distance(branch.samples[0],entry)<.01,"branch does not share the declared entry cross-section");
assert.ok(distance(branch.samples.at(-1),merge)<.01,"branch does not share the declared merge cross-section");
const safe=model.ROAD_SAMPLES.slice(layout.entrySample,layout.mergeSample+1),safeLength=pathLength(safe),attackLength=pathLength(branch.samples);
assert.ok(attackLength<safeLength*.96,`attack line is not a meaningful shortcut: ${attackLength}/${safeLength}`);
assert.ok(Math.max(...branch.samples.map((sample,index)=>distance(sample,safe[Math.round(index/(branch.samples.length-1)*(safe.length-1))])))>35,"branch never becomes visually distinct");
for(const obstacle of model.INTENTIONAL_OBSTACLES){const sample=branch.samples[obstacle.sampleIndex],offset=Math.hypot(obstacle.x-sample.x,obstacle.z-sample.z);assert.ok(offset+obstacle.radius<sample.width/2-1.3,`${obstacle.id} blocks the entire attack line`);assert.equal(model.isOnRoad({x:obstacle.x,y:sample.y+1,z:obstacle.z}),true)}
const poseSample=branch.samples[44],poseBefore=branch.samples[43],poseAfter=branch.samples[45],pose=model.roadPoseNear(poseSample,1.7),poseLength=Math.hypot(pose.x-poseSample.x,pose.y-poseSample.y,pose.z-poseSample.z),expectedForward={x:poseAfter.x-poseBefore.x,y:poseAfter.y-poseBefore.y,z:poseAfter.z-poseBefore.z},expectedLength=Math.hypot(expectedForward.x,expectedForward.y,expectedForward.z),poseForward={x:1-2*(pose.rotation.y**2+pose.rotation.z**2),y:2*(pose.rotation.x*pose.rotation.y+pose.rotation.w*pose.rotation.z),z:2*(pose.rotation.x*pose.rotation.z-pose.rotation.w*pose.rotation.y)};
assert.ok(Math.abs(poseLength-1.7)<.02,`branch recovery lift is not road-normal: ${poseLength}`);
assert.ok((poseForward.x*expectedForward.x+poseForward.y*expectedForward.y+poseForward.z*expectedForward.z)/expectedLength>.998,"branch recovery orientation came from the main route");
assert.equal(model.checkpointAdvance(4,branch.samples.at(-1)),5,"attack line cannot satisfy the shared post-merge checkpoint");
assert.equal(model.checkpointAdvance(4,{x:(entry.x+merge.x)/2,y:entry.y,z:(entry.z+merge.z)/2}),4,"cross-country chord can skip the branch graph");
console.log("Summit split/merge",JSON.stringify({safeMeters:+safeLength.toFixed(1),attackMeters:+attackLength.toFixed(1),obstacles:model.INTENTIONAL_OBSTACLES.length}));
