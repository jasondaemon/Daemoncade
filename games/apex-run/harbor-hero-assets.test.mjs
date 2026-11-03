import assert from "node:assert/strict";
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
  assert.equal(crane.children[0].castShadow,quality==="high");
}
console.log("Apex Harbor hero assets passed");
