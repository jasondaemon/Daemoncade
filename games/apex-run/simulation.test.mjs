import assert from "node:assert/strict";
import {FixedStepper,checkpointAdvance,formatTime,readBest} from "./simulation.js";
assert.equal(formatTime(65.4321),"01:05.432");
const storage={getItem:()=>"not-a-time"};assert.equal(readBest(storage),null);
assert.equal(checkpointAdvance(0,{x:99,z:-12}),1);assert.equal(checkpointAdvance(0,{x:-18,z:-105}),0);
let ticks=0;const stepper=new FixedStepper(()=>ticks++,1/120);for(let i=0;i<60;i++)stepper.advance(1/60);assert.equal(ticks,120);
let ticks30=0;const at30=new FixedStepper(()=>ticks30++,1/120);for(let i=0;i<30;i++)at30.advance(1/30);assert.equal(ticks30,ticks);
console.log("Apex Run simulation tests passed");
