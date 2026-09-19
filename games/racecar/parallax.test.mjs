import test from "node:test";
import assert from "node:assert/strict";
import { BACKDROP_RATES, backdropOffset, unwrapHeading, horizonHeight } from "./parallax.js";
import { createBackdrop, updateBackdrop } from "./backdrop.js";
import * as THREE from "../vendor/three/three.module.min.js";
test('celestial bearing follows camera rotation, not position, and returns after a lap',()=>{
 const mesh=createBackdrop(new Map(),false),camera=new THREE.PerspectiveCamera(58,1.5,.1,2000);
 const sample=(angle,x=0)=>{camera.position.set(x,10,0);const look=new THREE.Vector3(x+Math.cos(angle)*60,10,Math.sin(angle)*60);camera.lookAt(look);updateBackdrop(mesh,camera,look,angle);return mesh.material.uniforms.celestial.value.clone();};
 const a=sample(.8),turned=sample(1),translated=sample(.8,300),lap=sample(.8+Math.PI*2);
 assert.ok(Math.abs(a.x-turned.x)>.05);
 assert.ok(a.distanceTo(translated)<1e-10);
 assert.ok(a.distanceTo(lap)<1e-10);
 assert.equal(sample(.8+Math.PI).z,0);
 mesh.geometry.dispose();mesh.material.dispose();
});
test("backdrop apparent turns progressively decrease with depth", () => {
  const turn = 0.4,
    apparent = BACKDROP_RATES.map(
      (rate) => backdropOffset(turn, rate) * Math.PI / 2,
    );
  assert(Math.abs(apparent[0] - 0.1) < 1e-9);
  assert(Math.abs(apparent[1] - 0.2) < 1e-9);
  assert(Math.abs(apparent[2] - 0.4) < 1e-9);
});
test("camera angle wrap cannot jump the background", () => {
  const previous = Math.PI - 0.001,
    current = -Math.PI + 0.001;
  assert(Math.abs(unwrapHeading(previous, current) - previous - 0.002) < 1e-9);
});
test("every depth layer repeats after one lap without resetting its angle", () => {
  for (const rate of BACKDROP_RATES) {
    const repeats = backdropOffset(Math.PI * 2, rate);
    assert(Math.abs(repeats - Math.round(repeats)) < 1e-9);
  }
});
test("layers share the projected horizon rather than image bounds", () => {
  assert.equal(horizonHeight(0, 58, 58), 0.5);
  const horizon = horizonHeight(-12, 58, 58);
  assert(horizon > 0.68 && horizon < 0.7);
});
test("left and right turns scroll in opposite directions without drift", () => {
  for (const rate of BACKDROP_RATES) {
    assert.equal(backdropOffset(-0.7, rate), -backdropOffset(0.7, rate));
    assert.equal(backdropOffset(0, rate), 0);
  }
});
test("background scale and offsets are independent of world translation", () => {
  const backdrop = createBackdrop(new Map(), false);
  const camera = new THREE.PerspectiveCamera(58, 0.5);
  const look = new THREE.Vector3(58, 1, 0);
  camera.position.set(0, 13, 0);
  updateBackdrop(backdrop, camera, look, 0.7);
  const offsets = backdrop.material.uniforms.offsets.value.clone();
  const horizon = backdrop.material.uniforms.horizon.value;
  camera.position.add(new THREE.Vector3(100, 0, 300));
  look.add(new THREE.Vector3(100, 0, 300));
  updateBackdrop(backdrop, camera, look, 0.7);
  assert.deepEqual(backdrop.material.uniforms.offsets.value, offsets);
  assert.equal(backdrop.material.uniforms.horizon.value, horizon);
  backdrop.geometry.dispose();
  backdrop.material.dispose();
});
