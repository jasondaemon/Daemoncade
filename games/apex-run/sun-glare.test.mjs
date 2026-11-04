import assert from "node:assert/strict";
import {sunGlareOpacity} from "./sun-glare.js";
import {ALPINE_SUN_DIRECTION,WORLD_SUN_DIRECTION} from "./environment-presentation.js";

assert.equal(sunGlareOpacity(0,0,-.1),0,"glare must stay hidden behind the camera");
assert.equal(sunGlareOpacity(0,0,1.1),0,"glare must stay hidden beyond the far plane");
assert.ok(sunGlareOpacity(0,0,.5)>.15,"centered visible sun should produce a restrained flare");
assert.ok(sunGlareOpacity(.75,.2,.5)<sunGlareOpacity(.1,.1,.5),"flare should fade as the sun approaches the edge of view");
assert.equal(sunGlareOpacity(1.2,0,.5),0,"off-screen sun must not leak flare into view");
assert.ok(Math.atan2(ALPINE_SUN_DIRECTION.y,Math.hypot(ALPINE_SUN_DIRECTION.x,ALPINE_SUN_DIRECTION.z))<.3,"Alpine sun must remain low enough for normal chase-camera views");
assert.ok(Math.atan2(WORLD_SUN_DIRECTION.y,Math.hypot(WORLD_SUN_DIRECTION.x,WORLD_SUN_DIRECTION.z))>.9,"other tracks retain their established high sun");
console.log("Apex Run sun glare visibility passed");
