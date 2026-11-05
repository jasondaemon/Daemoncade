import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {detailedStartBarrierCastsShadow} from "./render-budget.js";

const [game,index,testPage,skylinePage,app]=await Promise.all(["game.js","index.html","test.html","skyline-test.html","app.html"].map(file=>readFile(new URL(file,import.meta.url),"utf8")));
assert.match(game,/function fitAsset\(asset,\{x,y,z,width,height,depth,rotation=0,castShadow=true\}\)/,"asset shadow policy stays explicit and defaults on");
assert.equal(detailedStartBarrierCastsShadow("summit-circuit"),false,"Summit decorative barriers skip their duplicate shadow pass");
assert.equal(detailedStartBarrierCastsShadow("harbor-run"),true,"Harbor retains its prior detailed barrier shadows");
assert.equal(detailedStartBarrierCastsShadow("skyline-gauntlet"),true,"Skyline retains its prior detailed barrier shadows");
assert.equal(detailedStartBarrierCastsShadow("alpine-sprint"),true,"other tracks default to the established shadow policy");
assert.match(game,/concrete_road_barrier_1k\.gltf[\s\S]*?castShadow:detailedStartBarrierCastsShadow\(ACTIVE_TRACK_ID\)/,"runtime applies the track-specific barrier policy");
assert.match(game,/marker=fitAsset\(asset,\{x:obstacle\.x[\s\S]*?depth:\.8\}\)/,"racing obstacle markers keep the default shadow policy");
assert.match(game,/roadMesh\.castShadow=true/,"road shadows remain enabled");
assert.match(game,/sun\.castShadow=true/,"directional lighting shadows remain enabled");
for(const [name,entry] of [["index",index],["test",testPage],["skyline test",skylinePage]]){assert.match(entry,/game\.js\?v=0\.5\.0-alpha186-pickup-compact/,`${name} loads the corrected render-budget graph`);assert.doesNotMatch(entry,/game\.js\?v=0\.5\.0-alpha157-summit-render(?:["&])/,`${name} cannot reuse the stale first-candidate runtime`) }
assert.match(app,/index\.html\?v=0\.5\.0-alpha186-pickup-compact/,"app shell invalidates its cached production entry");
assert.doesNotMatch(app,/index\.html\?v=0\.5\.0-alpha157-summit-render/,"app shell cannot reuse the stale first-candidate entry");
assert.match(game,/landscape-details\.js\?v=0\.5\.0-alpha158-summit-render-scope/,"corrected runtime invalidates the optimized landscape module");
assert.match(game,/render-budget\.js\?v=0\.5\.0-alpha158-summit-render-scope2/,"corrected runtime invalidates the track-scoped barrier policy");
console.log("Apex Run Summit render-budget policy passed");
