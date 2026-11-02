import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";

const root=new URL("./assets/",import.meta.url);
const files=[
  "polyhaven/concrete-road-barrier/concrete_road_barrier_1k.gltf",
  "polyhaven/concrete-road-barrier/concrete_road_barrier.bin",
  "polyhaven/concrete-road-barrier/textures/concrete_road_barrier_diff_1k.jpg",
  "polyhaven/concrete-road-barrier/textures/concrete_road_barrier_nor_gl_1k.jpg",
  "polyhaven/concrete-road-barrier/textures/concrete_road_barrier_arm_1k.jpg",
  "ambientcg/asphalt031/Asphalt031_1K-JPG_Color.jpg",
  "ambientcg/asphalt031/Asphalt031_1K-JPG_NormalGL.jpg",
  "ambientcg/asphalt031/Asphalt031_1K-JPG_Roughness.jpg",
  "polyhaven/modular-factory-facade/textures/modular_factory_facade_garage_diff_1k.jpg",
  "polyhaven/modular-factory-facade/textures/modular_factory_facade_garage_nor_gl_1k.jpg",
  "polyhaven/modular-factory-facade/textures/modular_factory_facade_garage_arm_1k.jpg",
];
let bytes=0;
for(const relative of files)bytes+=(await stat(new URL(relative,root))).size;
assert.ok(bytes<10*1024*1024,`selected CC0 runtime payload exceeds 10 MiB: ${bytes}`);
const gltf=JSON.parse(await readFile(new URL(files[0],root),"utf8"));
assert.equal(gltf.asset.version,"2.0");
assert.equal(gltf.meshes.length,1);
assert.ok(gltf.accessors[gltf.meshes[0].primitives[0].indices].count>1000,"optimized barrier mesh was not retained");
const game=await readFile(new URL("./game.js",import.meta.url),"utf8");
assert.match(game,/Asphalt031_1K-JPG_Color/);
assert.match(game,/concrete_road_barrier_1k\.gltf/);
assert.match(game,/modular_factory_facade_garage_diff_1k/);
assert.match(game,/qualityProfile\.id==="low"\?null:loadTexture/,"Low quality should skip the asphalt normal map");
assert.match(await readFile(new URL("./assets/CC0-VISUAL-ASSETS.md",import.meta.url),"utf8"),/CC0 1\.0 Universal/);
console.log("Apex Run selected CC0 visual asset manifest passed",{bytes});
