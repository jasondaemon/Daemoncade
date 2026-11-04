import assert from "node:assert/strict";
import {VEHICLE,driveVehicle} from "./vehicle-model.js";

function mockVehicle(speed=20){
  const calls={engine:[],brake:[],steering:[],grip:[]};
  return{calls,currentVehicleSpeed:()=>speed,setWheelEngineForce:(i,v)=>calls.engine[i]=v,setWheelBrake:(i,v)=>calls.brake[i]=v,setWheelSteering:(i,v)=>calls.steering[i]=v,setWheelFrictionSlip:(i,v)=>calls.grip[i]=v};
}
const state={steer:0},road=mockVehicle(),grass=mockVehicle();
driveVehicle(road,state,{forward:true,right:true},1/120,true);
driveVehicle(grass,{steer:0},{forward:true,right:true},1/120,false);
const expectedRoadEngine=VEHICLE.engine+(VEHICLE.launchEngine-VEHICLE.engine)*(1-20/VEHICLE.launchFadeSpeed);
assert.equal(road.calls.engine[0],expectedRoadEngine);
assert.equal(grass.calls.engine[0],expectedRoadEngine*.8);
assert.equal(road.calls.grip[0],VEHICLE.roadGrip);
assert.equal(grass.calls.grip[0],VEHICLE.offroadGrip);
assert.ok(Math.abs(grass.calls.engine[0])<Math.abs(road.calls.engine[0]));
const launch=mockVehicle(0),cruise=mockVehicle(VEHICLE.launchFadeSpeed);driveVehicle(launch,{steer:0},{forward:true},1/120,true,0);driveVehicle(cruise,{steer:0},{forward:true},1/120,true,VEHICLE.launchFadeSpeed);assert.equal(launch.calls.engine[0],VEHICLE.launchEngine);assert.equal(cruise.calls.engine[0],VEHICLE.engine);
const drift=mockVehicle();driveVehicle(drift,{steer:0},{forward:true,handbrake:true},1/120,true);
assert.equal(drift.calls.grip[2],VEHICLE.driftGrip);assert.equal(drift.calls.brake[2],VEHICLE.handbrakeRear);
const braking=mockVehicle(),brakeState={steer:0};driveVehicle(braking,brakeState,{reverse:true},1/120,true);assert.equal(braking.calls.brake[0],VEHICLE.serviceBrake);assert.equal(braking.calls.engine[0],0);braking.currentVehicleSpeed=()=>0;for(let i=0;i<120;i++)driveVehicle(braking,brakeState,{reverse:true},1/120,true);assert.equal(braking.calls.engine[0],0,"holding service brake through zero must not reverse");driveVehicle(braking,brakeState,{},1/120,true);driveVehicle(braking,brakeState,{reverse:true},1/120,true);assert.ok(braking.calls.engine[0]<0,"release and repress at rest must select reverse");
const slipping=mockVehicle(.51),slippingState={steer:0};driveVehicle(slipping,slippingState,{reverse:true},1/120,true,.08);assert.ok(slipping.calls.engine[0]<0,"stationary chassis must select reverse despite residual wheel speed");
const boundary=mockVehicle(),boundaryState={steer:0};driveVehicle(boundary,boundaryState,{forward:true},1/120,true);const before=boundary.calls.engine[0];driveVehicle(boundary,boundaryState,{forward:true},1/120,false);assert.ok(before-boundary.calls.engine[0]<VEHICLE.engine*.03);for(let i=0;i<40;i++)driveVehicle(boundary,boundaryState,{forward:true},1/120,false);assert.ok(boundary.calls.engine[0]<before*.85);

// Digital steering should build deliberately enough for readable half-second
// corrections, still reach full lock for hairpins, and unwind/countersteer
// promptly. These are controller-state checks, independent of a route tape.
const digital=mockVehicle(50/3.6),digitalState={steer:0};
for(let i=0;i<60;i++)driveVehicle(digital,digitalState,{forward:true,left:true},1/120,true,50/3.6);
assert.ok(digitalState.steer>.58&&digitalState.steer<.62,`half-second steering build left its player envelope: ${digitalState.steer}`);
for(let i=0;i<60;i++)driveVehicle(digital,digitalState,{forward:true,left:true},1/120,true,50/3.6);
assert.equal(digitalState.steer,1,"one-second hold must retain full hairpin authority");
for(let i=0;i<24;i++)driveVehicle(digital,digitalState,{forward:true},1/120,true,50/3.6);
assert.ok(Math.abs(digitalState.steer)<1e-9,"released steering did not self-center within 200 ms");
for(let i=0;i<120;i++)driveVehicle(digital,digitalState,{forward:true,left:true},1/120,true,50/3.6);
for(let i=0;i<60;i++)driveVehicle(digital,digitalState,{forward:true,right:true},1/120,true,50/3.6);
assert.ok(digitalState.steer<-.3,"half-second countersteer did not cross center decisively");
console.log("Apex Run shared vehicle tests passed");
