import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {FixedStepper,checkpointAdvance,clamp} from "./simulation.js";
import {createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";

await RAPIER.init();
const road=[
  [47,0,0,58,.45,13,0,0,0],[101,0,-18,20,.45,22,0,0,0],[101,0,-61,13,.45,38,0,0,0],
  [91,0,-103,27,.45,13,.035,0,0],[48,0,-103,28,.45,13,.035,0,0],[8,.45,-103,16,.45,18,0,0,-.028],
  [-35,0,-103,20,.45,20,0,0,0],[-75,0,-103,20,.45,20,0,0,0],
  [-82,0,9,22,.45,116,0,0,0],[22,0,140,120,.45,16,0,0,0],[150,0,72,18,.45,68,0,0,0],
];
function makeRun(fps,recordedInputs=null){
  const world=new RAPIER.World({x:0,y:-24,z:0});world.integrationParameters.dt=1/120;
  world.createCollider(RAPIER.ColliderDesc.cuboid(190,1,150).setTranslation(0,-1.2,-50).setFriction(1.1));
  for(const[x,y,z,hx,hy,hz,rx,ry,rz]of road){const half=Math.sin(rx/2),q={x:half,y:0,z:Math.sin(rz/2),w:Math.cos(rx/2)*Math.cos(rz/2)};world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(q).setFriction(1.1))}
  const{chassis,vehicle}=createVehicle(RAPIER,world);
  for(let i=0;i<360;i++){vehicle.updateVehicle(1/120,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()}
  const targets=[[92,0],[101,-35],[101,-82],[90,-100],[60,-103],[0,-103],[-55,-103],[-82,-90],[-82,20],[-82,120],[-55,140],[50,140],[130,140],[150,110],[150,45],[150,5]],trace=[],inputTape=[];let target=0,checkpoint=0,ticks=0,steer=0,maxY=0,maxSpeed=0,minLandingY=99,airborne=false,landed=false,stuckTicks=0,recoveries=0;
  const step=()=>{
    const p=chassis.translation(),q=chassis.rotation(),goal=targets[target],distance=Math.hypot(goal[0]-p.x,goal[1]-p.z),threshold=[15,12,15,14,14,14,14,12,16,14,14,16,14,14,16,10][target];if(distance<threshold&&target<targets.length-1)target++;
    const desired=Math.atan2(targets[target][1]-p.z,targets[target][0]-p.x),forward=Math.atan2(2*(q.x*q.z-q.w*q.y),1-2*(q.y*q.y+q.z*q.z));let angle=desired-forward;angle=Math.atan2(Math.sin(angle),Math.cos(angle));
    const desiredSteer=clamp(-angle*(checkpoint>=2?1.2:2.6),-1,1),speed=Math.abs(vehicle.currentVehicleSpeed?.()||0),turning=Math.abs(angle)>.13,braking=turning&&speed>28||target>=5&&target<=6&&speed>24,steerOn=Math.abs(desiredSteer)>.1&&(ticks%12)<Math.ceil(Math.abs(desiredSteer)*12),generated={forward:!braking,reverse:braking,left:steerOn&&desiredSteer>0,right:steerOn&&desiredSteer<0,handbrake:false},input=recordedInputs?(recordedInputs[ticks]||recordedInputs.at(-1)):generated;if(!recordedInputs)inputTape.push({...input});driveVehicle(vehicle,{get steer(){return steer},set steer(v){steer=v}},input,1/120,true);maxSpeed=Math.max(maxSpeed,speed);
    const grounded=[0,1,2,3].some(i=>vehicle.wheelIsInContact(i));if(!grounded&&p.y>1.5)airborne=true;if(airborne&&grounded){landed=true;minLandingY=Math.min(minLandingY,p.y)}stabilizeChassis(chassis,grounded);
    vehicle.updateVehicle(1/120,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step();ticks++;if(ticks%120===0&&ticks<=1800)trace.push([ticks,+p.x.toFixed(1),+p.y.toFixed(1),+p.z.toFixed(1),+forward.toFixed(2),+angle.toFixed(2),target,+speed.toFixed(1)]);maxY=Math.max(maxY,p.y);const nextCheckpoint=checkpointAdvance(checkpoint,p);stuckTicks=nextCheckpoint!==checkpoint?0:speed<.5?stuckTicks+1:0;checkpoint=nextCheckpoint;
    if(p.y<-5||Math.abs(p.z)>200||Math.abs(p.x)>220||stuckTicks>120){recoveries++}
  };
  const stepper=new FixedStepper(step);for(let frame=0;frame<fps*70&&checkpoint<6&&recoveries===0;frame++)stepper.advance(1/fps);
  const p=chassis.translation();return{fps,ticks,time:ticks/120,checkpoint,target,recoveries,maxSpeed,position:{x:p.x,y:p.y,z:p.z},maxY,airborne,landed,minLandingY,trace,inputTape};
}
const reference=makeRun(60),runs=[30,60,144].map(fps=>makeRun(fps,reference.inputTape));console.log("Apex Run recorded-input trajectories",JSON.stringify(runs.map(({inputTape,...run})=>run),null,2));for(const run of runs){assert.equal(run.checkpoint,6,`${run.fps} FPS did not finish: ${JSON.stringify(run)}`);assert.equal(run.recoveries,0);assert.equal(run.airborne,true);assert.equal(run.landed,true);assert.ok(run.maxY>1.8)}
for(const run of runs.slice(1)){assert.ok(Math.abs(run.time-runs[0].time)<.1);assert.ok(Math.hypot(run.position.x-runs[0].position.x,run.position.z-runs[0].position.z)<.6)}
function turnProbe(){const world=new RAPIER.World({x:0,y:-24,z:0});world.integrationParameters.dt=1/120;world.createCollider(RAPIER.ColliderDesc.cuboid(190,1,150).setTranslation(0,-1.2,-50).setFriction(1.1));for(const[x,y,z,hx,hy,hz,rx,ry,rz]of road){const q={x:Math.sin(rx/2),y:0,z:Math.sin(rz/2),w:Math.cos(rx/2)*Math.cos(rz/2)};world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(q).setFriction(1.1))}const{chassis,vehicle}=createVehicle(RAPIER,world),state={steer:0};for(let tick=0;tick<360;tick++){const input=tick<252?{forward:true}:{right:true};driveVehicle(vehicle,state,input,1/120,true);stabilizeChassis(chassis,[0,1,2,3].some(i=>vehicle.wheelIsInContact(i)));vehicle.updateVehicle(1/120,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()}const p=chassis.translation(),q=chassis.rotation(),upY=1-2*(q.x*q.x+q.z*q.z);return{position:p,upY,speed:Math.abs(vehicle.currentVehicleSpeed())}}
const probe=turnProbe();assert.ok(probe.position.y>.35,JSON.stringify(probe));assert.ok(probe.upY>.7,JSON.stringify(probe));assert.ok(Math.abs(probe.position.z)<35,JSON.stringify(probe));console.log("Apex Run turn probe",JSON.stringify(probe));
