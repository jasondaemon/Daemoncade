import * as THREE from "../vendor/three/three.module.min.js";
import {GLTFLoader} from "../vendor/three/addons/loaders/GLTFLoader.js";

const $=id=>document.getElementById(id), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const SAVE="daemoncade_blitz_v3", PLAYER_Z=1.5;
const MODES={easy:{speed:4.8,hp:.78,boss:170},normal:{speed:5.35,hp:1,boss:230},hard:{speed:5.75,hp:1.2,boss:300}};
const WEAPONS={
  rifle:{label:"RIFLE",rate:.24,damage:1,speed:39,range:48,color:0xffe978,streams:0},
  machine:{label:"MACHINE GUN",rate:.11,damage:.72,speed:44,range:52,color:0x8deaff,streams:1},
  flame:{label:"FLAMER",rate:.09,damage:.8,speed:25,range:20,color:0xff7b2c,streams:2,spread:.55},
  rocket:{label:"ROCKETS",rate:.7,damage:13,speed:31,range:58,color:0xffd247,streams:-2,splash:4.2},
};
let mode=localStorage.getItem(SAVE+"_difficulty")||"normal", soundOn=localStorage.getItem(SAVE+"_sound")!=="off", audio;

function tone(freq,d=.06,type="square",vol=.03,slide=0){
  if(!soundOn)return;
  try{audio||=new(window.AudioContext||window.webkitAudioContext)();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(35,freq+slide),t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+d)}catch{}
}
function overlay(title,copy,button,eyebrow="Daemoncade Rapid Response"){
  $("overlay-title").textContent=title;$("overlay-copy").innerHTML=copy;$("start").textContent=button;$("eyebrow").textContent=eyebrow;
  $("mode-picker").hidden=title!=="BLITZ!";$("overlay").hidden=false;
}

class Blitz{
  constructor(host){
    this.host=host;this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;host.append(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x62a9c1);this.scene.fog=new THREE.Fog(0x8fc5d3,46,145);
    this.camera=new THREE.PerspectiveCamera(43,9/16,.1,180);this.camera.position.set(0,8.7,16);this.camera.lookAt(0,.2,-24);
    this.lastFrame=performance.now();this.state="title";this.keys=new Set();this.objects=[];this.bullets=[];this.enemyBullets=[];this.particles=[];this.tiles=[];this.props=[];this.units=[];this.mixers=[];this.assetTemplates=new Map();
    this.targetX=0;this.playerX=0;this.token=0;this.buildWorld();this.ready=this.loadAssets();this.bind();this.resize();new ResizeObserver(()=>this.resize()).observe(host);
    this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
  }
  mat(c,r=.72,m=.06){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})}
  box(w,h,d,mat,x=0,y=0,z=0){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);q.position.set(x,y,z);q.castShadow=q.receiveShadow=true;return q}
  async loadAssets(){
    const gltf=new GLTFLoader(),base="assets/models/";
    const scenery=["building-a","building-f","building-j","detail-tank-large","shipping-container-a","shipping-container-b","water-tower","chimney-large"];
    const jobs=scenery.map(async name=>{const model=(await gltf.loadAsync(`${base}industrial/${name}.glb`)).scene;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});this.assetTemplates.set(name,model)});
    try{await Promise.all(jobs);this.populateIndustrialWorld();$("start").textContent="DEPLOY"}catch(error){console.warn("Blitz asset fallback active",error);$("start").textContent="DEPLOY"}
  }
  fittedAsset(name,height){
    const source=this.assetTemplates.get(name);if(!source)return null;const model=source.clone(true),box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);model.scale.setScalar(height/Math.max(.001,size.y));box.setFromObject(model);const center=new THREE.Vector3();box.getCenter(center);model.position.set(-center.x,-box.min.y,-center.z);return model;
  }
  populateIndustrialWorld(){
    const layouts=[
      ["building-a",8.5,8.2,0],["building-f",7.5,-9.2,-18],["detail-tank-large",4.5,9.1,-38],["building-j",7,-8.5,-57],
      ["water-tower",7.5,9.8,-77],["chimney-large",8,-9.2,-97],["building-f",7,9,-117],["building-a",8,-9,-139],
      ["detail-tank-large",4.8,9,-158],["building-j",7.2,-9,-179],["water-tower",7.7,9.5,-199]
    ];
    for(const [name,height,x,z] of layouts){const g=new THREE.Group(),model=this.fittedAsset(name,height);if(!model)continue;g.add(model);if(x<0)g.rotation.y=Math.PI;const bounds=new THREE.Box3().setFromObject(g),size=new THREE.Vector3();bounds.getSize(size);const side=Math.sign(x)||1;g.position.set(side*(6.65+size.x/2+.55),0,z);this.scene.add(g);this.props.push(g)}
    for(let i=0;i<10;i++){const name=i%2?"shipping-container-a":"shipping-container-b",g=new THREE.Group(),model=this.fittedAsset(name,1.7);if(!model)continue;g.add(model);g.rotation.y=i%2?Math.PI/2:-Math.PI/2;const bounds=new THREE.Box3().setFromObject(g),size=new THREE.Vector3();bounds.getSize(size);const side=i%2?1:-1;g.position.set(side*(6.65+size.x/2+.45+(i%3)*.65),0,3-i*19);this.scene.add(g);this.props.push(g)}
  }
  buildWorld(){
    this.scene.add(new THREE.HemisphereLight(0xe8fbff,0x183b49,2.3));
    const sun=new THREE.DirectionalLight(0xffedca,3.2);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-10;this.scene.add(sun);
    const water=new THREE.Mesh(new THREE.PlaneGeometry(70,240),this.mat(0x12657e,.35,.2));water.rotation.x=-Math.PI/2;water.position.set(0,-.35,-80);this.scene.add(water);
    const skyline=new THREE.Group(),city=this.mat(0x506e79,.95,0);for(let i=0;i<18;i++){const side=i%2?1:-1,w=2+Math.random()*3,h=2+Math.random()*5;skyline.add(this.box(w,h,3+Math.random()*4,city,side*(8+Math.random()*16),h/2,-108-Math.random()*12))}this.scene.add(skyline);
    const road=this.mat(0x69767b,.94,0), curb=this.mat(0xd2d8da,.8,.05), yellow=new THREE.MeshBasicMaterial({color:0xe9c94e}), white=new THREE.MeshBasicMaterial({color:0xdce6e7});
    for(let i=0;i<9;i++){const g=new THREE.Group();g.add(this.box(11.8,.35,22,road));g.add(this.box(.14,.03,22,yellow,-4.75,.2,0),this.box(.14,.03,22,yellow,4.75,.2,0));g.add(this.box(.48,.72,22,curb,-6.05,.2,0),this.box(.48,.72,22,curb,6.05,.2,0));for(let z=-8;z<=8;z+=6)for(const x of[-1.9,1.9])g.add(this.box(.09,.03,2.7,white,x,.2,z));g.position.z=13-i*22;this.scene.add(g);this.tiles.push(g)}
    for(let i=0;i<22;i++){const side=i%2?1:-1,g=new THREE.Group();if(i%4===0){const pole=this.mat(0x283c44,.5,.5);g.add(this.box(.22,3.4,.22,pole,0,1.7,0));const lamp=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),new THREE.MeshBasicMaterial({color:0x7aeeff}));lamp.position.y=3.45;g.add(lamp)}else{const colors=[0xb64b32,0x347a9a,0x6a8145],c=this.mat(colors[i%3],.8,.05);g.add(this.box(4,.32,5,this.mat(0x66747a,.9,.05),0,-.03,0));g.add(this.box(2.5,1.4,3.3,c,0,.7,0));for(let x=-1;x<=1;x+=.5)g.add(this.box(.045,1.24,3.34,this.mat(0x2d4148,.65,.35),x,.72,0))}g.position.set(side*(8.3+i%3*1.8),0,8-Math.floor(i/2)*18);this.scene.add(g);this.props.push(g)}
    this.squad=new THREE.Group();this.squad.position.set(0,.18,PLAYER_Z);this.scene.add(this.squad);
    this.shadow=new THREE.Mesh(new THREE.CircleGeometry(2.2,24),new THREE.MeshBasicMaterial({color:0x061018,transparent:true,opacity:.3,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.position.set(0,.21,PLAYER_Z+.65);this.scene.add(this.shadow);
  }
  soldier(team="blue"){
    const g=new THREE.Group(),blue=team==="blue",u=this.mat(blue?0x1675d1:0xb92e42,.56,.1),dark=this.mat(blue?0x123a63:0x581923,.7,.14),skin=this.mat(0xf0b487,.75,0);
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.42,3,7),u);body.position.y=.78;body.castShadow=true;g.add(body,this.box(.5,.28,.3,dark,0,.9,.02),this.box(.38,.42,.2,dark,0,.78,.2));
    const head=new THREE.Mesh(new THREE.SphereGeometry(.2,9,7),skin);head.position.y=1.27;head.castShadow=true;g.add(head);
    const helmet=new THREE.Mesh(new THREE.SphereGeometry(.235,9,6,0,Math.PI*2,0,Math.PI*.62),dark);helmet.position.y=1.32;const visor=this.box(.27,.09,.08,this.mat(blue?0x7eeaff:0xff9b72,.25,.4),0,1.28,-.185);g.add(helmet,visor);
    const gun=this.box(.1,.11,.72,this.mat(0x20272b,.35,.7),.25,.82,-.36);g.add(gun);const muzzle=this.box(.14,.14,.12,new THREE.MeshStandardMaterial({color:0x20272b,emissive:0xffc84a,emissiveIntensity:0}),.25,.82,-.75);g.add(muzzle);const limbs=[];
    for(const s of[-1,1]){const arm=this.box(.11,.45,.11,u,s*.28,.82,-.06);arm.geometry.translate(0,-.18,0);const leg=this.box(.13,.5,.14,dark,s*.13,.4,0);leg.geometry.translate(0,-.2,0);g.add(arm,leg);limbs.push(arm,leg)}
    g.userData={limbs,gun,muzzle,phase:Math.random()*6.28};g.scale.setScalar(.76);return g;
  }
  positions(n){const a=[];for(let i=0;i<n;i++){const r=Math.floor(Math.sqrt(i)),w=r*2+1,j=i-r*r;a.push({x:(j-(w-1)/2)*.62,z:-r*.58})}return a}
  setForce(immediate=false){
    const n=clamp(Math.floor(this.force),1,36);while(this.units.length<n){const u=this.soldier();u.scale.setScalar(.01);this.squad.add(u);this.units.push(u)}
    while(this.units.length>n)this.squad.remove(this.units.pop());const p=this.positions(n);
    this.units.forEach((u,i)=>{u.userData.tx=p[i].x;u.userData.tz=p[i].z;if(immediate){u.position.set(p[i].x,0,p[i].z);u.scale.setScalar(.76)}});this.updateWeaponModels();$("force").textContent=Math.max(0,Math.floor(this.force));
  }
  updateWeaponModels(){const type=this.weapon||"rifle",color=WEAPONS[type].color;this.units.forEach((u,i)=>{const gun=u.userData.gun;if(!gun)return;gun.material.color.setHex(type==="rifle"?0x20272b:color);gun.scale.set(type==="rocket"&&i<2?2.4:type==="machine"?1.5:type==="flame"?1.25:1,type==="rocket"&&i<2?2:1,type==="rocket"&&i<2?1.8:type==="machine"?1.45:1);u.userData.muzzle?.material.emissive.setHex(color)})}
  label(text,bg){
    const c=document.createElement("canvas");c.width=384;c.height=170;const x=c.getContext("2d");x.fillStyle=bg;x.fillRect(8,8,368,154);x.strokeStyle="#eafcff";x.lineWidth=8;x.strokeRect(12,12,360,146);x.fillStyle="#fff";const size=text.length>9?43:text.length>6?55:76;x.font=`900 ${size}px Arial`;x.textAlign="center";x.textBaseline="middle";x.fillText(text,192,83);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide});
  }
  badge(text,bg="#b7273d"){
    const c=document.createElement("canvas");c.width=192;c.height=96;const x=c.getContext("2d"),t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(1.8,.9,1);s.userData={canvas:c,ctx:x,bg};this.setBadge(s,text);return s;
  }
  setBadge(s,text){const{canvas:c,ctx:x,bg}=s.userData;x.clearRect(0,0,c.width,c.height);x.fillStyle=bg;x.beginPath();x.roundRect(8,8,176,80,24);x.fill();x.strokeStyle="#fff";x.lineWidth=6;x.stroke();x.fillStyle="#fff";x.font="900 48px Arial";x.textAlign="center";x.textBaseline="middle";x.fillText(String(text),96,49);s.material.map.needsUpdate=true}
  gate(x,data,z){
    const g=new THREE.Group(),color=data.type==="multiply"?0x35d27e:data.type==="power"?0xa768ff:0x168ce5,frame=this.mat(color,.32,.48);
    g.add(this.box(.22,3.2,.25,frame,-1.5,1.6,0),this.box(.22,3.2,.25,frame,1.5,1.6,0),this.box(3.2,.24,.25,frame,0,3.12,0));
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.75,1.2),this.label(data.label,data.type==="multiply"?"#147348":data.type==="power"?"#61389d":"#1168ad"));sign.position.set(0,2.1,.04);g.add(sign);
    const glow=new THREE.PointLight(color,3,7);glow.position.set(0,2,.5);g.add(glow);const lights=[];for(let i=0;i<5;i++){const m=new THREE.MeshStandardMaterial({color:0x17242a,emissive:color,emissiveIntensity:.05}),q=this.box(.42,.12,.14,m,-1.02+i*.51,1.25,.16);g.add(q);lights.push(q)}g.position.set(x,.2,z);this.scene.add(g);return{...data,group:g,sign,glow,lights,x,z,charge:0,radius:1.55};
  }
  gates(z,left,right){this.objects.push({kind:"gates",z,gates:[this.gate(-2.55,left,z),this.gate(2.55,right,z)]})}
  crate(z,x,reward){
    const g=new THREE.Group(),orange=this.mat(0xc77923,.75,.08),steel=this.mat(0x4e3925,.55,.35);g.add(this.box(2.3,2.1,2,orange,0,1.05,0));g.add(this.box(2.38,.18,2.08,steel,0,.35,0),this.box(2.38,.18,2.08,steel,0,1.75,0),this.box(.18,2.15,2.08,steel,0,1.05,0));const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.68),this.label("+"+reward,"#974a12"));sign.position.set(0,1.12,1.02);g.add(sign);g.position.set(x,.2,z);this.scene.add(g);this.objects.push({kind:"crate",group:g,x,z,hp:28,maxHp:28,reward,radius:1.25});
  }
  weaponCrate(z,x,type){
    const data=WEAPONS[type],g=new THREE.Group(),colors={machine:0x168fd1,flame:0xe95b22,rocket:0x6a9b3d},body=this.mat(colors[type],.48,.24),steel=this.mat(0x202b31,.42,.58);
    g.add(this.box(2.5,1.8,2,body,0,.9,0),this.box(2.62,.2,2.12,steel,0,.15,0),this.box(2.62,.2,2.12,steel,0,1.65,0));
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.82),this.label(data.label,`#${colors[type].toString(16).padStart(6,"0")}`));sign.position.set(0,.98,1.03);g.add(sign);
    const beacon=new THREE.PointLight(colors[type],4,8);beacon.position.set(0,2.1,0);g.add(beacon);g.position.set(x,.2,z);this.scene.add(g);
    this.objects.push({kind:"weapon",group:g,x,z,type,hp:22,maxHp:22,radius:1.4,beacon});
  }
  enemy(z,x,count){
    const g=new THREE.Group(),n=Math.min(count,28),units=[],p=this.positions(n);p.forEach(q=>{const u=this.soldier("red");u.position.set(q.x,0,q.z);g.add(u);units.push(u)});const badge=this.badge(count);badge.position.set(0,2.3,-.4);g.add(badge);g.position.set(x,.18,z);this.scene.add(g);const hp=count*3.2*MODES[mode].hp;this.objects.push({kind:"enemy",group:g,x,z,count,hp,maxHp:hp,units,badge,visible:n,radius:1.3+Math.sqrt(n)*.2,fire:.28});
  }
  barrier(z){
    const g=new THREE.Group(),con=this.mat(0x707d82,.9,.03),red=this.mat(0xd94a3d,.65,.1);for(let i=-2;i<=2;i++)g.add(this.box(1,1.05,.7,i%2?red:con,i*1.02,.52,0));g.position.set(-2.8,.2,z);this.scene.add(g);this.objects.push({kind:"obstacle",group:g,x:-2.8,z,radius:2.6});
  }
  boss(z){
    const g=new THREE.Group(),wall=this.mat(0x46525a,.72,.22),red=this.mat(0xb72d3e,.48,.35),black=this.mat(0x171e22,.38,.7);for(let x=-5;x<=5;x++){const h=Math.abs(x)>3?4.1:2.8;g.add(this.box(.95,h,1.6,wall,x,h/2,0))}g.add(this.box(3.5,.78,1.72,red,0,2.86,0),this.box(2.2,.22,1.82,black,0,2.15,0));for(const x of[-4.25,4.25]){const turret=new THREE.Group();turret.add(this.box(1.15,.82,1.2,red,0,0,0),this.box(.18,.18,2.4,black,0,.12,-1.25));const eye=new THREE.PointLight(0xff253c,8,11);eye.position.set(0,.2,-1.4);turret.add(eye);turret.position.set(x,4.15,0);g.add(turret)}for(const x of[-2.3,2.3]){const beam=new THREE.Mesh(new THREE.CylinderGeometry(.028,.12,8,6),new THREE.MeshBasicMaterial({color:0xff304e,transparent:true,opacity:.28,depthWrite:false}));beam.rotation.x=Math.PI/2;beam.position.set(x,2.45,-4);g.add(beam)}const badge=this.badge(MODES[mode].boss,"#7e1526");badge.scale.set(2.7,1.35,1);badge.position.set(0,5.45,0);g.add(badge);g.position.set(0,.2,z);this.scene.add(g);const hp=MODES[mode].boss;this.objects.push({kind:"boss",group:g,x:0,z,hp,maxHp:hp,badge,radius:5,announced:false});
  }
  mission(){
    this.gates(-34,{label:"+8",type:"force",value:8},{label:"+14",type:"force",value:14});this.weaponCrate(-55,-2.5,"machine");this.enemy(-75,1.8,11);this.crate(-95,2.4,8);this.barrier(-112);
    this.weaponCrate(-128,-2.4,"flame");this.gates(-146,{label:"×1.5",type:"multiply",value:1.5},{label:"+18",type:"force",value:18});this.enemy(-168,-1.5,19);this.weaponCrate(-187,2.5,"rocket");this.crate(-202,-2.3,12);this.enemy(-220,.8,26);this.boss(-258);
  }
  clear(){
    for(const o of this.objects)o.kind==="gates"?o.gates.forEach(g=>this.scene.remove(g.group)):this.scene.remove(o.group);for(const b of[...this.bullets,...this.enemyBullets])this.scene.remove(b.mesh);for(const p of this.particles)this.scene.remove(p.mesh);this.objects=[];this.bullets=[];this.enemyBullets=[];this.particles=[];
  }
  async start(){
    if(this.state==="playing"||this.state==="loading")return;this.state="loading";$("start").textContent="MOBILIZING…";await this.ready;this.clear();this.state="playing";this.force=12;this.weapon="rifle";this.score=0;this.zone=this.lastZone=1;this.distance=0;this.nextShot=0;this.targetX=this.playerX=0;this.squad.position.x=0;this.setForce(true);this.mission();this.hud();$("overlay").hidden=true;this.banner("SQUAD DEPLOYED","good");tone(310,.1,"square",.05,350);
  }
  bind(){
    addEventListener("keydown",e=>{this.keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==="p")this.pause();if((e.key===" "||e.key==="Enter")&&this.state==="title")this.start()});addEventListener("keyup",e=>this.keys.delete(e.key.toLowerCase()));
    const point=e=>{const r=this.renderer.domElement.getBoundingClientRect();this.targetX=clamp(((e.clientX-r.left)/r.width*2-1)*5.4,-4.55,4.55)};
    this.renderer.domElement.addEventListener("pointerdown",e=>{this.drag=true;point(e);this.renderer.domElement.setPointerCapture(e.pointerId)});this.renderer.domElement.addEventListener("pointermove",e=>{if(this.drag)point(e)});this.renderer.domElement.addEventListener("pointerup",()=>this.drag=false);
  }
  pause(){if(this.state==="playing"){this.state="paused";overlay("PAUSED","The squad is holding position.","RESUME","Tactical pause")}else if(this.state==="paused"){this.state="playing";$("overlay").hidden=true;this.lastFrame=performance.now()}}
  shoot(){
    const w=WEAPONS[this.weapon],n=clamp(1+Math.floor(this.force/8)+w.streams,1,8);for(let i=0;i<n;i++){const spread=w.spread?((i-(n-1)/2)*w.spread):0,x=this.playerX+(i-(n-1)/2)*.24,size=this.weapon==="rocket"?.16:this.weapon==="flame"?.11:.055,length=this.weapon==="machine"?.95:this.weapon==="rocket"?.9:this.weapon==="flame"?.42:.66,m=this.box(size,size,length,new THREE.MeshBasicMaterial({color:w.color}),x,.72,PLAYER_Z-.8);this.scene.add(m);this.bullets.push({mesh:m,x,z:PLAYER_Z-.8,startZ:PLAYER_Z-.8,speed:w.speed,damage:w.damage,vx:spread,range:w.range,splash:w.splash||0})}for(const u of this.units.slice(0,Math.min(n,this.units.length))){if(u.userData.muzzle){u.userData.muzzle.material.emissiveIntensity=5;setTimeout(()=>{if(u.userData.muzzle)u.userData.muzzle.material.emissiveIntensity=0},34)}}this.impact(this.playerX,.82,PLAYER_Z-.65,w.color,this.weapon==="rocket"?12:this.weapon==="flame"?5:2);tone(this.weapon==="flame"?180:this.weapon==="rocket"?95:this.weapon==="machine"?880:760,this.weapon==="rocket"?.12:.022,this.weapon==="rocket"?"sawtooth":"square",this.weapon==="rocket"?.045:.009,this.weapon==="rocket"?80:0);
  }
  animateUnit(u,t){const s=Math.sin(t*13+u.userData.phase),l=u.userData.limbs;l[0].rotation.x=s*.65;l[1].rotation.x=-s*.75;l[2].rotation.x=-s*.65;l[3].rotation.x=s*.75;u.rotation.z=s*.025;u.position.y=Math.abs(s)*.035}
  updateRoad(dt,speed){for(const t of this.tiles){t.position.z+=speed*dt;if(t.position.z>24)t.position.z-=this.tiles.length*22}for(const p of this.props){p.position.z+=speed*dt;if(p.position.z>18)p.position.z-=198}}
  updateObjects(dt,speed,time){
    for(const o of[...this.objects]){o.z+=speed*dt;if(o.kind==="gates"){for(const g of o.gates){g.z=o.z;g.group.position.z=o.z;g.glow.intensity=2.4+Math.sin(time*5)*.8}if(o.z>=PLAYER_Z-.2){const g=o.gates.reduce((a,b)=>Math.abs(b.x-this.playerX)<Math.abs(a.x-this.playerX)?b:a);this.applyGate(g);this.remove(o)}}else{o.group.position.z=o.z;if(o.kind==="enemy"){o.units.forEach(u=>this.animateUnit(u,time));if(o.z>-38&&o.z<PLAYER_Z-5){o.fire-=dt;if(o.fire<=0){o.fire=1.15+Math.random()*.65;this.enemyShoot(o)}}}if(o.kind==="weapon"){o.group.rotation.y=Math.sin(time*2.5)*.035;o.beacon.intensity=3+Math.sin(time*7)}if(o.kind==="crate")o.group.rotation.y=Math.sin(time*2+o.x)*.025;if(o.kind==="boss"){if(!o.announced&&o.z>-48){o.announced=true;this.banner("FINAL WALL · BREAK THROUGH","bad");tone(105,.34,"sawtooth",.05,90)}if(o.z>-42&&o.z<PLAYER_Z-4){o.fire=(o.fire||.7)-dt;if(o.fire<=0){o.fire=.9;this.enemyShoot(o,true)}}}if(o.z>=PLAYER_Z)this.contact(o)}}
  }
  updateBullets(dt){
    for(let i=this.bullets.length-1;i>=0;i--){const b=this.bullets[i];b.z-=b.speed*dt;b.x+=b.vx*dt;b.mesh.position.set(b.x,.72,b.z);let hit=false;for(const o of this.objects){if(o.kind==="gates"){for(const g of o.gates)if(Math.abs(b.z-g.z)<.7&&Math.abs(b.x-g.x)<g.radius){this.hitGate(g,b.damage);hit=true;break}}else if(["crate","weapon","enemy","boss"].includes(o.kind)&&Math.abs(b.z-o.z)<1&&Math.abs(b.x-o.x)<o.radius){this.damageObject(o,b.damage,b);hit=true}if(hit)break}if(hit||b.startZ-b.z>b.range){this.scene.remove(b.mesh);this.bullets.splice(i,1)}}
  }
  damageObject(o,damage,b){o.hp-=damage;this.impact(b.x,.8,b.z,o.kind==="enemy"?0xff4f68:0xffc94a,o.kind==="boss"?6:3);if(b.splash)for(const other of[...this.objects])if(other!==o&&["enemy","crate","weapon","boss"].includes(other.kind)&&Math.hypot(other.x-o.x,other.z-o.z)<b.splash){other.hp-=damage*.55;if(other.kind==="enemy")this.enemyCount(other);if(other.kind==="boss")this.setBadge(other.badge,Math.max(0,Math.ceil(other.hp)));if(other.hp<=0)this.destroy(other)}if(o.kind==="enemy"){this.enemyCount(o);o.group.scale.setScalar(1.05);setTimeout(()=>o.group?.scale.setScalar(1),55)}if(o.kind==="boss")this.setBadge(o.badge,Math.max(0,Math.ceil(o.hp)));if(o.hp<=0)this.destroy(o)}
  enemyShoot(o,boss=false){const shots=boss?2:Math.min(3,1+Math.floor(o.visible/9));for(let i=0;i<shots;i++){const sx=o.x+(i-(shots-1)/2)*(boss?3.8:.45),dz=PLAYER_Z-o.z,time=Math.max(.4,dz/18),vx=(this.playerX-sx)/time+(Math.random()-.5)*.35,m=this.box(.09,.09,.62,new THREE.MeshBasicMaterial({color:boss?0xff8a36:0xff3655}),sx,boss?2.4:.75,o.z+.8);this.scene.add(m);this.enemyBullets.push({mesh:m,x:sx,z:o.z+.8,vx,speed:18,damage:boss?2:1})}tone(boss?120:260,.045,"sawtooth",.012)}
  updateEnemyBullets(dt){for(let i=this.enemyBullets.length-1;i>=0;i--){const b=this.enemyBullets[i];b.z+=b.speed*dt;b.x+=b.vx*dt;b.mesh.position.set(b.x,.72,b.z);if(b.z>=PLAYER_Z-.7&&Math.abs(b.x-this.playerX)<1.35){this.impact(b.x,.6,b.z,0x4dafff,8);this.change(-b.damage,"UNDER FIRE");this.scene.remove(b.mesh);this.enemyBullets.splice(i,1)}else if(b.z>PLAYER_Z+4||Math.abs(b.x)>8){this.scene.remove(b.mesh);this.enemyBullets.splice(i,1)}}}
  hitGate(g,d){g.charge+=d;g.group.scale.setScalar(1+Math.min(.1,g.charge*.004));setTimeout(()=>g.group?.scale.setScalar(1),70);g.lights.forEach((q,i)=>q.material.emissiveIntensity=i<Math.ceil(g.charge/14*5)?2.8:.05);if(g.charge>=14){g.charge-=14;if(g.type==="force")g.value++;else if(g.type==="multiply")g.value=Math.min(2,g.value+.1);const label=g.type==="multiply"?"×"+g.value.toFixed(1):"+"+Math.floor(g.value);g.sign.material.dispose();g.sign.material=this.label(label,g.type==="multiply"?"#147348":"#1168ad");tone(520,.03,"square",.014,80)}}
  applyGate(g){if(g.type==="multiply"){const before=this.force;this.force=Math.floor(this.force*g.value);this.banner("×"+g.value.toFixed(1)+" · +"+(this.force-before)+" FORCE","good")}else{this.force+=Math.floor(g.value);this.banner("+"+Math.floor(g.value)+" FORCE","good")}this.score+=Math.floor(g.value*20);this.setForce();this.impact(this.playerX,.8,PLAYER_Z,0x59dfff,20);tone(460,.12,"triangle",.05,520)}
  enemyCount(o){const remain=Math.max(0,Math.ceil(o.count*o.hp/o.maxHp)),visible=remain?Math.max(1,Math.ceil(o.units.length*remain/o.count)):0;this.setBadge(o.badge,remain);while(o.visible>visible){const u=o.units[--o.visible];u.visible=false;const w=new THREE.Vector3();u.getWorldPosition(w);this.impact(w.x,w.y+.5,w.z,0xff435d,7)}}
  contact(o){if(o.kind==="enemy"){if(Math.abs(o.x-this.playerX)<o.radius+1)this.change(-Math.max(2,Math.ceil(o.count*Math.max(0,o.hp)/o.maxHp)),"FORMATION HIT");this.remove(o)}else if(o.kind==="crate"||o.kind==="weapon"){if(Math.abs(o.x-this.playerX)<1.7)this.change(-4,o.kind==="weapon"?"WEAPON MISSED":"CRATE IMPACT");this.remove(o)}else if(o.kind==="obstacle"){if(Math.abs(o.x-this.playerX)<o.radius+.7)this.change(-6,"BARRIER HIT");this.remove(o)}else if(o.kind==="boss")this.finish(false)}
  destroy(o){if(!this.objects.includes(o))return;if(o.kind==="crate"){this.force+=o.reward;this.score+=350;this.setForce();this.banner("REINFORCEMENTS +"+o.reward,"good");this.impact(o.x,1,o.z,0xffb037,28)}if(o.kind==="weapon"){this.weapon=o.type;this.updateWeaponModels();this.score+=500;this.banner(WEAPONS[o.type].label+" ACQUIRED","good");this.impact(o.x,1,o.z,WEAPONS[o.type].color,36);tone(o.type==="rocket"?110:620,.18,"sawtooth",.06,300)}if(o.kind==="enemy"){this.score+=o.count*55;this.banner("WAVE CLEARED · +"+o.count*55,"good");this.impact(o.x,.8,o.z,0xff415a,24)}if(o.kind==="boss"){this.score+=5000+this.force*100;this.impact(0,1.5,o.z,0xffd65a,80);this.remove(o);this.finish(true);return}tone(190,.1,"sawtooth",.04,360);this.remove(o)}
  remove(o){const i=this.objects.indexOf(o);if(i>=0)this.objects.splice(i,1);o.kind==="gates"?o.gates.forEach(g=>this.scene.remove(g.group)):this.scene.remove(o.group)}
  change(n,label){if(n<0)for(const u of this.units.slice(Math.max(0,this.units.length-Math.min(-n,6)))){const w=new THREE.Vector3();u.getWorldPosition(w);this.impact(w.x,w.y+.5,w.z,0x54baff,6)}this.force=Math.max(0,this.force+n);this.setForce();this.banner(label,n<0?"bad":"good");this.camera.position.x=.12;setTimeout(()=>this.camera.position.x=0,90);tone(120,.14,"sawtooth",.05,-55);if(!this.force)this.finish(false)}
  impact(x,y,z,color,n){for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.035+Math.random()*.045,5,4),new THREE.MeshBasicMaterial({color,transparent:true}));m.position.set(x,y,z);this.scene.add(m);this.particles.push({mesh:m,life:.22+Math.random()*.3,v:new THREE.Vector3((Math.random()-.5)*3,Math.random()*2.8,(Math.random()-.5)*3)})}}
  updateParticles(dt){for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.v.y-=5*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.material.opacity=clamp(p.life*3,0,1);if(p.life<=0){this.scene.remove(p.mesh);this.particles.splice(i,1)}}}
  banner(text,c=""){const t=++this.token,b=$("banner");b.textContent=text;b.className="banner "+c;b.hidden=false;setTimeout(()=>{if(t===this.token)b.hidden=true},1050)}
  hud(){$("force").textContent=Math.floor(this.force||12);$("power").textContent=WEAPONS[this.weapon||"rifle"].label;$("score").textContent=String(Math.floor(this.score||0)).padStart(6,"0");$("zone").textContent=this.zone||1}
  finish(win){if(this.state==="over")return;this.state="over";const score=Math.floor(this.score),key=SAVE+"_best_"+mode,best=Math.max(score,+localStorage.getItem(key)||0);localStorage.setItem(key,best);window.GameScores?.record({game:"blitz",mode:"strike-3d",difficulty:mode,metric:"score",value:score,meta:{force:this.force,victory:win}});overlay(win?"MISSION CLEAR":"SQUAD LOST",(win?"The final wall fell.":"Your force was overwhelmed.")+"<br><b>Score "+score.toLocaleString()+"</b> · Best "+best.toLocaleString()+"<br>Force remaining: "+Math.floor(this.force),"RUN AGAIN",win?"Rapid response complete":"Regroup and redeploy");$("mode-picker").hidden=true;tone(win?440:95,win?.5:.4,win?"triangle":"sawtooth",.07,win?620:-45)}
  resize(){const w=this.host.clientWidth||720,h=this.host.clientHeight||1280;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
  update(dt,time){const active=this.state==="playing",speed=active?MODES[mode].speed:1.1;this.updateRoad(dt,speed);if(!active){this.updateParticles(dt);return}this.mixers.forEach(m=>m.update(dt));this.distance+=speed*dt;this.zone=this.distance<75?1:this.distance<150?2:3;if(this.zone!==this.lastZone){this.lastZone=this.zone;const sky=[0x62a9c1,0x9c806f,0x493f58][this.zone-1],fog=[0x8fc5d3,0xa9917d,0x66566c][this.zone-1];this.scene.background.setHex(sky);this.scene.fog.color.setHex(fog);this.banner("ZONE "+this.zone+" · PRESSURE RISING","bad");tone(180,.18,"sawtooth",.04,180)}const d=(this.keys.has("a")||this.keys.has("arrowleft")?-1:0)+(this.keys.has("d")||this.keys.has("arrowright")?1:0);if(d)this.targetX=clamp(this.targetX+d*7.5*dt,-4.55,4.55);this.playerX+=(this.targetX-this.playerX)*(1-Math.pow(.00008,dt));this.squad.position.x=this.shadow.position.x=this.playerX;this.camera.rotation.z+=(this.playerX*-.006-this.camera.rotation.z)*(1-Math.pow(.02,dt));for(const u of this.units){u.position.x+=(u.userData.tx-u.position.x)*(1-Math.pow(.012,dt));u.position.z+=(u.userData.tz-u.position.z)*(1-Math.pow(.012,dt));u.scale.lerp(new THREE.Vector3(.76,.76,.76),1-Math.pow(.004,dt));this.animateUnit(u,time)}this.updateObjects(dt,speed,time);this.nextShot-=dt;if(this.nextShot<=0){this.nextShot=WEAPONS[this.weapon].rate;this.shoot()}this.updateBullets(dt);this.updateEnemyBullets(dt);this.updateParticles(dt);this.hud()}
  loop(ms){requestAnimationFrame(this.loop);const dt=Math.min(.033,Math.max(0,(ms-this.lastFrame)/1000));this.lastFrame=ms;this.update(dt,ms/1000);this.renderer.render(this.scene,this.camera)}
}

const game=new Blitz($("game-host"));
document.querySelectorAll("[data-difficulty]").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.difficulty;localStorage.setItem(SAVE+"_difficulty",mode);document.querySelectorAll("[data-difficulty]").forEach(x=>x.classList.toggle("active",x===b));tone(390,.04,"square",.03,90)}));
document.querySelector('[data-difficulty="'+mode+'"]')?.click();
$("start").addEventListener("click",()=>game.state==="paused"?game.pause():game.start());$("pause").addEventListener("click",()=>game.pause());
$("sound").textContent=soundOn?"🔊":"🔇";$("sound").addEventListener("click",()=>{soundOn=!soundOn;localStorage.setItem(SAVE+"_sound",soundOn?"on":"off");$("sound").textContent=soundOn?"🔊":"🔇";$("sound").setAttribute("aria-label",soundOn?"Mute sound":"Enable sound");tone(520,.06)});
$("fullscreen").addEventListener("click",()=>document.fullscreenElement?document.exitFullscreen?.():document.querySelector(".cabinet").requestFullscreen?.());
addEventListener("blur",()=>{if(game.state==="playing")game.pause()});
