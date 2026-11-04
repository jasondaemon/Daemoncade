import assert from "node:assert/strict";import fs from "node:fs";import*as THREE from "../vendor/three/three.module.min.js";import{addHarborFactoryComplex}from"./harbor-factory-complex.js";
function source(){const root=new THREE.Group();for(const [name,w,h]of[["dado_garage_door_01",4,4],["dado_garage_centered_01",4,4],["window_centered_medium_03",4,2],["cornice03_standard_standard_01",5,1]]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,.4),new THREE.MeshStandardMaterial());mesh.name=name;mesh.position.y=h/2;root.add(mesh)}return root}
assert.equal(addHarborFactoryComplex(THREE,new THREE.Scene(),source(),"low"),null);
assert.equal(addHarborFactoryComplex(THREE,new THREE.Scene(),source(),"medium"),null);
{const scene=new THREE.Scene(),group=addHarborFactoryComplex(THREE,scene,source(),"high");assert.equal(group.userData.bayCount,7);assert.equal(group.userData.license,"CC0");assert.ok(group.children.length>=17,"frontage plus depth wings");group.traverse(object=>{if(object.isMesh)assert.equal(object.castShadow,true)})}
console.log("Apex Harbor factory complex passed");
const assetRoot=new URL("./assets/polyhaven/modular-factory-facade/modules/",import.meta.url),document=JSON.parse(fs.readFileSync(new URL("modular_factory_facade_apex.gltf",assetRoot),"utf8"));
assert.match(fs.readFileSync(new URL("./game.js",import.meta.url),"utf8"),/harbor-factory-complex\.js\?v=0\.5\.0-alpha154-summit-descent/,"runtime cache follows factory revision");
assert.equal(document.asset.extras.license,"CC0");
assert.deepEqual(document.asset.extras.apexSelection,[0,10,56,57,60,68,73]);
assert.equal(document.scenes[0].nodes.length,7,"only selected modules enter the runtime scene");
const selectedNames=document.scenes[0].nodes.map(index=>document.nodes[index].name);assert.ok(selectedNames.includes("dado_garage_centered_01")&&selectedNames.includes("window_centered_medium_03"));
assert.equal(fs.statSync(new URL("modular_factory_facade.bin",assetRoot)).size,6269260,"reviewed shared geometry buffer");
const textureIndices=new Set();for(const material of document.materials.slice(0,4)){for(const key of["normalTexture","emissiveTexture","occlusionTexture"])if(material[key])textureIndices.add(material[key].index);for(const key of["baseColorTexture","metallicRoughnessTexture"])if(material.pbrMetallicRoughness?.[key])textureIndices.add(material.pbrMetallicRoughness[key].index)}
for(const index of textureIndices){const uri=document.images[document.textures[index].source].uri;assert.ok(fs.statSync(new URL(uri,assetRoot)).size>10000,`real texture ${uri}`)}
const gameSource=fs.readFileSync(new URL("./game.js",import.meta.url),"utf8");assert.match(gameSource,/setURLModifier\(url=>\{if\(!url\.includes\("modular_factory_facade"\)\)return url;/,"factory dependency cache policy is scoped");assert.match(gameSource,/searchParams\.set\("asset","alpha90d"\)/,"factory glTF and every nested texture use one cache revision");
