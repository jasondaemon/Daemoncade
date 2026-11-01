import assert from "node:assert/strict";
import {CHECKPOINTS,RECOVERY_SPOTS,ROUTE_PATH,ROUTE_STAGE_RANGES,recoveryForward,routeGuides,routeStage,routeTarget} from "./track-model.js";

const guides=routeGuides(27);
assert.ok(guides.length>=20,"route needs frequent visible arrows");
for(const guide of guides){
  const a=ROUTE_PATH[guide.segment],b=ROUTE_PATH[guide.segment+1],length=Math.hypot(b.x-a.x,b.z-a.z);
  const tangent={x:(b.x-a.x)/length,z:(b.z-a.z)/length};
  // Three.js rotates a +X ground arrow with rotation.y = -heading.
  const renderedForward={x:Math.cos(-guide.heading),z:-Math.sin(-guide.heading)};
  const dot=renderedForward.x*tangent.x+renderedForward.z*tangent.z;
  assert.ok(dot>.999999,`arrow ${JSON.stringify(guide)} points against route tangent ${dot}`);
}
function distanceToStage(point,stage){let best=Infinity;for(let i=0;i<stage.length-1;i++){const a=stage[i],b=stage[i+1],dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz;if(length2<1e-6)continue;const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/length2)),x=a.x+dx*t,z=a.z+dz*t;best=Math.min(best,Math.hypot(point.x-x,point.z-z))}return best}
const probes=[
  [{x:-2,z:0},{x:80,z:0}], [{x:99,z:-12},{x:96,z:-55}], [{x:96,z:-72},{x:0,z:-103}],
  [{x:-82,z:-103},{x:-82,z:90}], [{x:-82,z:125},{x:60,z:140}], [{x:135,z:140},{x:150,z:50}],
];
for(let checkpoint=0;checkpoint<CHECKPOINTS.length;checkpoint++){
  const stage=routeStage(checkpoint),[start,end]=ROUTE_STAGE_RANGES[checkpoint];assert.deepEqual(stage[0],ROUTE_PATH[start]);assert.deepEqual(stage.at(-2),ROUTE_PATH[end]);
  for(const position of [...probes[checkpoint],RECOVERY_SPOTS[checkpoint],{x:150,z:8}]){const target=routeTarget(checkpoint,position);assert.equal(target.stage,checkpoint);assert.ok(distanceToStage(target,stage)<1e-6,`stage ${checkpoint} target skipped its corridor: ${JSON.stringify({position,target})}`)}
  const recovery=RECOVERY_SPOTS[checkpoint],target=routeTarget(checkpoint,recovery),forward=recoveryForward(recovery.rotation),to={x:target.x-recovery.x,z:target.z-recovery.z};assert.ok(forward.x*to.x+forward.z*to.z>=-1e-6,`recovery ${checkpoint} guidance points behind the car`);
}
// Gate four's direct line to later geometry was the observed contradiction.
// Even when physically near the finish, stage four must still point to the
// eastbound z=140 corridor and gate five rather than across the infield.
const gate4Trap=routeTarget(4,{x:150,z:20});assert.ok(gate4Trap.z>130&&gate4Trap.stage===4,JSON.stringify(gate4Trap));
console.log("Apex Run ordered route guidance passed",JSON.stringify({points:ROUTE_PATH.length,guides:guides.length,stages:ROUTE_STAGE_RANGES.length}));
