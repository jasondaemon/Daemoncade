import * as THREE from '../../vendor/three/three.module.min.js';

// Silhouette/detail variants bake into the existing instanced color batches.
export function detailedPrimitive(r,type){
 const match=/^building:quarter(\d)$/.exec(type);
 if(match)return cityBuilding(r,Number(match[1]));
 const variant=/^(.+)@(\d)$/.exec(type);if(!variant)return null;
 const base=variant[1],n=Number(variant[2]),root=r.primitive(base),box=(...args)=>r.box(root,...args);
 const sphere=(radius,color,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(radius,1),r.mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m;};
 if(base==='cabin'){
  box(5.6,.16,1.4,0xa98d65,0,.22,2.55);
  for(const x of[-2.4,2.4]){box(.16,2.8,.16,0x604c3c,x,.2,3.15);box(.14,.8,1.2,0x866b49,x,.4,2.55);}
  for(let i=0;i<6;i++)box(5.04,.045,4.02,0x8a6a49,0,.45+i*.38);
  box(.6,1.3,.65,0x9b927d,n===1?-1.6:1.6,3.2,-.6);
  if(n===2){box(2.1,1.2,1.5,0xceb180,0,2.7,.7);box(2.4,.16,1.8,0x405c55,0,3.9,.7);}
 }else if(base==='rv'){
  for(const x of[-.7,.7])box(.07,.15,2,0x647d7d,x,2.78,-.2);
  box(1.65,.08,.55,0xe9d5b1,0,2.92,n?-.7:.5);
  if(n){box(.08,1.6,.85,0xd5ccad,1.12,.9,0);for(let i=0;i<4;i++)box(.08,.06,.65,0x526b70,1.18,1+i*.24,0);}
 }else if(base==='picnic'){
  box(.5,.03,.35,0xd6d5b5,-.45,.98,0);box(.22,.25,.22,n?0xe1ae69:0x698d87,.4,.98,.1);
 }else if(base==='coral'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3,y=.55+(i%3)*.28;const m=new THREE.Mesh(n===1?new THREE.CylinderGeometry(.3,.22,.16,12):new THREE.SphereGeometry(.23,10,6),r.mat(n===2?0xc3a4df:0xebb971));m.position.set(Math.cos(a)*.6,y,Math.sin(a)*.6);if(n===1)m.scale.set(1.5,1,.9);root.add(m);}
 }else if(base==='reef'){
  for(let i=0;i<7;i++){const a=i*2.4;sphere(.25, n?0xc6a28e:0x91ab78,Math.cos(a)*1.8,.45+(i%3)*.22,Math.sin(a)*.8,1,.65,1);}
 }else if(base==='amphora'){
  for(const y of[.2,.46]){const band=new THREE.Mesh(new THREE.TorusGeometry(.27,.018,4,16),r.mat(n?0x6a8b83:0xe1c5a1));band.rotation.x=Math.PI/2;band.position.y=y;root.add(band);}
 }else if(base==='spore'){
  for(let i=0;i<5;i++){const a=i*2.399;sphere(.11,n===2?0x8cddd2:0xf2d3aa,Math.cos(a)*.43,1.32+Math.sin(a)*.07,Math.sin(a)*.43,1,.5,1);}
  if(n===1)for(const x of[-.4,.4])sphere(.22,0xaa87b8,x,.45,.2,1,.55,1);
  if(n===2){const stalk=new THREE.Mesh(new THREE.CylinderGeometry(.025,.05,.5,6),r.mat(0xa5cdbd));stalk.position.set(.3,1.65,0);root.add(stalk);sphere(.1,0xf7d49a,.3,1.95,0);}
 }else if(base==='crystal'||base==='monolith'){
  for(let i=0;i<4;i++){const a=i*Math.PI/2;box(.06,.4+i*.15,.07,0xd9ecb6,Math.cos(a)*.6,.25,Math.sin(a)*.6);}
  if(n){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.32),r.mat(0xbca1db));m.position.set(.35,base==='monolith'?3:1.3,.25);root.add(m);}
 }else if(base==='debris'){
  if(n===1){root.scale.set(1.4,.7,.8);sphere(.3,0xb3a28e,.3,.4,0);}
  if(n===2){root.scale.set(.75,1.25,1);box(.45,.08,.65,0x647e9e,0,.5,0);}
 }else if(['satellite','probe','shuttle'].includes(base)){
  const y=base==='probe'?1.1:.8;
  for(const x of[-.35,.35]){box(.07,.06,.6,0x91b6c3,x,y,-.35);sphere(.055,0xf3c978,x,y+.04,-.1);}
  if(n){box(.6,.22,.7,0x8ea7c1,0,y,-.65);for(let i=0;i<5;i++)box(.3,.03,.035,0x435c7a,0,y+.23,-.9+i*.1);}
 }
 return root;
}
function cityBuilding(r,n){
 const root=new THREE.Group();root.userData.authored=true;
 const walls=[0xdbc6a1,0xb66f59,0x8ba9a8,0xd5d5c2,0xbdac88,0xa28c9b],wall=walls[n%6],trim=0xf3e3bf,dark=0x354954,glass=0x638f9d;
 const floors=[3,2,4,2,1,3][n],height=floors*2.4+.35,w=5.8,d=5.2,box=(...a)=>r.box(root,...a);
 box(w,height,d,wall);box(w+.35,.22,d+.35,dark,0,height);box(w+.12,.18,d+.12,trim,0,.3);
 // Four authored facades, real recessed window surrounds and cornice bands.
 for(let floor=0;floor<floors;floor++){
  const y=.85+floor*2.4;
  box(w+.14,.12,d+.14,trim,0,y+1.65);
  for(const side of[-1,1])for(const x of[-1.85,0,1.85]){
   box(1.25,1.45,.13,dark,x,y,side*(d/2+.025));box(1.02,1.2,.15,glass,x,y+.1,side*(d/2+.1));
   box(1.4,.12,.3,trim,x,y-.1,side*(d/2+.14));box(.055,1.2,.18,trim,x,y+.1,side*(d/2+.18));
   if(n===0||n===5){box(1.5,.1,.55,dark,x,y-.18,side*(d/2+.3));for(const dx of[-.65,0,.65])box(.045,.5,.04,dark,x+dx,y-.12,side*(d/2+.53));box(1.5,.05,.05,dark,x,y+.38,side*(d/2+.53));}
  }
  for(const side of[-1,1])for(const z of[-1.55,1.55]){box(.12,1.4,1.1,dark,side*(w/2+.02),y,z);box(.15,1.18,.88,glass,side*(w/2+.1),y+.1,z);}
 }
 box(1.1,2,.2,dark,0,.05,d/2+.2);box(1.8,.15,1.1,trim,0,2.2,d/2+.48);
 // Roof plant, parapets, skylights, vents and service access, not blank slabs.
 for(const side of[-1,1]){box(w+.3,.42,.14,wall,0,height+.2,side*(d/2+.1));box(.14,.42,d,wall,side*(w/2+.1),height+.2,0);}
 box(1.45,.65,1.2,0x7f9190,-1.3,height+.22,-.9);for(let i=0;i<5;i++)box(.04,.025,1,0x354954,-1.8+i*.24,height+.89,-.9);
 box(1.25,.25,1.4,glass,1.2,height+.2,.6);box(.28,.65,.28,trim,1.8,height+.2,-1.6);
 if(n===1||n===4){for(let i=0;i<10;i++)box(.56,.12,1.15,i%2?0xf0d8ab:0x699c8c,(i-4.5)*.58,2.45,d/2+.55);box(3.8,.55,.16,dark,0,2.8,d/2+.16);for(let i=0;i<6;i++)box(.28,.1,.06,trim,(i-2.5)*.5,3.02,d/2+.26);}
 if(n===2){box(1.3,1,1.4,wall,0,height+.2,-.4);box(1.6,.18,1.7,dark,0,height+1.2,-.4);}
 if(n===0||n===5){
  // Residential stoops, door panels and paired entry lights distinguish homes.
  for(let i=0;i<3;i++)box(1.4+i*.22,.12,.25,0xb0aaa0,0,.06+i*.11,d/2+.28+(2-i)*.24);
  for(const x of[-.68,.68]){box(.045,.65,.045,dark,x,.22,d/2+.65);box(.065,.06,.6,dark,x,.85,d/2+.45);}
  box(.76,1.55,.035,0x9c7051,0,.28,d/2+.32);box(.08,.07,.03,trim,.24,1.1,d/2+.35);
  for(const x of[-.88,.88])box(.14,.22,.14,0xe9d5a0,x,1.85,d/2+.22);
 }
 if(n===1){
  // Cafe frontage: round pavement tables and stools, not a generic shop strip.
  for(const x of[-1.8,1.8]){
   const top=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.07,12),r.mat(0xc7a279));top.position.set(x,.75,3.18);root.add(top);
   box(.08,.7,.08,dark,x,.03,3.18);for(const dx of[-.45,.45]){box(.28,.09,.28,trim,x+dx,.4,3.18);box(.06,.4,.06,dark,x+dx,0,3.18);}
  }
 }
 if(n===4){
  // Produce displays remain attached to the shop as one collectible structure.
  for(const x of[-1.8,1.8]){box(1.15,.55,.55,0x93714e,x,0,3.05);box(1.25,.08,.65,trim,x,.55,3.05);
   for(let i=0;i<4;i++){const fruit=new THREE.Mesh(new THREE.IcosahedronGeometry(.11,1),r.mat(i%2?0xdca562:0x8fa95e));fruit.position.set(x+(i-1.5)*.24,.73,3.05);root.add(fruit);}
  }
 }
 if(n===3){
  // Civic/office entrance and roof solar array give another readable silhouette.
  for(const x of[-.9,.9])box(.08,1.6,.1,trim,x,.15,d/2+.26);
  for(const x of[-1.8,1.6]){const panel=new THREE.Group();panel.position.set(x,height+.7,.65);panel.rotation.x=-.18;root.add(panel);r.box(panel,1.3,.08,1,0x406b83);for(let i=0;i<4;i++)r.box(panel,.025,.012,.9,0x94b4bf,-.45+i*.3,.084,0);}
 }
 return root;
}
