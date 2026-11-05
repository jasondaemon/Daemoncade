import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {BRANCH_JUNCTIONS,buildLaneRibbon,ROAD_SAMPLES} from "./track-model.js";

const lane=buildLaneRibbon(ROAD_SAMPLES.slice(0,3));
for(let index=0;index<3;index++){
  const sample=ROAD_SAMPLES[index],leftY=lane.positions[index*6+1],rightY=lane.positions[index*6+4];
  assert.ok(leftY-sample.left.y>=.115,`lane left edge ${index} is too close to the road deck`);
  assert.ok(rightY-sample.right.y>=.115,`lane right edge ${index} is too close to the road deck`);
}

const root=new URL("./",import.meta.url),[track,landscape,harbor,bands,game]=await Promise.all([
  readFile(new URL("track-model.js",root),"utf8"),readFile(new URL("landscape-details.js",root),"utf8"),
  readFile(new URL("harbor-venue.js",root),"utf8"),readFile(new URL("route-landscape-bands.js",root),"utf8"),
  readFile(new URL("game.js",root),"utf8")
]);
for(const junction of BRANCH_JUNCTIONS)for(let index=1;index<junction.positions.length;index+=3)assert.ok(Math.abs(junction.renderPositions[index]-junction.positions[index]-.05)<1e-9,"Summit branch junction render surface needs clearance without lifting its collider");
assert.match(landscape,/bed\.position\.y=-\.04;path\.position\.y=\.04/,"service path and bed need explicit vertical ordering");
assert.match(harbor,/mesh===foam\?\.08:0/,"Harbor foam needs separation from its shoreline mesh");
assert.match(bands,/const GROUND_Y=\.48/,"landscape bands need clearance above the venue terrain");
assert.doesNotMatch([track,landscape,harbor,bands,game].join("\n"),/polygonOffset/,"surface conflicts must be fixed in geometry instead of hidden with global depth bias");
for(const module of["track-model","landscape-details","harbor-venue","route-landscape-bands"])assert.match(game,new RegExp(`${module}\\.js\\?v=0\\.5\\.0-alpha191-surface-layering`),`${module} cache path is stale`);
console.log("Apex Run surface layering passed");
