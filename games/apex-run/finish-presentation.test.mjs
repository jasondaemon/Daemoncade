import assert from "node:assert/strict";
import {FINISH_BRAKE_FORCE,FINISH_COAST_SECONDS,FINISH_RESULT_DELAY,FINISH_RUNOFF_LENGTH,advanceFinishPresentation,buildFinishRunoffSamples,finishBrakeForce,finishCameraPose} from "./finish-presentation.js";

const finish={x:10,y:3,z:5,width:20,forward:{x:0,y:-.05,z:-1},lateral:{x:1,y:0,z:0},up:{x:0,y:1,z:-.05}};
const samples=buildFinishRunoffSamples(finish);
assert.ok(samples.length>=20);
assert.deepEqual([samples[0].x,samples[0].y,samples[0].z],[finish.x,finish.y,finish.z]);
assert.ok(Math.hypot(samples.at(-1).x-finish.x,samples.at(-1).y-finish.y,samples.at(-1).z-finish.z)>=FINISH_RUNOFF_LENGTH-.01);
assert.ok(samples.at(-1).y>finish.y-.6,"runoff must ease out of the finish grade instead of diving under terrain");
assert.ok(samples.every(sample=>Math.abs(Math.hypot(sample.left.x-sample.right.x,sample.left.y-sample.right.y,sample.left.z-sample.right.z)-finish.width)<1e-6));
const camera=finishCameraPose(finish);
assert.ok(Math.hypot(camera.position.x-finish.x,camera.position.z-finish.z)>17,"finish camera must remain trackside, not chase the car");
let state={active:true,elapsed:0,showResult:false};state=advanceFinishPresentation(state,FINISH_RESULT_DELAY-.01);assert.equal(state.showResult,false);state=advanceFinishPresentation(state,.02);assert.equal(state.showResult,true);state=advanceFinishPresentation(state,FINISH_COAST_SECONDS);assert.equal(state.active,false);
assert.equal(finishBrakeForce(.4),0);assert.ok(finishBrakeForce(.65)>0&&finishBrakeForce(.65)<FINISH_BRAKE_FORCE);assert.equal(finishBrakeForce(1),FINISH_BRAKE_FORCE);
console.log("Apex Run finish presentation passed");
