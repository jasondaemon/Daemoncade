import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {FixedStepper,checkpointAdvance,clamp} from "./simulation.js";

await RAPIER.init();
const road=[
  [47,0,0,58,.45,13,0,0,0],[101,0,-18,20,.45,22,0,0,0],[101,0,-61,13,.45,38,0,0,0],
  [91,1,-103,27,.45,13,.035,0,0],[48,1,-103,28,.45,13,.035,0,0],[8,1.4,-103,16,.45,13,0,0,-.035],
  [-28,1,-103,22,.45,14,0,0,0],[-67,.3,-103,23,.45,14,0,0,0],
  [-82,0,9,14,.45,116,0,0,0],[22,0,140,120,.45,16,0,0,0],[150,0,72,14,.45,68,0,0,0],
];
function makeRun(fps){
  const world=new RAPIER.World({x:0,y:-24,z:0});world.integrationParameters.dt=1/120;
  world.createCollider(RAPIER.ColliderDesc.cuboid(190,1,150).setTranslation(0,-1.2,-50).setFriction(1.1));
  for(const[x,y,z,hx,hy,hz,rx,ry,rz]of road){const half=Math.sin(rx/2),q={x:half,y:0,z:Math.sin(rz/2),w:Math.cos(rx/2)*Math.cos(rz/2)};world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(q).setFriction(1.1))}
  const chassis=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-2,2.2,0).setCanSleep(false).setCcdEnabled(true).setLinearDamping(.08).setAngularDamping(.65));
  world.createCollider(RAPIER.ColliderDesc.cuboid(2.35,.2,1.05).setTranslation(0,.22,0).setDensity(70).setFriction(.72),chassis);
  const vehicle=world.createVehicleController(chassis),offsets=[[1.55,.35,1.02],[1.55,.35,-1.02],[-1.45,.35,1.02],[-1.45,.35,-1.02]];
  for(const[x,y,z]of offsets){vehicle.addWheel({x,y,z},{x:0,y:-1,z:0},{x:0,y:0,z:1},.42,.65);const i=vehicle.numWheels()-1;vehicle.setWheelSuspensionStiffness(i,180);vehicle.setWheelSuspensionCompression(i,7);vehicle.setWheelSuspensionRelaxation(i,9);vehicle.setWheelMaxSuspensionTravel(i,.55);vehicle.setWheelMaxSuspensionForce(i,60000);vehicle.setWheelSideFrictionStiffness(i,1.35);vehicle.setWheelFrictionSlip(i,2.55)}
  for(let i=0;i<360;i++){vehicle.updateVehicle(1/120,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()}
  const targets=[[92,0],[101,-35],[101,-82],[90,-100],[60,-95],[0,-95],[-55,-103],[-82,-90],[-82,20],[-82,120],[-55,140],[50,140],[130,140],[150,110],[150,45],[150,5]],trace=[];let target=0,checkpoint=0,ticks=0,steer=0,maxY=0,maxSpeed=0,minLandingY=99,airborne=false,landed=false,stuckTicks=0,recoveries=0;
  const step=()=>{
    const p=chassis.translation(),q=chassis.rotation(),goal=targets[target],distance=Math.hypot(goal[0]-p.x,goal[1]-p.z),threshold=[40,16,20,18,18,18,18,16,20,18,18,20,18,18,20,10][target];if(distance<threshold&&target<targets.length-1)target++;
    const desired=Math.atan2(targets[target][1]-p.z,targets[target][0]-p.x),forward=Math.atan2(2*(q.x*q.z-q.w*q.y),1-2*(q.y*q.y+q.z*q.z));let angle=desired-forward;angle=Math.atan2(Math.sin(angle),Math.cos(angle));
    const input=clamp(-angle*(checkpoint>=2?1.2:2.6),-1,1);steer+=clamp(input-steer,-5/120,5/120);const speed=Math.abs(vehicle.currentVehicleSpeed?.()||0),turning=Math.abs(angle)>.13,lateBrake=checkpoint>=2&&turning&&speed>24,steerLimit=.5+(.18-.5)*clamp(speed/70,0,1),engine=speed>30||lateBrake?0:speed<10&&target>=6?15200:11000;maxSpeed=Math.max(maxSpeed,speed);
    for(let i=0;i<4;i++){vehicle.setWheelEngineForce(i,engine*(i<2?1:.55));vehicle.setWheelBrake(i,lateBrake?1200:turning&&speed>24?2000:0);vehicle.setWheelSteering(i,i<2?steer*steerLimit:0);vehicle.setWheelFrictionSlip(i,2.55)}
    const grounded=[0,1,2,3].some(i=>vehicle.wheelIsInContact(i));if(!grounded&&p.y>2.5)airborne=true;if(airborne&&grounded){landed=true;minLandingY=Math.min(minLandingY,p.y)}
    vehicle.updateVehicle(1/120,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step();ticks++;if(ticks%120===0&&ticks<=1800)trace.push([ticks,+p.x.toFixed(1),+p.y.toFixed(1),+p.z.toFixed(1),+forward.toFixed(2),+angle.toFixed(2),target,+speed.toFixed(1)]);maxY=Math.max(maxY,p.y);const nextCheckpoint=checkpointAdvance(checkpoint,p);stuckTicks=nextCheckpoint!==checkpoint?0:speed<.5?stuckTicks+1:0;checkpoint=nextCheckpoint;
    if(p.y<-5||Math.abs(p.z)>200||Math.abs(p.x)>220||stuckTicks>120){recoveries++}
  };
  const stepper=new FixedStepper(step);for(let frame=0;frame<fps*70&&checkpoint<6&&recoveries===0;frame++)stepper.advance(1/fps);
  const p=chassis.translation();return{fps,ticks,time:ticks/120,checkpoint,target,recoveries,maxSpeed,position:{x:p.x,y:p.y,z:p.z},maxY,airborne,landed,minLandingY,trace};
}
const runs=[30,60,144].map(makeRun);console.log("Apex Run trajectories",JSON.stringify(runs,null,2));for(const run of runs){assert.equal(run.checkpoint,6,`${run.fps} FPS did not finish: ${JSON.stringify(run)}`);assert.equal(run.recoveries,0);assert.equal(run.airborne,true);assert.equal(run.landed,true);assert.ok(run.maxY>2.5)}
for(const run of runs.slice(1)){assert.ok(Math.abs(run.time-runs[0].time)<.1);assert.ok(Math.hypot(run.position.x-runs[0].position.x,run.position.z-runs[0].position.z)<.6)}
