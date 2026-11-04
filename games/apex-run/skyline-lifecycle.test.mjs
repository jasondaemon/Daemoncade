import assert from "node:assert/strict";

globalThis.location={search:"?track=skyline-gauntlet"};
const simulation=await import("./simulation.js?skyline-lifecycle");
const {RaceController}=await import("./race-controller.js?skyline-lifecycle");
const model=await import("./track-model.js?skyline-lifecycle");

assert.equal(simulation.BEST_KEY,"apex-run:track:skyline-gauntlet:pb:v1");
assert.equal(simulation.REPLAY_KEY,"apex-run:track:skyline-gauntlet:replay:v1");
assert.notEqual(simulation.BEST_KEY,"apex-run:pb:v9");
const storage=new Map(),local={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
const frames=[[0,0,2,0,0,0,0,1],[3037,20,2,0,0,0,0,1]];
const result=simulation.commitResult(local,null,202.5,frames,{eligible:true});
assert.equal(result.isBest,true);assert.equal(simulation.readBest(local),202.5);assert.equal(simulation.readReplay(local)?.time,202.5);

for(let checkpoint=0;checkpoint<model.CHECKPOINTS.length;checkpoint++){
  const race=new RaceController();race.state="racing";race.checkpoint=checkpoint;race.recover();
  assert.equal(race.checkpoint,checkpoint,`sector ${checkpoint} recovery awarded or removed progress`);
  assert.equal(race.eligible,false,`sector ${checkpoint} recovery did not invalidate PB eligibility`);
  const restart=model.recoverySpotForCheckpoint(checkpoint),expected=model.RECOVERY_SPOTS[checkpoint];
  assert.deepEqual(restart,expected,`sector ${checkpoint} recovery does not use its run-up`);
  const forward=model.recoveryForward(restart.rotation);assert.ok(forward.x**2+forward.z**2>.9,`sector ${checkpoint} recovery cannot accelerate down-route`);
}
console.log("Skyline lifecycle and storage passed");
