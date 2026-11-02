import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";
import {clamp} from "./simulation.js";
import {SUSPENSION_QUERY_GROUPS,applyLowSpeedSteering,applySurfaceDrag,createVehicle,driveVehicle,stabilizeChassis} from "./vehicle-model.js";
import {ROAD_SAMPLES,ROAD_STEPS_PER_SEGMENT,START_EXTENSION_SAMPLES,TRACK_BOXES,buildRoadColliderMesh,buildRoadMesh,isOnRoad,nearestRoadSample} from "./track-model.js";

await RAPIER.init();
const DT=1/120,TARGET_STRIDE=Math.round(6*ROAD_STEPS_PER_SEGMENT/22);
const targets=ROAD_SAMPLES.filter((_,index)=>index%TARGET_STRIDE===0).map(({x,z})=>[x,z]);targets.push([ROAD_SAMPLES.at(-1).x,ROAD_SAMPLES.at(-1).z]);
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]||0;
const rms=values=>Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/(values.length||1));
const rotateLocalZ=q=>({x:2*(q.x*q.z+q.w*q.y),y:2*(q.y*q.z-q.w*q.x),z:1-2*(q.x*q.x+q.y*q.y)});

function setup(steps){
  const world=new RAPIER.World({x:0,y:-16,z:0});world.integrationParameters.dt=DT;
  for(const {x,y,z,hx,hy,hz,surface} of TRACK_BOXES)world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setFriction(surface==="grass"?1:1.1));
  const mesh=buildRoadMesh(steps),surface=buildRoadColliderMesh(mesh.samples);world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(surface.positions),new Uint32Array(surface.indices)).setFriction(1.1));
  return{world,...createVehicle(RAPIER,world),state:{steer:0,surfaceBlend:1}};
}
function run(steps,recordedInputs=null){
  const sim=setup(steps),inputTape=[],verticalAcceleration=[],pitchRate=[],suspensionDelta=[],normalDelta=[],suspensionForce=[];let target=1,previousVy=0,previousLengths=[.48,.48,.48,.48],previousNormals=[1,1,1,1],smoothTicks=0;
  // Keep the comparison bounded to the same opening straight, sweeper and
  // climb approach. A whole-lap replay would eventually diverge spatially on
  // the coarse surface and cease to be a matched experiment.
  for(let tick=0;tick<1000;tick++){
    const p=sim.chassis.translation(),q=sim.chassis.rotation();while(target<targets.length-1&&Math.hypot(targets[target][0]-p.x,targets[target][1]-p.z)<10)target++;
    const desired=Math.atan2(targets[target][1]-p.z,targets[target][0]-p.x),forward=Math.atan2(2*(q.x*q.z-q.w*q.y),1-2*(q.y*q.y+q.z*q.z)),angle=Math.atan2(Math.sin(desired-forward),Math.cos(desired-forward)),desiredSteer=clamp(-angle*1.8,-1,1),speed=Math.abs(sim.vehicle.currentVehicleSpeed()),braking=Math.abs(angle)>.12&&speed>24,steerTicks=Math.ceil(Math.abs(desiredSteer)*12),generated={forward:!braking,reverse:braking,left:tick%12<steerTicks&&desiredSteer>0,right:tick%12<steerTicks&&desiredSteer<0};
    const input=recordedInputs?.[tick]||generated;if(!recordedInputs)inputTape.push({...input});const drive=driveVehicle(sim.vehicle,sim.state,input,DT,isOnRoad(p));applySurfaceDrag(sim.chassis,drive.surfaceBlend,DT);applyLowSpeedSteering(sim.chassis,sim.vehicle,input,DT);stabilizeChassis(sim.chassis,sim.vehicle,DT);sim.vehicle.updateVehicle(DT,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,SUSPENSION_QUERY_GROUPS);sim.world.step();
    const at=sim.chassis.translation(),sample=nearestRoadSample(at),sampleIndex=ROAD_SAMPLES.indexOf(sample),segment=Math.floor(Math.max(0,sampleIndex-START_EXTENSION_SAMPLES)/ROAD_STEPS_PER_SEGMENT),contacts=[0,1,2,3].filter(wheel=>sim.vehicle.wheelIsInContact(wheel)).length,velocity=sim.chassis.linvel(),lengths=[0,1,2,3].map(wheel=>sim.vehicle.wheelSuspensionLength(wheel)),normals=[0,1,2,3].map(wheel=>sim.vehicle.wheelContactNormal(wheel)?.y??previousNormals[wheel]);
    // Segment five is the intentional crest/jump. Measure ordinary supported
    // road only, after launch settling, so the metric cannot reward removing it.
    if(tick>240&&segment!==5&&contacts===4&&isOnRoad(at)){
      verticalAcceleration.push((velocity.y-previousVy)/DT);const lateral=rotateLocalZ(sim.chassis.rotation()),angular=sim.chassis.angvel();pitchRate.push(angular.x*lateral.x+angular.y*lateral.y+angular.z*lateral.z);
      for(let wheel=0;wheel<4;wheel++){suspensionDelta.push((lengths[wheel]-previousLengths[wheel])/DT);normalDelta.push((normals[wheel]-previousNormals[wheel])/DT);suspensionForce.push(sim.vehicle.wheelSuspensionForce(wheel))}smoothTicks++;
    }
    previousVy=velocity.y;previousLengths=lengths;previousNormals=normals;if(target===targets.length-1&&Math.hypot(targets[target][0]-at.x,targets[target][1]-at.z)<12)break;
  }
  const metrics={steps,smoothTicks,verticalAccelRms:rms(verticalAcceleration),verticalAccelP95:percentile(verticalAcceleration.map(Math.abs),.95),pitchRateRms:rms(pitchRate),pitchRateP95:percentile(pitchRate.map(Math.abs),.95),suspensionVelocityRms:rms(suspensionDelta),suspensionVelocityP95:percentile(suspensionDelta.map(Math.abs),.95),contactNormalRateRms:rms(normalDelta),contactNormalRateP95:percentile(normalDelta.map(Math.abs),.95),suspensionForceRms:rms(suspensionForce)};return{metrics,inputTape};
}

const production=run(ROAD_STEPS_PER_SEGMENT),coarse=run(22,production.inputTape),fine=production.metrics,baseline=coarse.metrics;
assert.ok(fine.smoothTicks>650&&baseline.smoothTicks>650,"surface probe did not collect enough supported non-jump samples");
assert.ok(Math.abs(fine.smoothTicks-baseline.smoothTicks)<150,"matched surface probes diverged before comparison completed");
// Chassis vertical acceleration includes real banking/climb load and changes
// little here; the visible rocky-road symptom is supported by the much lower
// pitch motion and suspension travel, so those are the regression gates.
assert.ok(fine.pitchRateRms<baseline.pitchRateRms*.7,`denser road did not reduce chassis pitch chatter: ${JSON.stringify({baseline,fine})}`);
assert.ok(fine.suspensionVelocityRms<baseline.suspensionVelocityRms*.9,`denser road did not reduce suspension chatter: ${JSON.stringify({baseline,fine})}`);
console.log("Apex Run matched-input road smoothness passed",JSON.stringify({method:"identical 120 Hz keyboard-like tape; four-wheel supported samples; intentional crest segment excluded",baseline,fine},null,2));
