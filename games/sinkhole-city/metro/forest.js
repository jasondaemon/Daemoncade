import {CAMP_SITES,CAMP_LAYOUTS,CAMP_POND} from './habitats.js?v=camp-life32';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function forestColor(x,z){
 const mottling=Math.sin(x*.21+Math.sin(z*.17)*2)*.016+Math.sin(z*.43-x*.13)*.009;
 let color=[.40+mottling,.49+mottling,.29+mottling];
 for(const [i,c]of CAMP_SITES.entries()){
  const a=CAMP_LAYOUTS[i].angle,dx=x-c.x,dz=z-c.z,u=dx*Math.cos(a)+dz*Math.sin(a),v=-dx*Math.sin(a)+dz*Math.cos(a),angle=Math.atan2(v,u);
  const r=8.5+Math.sin(angle*3+i)*1.2+Math.cos(angle*5-i)*.7;
  const d=Math.hypot(u,v/(i%2?.78:1.05))/r;
  color=mix(color,[.62+mottling,.60+mottling,.40+mottling],(1-smooth(.35,1.45,d))*.85);
 }
 const lodge=Math.hypot((x-3)/10,(z+40)/8);color=mix(color,[.67,.61,.43],(1-smooth(.4,1.4,lodge))*.7);
 const p=CAMP_POND,shore=Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz);color=mix(color,[.68,.65,.46],1-smooth(1,1.35,shore));
 return mix(color,[129/255,148/255,96/255],smooth(60,72,Math.max(Math.abs(x),Math.abs(z))));
}
// Cosmetic forest floor only. Collection/support remains on one level plane.
export function forestHeight(x,z){return .012-.032*smooth(60,72,Math.max(Math.abs(x),Math.abs(z)));}

// Adjacent quads share exactly the same edge at every bend. Independent
// per-segment normals leave visible wedges/cracks along an otherwise flat trail.
export function trailRibbon(points,halfWidth=1.6){
 const edges=points.map((p,i)=>{
  const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,n=Math.max(.00001,Math.hypot(dx,dz)),ox=-dz/n*halfWidth,oz=dx/n*halfWidth;
  return [[p.x-ox,p.y,p.z-oz],[p.x+ox,p.y,p.z+oz]];
 });
 const positions=[];
 for(let i=0;i<edges.length-1;i++){const [a,b]=edges[i],[c,d]=edges[i+1];positions.push(...a,...b,...d,...a,...d,...c);}
 return new Float32Array(positions);
}
