import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {detailedStartBarrierCastsShadow} from "./render-budget.js";

const game=await readFile(new URL("game.js",import.meta.url),"utf8");
assert.match(game,/function fitAsset\(asset,\{x,y,z,width,height,depth,rotation=0,castShadow=true\}\)/,"asset shadow policy stays explicit and defaults on");
assert.equal(detailedStartBarrierCastsShadow("summit-circuit"),false,"Summit decorative barriers skip their duplicate shadow pass");
assert.equal(detailedStartBarrierCastsShadow("harbor-run"),true,"Harbor retains its prior detailed barrier shadows");
assert.equal(detailedStartBarrierCastsShadow("skyline-gauntlet"),true,"Skyline retains its prior detailed barrier shadows");
assert.equal(detailedStartBarrierCastsShadow("alpine-sprint"),true,"other tracks default to the established shadow policy");
assert.match(game,/concrete_road_barrier_1k\.gltf[\s\S]*?castShadow:detailedStartBarrierCastsShadow\(ACTIVE_TRACK_ID\)/,"runtime applies the track-specific barrier policy");
assert.match(game,/marker=fitAsset\(asset,\{x:obstacle\.x[\s\S]*?depth:\.8\}\)/,"racing obstacle markers keep the default shadow policy");
assert.match(game,/roadMesh\.castShadow=true/,"road shadows remain enabled");
assert.match(game,/sun\.castShadow=true/,"directional lighting shadows remain enabled");
console.log("Apex Run Summit render-budget policy passed");
