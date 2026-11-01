import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {VEHICLE,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";
import {TRACK_BOXES,isOnRoad,checkpointAdvance} from "./track-model.js";

await RAPIER.init();
const DT=1/120;
function setup(){
  const world=new RAPIER.World({x:0,y:VEHICLE.gravity,z:0});world.integrationParameters.dt=DT;
  const roadHandles=new Set();
  for(const {x,y,z,hx,hy,hz,rx=0,rz=0,surface="road"} of TRACK_BOXES){const q={x:Math.sin(rx/2),y:0,z:Math.sin(rz/2),w:Math.cos(rx/2)*Math.cos(rz/2)},c=world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(q).setFriction(1.1));if(surface!=="grass")roadHandles.add(c.handle)}
  const result=createVehicle(RAPIER,world),state={steer:0,surfaceBlend:1};
  for(let t=0;t<360;t++){driveVehicle(result.vehicle,state,{},DT,true);for(let i=0;i<4;i++)result.vehicle.setWheelBrake(i,5000);result.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()}
  return{world,...result,state,roadHandles};
}
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
  {label:"brake corner 2",seconds:1.25,input:I.brakeLeft},{label:"settle 2",seconds:1,input:I.brake},{label:"align west",seconds:.3,input:I.right},{label:"west",seconds:6,input:I.forward},
  {label:"west gate",seconds:.25,input:I.forward},{label:"brake corner 3",seconds:1.45,input:I.brakeLeft},{label:"settle 3",seconds:.8,input:I.brake},{label:"align north",seconds:.45,input:I.right},{label:"north",seconds:8,input:I.forward},
  {label:"brake corner 4",seconds:1.25,input:I.brakeLeft},{label:"settle 4",seconds:.8,input:I.brake},{label:"east",seconds:6.7,input:I.forward},
  {label:"brake corner 5",seconds:1.3,input:I.brakeLeft},{label:"settle 5",seconds:.8,input:I.brake},{label:"align south",seconds:.2,input:I.right},{label:"south finish",seconds:6,input:I.forward},
]);
console.log("route development",JSON.stringify(route.trace));
assert.equal(route.checkpoint,6,"low-frequency fixed input route must complete all gates");
assert.equal(route.offroadSeconds,0,"reference route must remain on the modeled road until finish");
console.log("Apex Run low-frequency full route passed",JSON.stringify({time:route.trace.at(-1).t,segments:route.trace.length,offroadSeconds:route.offroadSeconds}));
