import assert from "node:assert/strict";
import {sunGlareOpacity} from "./sun-glare.js";

assert.equal(sunGlareOpacity(0,0,-.1),0,"glare must stay hidden behind the camera");
assert.equal(sunGlareOpacity(0,0,1.1),0,"glare must stay hidden beyond the far plane");
assert.ok(sunGlareOpacity(0,0,.5)>.15,"centered visible sun should produce a restrained flare");
assert.ok(sunGlareOpacity(.75,.2,.5)<sunGlareOpacity(.1,.1,.5),"flare should fade as the sun approaches the edge of view");
assert.equal(sunGlareOpacity(1.2,0,.5),0,"off-screen sun must not leak flare into view");
console.log("Apex Run sun glare visibility passed");
