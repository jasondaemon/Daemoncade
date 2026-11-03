import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
globalThis.location={search:"?track=harbor-run"};
const {ROAD_SAMPLES,VENUE}=await import("./track-model.js?harbor-venue-test=1");
const {HARBOR_DOCK_SPECS,HARBOR_WAREHOUSE_SPECS,addHarborVenue,harborContainerPlacements,harborStructureClearance,harborVenueBudget,isHarborWaterFailure}=await import("./harbor-venue.js");
assert.deepEqual(harborVenueBudget("low"),{cranes:2,warehouses:2,containers:18,rockClusters:0});
assert.deepEqual(harborVenueBudget("medium"),{cranes:3,warehouses:3,containers:30,rockClusters:1});
assert.deepEqual(harborVenueBudget("high"),{cranes:4,warehouses:3,containers:45,rockClusters:2});
for(const spec of HARBOR_DOCK_SPECS)assert.ok(harborStructureClearance(spec,ROAD_SAMPLES)>20,"dock footprint must clear the complete road ribbon");
for(const [x,z,width,,depth] of HARBOR_WAREHOUSE_SPECS)assert.ok(harborStructureClearance([x,z,width+4,depth+4],ROAD_SAMPLES)>20,"warehouse footprint must clear the complete road ribbon");
for(const quality of["low","medium","high"]){const placements=harborContainerPlacements(quality);assert.equal(placements.length,harborVenueBudget(quality).containers);for(const item of placements){assert.ok(harborStructureClearance([item.x,item.z,6.06,2.44],ROAD_SAMPLES)>12,"container bounds must clear the complete road ribbon");assert.ok(Math.abs(item.y-1.295-(1.7+item.stack*2.59))<1e-9,"container stack does not rest exactly on its dock or lower container")}}
assert.equal(isHarborWaterFailure({x:VENUE.centerX,y:.5,z:VENUE.centerZ},VENUE),true);
assert.equal(isHarborWaterFailure({x:VENUE.centerX,y:3,z:VENUE.centerZ},VENUE),false);
assert.equal(isHarborWaterFailure({x:VENUE.centerX+VENUE.halfX+2,y:0,z:VENUE.centerZ},VENUE),false);
for(const quality of["low","medium","high"]){const scene=new THREE.Scene(),result=await addHarborVenue(THREE,scene,VENUE,quality);assert.deepEqual(result.budget,harborVenueBudget(quality));assert.equal(scene.children.length,result.structures.length,"every Harbor structure must be registered in the returned budget surface");const instances=scene.children.filter(child=>child.isInstancedMesh);assert.equal(instances.length,3,"container colors share three instanced draw calls");assert.equal(instances.reduce((sum,item)=>sum+item.count,0),harborVenueBudget(quality).containers)}
const failureScene=new THREE.Scene(),fallback=await addHarborVenue(THREE,failureScene,VENUE,"high",{assetLoader:{loadAsync:async()=>{throw new Error("missing optional rock")}}});assert.equal(fallback.structures.length,failureScene.children.length,"optional rock failure prevented core Harbor venue construction");assert.equal(failureScene.children.filter(child=>child.isInstancedMesh).reduce((sum,item)=>sum+item.count,0),45);
console.log("Apex Run Harbor venue budgets passed");
