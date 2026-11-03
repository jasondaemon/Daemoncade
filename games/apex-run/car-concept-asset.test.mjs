import assert from "node:assert/strict";
import fs from "node:fs";

const assetPath=new URL("./assets/car-concept-race.glb",import.meta.url),bytes=fs.readFileSync(assetPath),jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength).toString("utf8").trim());
assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.ok(bytes.length<8_500_000,"race asset exceeds the 8.5 MB transfer budget");
const names=json.nodes.map(node=>node.name||"").join("\n");assert.doesNotMatch(names,/License Plate|SteeringEmblem|WindshieldWipers|^Interior/im);assert.doesNotMatch(JSON.stringify(json),/Khronos|3D Commerce/i,"excluded trademark data remains in prepared asset");
const wheels=json.nodes.filter(node=>node.extras?.apexWheel);assert.deepEqual(wheels.map(node=>node.extras.apexWheel).sort(),["front-left","front-right","rear-left","rear-right"]);assert.ok(wheels.every(node=>node.children?.length>=2));
let triangles=0,primitives=0;for(const mesh of json.meshes)for(const primitive of mesh.primitives){primitives++;const accessor=json.accessors[primitive.indices??primitive.attributes.POSITION];triangles+=Math.floor(accessor.count/3);for(const index of Object.values(primitive.attributes))assert.ok(json.accessors[index]);if(primitive.indices!==undefined)assert.ok(json.accessors[primitive.indices])}
assert.equal(triangles,143802);assert.equal(primitives,58);assert.ok(json.materials.length<=19);assert.ok((json.textures?.length||0)<=11);assert.deepEqual(json.extensions.KHR_materials_variants.variants.map(item=>item.name),["Apex Cyan","Summit Gold","Midnight Grid"]);
assert.match(json.asset.copyright,/Eric Chadwick \/ Darmstadt Graphics Group, CC BY 4\.0/);assert.match(fs.readFileSync(new URL("./assets/car-concept-LICENSE.md",import.meta.url),"utf8"),/Creative Commons Attribution 4\.0/);
console.log("Apex Run prepared CarConcept asset passed");
