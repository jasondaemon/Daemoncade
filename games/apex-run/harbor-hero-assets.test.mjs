import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../vendor/three/three.module.min.js";
import {placeHarborGantryCrane} from "./harbor-hero-assets.js";

const source=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(95.7,21,75.4),new THREE.MeshStandardMaterial());
mesh.position.y=10.5;source.add(mesh);
assert.equal(placeHarborGantryCrane(THREE,new THREE.Scene(),source,"low"),null);
for(const quality of ["medium","high"]){
  const scene=new THREE.Scene(),crane=placeHarborGantryCrane(THREE,scene,source,quality),box=new THREE.Box3().setFromObject(crane),size=box.getSize(new THREE.Vector3());
  assert.ok(crane&&scene.children.includes(crane));
  assert.equal(crane.userData.harborHero,"innerscene-container-gantry-crane");
  assert.ok(Math.max(size.x,size.z)<=54,"rotated crane fits shipyard deck envelope");
  assert.ok(Math.abs(box.min.y-.35)<.001,"crane is grounded");
  const shadows=[];crane.traverse(object=>{if(object.isMesh)shadows.push(object.castShadow)});
  assert.ok(shadows.length&&shadows.every(value=>value===(quality==="high")));
}
console.log("Apex Harbor hero assets passed");

const glb=fs.readFileSync(new URL("./assets/innerscene/container-gantry-crane.glb",import.meta.url));
assert.equal(glb.length,6777512,"reviewed crane payload");
assert.equal(glb.toString("utf8",0,4),"glTF");
const jsonLength=glb.readUInt32LE(12),metadata=JSON.parse(glb.toString("utf8",20,20+jsonLength).trim());
assert.equal(metadata.meshes.length,18,"actual GLB mesh count");
assert.equal(metadata.images.length,19,"actual embedded image count");
const positions=metadata.meshes.flatMap(item=>item.primitives.map(primitive=>metadata.accessors[primitive.attributes.POSITION])).filter(Boolean),mins=[0,1,2].map(axis=>Math.min(...positions.map(item=>item.min?.[axis]??Infinity))),maxs=[0,1,2].map(axis=>Math.max(...positions.map(item=>item.max?.[axis]??-Infinity)));
assert.ok(maxs[0]-mins[0]>90&&maxs[1]-mins[1]>70&&maxs[2]-mins[2]>20,"actual GLB has gantry-scale bounds");
