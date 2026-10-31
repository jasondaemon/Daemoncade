import * as THREE from '../../vendor/three/three.module.min.js';

// Authored longitudinal sections: +Z is the nose. Bodies taper into a narrow
// peduncle rather than attaching a tail to an inflated sphere. Shared by instances.
export function oceanHero(r,type){
 if(!['whale','shark','dolphin'].includes(type))return null;
 const root=new THREE.Group();root.userData.authored=true;
 const whale=type==='whale',shark=type==='shark',y=whale?.64:.43;
 const dark=shark?0x526d7d:whale?0x395c72:0x65838e,light=whale?0xb6c9c8:0xd5dcd5;
 const sections=whale?[
  [-3.05,.045,.05],[-2.6,.11,.10],[-2.1,.23,.19],[-1.5,.40,.31],[-.8,.58,.43],[0,.68,.51],[.75,.67,.48],[1.4,.58,.39],[1.9,.43,.28],[2.18,.21,.17],[2.26,.025,.06]
 ]:shark?[
  [-2.45,.035,.06],[-2.1,.075,.12],[-1.65,.15,.19],[-1.1,.26,.28],[-.45,.40,.37],[.25,.46,.39],[.9,.40,.31],[1.4,.28,.20],[1.85,.10,.08],[2.02,.015,.015]
 ]:[
  [-2.25,.035,.05],[-1.9,.08,.10],[-1.4,.17,.18],[-.8,.29,.27],[0,.40,.35],[.6,.38,.32],[1.03,.29,.24],[1.25,.19,.17],[1.35,.105,.075],[1.8,.08,.05],[1.95,.015,.025]
 ];
 const vertices=[],colors=[],indices=[],around=20,a=new THREE.Color(dark),b=new THREE.Color(light);
 for(let j=0;j<sections.length;j++){
  const [z,w,h]=sections[j];
  for(let i=0;i<=around;i++){
   const t=i/around*Math.PI*2,s=Math.sin(t),c=a.clone().lerp(b,THREE.MathUtils.smoothstep(-s,-.2,.65));
   vertices.push(Math.cos(t)*w,y+s*h,z);colors.push(c.r,c.g,c.b);
   if(j&&i){const n=j*(around+1)+i;indices.push(n,n-1,n-around-2,n,n-around-2,n-around-1);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));g.setIndex(indices);g.computeVertexNormals();root.add(new THREE.Mesh(g,r.mat(0xffffff)));
 // Beveled, solid fins. Thin triangles disappeared edge-on and read as paper.
 const fin=(points,vertical=false,color=dark)=>{
  const thickness=whale?.04:.03,v=[],ix=[],axis=vertical?0:1;
  const outline=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),true,'centripetal').getPoints(24).slice(0,-1).map(p=>p.toArray());
  const center=outline.reduce((a,p)=>a.map((x,i)=>x+p[i]/outline.length),[0,0,0]),n=outline.length;
  for(const sign of[-1,1]){
   const middle=[...center];middle[axis]+=sign*thickness;v.push(...middle);
   for(const p of outline){const q=[...p];q[axis]+=sign*.008;v.push(...q);}
  }
  for(let i=0;i<n;i++){const k=(i+1)%n,top=i+1,next=k+1,bottom=n+1;
   ix.push(0,next,top,bottom,bottom+top,bottom+next,top,next,bottom+next,top,bottom+next,bottom+top);
  }
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(v.length/3*2),2));geom.setIndex(ix);geom.computeVertexNormals();root.add(new THREE.Mesh(geom,r.mat(color)));
 };
 for(const side of[-1,1]){
  const reach=whale?1.35:.95;
  fin([[side*.28,y-.12,.85],[side*.58,y-.18,.55],[side*reach*.9,y-.25,-.44],[side*reach,y-.26,-.72],[side*reach*.78,y-.24,-.65],[side*.47,y-.16,-.17],[side*.28,y-.15,-.05]]);
  if(!shark){const z=whale?-2.75:-2.03,span=whale?1.05:.72;
   fin([[0,y,z+.12],[side*span*.45,y+.03,z+.05],[side*span*.85,y+.02,z-.19],[side*span,y,z-.38],[side*span*.67,y-.02,z-.34],[side*span*.28,y-.02,z-.28],[0,y,z-.38]]);
  }
 }
 if(shark)fin([[0,y,-1.95],[0,y+1.12,-2.65],[0,y+.85,-2.7],[0,y-.08,-2.32],[0,y-.65,-2.6],[0,y-.50,-2.12]],true);
 fin([[0,y+(whale?.36:.29),-.15],[0,y+(shark?1.1:whale?.75:.93),-.58],[0,y+(shark?.85:whale?.68:.78),-.66],[0,y+(whale?.30:.24),-1.02]],true);
 const dot=(x,ey,z,s,color)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(s,8,6),r.mat(color));m.position.set(x,ey,z);root.add(m);};
 for(const side of[-1,1]){
  // Small lateral eyes: no white cartoon eyeballs.
  dot(side*(whale?.48:shark?.31:.255),y+.07,whale?1.62:shark?1.24:1.10,whale?.035:.027,0x112a36);
  if(shark)for(let i=0;i<5;i++){
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*(.415-i*.008),y+.17,.72-i*.10),new THREE.Vector3(side*(.45-i*.008),y,.69-i*.10),new THREE.Vector3(side*(.39-i*.008),y-.14,.67-i*.10)]);
   root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,3,.009,3,false),r.mat(0x344d59)));
  }
 }
 if(whale){
  dot(0,y+.49,.85,.035,0x253f51);
  for(let i=-3;i<=3;i++){
   const x=i*.065,curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y-.25,1.65),new THREE.Vector3(x*1.5,y-.43,.9),new THREE.Vector3(x*1.8,y-.49,.15)]);
   root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,5,.009,3,false),r.mat(0x809eaa)));
  }
 }
 return root;
}
