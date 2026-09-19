import * as THREE from '../vendor/three/three.module.min.js';
import {detailSurface} from './surfaces.js?v=39';
export function canyonBounds(track) {
  if(track.route.name!=='Canyon Run')return null;
  const xs=track.points.map(p=>p.x),zs=track.points.map(p=>p.y);
  return {edge:Math.max(...xs)+19,far:Math.max(...xs)+319,start:Math.min(...zs)-1500,end:Math.max(...zs)+1500};
}
export function inCanyon(c,x,z,r=0){return !!c&&x+r>c.edge&&x-r<c.far+80&&z+r>c.start&&z-r<c.end;}
export function canyonTerrain(track,color) {
  const c=canyonBounds(track),shape=new THREE.Shape();
  shape.moveTo(-3000,-3000);shape.lineTo(3000,-3000);shape.lineTo(3000,3000);shape.lineTo(-3000,3000);shape.closePath();
  const rim=(side,z)=>side?c.far+Math.sin(z*.006)*65+Math.sin(z*.017)*12:c.edge+Math.sin(z*.008)**2*14;
  const samples=[];for(let z=c.start;z<c.end;z+=24)samples.push(z);samples.push(c.end);
  const hole=new THREE.Path();hole.moveTo(rim(0,c.start),-c.start);
  for(const z of samples)hole.lineTo(rim(1,z),-z);
  for(const z of [...samples].reverse())hole.lineTo(rim(0,z),-z);
  hole.closePath();shape.holes.push(hole);
  const group=new THREE.Group();
  const land=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshLambertMaterial({color}));land.rotation.x=-Math.PI/2;land.position.y=-.12;land.userData.owned=true;land.receiveShadow=true;group.add(land);
  const colors=[0xc18b5d,0x985a3b,0xd09862,0x884b34,0xb4774c,0x653e32];
  for(const side of [0,1])for(let layer=0;layer<6;layer++){
    const vertices=[],top=-.15-layer*16,bottom=top-16;
    for(let z=c.start;z<c.end;z+=24){
      const next=Math.min(z+24,c.end);
      const edge=(depth,s)=>rim(side,s)+(side?-1:1)*(depth*4+Math.sin(s*.019)**2*depth*2);
      const a=[edge(layer,z),top,z],b=[edge(layer,next),top,next],d=[edge(layer+1,z),bottom,z],e=[edge(layer+1,next),bottom,next];vertices.push(...a,...b,...d,...b,...e,...d);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:colors[layer],roughness:1,side:THREE.DoubleSide}));mesh.userData.owned=true;mesh.receiveShadow=true;group.add(mesh);
  }
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(c.far-c.edge+160,c.end-c.start),new THREE.MeshLambertMaterial({color:0x685349}));floor.rotation.x=-Math.PI/2;floor.position.set((c.edge+c.far)/2,-97,(c.start+c.end)/2);floor.userData.owned=true;floor.receiveShadow=true;group.add(floor);
  // A narrow dry wash gives the canyon floor a readable depth and direction.
  const wash=new THREE.Mesh(new THREE.PlaneGeometry(24,c.end-c.start),new THREE.MeshLambertMaterial({color:0x9e8968}));wash.rotation.x=-Math.PI/2;wash.position.copy(floor.position);wash.position.y+=.1;wash.userData.owned=true;group.add(wash);
  group.traverse(o=>{if(o.isMesh)detailSurface(o.material);});
  return group;
}
