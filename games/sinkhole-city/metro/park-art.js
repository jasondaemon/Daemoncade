import * as T from '../../vendor/three/three.module.min.js';

export const CITY_PARKS=[{x:-38,z:15,main:true},{x:-38,z:-11},{x:-13,z:41}];
export function populateParks(add){
 for(const p of CITY_PARKS){
  for(const side of[-1,1]){
   for(const z of p.main?[-4.4,4.4]:[-4.8,-1.6,1.6,4.8]){const o=add('fence',p.x+side*6.5,p.z+z,Math.PI/2);o.parkStyle=p.main?'long':'short';if(p.main)o.radius=2.35;}
   for(const x of[-4.4,4.4]){const o=add('fence',p.x+x,p.z+side*6.6);o.radius=2.35;o.parkStyle='long';}
   const gate=add('gate',p.x,p.z+side*6.6,side>0?0:Math.PI);gate.parkStyle='open';
   if(p.main){const gate=add('gate',p.x+side*6.5,p.z,side*Math.PI/2);gate.parkStyle='open';}
  }
  if(p.main){
   add('fountain',p.x,p.z);
   for(const [i,[dx,dz]]of[[-4.5,-4.3],[-4.5,0],[-4.5,4.3],[4.5,-4.3],[4.5,0],[4.5,4.3]].entries()){const o=add('tree',p.x+dx,p.z+dz);o.treeStyle=['linden','birch','cedar'][i%3];}
   for(const [dx,dz,yaw]of[[-2.4,-3,0],[2.4,-3,0],[-2.4,3,Math.PI],[2.4,3,Math.PI]])add('bench',p.x+dx,p.z+dz,yaw);
  }
 }
}
export function parkPrimitive(r,key){
 if(!/^(?:fence:|gate:|fountain$|tree:park-)/.test(key))return null;
 const root=new T.Group();root.userData.authored=true;
 const mesh=(g,c,x=0,y=0,z=0,water=false)=>{const m=new T.Mesh(g,r.mat(c));m.position.set(x,y,z);m.userData.parkWater=water?1:0;root.add(m);return m;};
 const box=(w,h,d,c,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),c,x,y+h/2,z);
 const cyl=(a,b,h,c,x=0,y=0,z=0,n=12)=>mesh(new T.CylinderGeometry(a,b,h,n),c,x,y+h/2,z);
 const rod=(a,b,w,c)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),m=mesh(new T.CylinderGeometry(w,w,start.distanceTo(end),7),c);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return m;};
 const rail=(width,cx=0,cz=0,angle=0)=>{
  const g=new T.Group(),before=root.children.length;
  for(const x of[-width/2,width/2]){box(.16,1.35,.16,0x566962,x,.05);cyl(.13,.13,.07,0xc3b780,x,1.4);mesh(new T.SphereGeometry(.095,8,5),0xc3b780,x,1.53);}
  for(const y of[.38,1.1])box(width,.07,.07,0x526f64,0,y);
  for(let x=-width/2+.28;x<width/2-.1;x+=.28){box(.035,1.08,.035,0x354f48,x,.28);mesh(new T.ConeGeometry(.065,.16,5),0x809a7a,x,1.43);}
  for(const m of root.children.slice(before))g.add(m);g.position.set(cx,0,cz);g.rotation.y=angle;root.add(g);
 };
 if(key.startsWith('fence:'))rail(key.endsWith('long')?4.2:3.05);
 else if(key.startsWith('gate:')){
  // Two visibly open leaves, with a central entrance aligned to the paths.
  // Collection still uses the shared model-derived contact approximation.
  for(const side of[-1,1]){const leaf=new T.Group(),before=root.children.length;rail(1.65);for(const m of root.children.slice(before))leaf.add(m);leaf.position.set(side*1.8,0,-.8);leaf.rotation.y=side*.95;root.add(leaf);}
 }else if(key==='fountain'){
  cyl(1.8,1.95,.16,0xb3b5a1);cyl(1.65,1.75,.27,0x7e958e,0,.16);
  const rim=mesh(new T.TorusGeometry(1.65,.14,6,32),0xe2d5af,0,.48);rim.rotation.x=Math.PI/2;
  mesh(new T.CylinderGeometry(1.52,1.52,.025,32),0x65c1c8,0,.42,0,true);
  cyl(.27,.4,.9,0xc6c4a5,0,.42);cyl(.8,.35,.18,0xd5cfb0,0,1.26);
  const upper=mesh(new T.TorusGeometry(.72,.07,5,24),0xf1dfb6,0,1.45);upper.rotation.x=Math.PI/2;
  cyl(.13,.22,.55,0xb1b7a0,0,1.4);mesh(new T.SphereGeometry(.18,10,6),0xe0d3a9,0,1.96);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,points=[];
   for(let j=0;j<=12;j++){const t=j/12,rad=.12+t*1.18;points.push(new T.Vector3(Math.cos(a)*rad,1.96+1.5*t-3*t*t,Math.sin(a)*rad));}
   mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),16,.028,5,false),0x9ee6e1,0,0,0,true);
  }
  for(let i=0;i<10;i++){const a=i*Math.PI/5;box(.17,.16,.17,0xced0b3,Math.cos(a)*1.65,.34,Math.sin(a)*1.65);}
 }else{
  const birch=key.endsWith('birch'),cedar=key.endsWith('cedar');
  cyl(birch?.09:.16,.22,2.4,birch?0xe5dfc6:0x79634a);
  for(const side of[-1,1])rod([0,1.35,0],[side*.65,2.7,side*.25],.065,birch?0xe5dfc6:0x79634a);
  if(birch){for(let i=0;i<7;i++)box(.19,.055,.205,0x6a7061,0,.3+i*.26);for(const [x,y,z]of[[0,3.3,0],[-.5,2.9,.2],[.5,3.1,-.2]]){const m=mesh(new T.IcosahedronGeometry(.8,1),0xa6bd69,x,y,z);m.scale.set(.6,1.25,.7);}}
  else if(cedar){for(let i=0;i<5;i++)mesh(new T.ConeGeometry(1.1-i*.15,1.25,9),i%2?0x49775e:0x365f4e,0,1.5+i*.48);}
  else for(const [i,[x,y,z,s]]of[[0,2.7,0,1.1],[-.65,2.4,.3,.8],[.65,2.6,.2,.85],[.15,2.5,-.6,.85]].entries())mesh(new T.IcosahedronGeometry(s,1),i%2?0x7ba566:0x5e8b5c,x,y,z);
 }
 return root;
}
export function parkWaterAttributes(g,m){g.setAttribute('parkWater',new T.BufferAttribute(new Float32Array(g.attributes.position.count).fill(m.userData.parkWater||0),1));}
export function animateFountain(material,clock){
 material.onBeforeCompile=s=>{
  s.uniforms.parkTime=clock;s.vertexShader='attribute float parkWater;varying float vParkWater;varying vec3 vParkLocal;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvParkWater=parkWater;vParkLocal=position;');
  s.fragmentShader='uniform float parkTime;varying float vParkWater;varying vec3 vParkLocal;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(vParkWater>.5){float flow=pow(.5+.5*sin(vParkLocal.y*34.0+length(vParkLocal.xz)*16.0+parkTime*8.0),5.0);diffuseColor.rgb*=.75+flow*.7;}');
 };material.customProgramCacheKey=()=> 'park-fountain-flow-v1';
}
