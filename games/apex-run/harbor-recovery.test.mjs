import assert from "node:assert/strict";
import RAPIER from "./vendor/rapier-0.17.3.js";

globalThis.location={search:"?track=harbor-run"};
const model=await import("./track-model.js?harbor-recovery-v2"),{RaceController}=await import("./race-controller.js?harbor-recovery-v2"),vehicleModel=await import("./vehicle-model.js?harbor-recovery-v2");
await RAPIER.init();

function worldAt(spot){
  const world=new RAPIER.World({x:0,y:-16,z:0});world.integrationParameters.dt=1/120;
  const grass=model.TRACK_BOXES.find(box=>box.surface==="grass");world.createCollider(RAPIER.ColliderDesc.cuboid(grass.hx,grass.hy,grass.hz).setTranslation(grass.x,grass.y,grass.z).setFriction(1.1));
  const surface=model.buildRoadColliderMesh();world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(surface.positions),new Uint32Array(surface.indices),RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(1.1));
  const {chassis,vehicle}=vehicleModel.createVehicle(RAPIER,world,spot);chassis.setRotation(spot.rotation,true);return{world,chassis,vehicle,state:{steer:0,surfaceBlend:1}};
}

assert.equal(model.RECOVERY_SPOTS.length,9);
for(const [checkpoint,spot] of model.RECOVERY_SPOTS.entries()){
  const race=new RaceController();race.state="racing";race.checkpoint=checkpoint;race.recover();assert.equal(race.checkpoint,checkpoint,`sector ${checkpoint+1} retry changed ordered progress`);assert.equal(race.eligible,false);
  const sim=worldAt(spot),forward=model.recoveryForward(spot.rotation),before={...sim.chassis.translation()};
  for(let tick=0;tick<240;tick++){vehicleModel.driveVehicle(sim.vehicle,sim.state,{forward:true},1/120,true);vehicleModel.stabilizeChassis(sim.chassis,sim.vehicle,1/120);sim.vehicle.updateVehicle(1/120,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,vehicleModel.SUSPENSION_QUERY_GROUPS);sim.world.step()}
  const after=sim.chassis.translation(),advance=(after.x-before.x)*forward.x+(after.z-before.z)*forward.z;
  assert.ok(advance>2,`sector ${checkpoint+1} recovery cannot accelerate down-route: ${advance}`);assert.ok(model.isOnRoad(after),`sector ${checkpoint+1} recovery left the authored deck`);assert.equal(model.checkpointAdvance(checkpoint,after),checkpoint,`sector ${checkpoint+1} recovery awarded its gate without driving the sector`);
}
console.log("Harbor v2 sector recoveries launch cleanly from rest");
