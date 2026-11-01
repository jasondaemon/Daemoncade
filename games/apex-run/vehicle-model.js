// Rapier's vehicle axes are local +X forward, +Y up and +Z axle. The forces
// below target a ~900 kg arcade car: about 0.4 g drive and 0.8 g service brake.
export const VEHICLE={gravity:-16,maxSpeed:38,engine:900,reverseScale:-.55,serviceBrake:1800,handbrakeFront:250,handbrakeRear:1900,roadGrip:2.35,driftGrip:1.05,offroadGrip:1.12,steerLow:.4,steerHigh:.055,steerRise:1.65,steerRelease:5.2,steerCounter:3.8};
export const WHEEL_OFFSETS=[{x:1.55,y:.08,z:1.02},{x:1.55,y:.08,z:-1.02},{x:-1.45,y:.08,z:1.02},{x:-1.45,y:.08,z:-1.02}];
export function clampVehicle(v,min,max){return Math.max(min,Math.min(max,v))}
export function createVehicle(RAPIER,world,start={x:-2,y:2.2,z:0}){
  const chassis=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(start.x,start.y,start.z).setCanSleep(false).setCcdEnabled(true).setLinearDamping(.08).setAngularDamping(.55));
  world.createCollider(RAPIER.ColliderDesc.cuboid(2.3,.24,1.02).setTranslation(0,-.08,0).setDensity(240).setFriction(.62),chassis);
  const vehicle=world.createVehicleController(chassis);
  for(const p of WHEEL_OFFSETS){vehicle.addWheel(p,{x:0,y:-1,z:0},{x:0,y:0,z:1},.42,.48);const i=vehicle.numWheels()-1;vehicle.setWheelSuspensionStiffness(i,72);vehicle.setWheelSuspensionCompression(i,5.2);vehicle.setWheelSuspensionRelaxation(i,6.4);vehicle.setWheelMaxSuspensionTravel(i,.38);vehicle.setWheelMaxSuspensionForce(i,18000);vehicle.setWheelSideFrictionStiffness(i,1.35);vehicle.setWheelFrictionSlip(i,VEHICLE.roadGrip)}
  return{chassis,vehicle,wheelOffsets:WHEEL_OFFSETS};
}
export function driveVehicle(vehicle,state,input,dt,onRoad=true){
  const speed=Math.abs(vehicle.currentVehicleSpeed?.()||0),target=(input.left?1:0)-(input.right?1:0),opposing=target&&state.steer&&Math.sign(target)!==Math.sign(state.steer),rate=target?(opposing?VEHICLE.steerCounter:VEHICLE.steerRise):VEHICLE.steerRelease;state.steer+=clampVehicle(target-state.steer,-dt*rate,dt*rate);
  const roadFraction=Array.isArray(onRoad)?onRoad.filter(Boolean).length/onRoad.length:(onRoad?1:0);if(!Number.isFinite(state.surfaceBlend))state.surfaceBlend=roadFraction;state.surfaceBlend+=clampVehicle(roadFraction-state.surfaceBlend,-dt*3.2,dt*5.5);
  const speedRatio=clampVehicle(speed/VEHICLE.maxSpeed,0,1),curve=speedRatio*speedRatio,steerLimit=VEHICLE.steerLow+(VEHICLE.steerHigh-VEHICLE.steerLow)*curve,throttle=input.forward?1:input.reverse?VEHICLE.reverseScale:0,surfacePower=.58+.42*state.surfaceBlend,engine=throttle*(speed>VEHICLE.maxSpeed&&throttle>0?0:VEHICLE.engine)*surfacePower,service=input.reverse&&speed>1?VEHICLE.serviceBrake:0,surfaceGrip=VEHICLE.offroadGrip+(VEHICLE.roadGrip-VEHICLE.offroadGrip)*state.surfaceBlend;
  for(let i=0;i<4;i++){const wheelRoad=Array.isArray(onRoad)?(onRoad[i]?1:0):state.surfaceBlend,wheelGrip=input.handbrake&&i>=2?VEHICLE.driftGrip:VEHICLE.offroadGrip+(surfaceGrip-VEHICLE.offroadGrip)*(.35+.65*wheelRoad);vehicle.setWheelEngineForce(i,engine);vehicle.setWheelBrake(i,service+(speed>VEHICLE.maxSpeed?450:0)+(input.handbrake?(i<2?VEHICLE.handbrakeFront:VEHICLE.handbrakeRear):0));vehicle.setWheelSteering(i,i<2?state.steer*steerLimit:0);vehicle.setWheelFrictionSlip(i,wheelGrip)}
  return{speed,steer:state.steer,steerLimit,engine,surfaceBlend:state.surfaceBlend};
}
// Grounded tires generate a strong self-aligning moment only after steering is
// released. This damps residual yaw without imposing a global-up orientation,
// fighting an intentional turn, or altering the car while airborne.
export function stabilizeChassis(chassis,vehicle){const contacts=[0,1,2,3].filter(i=>vehicle.wheelIsInContact(i));if(contacts.length<2)return;const q=chassis.rotation(),w=chassis.angvel(),forward={x:1-2*(q.y*q.y+q.z*q.z),y:2*(q.x*q.y+q.w*q.z),z:2*(q.x*q.z-q.w*q.y)},yaw={x:2*(q.x*q.y-q.w*q.z),y:1-2*(q.x*q.x+q.z*q.z),z:2*(q.y*q.z+q.w*q.x)},rollRate=w.x*forward.x+w.y*forward.y+w.z*forward.z,yawRate=w.x*yaw.x+w.y*yaw.y+w.z*yaw.z,steering=Math.abs(vehicle.wheelSteering(0)||0),aligning=steering<.025?780:35;chassis.addTorque({x:-forward.x*rollRate*180-yaw.x*yawRate*aligning,y:-forward.y*rollRate*180-yaw.y*yawRate*aligning,z:-forward.z*rollRate*180-yaw.z*yawRate*aligning},true)}
