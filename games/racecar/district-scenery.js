import * as THREE from '../vendor/three/three.module.min.js';
import {districtSites} from './district-sites.js?v=39';
import {sceneryGeometry} from './scenery-geometry.js?v=39';
// Small landmark assemblies share instanced geometries/materials across a circuit.
export function addDistrictScenery(group,track,id) {
 const {sites,marine}=districtSites(track,id),batches=new Map(),pose=new THREE.Object3D();
 function add(s,color,x,y,z,w,h,d,shape='box',tilt=0) {
  const key=shape+':'+color;
  if(!batches.has(key))batches.set(key,{shape,color,items:[]});
  batches.get(key).items.push({x:s.x+x*Math.cos(s.angle)+z*Math.sin(s.angle),y,z:s.z-x*Math.sin(s.angle)+z*Math.cos(s.angle),w,h,d,angle:s.angle,tilt});
 }
 function building(s,wall,roof,w=9,h=5) {
  add(s,0x9c988a,0,.15,0,w+4,.3,10);
  add(s,wall,0,h/2,0,w,h,6);
  for(const side of [-1,1])add(s,roof,side*w/4,h+.8,0,w*.57,.3,7.5,'box',-side*.38);
  for(const z of [-3.03,3.03])add(s,wall,0,h,z,w,1.7,.1,'gable');
  add(s,roof,0,h+1.68,0,.3,.23,7.6);
  // Siding courses, corner boards and raised window joinery.
  for(let y=.5;y<h;y+=.55)for(const z of [-3.09,3.09])add(s,0xeadbb7,0,y,z,w,.045,.065);
  for(const x of [-w/2,w/2])for(const z of [-3.12,3.12])add(s,0xeadbb7,x,h/2,z,.18,h,.18);
  for(let z=-3.5;z<=3.5;z+=.65)for(const side of [-1,1])add(s,roof,side*w/4,h+.86,z,w*.57,.055,.06,'box',-side*.38);
  add(s,0xeadbb7,0,1.4,3.05,1.5,2.8,.12);
  for(const x of [-w*.32,w*.32])for(const z of [-3.06,3.06]) {
   add(s,0xeadbb7,x,2.9,z,1.8,1.8,.14);add(s,0x42667b,x,2.9,z*1.005,1.45,1.4,.15);
   add(s,0xeadbb7,x,2.9,z*1.04,.075,1.5,.12);add(s,0xeadbb7,x,2.9,z*1.04,1.5,.075,.12);
   add(s,roof,x,1.96,z*1.07,2,.12,.38);
   for(const side of [-1,1]){
    add(s,roof,x+side*1.18,2.9,z*1.03,.45,1.7,.16);
    for(let y=2.3;y<3.6;y+=.22)add(s,0xeadbb7,x+side*1.18,y,z*1.065,.4,.04,.06);
   }
  }
  add(s,roof,0,2.98,3.55,2.2,.15,1.3);
  for(let step=0;step<3;step++)add(s,0x9c988a,0,.1+step*.12,4.4-step*.35,2.4,.2+step*.24,.45);
  add(s,0x42667b,0,1.85,3.13,.9,1.25,.06);add(s,0xeadbb7,.48,1.2,3.2,.12,.12,.12);
 }
 function tree(s,x,z,size=1) {
  add(s,0x806246,x,2*size,z,.4,4*size,.4);
  add(s,id==='desert'?0x77774c:0x365f48,x,4.7*size,z,3*size,4*size,3*size,id==='mountain'?'cone':'rock');
  if(id==='mountain')for(let j=0;j<2;j++)add(s,0x365f48,x,(3.2+j*.8)*size,z,(4-j*.7)*size,3*size,(4-j*.7)*size,'cone');
 }
 for(const s of sites) {
  const road=track.points.reduce((a,b)=>Math.hypot(a.x-s.x,a.y-s.z)<Math.hypot(b.x-s.x,b.y-s.z)?a:b);
  const dx=road.x-s.x,dz=road.y-s.z,distance=Math.hypot(dx,dz),length=distance-20;
  const access={x:s.x+dx*(8+length/2)/distance,z:s.z+dz*(8+length/2)/distance,angle:Math.atan2(dx,dz)};
  add(access,id==='city'?0x4e5d65:0xa6997d,0,.02,0,3,.04,length);
  if(id==='beach') {
   building(s,[0xeac582,0x80b9b4,0xd8a28b][s.index%3],0x947353,8,4);
   add(s,0xf6ead1,0,3.2,5,10,.22,4);for(const x of [-4,4])add(s,0x947353,x,1.6,6,.22,3.2,.22);
   add(s,0x7dcbc2,0,1.3,5,6,1.5,.6);
   for(let x=-4.5;x<5;x+=1)add(s,0x7dcbc2,x,3.35,5,.5,.14,4.1);
   add(s,0x947353,0,2.7,6.25,5,.55,.12);
   for(const x of [-2,0,2]){add(s,0xf6ead1,x,1.2,7,.8,.15,.8,'cylinder');add(s,0x947353,x,.6,7,.14,1.2,.14,'cylinder');}
   tree(s,-9,-5);tree(s,8,-4,.8);
  } else if(id==='desert') {
   if(s.index%3===0) {
    building(s,0xc99a70,0x995b47,12,4);
    add(s,0xe9c488,0,4.7,8,15,.4,7);
    for(const x of [-6,6])add(s,0xb68e6c,x,2.3,8,.3,4.6,.3);
    for(const x of [-3,3]){
     add(s,0xc85644,x,1,8,1.2,2,1);add(s,0x34494e,x,1.5,8.55,.8,.5,.08);
     add(s,0xe9c488,x,2.15,8,1.3,.35,1.1);add(s,0xe9c488,x,2.65,8,.6,.65,.6,'cylinder');
     add(s,0x34494e,x+.72,1.1,8,.08,1.6,.1);add(s,0x34494e,x+.57,.4,8,.35,.08,.1);
    }
    add(s,0xc85644,0,4.7,11.55,15,.25,.12);
   } else {
    building(s,0xc7b29a,0x86624e,9,3.6);
    add(s,0x77756b,7,5,-2,3,5,3,'cylinder');
    for(const x of [5.8,8.2])add(s,0x72543e,x,1.7,-2,.25,3.4,.25);
    for(const y of [2.7,4.1,5.5,7.3])add(s,0x72543e,7,y,-2,3.1,.12,3.1,'cylinder');
    for(const x of [6.6,7.4])add(s,0x72543e,x,3.7,-.4,.1,7,.1);
    for(let y=.4;y<7;y+=.5)add(s,0x72543e,7,y,-.4,.9,.08,.1);
   }
   for(let j=0;j<4;j++)add(s,0x957d55,-10+j*5,.45,-8,2,.9,1.8,'rock');
  } else if(id==='coast') {
   // Seafront cafes and landscaped rest areas complement the beach houses.
   building(s,0xe7d8b4,0x718d96,10,4);
   add(s,0x679ea8,0,3.3,5,11,.2,4);
   for(let x=-5;x<5;x+=1)add(s,0xe7d8b4,x,3.43,5,.5,.08,4);
   for(const x of [-3,3])for(const z of [4.3,7.6]){add(s,0x7c6d54,x,.45,z,1.8,.12,.6);for(const leg of [-.65,.65])add(s,0x7c6d54,x+leg,.2,z,.1,.4,.1);}
   for(const x of [-3,3]){add(s,0xe9d2a2,x,.85,6,2.5,.15,2);add(s,0x7c6d54,x,.4,6,.2,.8,.2);}
   tree(s,-9,-5,1.2);tree(s,9,-6);
  } else if(id==='mountain') {
   building(s,0x9a7352,0x4a5a60,10,5.5);
   add(s,0x9e978c,3,6.3,-1,1.1,3,1.1);
   for(let y=5;y<8;y+=.35)add(s,0x4a5a60,3,y,-1,1.13,.05,1.13);
   add(s,0x4a5a60,3,7.95,-1,1.5,.25,1.5);
   for(let y=.6;y<5.4;y+=.65)for(const x of [-5,5])add(s,0x9a7352,x,y,0,.4,.45,6.7,'cylinder');
   for(const x of [-4,-2,0,2,4])add(s,0xbcb294,x,.9,5,.14,1.6,.14);
   for(let j=0;j<5;j++)tree(s,-12+j*6,-12-(j%2)*5,1+(j%3)*.3);
   for(const x of [-5,5])add(s,0xbcb294,x,.9,5,.2,1.8,.2);
   add(s,0xbcb294,0,1.5,5,10,.14,.14);
  } else if(id==='city') {
   const h=10+s.index%4*6;
   add(s,0x304555,0,h/2,0,12,h,10);add(s,0x203340,0,h+.2,0,13,.4,11);
   for(let y=1;y<h;y+=3)add(s,0x203340,0,y,0,12.3,.22,10.3);
   for(const x of [-6,0,6])for(const z of [-5.15,5.15])add(s,0x658593,x,h/2,z,.18,h,.15);
   add(s,0x658593,2,h+1.1,0,3,1.8,2.5);
   for(let z=-1;z<=1;z+=.3)add(s,0x203340,2,h+2.03,z,2.7,.06,.1);
   for(let y=3;y<h-1;y+=3)for(const x of [-4,-1,2,5])for(const z of [-5.06,5.06])
    add(s,(y+x+s.index)%3?0xe5bd79:0x658593,x,y,z,1.2,1.5,.12);
   for(let y=3;y<h-1;y+=3)for(const z of [-3,0,3])for(const x of [-6.07,6.07])
    add(s,(y+z+s.index)%4?0xe5bd79:0x658593,x,y,z,.12,1.5,1.2);
   // One asymmetric fire-escape stack breaks the tower's box silhouette.
   for(let y=4;y<h-2;y+=3){
    add(s,0x203340,6.8,y,0,1.5,.15,3);
    add(s,0x658593,7.5,y+.6,0,.08,1.2,3);
    for(const z of [-1.1,1.1])add(s,0x658593,7,y+1.4,z,.08,2.8,.08);
    for(let step=0;step<6;step++)add(s,0x658593,7,y+step*.5,0,.09,.07,2.3);
   }
   add(s,0x83c7c9,0,3,6,12,.35,2.5);
   for(const x of [-4,-1,2,5]){add(s,0x263d4c,x,1.4,5.1,2.3,2.5,.12);add(s,0x658593,x,1.4,5.2,.1,2.5,.1);}
   add(s,0x304555,-8,1.8,4,.3,3.6,.3);add(s,0xe5bd79,-8,3.7,4,2,.2,1);
   for(let j=0;j<3;j++){const x=-5+j*5;add(s,[0x98645d,0x688e9b,0xb5ac8e][j],x,.65,10,3,1.2,1.6);add(s,0x263d4c,x,1.4,10,1.7,.6,1.5);for(const dx of [-1,1])for(const z of [9.18,10.82])add(s,0x203340,x+dx,.4,z,.6,.6,.2,'ring');for(const z of [9.5,10.5])add(s,0xe5bd79,x-1.52,.8,z,.1,.25,.3);}
  }
 }
 for(const s of marine) {
  // Local +Z points back toward shore: pier joins the dry bank to its mooring.
  add(s,0x927656,0,.6,27,3,.45,54);
  add(s,0x927656,0,.6,3,18,.45,3);
  for(let z=1;z<54;z+=1.3)add(s,0x7b624a,0,.835,z,3,.012,.045);
  for(let z=2;z<=52;z+=8)for(const x of [-1.6,1.6])add(s,0x72604b,x,.4,z,.32,2,.32,'cylinder');
  for(let z=3;z<50;z+=8)for(const x of [-1.6,1.6]){add(s,0xe7e0c6,x,1.1,z,.45,.2,.45,'cylinder');add(s,0x72604b,x,1.1,z+3.5,.055,.055,7);}
  for(const side of [-1,1]) {
   const x=side*8;
   add(s,side<0?0x477f9a:0xb66451,x,.5,-4,4,1.6,10,'hull');
   add(s,0xf2ebd4,x,1.05,-4,3.2,.25,7);
   add(s,0xf2ebd4,x,1.65,-3,2.3,1,3);add(s,0x355969,x,1.8,-1.45,1.8,.45,.1);
   add(s,0x355969,x,1.24,-.9,2.2,.1,1.4);
   for(const sign of [-1,1]){
    add(s,0xf2ebd4,x+sign*1.65,1.35,-3,.12,.15,6);
    for(const z of [-5,-3,-1])add(s,0x355969,x+sign*1.18,1.75,z,.06,.27,.48);
    add(s,0xf2ebd4,x+sign*1.9,.85,-2,.3,.9,.3,'cylinder');
   }
   add(s,0xb66451,x,1.7,-1.35,.65,.65,.16,'ring');
   add(s,0xe7e0c6,x,5,-5,.12,8,.12,'cylinder');
   add(s,0xf7eacf,x+1.4,5.1,-5,2.8,5,2,'sail');
   add(s,0xe7e0c6,x+1.4,2.65,-5,2.9,.1,.1);
   add(s,side<0?0x477f9a:0xb66451,x-.8,4.3,-5.4,1.6,3.4,1.5,'jib');
  }
 }
 for(const {shape,color,items} of batches.values()) {
  const geometry=sceneryGeometry(shape);
  const material=new THREE.MeshStandardMaterial({color,roughness:.85,side:['sail','jib','gable','hull'].includes(shape)?THREE.DoubleSide:THREE.FrontSide});
  if(id==='city'&&(color===0xe5bd79||color===0x83c7c9)){material.emissive.setHex(color);material.emissiveIntensity=.45;}
  const mesh=new THREE.InstancedMesh(geometry,material,items.length);
  items.forEach((p,i)=>{pose.position.set(p.x,p.y,p.z);pose.rotation.set(0,p.angle,p.tilt);pose.scale.set(p.w,p.h,p.d);pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);});
  mesh.userData.owned=true;mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
 }
}
