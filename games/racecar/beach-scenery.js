import * as THREE from '../vendor/three/three.module.min.js';
import {mainlandCoast,beachSites} from './coast.js?v=39';
import {detailSurface} from './surfaces.js?v=39';
export function addBeachScenery(group,track) {
 const {shore}=mainlandCoast(track),vertices=[];
 for(let i=1;i<shore.length;i++) {
  const a=shore[i-1],b=shore[i];
  vertices.push(a.x,-.015,a.z,b.x,-.015,b.z,a.x+27,-.015,a.z,b.x,-.015,b.z,b.x+27,-.015,b.z,a.x+27,-.015,a.z);
 }
 const sandGeo=new THREE.BufferGeometry();sandGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));sandGeo.computeVertexNormals();
 const sand=new THREE.Mesh(sandGeo,detailSurface(new THREE.MeshStandardMaterial({color:0xe4ca91,roughness:1,side:THREE.DoubleSide})));
 sand.userData.owned=true;sand.receiveShadow=true;group.add(sand);
 const batches=new Map(),pose=new THREE.Object3D(),palette=[0xe77d61,0x65bbc5,0xe6c969,0x8aaccd];
 function add(shape,color,x,y,z,sx,sy,sz,angle=0,tilt=0) {
  const key=shape+':'+color;
  if(!batches.has(key))batches.set(key,{shape,color,items:[]});
  batches.get(key).items.push({x,y,z,sx,sy,sz,angle,tilt});
 }
 const {umbrellas,houses}=beachSites(track);
 for(const u of umbrellas) {
  add('pole',0xf5ead2,u.x,1.65,u.z,.1,3.3,.1);
  for(let i=0;i<8;i++)add('panel',i%2?0xfff4d6:palette[u.color],u.x,3.4,u.z,1,1,1,i*Math.PI/4);
  add('box',palette[u.color],u.x+2,.015,u.z+1,1.5,.04,3.6,.2);
  for(const side of [-1,1]) {
   add('box',0xf7e9cd,u.x+side*1.3,.45,u.z+2.2,.85,.12,1.7);
   add('box',0xf7e9cd,u.x+side*1.3,.9,u.z+2.9,.85,1.05,.12,0,-.2);
  }
 }
 for(const h of houses) {
  const part=(color,x,y,z,sx,sy,sz,tilt=0)=>add('box',color,h.x+x*Math.cos(h.angle)+z*Math.sin(h.angle),y,h.z-x*Math.sin(h.angle)+z*Math.cos(h.angle),sx,sy,sz,h.angle,tilt);
  for(const x of [-3,3])for(const z of [-2.4,2.4])part(0xc5b08b,x,1.2,z,.35,2.4,.35);
  part(0xe9d9b9,0,2.2,0,9,.3,8);
  part(palette[h.color],0,4.4,0,7,4.2,5.8);
  for(let y=2.6;y<6.5;y+=.4)for(const z of [-2.93,2.93])part(0xf6efd9,0,y,z,7,.035,.08);
  for(const x of [-3.5,3.5])for(const z of [-2.95,2.95])part(0xf6efd9,x,4.4,z,.17,4.3,.17);
  for(const side of [-1,1])part(0x657b84,side*2,7,0,4.6,.3,7,side*-.42);
  part(0xf6efd9,0,3.65,2.96,1.4,2.6,.14);
  for(const x of [-2.3,2.3])for(const z of [-2.96,2.96]) {
   part(0xf6efd9,x,4.6,z,1.6,1.8,.13);
   part(0x365d71,x,4.6,z*1.006,1.25,1.45,.14);
   part(0xf6efd9,x,4.6,z*1.035,.07,1.5,.1);part(0xf6efd9,x,4.6,z*1.035,1.3,.07,.1);
   for(const side of [-1,1])part(0x657b84,x+side*1,4.6,z*1.025,.32,1.7,.14);
  }
  for(const x of [-4,4])part(0xf6efd9,x,2.9,3.6,.13,1.3,.13);
  part(0xf6efd9,0,3.5,3.6,8,.12,.12);
  for(let x=-3.6;x<4;x+=.6)part(0xf6efd9,x,2.9,3.6,.07,1.1,.07);
  for(let step=0;step<5;step++)part(0xe9d9b9,0,.2+step*.4,6-step*.45,2.2,.4+step*.8,.5);
  for(const x of [-2.4,2.4]){part(0x657b84,x,2.6,3.5,1.4,.45,.6);part(0x365f48,x,2.95,3.5,1.3,.3,.55);}
 }
 for(const {shape,color,items} of batches.values()) {
  const geometry=shape==='panel'?new THREE.ConeGeometry(3.1,1.3,1,1,true,0,Math.PI/4):shape==='pole'?new THREE.CylinderGeometry(1,1,1,6):new THREE.BoxGeometry(1,1,1);
  const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.85,side:shape==='panel'?THREE.DoubleSide:THREE.FrontSide}),items.length);
  items.forEach((p,i)=>{pose.position.set(p.x,p.y,p.z);pose.rotation.set(0,p.angle,p.tilt);pose.scale.set(p.sx,p.sy,p.sz);pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);});
  mesh.userData.owned=true;mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
 }
}
