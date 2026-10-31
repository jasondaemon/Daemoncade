import * as THREE from '../../vendor/three/three.module.min.js';
import {GLTFLoader} from '../../vendor/three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from '../../vendor/three/addons/utils/BufferGeometryUtils.js';
import {BASECAMP_TRAILS} from './worlds.js?v=ocean10';
import {deepGround,deepPrimitive} from './deep-art.js?v=reef24';
import {marinePrimitive,animateMarine} from './marine-art.js?v=marine25';
import {alienGround,alienPrimitive} from './alien-art.js?v=qualification52';
import {ALIEN_GROVES,groveCharge} from './alien.js?v=groves30';
import {orbitGround,orbitPrimitive} from './orbit-art.js?v=collapse29';
import {ORBIT_LANES} from './orbit.js?v=collapse29';
import {openingProgress} from './surfaces.js?v=quality14';
import {animatePod,LocalPulses} from './presentation.js?v=payoff26';
import {sampleContactShape} from './contact-shape.js?v=contact15';
import {forestColor,forestHeight,trailRibbon} from './forest.js?v=camp-life32';
import {campPrimitive,campPond} from './camp-art.js?v=references35';
import {GrowthCamera} from './camera.js?v=release48';
import {rimGeometry,characterRim} from './rim-art.js?v=sculpt51';
import {detailedPrimitive} from './detailed-art.js?v=identity23';
import {sourceKey} from './world-dressing.js?v=release48';
import {CITY_BLOCKS,CITY_STREETS,curbIntervals} from './city-layout.js?v=identity23';
import {personPrimitive,personAttributes,animatePeople,footLift} from './people-art.js?v=camp-life32';
import {signalPrimitive,signalAttributes,animateSignals} from './signal-art.js?v=identity23';
import {modelPaths} from './assets.js?v=package37';
import {parkPrimitive,parkWaterAttributes,animateFountain} from './park-art.js?v=parks42';
import {groundFinish} from './finishes.js?v=release48';
import {ascensionPrimitive,ascensionGround,updateAscensionGround,quantumAttributes,animateQuantum} from './ascension-art.js?v=release48';

export class MetroRenderer {
 constructor(host){
  this.alienCharges={value:new Float32Array(6)};
  this.host=host;this.marineTime={value:0};this.signalTime={value:0};this.waterTime={value:0};this.underwater={value:0};this.cosmic={value:0};this.orbitContraction={value:1};this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.hole=new THREE.Vector3(-26,32,1.2);this.holes=[this.hole,...Array.from({length:3},()=>new THREE.Vector3())];this.holeCount={value:1};this.batches=[];this.scratch=new THREE.Object3D();this.offset=new THREE.Vector3();this.materials=new Map();this.sources=new Map();
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;host.append(this.renderer.domElement);
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#9abdb6');this.scene.fog=new THREE.Fog('#9abdb6',95,180);
  this.camera=new THREE.PerspectiveCamera(40,1,.75,800);this.camera.position.set(-26,36,66);this.look=new THREE.Vector3(-26,0,32);this.growthCamera=new GrowthCamera();
  this.scene.add(new THREE.HemisphereLight(0xe1f0ff,0x637665,2.1));this.sun=new THREE.DirectionalLight(0xffe6b3,3);this.sun.position.set(-35,60,15);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-37,right:37,top:37,bottom:-37,near:1,far:150});this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=.04;this.scene.add(this.sun);this.scene.add(this.sun.target);
  this.ground=new THREE.Group();this.scene.add(this.ground);this.buildGround();this.buildHole();this.rivalWells=[];
  for(const color of[0x7ab8ef,0xff9a73,0xc3a0ff]){const well=this.well.clone(true);well.children[2].material=this.rimMaterial.clone();well.children[2].material.color.setHex(color);well.children[2].material.emissive.setHex(color);well.visible=false;this.scene.add(well);this.rivalWells.push(well);}
  this.dust=[];this.debris=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.045,0),this.mat(0xc5b795),24);this.debris.frustumCulled=false;this.scene.add(this.debris);
  this.pulses=new LocalPulses(this.scene);
  this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
  this.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();host.dispatchEvent(new Event('renderlost'));});
  this.renderer.domElement.addEventListener('webglcontextrestored',()=>host.dispatchEvent(new Event('renderrestored')));
 }
 mat(color,ground=false){
  const key=color+':'+ground;if(this.materials.has(key))return this.materials.get(key);
  const material=new THREE.MeshStandardMaterial({color,roughness:.92,metalness:.02});
  if(ground){
   material.onBeforeCompile=shader=>{
    shader.uniforms.holes={value:this.holes};shader.uniforms.holeCount=this.holeCount;shader.uniforms.waterTime=this.waterTime;shader.uniforms.underwater=this.underwater;shader.uniforms.cosmic=this.cosmic;shader.uniforms.orbitContraction=this.orbitContraction;shader.vertexShader='varying vec3 vHoleWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvHoleWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vHoleWorld;uniform vec3 holes[4];uniform int holeCount;uniform float waterTime;uniform float underwater;uniform float cosmic;uniform float orbitContraction;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\nfor(int i=0;i<4;i++){if(i<holeCount && distance(vHoleWorld.xz,holes[i].xy)<holes[i].z)discard;}');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(underwater>0.5){float a=sin(vHoleWorld.x*.8+sin(vHoleWorld.z*.65+waterTime*.35));float b=sin(vHoleWorld.z*.9-sin(vHoleWorld.x*.55-waterTime*.25));float c=pow(max(0.0,1.0-abs(a+b)*2.5),5.0);diffuseColor.rgb*=0.93+c*.16;}');
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nif(cosmic>0.5){vec2 cell=floor(vHoleWorld.xz*.45);float seed=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);vec2 center=vec2(fract(seed*31.7),fract(seed*79.3))*.7+.15;float star=(1.0-smoothstep(.012,.065,length(fract(vHoleWorld.xz*.45)-center)))*step(.84,seed);float cloud=pow(.5+.5*sin(vHoleWorld.x*.035+sin(vHoleWorld.z*.026)*2.0),4.0);totalEmissiveRadiance+=vec3(.12,.19,.3)*star*4.0+vec3(.016,.007,.04)*cloud;}');
    const guides=ORBIT_LANES.map(({rx,rz})=>`belt=max(belt,1.0-smoothstep(.025,.09,abs(length(vHoleWorld.xz/vec2(${rx.toFixed(1)},${rz.toFixed(1)}))-orbitContraction)*${Math.min(rx,rz).toFixed(1)}));`).join('');
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\nif(cosmic>0.5){float belt=0.0;${guides}totalEmissiveRadiance+=vec3(.035,.055,.095)*belt;}`);
    if(color===0x88aaa7){
     shader.uniforms.alienCharges=this.alienCharges;
     shader.fragmentShader='uniform float alienCharges[6];\n'+shader.fragmentShader;
     const charges=ALIEN_GROVES.map(([x,z],i)=>`if(distance(vHoleWorld.xz,vec2(${x.toFixed(1)},${z.toFixed(1)}))<8.0)charge=max(charge,alienCharges[${i}]);`).join('');
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat charge=0.0;${charges}diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.8,.5,.12),charge);`);
     shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.14,.07,.01)*charge;');
    }
    if([0x493a61,0x625077,0x55476f,0x3d3454].includes(color)){
     // World-anchored mineral variation: no image tiling, shimmer, extra
     // texture requests or time animation. Keep contrast below the props.
     shader.fragmentShader=`float mineralHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float mineralNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mineralHash(i),mineralHash(i+vec2(1.0,0.0)),f.x),mix(mineralHash(i+vec2(0.0,1.0)),mineralHash(i+vec2(1.0)),f.x),f.y);}
`+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat mineral=mineralNoise(vHoleWorld.xz*.32);float detail=1.0-smoothstep(.35,1.0,length(fwidth(vHoleWorld.xz*3.0)));float fleck=(mineralNoise(vHoleWorld.xz*3.0)-.5)*detail;diffuseColor.rgb*=.94+mineral*.10+fleck*.035;');
    }
    if(color===0x528e99)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.97+.035*sin(vHoleWorld.x*1.8+sin(vHoleWorld.z*1.2+waterTime*.7));');
   };
   material.customProgramCacheKey=()=> 'sinkhole-ground-space-v8'+(color===0x88aaa7?'-roots':'')+(color===0x528e99?'-pond':'')+([0x493a61,0x625077,0x55476f,0x3d3454].includes(color)?'-mineral':'');
   this.terrainFinish??={value:1};groundFinish(material,this.terrainFinish);
  }
  this.materials.set(key,material);return material;
 }
 box(parent,w,h,d,color,x=0,y=0,z=0,ground=false){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.mat(color,ground));mesh.position.set(x,y+h/2,z);mesh.castShadow=!ground;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 buildGround(world='metro',blocks=CITY_BLOCKS,layoutSeed=0){
  const g=this.ground;for(const mesh of [...g.children]){g.remove(mesh);mesh.geometry.dispose();if(mesh.userData.ownedMaterial)mesh.material.dispose();}
  this.groundWorld=world;this.groundLayoutSeed=layoutSeed;
  if(world==='ascension'){ascensionGround(this,g,layoutSeed);return;}
  const camp=world==='basecamp',deep=world==='deep',alien=world==='alien',orbit=world==='orbit';this.underwater.value=deep?1:0;this.cosmic.value=orbit?1:0;this.scene.background.setHex(orbit?0x10182f:alien?0x81739d:deep?0x397f8c:camp?0xb6c9ac:0x9abdb6);this.scene.fog.color.copy(this.scene.background);this.scene.fog.near=deep?65:95;this.scene.fog.far=deep?155:180;
  this.sun.color.setHex(deep?0xc6f1ee:0xffe6b3);this.sun.intensity=deep?2.3:3;
  if(!deep&&!alien&&!orbit)this.box(g,360,.2,360,camp?0x819460:0x879a83,0,-.22,0,true);
  if(orbit){orbitGround(this,g);}else if(alien){alienGround(this,g);}else if(deep){deepGround(this,g);}else if(camp){
   const terrain=new THREE.PlaneGeometry(144,144,96,96);terrain.rotateX(-Math.PI/2);
   const p=terrain.attributes.position,colors=new Float32Array(p.count*3),c=new THREE.Color();
   for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,forestHeight(x,z));c.setRGB(...forestColor(x,z),THREE.SRGBColorSpace);colors.set([c.r,c.g,c.b],i*3);}
   terrain.setAttribute('color',new THREE.BufferAttribute(colors,3));terrain.computeVertexNormals();const material=this.mat(0xffffff,true);material.vertexColors=true;g.add(new THREE.Mesh(terrain,material));
   campPond(this,g);
   for(const points of BASECAMP_TRAILS){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p.x,.025,p.z))),positions=trailRibbon(curve.getPoints(80));
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();g.add(new THREE.Mesh(geometry,this.mat(0xb29b70,true)));
    for(const p of[points[0],points.at(-1)]){const indexed=new THREE.CircleGeometry(1.6,16),geometry=indexed.toNonIndexed();indexed.dispose();geometry.deleteAttribute('uv');const cap=new THREE.Mesh(geometry,this.mat(0xb29b70,true));cap.rotation.x=-Math.PI/2;cap.position.set(p.x,.026,p.z);g.add(cap);}
   }
   for(let i=0;i<24;i++){const a=i*Math.PI*2/24,r=64+(i%3)*3;const hill=new THREE.Mesh(new THREE.SphereGeometry(7+(i%4),10,6),this.mat(i%2?0x6f865c:0x788d60,true));hill.position.set(Math.cos(a)*r,-4,Math.sin(a)*r);hill.scale.y=.7;g.add(hill);}
  }else{
  for(const s of CITY_STREETS){const vertical=s.axis==='z',length=s.max-s.min,mid=(s.max+s.min)/2;
   this.box(g,vertical?s.width+4:length,.03,vertical?length:s.width+4,0xc3c4b4,vertical?s.at:mid,-.015,vertical?mid:s.at,true);
   this.box(g,vertical?s.width:length,.018,vertical?length:s.width,0x465861,vertical?s.at:mid,.025,vertical?mid:s.at,true);
   for(let a=s.min+3;a<s.max-2;a+=7){
    if(CITY_STREETS.some(c=>c.axis!==s.axis&&Math.abs(c.at-a)<c.width/2+1.5))continue;
    this.box(g,vertical?.12:2.4,.01,vertical?2.4:.12,0xd8c797,vertical?s.at:a,.05,vertical?a:s.at,true);
   }
   for(const [a,b]of curbIntervals(s))for(const side of[-1,1]){
    const edge=s.at+side*s.width/2,mid=(a+b)/2;
    this.box(g,vertical?.15:b-a,.065,vertical?b-a:.15,0xc3c4b4,vertical?edge:mid,.038,vertical?mid:edge,true);
    // A quiet paving seam belongs to the sidewalk, not a parking-space outline.
    this.box(g,vertical?.035:b-a,.008,vertical?b-a:.035,0xacb5a1,vertical?edge+side*1.1:mid,.04,vertical?mid:edge+side*1.1,true);
   }
  }
  for(const [x,z]of[[-25.7,-11],[.5,15],[25.7,-36]]){
   const cover=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.014,20),this.mat(0x53626a,true));cover.position.set(x,.055,z);g.add(cover);
   for(const dx of[-.18,0,.18])this.box(g,.025,.006,.5,0x465861,x+dx,.064,z,true);
  }
  for(const z of[-24,2,28])for(const x of[-26,0,26])for(let i=-2;i<=2;i++)for(const side of[-1,1])this.box(g,.5,.012,1.4,0xe1e3ce,x+i*.85,.065,z+side*5.8,true);
  // Quiet variations in paving give scale without a noisy repeated photographic texture.
  for(const {x,z,kind}of blocks){
   const green=['park','garden','tower'].includes(kind),work=['depot','works','yard'].includes(kind),market=['market','arcade'].includes(kind);
   this.box(g,13.5,.025,14,green?0x8f9e75:work?0xa3a59a:0xb8b6a2,x,.015,z,true);
   if(green){
    this.box(g,kind==='park'?2.3:1.2,.014,14,0xc7b69b,x+(kind==='park'?0:1.2),.045,z,true);this.box(g,12,.014,kind==='park'?2:1,0xc7b69b,x,.047,z+(kind==='park'?0:2.2),true);
    if(kind==='park'){const plaza=new THREE.Mesh(new THREE.CylinderGeometry(3,3,.022,32),this.mat(0xc7b69b,true));plaza.position.set(x,.065,z);g.add(plaza);}
    for(const [dx,dz]of[[-3.5,-3.8],[3.6,3.2]])this.box(g,3.2,.018,2.6,0x7c956d,x+dx,.04,z+dz,true);
   }else if(work){
    for(let i=0;i<3;i++){this.box(g,2,.012,.08,0xd8dac5,x-3+i*2.7,.055,z+5.7,true);this.box(g,.08,.012,2.7,0xd8dac5,x-4+i*2.7,.055,z+4.4,true);}
    this.box(g,11,.012,.7,0xc7b69b,x,.06,z-6.5,true);
   }else if(market){
    this.box(g,12,.014,5.8,0xc7b69b,x,.046,z+4.1,true);for(let i=0;i<7;i++)this.box(g,.045,.008,5.6,0xae9b7e,x-5.4+i*1.8,.06,z+4.1,true);
   }else if(kind==='square'||kind==='civic'){
    this.box(g,8,.014,5,0xc7b69b,x,.045,z+4.3,true);for(const dx of[-4.6,4.6])this.box(g,1.1,.015,4.2,0x8f9e75,x+dx,.05,z+4.4,true);
   }else{
    this.box(g,1.2,.014,13,0xc7b69b,x,.045,z,true);this.box(g,11,.012,.9,0xc7b69b,x,.048,z+6.6,true);
   }
  }
  // Boundaries stay visible and read as a neighbourhood, rather than an empty void.
  for(const side of[-1,1]){this.box(g,116,.18,.5,0x718b7c,0,-.02,side*56,true);this.box(g,.5,.18,116,0x718b7c,side*56,-.02,0,true);}
  }
  // Static street surfaces share a handful of draw calls and the same hole cut-out shader.
  const groups=new Map(),ownedMaterials=new Set();for(const mesh of [...g.children])if(mesh.isMesh){mesh.updateMatrix();const geom=mesh.geometry.clone().applyMatrix4(mesh.matrix);if(mesh.userData.ownedMaterial)ownedMaterials.add(mesh.material);if(!groups.has(mesh.material))groups.set(mesh.material,[]);groups.get(mesh.material).push(geom);g.remove(mesh);mesh.geometry.dispose();}
  for(const [material,parts]of groups){const mesh=new THREE.Mesh(mergeGeometries(parts,false),material);mesh.userData.ownedMaterial=ownedMaterials.has(material);mesh.receiveShadow=true;g.add(mesh);parts.forEach(x=>x.dispose());}
 }
 buildHole(){
  this.well=new THREE.Group();this.scene.add(this.well);
  const wallMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying float depth;void main(){depth=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying float depth;void main(){float rim=smoothstep(-4.5,4.5,depth);gl_FragColor=vec4(mix(vec3(.006,.012,.018),vec3(.17,.20,.18),rim*rim),1.0);}'});
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(1,1,9,64,1,true),wallMaterial);wall.position.y=-4.5;this.well.add(wall);
  const bottom=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({color:0x010408}));bottom.rotation.x=-Math.PI/2;bottom.position.y=-8.99;this.well.add(bottom);
  this.rimMaterial=new THREE.MeshStandardMaterial({color:0x82d9c7,emissive:0x82d9c7,emissiveIntensity:.18,roughness:.65});
  this.rimStyles=new Map([['plain',rimGeometry()]]);this.rimPreviews=new Map();
  const rim=new THREE.Mesh(this.rimStyles.get('plain'),this.rimMaterial);rim.rotation.x=Math.PI/2;rim.position.y=.075;this.well.add(rim);
 }
 setRim(color,style='plain'){
  if(!['plain','segments','rays','facets','satellites','crown','vortex'].includes(style)&&!characterRim(style))style='plain';
  if(!this.rimStyles.has(style))this.rimStyles.set(style,rimGeometry(style));
  this.well.children[2].geometry=this.rimStyles.get(style);
  const character=characterRim(style);
  if(this.rimMaterial.vertexColors!==character){this.rimMaterial.vertexColors=character;this.rimMaterial.needsUpdate=true;}
  this.rimMaterial.color.setHex(character?0xffffff:color);this.rimMaterial.emissive.setHex(character?0x000000:color);if(this.run)this.render(this.run,0);
 }
 rimPreview(color,style='plain'){
  const key=`${style}:${color}`;if(this.rimPreviews.has(key))return this.rimPreviews.get(key);
  if(!this.rimStyles.has(style))this.rimStyles.set(style,rimGeometry(style));
  // Reuse the game's context, not a WebGL canvas per card. Render once into a
  // small offscreen target and retain only its PNG; temporary GPU assets die here.
  const size=128,target=new THREE.WebGLRenderTarget(size,size);target.texture.colorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2.12,2.12,2.12,-2.12,.1,20);
  camera.position.set(0,4,2.6);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xe1f0ff,0x637665,2.1));const light=new THREE.DirectionalLight(0xffe6b3,3);light.position.set(-3,6,2);scene.add(light);
  const material=new THREE.MeshStandardMaterial({color:characterRim(style)?0xffffff:color,vertexColors:characterRim(style),roughness:.65});
  const mesh=new THREE.Mesh(this.rimStyles.get(style),material);mesh.rotation.x=Math.PI/2;mesh.position.y=.075;scene.add(mesh);
  const diskGeometry=new THREE.CircleGeometry(1,64),diskMaterial=new THREE.MeshBasicMaterial({color:0x02080c}),disk=new THREE.Mesh(diskGeometry,diskMaterial);disk.rotation.x=-Math.PI/2;disk.position.y=.01;scene.add(disk);
  const renderer=this.renderer,oldTarget=renderer.getRenderTarget(),oldColor=renderer.getClearColor(new THREE.Color()),oldAlpha=renderer.getClearAlpha(),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest();
  try{
   renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(scene,camera);
   const pixels=new Uint8Array(size*size*4),flipped=new Uint8ClampedArray(pixels.length);renderer.readRenderTargetPixels(target,0,0,size,size,pixels);
   for(let y=0;y<size;y++)flipped.set(pixels.subarray(y*size*4,(y+1)*size*4),(size-y-1)*size*4);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').putImageData(new ImageData(flipped,size,size),0,0);
   const url=canvas.toDataURL('image/png');this.rimPreviews.set(key,url);return url;
  }finally{
   renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.setClearColor(oldColor,oldAlpha);
   target.dispose();material.dispose();diskMaterial.dispose();diskGeometry.dispose();
  }
 }
 async load(run,progress=()=>{}){
  const loader=new GLTFLoader(),paths=modelPaths(run.world,run.arena);
  const sources=new Map(),generation=(this.loadGeneration||0)+1;this.loadGeneration=generation;let done=0;
  const loadScene=path=>new Promise((resolve,reject)=>{
   let expired=false;const timer=setTimeout(()=>{expired=true;reject(Error('Model loading timed out. Check your connection and retry.'));},20000);
   loader.loadAsync(path).then(({scene})=>{clearTimeout(timer);if(expired||generation!==this.loadGeneration){this.disposeSources(new Map([['late',scene]]));if(!expired)reject(Error('Scene load replaced'));}else resolve(scene);},error=>{clearTimeout(timer);reject(error);});
  });
  const results=await Promise.allSettled(Object.entries(paths).map(async([type,path])=>{sources.set(type,await loadScene(path));if(generation===this.loadGeneration)progress(++done,Object.keys(paths).length);}));
  const failed=results.find(r=>r.status==='rejected');if(failed){this.disposeSources(sources);throw failed.reason;}
  if(generation!==this.loadGeneration){this.disposeSources(sources);return;}const previous=this.sources;this.sources=sources;
  this.reset(run);this.disposeSources(previous);
 }
 disposeSources(sources){
  if(!sources)return;const textures=new Set(),materials=new Set(),geometries=new Set();
  for(const root of sources.values())root.traverse(m=>{
   if(!m.isMesh)return;geometries.add(m.geometry);
   if(root.userData.authored)return;
   for(const mat of(Array.isArray(m.material)?m.material:[m.material])){
    materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);
   }
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source.data?.close?.();});
 }
 primitive(type){
  const scale=ascensionPrimitive(this,type);if(scale)return scale;
  const park=parkPrimitive(this,type);if(park)return park;
  const camp=campPrimitive(this,type);if(camp)return camp;
  if(type==='lamp:signal')return signalPrimitive(this);
  if(type==='person'||type.startsWith('person@'))return personPrimitive(this,Number(type.split('@')[1])||0);
  const detailed=detailedPrimitive(this,type);if(detailed)return detailed;
  const space=orbitPrimitive(this,type);if(space)return space;
  const alien=alienPrimitive(this,type);if(alien)return alien;
  const marine=marinePrimitive(this,type);if(marine)return marine;
  const underwater=deepPrimitive(this,type);if(underwater)return underwater;
  const root=new THREE.Group();root.userData.authored=true;
  if(type==='cabin'||type==='landmark:lodge'){
   const lodge=type==='landmark:lodge',w=lodge?8:5,d=lodge?6:4,h=lodge?4.2:2.8;
   this.box(root,w,h,d,0xb38a55);this.box(root,w+.25,.25,d+.25,0x765738,0,.15);
   for(const side of[-1,1]){const roof=this.box(root,w*.62,.22,d+.9,0x435e53,side*w*.24,h+.45);roof.rotation.z=-side*.5;}
   for(const side of[-1,1])for(const x of[-w*.3,w*.3]){this.box(root,1.05,1,.09,0x83b1b5,x,1.1,side*(d/2+.05));this.box(root,1.2,.1,.2,0xe0c48d,x,1,side*(d/2+.1));}
   this.box(root,1.05,2,.12,0x4b6056,0,0,d/2+.1);this.box(root,w*.7,.15,1.2,0xbca275,0,.2,d/2+.6);
   if(lodge){for(const x of[-2.8,2.8])this.box(root,.2,3.1,.2,0x6c553c,x,.2,d/2+1);this.box(root,6,.22,1.8,0x435e53,0,3.25,d/2+.5);this.box(root,.8,2,.8,0xa39b7f,2.2,h,-1);}
  }else if(type==='cooler'){
   this.box(root,.7,.5,.48,0x4e9290);this.box(root,.76,.1,.54,0xe9e2c7,0,.5);for(const x of[-.38,.38])this.box(root,.05,.22,.25,0xe9e2c7,x,.28);this.box(root,.12,.08,.02,0x3b5552,0,.43,.25);
  }else if(type==='log'){
   for(const z of[-.12,.12]){const log=new THREE.Mesh(new THREE.CylinderGeometry(.2,.22,1.4,8),this.mat(0x79543a));log.rotation.z=Math.PI/2;log.position.set(0,.23,z);root.add(log);for(const x of[-.71,.71]){const end=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.02,8),this.mat(0xc9a371));end.rotation.z=Math.PI/2;end.position.set(x,.23,z);root.add(end);}}
  }else if(type==='firepit'){
   const ash=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.035,16),this.mat(0x3e4038));ash.position.y=.04;root.add(ash);
   for(let i=0;i<6;i++){const a=i*2.4,coal=new THREE.Mesh(new THREE.IcosahedronGeometry(.065,0),this.mat(i%2?0xb56e3e:0x726151));coal.position.set(Math.cos(a)*.25,.09,Math.sin(a)*.25);root.add(coal);}
   for(let i=0;i<9;i++){const a=i*Math.PI*2/9,rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,0),this.mat(i%2?0x909386:0x777e73));rock.position.set(Math.cos(a)*.5,.15,Math.sin(a)*.5);rock.scale.y=.65;root.add(rock);}for(const a of[-.5,.6]){const log=this.box(root,.7,.14,.14,0x5d4938,0,.1);log.rotation.y=a;}
  }else if(type==='picnic'){
   for(const z of[-.57,.57])this.box(root,1.9,.12,.3,0xb99560,0,.4,z);for(let i=-2;i<=2;i++)this.box(root,1.9,.12,.15,0xcaaa75,0,.85,i*.16);for(const x of[-.6,.6]){this.box(root,.12,.85,1.4,0x4f6456,x);}
  }else if(type==='rv'){
   this.box(root,2.1,1.9,4.3,0xebe0be,0,.55);this.box(root,2.14,.24,4.34,0x59928c,0,1.05);this.box(root,2.15,.15,4.4,0xf4e9ce,0,2.45);
   this.box(root,1.65,.65,.05,0x416971,0,1.65,2.18);this.box(root,1.6,.24,.1,0xb4bbab,0,.65,2.2);
   for(const x of[-1.08,1.08]){for(const z of[-1.15,1.15]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.22,12),this.mat(0x33443e));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.4,z);root.add(wheel);}for(const z of[-1,1])this.box(root,.04,.65,.9,0x416971,x,1.6,z);}
   this.box(root,.05,1.5,.75,0xceb991,1.08,.65,0);this.box(root,.75,.2,1,0xa4b0a0,0,2.6,-.5);
  }else if(type.startsWith('building:')){
   const variant=type.split(':')[1],wall=0xdfcfac,roof=0x385462,glass=0x70acb5,trim=0xcc7758;
   const height=variant==='apartments'?8.4:variant==='market'?4.4:3.6;
   this.box(root,6,height,5,wall);this.box(root,6.4,.25,5.4,roof,0,height);
   this.box(root,6.3,.18,.18,trim,0,height-.5,2.57);
   if(variant==='apartments'){
    for(const side of[-1,1])for(let floor=0;floor<3;floor++)for(const x of[-1.9,0,1.9]){
     const y=1+floor*2.5,z=side*2.53;
     this.box(root,1.15,1.45,.08,glass,x,y,z);this.box(root,1.35,.12,.55,roof,x,y-.12,z+side*.2);
     this.box(root,.07,1.5,.12,wall,x,y,z+side*.06);
    }
    this.box(root,1.1,1.9,.1,roof,0,0,2.6);this.box(root,1.7,.18,1.2,trim,0,2,2.9);
    this.box(root,1.4,.8,1.2,wall,1.3,height+.25,-.8);
   }else{
    for(const x of[-1.9,0,1.9]){
     this.box(root,1.45,1.8,.08,glass,x,.6,2.54);
     this.box(root,1.6,.13,.8,trim,x,2.6,2.8);
     this.box(root,1.6,.1,.25,wall,x,2.55,3.1);
    }
    this.box(root,3.2,.6,.12,roof,0,3,2.6);
    for(const x of[-1,0,1])this.box(root,.45,.12,.05,wall,x,3.24,2.69);
    if(variant==='market'){
     for(const x of[-1.6,1.6])this.box(root,1.7,.55,2.5,glass,x,height+.25,0);
     for(const x of[-2.4,2.4])this.box(root,.18,2.6,.18,roof,x,0,3.08);
    }else{
     this.box(root,1.3,.6,1.3,roof,-1.4,height+.25,-.8);
     this.box(root,.6,.35,.6,wall,1.6,height+.25,1);
    }
   }
  }else if(type==='crate'){
   this.box(root,.7,.12,.65,0xa57248);for(const x of[-.32,.32])this.box(root,.07,.45,.65,0xc49663,x,.1);
   for(const z of[-.29,.29])for(const y of[.16,.39])this.box(root,.7,.12,.07,0xc49663,0,y,z);
   for(let i=0;i<6;i++){const fruit=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,1),this.mat(0xd99c42));fruit.position.set((i%3-1)*.19,.35,(Math.floor(i/3)-.5)*.22);root.add(fruit);}
  }else if(type==='cart'){
   this.box(root,1.65,.85,.8,0xb58551,0,.22);this.box(root,1.85,.12,1,0xd1ad70,0,1.07);
   for(const x of[-.72,.72]){this.box(root,.08,1.3,.08,0x3a535a,x,1.2);this.box(root,.15,.4,.4,0x3a535a,x,.02);}
   for(let i=0;i<6;i++)this.box(root,.32,.12,1.1,i%2?0xe5dcc4:0xbf7757,(i-2.5)*.32,2.5);
   for(const x of[-.5,0,.5])this.box(root,.3,.18,.5,0x75995b,x,1.19);
  }else if(type==='cone'){
   this.box(root,.44,.07,.44,0x263d42);const cone=new THREE.Mesh(new THREE.ConeGeometry(.19,.65,8),this.mat(0xee8d4c));cone.position.y=.37;root.add(cone);
   const stripe=new THREE.Mesh(new THREE.CylinderGeometry(.085,.12,.12,8),this.mat(0xfff2d3));stripe.position.y=.4;root.add(stripe);
  }else if(type==='bin'){
   this.box(root,.55,.85,.5,0x356e70);this.box(root,.65,.12,.6,0x183f48,0,.85);this.box(root,.25,.08,.02,0xe5d7a1,0,.55,.26);
  }else if(type==='bench'){
   for(let i=0;i<4;i++)this.box(root,1.55,.09,.12,0xb78651,0,.47,(i-1.5)*.16);
   this.box(root,1.55,.45,.09,0xb78651,0,.65,-.29);for(const x of[-.57,.57])this.box(root,.08,.52,.55,0x294d55,x);
  }else if(type==='lamp'){
   this.box(root,.22,.18,.22,0x274a53);this.box(root,.09,3.3,.09,0x274a53,0,.15);this.box(root,.7,.11,.3,0x274a53,.25,3.45);this.box(root,.42,.04,.24,0xffe8ab,.29,3.43);
  }else{
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.17,.2,.7,10),this.mat(0xb0503d));body.position.y=.35;root.add(body);this.box(root,.6,.16,.16,0xb0503d,0,.38);this.box(root,.35,.08,.35,0xddb778,0,.68);
  }
  return root;
 }
 reset(run){
  const layoutSeed=run.world==='metro'?run.seed||0:0;
  if(this.groundWorld!==run.world||this.groundLayoutSeed!==layoutSeed)this.buildGround(run.world,run.cityBlocks||CITY_BLOCKS,layoutSeed);
  this.dust.length=0;
  this.pulses.clear();
  for(const batch of this.batches){this.scene.remove(batch.mesh);batch.mesh.dispose();batch.mesh.geometry.dispose();batch.mesh.material.dispose();batch.mesh.customDepthMaterial?.dispose();}this.batches=[];
  const keyFor=sourceKey;
  const visibleObjects=run.objects;
  const types=[...new Set(visibleObjects.map(keyFor))];
  for(const key of types){
   if(!this.sources.has(key))this.sources.set(key,this.primitive(key));
   const source=this.sources.get(key),objects=visibleObjects.filter(o=>keyFor(o)===key),type=objects[0].type;source.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   if(source.userData.openBoundsExpand){size.x*=source.userData.openBoundsExpand;size.z*=source.userData.openBoundsExpand;}
   // Footprints and model dimensions share one rule. Lamps keep their thin base.
   const scale=(objects[0].modelRadius||objects[0].radius)*1.8/Math.max(.01,Math.hypot(size.x,size.z)),normal=new THREE.Matrix4().makeScale(scale,scale,scale);normal.setPosition(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
   for(const o of objects)o.shape={width:size.x*scale,depth:size.z*scale,height:size.y*scale};
   const parts=new Map();source.traverse(mesh=>{
    if(!mesh.isMesh||Array.isArray(mesh.material))return;
    let geometry=mesh.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(normal,mesh.matrixWorld)),material=mesh.material;
    if(['person','deer','fox'].includes(type))personAttributes(geometry,mesh,normal);
    if(objects[0].signal)signalAttributes(geometry,mesh);
    if(type==='fountain')parkWaterAttributes(geometry,mesh);
    if(type==='quantum')quantumAttributes(geometry,mesh,normal);
    if(source.userData.authored){
     if(geometry.index){const indexed=geometry;geometry=indexed.toNonIndexed();indexed.dispose();}
     const colors=new Float32Array(geometry.attributes.position.count*3),c=material.color,paint=geometry.attributes.color;
     for(let i=0;i<colors.length;i+=3){colors[i]=c.r*(paint?paint.getX(i/3):1);colors[i+1]=c.g*(paint?paint.getY(i/3):1);colors[i+2]=c.b*(paint?paint.getZ(i/3):1);}
     geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
     this.authoredMaterial??=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});material=this.authoredMaterial;
    }
    if(objects[0].rig){
     const color=mesh.material.color.getHex(),roughness=[0x426a74,0x3d6269,0x425c5e,0x425f5a].includes(color)?.24:[0x303d3c,0x3c4844,0x424c46,0xc5a773,0xcbd0ca,0xb8bdb1].includes(color)?.95:.48;
     geometry.setAttribute('campRoughness',new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(roughness),1));
    }
    if(type==='pod'){
     const offsets=new Float32Array(geometry.attributes.position.count*3),normals=new Float32Array(geometry.attributes.normal.array),petal=mesh.userData.petal;
     if(petal){
      const axis=new THREE.Vector3(-petal.z,0,petal.x),hinge=new THREE.Vector3((petal.x*.65-center.x)*scale,(.25-bounds.min.y)*scale,(petal.z*.65-center.z)*scale),q=new THREE.Quaternion().setFromAxisAngle(axis,-.95),v=new THREE.Vector3();
      for(let i=0;i<geometry.attributes.position.count;i++){v.fromBufferAttribute(geometry.attributes.position,i);const target=v.clone().sub(hinge).applyQuaternion(q).add(hinge);target.y=Math.max(.02*scale,target.y);const delta=target.sub(v);offsets.set([delta.x,delta.y,delta.z],i*3);v.fromBufferAttribute(geometry.attributes.normal,i).applyQuaternion(q);normals.set([v.x,v.y,v.z],i*3);}
     }
     geometry.setAttribute('podOpenOffset',new THREE.BufferAttribute(offsets,3));
     geometry.setAttribute('podOpenNormal',new THREE.BufferAttribute(normals,3));
    }
    if(!parts.has(material))parts.set(material,[]);parts.get(material).push(geometry);
   });
   // Animated/opening and fluid/space objects keep their dedicated conservative
   // proxies. Arena explicitly retains the existing rules-v1 box contacts.
   if(!run.arena&&!objects[0].swim&&!objects[0].orbital&&!['pod','quantum'].includes(type)){
    if(!source.userData.contactShape){const triangles=[];for(const geometries of parts.values())for(const geometry of geometries){const p=geometry.attributes.position,index=geometry.index;for(let i=0;i<(index?.count||p.count);i++){const j=index?index.getX(i):i;triangles.push(p.getX(j),p.getY(j),p.getZ(j));}}source.userData.contactShape=sampleContactShape(triangles,objects[0].shape);}
    if(source.userData.contactShape)for(const o of objects)o.shape=source.userData.contactShape;
   }
   for(const [material,geometries]of parts){
    const display=material.clone();display.roughness=.9;
    if(type==='quantum'){display.roughness=.34;display.metalness=.12;}
    if(objects[0].signal)animateSignals(display,this.signalTime);
    if(type==='fountain')animateFountain(display,this.waterTime);
    if(objects[0].variant==='sun'){display.emissive.setHex(0xf7a44e);display.emissiveIntensity=.35;}
    if(type==='quantum'&&['sun','spiral','galaxy','cluster','supercluster','nebula'].includes(objects[0].scaleKind)){display.emissive.setHex(objects[0].scaleKind==='sun'?0xffb66b:0x433f73);display.emissiveIntensity=.18;display.metalness=0;}
    // Keep props opaque: the former radius+3 screen-door cutaway drew an
    // oversized circular artifact through nearby buildings and wrecks.
    // Only ground surfaces clip to the opening; contacts drive prop motion.
    if(objects[0].rig){
     display.onBeforeCompile=shader=>{
      shader.vertexShader='attribute float campRoughness;varying float vCampRoughness;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCampRoughness=campRoughness;');
      shader.fragmentShader='varying float vCampRoughness;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vCampRoughness;');
     };display.customProgramCacheKey=()=> 'camp-surface-finish-v1';
    }
    const mesh=new THREE.InstancedMesh(mergeGeometries(geometries,false),display,objects.length);geometries.forEach(g=>g.dispose());mesh.castShadow=mesh.receiveShadow=!['orbit','ascension'].includes(run.world);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
    // Each batch owns its depth uniforms. Shared shadow materials can otherwise
    // rebind a previous world's disposed atlas during the first new-world pass.
    mesh.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
    if(type==='quantum')animateQuantum(mesh,this.marineTime);
    if(type==='pod')animatePod(mesh,objects.length);
    if(['person','deer','fox'].includes(type)){animatePeople(mesh,objects,this.marineTime);mesh.userData.walkScale=scale;}
    if(objects[0].swim)animateMarine(mesh,objects,type,objects[0].shape,this.marineTime);
    if(type==='fish')for(let i=0;i<objects.length;i++)mesh.setColorAt(i,new THREE.Color([0xffd15f,0x6cd2e2,0xff9d6c,0xa9bff1][objects[i].swim.group%4]));
    if(['car','van','building','warehouse','tree','pine','rv'].includes(type)&&!objects[0].rig&&!objects[0].treeStyle)for(let i=0;i<objects.length;i++){const colors=['tree','pine'].includes(type)?[0xc5df9a,0x8aba90,0xe2d5a6]:[0xffffff,0xb8d8e2,0xe8c6a9,0xbed3bb,0xe6b6ad];mesh.setColorAt(i,new THREE.Color(colors[objects[i].id%colors.length]));}
    this.scene.add(mesh);this.batches.push({mesh,objects,type,states:[]});
   }
  }
  this.snapCamera(run);
 }
 impact(event){
  if(this.low)return;
  for(let i=0;i<3&&this.dust.length<24;i++){
   const a=(event.object.id+i*2.4)*1.7,speed=Math.min(1.5,event.speed*.15);
   this.dust.push({x:event.x,y:.09,z:event.z,vx:Math.cos(a)*speed,vz:Math.sin(a)*speed,vy:.5+i*.15,life:.3+i*.04});
  }
 }
 quality(low){this.low=low;this.renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.5));this.renderer.shadowMap.enabled=!low;this.resize();}
 signal(event,run){if(run.world!=='ascension')this.pulses.event(event,run,this.low||this.reduced);}
 screenPosition(p){const zoom=this.run?.world==='ascension'?this.run.scaleZoom||1:1;const v=this.offset.set(p.x/zoom,.6,p.z/zoom).project(this.camera);return {x:(v.x+1)*50,y:(1-v.y)*50,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<.95&&Math.abs(v.y)<.9};}
 resize(){const {width,height}=this.host.getBoundingClientRect();this.renderer.setSize(width,height,false);this.camera.aspect=width/Math.max(1,height);this.camera.updateProjectionMatrix();if(this.run)this.render(this.run,0);}
 snapCamera(run){const zoom=run.world==='ascension'?run.scaleZoom||1:1;this.look.set(run.player.x/zoom,0,run.player.z/zoom);this.growthCamera.reset(run.world,run.player.radius/zoom);}
 render(run,dt=1/60){
  this.run=run;
  const infinity=run.world==='ascension',zoom=infinity?run.scaleZoom||1:1;
  this.terrainFinish.value=run.world==='orbit'||infinity?0:1;
  const infinityRange=Math.max(28,this.growthCamera.span*Math.max(this.camera.aspect,1/this.camera.aspect)*.8);
  if(infinity)updateAscensionGround(this,run.scaleProgress||0);
  this.well.visible=!infinity||!run.infinityComplete;
  this.ground.visible=!infinity||!run.infinityComplete;
  this.alienCharges.value.fill(0);
  if(run.world==='alien')for(const o of run.objects)if(o.relay)this.alienCharges.value[o.grove]=groveCharge(o,run.time,this.reduced);
  this.orbitContraction.value=run.orbiters[0]?.orbital.contraction??1;
  this.transformsWritten=0;
  const p=infinity?{x:run.player.x/zoom,z:run.player.z/zoom,radius:run.player.radius/zoom}:run.player;this.hole.set(p.x,p.z,p.radius);this.well.position.set(p.x,0,p.z);this.well.scale.set(p.radius,1,p.radius);
  // Keep character heads proportional to their mouths as the hole grows.
  this.well.children[2].scale.z=this.rimMaterial.vertexColors?p.radius:1;
  this.holeCount.value=1+(run.rivals?.length||0);
  this.rivalWells.forEach((well,i)=>{const rival=run.rivals?.[i];well.visible=Boolean(rival);if(rival){const p=rival.player;this.holes[i+1].set(p.x,p.z,p.radius);well.position.set(p.x,0,p.z);well.scale.set(p.radius,1,p.radius);}});
  for(const batch of this.batches){let changed=false,visible=0;for(let i=0;i<batch.objects.length;i++){
   if(batch.type==='pod'){batch.mesh.geometry.attributes.podOpening.setX(i,openingProgress(batch.objects[i],run.time,this.reduced));batch.mesh.geometry.attributes.podOpening.needsUpdate=true;}
   const o=batch.objects[i],displayRadius=o.radius/zoom,tiny=infinity?Math.max(0,Math.min(1,(displayRadius-.055)/.13)):1;
   const culled=infinity&&(tiny===0||displayRadius>14||Math.hypot(o.x/zoom-p.x,o.z/zoom-p.z)>infinityRange+displayRadius*2);
   const state=culled||['consumed','buried'].includes(o.phase)?'hidden':o.phase==='sealed'?'sealed':!infinity&&o.phase==='idle'&&!o.body&&!o.swim&&!o.orbital&&!o.walker&&(!o.traffic||o.traffic.stopped)&&Math.abs(o.rockAngle||0)<.00001?'static':'active';
   if(state!=='hidden')visible++;
   if(infinity&&state==='hidden'){batch.states[i]=state;continue;}
   if(['person','deer','fox'].includes(batch.type)){
    const attributes=batch.mesh.geometry.attributes,pace=o.phase==='idle'&&!o.body?o.walker.pace:0,phase=this.reduced?o.id*2.399:o.walker.gait;
    const hip=batch.type==='fox'?.4:.71,angle=Math.sin(phase)*.7*Math.min(pace,1.4),lift=batch.type==='person'?footLift(phase,pace):.02-(hip-(hip-.05)*Math.cos(angle)-.1*Math.abs(Math.sin(angle)));
    attributes.walkPace.setX(i,pace);attributes.walkPhase.setX(i,phase);attributes.walkLift.setX(i,lift*batch.mesh.userData.walkScale);
    attributes.walkPace.needsUpdate=attributes.walkPhase.needsUpdate=attributes.walkLift.needsUpdate=true;
   }
   if(state!=='active'&&batch.states[i]===state)continue;
   batch.states[i]=state;changed=true;this.transformsWritten++;
   if((run.world==='alien'&&['pod','landmark'].includes(o.type))||(run.world==='orbit'&&o.type==='landmark')){batch.mesh.setColorAt(i,new THREE.Color(state==='sealed'?(o.type==='pod'?0xb3a7c9:0x555268):0xffffff));batch.mesh.instanceColor.needsUpdate=true;}
   const s=this.scratch;s.position.set(o.x,.075+(o.swimY||o.orbitY||0),o.z);s.rotation.set(o.swimPitch||o.orbitPitch||0,o.yaw,this.reduced?0:o.swimRoll||0);s.scale.setScalar(state==='hidden'?0:1);
   if(infinity){
    const t=this.reduced?0:run.time,spin=o.scaleStage<3?.12:o.scaleStage>=14?.035:.015;
    s.position.set(o.x/zoom,.075+Math.sin(t*.7+o.motionPhase)*Math.min(.08,displayRadius*.08),o.z/zoom);
    s.rotation.y+=t*spin;s.rotation.z=this.reduced?0:Math.sin(t*.5+o.motionPhase)*.035;
    const intake=o.intake??1;s.scale.setScalar(state==='hidden'?0:o.radius/o.modelRadius/zoom*tiny*intake);
    if(o.scaleStage===2&&!this.reduced)s.scale.y*=1+Math.sin(t*1.7+o.motionPhase)*.055;
    const large=Math.max(0,Math.min(1,(14-displayRadius)/4));batch.mesh.geometry.attributes.quantumVisibility.setX(visible-1,tiny*large*large*(3-2*large));
   }
   if(o.type==='dolphin'&&s.rotation.z){
    // Authored sources rest at y=0. Roll around the torso's longitudinal axis,
    // not that ground origin, or the animal visibly orbits/dives through the floor.
    const axis=o.shape.height*.28;this.offset.set(0,axis,0).applyQuaternion(s.quaternion);
    s.position.x-=this.offset.x;s.position.y+=Math.cos(s.rotation.x)*axis-this.offset.y;s.position.z+=Math.sin(s.rotation.x)*axis-this.offset.z;
   }
   if(o.type==='planet')s.rotation.y+=run.time*.07;
   if(o.body){
    const b=o.body;s.quaternion.set(b.q.x,b.q.y,b.q.z,b.q.w);
    this.offset.set(0,b.shape.height/2,0).applyQuaternion(s.quaternion);
    s.position.set(b.x-this.offset.x,b.y-this.offset.y,b.z-this.offset.z);
   }else if(o.rockAngle){
    s.rotation.x=Math.cos(o.rockDirection||0)*o.rockAngle;s.rotation.z=-Math.sin(o.rockDirection||0)*o.rockAngle;
   }
   s.updateMatrix();batch.mesh.setMatrixAt(infinity?visible-1:i,s.matrix);
  }if(infinity){batch.mesh.visible=visible>0;batch.mesh.count=visible;batch.mesh.geometry.attributes.quantumVisibility.needsUpdate=true;}if(changed)batch.mesh.instanceMatrix.needsUpdate=true;}
  for(let i=this.dust.length-1;i>=0;i--){const d=this.dust[i];d.life-=dt;if(d.life<=0){this.dust.splice(i,1);continue;}d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.vy-=7*dt;}
  for(let i=0;i<24;i++){const d=this.dust[i],s=this.scratch;s.rotation.set(0,0,0);s.scale.setScalar(d?Math.min(1,d.life*6):0);if(d)s.position.set(d.x,d.y,d.z);s.updateMatrix();this.debris.setMatrixAt(i,s.matrix);}this.debris.instanceMatrix.needsUpdate=true;
  this.pulses.update(run.time,this.low||this.reduced);
  const blend=1-Math.exp(-7*Math.min(.1,Math.max(0,dt)));this.look.x+=(p.x-this.look.x)*blend;this.look.z+=(p.z-this.look.z)*blend;
  this.growthCamera.update(run.world,p.radius,dt,this.reduced);const framing=this.growthCamera.framing(this.camera.aspect),focusZ=this.look.z-framing.lead;
  this.camera.position.set(this.look.x,framing.height,focusZ+framing.back);this.camera.lookAt(this.look.x,0,focusZ);
  this.scene.fog.near=framing.fogNear;this.scene.fog.far=framing.fogFar;
  this.signalTime.value=run.time;this.marineTime.value=this.reduced?0:run.time;this.waterTime.value=this.low||this.reduced?0:run.time;this.sun.position.set(p.x-35,60,p.z+15);this.sun.target.position.set(p.x,0,p.z);this.renderer.render(this.scene,this.camera);
 }
}
