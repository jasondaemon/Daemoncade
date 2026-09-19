import * as THREE from '../vendor/three/three.module.min.js';
import {detailSurface} from './surfaces.js?v=39';
import {mainlandCoast} from './coast.js?v=39';
import {addBeachScenery} from './beach-scenery.js?v=39';
import {canyonBounds,inCanyon} from './canyon.js?v=39';
import { addDesertLandmarks } from './desert.js?v=39';
const natureModels=new Map();
export async function loadEnvironmentModels() {
  const names=['tree_palm','tree_palmBend','tree_palmDetailedShort','tree_oak','tree_pineTallA','cactus_short','cactus_tall','rock_largeA','rock_largeB','rock_largeD','tent_smallOpen'];
  await Promise.all(names.map(async name=>{
    const response=await fetch(new URL(`assets/kenney-nature/${name}.json`,import.meta.url));
    if(!response.ok)throw new Error('Scenery model unavailable');
    const data=await response.json();
    natureModels.set(name,data.parts.map(part=>{
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(part.normals,3));
      const color=new THREE.Color().setRGB(...data.materials[part.material].color);
      const [r,g,b]=data.materials[part.material].color;
      if(g>r*1.5&&b>r*1.5)color.setHex(name.includes('pine')?0x285b43:0x47854c);
      else if(name.startsWith('tree'))color.setHex(0x866044);
      else if(name.startsWith('rock'))color.setHex(0x9c8670);
      return {geometry,material:new THREE.MeshStandardMaterial({color,roughness:.95})};
    }));
  }));
}
function addNature(group,props,id) {
  const sets={beach:['tree_palm','tree_palmBend','tree_palmDetailedShort','rock_largeA'],desert:['cactus_tall','rock_largeD','cactus_short','rock_largeB'],coast:['tree_oak','tree_palmBend','rock_largeA','rock_largeD'],mountain:['tree_pineTallA','tree_pineTallA','rock_largeB','tent_smallOpen']};
  const batches=new Map(),dummy=new THREE.Object3D();
  props.forEach(({p,clearance},i)=>{
    const name=sets[id][i%4],scale=.85+(i*7%13)/20;
    let radius=0;
    for(const part of natureModels.get(name)){const a=part.geometry.attributes.position;for(let n=0;n<a.count;n++)radius=Math.max(radius,Math.hypot(a.getX(n),a.getZ(n)));}
    if(clearance!==undefined&&clearance<8+radius*scale)return;
    if(!batches.has(name))batches.set(name,[]);batches.get(name).push({p,i});
  });
  for(const [name,items] of batches)for(const part of natureModels.get(name)) {
    const mesh=new THREE.InstancedMesh(part.geometry,part.material,items.length);
    for(let n=0;n<items.length;n++) {
      const {p,i}=items[n],scale=.85+(i*7%13)/20;
      dummy.position.set(p.x,0,p.y);dummy.scale.setScalar(scale);dummy.rotation.set(0,i*2.399,0);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);
    }
    mesh.computeBoundingSphere();group.add(mesh);
  }
}
export const ENVIRONMENTS={
  beach:{ground:0xc8b887,sky:0x82c9e0,haze:0xc9e6df,rock:0xc5ad7e,leaf:0x427d4c},
  desert:{ground:0xb88b60,sky:0x83b9cc,haze:0xe6c298,rock:0xa86342,leaf:0x62754c},
  coast:{ground:0x70856c,sky:0x77b3d4,haze:0xc9d9cf,rock:0x8c9c96,leaf:0x3d7053},
  mountain:{ground:0x5b7161,sky:0x82a8ca,haze:0xc0ced5,rock:0x7b8b94,leaf:0x244a39},
};
export function addTerrain(group,track,id) {
  if(id==='coast')addBeachScenery(group,track);
  if(id==='desert')addDesertLandmarks(group,track);
  const coastal=id==='beach'||id==='coast';
  if(coastal) {
    const mainland=id==='coast'?mainlandCoast(track):null;
    const outline=mainland?.land||track.points.filter((_,i)=>i%8===0).map(p=>({x:p.x+Math.sin(p.heading)*65,z:p.y-Math.cos(p.heading)*65}));
    const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(p.x,-p.z)));
    const land=new THREE.Mesh(new THREE.ShapeGeometry(shape),detailSurface(new THREE.MeshStandardMaterial({color:ENVIRONMENTS[id].ground,roughness:1})));
    land.rotation.x=-Math.PI/2;land.position.y=-.03;land.userData.owned=true;group.add(land);
    const foam=new THREE.BufferGeometry().setFromPoints((mainland?.shore||outline).map(p=>new THREE.Vector3(p.x,-.02,p.z)));
    const Shore=mainland?THREE.Line:THREE.LineLoop;
    const shore=new Shore(foam,new THREE.LineBasicMaterial({color:0xd7efe1,transparent:true,opacity:.75}));shore.userData.owned=true;group.add(shore);
  }
  if(id==='mountain'||id==='desert') {
    const geometry=new THREE.IcosahedronGeometry(1,1),dummy=new THREE.Object3D(),sites=[];
    for(let i=0;i<track.points.length;i+=110) {
      const p=track.points[i],x=p.x+Math.sin(p.heading)*220,z=p.y-Math.cos(p.heading)*220;
      if(inCanyon(canyonBounds(track),x,z,150))continue;
      if(track.points.some(q=>Math.hypot(q.x-x,q.y-z)<150))continue;
      sites.push({x,z,i});
    }
    const hills=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:ENVIRONMENTS[id].rock,flatShading:true,roughness:1}),sites.length);
    sites.forEach(({x,z,i},n)=>{dummy.position.set(x,-15,z);dummy.scale.set(90+(i%50),id==='mountain'?100+i%80:50+i%50,100);dummy.rotation.set(0,i*.1,0);dummy.updateMatrix();hills.setMatrixAt(n,dummy.matrix);});
    hills.userData.owned=true;hills.computeBoundingSphere();group.add(hills);
  }
}
export function addEnvironment(group,props,id) {
  const e=ENVIRONMENTS[id];if(!e)return;
  if(natureModels.size) {addNature(group,props,id);return;}
  const batches=new Map(),dummy=new THREE.Object3D();
  function add(shape,color,x,y,z,sx,sy,sz,rz=0) {
    const key=shape+':'+color;if(!batches.has(key))batches.set(key,{shape,color,items:[]});
    batches.get(key).items.push({x,y,z,sx,sy,sz,rz});
  }
  props.forEach(({p},i)=>{
    const x=p.x,z=p.y,h=5+i%5;
    if(id==='desert') {
      if(i%3) {
        add('rock',e.rock,x,h*.35,z,4+i%4,h*.7,4);
      } else {
        add('box',e.leaf,x,3,z,.65,6,.65);
        add('box',e.leaf,x+1,3.8,z,2,.55,.6);add('box',e.leaf,x+1.8,4.4,z,.55,1.7,.55);
      }
    } else if(id==='beach') {
      add('trunk',0x796346,x,h/2,z,.35,h,.35);
      for(let a=0;a<5;a++) {
        const angle=a*Math.PI*2/5;
        add('leaf',e.leaf,x+Math.cos(angle)*1.1,h,z+Math.sin(angle)*1.1,2.8,.3,1.2,angle);
      }
      if(i%5===0) {add('box',0xf2e9c8,x+3,1.3,z,3,2.6,2.5);add('roof',0xc7654e,x+3,3,z,2.4,1.1,2.1);}
    } else {
      add('trunk',0x66584c,x,h/2,z,.5,h,.5);
      add('cone',e.leaf,x,h*.8,z,2.4,h,2.4);
      if(i%3===0)add('rock',e.rock,x+4,1.3,z+2,3,2.6,2);
    }
  });
  for(const {shape,color,items} of batches.values()) {
    const geo=shape==='rock'?new THREE.IcosahedronGeometry(1,0):shape==='cone'||shape==='roof'?new THREE.ConeGeometry(1,1,shape==='roof'?4:7):shape==='trunk'?new THREE.CylinderGeometry(.8,1,1,6):new THREE.BoxGeometry(1,1,1);
    const mesh=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color,roughness:.92}),items.length);
    items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx,p.sy,p.sz);dummy.rotation.set(0,p.rz,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.userData.owned=true;mesh.computeBoundingSphere();group.add(mesh);
  }
}
export function environmentBackdrop(id) {
  const e=ENVIRONMENTS[id];
  const material=new THREE.ShaderMaterial({depthWrite:false,depthTest:false,
    uniforms:{celestial:{value:new THREE.Vector3()},offsets:{value:new THREE.Vector3()},horizon:{value:.68},aspect:{value:1},sky:{value:new THREE.Color(e.sky)},haze:{value:new THREE.Color(e.haze)},ridge:{value:new THREE.Color(e.rock)},mountains:{value:id==='mountain'?1: id==='coast'?.5:id==='desert'?.3:.08}},
    vertexShader:'varying vec2 v; void main(){v=uv;gl_Position=vec4(position.xy,1.,1.);}',
    fragmentShader:`varying vec2 v;uniform vec3 sky,haze,ridge,offsets,celestial;uniform float horizon,aspect,mountains;
    void main(){vec3 color=mix(haze,sky,smoothstep(horizon,1.,v.y));
      for(int i=0;i<3;i++){float d=float(i);float x=(v.x-.5)*aspect+offsets[i];
      float h=horizon+mountains*(.08+.03*sin(x*13.+d)+.02*sin(x*29.-d))*(1.-d*.22);
      float mask=1.-smoothstep(h-.001,h+.001,v.y);color=mix(color,mix(haze,ridge,.22+d*.17),mask);}
      float sun=(1.-smoothstep(.025,.028,length(vec2((v.x-celestial.x)*aspect,v.y-celestial.y))))*celestial.z; color=mix(color,vec3(1.,.92,.68),sun);
      gl_FragColor=vec4(color,1.);
      #include <colorspace_fragment>
    }`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=-1000;mesh.userData.owned=true;return mesh;
}
