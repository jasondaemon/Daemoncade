import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import {barrierTriangleCount,makeBarrierLOD} from "./barrier-lod.js";

const low=barrierTriangleCount(makeBarrierLOD(THREE,"low")),medium=barrierTriangleCount(makeBarrierLOD(THREE,"medium"));
assert.equal(low,12,"Low barrier must be a real primitive fallback");
assert.ok(medium>low&&medium<=32,`Medium barrier must retain a shaped silhouette within budget: ${medium}`);
const gltf=JSON.parse(await readFile(new URL("./assets/polyhaven/concrete-road-barrier/concrete_road_barrier_1k.gltf",import.meta.url),"utf8")),primitive=gltf.meshes[0].primitives[0],high=gltf.accessors[primitive.indices].count/3;
assert.equal(high,60928,"High barrier source triangle count changed unexpectedly");
assert.ok(high/medium>1000,"quality tiers are not materially reducing detailed barrier cost");
const source=await readFile(new URL("./game.js",import.meta.url),"utf8");
assert.match(source,/qualityProfile\.id==="high"\?await assetLoader\.loadAsync/,"detailed glTF must load only on High");
console.log("Apex Run barrier LOD budgets passed",{low,medium,high});
