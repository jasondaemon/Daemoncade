import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {carById} from "./car-catalog.js";

const assetUrl=new URL("./assets/cars/generic-sport.glb",import.meta.url);
const licenseUrl=new URL("./assets/cars/generic-sport.LICENSE.txt",import.meta.url);
const bytes=await readFile(assetUrl);
assert.equal(bytes.readUInt32LE(0),0x46546c67,"asset is not a binary glTF");
assert.equal(bytes.readUInt32LE(4),2,"asset is not glTF 2.0");
assert.equal(bytes.readUInt32LE(8),bytes.length,"GLB header length is stale");
assert.equal(bytes.readUInt32LE(16),0x4e4f534a,"GLB JSON chunk is missing");
const jsonLength=bytes.readUInt32LE(12);
const document=JSON.parse(bytes.subarray(20,20+jsonLength).toString("utf8").trimEnd());
const nodeNames=new Set(document.nodes.map(node=>node.name));
for(const name of ["WheelFrontL","WheelFrontR","WheelRearL","WheelRearR"]){
  assert.ok(nodeNames.has(name),`${name} is missing from the prepared asset`);
}
assert.equal(document.meshes.length,7,"prepared draw-mesh budget changed");
assert.equal(document.materials.length,4,"prepared material budget changed");
const catalog=carById("generic-sport");
assert.equal(catalog.asset.metrics.race.bytes,bytes.length,"catalog byte budget is stale");
assert.equal(catalog.asset.metrics.race.primitives,document.meshes.length,"catalog primitive budget is stale");
const license=await readFile(licenseUrl,"utf8");
assert.match(license,/Comrade1280/);
assert.match(license,/CC-BY-4\.0/);
assert.match(license,/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5/);
console.log("Apex Run generic sport asset passed");
