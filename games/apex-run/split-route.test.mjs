import assert from "node:assert/strict";
globalThis.location={search:"?track=summit-circuit"};
const model=await import("./track-model.js?split-route-test");

assert.equal(model.BRANCH_ROADS.length,1,"Summit must expose one authored route choice");
const attackObstacles=model.INTENTIONAL_OBSTACLES.filter(obstacle=>obstacle.branchId==="inside-line"),paddockObstacles=model.INTENTIONAL_OBSTACLES.filter(obstacle=>!obstacle.branchId);
assert.equal(attackObstacles.length,3,"attack line must contain a readable slalom");
assert.equal(paddockObstacles.length,2,"main route must contain a readable paddock chicane");
const branch=model.BRANCH_ROADS[0],layout=model.SPLIT_LAYOUT,entry=model.ROAD_SAMPLES[layout.entrySample],merge=model.ROAD_SAMPLES[layout.mergeSample];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),pathLength=samples=>samples.slice(1).reduce((sum,point,index)=>sum+distance(samples[index],point),0);
assert.ok(distance(branch.samples[0],entry)<.01,"branch does not share the declared entry cross-section");
assert.ok(distance(branch.samples.at(-1),merge)<.01,"branch does not share the declared merge cross-section");
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,(a.x*b.x+a.y*b.y+a.z*b.z)/(Math.hypot(a.x,a.y,a.z)*Math.hypot(b.x,b.y,b.z)))))*180/Math.PI,tangent=(samples,index)=>({x:samples[Math.min(samples.length-1,index+1)].x-samples[Math.max(0,index-1)].x,y:samples[Math.min(samples.length-1,index+1)].y-samples[Math.max(0,index-1)].y,z:samples[Math.min(samples.length-1,index+1)].z-samples[Math.max(0,index-1)].z});
for(const [label,branchIndex,mainIndex] of [["entry",0,layout.entrySample],["merge",branch.samples.length-1,layout.mergeSample]]){const branchSample=branch.samples[branchIndex],mainSample=model.ROAD_SAMPLES[mainIndex];assert.ok(distance(branchSample.left,mainSample.left)<.01,`${label} left edge is not welded`);assert.ok(distance(branchSample.right,mainSample.right)<.01,`${label} right edge is not welded`);assert.ok(angle(tangent(branch.samples,branchIndex),tangent(model.ROAD_SAMPLES,mainIndex))<2,`${label} tangent is folded`);assert.ok(Math.abs(branchSample.bank-mainSample.bank)<1e-6,`${label} bank is discontinuous`);const adjacent=branch.samples[branchIndex?branchIndex-1:1];assert.ok(Math.abs(adjacent.width-mainSample.width)<.02,`${label} width taper begins as a shoulder step`)}
for(const samples of [branch.samples.slice(0,12),branch.samples.slice(-12)])for(let index=1;index<samples.length;index++)assert.ok(angle(tangent(samples,index-1),tangent(samples,index))<4,"junction curvature contains a folded segment");
const safe=model.ROAD_SAMPLES.slice(layout.entrySample,layout.mergeSample+1),safeLength=pathLength(safe),attackLength=pathLength(branch.samples);
assert.ok(attackLength<safeLength*.96,`attack line is not a meaningful shortcut: ${attackLength}/${safeLength}`);
assert.ok(Math.max(...branch.samples.map((sample,index)=>distance(sample,safe[Math.round(index/(branch.samples.length-1)*(safe.length-1))])))>35,"branch never becomes visually distinct");
assert.ok(branch.surfaceSamples.length>40&&branch.surfaceSamples.length<branch.samples.length-60,"isolated branch surface was not trimmed out of the shared junction aprons");
for(const edge of[branch.surfaceSamples[0],branch.surfaceSamples.at(-1)]){let nearest={distance:Infinity,width:0};for(const sample of model.ROAD_SAMPLES){const candidate=distance(edge,sample);if(candidate<nearest.distance)nearest={distance:candidate,width:sample.width}}assert.ok(nearest.distance>=(edge.width+nearest.width)/2-.6,"branch collider begins inside the main-road collision sheet")}
assert.equal(model.BRANCH_JUNCTIONS.length,2,"split route needs an entry and exit transition surface");
for(const [index,junction] of model.BRANCH_JUNCTIONS.entries()){
  const values=junction.positions,vertex=point=>({x:values[point*3],y:values[point*3+1],z:values[point*3+2]}),first=[vertex(0),vertex(1)],last=[vertex(values.length/3-2),vertex(values.length/3-1)];let area=0;
  for(let triangle=0;triangle<junction.indices.length;triangle+=3){const a=vertex(junction.indices[triangle]),b=vertex(junction.indices[triangle+1]),c=vertex(junction.indices[triangle+2]),ab={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},ac={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z},normal={x:ab.y*ac.z-ab.z*ac.y,y:ab.z*ac.x-ab.x*ac.z,z:ab.x*ac.y-ab.y*ac.x};area+=Math.hypot(normal.x,normal.y,normal.z)/2;assert.ok(normal.y>0,`junction ${index} collision winding faces away from the car: ${JSON.stringify(normal)}`)}
  assert.ok(area>500,`junction ${index} is a degenerate patch: ${area}`);
  const branchEdge=index===0?last:first,mainApex=index===0?first:last;
  assert.ok(distance(mainApex[0],junction.apex)<.02&&distance(mainApex[1],junction.apex)<.02,`junction ${index} lost its zero-width shared main-road shoulder`);
  assert.ok(distance(branchEdge[0],junction.crossSection.left)<.02&&distance(branchEdge[1],junction.crossSection.right)<.02,`junction ${index} does not weld to the isolated branch cross-section`);
  // Every longitudinal pair shares its inner vertex with the actual main-road
  // shoulder. The transition therefore covers the 3D fork without a second
  // coplanar sheet or the old 1-5 m height gap hidden by XZ-only trimming.
  const direction=Math.sign(junction.mainEnd-junction.mainStart)||1;for(let step=0;step<values.length/6;step++){const inner=vertex(step*2+1),main=model.ROAD_SAMPLES[junction.mainStart+step*direction].left;assert.ok(distance(inner,main)<.02,`junction ${index} inner edge detached from the main deck at ${step}`)}
}
for(const obstacle of attackObstacles){const sample=branch.samples[obstacle.sampleIndex],offset=Math.hypot(obstacle.x-sample.x,obstacle.z-sample.z);assert.ok(branch.surfaceSamples.includes(sample),`${obstacle.id} is not on the isolated physical branch`);assert.ok(offset+obstacle.radius<sample.width/2-1.3,`${obstacle.id} blocks the entire attack line`);assert.equal(model.isOnRoad({x:obstacle.x,y:sample.y+1,z:obstacle.z}),true)}
for(const obstacle of paddockObstacles){const sample=model.ROAD_SAMPLES[obstacle.sampleIndex],offset=Math.hypot(obstacle.x-sample.x,obstacle.z-sample.z);assert.ok(offset+obstacle.radius<sample.width/2-1.3,`${obstacle.id} blocks the entire paddock deck`)}
const poseSample=branch.surfaceSamples[10],poseBefore=branch.surfaceSamples[9],poseAfter=branch.surfaceSamples[11],pose=model.roadPoseNear(poseSample,1.7),poseLength=Math.hypot(pose.x-poseSample.x,pose.y-poseSample.y,pose.z-poseSample.z),expectedForward={x:poseAfter.x-poseBefore.x,y:poseAfter.y-poseBefore.y,z:poseAfter.z-poseBefore.z},expectedLength=Math.hypot(expectedForward.x,expectedForward.y,expectedForward.z),poseForward={x:1-2*(pose.rotation.y**2+pose.rotation.z**2),y:2*(pose.rotation.x*pose.rotation.y+pose.rotation.w*pose.rotation.z),z:2*(pose.rotation.x*pose.rotation.z-pose.rotation.w*pose.rotation.y)};
assert.ok(Math.abs(poseLength-1.7)<.02,`branch recovery lift is not road-normal: ${poseLength}`);
assert.ok((poseForward.x*expectedForward.x+poseForward.y*expectedForward.y+poseForward.z*expectedForward.z)/expectedLength>.998,"branch recovery orientation came from the main route");
assert.equal(model.checkpointAdvance(4,branch.samples.at(-1)),5,"attack line cannot satisfy the shared post-merge checkpoint");
assert.equal(model.checkpointAdvance(4,{x:(entry.x+merge.x)/2,y:entry.y,z:(entry.z+merge.z)/2}),4,"cross-country chord can skip the branch graph");
console.log("Summit split/merge",JSON.stringify({safeMeters:+safeLength.toFixed(1),attackMeters:+attackLength.toFixed(1),obstacles:model.INTENTIONAL_OBSTACLES.length}));
