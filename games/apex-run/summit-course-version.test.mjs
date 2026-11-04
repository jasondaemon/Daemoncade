import assert from "node:assert/strict";

globalThis.location={search:"?track=summit-circuit"};
const simulation=await import("./simulation.js?summit-course-v2");
const {createGarageState,recordRaceOutcome,validateRaceOutcome}=await import("./garage-progression.js?summit-course-v2");

assert.equal(simulation.BEST_KEY,"apex-run:track:summit-circuit:pb:v9");
assert.equal(simulation.REPLAY_KEY,"apex-run:track:summit-circuit:replay:v10");
assert.equal(simulation.REPLAY_VERSION,10);

const legacyReplay=JSON.stringify({version:9,time:150,hz:15,frames:[[0,-380,2,-280,0,0,0,1],[2250,650,3,-120,0,0,0,1]]}),memory=new Map([
  ["apex-run:track:summit-circuit:pb:v8","150"],
  ["apex-run:track:summit-circuit:replay:v9",legacyReplay],
]),storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value))};
assert.equal(simulation.readBest(storage),null,"v1 Summit PB leaked into the revised course");
assert.equal(simulation.readReplay(storage),null,"v1 Summit ghost leaked into the revised course");
assert.equal(memory.get("apex-run:track:summit-circuit:pb:v8"),"150","legacy Summit PB was destroyed");
assert.equal(memory.get("apex-run:track:summit-circuit:replay:v9"),legacyReplay,"legacy Summit ghost was destroyed");

const checkpointTimes=[20,40,60,80,100,125,158],outcome={schema:1,source:"apex-run-race",runId:"run:summit-v2:0001",trackId:"summit-circuit",courseVersion:2,time:158,finished:true,eligible:true,practice:false,debug:false,recoveryCount:0,checkpointCount:7,checkpointTimes};
assert.equal(validateRaceOutcome({...outcome,courseVersion:1}),null,"legacy course outcome was accepted as v2 progression");
const state=createGarageState();state.stats.cleanFinishes=6;state.stats.tracks["summit-circuit"]={cleanFinishes:3,best:150,bestCourseVersion:1};state.stats.medals.GOLD=2;state.achievements["first-clean-finish"]={unlockedAt:"2026-01-01T00:00:00.000Z"};
const result=recordRaceOutcome(state,outcome,{now:Date.UTC(2026,10,4)});
assert.equal(result.accepted,true);assert.equal(result.state.stats.cleanFinishes,7);assert.equal(result.state.stats.tracks["summit-circuit"].cleanFinishes,4,"historic Summit finish count was reset");
assert.equal(result.state.stats.tracks["summit-circuit"].best,158,"incomparable v1 best survived as the active v2 best");assert.equal(result.state.stats.tracks["summit-circuit"].bestCourseVersion,2);
assert.equal(result.state.stats.medals.GOLD,2,"historic medal count was rewritten");assert.ok(result.state.achievements["first-clean-finish"],"earned achievement was revoked");
console.log("Summit v1/v2 records and progression are isolated");
