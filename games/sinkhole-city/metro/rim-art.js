import * as THREE from '../../vendor/three/three.module.min.js';
import {mergeGeometries} from '../../vendor/three/addons/utils/BufferGeometryUtils.js';
import {CHARACTER_STYLES,collectionGeometry} from './rim-characters.js?v=sculpt51';

export const characterRim=style=>style==='frog'||style==='dragon'||CHARACTER_STYLES.includes(style);

// Local XY is the mouth plane. Negative Z rises above the ground after
// the well's quarter-turn. All features stay outside the real opening.
function creatureGeometry(style){
 const parts=[],dragon=style==='dragon';
 const palette=dragon?{skin:0xc84d39,lip:0xf39250,brow:0x932f39,eye:0xffdf72}: {skin:0x59b95d,lip:0xa6db69,brow:0x318f59,eye:0xfff3c4};
 const add=(g,color,x=0,y=0,z=0)=>{g.translate(x,y,z);const p=g.attributes.position,c=new THREE.Color(color),colors=new Float32Array(p.count*3);for(let i=0;i<p.count;i++)c.toArray(colors,i*3);g.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(g);};
 const oval=(x,y,z,sx,sy,sz,color)=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(sx,sy,sz);add(g,color,x,y<-.7?y-.14:y,z);};
 const collar=new THREE.TorusGeometry(1.105,.09,8,72);collar.scale(1,1,.8);add(collar,palette.skin);
 const inner=new THREE.TorusGeometry(1.025,.025,6,72);add(inner,palette.lip,0,0,-.025);
 for(const side of [-1,1]){
  oval(side*.67,-1.01,-.12,.32,.30,.20,palette.skin);
  oval(side*.67,-1.04,-.29,.235,.22,.17,palette.eye);
  oval(side*.67,-.97,-.425,dragon?.052:.095,dragon?.125:.105,.045,0x162c2b);
  oval(side*.70,-.99,-.46,.025,.03,.012,0xffffff);
  // Brow ridge, cheeks and tiny nostrils make the opening read as a face.
  oval(side*.67,-1.20,-.32,.27,.065,.065,palette.brow);
  oval(side*1.14,.55,-.04,.20,.27,.10,palette.skin);
  oval(side*.22,-1.09,-.10,.045,.028,.025,palette.brow);
  if(dragon){
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.87,-1.20,-.20),new THREE.Vector3(side*1.02,-1.27,-.35),new THREE.Vector3(side*1.06,-1.34,-.48)]);
   add(new THREE.TubeGeometry(curve,8,.085,7,false),0xffe3b2);
   const horn=new THREE.ConeGeometry(.085,.21,7),tip=curve.getPoint(1),direction=curve.getTangent(1);horn.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction));add(horn,0xffe3b2,tip.x+direction.x*.08,tip.y+direction.y*.08,tip.z+direction.z*.08);
   for(let i=0;i<5;i++){
    const a=side*(.55+i*.43),r=1.22,g=new THREE.ConeGeometry(.095,.22,5);g.rotateX(Math.PI/2);g.rotateZ(-a);add(g,palette.lip,Math.sin(a)*r,Math.cos(a)*r,-.03);
   }
   // Ivory teeth lean vertically, not inward across the swallowing boundary.
   for(const a of [side*.65,side*2.25]){const g=new THREE.ConeGeometry(.065,.18,7);g.rotateX(-Math.PI/2);add(g,0xfff1cf,Math.sin(a)*1.065,Math.cos(a)*1.065,-.12);}
  }else{
   for(let i=0;i<3;i++)oval(side*(1.05+i*.07),.74+(i%2)*.08,-.025,.075,.12,.045,palette.lip);
   for(let i=0;i<3;i++){const a=side*(1.2+i*.30);oval(Math.sin(a)*1.13,Math.cos(a)*1.13,-.075,.032,.045,.025,palette.brow);}
  }
 }
 const flat=parts.map(g=>g.index?g.toNonIndexed():g),result=mergeGeometries(flat,false);
 for(const g of new Set([...parts,...flat]))g.dispose();result.computeBoundingSphere();return result;
}

// One static mesh per style: cosmetic only, no lights, particles or tick updates.
// The main ring tracks the opening at radius 1; decoration stays outside it.
export function rimGeometry(style='plain'){
 if(style==='frog'||style==='dragon')return creatureGeometry(style);
 if(CHARACTER_STYLES.includes(style))return collectionGeometry(style);
 const parts=[];
 const ring=(radius,tube=.035,arc=Math.PI*2,angle=0)=>{
  const g=new THREE.TorusGeometry(radius,tube,6,Math.max(3,Math.ceil(64*arc/(Math.PI*2))),arc);g.rotateZ(angle);parts.push(g);
 };
 if(style==='vortex'){
  ring(1,.022);ring(1.2,.012);
  for(let arm=0;arm<3;arm++){
   const points=[];for(let i=0;i<=30;i++){const t=i/30,a=arm*Math.PI*2/3+t*1.9,r=1.04+t*.14;points.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,Math.sin(t*Math.PI)*.025));}
   parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),30,.014,5,false));
  }
 }else if(style==='segments')for(let i=0;i<12;i++)ring(1,.035,Math.PI/6-.065,i*Math.PI/6+.0325);
 else{
  ring(1);
  if(style==='rays'||style==='crown'){
   const count=style==='crown'?16:12;
   for(let i=0;i<count;i++){
    const angle=i*Math.PI*2/count,length=style==='crown'?(i%2?.09:.16):.1;
    const g=new THREE.BoxGeometry(.035,length,.028);g.translate(0,1.05+length/2,0);g.rotateZ(angle);parts.push(g);
   }
   if(style==='crown')ring(1.09,.015);
  }
  if(style==='facets'||style==='satellites')for(let i=0;i<8;i++){
   const angle=i*Math.PI/4,g=style==='facets'?new THREE.OctahedronGeometry(.055):new THREE.SphereGeometry(.04,8,4);
   g.translate(Math.cos(angle)*1.09,Math.sin(angle)*1.09,0);parts.push(g);
  }
 }
 // Match attributes before merging (octahedra have no shared index).
 const flat=parts.map(g=>g.index?g.toNonIndexed():g);
 const result=mergeGeometries(flat,false);for(const g of new Set([...parts,...flat]))g.dispose();
 result.computeBoundingSphere();return result;
}
