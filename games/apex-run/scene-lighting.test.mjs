import assert from "node:assert/strict";
import {naturalLightingProfile,renderTrackBox} from "./scene-lighting.js";
import {readFile} from "node:fs/promises";

assert.deepEqual(naturalLightingProfile("alpine-sprint"),{exposure:.88,hemisphere:1.05,sun:2.35,rim:.18});
assert.deepEqual(naturalLightingProfile("harbor-run"),{exposure:.96,hemisphere:1.45,sun:3,rim:.8});
assert.equal(renderTrackBox("alpine-sprint",{surface:"grass"}),false,"Alpine must not render a second ground plane beneath its authored terrain");
assert.equal(renderTrackBox("alpine-sprint",{surface:"road"}),true);
assert.equal(renderTrackBox("summit-circuit",{surface:"grass"}),true,"other tracks retain their established ground skin");
const game=await readFile(new URL("./game.js",import.meta.url),"utf8");
assert.match(game,/roughnessMap:alpineNatural\?null:asphaltRoughness/,"Alpine asphalt must not amplify broad roughness-map highlights");
assert.match(game,/roughness:alpineNatural\?null:grassRoughness/,"Alpine terrain must remain matte under natural sunlight");
console.log("Apex natural lighting and ground-surface policy passed");
