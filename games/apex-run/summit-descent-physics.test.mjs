import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {RAIL_COLLISION_GROUPS,SUSPENSION_QUERY_GROUPS,applyLowSpeedSteering,applySurfaceDrag,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";

globalThis.location={search:"?track=summit-circuit"};
const model=await import("./track-model.js?summit-descent-physics"),DT=1/120,connector=model.ROAD_SAMPLES.map((sample,index)=>({sample,index})).filter(({sample})=>sample.stunt==="connector");
await RAPIER.init();

function run(entrySpeed,offset=0){
  const world=new RAPIER.World({x:0,y:-16,z:0});world.integrationParameters.dt=DT;
  const road=model.buildRoadColliderMesh(),roadCollider=world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(road.positions),new Uint32Array(road.indices),RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(1.1));
  const rails=model.buildRailColliderMesh(undefined,undefined,model.STUNT_RAIL_GAPS);world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(rails.positions),new Uint32Array(rails.indices)).setFriction(.08).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(.08).setCollisionGroups(RAIL_COLLISION_GROUPS));
  const first=connector[8].sample,pose=model.roadPoseNear(first),lateral={x:(first.left.x-first.right.x)/first.width,y:(first.left.y-first.right.y)/first.width,z:(first.left.z-first.right.z)/first.width};pose.x+=lateral.x*offset;pose.y+=lateral.y*offset;pose.z+=lateral.z*offset;
  const{chassis,chassisCollider,vehicle}=createVehicle(RAPIER,world,pose),state={steer:0,surfaceBlend:1};chassis.setRotation(pose.rotation,true);chassis.setLinvel({x:first.tangent.x*entrySpeed,y:first.tangent.y*entrySpeed,z:first.tangent.z*entrySpeed},true);
  let cursor=8,input={forward:true},decisionTicks=0,minimumSpeed=Infinity,maximumDistance=0,changes=0,finished=false,ticks=0;
  for(;ticks<3600;ticks++){
    const position=chassis.translation(),rotation=chassis.rotation(),velocity=chassis.linvel(),speed=Math.hypot(velocity.x,velocity.y,velocity.z);minimumSpeed=Math.min(minimumSpeed,speed);
    let nearest=cursor,distance=Infinity;for(let index=Math.max(0,cursor-20);index<Math.min(connector.length,cursor+180);index++){const sample=connector[index].sample,candidate=Math.hypot(position.x-sample.x,position.y-sample.y,position.z-sample.z);if(candidate<distance){nearest=index;distance=candidate}}cursor=Math.max(cursor,nearest);maximumDistance=Math.max(maximumDistance,distance);
    if(cursor>=connector.length-15){finished=true;break}
    if(decisionTicks<=0){let next;if(input.left||input.right)next={forward:true,reverse:false,left:false,right:false,handbrake:false};else{const lookahead=connector[Math.min(connector.length-1,cursor+180)].sample,desired=Math.atan2(lookahead.z-position.z,lookahead.x-position.x),heading=Math.atan2(2*(rotation.x*rotation.z-rotation.w*rotation.y),1-2*(rotation.y*rotation.y+rotation.z*rotation.z)),angle=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading)),turn=Math.abs(angle);next={forward:turn<.34||speed<18,reverse:turn>.48&&speed>25,left:angle<-.16,right:angle>.16,handbrake:false}}if(Object.keys(next).some(key=>next[key]!==input[key]))changes++;input=next;decisionTicks=30}
    decisionTicks--;
    const drive=driveVehicle(vehicle,state,input,DT,model.isOnRoad(position),speed);applySurfaceDrag(chassis,drive.surfaceBlend,DT);applyLowSpeedSteering(chassis,vehicle,input,DT,model.hasSupportingContact?.(world,chassisCollider,[roadCollider])??false);stabilizeChassis(chassis,vehicle,DT);vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,SUSPENSION_QUERY_GROUPS);world.step();
    assert.ok(position.y>-5,"Summit descent probe fell from the course");assert.ok(distance<first.width+14,`Summit descent probe left the readable runoff: ${distance.toFixed(1)}m`);
  }
  const final=chassis.translation();return{entrySpeed,offset,finished,cursor,minimumSpeed,maximumDistance,changes,seconds:ticks/120,final:{x:+final.x.toFixed(1),y:+final.y.toFixed(1),z:+final.z.toFixed(1)},input};
}

const results=[];for(const speed of[24,30,36])for(const offset of[-3,0,3])results.push(run(speed,offset));
console.log("Summit 250 ms digital descent matrix",results);
for(const result of results){assert.equal(result.finished,true,`Summit descent did not finish from ${result.entrySpeed}m/s offset ${result.offset}`);assert.ok(result.minimumSpeed>3,`Summit descent stalled from ${result.entrySpeed}m/s offset ${result.offset}`);assert.ok(result.maximumDistance<10,"Summit descent required a grass shortcut");assert.ok(result.changes/result.seconds<=4,"Summit descent controller exceeded four digital decisions per second")}
