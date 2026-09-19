import * as THREE from '../vendor/three/three.module.min.js';
// Shared by sky projection and the directional shadow light.
export const CELESTIAL_DIRECTION=new THREE.Vector3(Math.cos(.8),.24,Math.sin(.8)).normalize();
export function configureShadows(renderer,light,scene) {
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  light.castShadow=true;light.shadow.mapSize.set(2048,2048);
  Object.assign(light.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:650});
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.bias=-.0002;light.shadow.normalBias=.12;
  scene.add(light.target);
}
export function followShadowLight(light,position) {
  // Snap in the fixed light basis, not world axes, to prevent crawling edges.
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),CELESTIAL_DIRECTION).normalize();
  const up=new THREE.Vector3().crossVectors(CELESTIAL_DIRECTION,right);
  const texel=200/light.shadow.mapSize.x;
  const center=position.clone();
  center.addScaledVector(right,Math.round(center.dot(right)/texel)*texel-center.dot(right));
  center.addScaledVector(up,Math.round(center.dot(up)/texel)*texel-center.dot(up));
  light.target.position.copy(center);light.position.copy(center).addScaledVector(CELESTIAL_DIRECTION,300);
  light.target.updateMatrixWorld();
}
