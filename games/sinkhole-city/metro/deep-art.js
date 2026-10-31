import * as THREE from '../../vendor/three/three.module.min.js';
import {seabedColor,seabedHeight} from './seabed.js?v=reef24';

function sphere(parent,color,x,y,z,sx=1,sy=1,sz=1){const large=Math.max(sx,sy,sz)>.6;const m=new THREE.Mesh(new THREE.SphereGeometry(1,large?12:8,large?8:6),this.mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
export function kelpLeaf(){
 const outline=[[-.25,0,0],[-.16,0,-.065],[0,0,-.09],[.18,0,-.05],[.25,0,0],[.13,0,.075],[-.1,0,.075]],positions=[],colors=[];
 for(let i=0;i<outline.length;i++)for(const reverse of[false,true]){
  const a=outline[i],b=outline[(i+1)%outline.length];positions.push(0,.04,0,...(reverse?b:a),...(reverse?a:b));colors.push(1,1,.9,.8,.92,.8,.8,.92,.8);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));g.computeVertexNormals();return g;
}
function branch(r,parent,a,b,width,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),m=new THREE.Mesh(new THREE.CylinderGeometry(width*.65,width,delta.length(),7),r.mat(color));m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());parent.add(m);}
export function deepGround(r,g){
 r.box(g,360,.2,360,0x9bbaad,0,-.22,0,true);
 // One continuous colored surface: soft reef transitions and a meandering sand
 // channel replace eight obvious discs. Raised shelves stay outside play bounds.
 const terrain=new THREE.PlaneGeometry(144,144,96,96);terrain.rotateX(-Math.PI/2);
 const p=terrain.attributes.position,colors=new Float32Array(p.count*3),c=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,seabedHeight(x,z));c.setRGB(...seabedColor(x,z),THREE.SRGBColorSpace);colors.set([c.r,c.g,c.b],i*3);}
 terrain.setAttribute('color',new THREE.BufferAttribute(colors,3));terrain.computeVertexNormals();const material=r.mat(0xffffff,true);material.vertexColors=true;g.add(new THREE.Mesh(terrain,material));
 for(let i=0;i<28;i++){
  const a=i*Math.PI*2/28,d=61+(i%3)*3,m=new THREE.Mesh(new THREE.IcosahedronGeometry(5+i%4,1),r.mat(i%2?0x4c8b83:0x598e80,true));m.position.set(Math.cos(a)*d,-1.5,Math.sin(a)*d);m.scale.y=.5+i%3*.15;g.add(m);
 }
}
export function deepPrimitive(r,type){
 const root=new THREE.Group();root.userData.authored=true;
 const orb=(...args)=>sphere.call(r,root,...args);
 if(type==='shell'){
  orb(0xffd4b5,0,.17,0,.9,.45,1);
  for(let i=-3;i<=3;i++){const rib=r.box(root,.035,.05,.5,0xe5ad8b,i*.065,.18,-.01);rib.rotation.y=-i*.14;}
  r.box(root,.14,.1,.18,0xe5ad8b,0,.04,-.24);
 }else if(type==='amphora'){
  const body=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(.12,0),new THREE.Vector2(.25,.12),new THREE.Vector2(.31,.4),new THREE.Vector2(.21,.65),new THREE.Vector2(.1,.72),new THREE.Vector2(.12,.85)],12),r.mat(0xcf9273));root.add(body);
  for(const side of[-1,1]){const handle=new THREE.Mesh(new THREE.TorusGeometry(.14,.035,6,10),r.mat(0xe3b18b));handle.position.set(side*.21,.6,0);root.add(handle);}
  const mouth=new THREE.Mesh(new THREE.CylinderGeometry(.086,.086,.02,12),r.mat(0x4e665e));mouth.position.y=.843;root.add(mouth);
 }else if(type==='coral'){
  orb(0x697f78,0,.15,0,1.2,.35,1);
  for(let i=0;i<5;i++){
   const a=i*2.4,x=Math.cos(a)*.48,z=Math.sin(a)*.48,h=.8+(i%3)*.35,color=i%2?0xdf8b87:0xedb29a;
   branch(r,root,[x*.4,.1,z*.4],[x,h,z],.12,color);
   for(const side of[-1,1]){branch(r,root,[x,h*.55,z],[x+side*.3,h*.82+.22,z+.14],.07,color);orb(0xf2bca6,x+side*.3,h*.82+.22,z+.14,.1,.1,.1);}
  }
 }else if(type==='seafan'){
  branch(r,root,[0,0,0],[0,1.3,0],.055,0x8b6b99);
  for(let i=1;i<=4;i++)for(const side of[-1,1]){
   const x=side*(.7-i*.11),y=i*.22;
   branch(r,root,[0,y,0],[x,y+.4,0],.025,0xb58bb6);
   for(let j=1;j<=3;j++)branch(r,root,[x*j/3,y+.4*j/3,0],[x*j/3+side*.1,y+.4*j/3+.2,.015],.014,0xd2a3bc);
  }
  orb(0x6a8b76,0,.08,0,.3,.12,.3);
 }else if(type==='kelp'){
  for(let strand=0;strand<3;strand++){
   const x=(strand-1)*.2,height=1.9+strand*.35;
   for(let i=0;i<6;i++){
    const y=i*height/6,sway=Math.sin(i*.7+strand)*.18;
    branch(r,root,[x+sway,y,0],[x+Math.sin((i+1)*.7+strand)*.18,y+height/6,0],.027,0x397d69);
    const leaf=new THREE.Mesh(kelpLeaf(),r.mat(i%2?0x6aab7d:0x4b9474));leaf.position.set(x+sway+(i%2?.18:-.18),y+.15,0);leaf.rotation.z=i%2?.4:-.4;root.add(leaf);
   }
  }
  orb(0x66897c,0,.1,0,.35,.15,.3);
 }else if(type==='reef'){
  // A genuinely open rock arch with coral crowns, rather than another solid boulder.
  for(const side of[-1,1]){orb(0x6c9992,side*1.15,.7,0,.65,.95,.7);orb(0x7ca69a,side*1.28,.25,.3,.85,.35,.9);}
  for(let i=0;i<9;i++){
   const a=i*Math.PI/8,x=Math.cos(a)*1.18,y=.9+Math.sin(a)*1.05;
   const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),r.mat(i%2?0x82aa9e:0x6c9992));rock.position.set(x,y,0);rock.scale.z=1.4;root.add(rock);
   if(i%2===0){branch(r,root,[x,y+.2,0],[x+.15,y+.8,.1],.06,0xd89c9f);branch(r,root,[x+.08,y+.5,.05],[x-.2,y+.72,.08],.04,0xe9b3a9);}
  }
 }else if(type==='salvage'){
  r.box(root,1.5,.85,1.1,0x3e8189);r.box(root,1.58,.12,1.18,0x89b9ae,0,.85);
  for(const x of[-.55,.55])r.box(root,.12,.87,1.13,0xb4bda1,x);
  for(const z of[-.57,.57])r.box(root,.45,.22,.03,0xd6c5a0,0,.35,z);
  orb(0x75956d,.6,.92,-.35,.22,.12,.25);
 }else if(type==='treasure'){
  r.box(root,.85,.45,.6,0x765b49);r.box(root,.92,.12,.68,0xe1b65d,0,.45);
  for(const x of[-.3,.3])r.box(root,.09,.46,.62,0xe3c16e,x);
  for(let i=0;i<8;i++){const coin=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.045,10),r.mat(0xffdc70));coin.position.set((i%4-1.5)*.17,.6+Math.floor(i/4)*.04,(i%2-.5)*.2);root.add(coin);}
 }else if(type==='wreck'){
  const outline=new THREE.Shape();outline.moveTo(-1.4,-3.5);outline.lineTo(1.4,-3.5);outline.lineTo(1.65,1.8);outline.quadraticCurveTo(1.35,3.5,0,4);outline.quadraticCurveTo(-1.35,3.5,-1.65,1.8);outline.closePath();
  const hull=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.65,bevelEnabled:true,bevelSize:.2,bevelThickness:.2,bevelSegments:1,steps:1,curveSegments:6}),r.mat(0x705749));hull.rotation.x=-Math.PI/2;hull.position.y=.2;root.add(hull);
  for(let i=-3;i<=3;i++){
   for(const side of[-1,1]){const rib=r.box(root,.18,.7, .22,0xb28c65,side*(i>1?1.1:1.45),.65,i);rib.rotation.z=-side*.25;}
   if(i!==0){const plank=r.box(root,i===1?1.3:2.5,.1,.46,0x9c7857,i===1?.5:0,.9,i);plank.rotation.y=i===1?.14:0;}
  }
  r.box(root,1.8,.8,1.2,0x8a725a,0,.95,-2.2);r.box(root,2,.1,1.4,0xbd9d78,0,1.75,-2.2);
  branch(r,root,[0,.8,.8],[.6,3.4,.7],.11,0xb0986c);branch(r,root,[-1.1,2.2,.75],[1.5,2.6,.75],.065,0xb0986c);
  for(const x of[-1,1])orb(0x789873,x,1,-1,.35,.2,.25);
 }else if(type==='landmark:station'){
  r.box(root,6,.5,5,0x496f78);r.box(root,4.8,2.4,3.7,0xc2cfb8,0,.5);
  orb(0x67bbc6,0,2.8,0,2.1,1.1,1.6);
  for(const x of[-2.45,2.45])for(const z of[-1.1,0,1.1])r.box(root,.08,.7,.65,0x467b8c,x,1.3,z);
  for(const x of[-3,3]){const tank=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,2.8,12),r.mat(0xd9ca99));tank.position.set(x,1.6,0);root.add(tank);for(const y of[.5,2.3])r.box(root,1.15,.12,1.2,0x63868b,x,y);}
  branch(r,root,[1.5,2.9,-1],[1.5,5,-1],.07,0xdac79e);
  const dish=new THREE.Mesh(new THREE.ConeGeometry(.7,.25,12,1,true),r.mat(0xd6d7b7));dish.rotation.z=.5;dish.position.set(1.5,4.9,-1);root.add(dish);
  r.box(root,1.4,.3,1.5,0x699493,0,.5,2.4);r.box(root,1,1.65,.1,0x397d8b,0,.6,1.9);
 }else return null;
 return root;
}
