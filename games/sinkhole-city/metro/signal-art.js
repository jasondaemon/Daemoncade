import * as THREE from '../../vendor/three/three.module.min.js';
export function signalPrimitive(r){
 const root=new THREE.Group();root.userData.authored=true;
 r.box(root,.26,.12,.26,0x3a4d54);r.box(root,.09,3.6,.09,0x41535a,0,.12);
 for(const axis of[0,1]){
  const head=new THREE.Group();head.rotation.y=axis*Math.PI/2;head.position.set(axis ? .2 : 0,2.7,axis ? 0 : .2);root.add(head);
  r.box(head,.42,.92,.25,0x2e4149);r.box(head,.48,.07,.39,0x2e4149,0,.92,.05);
  for(let i=0;i<3;i++){
   const lens=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.035,12),r.mat(0x31454a));lens.rotation.x=Math.PI/2;lens.position.set(0,.74-i*.29,.15);lens.userData.signalLens=i+1;lens.userData.signalAxis=axis;head.add(lens);
   r.box(head,.31,.045,.22,0x2e4149,0,.88-i*.29,.16);
  }
 }
 return root;
}
export function signalAttributes(geometry,mesh){const n=geometry.attributes.position.count;geometry.setAttribute('signalLens',new THREE.BufferAttribute(new Float32Array(n).fill(mesh.userData.signalLens||0),1));geometry.setAttribute('signalAxis',new THREE.BufferAttribute(new Float32Array(n).fill(mesh.userData.signalAxis||0),1));}
export function animateSignals(material,clock){
 material.onBeforeCompile=shader=>{
  shader.uniforms.signalTime=clock;
  shader.vertexShader='attribute float signalLens;attribute float signalAxis;varying float vSignalLens;varying float vSignalAxis;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSignalLens=signalLens;vSignalAxis=signalAxis;');
  shader.fragmentShader='uniform float signalTime;varying float vSignalLens;varying float vSignalAxis;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float t=mod(signalTime,16.0);float lamp=1.0;
 if(vSignalAxis<0.5){if(t<6.0)lamp=3.0;else if(t<7.0)lamp=2.0;}
 else{if(t>=8.0&&t<14.0)lamp=3.0;else if(t>=14.0&&t<15.0)lamp=2.0;}
 vec3 signalColor=lamp<1.5?vec3(1.0,.08,.025):lamp<2.5?vec3(1.0,.57,.025):vec3(.12,1.0,.52);
 float signalOn=step(.5,vSignalLens)*(1.0-step(.25,abs(vSignalLens-lamp)));
 if(vSignalLens>.5)diffuseColor.rgb=mix(vec3(.035,.055,.06),signalColor,signalOn);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=signalColor*signalOn*.7;');
 };material.customProgramCacheKey=()=> 'city-signals-v1';
}
