import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {VEHICLE,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";

await RAPIER.init();
const DT=1/120;
function heading(q){return Math.atan2(2*(q.x*q.z-q.w*q.y),1-2*(q.y*q.y+q.z*q.z))}
function sample(kmh,seconds,onRoad){
  const world=new RAPIER.World({x:0,y:VEHICLE.gravity,z:0});world.integrationParameters.dt=DT;world.createCollider(RAPIER.ColliderDesc.cuboid(300,1,300).setTranslation(0,-1.2,0).setFriction(1.1));
  const{chassis,vehicle}=createVehicle(RAPIER,world),state={steer:0,surfaceBlend:onRoad?1:0};for(let i=0;i<360;i++){driveVehicle(vehicle,state,{},DT,onRoad);for(let w=0;w<4;w++)vehicle.setWheelBrake(w,6000);vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step()}
  chassis.setLinvel({x:kmh/3.6,y:0,z:0},true);let maxYaw=0,yawTravel=0,sideImpulse=0,contacts=0;for(let i=0;i<Math.round(seconds/DT);i++){driveVehicle(vehicle,state,{forward:true,left:true},DT,onRoad);stabilizeChassis(chassis,vehicle);vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step();const yaw=Math.abs(chassis.angvel().y);maxYaw=Math.max(maxYaw,yaw);yawTravel+=yaw*DT;sideImpulse=Math.max(sideImpulse,[0,1,2,3].reduce((s,w)=>s+Math.abs(vehicle.wheelSideImpulse(w)||0),0));contacts=Math.max(contacts,[0,1,2,3].filter(w=>vehicle.wheelIsInContact(w)).length)}
  const turn=Math.abs(heading(chassis.rotation()));return{kmh,seconds,surface:onRoad?"road":"grass",heading:+turn.toFixed(3),yawTravel:+yawTravel.toFixed(3),yaw:+maxYaw.toFixed(3),sideImpulse:+sideImpulse.toFixed(1),contacts,speed:+(Math.abs(vehicle.currentVehicleSpeed())*3.6).toFixed(1)};
}
const matrix=[];for(const onRoad of[true,false])for(const kmh of[10,30,50,80,120]){const row=[.5,.75,1].map(seconds=>sample(kmh,seconds,onRoad));matrix.push(...row);assert.ok(row[0].heading<row[1].heading&&row[1].heading<row[2].heading,`turn response must grow with held input: ${JSON.stringify(row)}`);assert.ok(row.every(v=>v.contacts>=2&&v.yaw>0&&v.sideImpulse>0),`tires must remain physically active: ${JSON.stringify(row)}`)}
const grassUturn=sample(10,6,false);assert.ok(grassUturn.yawTravel>2.85,`low-speed grass steering cannot U-turn: ${JSON.stringify(grassUturn)}`);
console.log("Apex Run handling response matrix",JSON.stringify(matrix));console.log("Apex Run grass U-turn passed",JSON.stringify(grassUturn));
