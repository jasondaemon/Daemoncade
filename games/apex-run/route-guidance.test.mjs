import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
import {CHECKPOINTS,RECOVERY_SPOTS,ROAD_SAMPLES,ROUTE_PATH,ROUTE_STAGE_RANGES,recoveryForward,routeGuides,routeStage,routeTarget} from "./track-model.js";

const guides=routeGuides(27);
assert.ok(guides.length>=20,"route sampling needs enough internal guidance probes");
for(const guide of guides){
  const a=ROAD_SAMPLES[guide.segment],b=ROAD_SAMPLES[guide.segment+1],length=Math.hypot(b.x-a.x,b.z-a.z);
  const tangent={x:(b.x-a.x)/length,z:(b.z-a.z)/length};
  // Three.js rotates a +X ground arrow with rotation.y = -heading.
  const renderedForward={x:Math.cos(-guide.heading),z:-Math.sin(-guide.heading)};
  const dot=renderedForward.x*tangent.x+renderedForward.z*tangent.z;
  assert.ok(dot>.999999,`arrow ${JSON.stringify(guide)} points against route tangent ${dot}`);
}
const production=readFileSync(new URL("game.js",import.meta.url),"utf8");
for(const obsolete of["routeArrow(","RingGeometry(","CREST  ↑","BRAKE · FINISH TURN","roadMarker("])assert.equal(production.includes(obsolete),false,`obsolete production guidance visual remains: ${obsolete}`);
function distanceToStage(point,stage){let best=Infinity;for(let i=0;i<stage.length-1;i++){const a=stage[i],b=stage[i+1],dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz;if(length2<1e-6)continue;const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/length2)),x=a.x+dx*t,z=a.z+dz*t;best=Math.min(best,Math.hypot(point.x-x,point.z-z))}return best}
const probes=[
  [{x:-2,z:0},{x:80,z:0}], [{x:96,z:-24},{x:0,z:-103}],
  [{x:-82,z:-103},{x:-82,z:125},{x:60,z:140}], [{x:126,z:140},{x:150,z:50}],
];
for(let checkpoint=0;checkpoint<CHECKPOINTS.length;checkpoint++){
  const stage=routeStage(checkpoint),[start,end]=ROUTE_STAGE_RANGES[checkpoint];assert.ok(Math.hypot(stage[0].x-ROUTE_PATH[start].x,stage[0].z-ROUTE_PATH[start].z)<1e-6);assert.ok(Math.hypot(stage.at(-2).x-ROUTE_PATH[end].x,stage.at(-2).z-ROUTE_PATH[end].z)<1e-6);
  for(const position of [...probes[checkpoint],RECOVERY_SPOTS[checkpoint],{x:150,z:8}]){const target=routeTarget(checkpoint,position);assert.equal(target.stage,checkpoint);assert.ok(distanceToStage(target,stage)<1e-6,`stage ${checkpoint} target skipped its corridor: ${JSON.stringify({position,target})}`)}
  const recovery=RECOVERY_SPOTS[checkpoint],target=routeTarget(checkpoint,recovery),forward=recoveryForward(recovery.rotation),to={x:target.x-recovery.x,z:target.z-recovery.z};assert.ok(forward.x*to.x+forward.z*to.z>=-1e-6,`recovery ${checkpoint} guidance points behind the car`);
}
// Gate four's direct line to later geometry was the observed contradiction.
// Even when physically near the finish, stage four must still point to the
// eastbound z=140 corridor and gate five rather than across the infield.
const returnTrap=routeTarget(2,{x:150,z:20});assert.ok(returnTrap.z>130&&returnTrap.stage===2,JSON.stringify(returnTrap));
for(const [checkpoint,positions] of [
  [2,[{x:-82,z:-103},{x:-82,z:125},{x:-65,z:137},{x:-5,z:146},{x:55,z:134},{x:105,z:145},{x:126,z:140}]],
  [3,[{x:126,z:140},{x:144,z:128},{x:156,z:108},{x:146,z:82},{x:154,z:45},{x:149,z:14}]],
]){
  let progress=0,previousTarget=null;for(const position of positions){const target=routeTarget(checkpoint,position,34,progress);assert.ok(target.progress>=progress,`stage ${checkpoint} guidance regressed ${progress} -> ${target.progress}`);assert.equal(target.breadcrumbs.length,3);if(previousTarget&&target.total-target.progress>17)assert.ok(Math.hypot(target.x-position.x,target.z-position.z)>8,"lookahead collapsed onto an invisible helper point");progress=target.progress;previousTarget=target}
  // Small timing/line offsets after a passed helper cannot swing the target
  // backward. This models a player cutting a visible paved corner.
  const late=routeTarget(checkpoint,positions.at(-2),34,progress),jittered=routeTarget(checkpoint,{x:positions.at(-2).x-6,z:positions.at(-2).z+5},34,late.progress);assert.ok(jittered.progress>=late.progress);assert.equal(jittered.stage,checkpoint);
}
console.log("Apex Run ordered route guidance passed",JSON.stringify({points:ROUTE_PATH.length,guides:guides.length,stages:ROUTE_STAGE_RANGES.length}));
