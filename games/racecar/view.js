import * as THREE from "../vendor/three/three.module.min.js";
import {detailSurface} from './surfaces.js?v=39';
import {DrivingEffects} from './driving-effects.js?v=39';
import {addDistrictScenery} from './district-scenery.js?v=39';
import { canyonBounds, canyonTerrain, inCanyon } from './canyon.js?v=39';
import { configureShadows, followShadowLight } from './lighting.js?v=39';
import { unwrapHeading } from "./parallax.js?v=39";
import { createBackdrop, updateBackdrop } from "./backdrop.js?v=39";
import { ImportedVehicles } from "./imported-vehicles.js?v=39";
import { addArchitecture } from "./scenery.js?v=39";
import { followMovingTarget } from './camera-motion.js?v=39';
import { ENVIRONMENTS, addEnvironment, environmentBackdrop, loadEnvironmentModels, addTerrain } from './environments.js?v=39';
import {
  buildTrack,
  trackPoint,
  trackStrip,
  ROAD_HALF,
  chasePose,
} from "./world-track.js?v=39";
const VEHICLES = [
  "player-car",
  "traffic-sedan",
  "traffic-beetle",
  "traffic-jeep",
  "traffic-pickup",
  "traffic-van",
  "traffic-truck",
  "rival-muscle",
  "rival-rally",
  "rival-exotic",
];
export class RoadScene {
  constructor(host, callbacks) {
    this.host = host;
    this.callbacks = callbacks;
    this.reduced = false;
    this.objects = new Map();
    this.vehicles = new ImportedVehicles();
    this.textures = new Map();
    this.materials = new Map();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.2, 1100);
    this.ambientLight=new THREE.HemisphereLight(0xd5edff, 0x233346, 2);this.scene.add(this.ambientLight);
    const sun = new THREE.DirectionalLight(0xffe6c0, 1.5);
    sun.position.set(100, 150, -80);
    this.scene.add(sun);
    this.sun=sun;
    configureShadows(this.renderer,sun,this.scene);
    const moonlight = new THREE.DirectionalLight(0x87bfff, 0.65);
    moonlight.position.set(-90, 70, 110);
    this.scene.add(moonlight);
    this.fillLight=moonlight;
    this.static = new THREE.Group();
    this.scene.add(this.static);
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.shadowGeometry = new THREE.CircleGeometry(0.5, 20);
    this.shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.spriteMaterials = new Map();
    this.map = document.createElement("canvas");
    this.map.className = "track-map";
    this.map.setAttribute(
      "aria-label",
      "Circuit map: cyan is you, gold is rivals",
    );
    host.append(this.map);
    this.ctx = this.map.getContext("2d");
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      callbacks.error("Graphics were interrupted. Reload to retry.");
    });
    this.load()
      .then(() => {
        callbacks.ready(this);
        this.renderer.setAnimationLoop(() =>
          callbacks.frame(performance.now()),
        );
      })
      .catch(() =>
        callbacks.error("Could not load the racing artwork. Reload to retry."),
      );
  }
  async load() {
    await Promise.all([this.vehicles.load(),loadEnvironmentModels()]);
    const loader = new THREE.TextureLoader(),
      files = [];
    files.push(
      ["city-far", "assets/neon-district-distant-alpha29.png"],
      ["river-far", "assets/river-causeway-distant-alpha30.png"],
      ["city", "assets/neon-district-midground-alpha28.png"],
      ["river", "assets/river-causeway-midground-alpha30.png"],
      ["city-near", "assets/neon-district-roadside-alpha28.png"],
      ["river-near", "assets/river-causeway-roadside-alpha30.png"],
    );
    let done = 0;
    await Promise.all(
      files.map(async ([key, url]) => {
        const t = await loader.loadAsync(url);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        this.textures.set(key, t);
        this.callbacks.progress(++done / files.length);
      }),
    );
    for (const [key, label, color] of [
      ["fuel", "F", "#ffc75f"],
      ["shield", "S", "#65eaff"],
      ["card", "$", "#ffda78"],
    ]) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d");
      g.fillStyle = color;
      if(key==='card') {
        const gold=g.createLinearGradient(0,0,64,64);gold.addColorStop(0,'#fff3bb');gold.addColorStop(.45,'#ffd55b');gold.addColorStop(1,'#b67610');g.fillStyle=gold;
        g.beginPath();g.arc(32,32,28,0,Math.PI*2);g.fill();g.strokeStyle='#fff0a5';g.lineWidth=3;g.stroke();
        g.strokeStyle='#b68024';g.lineWidth=2;g.beginPath();g.arc(32,32,22,0,Math.PI*2);g.stroke();
      } else g.fillRect(4, 4, 56, 56);
      g.fillStyle = "#172636";
      g.font = "bold 42px system-ui";
      g.textAlign = "center";
      g.fillText(label, 32, 47);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(key, t);
    }
  }
  resize() {
    this.needsRender=true;
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.map.width = 240;
    this.map.height = 164;
  }
  clearPreviews() {
    for(const p of this.previews?.values()||[]) {p.target.dispose();p.grayMaterials.forEach(m=>m.dispose());this.vehicles.release(p.car);}
    this.previews=new Map();
  }
  podium(canvas, entries) {
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x091b2b);
    scene.add(new THREE.HemisphereLight(0xd8f5ff,0x233455,3));
    const light=new THREE.DirectionalLight(0xffe4b1,3);light.position.set(-5,9,7);scene.add(light);
    const fill=new THREE.DirectionalLight(0x59caff,2);fill.position.set(8,4,-4);scene.add(fill);
    const resources=[],cars=[];
    const box=(w,h,d,color,x,y,z)=>{
      const geometry=new THREE.BoxGeometry(w,h,d),material=new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.35});
      resources.push(geometry,material);const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);scene.add(mesh);return mesh;
    };
    box(24,.15,14,0x122d43,0,-.12,0);
    for(const [place,x,height,color] of [[2,-5,1,0x8fa8bc],[1,0,2,0xffc95a],[3,5,.65,0xbf8152]]) {
      box(4.7,height,4.8,color,x,height/2,0);
      box(4.72,.08,4.82,0xe0f4ff,x,height+.04,0);
      const label=document.createElement('canvas');label.width=128;label.height=64;
      const ctx=label.getContext('2d');ctx.fillStyle='#102338';ctx.font='900 52px sans-serif';ctx.textAlign='center';ctx.fillText(String(place),64,51);
      const texture=new THREE.CanvasTexture(label),material=new THREE.MeshBasicMaterial({map:texture,transparent:true});
      const geometry=new THREE.PlaneGeometry(1.3,.65),number=new THREE.Mesh(geometry,material);number.position.set(x,height/2,2.41);scene.add(number);resources.push(texture,material,geometry);
      const entry=entries[place-1];if(!entry)continue;
      const car=this.vehicles.create(entry.paint||0x2478de,entry.carId,entry.paint);
      // All imported models are normalized nose-first along -Z.
      car.rotation.y=Math.PI+.35;
      const bounds=new THREE.Box3().setFromObject(car),size=bounds.getSize(new THREE.Vector3());car.scale.multiplyScalar(3.7/Math.max(size.x,size.z));
      const fitted=new THREE.Box3().setFromObject(car),center=fitted.getCenter(new THREE.Vector3());
      car.position.set(x-center.x,height+.1-fitted.min.y,-center.z);scene.add(car);cars.push(car);
    }
    const camera=new THREE.OrthographicCamera(-11,11,5.1,-5.1,.1,80);camera.position.set(0,10,22);camera.lookAt(0,1,0);
    const target=new THREE.WebGLRenderTarget(canvas.width,canvas.height);target.texture.colorSpace=THREE.SRGBColorSpace;
    const previous=this.renderer.getRenderTarget();
    try {
      this.renderer.setRenderTarget(target);this.renderer.render(scene,camera);
      const pixels=new Uint8Array(canvas.width*canvas.height*4);this.renderer.readRenderTargetPixels(target,0,0,canvas.width,canvas.height,pixels);
      const ctx=canvas.getContext('2d'),frame=ctx.createImageData(canvas.width,canvas.height);
      for(let y=0;y<canvas.height;y++)frame.data.set(pixels.subarray(y*canvas.width*4,(y+1)*canvas.width*4),(canvas.height-y-1)*canvas.width*4);
      ctx.putImageData(frame,0,0);
      // Keep the 3D podium as a backdrop; animate lightweight 2D confetti over it.
      const backdrop=document.createElement('canvas');backdrop.width=canvas.width;backdrop.height=canvas.height;backdrop.getContext('2d').drawImage(canvas,0,0);
      this.podiumAnimation={canvas,backdrop,time:0,last:0};
      this.animatePodium(0,0,true);
    } finally {this.renderer.setRenderTarget(previous);target.dispose();resources.forEach(r=>r.dispose());cars.forEach(c=>this.vehicles.release(c));}
  }
  stopPodium() {this.podiumAnimation=null;}
  animatePodium(now,dt,initial=false) {
    const p=this.podiumAnimation;if(!p||document.hidden||(!initial&&this.reduced))return;
    p.time+=dt;
    if(!initial&&now-p.last<1000/30)return;
    p.last=now;
    const ctx=p.canvas.getContext('2d'),w=p.canvas.width,h=p.canvas.height;
    ctx.drawImage(p.backdrop,0,0);
    for(let i=0;i<64;i++) {
      const seed=(Math.sin(i*127.1+3)*43758.5453)%1;
      const x=((Math.abs(seed)*w+Math.sin(p.time*.9+i)*18+w)%w);
      const y=((i*83+p.time*(24+i%7*4))%(h+60))-30;
      ctx.save();ctx.translate(x,y);ctx.rotate(i+p.time*(i%2?1:-1));
      ctx.globalAlpha=.8;ctx.fillStyle=['#ffcf63','#6edfee','#eef8ff'][i%3];
      ctx.fillRect(-3,-5,Math.max(1,6*Math.abs(Math.cos(p.time*2+i))),9);ctx.restore();
    }
  }
  previewCar(canvas, id, paint, locked=false, angle=0) {
    this.previews ||= new Map();
    const key=[id,paint,locked,canvas.width,canvas.height].join(':');
    let preview=this.previews.get(canvas);
    if(preview?.key!==key) {
    if(preview) {preview.target.dispose();preview.grayMaterials.forEach(m=>m.dispose());this.vehicles.release(preview.car);}
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x101d2a);
    scene.add(new THREE.HemisphereLight(0xd9efff,0x40506a,2.5));
    const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,6,5);scene.add(light);
    const car=this.vehicles.create(paint||0x2478de,id,paint); scene.add(car);
    const grayMaterials=[];
    if(locked) car.traverse(o=>{if(o.isMesh){
      const material=o.material.clone();
      if(material.color) {const c=material.color,g=c.r*.2126+c.g*.7152+c.b*.0722;material.color.setRGB(g,g,g);}
      if(material.emissive)material.emissive.set(0);
      grayMaterials.push(material);o.material=material;
    }});
    const camera=new THREE.PerspectiveCamera(32,canvas.width/canvas.height,0.1,30);
    const bounds=new THREE.Box3().setFromObject(car),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const distance=Math.max(size.y*1.4,Math.hypot(size.z,size.x))/(2*Math.tan(16*Math.PI/180))*1.25;
    camera.position.copy(center).add(new THREE.Vector3(1,.58,1.25).normalize().multiplyScalar(distance));camera.lookAt(center);
    const target=new THREE.WebGLRenderTarget(canvas.width,canvas.height);
    target.texture.colorSpace=THREE.SRGBColorSpace;
    const pixels=new Uint8Array(canvas.width*canvas.height*4),ctx=canvas.getContext('2d'),frame=ctx.createImageData(canvas.width,canvas.height);
    preview={key,scene,car,camera,target,grayMaterials,pixels,ctx,frame};this.previews.set(canvas,preview);
    }
    const {scene,car,camera,target,pixels,ctx,frame}=preview;
    car.rotation.y=angle;
    const previous=this.renderer.getRenderTarget();
    try {
      this.renderer.setRenderTarget(target);this.renderer.render(scene,camera);
      this.renderer.readRenderTargetPixels(target,0,0,canvas.width,canvas.height,pixels);
      for(let y=0;y<canvas.height;y++) frame.data.set(pixels.subarray(y*canvas.width*4,(y+1)*canvas.width*4),(canvas.height-y-1)*canvas.width*4);
      ctx.putImageData(frame,0,0);
    } finally {
      this.renderer.setRenderTarget(previous);
    }
  }
  material(color) {
    if (!this.materials.has(color))
      this.materials.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
      );
    return this.materials.get(color);
  }
  mesh(vertices, color) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.computeVertexNormals();
    const material = new THREE.MeshLambertMaterial({
      color,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.owned = true;
    mesh.userData.surface=true;mesh.receiveShadow=true;
    this.static.add(mesh);
    return mesh;
  }
  makeWorld(run) {
    this.static.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (o.userData.owned) {
        if (o.userData.ownedTexture) o.material.map.dispose();
        o.geometry?.dispose();
        o.material?.dispose();
      }
    });
    this.static.clear();
    for (const o of this.objects.values()) {
      this.vehicles.release(o);
      this.scene.remove(o);
    }
    this.objects.clear();
    this.track = buildTrack(run.route);
    this.route = run.route;
    const environment=ENVIRONMENTS[run.route.environment];
    const river = run.route.theme === "river",
      groundColor = ['beach','coast'].includes(run.route.environment)?0x267f98:environment?.ground ?? (river ? 0x244a4c : 0x152a34);
    this.scene.background = new THREE.Color(0x102331);
    this.scene.fog = new THREE.Fog(0x102331, 220, 800);
    if(environment) {this.scene.background.set(environment.sky);this.scene.fog.color.set(environment.haze);}
    this.ambientLight.intensity=environment?1.4:2;
    this.sun.intensity=environment?2.2:1.5;this.fillLight.intensity=environment ? 0.2 : 0.65;
    this.sun.color.set(environment?0xffe6c0:0xb4ceff);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(6000, 6000),
      detailSurface(new THREE.MeshLambertMaterial({ color: groundColor })),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.userData.owned = true;
    if(canyonBounds(this.track)){ground.geometry.dispose();ground.material.dispose();this.static.add(canyonTerrain(this.track,groundColor));}
    else this.static.add(ground);
    if(environment)addTerrain(this.static,this.track,run.route.environment);
    if(run.route.environment)addDistrictScenery(this.static,this.track,run.route.environment);
    const road = [],
      edge = [],
      lines = [],
      finish = [],
      length = this.track.closed
        ? run.route.length
        : this.track.points.at(-1).s,
      start = this.track.closed ? 0 : this.track.points[0].s;
    for (let s = start; s < length; s += 2) {
      const end = Math.min(s + 2, length);
      road.push(...trackStrip(this.track, s, end, -7, 7));
      edge.push(
        ...trackStrip(this.track, s, end, -7.4, -7, 0.03),
        ...trackStrip(this.track, s, end, 7, 7.4, 0.03),
      );
      if (Math.floor(s / 6) % 2 === 0)
        for (const lane of [-3.5, 0, 3.5])
          lines.push(
            ...trackStrip(this.track, s, end, lane - 0.06, lane + 0.06, 0.04),
          );
    }
    detailSurface(this.mesh(road, 0x29313e).material,'asphalt');
    const rails=[],shoulders=[],railPosts=[];
    for(let s=start;s<length;s+=4)for(const side of [-1,1]) {
      const end=Math.min(s+4,length);
      shoulders.push(...trackStrip(this.track,s,end,side*7.4,side*9.5,.015));
      rails.push(...trackStrip(this.track,s,end,side*9.5,side*9.65,.85));
      if(Math.floor(s/4)%3===0) {
        const at=trackPoint(this.track,s,side*9.55);
        railPosts.push(at);
      }
    }
    detailSurface(this.mesh(shoulders,environment?.ground||0x606b68).material);
    this.mesh(rails,0x9eaaa9);
    const supports=new THREE.InstancedMesh(new THREE.BoxGeometry(.14,.85,.14),new THREE.MeshStandardMaterial({color:0x8b9396,roughness:.7}),railPosts.length),supportPose=new THREE.Object3D();
    railPosts.forEach((p,i)=>{supportPose.position.set(p.x,.425,p.y);supportPose.updateMatrix();supports.setMatrixAt(i,supportPose.matrix);});
    supports.userData.owned=true;supports.computeBoundingSphere();this.static.add(supports);
    this.mesh(edge, run.route.accent);
    this.mesh(lines, 0xb9c9d0);
    const finishS = this.track.closed ? 0 : run.goal;
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < 14; i++)
        if ((i + row) % 2 === 0)
          finish.push(
            ...trackStrip(
              this.track,
              finishS + row * 0.7,
              finishS + (row + 1) * 0.7,
              i - 7,
              i - 6,
              0.05,
            ),
          );
    this.mesh(finish, 0xffffff);
    // Fixed landmarks. A landmark never follows the camera or changes on a lap.
    const props = [];
    for (let s = start; s < length; s += 28)
      for (const side of [-1, 1]) {
        const p = trackPoint(
          this.track,
          s,
          side * (14 + (Math.abs(Math.floor(s / 28)) % 3) * 5),
        );
        if (
          this.track.points.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 11)
        )
          continue;
        const n = Math.abs(Math.floor(s / 28) * 17 + side * 3);
        const clearance=Math.min(...this.track.points.map(q=>Math.hypot(q.x-p.x,q.y-p.y)));
        props.push({ p,clearance, w: 3 + (n % 5), h: 5 + (n % 15), d: 4 + (n % 4) });
      }
    if(environment)addEnvironment(this.static,props.filter(({p})=>!inCanyon(canyonBounds(this.track),p.x,p.y,12)),run.route.environment);
    else addArchitecture(this.static, this.boxGeometry, props,
      (color) => this.material(color), run.route.accent);
    const matrix = new THREE.Object3D();
    // Low safety rails and lamp posts give nearby scenery useful scale cues.
    const lamps = [];
    for (let s = start; s < length; s += 4)
      for (const side of [-1, 1]) {
        if (Math.floor((s - start) / 4) % 14 === 0)
          lamps.push(trackPoint(this.track, s, side * 10.3));
      }
    const posts = new THREE.InstancedMesh(
        this.boxGeometry,
        this.material(0x4f6477),
        lamps.length,
      ),
      lampMaterial = this.material(0xffdfab);
    lampMaterial.emissive.setHex(0xffc46d);
    lampMaterial.emissiveIntensity = 0.65;
    const heads = new THREE.InstancedMesh(
      this.boxGeometry,
      lampMaterial,
      lamps.length,
    );
    const arms = new THREE.InstancedMesh(this.boxGeometry,
      this.material(0x4f6477), lamps.length);
    lamps.forEach((p, i) => {
      matrix.rotation.set(0, -p.heading, 0);
      matrix.position.set(p.x, 2.4, p.y);
      matrix.scale.set(0.13, 4.8, 0.13);
      matrix.updateMatrix();
      posts.setMatrixAt(i, matrix.matrix);
      matrix.position.y = 4.72;
      matrix.scale.set(1.05, 0.12, 0.12);
      matrix.updateMatrix();
      arms.setMatrixAt(i, matrix.matrix);
      matrix.position.y = 4.85;
      matrix.scale.set(0.65, 0.12, 0.45);
      matrix.updateMatrix();
      heads.setMatrixAt(i, matrix.matrix);
    });
    this.static.add(posts, heads, arms);
    this.static.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.castShadow=!o.userData.surface&&o.geometry.type!=='PlaneGeometry'&&o.geometry.type!=='ShapeGeometry'&&!o.material.isMeshBasicMaterial;}});
    const pts = this.track.points;
    this.backdropHeading = null;
    this.backdrop = environment?environmentBackdrop(run.route.environment):createBackdrop(this.textures, river);
    this.static.add(this.backdrop);
    this.drivingEffects=new DrivingEffects(this.static);
    this.cameraReady = false;
    this.mapBounds = {
      minX: Math.min(...pts.map((p) => p.x)),
      maxX: Math.max(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxY: Math.max(...pts.map((p) => p.y)),
    };
  }
  sprite(key) {
    if (!this.spriteMaterials.has(key))
      this.spriteMaterials.set(
        key,
        new THREE.SpriteMaterial({
          map: this.textures.get(key),
          alphaTest: 0.12,
          depthWrite: true,
          fog: true,
        }),
      );
    const s = new THREE.Sprite(this.spriteMaterials.get(key));
    s.center.set(0.5, 0.08);
    const group = new THREE.Group();
    group.add(s);
    if (VEHICLES.includes(key)) {
      const shadow = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.set(0.85, 1.7, 1);
      shadow.position.y = -0.07;
      group.add(shadow);
    }
    this.scene.add(group);
    return group;
  }
  burst() {
    /* Collision feedback is the brief car blink; no camera shake. */
  }
  draw(run, dt, active) {
    if (!this.track || this.route !== run.route) this.makeWorld(run);
    const p = run.player,
      player = trackPoint(this.track, p.z, p.x * ROAD_HALF);
    // The camera rotates around rigid world geometry. No screen-space bending,
    // lateral compression, or artificial horizon extension is used.
    const pose = chasePose(this.track, p.z, p.x),
      target = new THREE.Vector3().copy(pose.position),
      look = new THREE.Vector3().copy(pose.look);
    const facing=p.headingError||0;
    look.x-=Math.sin(player.heading)*facing*16;look.z+=Math.cos(player.heading)*facing*16;
    if (!this.cameraReady) {
      this.camera.position.copy(target);
      this.look = look;
      this.previousCameraTarget = target.clone();
      this.previousLookTarget = look.clone();
      this.cameraReady = true;
    } else if (active) {
      for(const axis of ['x','y','z']) {
        this.camera.position[axis]=followMovingTarget(this.camera.position[axis],this.previousCameraTarget[axis],target[axis],dt);
        this.look[axis]=followMovingTarget(this.look[axis],this.previousLookTarget[axis],look[axis],dt);
      }
      this.previousCameraTarget.copy(target);
      this.previousLookTarget.copy(look);
    }
    this.camera.lookAt(this.look);
    const heading = Math.atan2(
      this.look.z - this.camera.position.z,
      this.look.x - this.camera.position.x,
    );
    this.backdropHeading =
      this.backdropHeading === null
        ? heading
        : unwrapHeading(this.backdropHeading, heading);
    updateBackdrop(this.backdrop, this.camera, this.look, this.backdropHeading);
    const actors = [
        { ...p, id: "player", texture: "player-car" },
        ...run.rivals,
        ...run.traffic,
        ...run.pickups,
      ],
      alive = new Set();
    for (const a of actors) {
      if (a.dead) continue;
      const q = trackPoint(this.track, a.z, a.x * ROAD_HALF);
      if (Math.hypot(q.x - player.x, q.y - player.y) > 240 && a.id !== "player")
        continue;
      alive.add(a.id);
      let obj = this.objects.get(a.id);
      const model = a.id === 'player' ? (run.car?.id || 'metro') : a.carId ||
        ({'rival-muscle':'sport','rival-rally':'touring','rival-exotic':'apex',
          'traffic-sedan':'metro','traffic-beetle':'touring','traffic-jeep':'roamer',
          'traffic-pickup':'taxi','traffic-van':'roamer','traffic-truck':'interceptor'})[a.texture];
      if (obj && obj.userData.carModel !== model && !a.type) {
        this.vehicles.release(obj); this.scene.remove(obj); this.objects.delete(a.id); obj=null;
      }
      if (!obj) {
        if (!a.type) {
          const colors = {
            "player-car": 0x2478de,
            "rival-muscle": 0xe24c38,
            "rival-rally": 0x7dbb34,
            "rival-exotic": 0xe0e6ed,
            "traffic-sedan": 0xe3a43a,
            "traffic-beetle": 0x9b69c2,
            "traffic-jeep": 0x568b69,
            "traffic-pickup": 0xb66c43,
            "traffic-van": 0xc3cdd3,
            "traffic-truck": 0x507aab,
          };
          obj = this.vehicles.create(
            colors[a.texture] || 0x2478de,
            model || a.texture?.split("-")[1],
            a.id==='player'?run.car?.paint:undefined,
          );
          obj.userData.carModel = model;
          obj.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial){o.castShadow=true;o.receiveShadow=true;}});
          this.scene.add(obj);
        } else obj = this.sprite(a.type);
        this.objects.set(a.id, obj);
      }
      if (obj.userData.vehicle) {
        const before = trackPoint(this.track, a.z - 2),
          after = trackPoint(this.track, a.z + 2),
          delta = after.heading - before.heading;
        this.vehicles.update(
          obj,
          {
            ...a,
            turnRate:
              (Math.atan2(Math.sin(delta), Math.cos(delta)) / 4) *
              (a.speed || 0),
          },
          q,
          run,
          this.reduced,
        );
      } else {
        obj.position.set(q.x, 0.12, q.y);
        obj.scale.set(a.type ? 2 : 2.7, a.type ? 2 : 4.1, 1);
      }
      obj.visible = !(
        a.id === "player" &&
        !this.reduced &&
        run.recovery > 0 &&
        Math.floor(run.time * 12) % 2
      );
    }
    for (const [id, obj] of this.objects)
      if (!alive.has(id)) {
        this.vehicles.release(obj);
        this.scene.remove(obj);
        this.objects.delete(id);
      }
    this.renderer.shadowMap.enabled=!this.reduced;
    this.drivingEffects.update(run,player,this.reduced,active);
    this.sun.castShadow=!this.reduced;
    followShadowLight(this.sun,this.look);
    this.renderer.render(this.scene, this.camera);
    this.drawMap(run);
  }
  drawMap(run) {
    this.map.hidden = !this.track.closed;
    if (this.map.hidden) return;
    const g = this.ctx,
      b = this.mapBounds,
      scale = Math.min(214 / (b.maxX - b.minX), 138 / (b.maxY - b.minY)),
      at = (p) => [13 + (p.x - b.minX) * scale, 13 + (p.y - b.minY) * scale];
    g.clearRect(0, 0, 240, 164);
    g.lineWidth = 7;
    g.strokeStyle = "#426071";
    g.beginPath();
    this.track.points.forEach((p, i) => {
      const [x, y] = at(p);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.closePath();
    g.stroke();
    const [x, y] = at(trackPoint(this.track, 0));
    g.fillStyle = "white";
    g.fillRect(x - 4, y - 6, 8, 12);
    for (const a of [...run.rivals, run.player]) {
      const [x, y] = at(trackPoint(this.track, a.z));
      g.beginPath();
      g.arc(x, y, a === run.player ? 6 : 4, 0, Math.PI * 2);
      g.fillStyle = a === run.player ? "#66e8ff" : "#ffbf60";
      g.fill();
    }
  }
}
