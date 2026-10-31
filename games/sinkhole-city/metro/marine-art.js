import * as THREE from '../../vendor/three/three.module.min.js';
import {MARINE_TYPES} from './marine.js?v=ocean10';
import {oceanHero} from './ocean-heroes.js?v=marine25';
export function marinePrimitive(r,type){
 if(!MARINE_TYPES.includes(type))return null;
 const hero=oceanHero(r,type);if(hero)return hero;
 const root=new THREE.Group();root.userData.authored=true;
 const ellipsoid=(color,x,y,z,sx,sy,sz)=>{const detail=Math.max(sx,sy,sz)>.6,hero=detail&&['whale','dolphin','shark'].includes(type),g=new THREE.SphereGeometry(1,hero?18:detail?12:8,hero?12:detail?8:6),m=new THREE.Mesh(g,r.mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m;};
 const fin=(color,points)=>{const g=new THREE.BufferGeometry(),[a,b,c]=points;g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...c,...b,...a],3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(12),2));g.computeVertexNormals();const m=new THREE.Mesh(g,r.mat(color));root.add(m);return m;};
 const eyes=(x,y,z,size)=>{for(const side of[-1,1]){ellipsoid(0xf7efd4,side*x,y,z,size,size,size*.7);ellipsoid(0x173746,side*(x+size*.4),y,z+size*.3,size*.5,size*.6,size*.55);}};
 if(type==='jellyfish'){
  const bell=new THREE.Mesh(new THREE.SphereGeometry(.72,20,12,0,Math.PI*2,0,Math.PI/2),r.mat(0xd1a5d3));bell.position.y=1.3;root.add(bell);
  ellipsoid(0xe9c2db,0,1.3,0,.73,.12,.73);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,points=[];for(let j=0;j<7;j++)points.push(new THREE.Vector3(Math.cos(a)*(.4+Math.sin(j*.9)*.1),1.27-j*.18,Math.sin(a)*(.4+Math.sin(j*.9)*.1)));
   root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.025,5,false),r.mat(i%2?0xbb80c2:0xedd2e0)));
  }
 }else if(type==='ray'){
  ellipsoid(0x567b9c,0,.28,0,.55,.22,.9);ellipsoid(0xbed3ce,0,.17,.05,.45,.12,.7);
  for(const side of[-1,1]){fin(0x6797ad,[[0,.25,.8],[side*1.65,.12,-.25],[0,.25,-.75]]);fin(0x7aabba,[[0,.26,.7],[side*.8,.32,.12],[side*1.6,.14,-.25]]);}
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.018,.06,1.5,6),r.mat(0x4c758f));tail.rotation.x=Math.PI/2;tail.position.set(0,.25,-1.3);root.add(tail);eyes(.22,.47,.48,.065);
 }else if(type==='turtle'){
  ellipsoid(0x698f64,0,.34,0,.65,.34,.8);ellipsoid(0xb4ba79,0,.15,.05,.6,.14,.7);ellipsoid(0x8dbb8a,0,.27,.94,.22,.18,.32);
  for(const side of[-1,1])for(const z of[-.43,.46]){const flipper=ellipsoid(0x78a97c,side*.66,.19,z,.46,.055,.2);flipper.rotation.y=side*(z>0?-.4:.35);}
  for(const x of[-.27,0,.27])for(const z of[-.3,.15,.5])ellipsoid(0x527950,x,.61-Math.abs(x)*.2,z,.14,.025,.18);
  eyes(.14,.35,1.05,.045);
 }else{
  const whale=type==='whale',shark=type==='shark',dolphin=type==='dolphin',fish=type==='fish';
  const color=whale?0x467c98:shark?0x78959f:dolphin?0x709fae:0xf4eee1,belly=whale?0xc2d9d0:0xf1e7c6;
  const width=whale?.82:fish?.38:.48,height=whale?.65:fish?.55:.4,length=whale?1.65:fish?.8:1.25;
  const body=ellipsoid(color,0,height,0,width,height,length);ellipsoid(belly,0,height*.62,.12,width*.85,height*.4,length*.88);
  if(dolphin)ellipsoid(0x97bdc2,0,height*.85,1.25,.19,.13,.48);
  if(shark)ellipsoid(0x94afb2,0,height,1.03,.4,.25,.52);
  const tailZ=-length-.48;
  ellipsoid(color,0,height,-length,.18,.2,.55);
  if(whale||dolphin){for(const side of[-1,1])fin(color,[[0,height,tailZ+.25],[side*.85,height+.03,tailZ-.25],[side*.2,height,tailZ+.45]]);}
  else{fin(color,[[0,height,-length+.1],[0,height+.65,tailZ-.3],[0,height-.65,tailZ-.3]]);}
  for(const side of[-1,1])fin(color,[[side*width*.65,height*.8,.35],[side*(whale?1.25:.9),.12,-.25],[side*width*.55,height*.8,-.35]]);
  if(!fish||shark)fin(color,[[0,height*1.7,.3],[0,height+(shark?.95:.7),-.1],[0,height*1.6,-.55]]);
  if(fish){const p=body.geometry.attributes.position,paint=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const z=p.getZ(i)*length,d=Math.min(...[-.25,.05,.35].map(b=>Math.abs(z-b))),shade=d<.075?.62:1;paint.set([shade,shade,shade],i*3);}body.geometry.setAttribute('color',new THREE.BufferAttribute(paint,3));}
  if(shark)for(const side of[-1,1])for(let i=0;i<3;i++)r.box(root,.015,.18,.025,0x42626f,side*.44,height,.55-i*.13);
  if(whale)for(let i=-2;i<=2;i++)r.box(root,.025,.02,1.1,0x8eb5b8,i*.12,.18,.55);
  if(whale){ellipsoid(0x294e68,0,height*1.98,.4,.09,.018,.13);ellipsoid(0x73a4b6,0,height*1.99,-.2,.12,.018,.2);}
  eyes(width*.65,height*1.4,length*.68,whale?.075:.065);
 }
 return root;
}

// Deform bodies/tails and fins in the vertex shader, with the exact same motion in shadows.
// One instanced draw per species; no per-animal skeleton allocation or animation mixer.
export function animateMarine(mesh,objects,type,shape,clock){
 const phase=new Float32Array(objects.map(o=>o.swim.phase));mesh.geometry.setAttribute('swimPhase',new THREE.InstancedBufferAttribute(phase,1));
 const mode=type==='jellyfish'?2:['ray','turtle'].includes(type)?1:['whale','dolphin'].includes(type)?3:0,frequency=type==='fish'?7:type==='whale'?1.6:type==='jellyfish'?2.7:3.8;
 const declarations=`uniform float marineTime;attribute float swimPhase;\n`;
 const motion=`float stroke=marineTime*${frequency.toFixed(1)}+swimPhase;
 float rear=clamp(-position.z/${Math.max(.01,shape.depth*.5).toFixed(5)},0.0,1.0);
 `+(mode===0?`float bend=sin(stroke+rear*1.8)*rear*rear*${(shape.width*.28).toFixed(5)};transformed.x+=bend;`
 :mode===3?`transformed.y+=sin(stroke+rear*1.8)*rear*rear*${(shape.height*.4).toFixed(5)};`
 :mode===1?`transformed.y+=sin(stroke)*pow(abs(position.x)/${Math.max(.01,shape.width*.5).toFixed(5)},1.5)*${(shape.width*.13).toFixed(5)};`
 :`float pulse=sin(stroke);transformed.xz*=1.0+pulse*.09;transformed.y+=sin(stroke+position.y*2.0)*.06;`);
 for(const material of[mesh.material,mesh.customDepthMaterial]){
  material.onBeforeCompile=shader=>{shader.uniforms.marineTime=clock;shader.vertexShader=declarations+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+motion);};
  material.customProgramCacheKey=()=>`marine-v1-${type}`;
 }
}
