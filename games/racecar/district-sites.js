import {canyonBounds,inCanyon} from './canyon.js?v=39';
import {mainlandCoast,beachSites} from './coast.js?v=39';
export function islandOutline(track) {
 return track.points.filter((_,i)=>i%8===0).map(p=>({x:p.x+Math.sin(p.heading)*65,z:p.y-Math.cos(p.heading)*65}));
}
export function insideLand(outline,x,z) {
 let inside=false;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++) {
  const a=outline[i],b=outline[j];
  if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}
export function districtSites(track,id) {
 const sites=[],marine=[],outline=id==='beach'?islandOutline(track):null;
 const coast=id==='coast'?mainlandCoast(track):null,canyon=canyonBounds(track);
 const houses=id==='coast'?beachSites(track).houses:[];
 const clear=(x,z,r=25)=>track.points.every(p=>Math.hypot(p.x-x,p.y-z)>r);
 const dry=(x,z)=>!inCanyon(canyon,x,z,18)&&(!outline||insideLand(outline,x,z))&&(!coast||x>coast.shore[0].x+38);
 for(let i=0;i<track.points.length;i+=80) {
  const p=track.points[i],n=i/80;
  for(const side of [-1,1]) {
   const distance=42+(n%3)*15,x=p.x-Math.sin(p.heading)*distance*side,z=p.y+Math.cos(p.heading)*distance*side;
   if(!clear(x,z)||![-12,12].every(dx=>[-12,12].every(dz=>dry(x+dx,z+dz))))continue;
   if(sites.some(s=>Math.hypot(s.x-x,s.z-z)<35)||houses.some(s=>Math.hypot(s.x-x,s.z-z)<24))continue;
   sites.push({x,z,angle:-p.heading,index:sites.length});
  }
  if(id==='beach'&&n%3===0) {
   const at=d=>({x:p.x+Math.sin(p.heading)*d,z:p.y-Math.cos(p.heading)*d});
   const a=at(54),b=at(108);
   if(insideLand(outline,a.x,a.z)&&[-12,12].every(dx=>[-12,12].every(dz=>!insideLand(outline,b.x+dx,b.z+dz)))&&clear(b.x,b.z,35))
    marine.push({...b,angle:-p.heading,index:marine.length,anchor:a});
  }
 }
 return {sites,marine};
}
