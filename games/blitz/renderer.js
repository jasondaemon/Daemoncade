import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from '../vendor/three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';
import { PLAYER_Z, WEAPONS, formation, clamp } from './simulation.js?v=1.0.0';
import { ROAD_TILE_COUNT, roadTileZ } from './road-layout.js?v=1.0.0';
import { SCENERY_MODELS, sceneryLayout, sceneryZ } from './scenery-layout.js?v=1.0.0';

const ARMORY=['AK','GrenadeLauncher','Knife_1','Knife_2','Pistol','Revolver','Revolver_Small','RocketLauncher','ShortCannon','Shotgun','Shovel','SMG','Sniper','Sniper_2'];
const EQUIPMENT={rifle:'AK',machine:'SMG',flame:'GrenadeLauncher',rocket:'RocketLauncher'};
const C={road:0x839495,edge:0xdbe5da,steel:0x283d48,gold:0xf3b853,blue:0x37c7ff,red:0xf65c66};
export class Battlefield {
  constructor(host,quality='auto',reduced=false){
    this.host=host;this.reduced=reduced;this.quality=quality;this.views=new Map();this.shots=new Map();this.particles=[];this.pool=[];this.units=[];this.props=[];this.tiles=[];this.clock=0;this.shake=0;this.materials=new Map();this.weapon='rifle';this.scratch=new THREE.Object3D();
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.shadowMap.enabled=quality!=='low';this.renderer.shadowMap.type=THREE.PCFShadowMap;host.append(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x94c9d7);this.scene.fog=new THREE.Fog(0x94c9d7,65,115);this.mission=-1;this.corpses=[];
    this.camera=new THREE.PerspectiveCamera(40,1,.1,160);this.camera.position.set(0,24,31);this.camera.lookAt(0,0,-5);
    this.scene.add(new THREE.HemisphereLight(0xecf9ff,0x557269,2));this.sun=new THREE.DirectionalLight(0xffead1,2.8);this.sun.position.set(-9,22,12);this.sun.castShadow=true;Object.assign(this.sun.shadow.camera,{left:-13,right:13,top:22,bottom:-23,near:1,far:75});this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.normalBias=.04;this.scene.add(this.sun);
    this.unitGeometry=new THREE.BoxGeometry(1,1,1);this.ringGeometry=new THREE.RingGeometry(.8,1,32);this.particleGeometry=new THREE.IcosahedronGeometry(1,0);
    this.ray=new THREE.Raycaster();this.ground=new THREE.Plane(new THREE.Vector3(0,1,0),-.3);this.hitPoint=new THREE.Vector3();this.world();this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
  }
  mat(color,metalness=.1){const key=color+':'+metalness;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,metalness,roughness:.72}));return this.materials.get(key)}
  box(parent,w,h,d,color,x=0,y=0,z=0){const mesh=new THREE.Mesh(this.unitGeometry,this.mat(color));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh}
  cylinder(parent,r,h,color,x,y,z,segments=12){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),this.mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.userData.ownedGeometry=true;parent.add(mesh);return mesh}
  batchStatic(group){
    const materials=new Map();for(const mesh of [...group.children]){if(!mesh.isMesh)continue;mesh.updateMatrix();const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrix);if(!materials.has(mesh.material))materials.set(mesh.material,[]);materials.get(mesh.material).push(geometry);group.remove(mesh)}
    for(const [material,geometries] of materials){const mesh=new THREE.Mesh(mergeGeometries(geometries,false),material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);geometries.forEach(g=>g.dispose())}
  }
  batchCharacter(source){
    // glTF material primitives share one transform and skeleton. Bake their colors
    // into vertices so each body, helmet or weapon is drawn once rather than per material.
    const groups=[];source.scene.traverse(o=>{if(o.children.length>1&&o.children.every(c=>c.isMesh&&!Array.isArray(c.material)&&c.children.length===0&&!!c.isSkinnedMesh===!!o.children[0].isSkinnedMesh))groups.push(o)});
    const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.03});
    for(const group of groups){const parts=[...group.children],first=parts[0];if(!parts.every(p=>p.matrix.equals(first.matrix)))continue;
      const geometries=parts.map(p=>{const g=p.geometry.clone(),colors=new Float32Array(g.attributes.position.count*3),c=p.material.color;for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g});
      const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)continue;
      const mesh=first.isSkinnedMesh?new THREE.SkinnedMesh(geometry,material):new THREE.Mesh(geometry,material);mesh.name=group.name+'_merged';mesh.position.copy(first.position);mesh.quaternion.copy(first.quaternion);mesh.scale.copy(first.scale);if(first.isSkinnedMesh)mesh.bind(first.skeleton,first.bindMatrix);parts.forEach(p=>group.remove(p));group.add(mesh);
    }
  }
  async load(progress=()=>{}){
    const loader=new GLTFLoader(),base='assets/models/quaternius-toon-shooter/';let done=0;
    const load=async(path)=>{const g=await loader.loadAsync(path);progress(++done/(2+SCENERY_MODELS.length));return g};
    const [blue,red,...sources]=await Promise.all([load(base+'Character_Soldier.gltf'),load(base+'Character_Enemy.gltf'),...SCENERY_MODELS.map(name=>load('assets/models/industrial/'+name+'.glb'))]);
    this.characters={blue,red};
    for(const [team,source] of Object.entries(this.characters))source.scene.traverse(o=>{
      if(ARMORY.includes(o.name))o.visible=o.name==='AK';
      if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;
      const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m.roughness=.8;m.metalness=.03;if(team==='blue'&&m.name==='Character_Main')m.color.setHex(0x168bd4);if(team==='blue'&&m.name==='Pants')m.color.setHex(0x244668);});
    });
    for(const source of Object.values(this.characters))this.batchCharacter(source);
    for(const placement of sceneryLayout()){
      const group=new THREE.Group(),model=sources[placement.model].scene.clone(true);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=placement.width/Math.max(size.x,size.z);model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);group.add(model);group.rotation.y=placement.rotation;group.userData.offset=placement.offset;group.position.set(placement.x,.26,sceneryZ(placement.offset,0));group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});this.scene.add(group);this.props.push(group);
    }
    this.setSquad(12,true);this.ready=true;
  }
  world(){
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,320),this.mat(0x617981));ground.rotation.x=-Math.PI/2;ground.position.set(0,.12,-65);ground.receiveShadow=true;this.scene.add(ground);
    // All prop footprints start outside the 12-unit roadway.
    for(let i=0;i<ROAD_TILE_COUNT;i++){
      const g=new THREE.Group();this.box(g,11.7,.5,8,C.road,0,0,0);this.box(g,11.7,.012,.025,0x667f82,0,.258,-3.98);
      for(const side of[-1,1]){this.box(g,.3,.65,8,C.edge,side*6,.14,0);this.box(g,34,.25,8,0x617981,side*23.2,.125,0);this.box(g,.12,.035,8,0xf0c56d,side*5.65,.27);this.box(g,.13,.13,8,C.steel,side*6.12,1.0);for(let z=-3;z<=3;z+=3)this.box(g,.1,.9,.1,C.steel,side*6.12,.57,z);}
      for(const x of[-1.85,1.85])this.box(g,.055,.014,1.8,0xb2c3bd,x,.265,0);
      this.batchStatic(g);g.position.z=roadTileZ(i,0);this.scene.add(g);this.tiles.push(g);
    }
    // Contact shadows remain stable under animated feet and do not cost a shadow pass per soldier.
    const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),gradient=x.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'rgba(12,30,39,.42)');gradient.addColorStop(1,'rgba(12,30,39,0)');x.fillStyle=gradient;x.fillRect(0,0,32,32);this.shadowTexture=new THREE.CanvasTexture(c);this.shadowMaterial=new THREE.MeshBasicMaterial({map:this.shadowTexture,transparent:true,depthWrite:false});this.shadowGeometry=new THREE.PlaneGeometry(1.05,.85);
    this.aim=new THREE.Group();for(const side of[-1,1]){const line=this.box(this.aim,.025,.012,6,0x82e9ff,side*.55,.285,-.5);line.material=new THREE.MeshBasicMaterial({color:0x82e9ff,transparent:true,opacity:.32});}this.scene.add(this.aim);
  }
  character(team){
    const source=this.characters[team],model=cloneSkeleton(source.scene),root=new THREE.Group();root.add(model);model.scale.setScalar(.7);model.rotation.y=team==='blue'?Math.PI:0;model.position.y=.29;
    // Material primitives on one character share the same animated skeleton.
    const skeletons=new Map();model.traverse(o=>{if(!o.isSkinnedMesh)return;const key=o.skeleton.bones.map(b=>b.uuid).join(',');if(skeletons.has(key))o.skeleton=skeletons.get(key);else skeletons.set(key,o.skeleton)});
    const mixer=new THREE.AnimationMixer(model),run=THREE.AnimationClip.findByName(source.animations,'Run_Shoot'),idle=THREE.AnimationClip.findByName(source.animations,'Idle_Shoot');const action=mixer.clipAction(run);action.play();action.time=Math.random()*run.duration;
    const stationary=mixer.clipAction(idle);stationary.play();stationary.setEffectiveWeight(0);
    const shadow=new THREE.Mesh(this.shadowGeometry,this.shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.275;root.add(shadow);
    const death=mixer.clipAction(THREE.AnimationClip.findByName(source.animations,'Death'));death.setLoop(THREE.LoopOnce,1);death.clampWhenFinished=true;
    root.userData={model,mixer,action,stationary,death,arms:{},weapon:'rifle'};for(const name of ARMORY){const gun=model.getObjectByName(name);if(gun)root.userData.arms[name]=gun;}
    return root;
  }
  equip(unit,weapon){if(unit.userData.weapon===weapon)return;unit.userData.weapon=weapon;for(const [name,obj] of Object.entries(unit.userData.arms))obj.visible=name===EQUIPMENT[weapon];}
  setSquad(count,immediate=false){
    if(!this.characters)return;
    while(this.units.length<count){const unit=this.character('blue');unit.userData.born=immediate?1:0;this.scene.add(unit);this.units.push(unit)}
    while(this.units.length>count){const unit=this.units.pop();if(immediate){this.disposeUnit(unit);this.scene.remove(unit)}else this.retire(unit)}
    const positions=formation(count);this.units.forEach((unit,i)=>{unit.userData.tx=positions[i].x;unit.userData.tz=positions[i].z;if(immediate)unit.position.set(positions[i].x,0,PLAYER_Z+positions[i].z)});
  }
  label(parent,text,sub='',color='#225768',width=2.4,y=2.4){
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=184;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.SpriteMaterial({map:texture,depthTest:true,transparent:true});const sprite=new THREE.Sprite(material);sprite.scale.set(width,width*184/384,1);sprite.position.y=y;sprite.userData={canvas,texture,text:'',sub:'',color:'',ownedTexture:true};parent.add(sprite);this.writeLabel(sprite,text,sub,color);return sprite;
  }
  writeLabel(sprite,text,sub='',color='#225768'){
    const d=sprite.userData;if(d.text===String(text)&&d.sub===sub&&d.color===color)return;d.text=String(text);d.sub=sub;d.color=color;const x=d.canvas.getContext('2d');x.clearRect(0,0,384,184);x.fillStyle=color;x.beginPath();x.roundRect(7,7,370,170,22);x.fill();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=4;x.stroke();x.textAlign='center';x.fillStyle='#fff';x.font='900 28px system-ui';x.fillText(sub,192,49);x.font=`900 ${String(text).length>8?44:76}px system-ui`;x.fillText(String(text),192,139);d.texture.needsUpdate=true;
  }
  create(o){
    const root=new THREE.Group(),view={root,labels:[],units:[],o};root.position.set(o.x,0,o.z);this.scene.add(root);
    if(o.kind==='gates'){
      o.choices.forEach((choice,i)=>{
        const group=new THREE.Group();group.position.x=choice.x;root.add(group);const color=choice.value<0?C.red:choice.type==='multiply'?0x43dba9:0x32b8f0;
        for(const side of[-1,1]){this.box(group,.13,2.9,.2,C.steel,side*2.35,1.7);this.box(group,.23,.22,.7,color,side*2.35,.4);}
        const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false});const pane=new THREE.Mesh(new THREE.PlaneGeometry(4.45,2.6),material);pane.userData.ownedGeometry=true;pane.position.y=1.65;group.add(pane);
        const label=this.label(group,'','',choice.value<0?'#c84250':'#157f95',3.9,2.45);view.labels.push(label);
        this.box(group,4.45,.035,.85,color,0,.285);const rail=this.box(group,4.25,.055,.05,color,0,1.5,.08);view['rail'+i]=rail;
      });
    }else if(o.kind==='weapon'||o.kind==='supply'){
      const color=o.kind==='weapon'?WEAPONS[o.weapon].color:C.gold;
      this.box(root,2.2,1.4,1.6,0x314d5b,0,.98);this.box(root,2.3,.16,1.7,color,0,1.67);this.box(root,2.3,.18,1.7,C.steel,0,.35);
      for(const side of[-1,1])this.box(root,.1,1.28,1.62,color,side*.78,.98);
      view.labels.push(this.label(root,Math.ceil(o.hp),o.kind==='weapon'?WEAPONS[o.weapon].name:`+${o.reward} SQUAD`,'#263f50',2.8,2.85));
      const glyph=new THREE.Group();if(o.kind==='weapon'){this.box(glyph,1.4,.14,.16,color,0,0);this.box(glyph,.3,.4,.18,C.steel,-.15,-.15);if(o.weapon==='rocket')this.cylinder(glyph,.14,1.5,color,0,.05,0).rotation.z=Math.PI/2;}
      else{this.box(glyph,.22,.72,.15,color);this.box(glyph,.72,.22,.15,color)}glyph.position.set(0,1.1,.85);root.add(glyph);
    }else if(o.kind==='enemy'){
      const positions=formation(o.count);positions.forEach(p=>{const unit=this.character('red');unit.position.set(p.x,0,-p.z);root.add(unit);view.units.push(unit)});view.labels.push(this.label(root,o.count,'HOSTILES','#af3547',2.6,3.1));
    }else if(o.kind==='barrier'){
      this.box(root,3.3,.85,.8,C.edge,0,.7);for(let i=-2;i<=2;i++)this.box(root,.3,.86,.84,i%2?C.steel:C.gold,i*.62,.7);this.box(root,3.55,.15,1,C.steel,0,.3);view.labels.push(this.label(root,'AVOID','ROADBLOCK','#876023',2.5,2));
    }else if(o.kind==='boss'){
      // A solid, lit 3D command tank: tracks, suspension, sloped armor and an articulated twin turret.
      for(const side of[-1,1]){this.box(root,.75,.95,4.2,0x203039,side*1.7,.8);for(let i=-2;i<=2;i++){const wheel=this.cylinder(root,.36,.78,0x52626c,side*1.7,.72,i*.74);wheel.rotation.z=Math.PI/2;}}
      const hull=this.box(root,3.1,.85,3.7,0x536c72,0,1.2);hull.rotation.x=.04;this.box(root,2.7,.16,3.3,0x839499,0,1.7);const turret=new THREE.Group();turret.position.y=1.8;root.add(turret);view.turret=turret;this.box(turret,2.1,.8,1.8,0x374954,0,.25);this.box(turret,1.6,.1,1.3,C.red,0,.71);
      for(const side of[-1,1]){const barrel=this.cylinder(turret,.13,2.6,0x1a2e3a,side*.48,.32,1.7);barrel.rotation.x=Math.PI/2;this.box(turret,.35,.3,.4,C.red,side*.48,.32,2.92);this.box(root,.4,.12,.06,0xffe0a1,side*1.15,1.25,1.9)}
      view.labels.push(this.label(root,'COMMAND','ARMORED TARGET','#af3547',3.7,3.5));
    }
    if(o.kind==='enemy'||o.kind==='boss'){
      const warning=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xff5047,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}));warning.rotation.x=-Math.PI/2;warning.position.y=.29;warning.userData.ownedGeometry=true;this.scene.add(warning);view.warning=warning;
    }
    this.views.set(o.id,view);return view;
  }
  disposeView(view){
    if(view.warning){this.scene.remove(view.warning);view.warning.geometry.dispose();view.warning.material.dispose()}
    this.scene.remove(view.root);view.units.filter(Boolean).forEach(u=>this.disposeUnit(u));
    view.root.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();if(o.isSprite){o.material.map?.dispose();o.material.dispose()}else if(o.material?.type==='MeshBasicMaterial'&&o.material!==this.shadowMaterial)o.material.dispose()});
  }
  disposeUnit(unit){unit.userData.mixer.stopAllAction();unit.userData.mixer.uncacheRoot(unit.userData.model);const seen=new Set();unit.userData.model.traverse(o=>{if(o.isSkinnedMesh&&!seen.has(o.skeleton)){seen.add(o.skeleton);o.skeleton.dispose()}});}
  retire(unit){if(this.corpses.length>=16){this.disposeUnit(unit);unit.removeFromParent();return}this.scene.attach(unit);unit.userData.mixer.stopAllAction();unit.userData.death.reset().play();this.corpses.push({unit,life:.8});}
  casualty(object,previous){const view=this.views.get(object.id);if(!view)return;view.root.position.z=object.z;for(let i=object.remaining;i<previous;i++){const unit=view.units[i];if(unit){this.retire(unit);view.units[i]=null}}}
  reset(){for(const view of this.views.values())this.disposeView(view);this.views.clear();for(const m of this.shots.values())this.scene.remove(m);this.shots.clear();for(const c of this.corpses){this.disposeUnit(c.unit);c.unit.removeFromParent()}this.corpses=[];for(const p of this.particles){p.mesh.visible=false;this.pool.push(p.mesh)}this.particles=[];this.shake=0;this.setSquad(12,true);}
  burst(x,z,color=0xffc778,count=12,big=false){
    if(this.reduced)count=Math.min(count,6);
    for(let i=0;i<count&&this.particles.length<150;i++){
      let mesh=this.pool.pop();if(!mesh){mesh=new THREE.Mesh(this.particleGeometry,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}));this.scene.add(mesh)}mesh.visible=true;mesh.material.color.setHex(color);mesh.material.opacity=1;const size=(big?.12:.065)+Math.random()*.1;mesh.scale.setScalar(size);mesh.position.set(x,.7,z);this.particles.push({mesh,life:.4+Math.random()*.4,total:.8,vx:(Math.random()-.5)*(big?9:4),vy:1+Math.random()*5,vz:(Math.random()-.5)*5});
    }
    if(big&&!this.reduced)this.shake=.2;
  }
  advanceFX(dt){for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.vy-=12*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;if(p.mesh.position.y<.29){p.mesh.position.y=.29;p.vy=Math.abs(p.vy)*.3;p.vx*=.8}p.mesh.material.opacity=clamp(p.life/.3,0,1);if(p.life<=0){p.mesh.visible=false;this.pool.push(p.mesh);this.particles.splice(i,1)}}}
  road(distance){for(let i=0;i<this.tiles.length;i++)this.tiles[i].position.z=roadTileZ(i,distance);for(const prop of this.props)prop.position.z=sceneryZ(prop.userData.offset,distance);}
  draw(run,dt,active=true){
    if(run&&this.mission!==run.mission){this.mission=run.mission;const palettes=[{fog:0x94c9d7,road:0x839495,water:0x218fa8},{fog:0xd6c6b0,road:0x9b927e,water:0x337a88},{fog:0x7f9eae,road:0x677e91,water:0x28516c}],p=palettes[this.mission];this.scene.background.setHex(p.fog);this.scene.fog.color.setHex(p.fog);this.mat(C.road).color.setHex(p.road);this.mat(0x218fa8,.24).color.setHex(p.water);}
    this.clock+=active?dt:0;this.advanceFX(active?dt:0);this.road(run?.distance||0);
    if(active)for(let i=this.corpses.length-1;i>=0;i--){const c=this.corpses[i];c.life-=dt;c.unit.userData.mixer.update(dt);if(c.life<.18)c.unit.scale.setScalar(Math.max(0,c.life/.18));if(c.life<=0){this.disposeUnit(c.unit);c.unit.removeFromParent();this.corpses.splice(i,1)}}
    if(this.characters){
      const count=run?.force??12;if(count!==this.units.length)this.setSquad(count);const x=run?.x||0;this.aim.position.x=x;this.aim.visible=!!run&&run.status==='playing';
      this.units.forEach(u=>{const d=u.userData;this.equip(u,run?.weapon||'rifle');d.born=Math.min(1,d.born+dt*5);u.scale.setScalar(d.born);u.position.x+=(x+d.tx-u.position.x)*(1-Math.exp(-18*dt));u.position.z=PLAYER_Z+d.tz;d.action.setEffectiveWeight(run?.bossEngaged?0:1);d.stationary.setEffectiveWeight(run?.bossEngaged?1:0);if(active)d.mixer.update(dt);});
    }
    if(run){
      const ids=new Set(run.objects.map(o=>o.id));for(const[id,v]of this.views)if(!ids.has(id)){this.disposeView(v);this.views.delete(id)}
      for(const o of run.objects){const v=this.views.get(o.id)||this.create(o);v.root.position.set(o.x,0,o.z);v.root.visible=o.z>-55;
        if(v.warning){v.warning.visible=o.warning>0;const dz=PLAYER_Z-o.z,dx=(o.aimX||0)-o.x;v.warning.position.set(o.x+dx/2,.29,o.z+dz/2);v.warning.scale.set(o.kind==='boss'?2.4:1.4,Math.hypot(dx,dz),1);v.warning.rotation.set(-Math.PI/2,0,-Math.atan2(dx,dz));v.warning.material.opacity=.15+(1-o.warning/(o.warningDuration||.9))*.22;}
        if(o.kind==='gates')o.choices.forEach((g,i)=>{this.writeLabel(v.labels[i],g.type==='multiply'?'×'+g.value.toFixed(1):(g.value>=0?'+':'')+g.value,g.type==='multiply'?'MULTIPLY':'RECRUIT',g.value<0?'#b83d4c':g.type==='multiply'?'#157653':'#147caa');v['rail'+i].scale.x=4.25*(.1+.9*g.charge/g.chargeRequired)});
        if(o.kind==='weapon'||o.kind==='supply')this.writeLabel(v.labels[0],Math.max(0,Math.ceil(o.hp)),o.kind==='weapon'?WEAPONS[o.weapon].name:`+${o.reward} SQUAD`,'#263f50');
        if(o.kind==='enemy'){this.writeLabel(v.labels[0],o.remaining,o.warning>0?'INCOMING':'HOSTILES',o.warning>0?'#e25143':'#af3547');v.units.forEach((u,i)=>{if(!u)return;u.visible=i<o.remaining;if(u.visible&&v.root.visible&&active)u.userData.mixer.update(dt)});}
        if(o.kind==='boss')v.turret.rotation.y=Math.atan2(run.x-o.x,PLAYER_Z-o.z)*.65;
        if(o.flash>0&&!this.reduced)v.root.position.y=.035;
      }
      const bulletIds=new Set(run.bullets.map(b=>b.id));for(const[id,m]of this.shots)if(!bulletIds.has(id)){this.scene.remove(m);this.shots.delete(id)}
      for(const b of run.bullets){let m=this.shots.get(b.id);if(!m){const color=b.team==='red'?0xff483f:WEAPONS[b.weapon].color;const key='shot'+color;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshBasicMaterial({color}));m=new THREE.Mesh(this.unitGeometry,this.materials.get(key));m.scale.set(b.team==='red'?.16:.075,b.team==='red'?.16:.075,b.weapon==='flame'?.45:.8);this.scene.add(m);this.shots.set(b.id,m)}m.position.set(b.x,1.05,b.z);m.rotation.y=Math.atan2(b.vx,b.vz);}
    }
    this.shake=Math.max(0,this.shake-dt);this.camera.position.x=this.reduced?0:Math.sin(this.clock*79)*this.shake*.2;this.renderer.render(this.scene,this.camera);
  }
  resize(){const width=this.host.clientWidth||400,height=this.host.clientHeight||700;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.fov=2*Math.atan(6.2/(35.5*this.camera.aspect))*180/Math.PI;this.camera.updateProjectionMatrix();}
}
