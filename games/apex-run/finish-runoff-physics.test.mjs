import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {SUSPENSION_QUERY_GROUPS,VEHICLE,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";
import {FINISH_COAST_SECONDS,FINISH_RUNOFF_LENGTH,buildFinishRunoffSamples,finishBrakeForce} from "./finish-presentation.js";

await RAPIER.init();
const DT=1/120,tracks=["alpine-sprint","summit-circuit","harbor-run","skyline-gauntlet"],speeds=[20,25,31,VEHICLE.maxSpeed];
const results=[];
for(const track of tracks){
  globalThis.location={search:`?track=${track}`};
  const model=await import(`./track-model.js?finish-runoff-${track}`),finish=model.CHECKPOINTS.at(-1),runoff=buildFinishRunoffSamples(finish),surface=model.buildRoadColliderMesh(runoff);
  for(const speed of speeds){
    const world=new RAPIER.World({x:0,y:VEHICLE.gravity,z:0});world.integrationParameters.dt=DT;
    const main=model.buildRoadColliderMesh(model.ROAD_SAMPLES);world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(main.positions),new Uint32Array(main.indices),RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(1.1));world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(surface.positions),new Uint32Array(surface.indices),RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(1.1));
    const pose=model.roadPoseNear(finish),{chassis,vehicle}=createVehicle(RAPIER,world,pose),state={steer:0,surfaceBlend:1};chassis.setRotation(pose.rotation,true);
    for(let tick=0;tick<120;tick++){driveVehicle(vehicle,state,{},DT,true,0);for(let wheel=0;wheel<4;wheel++)vehicle.setWheelBrake(wheel,6000);vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,SUSPENSION_QUERY_GROUPS);world.step()}
    const start={...chassis.translation()},forward={x:finish.forward.x,y:0,z:finish.forward.z},length=Math.hypot(forward.x,forward.z);forward.x/=length;forward.z/=length;chassis.setLinvel({x:forward.x*speed,y:finish.forward.y*speed,z:forward.z*speed},true);
    let maxDistance=0,minContacts=4,offSupport=0,maxY=-Infinity;
    for(let tick=0;tick<Math.ceil(FINISH_COAST_SECONDS/DT);tick++){
      const elapsed=(tick+1)*DT,velocity=chassis.linvel(),motion=Math.hypot(velocity.x,velocity.z);driveVehicle(vehicle,state,{},DT,true,motion);const brake=finishBrakeForce(elapsed);for(let wheel=0;wheel<4;wheel++)vehicle.setWheelBrake(wheel,brake);stabilizeChassis(chassis,vehicle,DT);vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,SUSPENSION_QUERY_GROUPS);world.step();
      const p=chassis.translation(),distance=(p.x-start.x)*forward.x+(p.z-start.z)*forward.z,contacts=[0,1,2,3].filter(index=>vehicle.wheelIsInContact(index)).length;maxDistance=Math.max(maxDistance,distance);maxY=Math.max(maxY,p.y);minContacts=Math.min(minContacts,contacts);if(contacts<2)offSupport++;
    }
    const finalSpeed=Math.hypot(chassis.linvel().x,chassis.linvel().z),p=chassis.translation(),q=chassis.rotation(),result={track,speed,maxDistance:+maxDistance.toFixed(2),finalSpeed:+finalSpeed.toFixed(2),minContacts,offSupport,maxY:+maxY.toFixed(2),finalY:+p.y.toFixed(2),upY:+(1-2*(q.x*q.x+q.z*q.z)).toFixed(2)};console.log(result);assert.ok(maxDistance<FINISH_RUNOFF_LENGTH-8,`${track} ${speed} m/s reached runoff end at ${maxDistance.toFixed(1)} m`);assert.ok(offSupport<8,`${track} ${speed} m/s lost runoff support for ${offSupport} ticks`);assert.ok(finalSpeed<.7,`${track} ${speed} m/s still moving at ${finalSpeed.toFixed(2)} m/s`);results.push(result);
  }
}
console.log("Apex Run finish runoff physics passed",results);
