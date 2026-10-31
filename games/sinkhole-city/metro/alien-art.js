import * as THREE from '../../vendor/three/three.module.min.js';
import {ALIEN_GROVES,GROVE_LAYOUTS,groveVein} from './alien.js?v=groves30';

function mesh(r,parent,geometry,color,x,y,z,sx=1,sy=1,sz=1){
 const m=new THREE.Mesh(geometry,r.mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
}
export function alienGround(r,g){
 r.box(g,360,.2,360,0x493a61,0,-.22,0,true);
 // One continuous surface: separate raised grove rectangles produced visible
 // lighting seams even where their edge colors matched the background.
 const terrain=new THREE.PlaneGeometry(144,144,72,72);terrain.rotateX(-Math.PI/2);
 const p=terrain.attributes.position,colors=new Float32Array(p.count*3),base=new THREE.Color(0x493a61),basinColor=new THREE.Color(0x3d3454),color=new THREE.Color();
 for(let k=0;k<p.count;k++){
  const px=p.getX(k),pz=p.getZ(k);color.copy(base);
  for(const [i,[x,z]]of ALIEN_GROVES.entries()){
   const a=GROVE_LAYOUTS[i].angle,dx=px-x,dz=pz-z,lx=Math.cos(a)*dx-Math.sin(a)*dz,ly=(-Math.sin(a)*dx-Math.cos(a)*dz)/GROVE_LAYOUTS[i].stretch,angle=Math.atan2(ly,lx),edge=12.5+Math.sin(angle*3+i)*1.4+Math.cos(angle*5-i*.6)*.8,d=Math.hypot(lx,ly/.8)/edge,t=1-THREE.MathUtils.smoothstep(d,.6,1);
   if(t>0)color.lerp(new THREE.Color(i%2?0x625077:0x55476f),t);
  }
  color.lerp(basinColor,(1-THREE.MathUtils.smoothstep(Math.hypot(px,pz+4),7,14))*.75);color.toArray(colors,k*3);p.setY(k,.005);
 }
 terrain.setAttribute('color',new THREE.BufferAttribute(colors,3));const source=r.mat(0x493a61,true),material=source.clone();material.onBeforeCompile=source.onBeforeCompile;material.customProgramCacheKey=source.customProgramCacheKey;material.color.setHex(0xffffff);material.vertexColors=true;
 const surface=new THREE.Mesh(terrain,material);surface.userData.ownedMaterial=true;g.add(surface);
 for(const [i,[x,z]]of ALIEN_GROVES.entries()){
  // Curved veins terminate at the actual pod positions, not decorative spokes.
  for(let j=0;j<3;j++){
   for(let k=0;k<12;k++){
    const a=groveVein(i,j,k/12),b=groveVein(i,j,(k+1)/12),dx=b.x-a.x,dz=b.z-a.z;
    const seam=r.box(g,.14,.012,Math.hypot(dx,dz)+.025,0x88aaa7,x+(a.x+b.x)/2,.021,z+(a.z+b.z)/2,true);seam.rotation.y=Math.atan2(dx,dz);
   }
  }
 }
 for(let i=0;i<32;i++){
  const a=i*Math.PI*2/32,d=60+i%4*3,m=new THREE.Mesh(new THREE.IcosahedronGeometry(6+i%5,1),r.mat(i%2?0x62516c:0x756281,true));m.position.set(Math.cos(a)*d,-2,Math.sin(a)*d);m.scale.set(1,.55+i%3*.2,1);g.add(m);
 }
}
export function alienPrimitive(r,type){
 if(!['shard','spore','resonator','pod','crystal','monolith','landmark:portal'].includes(type))return null;
 const root=new THREE.Group();root.userData.authored=true;
 const add=(geometry,color,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>mesh(r,root,geometry,color,x,y,z,sx,sy,sz);
 const ring=(radius,tube,color,y)=>{const m=add(new THREE.TorusGeometry(radius,tube,6,24),color,0,y);m.rotation.x=Math.PI/2;return m;};
 const crystal=(x,z,height,width,color)=>{
  add(new THREE.CylinderGeometry(width*.65,width,height*.65,5),color,x,height*.325,z);
  add(new THREE.ConeGeometry(width*.65,height*.45,5),0xc4f4e2,x,height*.875,z);
 };
 if(type==='shard'||type==='crystal'){
  add(new THREE.IcosahedronGeometry(.5,0),0x746a83,0,.12,0,1,.35,1);
  crystal(0,0,type==='shard'?.7:2,.23,0x7acfb9);
  if(type==='crystal'){crystal(.4,.1,1.1,.2,0xa78cdd);crystal(-.3,-.2,.8,.2,0x8bcfc6);}
 }else if(type==='spore'){
  add(new THREE.CylinderGeometry(.085,.17,1,10),0xb4a5c8,0,.5);
  const cap=add(new THREE.SphereGeometry(.65,16,10,0,Math.PI*2,0,Math.PI*.6),0xc58da9,0,1);cap.scale.y=.65;
  ring(.59,.035,0xffd292,.94);
  for(let i=0;i<10;i++){
   const a=i*Math.PI/5,dx=Math.cos(a),dz=Math.sin(a);
   const gill=add(new THREE.BoxGeometry(.018,.04,.5),0xf1cca8,dx*.3,.95,dz*.3);gill.rotation.y=Math.PI/2-a;
   if(i%2===0)add(new THREE.SphereGeometry(.045,6,4),0xffe6b8,dx*.32,1.36,dz*.32);
  }
  for(const side of[-1,1]){const leaf=add(new THREE.SphereGeometry(.25,10,6),0x92baa4,side*.18,.18,0,1,.2,.5);leaf.rotation.z=side*.4;}
 }else if(type==='resonator'){
  add(new THREE.CylinderGeometry(.8,1,.3,8),0x8380a4,0,.15);ring(.72,.08,0xf6d390,.35);
  crystal(0,0,2.6,.46,0x68d7c8);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;crystal(Math.cos(a)*.7,Math.sin(a)*.7,1.2,.22,0xb5a0e8);}
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3,m=add(new THREE.BoxGeometry(.08,.55,.18),0xe4cf9e,Math.cos(a)*.75,.55,Math.sin(a)*.75);m.rotation.y=-a;
  }
  for(const y of[1.1,1.7])ring(.4,.025,0xd6eed5,y);
 }else if(type==='pod'){
  root.userData.openBoundsExpand=2.1;
  add(new THREE.SphereGeometry(.8,12,8),0x596d87,0,.2,0,1,.3,1);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3,dx=Math.cos(a),dz=Math.sin(a),m=add(new THREE.SphereGeometry(.5,12,10),i%2?0x8276a7:0xb4a0cf,dx*.5,.8,dz*.5,.7,1.5,.7);m.userData.petal={x:dx,z:dz};
   // Ribs belong to the petal hierarchy, so they open with the shell.
   const rib=new THREE.Mesh(new THREE.SphereGeometry(.5,6,8),r.mat(0xd9c3a1));rib.scale.set(.08,.94,1.02);rib.rotation.y=-a;rib.userData.petal=m.userData.petal;m.add(rib);
  }
  add(new THREE.IcosahedronGeometry(.48,1),0xffd497,0,.8);ring(.65,.055,0xa7e9da,.35);
 }else if(type==='monolith'){
  for(let i=0;i<3;i++){
   const m=add(new THREE.CylinderGeometry(.5+i*.15,.8,3+i,5),i%2?0x8e79a4:0x70668e,(i-1)*.8,(3+i)/2,(i%2)*.4);m.rotation.z=(i-1)*.1;
   r.box(root,.08,2.5,.04,0x95dccf,(i-1)*.8,.7,.76);
  }
 }else{
  add(new THREE.CylinderGeometry(3.8,4.2,.5,12),0x777b9c,0,.25);
  const arch=add(new THREE.TorusGeometry(2.8,.42,8,32),0x8c82aa,0,3.3);arch.rotation.y=.15;
  const inner=add(new THREE.TorusGeometry(2.8,.09,6,32),0x9be6d5,0,3.3,.43);inner.rotation.y=.15;
  for(const x of[-3.2,3.2]){r.box(root,.9,2.8,1.3,0x6c638a,x,.5);crystal(x,0,3.4,.35,0xbda3e8);}
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;add(new THREE.OctahedronGeometry(.17),0xffd597,Math.cos(a)*2.8,3.3+Math.sin(a)*2.8,.5);}
 }
 return root;
}
