import * as THREE from '../vendor/three/three.module.min.js';
import {canyonBounds,inCanyon} from './canyon.js?v=39';

export function desertSites(track) {
  const bluffs=[],trees=[];
  const canyon=canyonBounds(track);
  const clear=(x,z,radius)=>!inCanyon(canyon,x,z,radius)&&track.points.every(p=>Math.hypot(p.x-x,p.y-z)>radius+22);
  for(let i=0;i<track.points.length-1;i+=45) {
    const p=track.points[i],side=(i/45)%2?1:-1;
    const offset=150+(i*17%170),radius=32+i%38;
    const x=p.x+Math.sin(p.heading)*offset*side,z=p.y-Math.cos(p.heading)*offset*side;
    if(clear(x,z,radius)&&bluffs.every(b=>Math.hypot(x-b.x,z-b.z)>radius+b.radius*.6))bluffs.push({x,z,radius,height:26+i%59,seed:i});
    for(let n=0;n<2;n++) {
      const distance=35+(i*13+n*47)%110,s=n?1:-1;
      const tx=p.x+Math.sin(p.heading)*distance*s,tz=p.y-Math.cos(p.heading)*distance*s;
      if(clear(tx,tz,9))trees.push({x:tx,z:tz,height:8+(i+n)%7,seed:i+n*19});
    }
  }
  return {bluffs,trees};
}

export function addDesertLandmarks(group,track) {
  const {bluffs,trees}=desertSites(track),batches=new Map(),dummy=new THREE.Object3D();
  const add=(shape,color,x,y,z,sx,sy,sz,rotation=0)=>{
    const key=shape+':'+color;
    if(!batches.has(key))batches.set(key,{shape,color,items:[]});
    batches.get(key).items.push({x,y,z,sx,sy,sz,rotation});
  };
  const branch=(a,b,radius)=>{
    const direction=new THREE.Vector3().subVectors(b,a),mid=a.clone().add(b).multiplyScalar(.5);
    const key='limb:6903617';if(!batches.has(key))batches.set(key,{shape:'limb',color:0x695741,items:[]});
    batches.get(key).items.push({x:mid.x,y:mid.y,z:mid.z,sx:radius,sy:direction.length(),sz:radius,quaternion:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize())});
  };
  for(const b of bluffs) {
    // Alternating sandstone shelves create flat-topped buttes and canyon walls.
    const colors=[0x995737,0xb8784c,0xd59a64,0xa96843,0xe2b47a];
    for(let layer=0;layer<5;layer++) {
      const width=b.radius*(1-layer*.105);
      add('mesa',colors[layer],b.x,layer*b.height/5+b.height/10,b.z,width,b.height/5,width*.72,b.seed*.73);
    }
    if(b.seed%3===0)add('spire',0xb8784c,b.x+b.radius*.5,b.height*.42,b.z-b.radius*.3,b.radius*.2,b.height*1.1,b.radius*.2,b.seed);
  }
  for(const t of trees) {
    const base=new THREE.Vector3(t.x,0,t.z),fork=new THREE.Vector3(t.x+.6*Math.sin(t.seed),t.height*.42,t.z+.5);
    branch(base,fork,.65);
    for(let arm=0;arm<4;arm++) {
      const a=t.seed+arm*2.399,reach=2+arm*.55;
      const elbow=new THREE.Vector3(t.x+Math.cos(a)*reach,t.height*(.52+arm*.05),t.z+Math.sin(a)*reach);
      const crown=elbow.clone().add(new THREE.Vector3(Math.cos(a)*.6,2.2+arm*.35,Math.sin(a)*.6));
      branch(fork,elbow,.42);branch(elbow,crown,.27);
      add('joint',0x695741,elbow.x,elbow.y,elbow.z,.42,.42,.42);
      // Dense radial sword leaves, with a hanging skirt of older foliage.
      add('tuft',0x66764b,crown.x,crown.y,crown.z,.62,.5,.62,a);
      for(let leaf=0;leaf<18;leaf++) {
        const az=leaf*2.399+a;add('blade',0x88724b,crown.x+Math.cos(az)*.5,crown.y-.55,crown.z+Math.sin(az)*.5,.13,1.2,.09,az);
      }
      for(let leaf=0;leaf<44;leaf++) {
        const az=leaf*2.399+a,vertical=-.25+(leaf%7)/6*1.15;
        const dir=new THREE.Vector3(Math.cos(az),vertical,Math.sin(az)).normalize();
        const mid=crown.clone().addScaledVector(dir,.65),key='blade:6714955';
        if(!batches.has(key))batches.set(key,{shape:'blade',color:0x66764b,items:[]});
        batches.get(key).items.push({x:mid.x,y:mid.y,z:mid.z,sx:.21,sy:1.9+(leaf%3)*.18,sz:.065,quaternion:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir)});
      }
    }
  }
  for(const {shape,color,items} of batches.values()) {
    const geometry=shape==='mesa'?new THREE.CylinderGeometry(.82,1,1,7):shape==='joint'||shape==='tuft'?new THREE.IcosahedronGeometry(1,1):shape==='spire'||shape==='blade'?new THREE.ConeGeometry(1,1,shape==='blade'?3:5):shape==='limb'?new THREE.CylinderGeometry(.65,1,1,7):new THREE.BoxGeometry(1,1,1);
    const material=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true});
    const mesh=new THREE.InstancedMesh(geometry,material,items.length);
    items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx,p.sy,p.sz);dummy.rotation.set(0,p.rotation||0,0);if(p.quaternion)dummy.quaternion.copy(p.quaternion);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.userData.owned=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
  }
}
