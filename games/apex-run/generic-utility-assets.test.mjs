import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {carById} from "./car-catalog.js";

for(const id of ["generic-offroad","generic-minivan"]){
  const assetUrl=new URL(`./assets/cars/${id}.glb`,import.meta.url),licenseUrl=new URL(`./assets/cars/${id}.LICENSE.txt`,import.meta.url),bytes=await readFile(assetUrl);
  assert.equal(bytes.readUInt32LE(0),0x46546c67,`${id} is not a binary glTF`);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
  const document=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString("utf8").trimEnd()),nodeNames=new Set(document.nodes.map(node=>node.name));
  for(const name of ["WheelFrontL","WheelFrontR","WheelRearL","WheelRearR"])assert.ok(nodeNames.has(name),`${id} is missing ${name}`);
  assert.equal(document.meshes.length,7,`${id} source draw budget changed`);assert.equal(document.materials.length,4,`${id} material budget changed`);
  const catalog=carById(id);assert.equal(catalog.asset.metrics.race.bytes,bytes.length);assert.equal(catalog.asset.metrics.race.primitives,document.meshes.length);
  const license=await readFile(licenseUrl,"utf8");assert.match(license,/Comrade1280/);assert.match(license,/CC-BY-4\.0/);assert.match(license,/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5/);
}
console.log("Apex Run generic utility assets passed");
