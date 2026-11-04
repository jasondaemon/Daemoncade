import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {buildVenueTerrainGeometry,terrainBudget,terrainHeightAt} from "./venue-terrain.js";

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
  const shoulderValues=shoulder.map(({red,green})=>red-green);
  assert.ok(shoulderWarmth-fieldWarmth>.02&&Math.min(...shoulderValues)<-.12&&Math.max(...shoulderValues)>.1,`${quality} road shoulder lost broken gravel/vegetation transitions`);
  assert.ok(Math.max(...field.map(({green})=>green))-Math.min(...field.map(({green})=>green))>.14,`${quality} field lost ecological color breakup`);
  for(let index=0;index<model.ROAD_SAMPLES.length;index+=25){
    const road=model.ROAD_SAMPLES[index];
    for(const side of ["left","right"]){
      const edge=road[side],dx=edge.x-road.x,dz=edge.z-road.z,length=Math.hypot(dx,dz)||1;
      for(const offset of [0,15,30,45,60]){
        const x=edge.x+dx/length*offset,z=edge.z+dz/length*offset,renderY=terrainHeightAt(geometry,model.VENUE,x,z);
        assert.ok(Math.abs(renderY-.37)<.025,`${quality} visual terrain diverged from the .35m physical grass at road ${index} ${side}+${offset}: ${renderY}`);
      }
    }
  }
  const budget=terrainBudget(quality);
  assert.equal(geometry.index.count,budget.x*budget.z*6,`${quality} terrain grid has holes`);
}
console.log("Apex Run Alpine biome transitions passed");
