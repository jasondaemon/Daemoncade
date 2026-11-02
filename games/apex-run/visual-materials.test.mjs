import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {roadMaterialParameters} from "./visual-materials.js";

const maps=[null,new THREE.Texture()];
for(const colorMap of maps)for(const normalMap of maps)for(const roughnessMap of maps){
  const parameters=roadMaterialParameters(THREE,{colorMap,normalMap,roughnessMap});
  assert.equal(parameters.map,colorMap);
  assert.equal(parameters.normalMap,normalMap);
  assert.equal(parameters.roughnessMap,roughnessMap);
  assert.doesNotThrow(()=>new THREE.MeshStandardMaterial(parameters),"any partial texture load combination must remain renderable");
}
console.log("Apex Run partial visual texture fallbacks passed");
