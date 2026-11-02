import assert from"node:assert/strict";
import{DEFAULT_TRACK_ID,TRACK_CATALOG,resolveTrack,trackStorageKeys,validTrackId}from"./track-catalog.js";
assert.equal(TRACK_CATALOG.length,1);assert.equal(resolveTrack().id,DEFAULT_TRACK_ID);assert.equal(resolveTrack("missing").id,DEFAULT_TRACK_ID);assert.deepEqual(trackStorageKeys(),{pb:"apex-run:pb:v9",replay:"apex-run:replay:v10"});assert.equal(validTrackId(DEFAULT_TRACK_ID),true);assert.equal(validTrackId("../alpine"),false);assert.equal(validTrackId("Alpine Sprint"),false);
console.log("Apex Run track catalog passed");
