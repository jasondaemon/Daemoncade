import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {ROAD_SAMPLES,buildRailColliderMesh,buildRoadColliderMesh,buildRoadMesh,roadPoseNear} from "./track-model.js";
import {RAIL_COLLISION_GROUPS,SUSPENSION_QUERY_GROUPS,applySurfaceDrag,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";

await RAPIER.init();
const DT=1/120;
function rotate(axis,q){return{x:axis.x*(1-2*(q.y*q.y+q.z*q.z))+axis.y*2*(q.x*q.y-q.w*q.z)+axis.z*2*(q.x*q.z+q.w*q.y),y:axis.x*2*(q.x*q.y+q.w*q.z)+axis.y*(1-2*(q.x*q.x+q.z*q.z))+axis.z*2*(q.y*q.z-q.w*q.x),z:axis.x*2*(q.x*q.z-q.w*q.y)+axis.y*2*(q.y*q.z+q.w*q.x)+axis.z*(1-2*(q.x*q.x+q.y*q.y))}}
function run(index,speedKmh,steer="right",steerDelay=.55){
  const world=new RAPIER.World({x:0,y:-16,z:0});world.integrationParameters.dt=DT;
  const road=buildRoadMesh(),surface=buildRoadColliderMesh(road.samples),roadCollider=world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(surface.positions),new Uint32Array(surface.indices)).setFriction(1.1));
  const rails=buildRailColliderMesh(road.samples),railCollider=world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(rails.positions),new Uint32Array(rails.indices)).setFriction(.08).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(.08).setCollisionGroups(RAIL_COLLISION_GROUPS));
  const sample=ROAD_SAMPLES[index],pose=roadPoseNear(sample,1.7),{chassis,chassisCollider,vehicle}=createVehicle(RAPIER,world,pose);chassis.setRotation(pose.rotation,true);
  const forward=rotate({x:1,y:0,z:0},pose.rotation);chassis.setLinvel({x:forward.x*speedKmh/3.6,y:forward.y*speedKmh/3.6,z:forward.z*speedKmh/3.6},true);
  const state={steer:0,surfaceBlend:1};let minUp=1,minUpBeforeRail=1,maxLateralG=0,maxLateralGBeforeRail=0,maxRollRate=0,minContacts=4,minContactsBeforeRail=4,railContactTick=null,rollTick=null,previous={...chassis.linvel()};
  for(let tick=0;tick<300;tick++){
    const input=tick<steerDelay/DT?{forward:true}:{forward:true,[steer]:true},before={...chassis.linvel()};driveVehicle(vehicle,state,input,DT,true,Math.hypot(before.x,before.z));applySurfaceDrag(chassis,1,DT);stabilizeChassis(chassis,vehicle,DT);vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,SUSPENSION_QUERY_GROUPS);world.step();
    const q=chassis.rotation(),up=rotate({x:0,y:1,z:0},q),lateral=rotate({x:0,y:0,z:1},q),velocity=chassis.linvel(),specific={x:(velocity.x-previous.x)/DT,y:(velocity.y-previous.y)/DT+16,z:(velocity.z-previous.z)/DT},lateralG=Math.abs(specific.x*lateral.x+specific.y*lateral.y+specific.z*lateral.z)/9.80665,rollRate=Math.abs(chassis.angvel().x*forward.x+chassis.angvel().y*forward.y+chassis.angvel().z*forward.z),contacts=[0,1,2,3].filter(w=>vehicle.wheelIsInContact(w)).length;
    minUp=Math.min(minUp,up.y);maxLateralG=Math.max(maxLateralG,lateralG);maxRollRate=Math.max(maxRollRate,rollRate);minContacts=Math.min(minContacts,contacts);if(up.y<.35&&rollTick===null)rollTick=tick;world.contactPair(chassisCollider,railCollider,()=>{if(railContactTick===null)railContactTick=tick});if(railContactTick===null){minUpBeforeRail=Math.min(minUpBeforeRail,up.y);maxLateralGBeforeRail=Math.max(maxLateralGBeforeRail,lateralG);minContactsBeforeRail=Math.min(minContactsBeforeRail,contacts)}previous={...velocity};
  }
  return{index,speedKmh,steer,steerDelay,minUp,minUpBeforeRail,maxLateralG,maxLateralGBeforeRail,maxRollRate,minContacts,minContactsBeforeRail,railContactTick,rollTick,position:{...chassis.translation()}};
}
const probes=[];for(const index of[480,500,520,750,790])for(const speed of[60,80,100])probes.push(run(index,speed));
for(const index of[500,790])for(const speed of[60,80,100])probes.push(run(index,speed,"left",.35));
console.log("Apex Run turn-three rollover diagnostics",JSON.stringify(probes.map(result=>({...result,minUp:+result.minUp.toFixed(3),minUpBeforeRail:+result.minUpBeforeRail.toFixed(3),maxLateralG:+result.maxLateralG.toFixed(2),maxLateralGBeforeRail:+result.maxLateralGBeforeRail.toFixed(2),maxRollRate:+result.maxRollRate.toFixed(2)}))));
for(const result of probes){assert.ok(result.minUpBeforeRail>.7,`tire cornering rolled the Formula chassis before barrier contact: ${JSON.stringify(result)}`);assert.ok(result.minUp>.35,`barrier interaction rolled the Formula chassis: ${JSON.stringify(result)}`);if(result.rollTick!==null)assert.ok(result.railContactTick===null||result.rollTick<result.railContactTick,`collision trip must be diagnosed separately: ${JSON.stringify(result)}`)}
