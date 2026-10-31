import * as THREE from '../../vendor/three/three.module.min.js';
import {mergeGeometries} from '../../vendor/three/addons/utils/BufferGeometryUtils.js';

export const CHARACTER_STYLES=Object.freeze(['mimic','cat','kraken','golem','visitor','sunbeast','bat','serpent']);

// Authored in the mouth's XY plane, negative Z pointing up. A single colored
// mesh per creature keeps the collection affordable on mobile. No texture IO,
// particles, collision proxies or per-frame geometry allocations are required.
export function collectionGeometry(style){
 const parts=[];
 const add=(g,color,x=0,y=0,z=0)=>{
  g.translate(x,y,z);const c=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<g.attributes.position.count;i++)c.toArray(colors,i*3);
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(g);
 };
 const oval=(x,y,z,sx,sy,sz,color)=>{const g=new THREE.SphereGeometry(1,10,6);g.scale(sx,sy,sz);add(g,color,x,y,z);};
 const box=(x,y,z,w,h,d,color,angle=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.rotateZ(angle);add(g,color,x,y,z);};
 const ring=(r,t,color,z=0,flat=1)=>{const g=new THREE.TorusGeometry(r,t,6,64);g.scale(1,1,flat);add(g,color,0,0,z);};
 const tube=(points,r,color,segments=12)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,6,false),color);
 const cone=(x,y,z,r,h,color,direction=[0,0,-1])=>{const g=new THREE.ConeGeometry(r,h,6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...direction).normalize()));add(g,color,x,y,z);};
 const shape=(points,z,depth,color)=>{
  const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();
  add(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:1,curveSegments:1}),color,0,0,z);
 };
 const eyes=(iris,skin,slit=false)=>{
  for(const side of [-1,1]){
   oval(side*.61,-1.20,-.18,.28,.23,.18,skin);
   oval(side*.61,-1.19,-.32,.205,.16,.12,iris);
   oval(side*.61,-1.14,-.43,slit?.035:.07,.085,.025,0x101e2d);
   oval(side*.64,-1.16,-.455,.022,.024,.012,0xffffff);
  }
 };
 const tooth=(a,color=0xffefd0)=>cone(Math.sin(a)*1.07,Math.cos(a)*1.07,-.12,.055,.18,color);
 const insetEyes=(iris,socket)=>{
  for(const side of [-1,1]){
   oval(side*.59,-1.24,-.265,.25,.115,.07,socket);
   oval(side*.59,-1.23,-.323,.175,.07,.025,iris);
   oval(side*.59,-1.23,-.348,.024,.059,.012,0x142330);
   oval(side*.63,-1.25,-.36,.018,.014,.007,0xfff2cd);
  }
 };

 if(style==='mimic'){
  // A square, iron-bound treasure chest with the real hole as its open maw.
  ring(1.08,.075,0xeebd53);
  for(const side of [-1,1]){
   box(side*1.17,0,-.025,.24,2.54,.20,0x754536);
   box(0,side*1.17,-.025,2.54,.24,.20,0x965d3e);
   for(const strap of [-.72,.72]){box(strap,side*1.18,-.15,.10,.27,.055,0xffd271);box(side*1.18,strap,-.15,.27,.10,.055,0xffd271);}
   for(const k of [-.06,.04]){box(side*(1.17+k),0,-.132,.015,1.95,.012,0x4f3430);box(0,side*(1.17+k),-.132,1.95,.015,.012,0x4f3430);}
   for(const y of [-1.17,1.17])oval(side*1.17,y,-.16,.045,.045,.025,0xffe5a1);
  }
  box(0,-1.43,-.15,2.25,.30,.30,0x5c3732);box(0,-1.44,-.32,2.3,.34,.055,0xc58d45);
  for(const x of [-.9,-.3,.3,.9])box(x,-1.44,-.355,.018,.27,.018,0x704333);
  eyes(0xffecb1,0x814735,true);
  for(const a of [-.8,-.4,0,.4,.8,2.5,-2.5])tooth(a);
  box(0,1.30,-.13,.25,.28,.12,0xffd46b);oval(0,1.31,-.2,.04,.05,.018,0x362a32);box(0,1.36,-.21,.025,.065,.015,0x362a32);
 }else if(style==='cat'){
  ring(1.115,.105,0x8253bc,0,.75);ring(1.027,.025,0xe4a1e7,-.025);
  oval(0,-1.25,-.10,.84,.23,.16,0x8253bc);
  for(const side of [-1,1]){
   shape([[side*.77,-1.02],[side*.94,-1.59],[side*1.17,-.95]],-.36,.18,0x7241a5);
   shape([[side*.88,-1.09],[side*.95,-1.43],[side*1.08,-1.06]],-.38,.02,0xf0a5cf);
   oval(side*1.17,.33,-.08,.16,.25,.13,0xa96ed4);
   for(const offset of [-.12,0,.12])tube([[side*1.11,.18+offset,-.16],[side*1.4,.15+offset*1.5,-.2],[side*1.57,.05+offset*2,-.18]],.015,0xf6dfed,6);
   for(let i=0;i<3;i++)box(side*(1.13-i*.04),-.10-i*.18,-.11,.09,.04,.06,0x452e73,side*.5);
  }
  insetEyes(0xf5d475,0x452e73);oval(0,-1.10,-.20,.10,.055,.06,0xf0a5cf);
  // A curved, segmented grin, not a white bar across the opening.
  for(let i=-5;i<=5;i++){const a=i*.14;box(Math.sin(a)*1.10,Math.cos(a)*1.10,-.075,.10,.105,.065,0xffeedc,-a);}
 }else if(style==='kraken'){
  ring(1.12,.11,0x258d91,0,.7);ring(1.026,.025,0x9fe0c4,-.025);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4+.15,point=(r,t,z)=>[Math.sin(a+t)*r,Math.cos(a+t)*r,z];
   tube([point(1.14,0,-.025),point(1.42,.05,-.10),point(1.63,.20,-.18),point(1.57,.40,-.24),point(1.40,.42,-.29)],.085,i%2?0x3eaaa6:0x258d91,14);
   for(let j=0;j<4;j++){
    const t=j/3,p=point(1.27+t*.28,.04+t*.30,-.24);
    for(const [radius,color,z]of [[.043,0xf3cea4,p[2]],[.018,0xb46d84,p[2]-.005]]){const g=new THREE.CircleGeometry(radius,8);g.rotateY(Math.PI);add(g,color,p[0],p[1],z);}
   }
  }
  oval(0,-1.30,-.15,.40,.23,.23,0x258d91);eyes(0xffdf84,0x237c82);oval(0,-1.15,-.30,.08,.05,.06,0x75cbc0);
 }else if(style==='golem'){
  ring(1.14,.115,0x727ca8,0,.7);ring(1.026,.025,0x83d7e8,-.035);
  shape([[-.91,-1.04],[-.89,-1.37],[-.48,-1.50],[.06,-1.34],[.61,-1.50],[.93,-1.30],[.90,-1.04],[.5,-1.08],[0,-1.16],[-.5,-1.08]],-.25,.20,0x6974a7);
  for(let i=0;i<14;i++){
   const a=i*Math.PI/7,g=new THREE.OctahedronGeometry(1);g.scale(.17,.19,.12+(i%3)*.05);g.rotateZ(-a);add(g,[0x9381ba,0x6974a7,0xb9c7e7][i%3],Math.sin(a)*1.21,Math.cos(a)*1.21,-.03);
  }
  for(const [x,y,s]of [[-.78,-1.14,.34],[.72,-1.17,.48],[1.18,.62,.20],[-1.18,.70,.26]]){
   const g=new THREE.OctahedronGeometry(1);g.scale(.16,.21,s);add(g,0xb4e9f3,x,y,-s*.65);
   const seam=new THREE.OctahedronGeometry(1);seam.scale(.06,.08,s*.55);add(seam,0x74b9d5,x+.035,y-.025,-s*.78);
  }
  for(const side of [-1,1]){
   box(side*.57,-1.24,-.31,.37,.16,.12,0x354261,-side*.18);
   box(side*.57,-1.24,-.38,.23,.045,.025,0x78f4f2,-side*.18);
   box(side*.62,-1.34,-.36,.43,.07,.10,0x59648c,-side*.18);
  }
  box(0,-1.12,-.20,.23,.14,.18,0x727cb3);
 }else if(style==='visitor'){
  ring(1.18,.16,0xabbacc,0,.44);ring(1.31,.035,0x48556d);ring(1.026,.025,0x79e9e4,-.055);
  for(let i=0;i<16;i++){
   const a=i*Math.PI/8,x=Math.sin(a),y=Math.cos(a);
   oval(x*1.225,y*1.225,-.095,.052,.052,.028,[0x8ff5e5,0xff729f,0xffe091,0x9d9cff][i%4]);
   if(i%2===0)box(x*1.12,y*1.12,-.08,.07,.045,.02,0x66788f,-a);
  }
  oval(0,-1.40,-.16,.34,.26,.22,0x4f8fba);oval(0,-1.40,-.28,.24,.19,.18,0x7cda83);
  for(const side of [-1,1]){oval(side*.105,-1.36,-.435,.055,.08,.025,0x142f43);oval(side*.12,-1.38,-.46,.014,.021,.01,0xd3ffdb);}
  tube([[0,-1.57,-.19],[0,-1.68,-.28]],.018,0x627a91,3);oval(0,-1.71,-.30,.045,.045,.045,0xff8eac);
  for(const side of [-1,1])box(side*.28,-1.43,-.26,.035,.23,.10,0xc5deed);
 }else if(style==='sunbeast'){
  ring(1.11,.105,0xf8b33a,0,.85);ring(1.026,.025,0xffe6a1,-.035);
  oval(0,-1.25,-.09,.82,.23,.16,0xe99332);
  for(let i=0;i<14;i++){
   const a=i*Math.PI/7,points=[[0,1.09],[-.13,1.24],[-.08,1.42],[.08,i%2?1.62:1.52],[.12,1.29]].map(([x,y])=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)]);
   shape(points,-.04,.065,i%2?0xed6e36:0xf59c36);
   const x=-Math.sin(a)*1.24,y=Math.cos(a)*1.24;oval(x,y,-.10,.055,.055,.04,0xffd365);
  }
  insetEyes(0xfff2bd,0xc56836);oval(0,-1.11,-.18,.10,.07,.07,0xffd46f);
  for(const side of [-1,1])box(side*.62,-1.30,-.36,.38,.06,.055,0xc56836,-side*.23);
  for(const a of [-.58,.58])tooth(a,0xfff3b7);
 }else if(style==='bat'){
  ring(1.11,.10,0x65517f,0,.8);ring(1.026,.025,0xc2a2d6,-.025);
  oval(0,-1.25,-.09,.80,.23,.16,0x65517f);
  for(const side of [-1,1]){
   const wing=[[1.07,-.57],[1.45,-.83],[1.76,-.60],[1.56,-.30],[1.64,-.02],[1.40,.03],[1.52,.35],[1.28,.32],[1.24,.65],[1.06,.43]].map(([x,y])=>[side*x,y]);
   shape(wing,-.08,.07,0x483e67);
   for(const [x,y]of [[1.76,-.60],[1.64,-.02],[1.52,.35],[1.24,.65]])tube([[side*1.09,-.38,-.17],[side*(x-.1),y-.02,-.18],[side*x,y,-.16]],.018,0x9b7eac,5);
   shape([[side*.78,-1.04],[side*.75,-1.65],[side*1.04,-1.17]],-.36,.16,0x65517f);
   shape([[side*.82,-1.16],[side*.79,-1.47],[side*.96,-1.19]],-.38,.025,0xc692b5);
  }
  insetEyes(0xffbe8a,0x342e50);oval(0,-1.10,-.20,.095,.06,.065,0xb28fae);
  tooth(2.65);tooth(-2.65);
 }else if(style==='serpent'){
  ring(1.026,.025,0x9dd9cb,-.035);
  // ONE tapered animal from tail tip to neck, not a torus with disconnected
  // appendages. Scale markings are pigmentation on the skin, never pyramids.
  const points=[[-1.32,-1.16,-.07],[-1.48,-.95,-.08],[-1.36,-.72,-.09]];
  for(let i=0;i<=48;i++){const a=-2.2+i/48*5.22,t=Math.max(0,(a-2.5)/.52),r=1.215+t*.205;points.push([Math.sin(a)*r,Math.cos(a)*r,-.10-t*.035]);}
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments=144,sides=10,positions=[],colors=[],indices=[];
  const skin=[0x305b79,0x548fa0,0x70a8ae,0x3f7288].map(c=>new THREE.Color(c)),belly=new THREE.Color(0x9dc7bd);
  for(let i=0;i<=segments;i++){
   const t=i/segments,p=curve.getPointAt(t),tangent=curve.getTangentAt(t),normal=new THREE.Vector3(tangent.y,-tangent.x,0).normalize(),radius=.012+.17*THREE.MathUtils.smoothstep(t,0,.13);
   for(let j=0;j<=sides;j++){
    const a=j/sides*Math.PI*2,c=Math.cos(a),s=Math.sin(a);positions.push(p.x+normal.x*c*radius,p.y+normal.y*c*radius,p.z+s*radius*.78);
    const diamond=Math.abs(i%12-6)/6+Math.abs(j-sides*.75)/2;
    const color=s>.25?belly:skin[diamond<.9?0:diamond<1.25?1:2];color.toArray(colors,colors.length);
    if(i<segments&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
   }
  }
  for(const end of [0,1]){
   const p=curve.getPointAt(end),center=positions.length/3,base=end*segments*(sides+1);positions.push(p.x,p.y,p.z);skin[0].toArray(colors,colors.length);
   for(let j=0;j<sides;j++)indices.push(center,base+j+(end?1:0),base+j+(end?0:1));
  }
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));body.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));body.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));body.setIndex(indices);body.computeVertexNormals();parts.push(body);
  const neck=points.at(-1),headPoints=[[-.14,-.14],[.10,-.235],[.43,-.155],[.54,-.085],[.54,.085],[.43,.155],[.10,.235],[-.14,.14]];
  const head=(z,depth,color,scale=1)=>{
   const s=new THREE.Shape();headPoints.forEach(([u,v],i)=>{const x=neck[0]-u*scale,y=neck[1]+v*scale;i?s.lineTo(x,y):s.moveTo(x,y);});s.closePath();
   add(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:2,steps:1}),color,0,0,z);
  };
  head(-.19,.08,0xadcbb7,.97);head(-.36,.15,0x528ea0);
  for(const side of [-1,1]){
   const x=neck[0]-.15,y=neck[1]+side*.15;
   oval(x,y,-.382,.087,.060,.025,0x254f63);oval(x-.01,y,-.403,.064,.040,.018,0xf3ce70);
   oval(x-.015,y,-.421,.013,.034,.009,0x122c39);oval(x-.035,y-.012,-.430,.009,.009,.006,0xfff1c7);
   oval(neck[0]-.435,neck[1]+side*.072,-.385,.022,.015,.008,0x254f63);
   tube([[neck[0]-.03,neck[1]+side*.22,-.205],[neck[0]-.34,neck[1]+side*.16,-.205],[neck[0]-.51,neck[1]+side*.082,-.205]],.012,0x254f63,8);
  }
  // A forked tongue and wedge-shaped jaw replace the old horns/googly snout.
  const nose=neck[0]-.54;
  tube([[nose,neck[1],-.22],[nose-.12,neck[1],-.22],[nose-.22,neck[1]-.055,-.22]],.014,0xd7829b,6);
  tube([[nose-.12,neck[1],-.22],[nose-.22,neck[1]+.055,-.22]],.012,0xd7829b,4);
 }
 if(!parts.length)throw Error(`Unknown character rim: ${style}`);
 const flat=parts.map(g=>g.index?g.toNonIndexed():g),result=mergeGeometries(flat,false);
 for(const g of new Set([...parts,...flat]))g.dispose();result.computeBoundingSphere();return result;
}
