import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {VEHICLE,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";
import {TRACK_BOXES,CHECKPOINTS,RECOVERY_SPOTS,isOnRoad,checkpointAdvance,recoveryForward} from "./track-model.js";

await RAPIER.init();
const DT=1/120;
function setup(start={x:-2,y:2.2,z:0},rotation=null){
  const world=new RAPIER.World({x:0,y:VEHICLE.gravity,z:0});world.integrationParameters.dt=DT;
  const roadHandles=new Set();
  for(const {x,y,z,hx,hy,hz,rx=0,rz=0,surface="road"} of TRACK_BOXES){const q={x:Math.sin(rx/2),y:0,z:Math.sin(rz/2),w:Math.cos(rx/2)*Math.cos(rz/2)},c=world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(q).setFriction(1.1));if(surface!=="grass")roadHandles.add(c.handle)}
  const result=createVehicle(RAPIER,world,start),state={steer:0,surfaceBlend:1};if(rotation)result.chassis.setRotation(rotation,true);
  for(let t=0;t<360;t++){driveVehicle(result.vehicle,state,{},DT,true);for(let i=0;i<4;i++)result.vehicle.setWheelBrake(i,5000);result.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()}
  return{world,...result,state,roadHandles};
}
function driveSteps(sim,input,seconds){for(let n=0;n<Math.round(seconds/DT);n++){const p=sim.chassis.translation(),wheelRoad=[0,1,2,3].map(i=>{const c=sim.vehicle.wheelGroundObject(i);return c?sim.roadHandles.has(c.handle):isOnRoad(p)});driveVehicle(sim.vehicle,sim.state,input,DT,wheelRoad);stabilizeChassis(sim.chassis,sim.vehicle);sim.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);sim.world.step()}return sim.chassis.translation()}
function run(segments){const sim=setup(),trace=[];let checkpoint=0,tick=0,offroadTicks=0;
  for(const segment of segments){for(let n=0;n<Math.round(segment.seconds/DT);n++){const p=sim.chassis.translation(),wheelRoad=[0,1,2,3].map(i=>{const c=sim.vehicle.wheelGroundObject(i);return c?sim.roadHandles.has(c.handle):isOnRoad(p)});driveVehicle(sim.vehicle,sim.state,segment.input,DT,wheelRoad);stabilizeChassis(sim.chassis,sim.vehicle);sim.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);sim.world.step();checkpoint=checkpointAdvance(checkpoint,sim.chassis.translation());if(!isOnRoad(sim.chassis.translation()))offroadTicks++;tick++;if(checkpoint===6)break}const p=sim.chassis.translation(),q=sim.chassis.rotation(),v=sim.chassis.linvel(),w=sim.chassis.angvel(),heading=Math.atan2(2*(q.x*q.z-q.w*q.y),1-2*(q.y*q.y+q.z*q.z)),travel=Math.atan2(v.z,v.x),slip=Math.atan2(Math.sin(travel-heading),Math.cos(travel-heading));trace.push({label:segment.label,t:+(tick*DT).toFixed(2),x:+p.x.toFixed(1),y:+p.y.toFixed(1),z:+p.z.toFixed(1),heading:+heading.toFixed(2),slip:+slip.toFixed(2),yawRate:+w.y.toFixed(2),steer:+sim.state.steer.toFixed(2),contacts:[0,1,2,3].filter(i=>sim.vehicle.wheelIsInContact(i)).length,sideImpulse:+[0,1,2,3].reduce((sum,i)=>sum+Math.abs(sim.vehicle.wheelSideImpulse(i)||0),0).toFixed(1),speed:+Math.abs(sim.vehicle.currentVehicleSpeed()).toFixed(1),checkpoint,onRoad:isOnRoad(p)});if(checkpoint===6)break}
  return{trace,checkpoint,offroadSeconds:offroadTicks*DT,sim};
}
const I={forward:{forward:true},right:{forward:true,right:true},left:{forward:true,left:true},brake:{reverse:true},brakeRight:{reverse:true,right:true},brakeLeft:{reverse:true,left:true},coast:{}};
const opening=startTurn=>run([{label:"launch",seconds:startTurn,input:I.forward},{label:"turn",seconds:1.2,input:I.left},{label:"release",seconds:1.2,input:I.forward}]);
for(const timing of[7.5,7.7,7.9,8.1]){const result=opening(timing);console.log("opening",timing,JSON.stringify(result.trace));const p=result.sim.chassis.translation(),q=result.sim.chassis.rotation(),upY=1-2*(q.x*q.x+q.z*q.z);assert.ok(isOnRoad(p),`opening timing ${timing} left road`);assert.ok(upY>.8,`opening timing ${timing} rolled car`)}
console.log("Apex Run human-scale opening timing tolerance passed");
const route=run([
  {label:"launch",seconds:7.7,input:I.forward},{label:"corner 1",seconds:1.2,input:I.left},{label:"south",seconds:3.3,input:I.forward},
  {label:"wide corner 2",seconds:1.2,input:I.left},{label:"west",seconds:5,input:I.forward},
  {label:"corner 3",seconds:1.7,input:I.left},{label:"settle north",seconds:.1,input:I.right},{label:"north",seconds:7.5,input:I.forward},
  {label:"corner 4",seconds:1.5,input:I.left},{label:"east",seconds:5.2,input:I.forward},
  {label:"corner 5",seconds:1.8,input:I.left},{label:"south finish",seconds:6,input:I.forward},
]);
console.log("route development",JSON.stringify(route.trace));
assert.equal(route.checkpoint,6,"low-frequency fixed input route must complete all gates");
assert.equal(route.offroadSeconds,0,"reference route must remain on the modeled road until finish");
console.log("Apex Run low-frequency full route passed",JSON.stringify({time:route.trace.at(-1).t,segments:route.trace.length,offroadSeconds:route.offroadSeconds}));

for(let i=0;i<RECOVERY_SPOTS.length;i++){
  const spot=RECOVERY_SPOTS[i],target=CHECKPOINTS[i],forward=recoveryForward(spot.rotation),toTarget={x:target.x-spot.x,z:target.z-spot.z},dot=forward.x*toTarget.x+forward.z*toTarget.z;
  assert.ok(dot>0,`recovery ${i} faces away from gate ${i}`);
  const sim=setup(spot,spot.rotation),before=sim.chassis.translation(),beforeDistance=Math.hypot(target.x-before.x,target.z-before.z),after=driveSteps(sim,{forward:true},2),afterDistance=Math.hypot(target.x-after.x,target.z-after.z);
  assert.ok(afterDistance<beforeDistance-2,`recovery ${i} did not drive toward its gate: ${beforeDistance} -> ${afterDistance}`);
}
console.log("Apex Run recovery headings and driven exits passed");

// Recovery must also work after the controller has accumulated wheel/contact
// state. This mirrors game.js clearVehicle/place on the same chassis/controller.
const reused=setup();driveSteps(reused,{forward:true},7.7);driveSteps(reused,{forward:true,left:true},1.2);driveSteps(reused,{forward:true},1.2);
const reusedSpot=RECOVERY_SPOTS[1],reusedTarget=CHECKPOINTS[1];
for(let i=0;i<4;i++){reused.vehicle.setWheelEngineForce(i,0);reused.vehicle.setWheelBrake(i,0);reused.vehicle.setWheelSteering(i,0)}
reused.chassis.resetForces(true);reused.chassis.resetTorques(true);reused.chassis.setLinvel({x:0,y:0,z:0},true);reused.chassis.setAngvel({x:0,y:0,z:0},true);reused.chassis.setTranslation(reusedSpot,true);reused.chassis.setRotation(reusedSpot.rotation,true);reused.state.steer=0;reused.state.surfaceBlend=1;
const reusedBefore=Math.hypot(reusedTarget.x-reusedSpot.x,reusedTarget.z-reusedSpot.z),reusedAfterPosition=driveSteps(reused,{forward:true},2),reusedAfter=Math.hypot(reusedTarget.x-reusedAfterPosition.x,reusedTarget.z-reusedAfterPosition.z);
console.log("Apex Run reused-controller recovery",JSON.stringify({before:reusedBefore,after:reusedAfter,position:reusedAfterPosition}));assert.ok(reusedAfter<reusedBefore-2,`reused controller drove away after recovery: ${reusedBefore} -> ${reusedAfter}`);

const repeated=setup(),repeatedResults=[];
for(let recoveryIndex=0;recoveryIndex<RECOVERY_SPOTS.length;recoveryIndex++){
  const spot=RECOVERY_SPOTS[recoveryIndex];for(let wheel=0;wheel<4;wheel++){repeated.vehicle.setWheelEngineForce(wheel,0);repeated.vehicle.setWheelBrake(wheel,0);repeated.vehicle.setWheelSteering(wheel,0)}repeated.chassis.resetForces(true);repeated.chassis.resetTorques(true);repeated.chassis.setLinvel({x:0,y:0,z:0},true);repeated.chassis.setAngvel({x:0,y:0,z:0},true);repeated.chassis.setTranslation(spot,true);repeated.chassis.setRotation(spot.rotation,true);repeated.state.steer=0;repeated.state.surfaceBlend=1;
  assert.ok(isOnRoad(spot),`recovery ${recoveryIndex} is not on the modeled road`);let crossed=false,elapsed=0;for(;elapsed<20&&!crossed;elapsed+=.25){const position=driveSteps(repeated,{forward:true},.25);assert.ok(isOnRoad(position),`recovery ${recoveryIndex} left road before its gate at ${JSON.stringify(position)}`);crossed=checkpointAdvance(recoveryIndex,position)===recoveryIndex+1}assert.ok(crossed,`reused recovery ${recoveryIndex} never entered gate ${recoveryIndex}`);repeatedResults.push({recoveryIndex,time:+elapsed.toFixed(2)});
}
console.log("Apex Run repeated reused-controller gate entries passed",JSON.stringify(repeatedResults));

const edgeScenarios=[
  {name:"opening north shoulder",start:{x:50,y:2,z:15},rotation:{x:0,y:.7071068,z:0,w:.7071068},input:{forward:true}},
  {name:"east vertical shoulder",start:{x:116,y:2,z:-60},rotation:{x:0,y:1,z:0,w:0},input:{forward:true}},
  {name:"west vertical shoulder",start:{x:-107,y:2,z:0},rotation:{x:0,y:0,z:0,w:1},input:{forward:true}},
  {name:"north straight shoulder",start:{x:0,y:2,z:160},rotation:{x:0,y:.7071068,z:0,w:.7071068},input:{forward:true}},
  {name:"final straight shoulder",start:{x:171,y:2,z:60},rotation:{x:0,y:1,z:0,w:0},input:{forward:true}},
  {name:"reverse from grass",start:{x:50,y:2,z:15},rotation:{x:0,y:-.7071068,z:0,w:.7071068},input:{reverse:true}},
];
for(const scenario of edgeScenarios){const sim=setup(scenario.start,scenario.rotation),after=driveSteps(sim,scenario.input,2.5),speed=Math.abs(sim.vehicle.currentVehicleSpeed());assert.ok(isOnRoad(after),`${scenario.name} failed to re-enter: ${JSON.stringify(after)}`);assert.ok(speed>1,`${scenario.name} remained trapped at ${speed}`)}
console.log("Apex Run road/grass re-entry and reverse escape passed");
const grassMerge=setup({x:-82,y:2,z:115},{x:0,y:0,z:0,w:1}),grassMergePosition=driveSteps(grassMerge,{forward:true,right:true},4),grassMergeSpeed=Math.abs(grassMerge.vehicle.currentVehicleSpeed());
assert.ok(isOnRoad(grassMergePosition),`parallel grass steering failed to merge onto east road: ${JSON.stringify(grassMergePosition)}`);assert.ok(grassMergeSpeed>5,`parallel grass merge remained too slow: ${grassMergeSpeed}`);
console.log("Apex Run parallel grass steering merge passed",JSON.stringify({position:grassMergePosition,speed:+grassMergeSpeed.toFixed(2)}));
