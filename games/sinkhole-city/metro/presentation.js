import * as THREE from '../../vendor/three/three.module.min.js';

export function animatePod(mesh,count){
 const opening=new THREE.InstancedBufferAttribute(new Float32Array(count),1);mesh.geometry.setAttribute('podOpening',opening);
 for(const material of[mesh.material,mesh.customDepthMaterial]){
  material.onBeforeCompile=shader=>{
   shader.vertexShader='attribute vec3 podOpenOffset;attribute vec3 podOpenNormal;attribute float podOpening;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=podOpenOffset*podOpening;');
   shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(mix(objectNormal,podOpenNormal,podOpening));');
  };
  material.customProgramCacheKey=()=> 'alien-pod-opening-v1';
 }
 return opening;
}

// Fixed pool of eight local rings. No bloom pass, new canvas, particle storm,
// real-time timers, or allocations in the render loop. Pauses freeze their age.
export class LocalPulses{
 constructor(scene){
  this.geometry=new THREE.RingGeometry(.94,1,48);this.items=[];
  for(let i=0;i<8;i++){
   const material=new THREE.MeshBasicMaterial({color:0x9ff2d6,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
   const mesh=new THREE.Mesh(this.geometry,material);mesh.rotation.x=-Math.PI/2;mesh.visible=false;mesh.renderOrder=2;scene.add(mesh);this.items.push({mesh,start:-100,duration:.7,radius:1});
  }
 }
 clear(){for(const item of this.items){item.start=-100;item.mesh.visible=false;}}
 add(x,z,time,radius=4,color=0x9ff2d6,delay=0){
  const item=this.items.find(i=>i.start<0)||this.items.reduce((a,b)=>a.start<b.start?a:b);
  item.start=time+delay;item.duration=.7;item.radius=radius;item.mesh.position.set(x,.09,z);item.mesh.material.color.setHex(color);
 }
 event(event,run,disabled){
  if(disabled||!event.object)return;
  const o=event.object;
  if(event.type==='streak'){
   this.add(run.player.x,run.player.z,run.time,run.player.radius*1.4,event.chain>=25?0xffdf94:0x9ff2d6);
  }else if(event.type==='chain'){
   this.add(o.x,o.z,run.time,5);
   for(const pod of run.objects)if(pod.grove===o.grove&&pod.type==='pod')this.add(pod.x,pod.z,run.time,1.8,0xffd58e,.3);
  }else if(event.type==='portal'||event.type==='solar')this.add(o.x,o.z,run.time,7,0xffd58e);
  else if(event.type==='consume'&&['planet','landmark','wreck'].includes(o.type))this.add(o.x,o.z,run.time,Math.min(7,o.radius*1.4),0xd5b6ff);
 }
 update(time,disabled){
  if(disabled){this.clear();return;}
  for(const item of this.items){
   const t=(time-item.start)/item.duration;item.mesh.visible=item.start>=0&&t>=0&&t<1;
   if(t>=1){item.start=-100;continue;}if(!item.mesh.visible)continue;
   item.mesh.scale.setScalar(.15+item.radius*(1-(1-t)**2));item.mesh.material.opacity=(1-t)*.42;
  }
 }
}
