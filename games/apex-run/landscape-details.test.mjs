import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addLandscapeDetails,landscapePlacements,landscapeServicePlacements,macroTerrainPlacements} from "./landscape-details.js";
import {readFile} from "node:fs/promises";
globalThis.location={search:"?track=summit-circuit"};
const {ROAD_SAMPLES}=await import("./track-model.js?landscape-test");

const tiers={high:93,medium:64,low:32};
for(const [quality,expected] of Object.entries(tiers)){
  const placements=landscapePlacements(ROAD_SAMPLES,quality);
  assert.equal(placements.length,expected,`${quality} landscape count`);
  assert.ok(placements.every(item=>item.y===.35&&item.clearance>=12),`${quality} full bounds must be grounded and clear`);
  assert.ok(new Set(placements.map(item=>item.scale)).size>=6,`${quality} landscape scale variation`);
  assert.ok(new Set(placements.map(item=>item.variant)).size===2,`${quality} model variation`);
  const quarters=[0,1,2,3].map(quarter=>placements.filter(item=>item.quarter===quarter).length);
  assert.ok(Math.min(...quarters)>=Math.floor(expected/4)-2&&Math.max(...quarters)-Math.min(...quarters)<=3,`${quality} quarter distribution`);
  assert.ok(new Set(placements.map(item=>item.rotation.toFixed(2))).size>=expected*.9,`${quality} rotation variation`);
  assert.ok(new Set(placements.map(item=>`${item.quarter}:${item.cluster}`)).size>=Math.floor(expected/4),`${quality} route-wide cluster coverage`);
  const terrain=macroTerrainPlacements(ROAD_SAMPLES,quality),terrainExpected=quality==="high"?12:quality==="medium"?8:4;
  assert.equal(terrain.length,terrainExpected,`${quality} macro terrain count`);
  assert.deepEqual([0,1,2,3].map(quarter=>terrain.filter(item=>item.quarter===quarter).length),Array(4).fill(terrainExpected/4),`${quality} macro terrain quarter coverage`);
  assert.ok(terrain.every(item=>item.clearance>=20&&item.height<=8.25&&item.y+item.height<9),`${quality} terrain remains clear and below elevated road`);
  const services=landscapeServicePlacements(ROAD_SAMPLES,quality),expectedServices=quality==="high"?9:quality==="medium"?6:3;
  assert.equal(services.length,expectedServices,`${quality} service district count`);
  assert.ok(services.every(service=>service.points.length>=24&&service.points.every(point=>point.clearance>=7)),`${quality} connected service paths remain clear of the full route`);
  assert.deepEqual(new Set(services.map(service=>service.side)),new Set(["left","right"]),`${quality} service paths frame both sides of the venue`);
}
const game=await readFile(new URL("game.js",import.meta.url),"utf8");
const topologyScene=new THREE.Scene(),topology=await addLandscapeDetails(THREE,topologyScene,{loadAsync:async()=>{throw new Error("optional assets disabled")}},ROAD_SAMPLES,"high");assert.equal(topology.services.length,9);assert.equal(topology.meshes.filter(mesh=>mesh.userData.macroRidgeSlot!==undefined).length,0,"stand-alone macro ridges must not return to chase-camera sightlines");for(const service of topology.services){const ribbons=topology.meshes.filter(mesh=>mesh.userData.serviceDistrict?.slot===service.slot);assert.deepEqual(ribbons.map(mesh=>mesh.userData.serviceDistrict.role).sort(),["bed","fence","path"],"each service district has a broad ground bed and inset service road");assert.ok(service.points.every(point=>point.y===.37),"service districts are grounded on the venue plane rather than floating with elevated road")}
assert.match(game,/const grassMetres=1\.4/);
assert.match(game,/VENUE\.halfX\*2\/grassMetres,VENUE\.halfZ\*2\/grassMetres/);
assert.match(game,/VENUE\.basinRadius\/VENUE\.halfX/);
assert.match(game,/function metreScaleBoxUV\(geometry,metres=2\.4\)/,"concrete boxes use metre-scaled UVs");
const reservoir=await readFile(new URL("reservoir-architecture.js",import.meta.url),"utf8");
assert.match(reservoir,/function metreScaleCylinderUV\(geometry,radius,height,metres=2\.4\)/,"reservoir concrete uses metre-scaled UVs");
for(const [path,targetHeight,declaredRadius] of [["assets/polyhaven/shrub-02/shrub_02_1k.gltf",3.6,5.5],["assets/polyhaven/rock-moss-set-01/rock_moss_set_01_1k.gltf",1.7,3]]){
  const gltf=JSON.parse(await readFile(new URL(path,import.meta.url),"utf8"));let measured=0;
  for(const node of gltf.nodes)if(node.mesh!==undefined)for(const primitive of gltf.meshes[node.mesh].primitives){const position=gltf.accessors[primitive.attributes.POSITION],height=position.max[1]-position.min[1],radius=Math.max(...[[position.min[0],position.min[2]],[position.min[0],position.max[2]],[position.max[0],position.min[2]],[position.max[0],position.max[2]]].map(([x,z])=>Math.hypot(x,z)))/height*targetHeight;measured=Math.max(measured,radius)}
  assert.ok(measured<=declaredRadius,`${path} measured radius ${measured.toFixed(3)} exceeds placement bound ${declaredRadius}`);
}
console.log("Apex Run CC0 landscape placements passed",tiers);
