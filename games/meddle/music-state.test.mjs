import assert from "node:assert/strict";
import { musicRequestCurrent } from "./music-state.mjs";

assert.equal(musicRequestCurrent(4, 4, true, 0.55, false), true, "current enabled playback may report success");
assert.equal(musicRequestCurrent(4, 5, false, 0.55, false), false, "mute invalidates an in-flight play request");
assert.equal(musicRequestCurrent(4, 5, true, 0.55, false), false, "a newer play request invalidates an older completion");
assert.equal(musicRequestCurrent(4, 4, true, 0, false), false, "zero volume cannot report active playback");
assert.equal(musicRequestCurrent(4, 4, true, 0.55, true), false, "a hidden page cannot report active playback");

console.log("Meddle music request race guard passed");
