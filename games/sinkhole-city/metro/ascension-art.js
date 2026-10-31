import * as T from '../../vendor/three/three.module.min.js';
import {SCALE_STAGES} from './ascension.js?v=release48';
import {orbitPrimitive} from './orbit-art.js?v=collapse29';
import {surfaceColor} from './surfaces.js?v=quality14';

export function ascensionGround(r,g,index=0){
 const s=SCALE_STAGES[index];r.underwater.value=index===2?1:0;r.cosmic.value=0;
 r.scene.background.setHex(s.sky);r.scene.fog.color.copy(r.scene.background);r.sun.color.setHex(index<3?0xb5edf1:0xffe6b3);r.sun.intensity=s.space?2:2.8;
 const geometry=new T.PlaneGeometry(180,180,64,64);geometry.rotateX(-Math.PI/2);geometry.translate(0,.012,0);const p=geometry.attributes.position,colors=new Float32Array(p.count*3),base=new T.Color(s.floor),c=new T.Color();
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),n=Math.sin(x*.31+Math.sin(z*.21)*2)*Math.cos(z*.27);
  c.setRGB(1,1,1).multiplyScalar(.9+n*.13);colors.set([c.r,c.g,c.b],i*3);
 }
 geometry.setAttribute('color',new T.BufferAttribute(colors,3));const baseMaterial=r.mat(s.floor,true),mat=baseMaterial.clone();mat.onBeforeCompile=baseMaterial.onBeforeCompile;mat.customProgramCacheKey=baseMaterial.customProgramCacheKey;mat.vertexColors=true;r.infinitySurface=mat;
 r.infinitySpace={value:s.space?1:0};
 mat.onBeforeCompile=shader=>{baseMaterial.onBeforeCompile(shader);shader.uniforms.infinitySpace=r.infinitySpace;shader.fragmentShader='uniform float infinitySpace;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nvec2 infinityCell=floor(vHoleWorld.xz*1.25);float infinityHash=fract(sin(dot(infinityCell,vec2(127.1,311.7)))*43758.5453);float infinityStar=(1.0-smoothstep(.015,.06,length(fract(vHoleWorld.xz*1.25)-vec2(.5))))*step(.975,infinityHash);totalEmissiveRadiance+=vec3(.65,.72,.9)*infinityStar*infinitySpace;');};mat.customProgramCacheKey=()=>baseMaterial.customProgramCacheKey()+'-infinity-stars';
 // The stage owns this cloned surface material, unlike cached terrain colors.
 const mesh=new T.Mesh(geometry,mat);mesh.userData.ownedMaterial=true;mesh.receiveShadow=!s.space;g.add(mesh);
}
export function updateAscensionGround(r,progress){
 const a=Math.min(SCALE_STAGES.length-1,Math.floor(progress)),b=Math.min(SCALE_STAGES.length-1,a+1),v=Math.min(1,progress-a),t=v*v*(3-2*v),first=SCALE_STAGES[a],next=SCALE_STAGES[b];
 r.infinitySurface.color.setHex(first.floor).lerp(new T.Color(next.floor),t);
 r.scene.background.setHex(first.sky).lerp(new T.Color(next.sky),t);r.scene.fog.color.copy(r.scene.background);
 const space=(first.space?1:0)*(1-t)+(next.space?1:0)*t;
 const dark=Math.max(0,Math.min(1,progress-(SCALE_STAGES.length-2)));
 r.infinitySurface.color.multiplyScalar(1-dark);r.scene.background.multiplyScalar(1-dark);r.scene.fog.color.copy(r.scene.background);
 r.underwater.value=0;r.cosmic.value=0;r.sun.intensity=2.6-1.2*space;r.infinitySpace.value=space*(1-dark);
}
export function quantumAttributes(g,mesh,normal){
 const n=g.attributes.position.count,orbit=mesh.userData.quantumOrbit,axis=new Float32Array(n*3),center=new Float32Array(n*3),motion=new Float32Array(n),glow=new Float32Array(n*4);
 const c=new T.Vector3(0,.9,0).applyMatrix4(normal),a=orbit?.axis||[0,1,0];
 const halo=mesh.userData.quantumHalo,origin=halo?mesh.position.clone().applyMatrix4(normal):new T.Vector3(),radius=halo?(halo*new T.Vector3().setFromMatrixScale(normal).x):0;
 for(let i=0;i<n;i++){axis.set(a,i*3);center.set([c.x,c.y,c.z],i*3);motion[i]=orbit?.speed||0;glow.set([origin.x,origin.y,origin.z,radius],i*4);}
 g.setAttribute('quantumAxis',new T.BufferAttribute(axis,3));g.setAttribute('quantumCenter',new T.BufferAttribute(center,3));g.setAttribute('quantumSpeed',new T.BufferAttribute(motion,1));g.setAttribute('quantumHalo',new T.BufferAttribute(glow,4));
}
export function animateQuantum(mesh,time){
 mesh.geometry.setAttribute('quantumVisibility',new T.InstancedBufferAttribute(new Float32Array(mesh.count).fill(1),1));
 const attach=mat=>{mat.onBeforeCompile=shader=>{
  shader.uniforms.quantumTime=time;
  shader.vertexShader='uniform float quantumTime;attribute vec3 quantumAxis;attribute vec3 quantumCenter;attribute float quantumSpeed;attribute float quantumVisibility;attribute vec4 quantumHalo;varying vec4 vQuantumHalo;varying vec3 vQuantumLocal;varying float vQuantumVisibility;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vQuantumVisibility=quantumVisibility;vQuantumHalo=quantumHalo;vQuantumLocal=transformed;
   float qa=quantumTime*quantumSpeed;vec3 qp=transformed-quantumCenter;
   transformed=quantumCenter+qp*cos(qa)+cross(quantumAxis,qp)*sin(qa)+quantumAxis*dot(quantumAxis,qp)*(1.-cos(qa));`);
  shader.fragmentShader='varying float vQuantumVisibility;varying vec4 vQuantumHalo;varying vec3 vQuantumLocal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
   float qDither=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
   float qOpacity=vQuantumVisibility;
   if(vQuantumHalo.w>0.){float qRad=length(vQuantumLocal-vQuantumHalo.xyz)/vQuantumHalo.w;qOpacity*=exp(-qRad*qRad*4.)*.48;}
   if(qDither>qOpacity)discard;`);
 };mat.customProgramCacheKey=()=> 'infinity-orbital-motion-v1';};
 attach(mesh.material);attach(mesh.customDepthMaterial);
}
export function ascensionPrimitive(r,key){
 if(!key.startsWith('quantum:'))return null;
 const kind=key.slice(8).split('@')[0],root=new T.Group();root.userData.authored=true;
 const add=(g,c,x=0,y=0,z=0)=>{const m=new T.Mesh(g,r.mat(c));m.position.set(x,y,z);root.add(m);return m;};
 const sphere=(rad,c,x=0,y=rad,z=0,sx=1,sy=1,sz=1)=>{const m=add(new T.SphereGeometry(rad,rad>=.3?16:10,rad>=.3?10:7),c,x,y,z);m.scale.set(sx,sy,sz);return m;};
 const rod=(a,b,w,c)=>{const v=new T.Vector3(...a),end=new T.Vector3(...b),m=add(new T.CylinderGeometry(w,w,v.distanceTo(end),7),c);m.position.copy(v).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(v).normalize());};
 const ring=(rad,c,y=1,angle=0)=>{const m=add(new T.TorusGeometry(rad,.018,5,48),c,0,y);m.rotation.set(Math.PI/2,angle,angle*.6);return m;};
 const box=(w,h,d,c,x=0,y=0,z=0)=>add(new T.BoxGeometry(w,h,d),c,x,y+h/2,z);
 const foliage=(x,y,z,length,width,angle,c=0x70a76d)=>{const m=sphere(length,c,x,y,z,1,.16,width/length);m.rotation.set(0,angle,.18);return m;};
 const building=(x,z,w,d,h,c,roof=0x5f7c8a)=>{
  box(w,h,d,c,x,0,z);box(w*1.07,.06,d*1.07,roof,x,h,z);
  for(let floor=.25;floor<h-.1;floor+=.3)for(const side of[-1,1]){box(w*.2,.13,.025,0x96c7d4,x+side*w*.27,floor,z+d/2+.01);box(.025,.13,d*.25,0x96c7d4,x+w/2+.01,floor,z+side*d*.26);}
  box(.12,.1,.15,0xbac2be,x+w*.2,h+.06,z);
 };
 const galaxy=(x=0,y=.35,z=0,rad=1)=>{
  const halo=add(new T.CircleGeometry(rad*1.25,48),0x847bbd,x,y-.035,z);halo.rotation.x=-Math.PI/2;halo.userData.quantumHalo=rad*1.25;
  sphere(.22*rad,0xffe0ad,x,y,z,1,.65,1);
  for(let arm=0;arm<3;arm++){
   const positions=[],colors=[],color=new T.Color();
   for(let j=0;j<24;j++)for(const [step,side]of[[0,-1],[1,-1],[1,1],[0,-1],[1,1],[0,1]]){const t=(j+step)/24,d=(.1+t*.9)*rad,a=arm*Math.PI*2/3+t*4,width=.11*rad*Math.sin(Math.PI*t)*side;positions.push(x+Math.cos(a)*(d+width),y,z+Math.sin(a)*(d+width));color.setHex(arm%2?0xa4c5ec:0xd7b8de).multiplyScalar(.65+.35*Math.sin(t*Math.PI));colors.push(color.r,color.g,color.b);}
   for(let i=0;i<positions.length;i+=9){const ax=positions[i+3]-positions[i],az=positions[i+5]-positions[i+2],bx=positions[i+6]-positions[i],bz=positions[i+8]-positions[i+2];if(az*bx-ax*bz<0)for(let k=0;k<3;k++){[positions[i+3+k],positions[i+6+k]]=[positions[i+6+k],positions[i+3+k]];[colors[i+3+k],colors[i+6+k]]=[colors[i+6+k],colors[i+3+k]];}}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));geometry.computeVertexNormals();add(geometry,0xffffff);
  }
  const count=rad<.5?40:120;
  for(let i=0;i<count;i++){const a=i*2.39996,d=Math.sqrt(i/count)*rad,arm=Math.floor(i%3)*Math.PI*2/3+d/rad*4;const c=i%4===0?0xe9adce:i%2?0xa5bdf1:0xe4dcbd;add(new T.IcosahedronGeometry(.012*rad+(1-d/rad)*.025*rad,0),c,x+Math.cos(arm+a*.09)*d,y+Math.sin(a)*.065*rad,z+Math.sin(arm+a*.09)*d);}
 };
 if(['moon','earth','gas','sun','giant'].includes(kind)){
  const variant=kind==='earth'?'ocean':kind==='gas'?'ringed':['sun','giant'].includes(kind)?'sun':'ice',globe=orbitPrimitive(r,['sun','giant'].includes(kind)?'landmark:sun':`planet:${variant}`);
  // Infinity has many globes at once; retain direction-space surface colors
  // with a lower tessellation than Orbit's four showcase planets.
  globe.traverse(m=>{if(!m.isMesh||m.geometry.type!=='SphereGeometry'||!m.geometry.attributes.color)return;const radius=m.geometry.parameters.radius,g=new T.SphereGeometry(radius,28,18),p=g.attributes.position,colors=new Float32Array(p.count*3),c=new T.Color();for(let i=0;i<p.count;i++){c.setRGB(...surfaceColor(variant,p.getX(i)/radius,p.getY(i)/radius,p.getZ(i)/radius),T.SRGBColorSpace);colors.set([c.r,c.g,c.b],i*3);}g.setAttribute('color',new T.BufferAttribute(colors,3));m.geometry.dispose();m.geometry=g;});return globe;
 }
 if(['proton','atom','ion'].includes(kind)){
  const count=kind==='proton'?3:11;
  for(let i=0;i<count;i++){const a=i*2.4;sphere(kind==='proton'?.22:.15,i%2?0xf17868:0x72d3ea,Math.cos(a)*.22,.9+Math.sin(a*1.7)*.2,Math.sin(a)*.22);}
  if(kind!=='proton')for(let i=0;i<3;i++){
   const orbit=ring(.9,0x4eafc9,.9,i*1.05),axis=new T.Vector3(0,0,1).applyQuaternion(orbit.quaternion),position=new T.Vector3(.9,0,0).applyQuaternion(orbit.quaternion);
   const electron=sphere(.09,0xffebad,position.x,.9+position.y,position.z);electron.userData.quantumOrbit={axis:axis.toArray(),speed:1.3+i*.45};
  }
 }else if(['molecule','polymer','protein','dna'].includes(kind)){
  const count=kind==='molecule'?5:kind==='protein'?20:14;let previous=null,opposite=null;
  for(let i=0;i<count;i++){
   const a=i*.8,x=kind==='molecule'?(i?Math.cos(i*2.1)*.65:0):Math.sin(a)*.55,z=kind==='molecule'?(i?Math.sin(i*2.1)*.65:0):Math.cos(a)*.55,y=kind==='molecule'?.7+(i%2)*.25:kind==='protein'?.8+Math.sin(i*.37)*.5:i*.13+.2;
   const point=[x,y,z];sphere(kind==='molecule'?.22:.14,[0x6bdad2,0xf18d83,0xb9a3ef,0xf3d99b][i%4],x,y,z);
   if(i)rod(kind==='molecule'?[0,.7,0]:previous,point,.045,0xc0d8e0);
   if(kind==='dna'){const other=[-x,y,-z];sphere(.14,0xdca4d9,...other);rod(point,other,.032,i%2?0xf0cf79:0x8dc9dd);if(opposite)rod(opposite,other,.045,0xc0d8e0);opposite=other;}previous=point;
  }
 }else if(['cell','amoeba','bacterium','colony'].includes(kind)){
  const m=sphere(1,kind==='amoeba'?0x98c8a0:0x79bfc0,0,.45,0,1,.4,kind==='bacterium'?1.6:1);const p=m.geometry.attributes.position;
  if(kind==='amoeba')for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),s=1+.17*Math.sin(a*5);p.setXYZ(i,x*s,p.getY(i),z*s);}m.geometry.computeVertexNormals();
  sphere(.34,0x7f6eaa,.1,.7,.05,1,.45,1);sphere(.13,0xd6a1ce,.13,.82,.08);
  for(let i=0;i<10;i++){const a=i*2.4;sphere(.08,i%2?0xd8d18b:0x458c93,Math.cos(a)*.65,.76,Math.sin(a)*.65);if(kind==='bacterium')rod([Math.cos(a)*.8,.4,Math.sin(a)*1.3],[Math.cos(a)*1.1,.45,Math.sin(a)*1.7],.02,0xa9d6ba);}
  // Membrane lip, folded mitochondria and organelles read from the overhead view.
  const rim=add(new T.TorusGeometry(1,.038,6,48),0xb7e5bf,0,.45);rim.rotation.x=Math.PI/2;rim.scale.set(1,kind==='bacterium'?1.6:1,1);
  for(let i=0;i<3;i++){const a=i*2.1,x=Math.cos(a)*.57,z=Math.sin(a)*.57;sphere(.19,0xe3ae80,x,.77,z,1,.45,.6);for(let j=0;j<3;j++)rod([x-.1+j*.08,.84,z-.07],[x-.12+j*.08,.84,z+.07],.015,0x936f75);}
  if(kind==='bacterium'){const points=[];for(let i=0;i<20;i++)points.push(new T.Vector3(Math.sin(i*.5)*.15,.35,1.4+i*.06));add(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.025,5,false),0xb7e5bf);}
 }else if(['diatom','rotifer','tardigrade'].includes(kind)){
  if(kind==='diatom'){
   sphere(1,0xb7d6ba,0,.32,0,1,.28,.55);
   for(let i=0;i<9;i++){const x=(i-4)*.18;rod([x,.6,-.35*Math.sqrt(1-x*x)],[x,.6,.35*Math.sqrt(1-x*x)],.018,0x5b9e99);for(const side of[-1,1])sphere(.045,0xe7dfa8,x,.62,side*.18);}
  }else if(kind==='rotifer'){
   sphere(.65,0x9ed2bd,0,.45,0,.6,.6,1.4);sphere(.3,0xd8c78e,0,.48,.65,1,.4,1);sphere(.17,0xb6a8cf,.08,.64,-.1);
   for(let i=0;i<20;i++){const a=i*Math.PI/10;rod([Math.cos(a)*.28,.5,.65+Math.sin(a)*.28],[Math.cos(a)*.5,.52,.65+Math.sin(a)*.5],.014,0xe5edbb);}rod([0,.3,-.7],[.12,.2,-1.15],.07,0x87b9a5);
  }else{
   for(let i=0;i<5;i++)sphere(.34,0xa7bd9a,0,.48,(i-2)*.28,1,.8,1);
   for(const side of[-1,1])for(let i=0;i<4;i++){const z=(i-1.5)*.3;rod([side*.22,.4,z],[side*.48,.12,z],.1,0x88a687);for(let claw=0;claw<3;claw++)rod([side*.48,.12,z+(claw-1)*.045],[side*.58,.04,z+(claw-1)*.06],.018,0xe0d6b8);}sphere(.045,0x354a47,.13,.61,.76);sphere(.045,0x354a47,-.13,.61,.76);
  }
 }else if(['moss','grass','fern','shrub','sapling','leaf'].includes(kind)){
  if(kind==='leaf'){foliage(0,.12,0,.9,.44,0,0xb7a662);rod([-.8,.16,0],[.8,.16,0],.022,0x7f8e57);for(let i=0;i<6;i++)for(const side of[-1,1])rod([-.6+i*.22,.16,0],[-.45+i*.2,.16,side*.32],.011,0x8d965b);}
  else if(kind==='moss'){for(let i=0;i<22;i++){const a=i*2.4,d=Math.sqrt(i/22)*.7;sphere(.22,[0x8fb77a,0x69a27c,0xafc784][i%3],Math.cos(a)*d,.18+Math.sin(i)*.06,Math.sin(a)*d,1,.6,1);}}
  else if(kind==='grass'){for(let i=0;i<17;i++){const a=i*2.4;rod([Math.cos(a)*.2,0,Math.sin(a)*.2],[Math.cos(a)*.55,.5+i%4*.13,Math.sin(a)*.55],.022,i%2?0x9fba70:0x60986d);}}
  else if(kind==='fern'){for(let i=0;i<7;i++){const a=i*2.4,end=[Math.cos(a)*.8,.3+i%3*.13,Math.sin(a)*.8];rod([0,0,0],end,.022,0x6f9760);for(let j=1;j<5;j++)for(const side of[-1,1]){const t=j/5,x=end[0]*t+Math.cos(a+Math.PI/2)*side*.12,z=end[2]*t+Math.sin(a+Math.PI/2)*side*.12;foliage(x,end[1]*t,z,.17,.07,a+side*.6,i%2?0x6aa777:0x89b77b);}}}
  else{rod([0,0,0],[0,kind==='sapling'?1.7:.75,0],.065,0x846f50);for(let i=0;i<7;i++){const a=i*2.4,y=kind==='sapling'?.8+i*.14:.45+i*.06,x=Math.cos(a)*.4,z=Math.sin(a)*.4;rod([0,y-.1,0],[x,y,z],.025,0x846f50);sphere(kind==='sapling'?.27:.34,[0x6eac7c,0x99bd7e,0x5b9673][i%3],x,y,z,1,.75,1);}}
 }else if(kind==='mushroom'){
  for(let i=0;i<3;i++){const x=(i-1)*.48,z=i%2*.4,h=.55+i*.17;rod([x,0,z],[x,h,z],.09,0xe2d6b0);sphere(.4,i%2?0xcc9c6d:0xc07b63,x,h,z,1,.4,1);for(let j=0;j<5;j++){const a=j*2.4;sphere(.045,0xe9d9b2,x+Math.cos(a)*.2,h+.13,z+Math.sin(a)*.2,1,.3,1);}}
 }else if(kind==='person'){
  sphere(.15,0xd5ae89,0,1.48);box(.34,.52,.24,0x69a6c4,0,.8);for(const side of[-1,1]){rod([side*.11,.8,0],[side*.15,.08,side*.07],.07,0x43566f);rod([side*.2,1.2,0],[side*.3,.65,.07],.055,0xd5ae89);box(.16,.09,.3,0x33454b,side*.15,0,side*.07);}
 }else if(kind==='bicycle'){
  for(const x of[-.6,.6]){add(new T.TorusGeometry(.35,.045,6,24),0x384b52,x,.38);for(let j=0;j<8;j++){const a=j*Math.PI/4;rod([x,.38,0],[x+Math.cos(a)*.32,.38+Math.sin(a)*.32,0],.012,0xb6c4c9);}}
  for(const [a,b]of[[[-.6,.38,0],[-.1,.85,0]],[[-.1,.85,0],[.15,.38,0]],[[.15,.38,0],[-.6,.38,0]],[[-.1,.85,0],[.5,.85,0]],[[.5,.85,0],[.15,.38,0]],[[.5,1.1,0],[.6,.38,0]]])rod(a,b,.035,0xe0a96d);box(.28,.06,.18,0x394b52,-.1,.9);rod([.5,1.1,-.2],[.5,1.1,.2],.035,0x768b91);
 }else if(kind==='car'){
  box(1.1,.35,2,0xe0ad6f,0,.22);box(.9,.34,.95,0xe9bf84,0,.57,-.1);box(.77,.24,.025,0x759ea8,0,.63,.39);box(.77,.24,.025,0x759ea8,0,.63,-.59);for(const side of[-1,1])for(const z of[-.6,.62]){const wheel=add(new T.CylinderGeometry(.22,.22,.14,12),0x35434a,side*.55,.22,z);wheel.rotation.z=Math.PI/2;sphere(.07,0xffe2a5,side*.35,.4,.99);}
 }else if(['apartment','tower','district','city'].includes(kind)){
  if(['apartment','tower'].includes(kind))building(0,0,.9,.8,kind==='tower'?2.3:1.25,kind==='tower'?0x82a7b5:0xd0b79d);
  else{const count=kind==='city'?12:6;box(2.7,.045,2.4,0x759388);for(let i=0;i<count;i++){const x=(i%4-1.5)*.65,z=(Math.floor(i/4)-1)*.7;building(x,z,.44,.42,.45+(i*7%5)*.24,[0xb4c7c5,0xc9b9a4,0x8facb5][i%3]);}box(2.6,.015,.1,0xbfc7b7,0,.05,-.4);}
 }else if(kind==='seed'){sphere(.6,0xaf8651,0,.35,0,.65,.55,1);rod([0,.4,0],[.15,1.1,0],.045,0x7fba79);sphere(.25,0x9bcf85,.28,1.05,0,1,.25,.6);
 }else if(kind==='ant'){
  for(const [i,z]of[-.65,0,.65].entries())sphere(i===0?.23:.36,0x80624d,0,.38,z);
  for(const side of[-1,1]){for(let i=0;i<3;i++){const joint=[side*.5,.32,(i-1)*.6];rod([side*.1,.4,(i-1)*.4],joint,.035,0x6f5845);rod(joint,[side*.75,.04,(i-1)*.8],.027,0x6f5845);}rod([side*.14,.58,-.8],[side*.3,.85,-1.05],.025,0x654d40);rod([side*.3,.85,-1.05],[side*.5,.83,-1.15],.02,0x654d40);sphere(.055,0x252e31,side*.25,.54,-.83);}
 }else if(kind==='flower'){
  rod([0,0,0],[0,1.5,0],.045,0x6f9967);sphere(.22,0xf0cb7b,0,1.5,0);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const petal=sphere(.27,i%2?0xefb0c9:0xda83b1,Math.cos(a)*.36,1.45,Math.sin(a)*.36,1,.3,.7);petal.rotation.y=-a;}
  for(const side of[-1,1]){const leaf=sphere(.3,0x75ac73,side*.23,.65,0,1,.13,.45);leaf.rotation.z=side*.4;rod([0,.5,0],[side*.4,.75,0],.018,0xb0c77d);}
 }else if(['oak','grove'].includes(kind)){
  for(let i=0;i<(kind==='grove'?5:1);i++){const x=kind==='grove'?Math.cos(i*2.4)*.8:0,z=kind==='grove'?Math.sin(i*2.4)*.8:0;rod([x,0,z],[x+.06,1.4,z],.1,0x836b4e);for(let j=0;j<5;j++){const a=j*2.4,tx=x+Math.cos(a)*.4,tz=z+Math.sin(a)*.4;rod([x,1,z],[tx,1.6+j*.07,tz],.04,0x836b4e);sphere(.48,[0x72a37b,0x8bb984,0x5a8d6c][j%3],tx,1.5+j*.1,tz);}}
 }else if(['house','shed'].includes(kind)){
  const h=kind==='shed'?.7:1;
  box(1.3,h,1,kind==='shed'?0xb3af8c:0xd4cba8);const roof=add(new T.ConeGeometry(.98,.55,4),0xb17c62,0,h+.2);roof.rotation.y=Math.PI/4;roof.scale.z=.85;
  box(.15,.4,.15,0xa58773,.35,h,0);box(.23,.48,.025,0x6b685e,0,.02,.51);
  for(const side of[-1,1]){box(.25,.28,.025,0x86bcc9,side*.4,.45,.51);box(.3,.035,.07,0xece0bd,side*.4,.42,.53);box(.025,.28,.25,0x86bcc9,side*.66,.45,-.2);}
  box(1.44,.06,1.15,0xaaa98b);box(.4,.035,.24,0xc2bca6,0,.04,.68);
 }else if(['valley','plateau','lake','icecap'].includes(kind)){
  sphere(1.3,kind==='icecap'?0x689ead:0x86a381,0,.09,0,1,.08,.8);
  if(kind==='plateau'){for(let i=0;i<3;i++){const x=(i-1)*.65;const mesa=add(new T.CylinderGeometry(.4,.57,.55+i*.12,7),0xa9a185,x,.3+i*.06,i%2*.4);mesa.rotation.y=i;add(new T.CylinderGeometry(.42,.43,.07,7),0xc8b897,x,.61+i*.12,i%2*.4);}}
  else if(kind==='icecap'){for(let i=0;i<9;i++){const a=i*2.4;sphere(.55,0xd9e9e1,Math.cos(a)*.6,.18,Math.sin(a)*.5,1,.2,.8);}}
  else{if(kind==='lake')sphere(.8,0x65adbd,0,.22,0,.65,.035,1);else{const points=[];for(let i=0;i<20;i++)points.push(new T.Vector3(Math.sin(i*.3)*.2,.19,(i/19-.5)*2));add(new T.TubeGeometry(new T.CatmullRomCurve3(points),20,.06,5,false),0x65adbd);}for(const side of[-1,1])for(let i=0;i<4;i++){const x=side*(.6+Math.sin(i)*.2),z=(i-1.5)*.55;add(new T.ConeGeometry(.4,.6+i%2*.2,7),0x829b7c,x,.4,z);}}
 }else if(['island','archipelago','continent','landmass'].includes(kind)){
  sphere(1.5,0x659fa9,0,.09,0,1,.06,1);
  const count=kind==='island'?1:kind==='archipelago'?6:9;for(let i=0;i<count;i++){const a=i*2.4,d=kind==='island'?0:Math.sqrt(i/count)*.95,x=Math.cos(a)*d,z=Math.sin(a)*d;sphere(kind==='island'?1:.38,0x8baa78,x,.2,z,1,.18,['continent','landmass'].includes(kind)?1.4:.8);add(new T.ConeGeometry(.22,.55,7),0x8a9c80,x,.42,z);}
 }else if(kind==='pebble'){
  const stone=add(new T.DodecahedronGeometry(.75,1),0x9d9e8b,0,.36);stone.scale.set(1,.55,.75);sphere(.07,0xc9c7ad,.3,.68,.1,1,.2,1);
 }else if(['mountain','hill'].includes(kind)){
  if(kind==='hill'){for(let i=0;i<4;i++)sphere(.65,0x8aa57b,Math.cos(i*2.4)*.5,.15,Math.sin(i*2.4)*.5,1,.6,1);return root;}
  for(let i=0;i<3;i++){const x=(i-1)*.6,z=i%2*.4,h=1.4+i*.3;add(new T.ConeGeometry(.75,h,7),0x899b8b,x,h/2,z);add(new T.ConeGeometry(.22,.45,7),0xe2e2cd,x,h-.18,z);}
 }else if(kind==='system'){
  sphere(.4,0xffcf88,0,.5);for(let i=0;i<3;i++){ring(.75+i*.35,0x7c8eaf,.5);sphere(.12,0x9cbaaa,Math.cos(i*2.4)*(.75+i*.35),.5,Math.sin(i*2.4)*(.75+i*.35));}
 }else if(kind==='starcluster'){
  for(let i=0;i<50;i++){const a=i*2.4,d=Math.sqrt(i/50);add(new T.IcosahedronGeometry(.03+(1-d)*.04,0),i%3?0xa9c3e5:0xf2cea0,Math.cos(a)*d,.3+Math.sin(a*1.3)*d*.3,Math.sin(a)*d);}
 }else if(kind==='nebula'){
  for(let i=0;i<14;i++){const a=i*2.4;sphere(.3,i%2?0x9e8dbb:0x8bb8cc,Math.cos(a)*.7,.35+Math.sin(a*.7)*.15,Math.sin(a)*.7,1,.35,1);}
 }else if(['cluster','supercluster'].includes(kind)){
  for(let i=0;i<(kind==='supercluster'?7:4);i++){const a=i*2.4,d=kind==='supercluster'?1.3:.8;galaxy(Math.cos(a)*d,.3+i%2*.2,Math.sin(a)*d,.45);}
 }else if(['spiral','galaxy'].includes(kind))galaxy();
 else throw new Error('Missing Infinity model: '+kind);
 return root;
}
