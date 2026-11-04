import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addLandscapeDetails,ecologyZoneData,landscapePlacements,landscapeServicePlacements,macroTerrainPlacements,treelinePlacements} from "./landscape-details.js";
import {readFile} from "node:fs/promises";
globalThis.location={search:"?track=summit-circuit"};
const {ROAD_SAMPLES}=await import("./track-model.js?landscape-test");
globalThis.location={search:"?track=alpine-sprint"};
const {ROAD_SAMPLES:ALPINE_SAMPLES}=await import("./track-model.js?alpine-ecology-test");
globalThis.location={search:"?track=summit-circuit"};

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
  assert.ok(new Set(placements.map(item=>`${item.quarter}:${item.cluster}`)).size>=Math.floor(expected/8),`${quality} route-wide cluster coverage`);
  const ecology=ecologyZoneData(ALPINE_SAMPLES,quality);assert.equal(ecology.zones.length,9,`${quality} connected ecological districts`);assert.ok(ecology.indices.length>300,`${quality} ecological ground coverage`);for(let index=0;index<ecology.positions.length;index+=3){const x=ecology.positions[index],z=ecology.positions[index+2],clearance=ALPINE_SAMPLES.reduce((best,road)=>Math.min(best,Math.hypot(x-road.x,z-road.z)-road.width/2),Infinity);assert.ok(clearance>=15.2,`${quality} ecological terrain clearance ${clearance}`)}
  const treeline=treelinePlacements(ALPINE_SAMPLES,quality);assert.ok(treeline.length>=(quality==="high"?500:quality==="medium"?300:70),`${quality} treeline density`);assert.equal(new Set(treeline.map(item=>item.zone)).size,9,`${quality} treeline covers every ecology district`);assert.ok(treeline.every(item=>item.clearance>=12&&item.height>=4.5&&item.height<=15.4),`${quality} treeline is visible, varied and clear`);assert.equal(new Set(treeline.map(item=>item.silhouette)).size,4,`${quality} uses four canopy silhouettes`);assert.ok(treeline.filter(item=>item.understory).length>=treeline.length*.18,`${quality} includes clustered understory`);if(quality!=="low")assert.ok(treeline.some(item=>item.height>13),`${quality} includes a taller background canopy layer`);
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
const topologyScene=new THREE.Scene(),topology=await addLandscapeDetails(THREE,topologyScene,{loadAsync:async()=>{throw new Error("optional assets disabled")}},ROAD_SAMPLES,"high",{},"summit-circuit");assert.equal(topology.services.length,9);assert.equal(topology.ecology.zones.length,0);assert.equal(topology.meshes.filter(mesh=>mesh.userData.macroRidgeSlot!==undefined).length,0,"stand-alone macro ridges must not return to chase-camera sightlines");for(const service of topology.services){const ribbons=topology.meshes.filter(mesh=>mesh.userData.serviceDistrict?.slot===service.slot);assert.deepEqual(ribbons.map(mesh=>mesh.userData.serviceDistrict.role).sort(),["bed","fence","path"],"each service district has a broad ground bed and inset service road");assert.ok(service.points.every(point=>point.y===.37),"service districts are grounded on the venue plane rather than floating with elevated road")}
const alpineScene=new THREE.Scene(),alpine=await addLandscapeDetails(THREE,alpineScene,{loadAsync:async()=>{throw new Error("optional assets disabled")}},ALPINE_SAMPLES,"high",{},"alpine-sprint");assert.equal(alpine.ecology.zones.length,9);assert.equal(alpine.meshes.filter(mesh=>mesh.userData.ecologyZones).length,1,"Alpine ecology zones remain one connected draw rather than scattered ground discs");
let renderedLandscapeClearance=Infinity;const renderedPoint=new THREE.Vector3(),instanceMatrix=new THREE.Matrix4();for(const mesh of alpine.meshes.filter(item=>item.userData.alpineLandscapeRole)){const positions=mesh.geometry.getAttribute("position");for(let instance=0;instance<mesh.count;instance++){mesh.getMatrixAt(instance,instanceMatrix);for(let vertex=0;vertex<positions.count;vertex++){renderedPoint.fromBufferAttribute(positions,vertex).applyMatrix4(instanceMatrix);for(const road of ALPINE_SAMPLES)renderedLandscapeClearance=Math.min(renderedLandscapeClearance,Math.hypot(renderedPoint.x-road.x,renderedPoint.z-road.z)-road.width/2)}}}assert.ok(renderedLandscapeClearance>=7.5,`rendered crown/understory geometry crowds the road envelope: ${renderedLandscapeClearance}`);
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
console.log("Apex Run CC0 landscape placements passed",{tiers,renderedLandscapeClearance:+renderedLandscapeClearance.toFixed(3)});
