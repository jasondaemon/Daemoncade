import * as THREE from '../../vendor/three/three.module.min.js';
import {surfaceColor} from './surfaces.js?v=quality14';

export function orbitGround(r,g){
 r.box(g,360,.2,360,0x15213c,0,-.22,0,true);
 // Belt guides are drawn in the ground shader so they contract continuously
 // with the actual simulation, without rebuilding geometry every frame.
}

export function orbitPrimitive(r,type){
 if(!['debris','satellite','probe','shuttle','landmark:sun'].includes(type)&&!type.startsWith('planet:'))return null;
 const root=new THREE.Group();root.userData.authored=true;
 const add=(geometry,color,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geometry,r.mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m;};
 const box=(w,h,d,color,x=0,y=0,z=0)=>r.box(root,w,h,d,color,x,y,z);
 const sphere=(radius,color,x,y,z,sx=1,sy=1,sz=1)=>add(new THREE.SphereGeometry(radius,24,16),color,x,y,z,sx,sy,sz);
 const ring=(radius,tube,color,y)=>{const m=add(new THREE.TorusGeometry(radius,tube,6,48),color,0,y);m.rotation.x=Math.PI/2;return m;};
 const globe=(radius,variant)=>{
  const geometry=new THREE.SphereGeometry(radius,48,32),position=geometry.attributes.position,colors=new Float32Array(position.count*3),c=new THREE.Color();
  for(let i=0;i<position.count;i++){const rgb=surfaceColor(variant,position.getX(i)/radius,position.getY(i)/radius,position.getZ(i)/radius);c.setRGB(...rgb,THREE.SRGBColorSpace);colors.set([c.r,c.g,c.b],i*3);}
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));return add(geometry,0xffffff,0,radius);
 };
 const panel=(x,z,w=1.2,d=1.5)=>{
  box(w,.08,d,0x738eaf,x,.5,z);box(w-.08,.035,d-.08,0x315d91,x,.59,z);
  for(let i=-2;i<=2;i++)box(w-.08,.012,.018,0x91c9df,x,.63,z+i*d/6);
  box(.025,.012,d-.08,0x91c9df,x,.63,z);
 };
 if(type==='debris'){
  add(new THREE.IcosahedronGeometry(.5,1),0x8f9ba8,0,.35,0,1,.7,.85);
  add(new THREE.IcosahedronGeometry(.16,0),0xc6b9a4,.24,.55,.04,1,.6,1);
 }else if(type==='satellite'){
  box(.6,.7,.65,0xe4d1a0,0,.15);box(3,.08,.08,0xabb8c8,0,.48);
  panel(-1.1,0);panel(1.1,0);
  const dish=add(new THREE.ConeGeometry(.35,.15,16,1,true),0xe5e9df,0,1);dish.rotation.x=Math.PI;
  box(.03,.45,.03,0xc5d8e3,0,.92);
 }else if(type==='probe'){
  add(new THREE.CylinderGeometry(.45,.52,1.2,10),0xe4d4ae,0,.6);ring(.47,.045,0xb19568,.4);ring(.43,.045,0xb19568,1);
  for(const x of[-1.15,1.15])panel(x,0,.95,1.7);
  const dish=add(new THREE.ConeGeometry(.7,.3,16,1,true),0xd8e8e5,0,1.6);dish.rotation.z=.3;
  box(.035,.8,.035,0xc3d9df,0,1.5);
  for(const x of[-.45,.45])box(.12,.18,.3,0x72c5d7,x,.16,-.5);
 }else if(type==='shuttle'){
  sphere(.6,0xe1e7e2,0,.55,0,1,.75,2.4);
  sphere(.4,0x365f81,0,.83,.8,1,.5,1.4);
  const wing=new THREE.Shape();wing.moveTo(-.4,1);wing.lineTo(-1.8,-1.2);wing.lineTo(1.8,-1.2);wing.lineTo(.4,1);wing.closePath();
  const m=add(new THREE.ExtrudeGeometry(wing,{depth:.1,bevelEnabled:false}),0xc6d7e0,0,.45);m.rotation.x=Math.PI/2;
  box(.15,1.2,.9,0x658da8,0,.6,-.75);
  for(const x of[-.34,.34]){const engine=add(new THREE.CylinderGeometry(.23,.29,.4,12),0x435d79,x,.5,-1.35);engine.rotation.x=Math.PI/2;sphere(.18,0x8ee4eb,x,.5,-1.6,1,1,.4);}
  box(2.4,.025,.13,0xd0a85f,0,.57,-.7);
 }else if(type.startsWith('planet:')){
  const variant=type.split(':')[1];globe(2,variant);
  if(variant==='ringed'){
   const geometry=new THREE.RingGeometry(2.45,3.35,96,12),position=geometry.attributes.position,colors=new Float32Array(position.count*3),c=new THREE.Color();
   for(let i=0;i<position.count;i++){const d=Math.hypot(position.getX(i),position.getY(i)),shade=.5+.5*Math.sin(d*57);c.setHex(0xbca9b0).lerp(new THREE.Color(0xe6d2aa),shade*.65);colors.set([c.r,c.g,c.b],i*3);}
   geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));const m=add(geometry,0xffffff,0,2);m.rotation.set(-Math.PI/2+.25,0,.1);
  }
 }else{
  globe(2.6,'sun');
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,m=add(new THREE.TorusGeometry(.65,.045,5,20,Math.PI*1.4),i%2?0xffb451:0xffdf8a,Math.cos(a)*2.2,2.6+Math.sin(a)*1.5,Math.sin(a)*1.65);m.rotation.set(i*.6,a,.4);
  }
 }
 return root;
}
