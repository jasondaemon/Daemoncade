import assert from "node:assert/strict";

globalThis.location={search:"?track=harbor-run"};
const simulation=await import("./simulation.js?harbor-course-v2");
const {createGarageState,recordRaceOutcome,validateRaceOutcome}=await import("./garage-progression.js?harbor-course-v2");

assert.equal(simulation.BEST_KEY,"apex-run:track:harbor-run:pb:v2");
assert.equal(simulation.REPLAY_KEY,"apex-run:track:harbor-run:replay:v2");
assert.equal(simulation.REPLAY_VERSION,2);

const legacyReplay=JSON.stringify({version:1,time:150,hz:15,frames:[[0,-560,2,-260,0,0,0,1],[2250,590,3,-25,0,0,0,1]]}),memory=new Map([
  ["apex-run:track:harbor-run:pb:v1","150"],
  ["apex-run:track:harbor-run:replay:v1",legacyReplay],
]),storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value))};
assert.equal(simulation.readBest(storage),null,"v1 Harbor PB leaked into the revised course");
assert.equal(simulation.readReplay(storage),null,"v1 Harbor ghost leaked into the revised course");
assert.equal(memory.get("apex-run:track:harbor-run:pb:v1"),"150","legacy PB was destroyed");
assert.equal(memory.get("apex-run:track:harbor-run:replay:v1"),legacyReplay,"legacy ghost was destroyed");

const checkpointTimes=[20,40,60,80,100,125,148,170,190],outcome={schema:1,source:"apex-run-race",runId:"run:harbor-v2:0001",trackId:"harbor-run",courseVersion:2,time:190,finished:true,eligible:true,practice:false,debug:false,recoveryCount:0,checkpointCount:9,checkpointTimes};
assert.equal(validateRaceOutcome({...outcome,courseVersion:1}),null,"legacy course outcome was accepted as v2 progression");
assert.equal(validateRaceOutcome({...outcome,checkpointCount:7,checkpointTimes:checkpointTimes.slice(0,7)}),null,"old checkpoint topology was accepted");

const state=createGarageState();state.stats.cleanFinishes=6;state.stats.tracks["harbor-run"]={cleanFinishes:3,best:150};state.stats.medals.GOLD=2;state.achievements["first-clean-finish"]={unlockedAt:"2026-01-01T00:00:00.000Z"};
const result=recordRaceOutcome(state,outcome,{now:Date.UTC(2026,10,4)});
assert.equal(result.accepted,true);assert.equal(result.state.stats.cleanFinishes,7);assert.equal(result.state.stats.tracks["harbor-run"].cleanFinishes,4,"historic finish count was reset");
assert.equal(result.state.stats.tracks["harbor-run"].best,190,"incomparable v1 best survived as the active v2 best");assert.equal(result.state.stats.tracks["harbor-run"].bestCourseVersion,2);
assert.equal(result.state.stats.medals.GOLD,2,"historic medal count was rewritten");assert.ok(result.state.achievements["first-clean-finish"],"earned achievement was revoked");
console.log("Harbor v1/v2 records and progression are isolated");
