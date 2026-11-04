import assert from "node:assert/strict";
import {DEFAULT_TRACK_ID,TRACK_CATALOG,requestedTrackId,resolveTrack,trackStorageKeys,validTrackId} from "./track-catalog.js";

assert.equal(TRACK_CATALOG.length,4);
assert.equal(resolveTrack().id,DEFAULT_TRACK_ID);
assert.equal(resolveTrack("missing").id,DEFAULT_TRACK_ID);
for(const id of ["summit-circuit","harbor-run","skyline-gauntlet"]){
  assert.equal(resolveTrack(id).checkpointCount,id==="harbor-run"?9:id==="skyline-gauntlet"?8:7);
  assert.equal(requestedTrackId(`?track=${id}`),id);
  assert.equal(resolveTrack(id).replayHz,15);
}
assert.deepEqual(trackStorageKeys(),{pb:"apex-run:pb:v9",replay:"apex-run:replay:v10"});
assert.deepEqual(trackStorageKeys("skyline-gauntlet"),{pb:"apex-run:track:skyline-gauntlet:pb:v1",replay:"apex-run:track:skyline-gauntlet:replay:v1"});
assert.deepEqual(trackStorageKeys("harbor-run"),{pb:"apex-run:track:harbor-run:pb:v2",replay:"apex-run:track:harbor-run:replay:v2"});
assert.equal(resolveTrack("harbor-run").courseVersion,2);
assert.equal(resolveTrack("harbor-run").medalsProvisional,true);
assert.equal(requestedTrackId("?track=missing"),DEFAULT_TRACK_ID);
assert.equal(validTrackId(DEFAULT_TRACK_ID),true);
assert.equal(validTrackId("../alpine"),false);
assert.equal(validTrackId("Alpine Sprint"),false);
console.log("Apex Run track catalog passed");
