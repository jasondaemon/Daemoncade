import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.min.js';
import {configureShadows,followShadowLight,CELESTIAL_DIRECTION} from './lighting.js';
test('shadow light keeps the celestial bearing while following the track',()=>{
 const light=new THREE.DirectionalLight(),renderer={shadowMap:{}};
 configureShadows(renderer,light,new THREE.Scene());
 for(const point of [new THREE.Vector3(0,0,0),new THREE.Vector3(800,4,-250)]) {
  followShadowLight(light,point);
  assert.ok(light.position.clone().sub(light.target.position).normalize().distanceTo(CELESTIAL_DIRECTION)<1e-10);
  assert.ok(light.target.position.distanceTo(point)<.15);
 }
 assert.equal(renderer.shadowMap.enabled,true);assert.equal(light.shadow.mapSize.x,2048);
});
