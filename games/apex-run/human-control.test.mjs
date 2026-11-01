import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {VEHICLE,applySurfaceDrag,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";
import {TRACK_BOXES,RECOVERY_SPOTS,ROAD_SAMPLES,buildRoadMesh,isOnRoad,checkpointAdvance,recoveryForward} from "./track-model.js";

await RAPIER.init();
const DT=1/120;
function setup(start={x:-2,y:2.2,z:0},rotation=null){
  const world=new RAPIER.World({x:0,y:VEHICLE.gravity,z:0});world.integrationParameters.dt=DT;
  const roadHandles=new Set();
  for(const {x,y,z,hx,hy,hz,rx=0,rz=0,surface="road"} of TRACK_BOXES){const q={x:Math.sin(rx/2),y:0,z:Math.sin(rz/2),w:Math.cos(rx/2)*Math.cos(rz/2)},c=world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(q).setFriction(1.1));if(surface!=="grass")roadHandles.add(c.handle)}
  const road=buildRoadMesh(22),roadCollider=world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(road.positions),new Uint32Array(road.indices)).setFriction(1.1));roadHandles.add(roadCollider.handle);
  const result=createVehicle(RAPIER,world,start),state={steer:0,surfaceBlend:1};if(rotation)result.chassis.setRotation(rotation,true);
  for(let t=0;t<360;t++){driveVehicle(result.vehicle,state,{},DT,true);for(let i=0;i<4;i++)result.vehicle.setWheelBrake(i,5000);result.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()}
  return{world,...result,state,roadHandles};
}
function driveSteps(sim,input,seconds){for(let n=0;n<Math.round(seconds/DT);n++){const p=sim.chassis.translation(),wheelRoad=[0,1,2,3].map(i=>{const c=sim.vehicle.wheelGroundObject(i);return c?sim.roadHandles.has(c.handle):isOnRoad(p)}),drive=driveVehicle(sim.vehicle,sim.state,input,DT,wheelRoad);applySurfaceDrag(sim.chassis,drive.surfaceBlend,DT);stabilizeChassis(sim.chassis,sim.vehicle,DT);sim.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);sim.world.step()}return sim.chassis.translation()}
function run(segments){const sim=setup(),trace=[];let checkpoint=0,tick=0,offroadTicks=0;
  for(const segment of segments){let lastWheelRoad=[true,true,true,true],lastDrive={surfaceBlend:1,engine:0},maxDrag=0;for(let n=0;n<Math.round(segment.seconds/DT);n++){const p=sim.chassis.translation(),wheelRoad=[0,1,2,3].map(i=>{const c=sim.vehicle.wheelGroundObject(i);return c?sim.roadHandles.has(c.handle):isOnRoad(p)}),drive=driveVehicle(sim.vehicle,sim.state,segment.input,DT,wheelRoad),drag=applySurfaceDrag(sim.chassis,drive.surfaceBlend,DT);lastWheelRoad=wheelRoad;lastDrive=drive;maxDrag=Math.max(maxDrag,drag);stabilizeChassis(sim.chassis,sim.vehicle,DT);sim.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);sim.world.step();checkpoint=checkpointAdvance(checkpoint,sim.chassis.translation());if(!isOnRoad(sim.chassis.translation()))offroadTicks++;tick++;if(checkpoint===6)break}const p=sim.chassis.translation(),q=sim.chassis.rotation(),v=sim.chassis.linvel(),w=sim.chassis.angvel(),heading=Math.atan2(2*(q.x*q.z-q.w*q.y),1-2*(q.y*q.y+q.z*q.z)),travel=Math.atan2(v.z,v.x),slip=Math.atan2(Math.sin(travel-heading),Math.cos(travel-heading));trace.push({label:segment.label,t:+(tick*DT).toFixed(2),x:+p.x.toFixed(1),y:+p.y.toFixed(1),z:+p.z.toFixed(1),heading:+heading.toFixed(2),slip:+slip.toFixed(2),yawRate:+w.y.toFixed(2),steer:+sim.state.steer.toFixed(2),wheelRoad:lastWheelRoad.map(Number).join(""),surfaceBlend:+lastDrive.surfaceBlend.toFixed(2),engine:+lastDrive.engine.toFixed(0),maxDrag:+maxDrag.toFixed(0),contacts:[0,1,2,3].filter(i=>sim.vehicle.wheelIsInContact(i)).length,sideImpulse:+[0,1,2,3].reduce((sum,i)=>sum+Math.abs(sim.vehicle.wheelSideImpulse(i)||0),0).toFixed(1),speed:+Math.abs(sim.vehicle.currentVehicleSpeed()).toFixed(1),checkpoint,onRoad:isOnRoad(p)});if(checkpoint===6)break}
  return{trace,checkpoint,offroadSeconds:offroadTicks*DT,sim};
}
const I={forward:{forward:true},right:{forward:true,right:true},left:{forward:true,left:true},brake:{reverse:true},brakeRight:{reverse:true,right:true},brakeLeft:{reverse:true,left:true},coast:{}};
const opening=startTurn=>run([{label:"launch",seconds:startTurn,input:I.forward},{label:"turn",seconds:.65,input:I.left},{label:"release",seconds:1.2,input:I.forward}]);
for(const timing of[7.3,7.5,7.7,7.9]){const result=opening(timing);console.log("opening",timing,JSON.stringify(result.trace));const p=result.sim.chassis.translation(),q=result.sim.chassis.rotation(),upY=1-2*(q.x*q.x+q.z*q.z);assert.ok(isOnRoad(p),`opening timing ${timing} left road`);assert.ok(upY>.8,`opening timing ${timing} rolled car`)}
console.log("Apex Run human-scale opening timing tolerance passed");
const recoveryResults=[];
for(let i=0;i<RECOVERY_SPOTS.length;i++){
  const spot=RECOVERY_SPOTS[i],forward=recoveryForward(spot.rotation),sim=setup(spot,spot.rotation),before=sim.chassis.translation(),after=driveSteps(sim,{forward:true},1.5),motion={x:after.x-before.x,z:after.z-before.z};
  assert.ok(isOnRoad(spot),`recovery ${i} is not on the spline road`);
  assert.ok(motion.x*forward.x+motion.z*forward.z>1.5,`recovery ${i} did not move along its route tangent`);
  assert.ok(isOnRoad(after),`recovery ${i} immediately left the modeled road`);
  recoveryResults.push({i,distance:+Math.hypot(motion.x,motion.z).toFixed(1),y:+after.y.toFixed(1)});
}
console.log("Apex Run spline recovery exits passed",JSON.stringify(recoveryResults));

// The elevated back section must use the same trimesh as the rendered road.
// A short straight launch toward the crest verifies suspension contact and
// vertical travel without relying on the obsolete rectangular course tape.
const rampSample=ROAD_SAMPLES[5*22+2],rampHalf=-rampSample.heading/2,rampRotation={x:0,y:Math.sin(rampHalf),z:0,w:Math.cos(rampHalf)},ramp=setup({x:rampSample.x,y:rampSample.y+1.7,z:rampSample.z},rampRotation);ramp.chassis.setLinvel({x:Math.cos(rampSample.heading)*34,y:0,z:Math.sin(rampSample.heading)*34},true);let maxY=-Infinity,minContacts=4,airborne=false,landed=false,landingTicks=0;
for(let tick=0;tick<600&&!landed;tick++){driveSteps(ramp,{forward:true},DT);const p=ramp.chassis.translation(),contacts=[0,1,2,3].filter(i=>ramp.vehicle.wheelIsInContact(i)).length;maxY=Math.max(maxY,p.y);minContacts=Math.min(minContacts,contacts);if(contacts===0){airborne=true;landingTicks=0}else if(airborne&&contacts>=2){landingTicks++;if(landingTicks>=30)landed=true}}
assert.ok(maxY>rampSample.y+3,"crest failed to produce meaningful vertical travel");
assert.ok(airborne&&landed,"crest must produce a real jump and suspension landing");
assert.ok(isOnRoad(ramp.chassis.translation()),`jump did not land on the modeled road: ${JSON.stringify(ramp.chassis.translation())}`);
console.log("Apex Run elevated crest traversal passed",JSON.stringify({startY:+rampSample.y.toFixed(1),maxY:+maxY.toFixed(1),endY:+ramp.chassis.translation().y.toFixed(1),minContacts}));
