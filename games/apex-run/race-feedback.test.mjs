import assert from "node:assert/strict";
import {formatSplitDelta,replayCheckpointSplits,splitTone,summarizeSplits} from "./race-feedback.js";

const frames=[
  [0,-2,2,0,0,0,0,1],
  [90,99,3.5,-12,0,0,0,1],
  [180,96,7.5,-72,0,0,0,1],
  [300,-82,8.5,-103,0,0,0,1],
  [480,-82,14.5,125,0,0,0,1],
  [660,135,11.5,140,0,0,0,1],
  [900,150,3.5,8,0,0,0,1],
];
assert.deepEqual(replayCheckpointSplits({hz:30,frames}),[3,6,10,16,22,30]);
assert.deepEqual(replayCheckpointSplits({hz:30,frames:frames.slice(0,4)}),[3,6,10]);
assert.deepEqual(replayCheckpointSplits(null),[]);
assert.equal(formatSplitDelta(12.345,12.5),"−0.155");
assert.equal(formatSplitDelta(12.75,12.5),"+0.250");
assert.equal(formatSplitDelta(12.5,undefined),"");
assert.equal(splitTone(-.01),"ahead");
assert.equal(splitTone(.01),"behind");
assert.equal(splitTone(undefined),"neutral");
assert.equal(summarizeSplits([3,7,12],[4,6,10]),"Best: gained 1.000s at gate 1. Biggest loss: 2.000s at finish.");
assert.equal(summarizeSplits([3],[]),"Set a clean PB to unlock sector analysis.");
console.log("Apex Run race feedback tests passed");
