import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {VEHICLE,createVehicle,driveVehicle,applyLowSpeedSteering} from "./vehicle-model.js";

await RAPIER.init();
const DT=1/120;
function probe(side){
  const world=new RAPIER.World({x:0,y:VEHICLE.gravity,z:0});world.integrationParameters.dt=DT;
  world.createCollider(RAPIER.ColliderDesc.cuboid(100,.2,5).setTranslation(0,-.2,0).setFriction(1.1));
  world.createCollider(RAPIER.ColliderDesc.cuboid(100,.55,.12).setTranslation(0,.55,side*5.12).setFriction(.08));
  world.createCollider(RAPIER.ColliderDesc.cylinder(.4,.85).setTranslation(0,.4,side*3.1).setFriction(.18));
  const{chassis,vehicle}=createVehicle(RAPIER,world),state={steer:0,surfaceBlend:1};
  chassis.setTranslation({x:-4,y:1.5,z:side*3.8},true);
  const step=input=>{const velocity=chassis.linvel(),speed=Math.hypot(velocity.x,velocity.z);driveVehicle(vehicle,state,input,DT,true,speed);applyLowSpeedSteering(chassis,vehicle,input,DT);vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()};
  for(let tick=0;tick<180;tick++)step({});
  chassis.setLinvel({x:5,y:0,z:0},true);
  let minimumSpeed=Infinity;for(let tick=0;tick<180;tick++){step({forward:true});minimumSpeed=Math.min(minimumSpeed,Math.hypot(chassis.linvel().x,chassis.linvel().z))}
  let brakeTicks=0;while(Math.hypot(chassis.linvel().x,chassis.linvel().z)>.25&&brakeTicks++<240)step({reverse:true});
  for(let tick=0;tick<20;tick++)step({});
  const reverseStart={...chassis.translation()};let reverseTravel=0,reverseTicks=0;while(reverseTicks++<360&&reverseTravel<5){step({reverse:true});const at=chassis.translation();reverseTravel=Math.hypot(at.x-reverseStart.x,at.z-reverseStart.z)}
  for(let tick=0;tick<20;tick++)step({});
  let forwardBrakeTicks=0;while(Math.hypot(chassis.linvel().x,chassis.linvel().z)>.25&&forwardBrakeTicks++<240)step({forward:true});
  for(let tick=0;tick<20;tick++)step({});
  for(let tick=0;tick<80;tick++)step({forward:true,[side>0?"left":"right"]:true});
  for(let tick=0;tick<180;tick++)step({forward:true});
  const end=chassis.translation(),speed=Math.hypot(chassis.linvel().x,chassis.linvel().z),q=chassis.rotation();
  return{side,minimumSpeed,brakeTicks,reverseTicks,reverseTravel,forwardBrakeTicks,end:{x:end.x,z:end.z},speed,upY:1-2*(q.x*q.x+q.z*q.z)};
}
const probes=[probe(-1),probe(1)];
console.log("Summit traffic-island escape diagnostics",probes);
for(const result of probes){
  assert.ok(result.brakeTicks<240,"island/rail pin could not establish a controlled stop");
  assert.ok(result.reverseTravel>.75,"release/repress reverse did not clear the traffic island");
  assert.ok(result.forwardBrakeTicks<240,"forward release/repress could not stop the reverse escape cleanly");
  assert.ok(Math.abs(result.end.z)<2.7,`steer-away failed to rejoin the open lane: ${JSON.stringify(result)}`);
  assert.ok(result.speed>5&&result.end.x>1.5,"forward rejoin remained pinned or recontacted the island");
  assert.ok(result.upY>.7,"traffic-island escape rolled the car");
}
console.log("Summit traffic-island reverse and rejoin passed",probes);
