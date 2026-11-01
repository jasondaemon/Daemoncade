export const VEHICLE={gravity:-24,maxSpeed:46,engine:1800,reverseScale:-.65,serviceBrake:3000,handbrakeFront:500,handbrakeRear:3200,roadGrip:2.7,driftGrip:1.15,offroadGrip:.82,steerLow:.45,steerHigh:.085,steerRate:3.6};
export const WHEEL_OFFSETS=[{x:1.55,y:.35,z:1.02},{x:1.55,y:.35,z:-1.02},{x:-1.45,y:.35,z:1.02},{x:-1.45,y:.35,z:-1.02}];
export function clampVehicle(v,min,max){return Math.max(min,Math.min(max,v))}
export function createVehicle(RAPIER,world,start={x:-2,y:2.2,z:0}){
  const chassis=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(start.x,start.y,start.z).setCanSleep(false).setCcdEnabled(true).setLinearDamping(.1).setAngularDamping(1.05));
  world.createCollider(RAPIER.ColliderDesc.cuboid(2.3,.2,1.02).setTranslation(0,-.18,0).setDensity(76).setFriction(.62),chassis);
  const vehicle=world.createVehicleController(chassis);
  for(const p of WHEEL_OFFSETS){vehicle.addWheel(p,{x:0,y:-1,z:0},{x:0,y:0,z:1},.42,.65);const i=vehicle.numWheels()-1;vehicle.setWheelSuspensionStiffness(i,180);vehicle.setWheelSuspensionCompression(i,7);vehicle.setWheelSuspensionRelaxation(i,9);vehicle.setWheelMaxSuspensionTravel(i,.55);vehicle.setWheelMaxSuspensionForce(i,60000);vehicle.setWheelSideFrictionStiffness(i,1.35);vehicle.setWheelFrictionSlip(i,VEHICLE.roadGrip)}
  return{chassis,vehicle,wheelOffsets:WHEEL_OFFSETS};
}
export function driveVehicle(vehicle,state,input,dt,onRoad=true){
  const speed=Math.abs(vehicle.currentVehicleSpeed?.()||0),target=(input.left?1:0)-(input.right?1:0);state.steer+=clampVehicle(target-state.steer,-dt*VEHICLE.steerRate,dt*VEHICLE.steerRate);
  const steerLimit=VEHICLE.steerLow+(VEHICLE.steerHigh-VEHICLE.steerLow)*clampVehicle(speed/VEHICLE.maxSpeed,0,1),throttle=input.forward?1:input.reverse?VEHICLE.reverseScale:0,engine=throttle*(speed>VEHICLE.maxSpeed&&throttle>0?0:VEHICLE.engine)*(onRoad?1:.42),service=input.reverse&&speed>1?VEHICLE.serviceBrake:0;
  for(let i=0;i<4;i++){vehicle.setWheelEngineForce(i,engine*(i<2?1:.55));vehicle.setWheelBrake(i,service+(speed>VEHICLE.maxSpeed?700:0)+(input.handbrake?(i<2?VEHICLE.handbrakeFront:VEHICLE.handbrakeRear):0));vehicle.setWheelSteering(i,i<2?state.steer*steerLimit:0);vehicle.setWheelFrictionSlip(i,onRoad?(input.handbrake&&i>=2?VEHICLE.driftGrip:VEHICLE.roadGrip):VEHICLE.offroadGrip)}
  return{speed,steer:state.steer,steerLimit,engine};
}
export function stabilizeChassis(chassis,grounded){if(!grounded)return;const q=chassis.rotation(),up={x:2*(q.x*q.y-q.w*q.z),z:2*(q.y*q.z+q.w*q.x)},w=chassis.angvel();chassis.addTorque({x:up.z*180-w.x*90,y:-w.y*25,z:-up.x*180-w.z*90},true)}
