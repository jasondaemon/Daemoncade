import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {buildVenueTerrainGeometry,terrainBudget} from "./venue-terrain.js";

globalThis.location={search:"?track=alpine-sprint"};
const model=await import("./track-model.js?terrain-biomes");

function edgeDistance(x,z){
  let best=Infinity;
  for(const road of model.ROAD_SAMPLES)best=Math.min(best,Math.hypot(x-road.x,z-road.z)-road.width/2);
  return best;
}
function average(values){return values.reduce((sum,value)=>sum+value,0)/values.length}

for(const quality of ["low","medium","high"]){
  const geometry=buildVenueTerrainGeometry(THREE,model.VENUE,model.ROAD_SAMPLES,"alpine-sprint",quality);
  const position=geometry.getAttribute("position"),color=geometry.getAttribute("color"),shoulder=[],field=[];
  for(let index=0;index<position.count;index++){
    const clearance=edgeDistance(position.getX(index),position.getZ(index));
    const sample={red:color.getX(index),green:color.getY(index)};
    if(clearance>=22&&clearance<=36)shoulder.push(sample);
    if(clearance>=70&&clearance<=115)field.push(sample);
  }
  assert.ok(shoulder.length>20&&field.length>20,`${quality} lost terrain transition coverage`);
  const shoulderWarmth=average(shoulder.map(({red,green})=>red-green));
  const fieldWarmth=average(field.map(({red,green})=>red-green));
  assert.ok(shoulderWarmth>.025&&shoulderWarmth-fieldWarmth>.06,`${quality} road shoulder no longer separates from the field`);
  assert.ok(Math.max(...field.map(({green})=>green))-Math.min(...field.map(({green})=>green))>.14,`${quality} field lost ecological color breakup`);
  const budget=terrainBudget(quality);
  assert.equal(geometry.index.count,budget.x*budget.z*6,`${quality} terrain grid has holes`);
}
console.log("Apex Run Alpine biome transitions passed");
