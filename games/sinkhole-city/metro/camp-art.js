import * as THREE from '../../vendor/three/three.module.min.js';
import {CAMP_POND} from './habitats.js?v=camp-life32';

export function campPond(r,g){
 const p=CAMP_POND,m=new THREE.Mesh(new THREE.CircleGeometry(1,64),r.mat(0x528e99,true));m.rotation.x=-Math.PI/2;m.scale.set(p.rx,p.rz,1);m.position.set(p.x,.019,p.z);g.add(m);
}

export function campPrimitive(r,type){
 if(!type.startsWith('rv:')&&!['deer','fox'].includes(type))return null;
 const root=new THREE.Group();root.userData.authored=true;
 const add=(geo,color,x,y,z)=>{const m=new THREE.Mesh(geo,r.mat(color));m.position.set(x,y,z);root.add(m);return m;};
 const box=(w,h,d,color,x=0,y=0,z=0)=>r.box(root,w,h,d,color,x,y,z);
 const rounded=(w,h,d,color,x=0,y=0,z=0,b=.045)=>{
  const height=h;w-=b*.9;h-=b*.9;
  const q=Math.min(b,w/2,h/2)*.9,s=new THREE.Shape();s.moveTo(-w/2+q,-h/2);s.lineTo(w/2-q,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+q);s.lineTo(w/2,h/2-q);s.quadraticCurveTo(w/2,h/2,w/2-q,h/2);s.lineTo(-w/2+q,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-q);s.lineTo(-w/2,-h/2+q);s.quadraticCurveTo(-w/2,-h/2,-w/2+q,-h/2);
  const geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-b*2),bevelEnabled:true,bevelSize:b*.45,bevelThickness:b,bevelSegments:2,curveSegments:3});geo.center();return add(geo,color,x,y+height/2,z);
 };
 const rod=(a,b,width,color)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),m=add(new THREE.CylinderGeometry(width,width,delta.length(),8),color,...av.add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;};
 const oval=(rad,color,x,y,z,sx=1,sy=1,sz=1)=>{const m=add(new THREE.SphereGeometry(rad,12,8),color,x,y,z);m.scale.set(sx,sy,sz);return m;};
 if(type==='deer'||type==='fox'){
  const fox=type==='fox',fur=fox?0xbd7444:0xa18a68,hip=fox?.4:.71;
  oval(.5,fur,0,fox?.52:.95,0,fox?.75:.85,fox?.65:.8,fox?1.8:1.7);
  oval(.3,fur,0,fox?.72:1.35,.65,.8,1,1.3);oval(.2,fox?0xf0d7ad:0xc9b28d,0,fox?.65:1.25,.92,.65,.65,1.3);
  for(const side of[-1,1]){
   const ear=add(new THREE.ConeGeometry(fox?.12:.11,fox?.3:.33,6),fur,side*.18,fox?.98:1.67,.65);ear.rotation.z=-side*.3;
   oval(.035,0x253a37,side*.19,fox?.77:1.4,.84);
   for(const front of[-1,1]){
    const pivot=[side*.25,hip,front*.5],limb=side*front;
    const leg=add(new THREE.CylinderGeometry(.055,.045,hip-.1,8),fur,side*.25,hip/2,front*.5);leg.userData.walkLimb=limb;leg.userData.walkPivot=pivot;
    const paw=box(.12,.1,.21,0x493e34,side*.25,0,front*.5+.02);paw.userData.walkLimb=limb;paw.userData.walkPivot=pivot;
   }
  }
  const tail=oval(fox?.24:.14,fox?0xc88448:0xdacdb6,0,fox?.5:1,-.95,1,fox?1:1.2,fox?2.3:1.2);tail.rotation.x=.3;
  if(fox)oval(.17,0xf0d7ad,0,.4,-1.35,1,1,1.4);
  else for(const side of[-1,1]){rod([side*.14,1.56,.55],[side*.3,1.98,.4],.035,0xc3af8b);rod([side*.24,1.8,.46],[side*.48,1.9,.55],.025,0xc3af8b);}
  return root;
 }
 const rig=type.slice(3),trailer=rig==='explore-trailer',truck=rig==='popup-pickup',fj=rig==='fj-suv';
 const tire=(x,z)=>{const side=Math.sign(x),m=add(new THREE.TorusGeometry(.325,.105,8,20),0x303d3c,x,.43,z);m.rotation.y=Math.PI/2;const hub=add(new THREE.CylinderGeometry(.235,.235,.275,16),0x9daaa4,x,.43,z);hub.rotation.z=Math.PI/2;
  const sidewall=add(new THREE.TorusGeometry(.28,.025,5,20),0x424c46,x+side*.11,.43,z);sidewall.rotation.y=Math.PI/2;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,bolt=add(new THREE.CylinderGeometry(.027,.027,.025,6),0xd7d9c7,x+side*.15,.43+Math.sin(a)*.12,z+Math.cos(a)*.12);bolt.rotation.z=Math.PI/2;}
  for(let i=0;i<16;i++){const a=i*Math.PI/8,tread=box(.17,.035,.085,0x3c4844,x+(i%2?.045:-.045),.43+Math.sin(a)*.41,z+Math.cos(a)*.41);tread.rotation.x=-a;}
 };
 if(!trailer){
  const paint=fj?0x8f9696:truck?0x647d8a:0x647c65;
  // Side-profile shell has real wheel-arch cutouts, not painted-on fenders.
  const shell=new THREE.Shape();shell.moveTo(-2.12,.5);shell.lineTo(-2.12,1.02);shell.lineTo(1.5,1.02);shell.lineTo(2.12,.9);shell.lineTo(2.12,.5);shell.lineTo(1.82,.5);shell.absarc(1.3,.5,.52,0,Math.PI,false);shell.lineTo(-.78,.5);shell.absarc(-1.3,.5,.52,0,Math.PI,false);shell.closePath();
  const body=add(new THREE.ExtrudeGeometry(shell,{depth:1.74,bevelEnabled:true,bevelSize:.035,bevelThickness:.055,bevelSegments:2,curveSegments:8}),paint,.87,0,0);body.rotation.y=-Math.PI/2;body.userData.wheelArches=true;
  box(1.4,.16,4.1,0x35433e,0,.42);
  // Casey's compact cabin/hood balance, adapted to this model's +Z front.
  const cabinZ=truck?.65:fj?-.48:-.1,cabinDepth=truck?1.55:fj?2.2:2.7,front=cabinZ+cabinDepth/2+.025;
  if(fj){
   const cabin=new THREE.Shape();cabin.moveTo(-1.58,1.02);cabin.lineTo(.72,1.02);cabin.lineTo(.72,1.22);cabin.lineTo(.53,1.88);cabin.lineTo(-1.58,1.88);cabin.closePath();
   const cab=add(new THREE.ExtrudeGeometry(cabin,{depth:1.9,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2}),paint,.95,0,0);cab.rotation.y=-Math.PI/2;
  }else rounded(1.72,.75,cabinDepth,paint,0,1.02,cabinZ,.085);
  rounded(fj?1.98:1.75,.12,cabinDepth+.15,fj?0xf0eee3:0x54645a,0,fj?1.88:1.77,cabinZ,.06);
  const windshield=box(fj?1.68:1.5,.54,.035,0x426a74,0,fj?1.25:1.15,front+(fj?.035:.06));windshield.rotation.x=fj?-.27:-.2;
  for(const x of fj?[-.52,0,.52]:[-.4,.4])rod([x,fj?1.25:1.16,front+.035],[x+.1,fj?1.39:1.3,front+.015],.015,0x2f433f);
  for(const x of[-.89,.89]){
   const side=fj?Math.sign(x)*.97:x;
   for(const z of truck?[.55]:fj?[-1.05,-.02]:[-.7,.65]){const glass=rounded(.035,.48,fj?.78:.95,0x3d6269,side,fj?1.29:1.18,z,.012);glass.rotation.z=Math.sign(x)*.12;}
   box(.12,.09,.2,0x34473e,x*1.13,1.2,1.1);box(.14,.08,2.9,0x394942,x*1.04,.46,-.1);
   for(const z of[-1.3,1.3])tire(x*1.12,z);
   box(.04,.05,.22,0xc5c8b7,side,1.01,fj?-.15:.1);
   for(const z of truck?[-.1]:[-1.2,.2])box(.025,.56,.018,0x52645b,x,1.02,z);
   for(const z of[-1.3,1.3]){const arch=add(new THREE.TorusGeometry(.52,.055,5,16,Math.PI),0x384941,x,.5,z);arch.rotation.set(0,Math.PI/2,0);}
  }
  rounded(1.88,.18,.25,0x384740,0,.52,2.16,.045);box(1.25,.34,.04,0x34433e,0,.8,2.16);
  if(fj){
   rounded(1.95,.4,.07,0xd9ded9,0,.75,2.17,.025);box(.96,.23,.04,0x293d3c,0,.85,2.22);
   for(const y of[.9,1])box(.9,.015,.025,0x8d9f9b,0,y,2.25);
   rounded(1.52,.08,1.18,paint,0,1.03,1.47,.04);
   for(const x of[-.98,.98]){rounded(.23,.12,.9,paint,x,.99,1.45,.04);box(.12,.08,.2,0xd9ded9,x,.69,2.2);}
  }else for(let i=-3;i<=3;i++)box(.065,.27,.06,0x9aab9c,i*.14,.83,2.19);
  for(const x of fj?[-.73,.73]:[-.65,.65]){const light=add(new THREE.CylinderGeometry(fj?.19:.17,fj?.19:.17,.05,12),0xf3e4b2,x,fj?.96:.88,fj?2.23:2.18);light.rotation.x=Math.PI/2;box(.2,.13,.05,0xb76b50,x,.65,-2.16);}
  if(fj){
   const spare=add(new THREE.CylinderGeometry(.4,.4,.25,16),0x35413e,0,1.1,-2.22);spare.rotation.x=Math.PI/2;
   box(1.55,.06,1.8,0x43534c,0,2.03,-.48);
   for(const x of[-.72,.72]){box(.055,.11,1.85,0x293f3b,x,2.05,-.48);box(.09,.65,.1,paint,Math.sign(x)*.96,1.19,-.52);}
   box(1.6,.48,.035,0x3d6269,0,1.32,-1.61);
  }
  else if(truck){
   rounded(1.9,.83,2.5,0xe5e6df,0,1,-.95,.05);
   box(1.84,.72,2.5,0xcbd0ca,0,1.83,-.95);
   const roof=rounded(2,.12,2.8,0xf4f3ea,0,2.55,-.85,.045);roof.userData.referencePart='project-m-flat-white-roof';
   for(const x of[-.95,.95]){
    for(const z of[-1.55,-.4])box(.025,.38,.74,0x425c5e,x,2,z);
    box(.03,.055,2.5,0x455650,x,1.78,-.95);
    for(const z of[-1.95,-1.65,-1.35])box(.025,.015,.18,0x9fa99d,x,1.2,z);
    rounded(.09,.45,.3,0xba714c,x*1.08,1.14,-.65,.025);
   }
   box(1.65,.05,.035,0x455650,0,1.82,-2.22);box(1.1,.38,.04,0x425c5e,0,1.25,-2.225);
   for(const x of[-.8,.8])rod([x,2.54,-2.21],[0,1.86,-2.23],.018,0x43544f);
   box(.9,.1,.6,0x43584b,0,.5,-2.25);
  }else{
   box(1.85,.12,2.6,0x3d5147,0,1.95,-.1);box(1.75,.8,2.5,0xc5a773,0,2.07,-.1);
   const roof=new THREE.Shape();roof.moveTo(-1,0);roof.lineTo(0,.55);roof.lineTo(1,0);roof.closePath();const m=add(new THREE.ExtrudeGeometry(roof,{depth:2.7,bevelEnabled:false}),0x586e64,0,2.85,-1.45);
   box(1.05,.5,.03,0x324c4b,0,2.25,1.17);for(const x of[-.89,.89])box(.03,.45,1,0x435c57,x,2.3,-.2);
   for(const x of[-.5,.5])rod([x,.05,2.8],[x,2.06,1.3],.035,0xb8bdae);
   for(let i=0;i<6;i++)rod([-.5,.2+i*.3,2.7-i*.22],[.5,.2+i*.3,2.7-i*.22],.025,0xcbd0bb);
  }
 }else{
  rounded(2.15,.22,3.8,0x303d3b,0,.43,0,.04);
  const profile=new THREE.Shape();profile.moveTo(-1.8,.65);profile.lineTo(1.8,.65);profile.lineTo(1.8,1.96);profile.quadraticCurveTo(1.8,2.65,.95,2.65);profile.lineTo(-1.8,2.65);profile.closePath();
  const shell=add(new THREE.ExtrudeGeometry(profile,{depth:2.05,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,curveSegments:12}),0x717977,1.025,0,0);shell.rotation.y=-Math.PI/2;shell.userData.referencePart='explore-rounded-nose';
  for(const x of[-1.05,1.05]){box(.035,.62,3.5,0x354340,x,.65,-.03);box(.04,.045,3.45,0xbd7752,x,1.28,-.03);}
  for(const x of[-1.17,1.17])tire(x,-.35);
  for(const side of[-1,1]){
   box(1.35,.1,2.55,0x56625b,side*1.7,1.05,-.2);
   const fabric=new THREE.Shape();fabric.moveTo(-1.48,1.14);fabric.lineTo(1.08,1.14);fabric.lineTo(1.08,1.85);fabric.quadraticCurveTo(1.08,2.3,.55,2.36);fabric.quadraticCurveTo(-.2,2.53,-.95,2.36);fabric.quadraticCurveTo(-1.48,2.3,-1.48,1.85);fabric.closePath();
   const wing=add(new THREE.ExtrudeGeometry(fabric,{depth:1.3,bevelEnabled:false,curveSegments:10}),0xb8bdb1,side>0?2.35:-1.05,0,0);wing.rotation.y=-Math.PI/2;wing.userData.referencePart='explore-arched-canvas';
   const window=new THREE.Shape();window.moveTo(-1.1,1.35);window.lineTo(.7,1.35);window.lineTo(.7,1.73);window.quadraticCurveTo(.7,2.17,-.2,2.2);window.quadraticCurveTo(-1.1,2.17,-1.1,1.73);window.closePath();
   const mesh=add(new THREE.ExtrudeGeometry(window,{depth:.015,bevelEnabled:false,curveSegments:10}),0x425f5a,side*2.365,0,0);mesh.rotation.y=-Math.PI/2;
   rod([side*2.38,1.36,-.2],[side*2.38,2.18,-.2],.018,0xcdd0bd);
   for(const z of[-1.35,.95])rod([side*1.05,2.5,z],[side*2.35,2.1,z],.022,0x52635c);
   for(const z of[-1.1,.7])rod([side*.85,.7,z],[side*2.3,1.05,z],.035,0x9da99a);
   box(.08,.6,.08,0x647268,side*.95,.02,1.5);
  }
  for(const x of[-.8,.8])rod([x,.5,1.85],[0,.5,3],.06,0x6d7972);
  box(.2,.14,.4,0xa5afa0,0,.42,2.95);box(.07,.4,.07,0x65776c,0,.02,2.6);
  rounded(.92,.55,.65,0x354340,0,.57,2.38,.065);
  const spare=add(new THREE.CylinderGeometry(.4,.4,.22,16),0x303d3c,0,1.57,1.99);spare.rotation.x=Math.PI/2;
  for(const z of[-1.1,.55])box(2.12,.08,.065,0x354340,0,2.72,z);
  rounded(.55,.13,.65,0xd2d8ca,0,2.68,-.25,.035);
  for(const x of[-.48,.48]){rounded(.86,1.75,.035,0x3d4c48,x,.75,-1.835,.025);box(.028,1.55,.025,0x8f9e96,x, .84,-1.87);}
  for(const x of[-.93,.93])for(const y of[1,2.2])box(.09,.1,.04,0xa3afa5,x,y,-1.88);
 }
 return root;
}
