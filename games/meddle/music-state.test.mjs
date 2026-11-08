import assert from "node:assert/strict";
import { cueAllowed, effectiveMusicVolume, musicRequestCurrent } from "./music-state.mjs";

assert.equal(musicRequestCurrent(4, 4, true, 0.55, false), true, "current enabled playback may report success");
assert.equal(musicRequestCurrent(4, 5, false, 0.55, false), false, "mute invalidates an in-flight play request");
assert.equal(musicRequestCurrent(4, 5, true, 0.55, false), false, "a newer play request invalidates an older completion");
assert.equal(musicRequestCurrent(4, 4, true, 0, false), false, "zero volume cannot report active playback");
assert.equal(musicRequestCurrent(4, 4, true, 0.55, true), false, "a hidden page cannot report active playback");
assert.equal(effectiveMusicVolume(true, 0.55, 0.28), 0.15400000000000003, "major effects duck music without muting it");
assert.equal(effectiveMusicVolume(false, 0.55, 0.28), 0, "music mute wins while a duck is active");
assert.equal(effectiveMusicVolume(true, 0.55, 2), 0.55, "duck factors cannot boost music");
assert.equal(cueAllowed(1, Number.NEGATIVE_INFINITY, 0.14), true, "the first effect is allowed");
assert.equal(cueAllowed(1.1, 1, 0.14), false, "dense repeated effects are throttled");
assert.equal(cueAllowed(1.141, 1, 0.14), true, "effects resume after the interval boundary");

console.log("Meddle music request race guard passed");
