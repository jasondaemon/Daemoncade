import * as THREE from '../../vendor/three/three.module.min.js';
export function personPrimitive(r,style=0){
 const root=new THREE.Group();root.userData.authored=true;
 const part=(geometry,color,x,y,z,limb=0,pivot=[0,0,0])=>{const m=new THREE.Mesh(geometry,r.mat(color));m.position.set(x,y,z);m.userData.walkLimb=limb;m.userData.walkPivot=pivot;root.add(m);return m;};
 part(new THREE.SphereGeometry(.22,10,8),[0x67a6a8,0xda9a65,0x8d94c5,0xb78c5d,0xe2a467,0x6e9e86][style%6],0,.92,0,0);root.children[0].scale.set(1,1.35,.7);
 part(new THREE.SphereGeometry(.18,10,8),0xe0b48d,0,1.4,0);
 part(new THREE.SphereGeometry(.185,10,6,0,Math.PI*2,0,Math.PI*.55),0x4b3b3d,0,1.46,0);
 if(style===1)part(new THREE.CylinderGeometry(.22,.22,.06,12),0xe2c39a,0,1.59,0);
 if(style>=3){
  part(new THREE.CylinderGeometry(style===5?.28:.22,.22,.07,12),style===4?0xc97658:0xbab28e,0,1.6,0);
  if(style===3){part(new THREE.BoxGeometry(.32,.45,.19),0x526f64,0,.96,-.23);part(new THREE.BoxGeometry(.34,.08,.2),0xc2c3a1,0,1.18,-.23);}
  if(style===5){
   const rod=part(new THREE.CylinderGeometry(.018,.025,1.25,6),0x68776c,.25,1.1,.6,2,[.27,1.13,0]);rod.rotation.x=.8;
   part(new THREE.CylinderGeometry(.004,.004,.85,4),0xc6cdb5,.25,.7,1.05,2,[.27,1.13,0]);
  }
 }
 for(const side of[-1,1]){
  part(new THREE.CylinderGeometry(.075,.065,.58,8),0x3f536a,side*.11,.4,0,side,[side*.11,.71,0]);
  part(new THREE.BoxGeometry(.15,.12,.27),0x2d3b49,side*.11,.08,.055,side,[side*.11,.71,0]);
  part(new THREE.CylinderGeometry(.058,.05,.5,8),0xe0b48d,side*.27,.88,0,side*2,[side*.27,1.13,0]);
  part(new THREE.SphereGeometry(.027,6,4),0x273c45,side*.065,1.43,.16);
 }
 return root;
}
export function personAttributes(geometry,mesh,normal){
 const count=geometry.attributes.position.count,pivot=new THREE.Vector3(...(mesh.userData.walkPivot||[0,0,0])).applyMatrix4(normal),limbs=new Float32Array(count).fill(mesh.userData.walkLimb||0),pivots=new Float32Array(count*3);
 for(let i=0;i<count;i++)pivots.set([pivot.x,pivot.y,pivot.z],i*3);
 geometry.setAttribute('walkLimb',new THREE.BufferAttribute(limbs,1));geometry.setAttribute('walkPivot',new THREE.BufferAttribute(pivots,3));
}
export function animatePeople(mesh,objects,time){
 mesh.geometry.setAttribute('walkLift',new THREE.InstancedBufferAttribute(new Float32Array(objects.length),1));
 mesh.geometry.setAttribute('walkPace',new THREE.InstancedBufferAttribute(new Float32Array(objects.length).fill(1),1));
 mesh.geometry.setAttribute('walkPhase',new THREE.InstancedBufferAttribute(Float32Array.from(objects,o=>o.id*2.399),1));
 const patch=material=>{material.onBeforeCompile=shader=>{
  shader.uniforms.walkTime=time;
  shader.vertexShader='attribute float walkLimb;attribute vec3 walkPivot;attribute float walkPace;attribute float walkPhase;attribute float walkLift;mat3 personGait(){float a=sin(walkPhase)*sign(walkLimb)*(abs(walkLimb)>1.5?-0.65:0.7)*min(walkPace,1.4);float ca=cos(a),sa=sin(a);return mat3(1.0,0.0,0.0,0.0,ca,sa,0.0,-sa,ca);}\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=personGait()*objectNormal;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=personGait()*(transformed-walkPivot)+walkPivot;transformed.y+=walkLift;');
 };material.customProgramCacheKey=()=> 'city-person-gait-v1';};
 patch(mesh.material);patch(mesh.customDepthMaterial);
}
export function footLift(phase,pace){const angle=Math.sin(phase)*.7*Math.min(pace,1.4);return .02-(.71-.69*Math.cos(angle)-.19*Math.abs(Math.sin(angle)));}
