import * as THREE from "../vendor/three/three.module.min.js";
import RAPIER from "./vendor/rapier-0.17.3.js?v=init2";
import {FixedStepper,MEDALS,checkpointAdvance,clamp,formatTime,isOnRoad,medalFor,readBest,readReplay,reconcileBest,replayFrameAt,saveBest,saveReplay} from "./simulation.js";

const $=id=>document.getElementById(id),canvas=$("view"),scene=new THREE.Scene();
scene.background=new THREE.Color(0x8dc9ed);scene.fog=new THREE.Fog(0x8dc9ed,160,430);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,800);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
scene.add(new THREE.HemisphereLight(0xcceaff,0x34451e,2.1));const sun=new THREE.DirectionalLight(0xfff5dc,3.1);sun.position.set(-60,110,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;scene.add(sun);
const rim=new THREE.DirectionalLight(0x4bdcff,1.3);rim.position.set(90,35,-130);scene.add(rim);

await RAPIER.init();
const world=new RAPIER.World({x:0,y:-24,z:0});world.integrationParameters.dt=1/120;
const meshes=[],keys=new Set(),course=[];
const materials={road:new THREE.MeshStandardMaterial({color:0xdbe1e5,roughness:.78,metalness:.02}),bank:new THREE.MeshStandardMaterial({color:0x303945,roughness:.67}),edge:new THREE.MeshStandardMaterial({color:0x12cde8,emissive:0x057389,emissiveIntensity:.45}),grass:new THREE.MeshStandardMaterial({color:0x43752c,roughness:1}),stadium:new THREE.MeshStandardMaterial({color:0x182533,roughness:.8})};

function addBox({x,y,z,hx,hy,hz,rx=0,ry=0,rz=0,material=materials.road,collider=true}){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(hx*2,hy*2,hz*2),material);mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  if(collider){const rotation=new THREE.Quaternion().setFromEuler(mesh.rotation),desc=RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(rotation).setFriction(1.1);world.createCollider(desc)}
  course.push(mesh);return mesh;
}
addBox({x:0,y:-1.2,z:-50,hx:190,hy:1,hz:150,material:materials.grass});
addBox({x:47,y:0,z:0,hx:58,hy:.45,hz:13});
addBox({x:101,y:0,z:-18,hx:20,hy:.45,hz:22});
addBox({x:101,y:0,z:-61,hx:13,hy:.45,hz:38});
addBox({x:91,y:1,z:-103,hx:27,hy:.45,hz:13,rx:.035,material:materials.bank});
addBox({x:48,y:1,z:-103,hx:28,hy:.45,hz:13,rx:.035,material:materials.bank});
addBox({x:8,y:1.4,z:-103,hx:16,hy:.45,hz:13,rz:-.035,material:materials.road});
addBox({x:-28,y:1,z:-103,hx:22,hy:.45,hz:14});
addBox({x:-67,y:.3,z:-103,hx:23,hy:.45,hz:14});
addBox({x:-82,y:0,z:9,hx:14,hy:.45,hz:116,material:materials.bank});
addBox({x:22,y:0,z:140,hx:120,hy:.45,hz:16});
addBox({x:150,y:0,z:72,hx:14,hy:.45,hz:68,material:materials.bank});

// Stadium bowl and lane-edge rhythm markers are purely procedural art.
for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=215;addBox({x:35+Math.cos(a)*r,y:7,z:-15+Math.sin(a)*r,hx:15,hy:8,hz:5,ry:-a,material:materials.stadium,collider:false});addBox({x:35+Math.cos(a)*r*1.07,y:18,z:-15+Math.sin(a)*r*1.07,hx:15,hy:3,hz:5,ry:-a,material:i%2?materials.stadium:materials.edge,collider:false})}
for(let x=-8;x<105;x+=12){addBox({x,y:.55,z:13.5,hx:4,hy:.15,hz:.22,material:materials.edge,collider:false});addBox({x,y:.55,z:-13.5,hx:4,hy:.15,hz:.22,material:materials.edge,collider:false})}
for(let z=-88;z<140;z+=14){addBox({x:-98.5,y:.65,z,hx:.25,hy:.25,hz:5,material:materials.edge,collider:false});addBox({x:-65.5,y:.65,z,hx:.25,hy:.25,hz:5,material:materials.edge,collider:false})}
for(let x=-78;x<145;x+=14){addBox({x,y:.65,z:123.5,hx:5,hy:.25,hz:.25,material:materials.edge,collider:false});addBox({x,y:.65,z:156.5,hx:5,hy:.25,hz:.25,material:materials.edge,collider:false})}
for(let z=12;z<140;z+=14){addBox({x:133.5,y:.65,z,hx:.25,hy:.25,hz:5,material:materials.edge,collider:false});addBox({x:166.5,y:.65,z,hx:.25,hy:.25,hz:5,material:materials.edge,collider:false})}
const stripeMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x132a33,roughness:.55});for(let x=4;x<110;x+=18)addBox({x,y:.49,z:0,hx:5,hy:.025,hz:.14,material:stripeMat,collider:false});for(let z=-86;z<118;z+=20)addBox({x:-82,y:.49,z,hx:.14,hy:.025,hz:5,material:stripeMat,collider:false});for(let x=-66;x<132;x+=20)addBox({x,y:.49,z:140,hx:5,hy:.025,hz:.14,material:stripeMat,collider:false});for(let z=20;z<130;z+=20)addBox({x:150,y:.49,z,hx:.14,hy:.025,hz:5,material:stripeMat,collider:false});
for(let z=-7;z<=7;z+=2)addBox({x:2,y:.5,z,hx:.35,hy:.03,hz:.75,material:z%4?materials.stadium:stripeMat,collider:false});

function gate(x,z,rotation=0,color=0x5eeaff){
  const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.6,metalness:.35,roughness:.25});
  for(const side of[-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.7,8,.7),mat);post.position.set(0,4,side*11);post.castShadow=true;group.add(post)}
  const top=new THREE.Mesh(new THREE.BoxGeometry(.8,.7,23),mat);top.position.y=8;group.add(top);group.position.set(x,.45,z);group.rotation.y=rotation;scene.add(group);return group;
}
gate(99,-12,Math.PI/2);gate(101,-103,Math.PI/2);gate(-82,-103,0);gate(-82,125,Math.PI/2);gate(135,140,0);gate(150,8,Math.PI/2,0xffd044);
function sign(text,x,z,ry=0,color="#68efff"){const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle="#071521";g.fillRect(0,0,512,128);g.strokeStyle=color;g.lineWidth=10;g.strokeRect(5,5,502,118);g.fillStyle="#fff";g.font="900 52px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(text,256,66);const m=new THREE.Mesh(new THREE.PlaneGeometry(12,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));m.position.set(x,4,z);m.rotation.y=ry;scene.add(m)}
sign("BRAKE  ›",112,-72,Math.PI/2,"#ffd34f");sign("‹  HAIRPIN",38,-116,0,"#ff6c4c");sign("CLIMB  ›",-95,72,Math.PI/2);sign("FULL SEND  ›",45,123,0);sign("FINISH  ↓",166,36,Math.PI/2,"#ffd34f");

const grid=new THREE.GridHelper(320,32,0xffffff,0xffffff);grid.position.y=-.15;grid.material.opacity=.08;grid.material.transparent=true;scene.add(grid);

const chassis=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-2,2.2,0).setCanSleep(false).setCcdEnabled(true).setLinearDamping(.08).setAngularDamping(.65));
world.createCollider(RAPIER.ColliderDesc.cuboid(2.35,.2,1.05).setTranslation(0,.22,0).setDensity(70).setFriction(.72),chassis);
const vehicle=world.createVehicleController(chassis),wheelOffsets=[{x:1.55,y:.35,z:1.02},{x:1.55,y:.35,z:-1.02},{x:-1.45,y:.35,z:1.02},{x:-1.45,y:.35,z:-1.02}];
for(const p of wheelOffsets){vehicle.addWheel(p,{x:0,y:-1,z:0},{x:0,y:0,z:1},.42,.65);const i=vehicle.numWheels()-1;vehicle.setWheelSuspensionStiffness(i,180);vehicle.setWheelSuspensionCompression(i,7);vehicle.setWheelSuspensionRelaxation(i,9);vehicle.setWheelMaxSuspensionTravel(i,.55);vehicle.setWheelMaxSuspensionForce(i,60000);vehicle.setWheelSideFrictionStiffness(i,1.35);vehicle.setWheelFrictionSlip(i,2.55)}

const car=new THREE.Group(),bodyMat=new THREE.MeshStandardMaterial({color:0x12d9ef,metalness:.55,roughness:.24}),dark=new THREE.MeshStandardMaterial({color:0x07131c,metalness:.25,roughness:.38});
const body=new THREE.Mesh(new THREE.BoxGeometry(4.5,.65,2),bodyMat);body.position.y=.15;body.castShadow=true;car.add(body);
const nose=new THREE.Mesh(new THREE.BoxGeometry(1.5,.28,1.55),bodyMat);nose.position.set(2.5,-.03,0);nose.castShadow=true;car.add(nose);
const cockpit=new THREE.Mesh(new THREE.SphereGeometry(.72,16,10,0,Math.PI*2,0,Math.PI*.58),dark);cockpit.scale.set(1.25,.75,.9);cockpit.position.set(-.2,.64,0);car.add(cockpit);
const wing=new THREE.Mesh(new THREE.BoxGeometry(.28,.17,3),dark);wing.position.set(-2.25,.62,0);car.add(wing);scene.add(car);
const carbon=new THREE.MeshStandardMaterial({color:0x111820,metalness:.7,roughness:.28}),glass=new THREE.MeshPhysicalMaterial({color:0x123047,metalness:.1,roughness:.08,transmission:.25}),lamp=new THREE.MeshStandardMaterial({color:0xe8fdff,emissive:0x8cecff,emissiveIntensity:4});
for(const side of[-1,1]){const pod=new THREE.Mesh(new THREE.BoxGeometry(2.8,.38,.5),bodyMat);pod.position.set(-.05,-.05,side*1.12);pod.castShadow=true;car.add(pod);const light=new THREE.Mesh(new THREE.BoxGeometry(.32,.18,.16),lamp);light.position.set(2.55,.08,side*.58);car.add(light)}
const splitter=new THREE.Mesh(new THREE.BoxGeometry(1.5,.08,2.4),carbon);splitter.position.set(2.65,-.35,0);car.add(splitter);const floor=new THREE.Mesh(new THREE.BoxGeometry(4.6,.08,1.8),carbon);floor.position.y=-.32;car.add(floor);const fin=new THREE.Mesh(new THREE.BoxGeometry(1.5,.55,.08),carbon);fin.position.set(-1.1,.55,0);car.add(fin);cockpit.material=glass;
const rearDeck=new THREE.Mesh(new THREE.BoxGeometry(1.15,.32,2.2),bodyMat);rearDeck.position.set(-1.85,.08,0);rearDeck.castShadow=true;car.add(rearDeck);const tailMat=new THREE.MeshStandardMaterial({color:0xff3b2f,emissive:0xff1200,emissiveIntensity:3});for(const side of[-1,1]){const tail=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.08,16),tailMat);tail.rotation.z=Math.PI/2;tail.position.set(-2.44,.13,side*.63);car.add(tail)}const diffuser=new THREE.Mesh(new THREE.BoxGeometry(.45,.22,1.8),carbon);diffuser.position.set(-2.38,-.27,0);car.add(diffuser);
const wheelMeshes=[];for(const p of wheelOffsets){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.38,24),dark);wheel.rotation.x=Math.PI/2;wheel.castShadow=true;const rim=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.4,12),new THREE.MeshStandardMaterial({color:0xa8bac5,metalness:.9,roughness:.2}));wheel.add(rim);scene.add(wheel);wheelMeshes.push(wheel)}
const ghostMat=new THREE.MeshStandardMaterial({color:0xbef8ff,emissive:0x30d7ff,emissiveIntensity:1,transparent:true,opacity:.28,depthWrite:false}),ghost=new THREE.Group();
const ghostBody=new THREE.Mesh(new THREE.BoxGeometry(4.5,.65,2),ghostMat);ghostBody.position.y=.15;ghost.add(ghostBody);const ghostNose=new THREE.Mesh(new THREE.BoxGeometry(1.5,.28,1.55),ghostMat);ghostNose.position.set(2.5,-.03,0);ghost.add(ghostNose);ghost.visible=false;scene.add(ghost);
const smokeMat=new THREE.MeshBasicMaterial({color:0xd8e2e8,transparent:true,opacity:.22,depthWrite:false}),smoke=[];function puff(p){if(smoke.length>28){const old=smoke.shift();scene.remove(old)}const s=new THREE.Mesh(new THREE.SphereGeometry(.25,8,5),smokeMat.clone());s.position.set(p.x,p.y+.25,p.z);s.userData.life=1;scene.add(s);smoke.push(s)}

let raceState="countdown",raceTime=0,countdown=3,checkpoint=0,best=readBest(localStorage),bestReplay=readReplay(localStorage),steer=0,lastPosition=new THREE.Vector3(),lastRotation=new THREE.Quaternion(),cameraReady=false,raceTick=0,replayFrames=[],wasGrounded=true,cameraShake=0;
best=reconcileBest(best,bestReplay);
let audio=null;function startAudio(){if(audio)return;const context=new AudioContext(),master=context.createGain(),engine=context.createOscillator(),engineGain=context.createGain(),wind=context.createOscillator(),windGain=context.createGain();master.gain.value=.16;master.connect(context.destination);engine.type="sawtooth";engineGain.gain.value=0;engine.connect(engineGain).connect(master);engine.start();wind.type="triangle";wind.frequency.value=80;windGain.gain.value=0;wind.connect(windGain).connect(master);wind.start();audio={context,engine,engineGain,wind,windGain}}
const start={x:-2,y:2.2,z:0,rotation:{x:0,y:0,z:0,w:1}};
function clearVehicle(){for(let i=0;i<4;i++){vehicle.setWheelEngineForce(i,0);vehicle.setWheelBrake(i,0);vehicle.setWheelSteering(i,0)}chassis.resetForces(true);chassis.resetTorques(true);chassis.setLinvel({x:0,y:0,z:0},true);chassis.setAngvel({x:0,y:0,z:0},true)}
function place(position,rotation={x:0,y:0,z:0,w:1}){clearVehicle();chassis.setTranslation(position,true);chassis.setRotation(rotation,true);lastPosition.set(position.x,position.y,position.z);lastRotation.set(rotation.x,rotation.y,rotation.z,rotation.w);cameraReady=false}
function captureReplay(){const replayTick=Math.floor(raceTick/4);if(replayFrames.at(-1)?.[0]>=replayTick)return;const p=chassis.translation(),q=chassis.rotation();replayFrames.push([replayTick,+p.x.toFixed(3),+p.y.toFixed(3),+p.z.toFixed(3),+q.x.toFixed(5),+q.y.toFixed(5),+q.z.toFixed(5),+q.w.toFixed(5)])}
function restart(){raceState="countdown";raceTime=0;countdown=3;checkpoint=0;steer=0;raceTick=0;replayFrames=[];place(start,start.rotation);$("result").hidden=true;stepper.reset();updateHud()}
function recover(){const spots=[start,{x:93,y:1.8,z:-20,rotation:{x:0,y:-.707,z:0,w:.707}},{x:82,y:1.9,z:-103,rotation:{x:0,y:1,z:0,w:0}},{x:-82,y:1.8,z:-80,rotation:{x:0,y:.707,z:0,w:.707}},{x:-82,y:1.8,z:115,rotation:{x:0,y:.707,z:0,w:.707}},{x:125,y:1.8,z:140,rotation:{x:0,y:0,z:0,w:1}}];place(spots[Math.min(checkpoint,spots.length-1)]);if(raceState==="racing")raceTime+=1.5}
function finish(){raceState="finished";captureReplay();const isBest=!best||raceTime<best;if(isBest){best=raceTime;saveBest(localStorage,best);if(saveReplay(localStorage,best,replayFrames))bestReplay=readReplay(localStorage)}const medal=medalFor(raceTime);$("result-time").textContent=formatTime(raceTime);$("result-pb").textContent=`${medal?medal.name+" MEDAL · ":""}${isBest?"NEW PERSONAL BEST":`Personal best ${formatTime(best)}`}`;$("result").hidden=false;clearVehicle()}
function updateHud(){const speed=raceState==="countdown"?0:Math.abs(vehicle.currentVehicleSpeed?.()||0)*3.6;$("time").textContent=formatTime(raceTime);$("speed").textContent=String(Math.round(speed)).padStart(3,"0");$("checkpoint").textContent=`${Math.min(checkpoint,5)} / 5`;const target=MEDALS.find(m=>!best||best>m.time)||MEDALS[0];$("delta").textContent=best?`PB ${formatTime(best)} · ${target.name} ${formatTime(target.time)}`:`${target.name} TARGET ${formatTime(target.time)}`}

function physicsStep(dt){
  const before=chassis.translation();lastPosition.set(before.x,before.y,before.z);const br=chassis.rotation();lastRotation.set(br.x,br.y,br.z,br.w);
  if(raceState==="countdown"){countdown-=dt;if(countdown<=0){raceState="racing";countdown=0}}
  const throttle=raceState==="racing"?(keys.has("ArrowUp")||keys.has("KeyW")?1:keys.has("ArrowDown")||keys.has("KeyS")?-.65:0):0;
  const targetSteer=(keys.has("ArrowLeft")||keys.has("KeyA")?1:0)-(keys.has("ArrowRight")||keys.has("KeyD")?1:0);steer+=clamp(targetSteer-steer,-dt*5,dt*5);
  const position=chassis.translation(),onRoad=isOnRoad(position),speed=Math.abs(vehicle.currentVehicleSpeed?.()||0),handbrake=keys.has("Space"),steerLimit=THREE.MathUtils.lerp(.5,.18,clamp(speed/70,0,1)),engine=throttle*(speed>76&&throttle>0?0:15200)*(onRoad?1:.42),serviceBrake=throttle<0&&speed>1?4200:0;
  if(audio){const now=audio.context.currentTime;audio.engine.frequency.setTargetAtTime(54+speed*7+Math.abs(throttle)*45,now,.04);audio.engineGain.gain.setTargetAtTime(raceState==="racing"?.035+Math.abs(throttle)*.055:0,now,.05);audio.wind.frequency.setTargetAtTime(70+speed*3,now,.08);audio.windGain.gain.setTargetAtTime(clamp((speed-8)/80,0,.06),now,.1)}
  for(let i=0;i<4;i++){vehicle.setWheelEngineForce(i,engine*(i<2?1:.55));vehicle.setWheelBrake(i,raceState!=="racing"?6000:serviceBrake+(handbrake?(i<2?900:5200):0));vehicle.setWheelSteering(i,i<2?steer*steerLimit:0);vehicle.setWheelFrictionSlip(i,onRoad?(handbrake&&i>=2?1.05:2.55):.82)}
  if(!onRoad){const v=chassis.linvel();chassis.addForce({x:-v.x*125,y:0,z:-v.z*125},true)}
  vehicle.updateVehicle(dt,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);world.step();
  const grounded=[0,1,2,3].some(i=>vehicle.wheelIsInContact(i));if(grounded&&!wasGrounded&&chassis.linvel().y<0)cameraShake=Math.min(.45,Math.abs(chassis.linvel().y)*.025);wasGrounded=grounded;if(raceState==="racing"&&handbrake&&speed>12&&raceTick%8===0)puff(chassis.translation());
  if(raceState==="racing"){raceTime+=dt;raceTick++;if(raceTick%4===0)captureReplay();const p=chassis.translation(),next=checkpointAdvance(checkpoint,p);if(next!==checkpoint){checkpoint=next;if(checkpoint===6)finish()}if(p.y<-12||Math.abs(p.x)>300||Math.abs(p.z)>260)recover()}
  updateHud();
}
const stepper=new FixedStepper(physicsStep);

function render(alpha){
  const p=chassis.translation(),q=chassis.rotation(),position=lastPosition.clone().lerp(new THREE.Vector3(p.x,p.y,p.z),alpha),rotation=lastRotation.clone().slerp(new THREE.Quaternion(q.x,q.y,q.z,q.w),alpha);car.position.copy(position);car.quaternion.copy(rotation);
  for(let i=0;i<4;i++){const wp=vehicle.wheelChassisConnectionPointCs(i),suspension=vehicle.wheelSuspensionLength(i),local=new THREE.Vector3(wp.x,wp.y-suspension,wp.z).applyQuaternion(rotation).add(position);wheelMeshes[i].position.copy(local);wheelMeshes[i].quaternion.copy(rotation);if(i<2)wheelMeshes[i].rotateY(vehicle.wheelSteering(i));wheelMeshes[i].rotateX(Math.PI/2);wheelMeshes[i].rotateZ(vehicle.wheelRotation(i))}
  if(bestReplay&&raceState!=="finished"){const f=replayFrameAt(bestReplay,raceTime);if(f){ghost.visible=true;ghost.position.set(f[1],f[2],f[3]);ghost.quaternion.set(f[4],f[5],f[6],f[7]).normalize()}}else ghost.visible=false;
  const forward=new THREE.Vector3(1,0,0).applyQuaternion(rotation),flatForward=forward.clone().setY(0).normalize(),up=new THREE.Vector3(0,1,0),speed=Math.abs(vehicle.currentVehicleSpeed?.()||0),desired=position.clone().addScaledVector(flatForward,-10.5-speed*.035).addScaledVector(up,4.9),look=position.clone().addScaledVector(flatForward,8+speed*.08).addScaledVector(up,1.1);
  const lateral=new THREE.Vector3(0,0,1).applyQuaternion(rotation),velocity=chassis.linvel(),slip=clamp((velocity.x*lateral.x+velocity.z*lateral.z)*.08,-2.2,2.2);look.addScaledVector(lateral,slip);if(!cameraReady){camera.position.copy(desired);cameraReady=true}else camera.position.lerp(desired,1-Math.exp(-8/60));if(cameraShake>.002){camera.position.x+=(Math.random()-.5)*cameraShake;camera.position.y+=(Math.random()-.5)*cameraShake;cameraShake*=.88}camera.fov=68+clamp(speed*.11,0,8);camera.updateProjectionMatrix();camera.lookAt(look);
  for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.userData.life-=.018;s.scale.addScalar(.025);s.position.y+=.01;s.material.opacity=Math.max(0,s.userData.life*.2);if(s.userData.life<=0){scene.remove(s);smoke.splice(i,1)}}
  $("countdown").textContent=raceState==="countdown"?(countdown>.7?String(Math.ceil(countdown)):"GO!"):"";renderer.render(scene,camera)
}
let previous=performance.now();function frame(now){const elapsed=(now-previous)/1000;previous=now;const{alpha}=stepper.advance(elapsed);render(alpha);requestAnimationFrame(frame)}
addEventListener("keydown",event=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","Backspace"].includes(event.code))event.preventDefault();if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD","Space"].includes(event.code))startAudio();keys.add(event.code);if(event.code==="KeyR"&&!event.repeat)restart();if(event.code==="Backspace"&&!event.repeat)recover()});addEventListener("keyup",event=>keys.delete(event.code));addEventListener("blur",()=>keys.clear());
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});$("again").addEventListener("click",restart);
restart();$("loading").style.opacity="0";setTimeout(()=>$("loading").remove(),400);requestAnimationFrame(frame);
