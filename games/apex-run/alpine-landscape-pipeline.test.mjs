import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import {ecologyZoneData} from "./landscape-details.js";

globalThis.location={search:"?track=alpine-sprint"};
const {ROAD_SAMPLES}=await import("./track-model.js?alpine-landscape-pipeline");
const game=await readFile(new URL("game.js",import.meta.url),"utf8"),index=await readFile(new URL("index.html",import.meta.url),"utf8"),testPage=await readFile(new URL("test.html",import.meta.url),"utf8");

assert.match(game,/=await Promise\.all\(\[/,"Alpine uses the shared licensed PBR texture pipeline");
assert.doesNotMatch(game,/=largeVenue\?await Promise\.all/,"PBR maps must not be restricted to large venues");
assert.match(game,/sampleScenario=renderTelemetryMode&&testParams\.get\("scenario"\)==="sample"/,"sample placement remains test-page-only");
assert.match(game,/ACTIVE_TRACK_ID!=="alpine-sprint"\)scene\.add\(basin\)/,"flat legacy basin no longer masks Alpine terrain");
assert.match(game,/landscape-details\.js\?v=0\.5\.0-alpha103-summit-env/,"game imports the current landscape revision");
assert.match(game,/venue-terrain\.js\?v=0\.5\.0-alpha103-summit-env/,"game imports the current terrain revision");
assert.match(game,/environment-presentation\.js\?v=0\.5\.0-alpha100c/,"game imports the current horizon revision");
assert.match(index,/game\.js\?v=0\.5\.0-alpha105-skyline/,"production entry loads the current game graph");
assert.match(testPage,/game\.js\?v=0\.5\.0-alpha100c/,"test entry loads the current game graph");

for(const quality of["low","medium","high"]){
  const data=ecologyZoneData(ROAD_SAMPLES,quality),geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(data.positions,3));geometry.setIndex(data.indices);geometry.computeVertexNormals();const normal=geometry.getAttribute("normal");
  assert.ok(Array.from({length:normal.count},(_,index)=>normal.getY(index)).filter(value=>value<0).length<normal.count*.08,`${quality} connected ecology faces upward`);
  assert.equal(data.zones.length,9,`${quality} covers all Alpine route quarters with a late-sector paired district`);
}

console.log("Apex Alpine landscape pipeline passed");
