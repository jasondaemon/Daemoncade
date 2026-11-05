import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {carById} from "./car-catalog.js";
import {RACE_VISUAL_PROFILES} from "./car-visual-adapter.js";

for(const [id,profile,expectedFit] of [["generic-offroad","trail",.9],["generic-minivan","tourer",1]]){
  const assetUrl=new URL(`./assets/cars/${id}.glb`,import.meta.url),licenseUrl=new URL(`./assets/cars/${id}.LICENSE.txt`,import.meta.url),bytes=await readFile(assetUrl);
  assert.equal(bytes.readUInt32LE(0),0x46546c67,`${id} is not a binary glTF`);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
  const document=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString("utf8").trimEnd()),nodeNames=new Set(document.nodes.map(node=>node.name));
  for(const name of ["WheelFrontL","WheelFrontR","WheelRearL","WheelRearR"])assert.ok(nodeNames.has(name),`${id} is missing ${name}`);
  const wheelNode=name=>document.nodes.find(node=>node.name===name),wheel=name=>wheelNode(name).translation,front=[wheel("WheelFrontL"),wheel("WheelFrontR")],rear=[wheel("WheelRearL"),wheel("WheelRearR")];assert.ok(front.every(position=>position[2]>rear[0][2]&&position[2]>rear[1][2]),`${id} authored front axle points backward`);assert.ok(front[0][0]*front[1][0]<0&&rear[0][0]*rear[1][0]<0,`${id} authored axle does not span both sides`);assert.ok(front.concat(rear).every(position=>position[1]>.25),`${id} wheel pivots are not above their contact patches`);for(const name of ["WheelFrontL","WheelFrontR","WheelRearL","WheelRearR"]){const child=document.nodes[wheelNode(name).children[0]],primitive=document.meshes[child.mesh].primitives[0],position=document.accessors[primitive.attributes.POSITION],size=position.max.map((value,index)=>value-position.min[index]);assert.ok(size.every(value=>value>.1),`${id} ${name} has no visibly renderable volume`)}
  assert.equal(document.meshes.length,7,`${id} source draw budget changed`);assert.equal(document.materials.length,4,`${id} material budget changed`);
  const catalog=carById(id);assert.equal(catalog.asset.metrics.race.bytes,bytes.length);assert.equal(catalog.asset.metrics.race.primitives,document.meshes.length);assert.equal(catalog.asset.raceProfile,profile);assert.equal(RACE_VISUAL_PROFILES[profile].lateralFactor,expectedFit,`${id} body fit changed without visual review`);assert.equal(RACE_VISUAL_PROFILES[profile].wheelTrack,undefined,`${id} must keep the authored wheel track`);
  const license=await readFile(licenseUrl,"utf8");assert.match(license,/Comrade1280/);assert.match(license,/CC-BY-4\.0/);assert.match(license,/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5/);
}
const adapter=await readFile(new URL("./car-visual-adapter.js",import.meta.url),"utf8");assert.match(adapter,/wheel\.root\.position\.copy\(wheel\.center\)/,"race wheels must remain centered in their authored arches");assert.doesNotMatch(adapter,/wheelTrackFit/,"visual-only wheel track override returned");assert.match(adapter,/wheel\.root\.rotation\.y=steering/);assert.match(adapter,/wheel\.roll\.rotation\.x=rotation/);
console.log("Apex Run generic utility assets passed");
