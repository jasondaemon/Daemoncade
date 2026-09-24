import * as THREE from '../../vendor/three/three.module.min.js';
import {mergeGeometries} from '../../vendor/three/addons/utils/BufferGeometryUtils.js';
import {TABLE,segments,clamp} from './table.js?v=1.0.0-beta.3';
import {RADIUS} from './physics.js?v=1.0.0-beta.3';
const C={navy:0x122c39,cyan:0x49e0de,orange:0xff914d,cream:0xf7e9c7,metal:0xbac8ce};
const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
export class TableScene{
 constructor(canvas,physics){
  this.physics=physics;this.canvas=canvas;this.time=0;this.balls=new Map();this.bumperParts=[];this.targetParts=[];this.flipperParts=[];this.flashes=[];this.pulses=new Map();this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
  this.scene=new THREE.Scene();this.scene.scale.x=-1;this.camera=new THREE.OrthographicCamera(-6,6,11,-11,.1,100);this.camera.position.set(0,35,4);this.camera.lookAt(0,0,10);
  const hemi=new THREE.HemisphereLight(0xd6efff,0x32374a,2.2);this.scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffe9ca,3);key.position.set(-8,18,8);key.target.position.set(0,0,10);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-8,right:8,top:14,bottom:-14,near:.1,far:40});key.shadow.bias=-.001;this.scene.add(key,key.target);
  const fill=new THREE.DirectionalLight(0x71d8ed,1.5);fill.position.set(8,7,17);this.scene.add(fill);
  const envCanvas=document.createElement('canvas');envCanvas.width=256;envCanvas.height=128;const ec=envCanvas.getContext('2d');const gradient=ec.createLinearGradient(0,0,0,128);gradient.addColorStop(0,'#c8dcdf');gradient.addColorStop(.4,'#315266');gradient.addColorStop(.49,'#ffffff');gradient.addColorStop(.54,'#182838');gradient.addColorStop(1,'#080c12');ec.fillStyle=gradient;ec.fillRect(0,0,256,128);ec.fillStyle='#fff';ec.fillRect(38,20,18,65);ec.fillRect(176,25,12,35);
  const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;const pm=new THREE.PMREMGenerator(this.renderer);this.environment=pm.fromEquirectangular(env);this.scene.environment=this.environment.texture;pm.dispose();env.dispose();
  this.materials={metal:this.mat(C.metal,.22,.9),dark:this.mat(C.navy,.6,.35),rubber:this.mat(0xddd4b4,.82),orange:this.mat(C.orange,.33,.15),cyan:this.mat(C.cyan,.3,.2),cream:this.mat(C.cream,.5,.1),black:this.mat(0x0b131b,.85),ball:this.mat(0xdde8ed,.12,1)};
  this.build();this.batchStaticMeshes();this.resize();
 }
 mat(color,roughness=.4,metalness=.2,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});}
 mesh(geo,mat,x=0,y=0,z=0,parent=this.scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(w,h,d,mat,x,y,z,parent){return this.mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);}
 cylinder(r,h,mat,x,y,z,parent){return this.mesh(new THREE.CylinderGeometry(r,r,h,32),mat,x,y,z,parent);}
 rod(a,b,r,mat,parent=this.scene){const dir=b.clone().sub(a);const m=this.mesh(new THREE.CylinderGeometry(r,r,dir.length(),10),mat,...a.clone().add(b).multiplyScalar(.5).toArray(),parent);m.quaternion.setFromUnitVectors(v3(0,1,0),dir.normalize());return m;}
 floorGeometry(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-5,0,0,5,0,0,-5,0,20,5,0,20],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));g.setIndex([0,2,1,1,2,3]);g.computeVertexNormals();return g;}
 build(){
  const M=this.materials;
  this.box(10.5,.65,20.7,M.black,0,-.45,10);
  this.box(.35,.95,20.6,M.dark,-5.16,.05,10);this.box(.35,.95,20.6,M.dark,5.16,.05,10);
  this.box(10.4,.8,.3,M.dark,0,.03,20.2);this.box(10.4,.8,.3,M.dark,0,.03,-.2);
  for(const x of [-5.15,5.15]){this.rod(v3(x,.56,0),v3(x,.56,20.2),.055,M.metal);for(let z=1;z<20;z+=2)this.cylinder(.06,.025,M.metal,x,.56,z);}
  this.playfieldMat=this.mat(0xffffff,.64,.05);
  const fallback=this.paint(false);this.playfieldMat.map=fallback;
  this.mesh(this.floorGeometry(),this.playfieldMat,0,0,0);
  new THREE.TextureLoader().load('./assets/midnight-playfield.webp',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;this.playfieldMat.map=texture;this.playfieldMat.needsUpdate=true;fallback.dispose();},undefined,()=>{});
  this.mesh(this.floorGeometry(),new THREE.MeshBasicMaterial({map:this.paint(true),transparent:true,depthWrite:false}),0,.018,0);
  for(const path of TABLE.rails)for(const [a,b]of segments(path)){
    this.rod(v3(a[0],.48,a[1]),v3(b[0],.48,b[1]),.085,M.metal);
    this.rod(v3(a[0],.16,a[1]),v3(b[0],.16,b[1]),.065,M.rubber);
    const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.3);for(let i=0;i<=n;i++)this.cylinder(.09,.48,M.dark,a[0]+(b[0]-a[0])*i/n,.24,a[1]+(b[1]-a[1])*i/n);
  }
  TABLE.slings.forEach((path,i)=>{
    const s=new THREE.Shape(path.map(p=>new THREE.Vector2(p[0],-p[1])));const g=new THREE.ExtrudeGeometry(s,{depth:.13,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.06,bevelThickness:.04});g.rotateX(-Math.PI/2);
    const cap=this.mesh(g,M.dark,0,.38,0);cap.userData.sling=i;
    for(const [a,b]of segments([...path,path[0]])){this.rod(v3(a[0],.23,a[1]),v3(b[0],.23,b[1]),.09,M.rubber);this.rod(v3(a[0],.56,a[1]),v3(b[0],.56,b[1]),.025,M.orange);}
    path.forEach(p=>this.cylinder(.055,.03,M.metal,p[0],.58,p[1]));
  });
  TABLE.bumpers.forEach((p,i)=>{
    this.cylinder(.69,.12,M.metal,p.x,.08,p.z);this.cylinder(.59,.37,M.rubber,p.x,.31,p.z);
    const ring=this.cylinder(.66,.1,this.mat(C.orange,.3,.2,{emissive:C.orange,emissiveIntensity:.3}),p.x,.49,p.z);
    const cap=this.cylinder(.59,.16,this.mat(i===1?C.cyan:C.cream,.3,.2,{emissive:i===1?C.cyan:C.orange,emissiveIntensity:0}),p.x,.66,p.z);
    this.cylinder(.35,.03,M.dark,p.x,.755,p.z);this.cylinder(.26,.035,M.orange,p.x,.78,p.z);
    const light=new THREE.PointLight(C.orange,0,2.5,2);light.position.set(p.x,1.1,p.z);this.scene.add(light);
    this.bumperParts.push({cap,ring,light});
  });
  TABLE.targets.forEach(p=>{
    this.box(.52,.15,.3,M.metal,p.x,.08,p.z);
    const target=this.box(.5,.7,.24,this.mat(C.cream,.4,.1,{emissive:C.orange,emissiveIntensity:0}),p.x,.43,p.z);this.targetParts.push(target);
  });
  TABLE.flippers.forEach(p=>{
    const group=new THREE.Group();this.scene.add(group);
    const shape=new THREE.Shape();shape.moveTo(-.22,-.23);shape.lineTo(1.98,-.16);shape.quadraticCurveTo(2.23,0,1.98,.16);shape.lineTo(-.22,.23);shape.quadraticCurveTo(-.25,0,-.22,-.23);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.25,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1});geo.rotateX(-Math.PI/2);
    const rubber=this.mesh(geo,M.rubber,0,-.12,0,group);rubber.scale.x=p.side;
    const top=this.mesh(geo,M.orange,0,-.05,0,group);top.scale.set(p.side*.92,.85,.7);
    this.cylinder(.12,.03,M.metal,0,.24,0,group);this.flipperParts.push(group);
  });
  for(const rampMesh of this.physics.rampMeshes){
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rampMesh.vertices,3));rg.setIndex(rampMesh.indices);rg.computeVertexNormals();
  const ramp=this.mesh(rg,this.mat(0x298b99,.22,.3,{side:THREE.DoubleSide,transparent:true,opacity:.38,depthWrite:false}),0,.02,0);ramp.castShadow=false;
  const rv=rampMesh.vertices;
  for(let i=1;i<rampMesh.path.length;i++)for(const edge of [0,1]){
    const a=(i-1)*6+edge*3,b=i*6+edge*3;
    this.rod(v3(rv[a],rv[a+1]+.22,rv[a+2]),v3(rv[b],rv[b+1]+.22,rv[b+2]),.042,M.metal);
    this.rod(v3(rv[a],rv[a+1]+.51,rv[a+2]),v3(rv[b],rv[b+1]+.51,rv[b+2]),.035,M.metal);
    if(i%4===0)this.rod(v3(rv[b],rv[b+1]+.08,rv[b+2]),v3(rv[b],rv[b+1]+.51,rv[b+2]),.027,M.metal);
    this.rod(v3(rv[a],rv[a+1]+.065,rv[a+2]),v3(rv[b],rv[b+1]+.065,rv[b+2]),.022,M.cyan);
    if(i%3===0)this.cylinder(.055,rv[b+1],M.metal,rv[b],rv[b+1]/2,rv[b+2]);
  }
  }
  for(const support of this.physics.rampSupports){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(support.vertices,3));g.setIndex(support.indices);g.computeVertexNormals();this.mesh(g,M.dark);}
  const ms=TABLE.modeScoop;this.cylinder(.5,.05,M.metal,ms.x,.04,ms.z);this.cylinder(.37,.06,M.black,ms.x,.075,ms.z);
  const sp=TABLE.spinner;for(const dx of [-.45,.45])this.rod(v3(sp.x+dx,0,sp.z),v3(sp.x+dx,1,sp.z),.045,M.metal);
  this.rod(v3(sp.x-.45,.9,sp.z),v3(sp.x+.45,.9,sp.z),.035,M.metal);this.spinner=this.box(.62,.55,.055,M.orange,sp.x,.75,sp.z);
  this.rolloverLamps=TABLE.rollovers.map(p=>{this.rod(v3(p.x-.3,.07,p.z),v3(p.x+.3,.07,p.z),.035,M.metal);return this.cylinder(.13,.035,this.mat(C.cyan,.3,.1,{emissive:C.cyan}),p.x,.025,p.z-.35);});
  this.shotArrows=[[1.8,8.5],[-1.95,9.5],[0,11.1],[2.7,15.6],[-4.2,11.5]].map(([x,z])=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.17,0,-.2,.17,0,-.2,0,0,.24],3));g.setIndex([0,2,1]);g.computeVertexNormals();return this.mesh(g,this.mat(C.cyan,.4,.1,{emissive:C.cyan,emissiveIntensity:.4}),x,.035,z);});
  const scoop=TABLE.scoop;this.cylinder(.55,.05,M.metal,scoop.x,.04,scoop.z);this.cylinder(.42,.06,M.black,scoop.x,.07,scoop.z);
  this.lockLamp=this.cylinder(.16,.035,this.mat(C.orange,.4,.1,{emissive:C.orange,emissiveIntensity:.1}),scoop.x,.03,scoop.z-.85);
  this.missionLamps=Array.from({length:3},(_,i)=>this.cylinder(.125,.025,this.mat(C.cyan,.4,.1,{emissive:C.cyan,emissiveIntensity:.05}),-.9+i*.85,.025,9.9));
  // Garage marquee: a physical toy with a visible open doorway.
  this.box(1.4,.15,.8,M.orange,scoop.x,1.05,scoop.z+.3);
  for(const dx of [-.65,.65])this.box(.12,1,.65,M.dark,scoop.x+dx,.5,scoop.z+.35);
  this.box(1.25,.9,.08,M.dark,scoop.x,.5,scoop.z+.72);
  for(let i=0;i<4;i++)this.box(.9,.025,.025,M.metal,scoop.x,.45+i*.12,scoop.z+.67);
  this.plunger=this.cylinder(.19,.65,M.metal,4.16,.26,.75);this.plunger.rotation.x=Math.PI/2;
  this.box(.5,.15,.25,M.orange,4.16,.3,.55);
 }
 paint(overlay){
  const c=document.createElement('canvas');c.width=1024;c.height=2048;const ctx=c.getContext('2d');const X=x=>(x+5)*102.4,Y=z=>(20-z)*102.4;
  if(!overlay){ctx.fillStyle='#102b3b';ctx.fillRect(0,0,1024,2048);ctx.strokeStyle='#235569';ctx.lineWidth=2;for(let i=-1000;i<2000;i+=120){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+900,2048);ctx.stroke();}}
  else{
    const line=(points,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1])));ctx.stroke();};
    line([[-4.2,3],[-4.3,16.8],[-3.5,18.8],[1.8,19],[3.2,18]],'#e7c98b',3);
    for(const [x,z]of [[0,9],[1.35,10],[-1.55,11.2]]){ctx.fillStyle='#e3e1b9';ctx.beginPath();ctx.moveTo(X(x),Y(z+.35));ctx.lineTo(X(x-.15),Y(z));ctx.lineTo(X(x+.15),Y(z));ctx.fill();}
    const text=(s,x,z,size,color='#f2e5c9')=>{ctx.save();ctx.translate(X(x),Y(z));ctx.fillStyle=color;ctx.textAlign='center';ctx.font=`900 ${size}px sans-serif`;ctx.fillText(s,0,0);ctx.restore();};
    text('MIDNIGHT',-.1,7.7,52);text('RUN',-.1,6.9,66,'#ff9659');text('HIGHWAY',1.8,8.8,18,'#88e8e1');text('SKYWAY',-1.95,9.8,18,'#ffad6f');text('GARAGE',0,11.1,21,'#ffad6f');text('PIT STOP',-3.9,8.65,17);text('REDLINE',2.7,16.4,17);
    text('CITY CIRCUIT',-.15,18.9,25);text('LOCK • 3 BALL PURSUIT',0,5.5,19,'#a4caca');
    for(let i=0;i<3;i++){ctx.strokeStyle='#a7c6ba';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(-.9+i*.85),Y(9.9),18,0,Math.PI*2);ctx.stroke();text(String(i+1),-.9+i*.85,9.84,19);}
    for(let i=0;i<13;i++)for(let j=0;j<2;j++){ctx.fillStyle=(i+j)%2?'#102e37':'#d5d8be';ctx.fillRect(X(-2.5)+i*37,Y(1.5)+j*24,37,24);}
    text('MIDNIGHT MOTOR CLUB',0,.7,22,'#94aeaa');
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
 }
 batchStaticMeshes(){
  const moving=new Set([this.spinner,...this.shotArrows,...this.rolloverLamps,this.plunger,this.lockLamp,...this.missionLamps,...this.targetParts,...this.bumperParts.flatMap(b=>[b.cap,b.ring])]);
  const groups=new Map();
  for(const m of this.scene.children){
    if(!m.isMesh||moving.has(m))continue;
    const key=[m.material.uuid,m.castShadow,m.receiveShadow].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
  }
  for(const meshes of groups.values()){
    if(meshes.length<2)continue;
    const geometries=meshes.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));g.applyMatrix4(m.matrix);return g;});
    const combined=mergeGeometries(geometries);if(!combined){geometries.forEach(g=>g.dispose());continue;}
    const m=this.mesh(combined,meshes[0].material);m.castShadow=meshes[0].castShadow;m.receiveShadow=meshes[0].receiveShadow;
    for(const old of meshes){this.scene.remove(old);old.geometry.dispose();}geometries.forEach(g=>g.dispose());
  }
 }
 pulse(type,id){this.pulses.set(`${type}:${id}`,this.time);}
 resize(){const {width,height}=this.canvas.getBoundingClientRect();if(width<1||height<1)return;this.renderer.setSize(width,height,false);const a=width/height,h=Math.max(20.6,10.65/a);Object.assign(this.camera,{left:-h*a/2,right:h*a/2,top:h/2,bottom:-h/2});this.camera.updateProjectionMatrix();}
 render(time,alpha,rules,charge=0){
  this.time=time;const ids=new Set(this.physics.balls.map(b=>b.id));for(const [id,mesh]of this.balls)if(!ids.has(id)){this.scene.remove(mesh);mesh.geometry.dispose();this.balls.delete(id);}
  for(const b of this.physics.balls){let m=this.balls.get(b.id);if(!m){m=this.mesh(new THREE.SphereGeometry(RADIUS,20,14),this.materials.ball);this.balls.set(b.id,m);}const p=b.body.translation();m.position.set(b.previous.x+(p.x-b.previous.x)*alpha,b.previous.y+(p.y-b.previous.y)*alpha,b.previous.z+(p.z-b.previous.z)*alpha);m.quaternion.copy(b.body.rotation());}
  this.physics.flippers.forEach((f,i)=>{this.flipperParts[i].position.copy(f.body.translation());this.flipperParts[i].quaternion.copy(f.body.rotation());});
  this.bumperParts.forEach((b,i)=>{const k=Math.max(0,1-(time-(this.pulses.get(`bumper:${i}`)??-10))/.18);b.cap.position.y=.66-k*.065;b.ring.material.emissiveIntensity=.3+k*2;b.cap.material.emissiveIntensity=k*.7;b.light.intensity=this.reduced?0:k*8;});
  this.targetParts.forEach((m,i)=>{m.material.emissiveIntensity=rules.targets[i]?1.1:.05;m.position.y=rules.lockLit||rules.multiball?-.4:.43;});
  this.shotArrows.forEach((m,i)=>{const lit=rules.multiball||i===2&&rules.lockLit||rules.mode==='redline'&&i===3||rules.mode==='combos'&&i<2;m.material.emissiveIntensity=lit?1.1+(this.reduced?0:Math.sin(time*5)*.4):.2;});
  this.spinner.rotation.x=time< (this.pulses.get('spinner:undefined')??-10)+2?time*28:0;
  this.rolloverLamps.forEach((m,i)=>m.material.emissiveIntensity=rules.rollovers?.[i]?1.8:.08);
  this.lockLamp.material.emissiveIntensity=rules.lockLit?1.4+Math.sin(time*7)*.5:.05;
  this.missionLamps.forEach((m,i)=>{m.material.emissiveIntensity=rules.missions[i]?1.5:.03;});
  this.plunger.position.z=.75-charge*.4;this.renderer.render(this.scene,this.camera);
 }
 dispose(){const mats=new Set(),textures=new Set();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});for(const m of mats){if(m.map)textures.add(m.map);m.dispose();}for(const t of textures)t.dispose();this.environment.dispose();this.renderer.dispose();}
}
