import assert from "node:assert/strict";
import {FixedStepper,REPLAY_KEY,checkpointAdvance,formatTime,isOnRoad,medalFor,readBest,readReplay,reconcileBest,replayFrameAt,saveBest,saveReplay} from "./simulation.js";
assert.equal(formatTime(65.4321),"01:05.432");
const storage={getItem:()=>"not-a-time"};assert.equal(readBest(storage),null);
assert.equal(checkpointAdvance(0,{x:99,z:-12}),1);assert.equal(checkpointAdvance(0,{x:-18,z:-105}),0);
let ticks=0;const stepper=new FixedStepper(()=>ticks++,1/120);for(let i=0;i<60;i++)stepper.advance(1/60);assert.equal(ticks,120);
let ticks30=0;const at30=new FixedStepper(()=>ticks30++,1/120);for(let i=0;i<30;i++)at30.advance(1/30);assert.equal(ticks30,ticks);
for(const fps of[30,60,144]){let count=0;const fixed=new FixedStepper(()=>count++,1/120);for(let i=0;i<fps*10;i++)fixed.advance(1/fps);assert.ok(Math.abs(count-1200)<=1,`${fps} FPS produced ${count} ticks`)}
const memory=new Map(),store={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
const frames=[[0,0,2,0,0,0,0,1],[30,30,3,-4,0,.2,0,.98]];
assert.equal(saveReplay(store,20,frames),true);assert.ok(memory.has(REPLAY_KEY));const replay=readReplay(store);assert.equal(replay.time,20);assert.deepEqual(replayFrameAt(replay,.5).slice(1,4),[15,2.5,-2]);
store.setItem(REPLAY_KEY,JSON.stringify({...replay,frames:[[0,999,2,0,0,0,0,1],[1,0,2,0,0,0,0,1]]}));assert.equal(readReplay(store),null);
assert.equal(medalFor(11.9).name,"APEX");assert.equal(medalFor(15).name,"SILVER");assert.equal(medalFor(23),null);
assert.equal(reconcileBest(18,{time:20}),18);assert.equal(reconcileBest(22,{time:20}),20);
const denied={getItem(){throw Error("denied")},setItem(){throw Error("quota")}};assert.equal(readBest(denied),null);assert.equal(readReplay(denied),null);assert.equal(saveBest(denied,12),false);assert.equal(saveReplay(denied,20,frames),false);
assert.equal(isOnRoad({x:50,z:0}),true);assert.equal(isOnRoad({x:101,z:-60}),true);assert.equal(isOnRoad({x:0,z:-103}),true);assert.equal(isOnRoad({x:50,z:40}),false);
console.log("Apex Run simulation tests passed");
