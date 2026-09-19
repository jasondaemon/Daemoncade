import * as THREE from '../vendor/three/three.module.min.js';
export function buildHover(v,type,paint) {
 const pink=new THREE.MeshPhysicalMaterial({color:paint||(type==='ufo'?0xa9cbd1:0xef279f),metalness:.55,roughness:.28,clearcoat:1});
 const dark=new THREE.MeshStandardMaterial({color:0x192136,metalness:.5,roughness:.35});
 const gold=new THREE.MeshStandardMaterial({color:0xf5c851,metalness:.6,roughness:.3});
 const glass=new THREE.MeshPhysicalMaterial({color:0x25677e,metalness:.55,roughness:.12,clearcoat:1});
 const glow=new THREE.MeshStandardMaterial({color:0x65f5ee,emissive:0x35dcd8,emissiveIntensity:2});
 v.hoverMaterials=[pink,dark,gold,glass,glow];v.hoverGlow=glow;v.hover=true;
 function mesh(g,m,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.userData.ownedGeometry=true;v.body.add(o);return o;}
 const box=(m,x,y,z,w,h,d)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 if(type==='ufo') {
  mesh(new THREE.SphereGeometry(1,32,12),pink,0,.35,0,1.85,.38,1.85);
  mesh(new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2),glass,0,.52,0,.85,.7,.85);
  const ring=mesh(new THREE.TorusGeometry(1.65,.07,6,40),glow,0,.24,0);ring.rotation.x=Math.PI/2;
  mesh(new THREE.CylinderGeometry(.55,.8,.16,24),dark,0,-.02,0);
  mesh(new THREE.CylinderGeometry(.46,.65,.06,24),glow,0,-.12,0);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;mesh(new THREE.SphereGeometry(.08,6,4),i%3?glow:gold,Math.cos(a)*1.7,.39,Math.sin(a)*1.7);}
 } else {
  const shape=new THREE.Shape();shape.moveTo(-.5,-2);shape.lineTo(.5,-2);shape.lineTo(1.5,-.9);shape.lineTo(1.4,1.2);shape.lineTo(.65,1.7);shape.lineTo(-.65,1.7);shape.lineTo(-1.4,1.2);shape.lineTo(-1.5,-.9);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.38,bevelEnabled:true,bevelSize:.15,bevelThickness:.12,bevelSegments:1,steps:1});g.rotateX(-Math.PI/2);mesh(g,pink,0,.1,0);
  mesh(new THREE.SphereGeometry(1,16,8),dark,0,.04,0,1.3,.23,1.75);
  mesh(new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),glass,0,.55,-.1,.53,.43,.85);
  box(pink,0,.52,1.1,.65,.45,.8);
  for(const side of [-1,1]) {
   mesh(new THREE.SphereGeometry(1,12,6),pink,side*.94,.46,.05,.5,.25,1.25);
   box(dark,side*.94,.68,.6,.55,.08,.8);
   for(let i=0;i<5;i++)box(gold,side*.94,.74,.3+i*.15,.48,.07,.06);
   const nozzle=mesh(new THREE.CylinderGeometry(.28,.32,.65,12),dark,side*.64,.24,2.12);nozzle.rotation.x=Math.PI/2;
   mesh(new THREE.TorusGeometry(.27,.065,6,16),gold,side*.64,.24,2.46);
   mesh(new THREE.CircleGeometry(.23,16),glow,side*.64,.24,2.475);
   box(glow,side*1.1,.38,-1.35,.4,.08,.1);
   box(gold,side*.28,.62,-1.1,.07,.04,.9);
  }
  box(pink,0,.9,1.15,.12,.7,.8);box(gold,0,1.26,1.15,.15,.05,.75);
 }
 v.body.position.y=.85;
}
