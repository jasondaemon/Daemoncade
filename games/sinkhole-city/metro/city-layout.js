import {populateParks} from './park-art.js?v=parks42';
// Authored lots, not a repeating block stamp. Coordinates share the road plan.
export const CITY_BLOCKS=[
 {x:-38,z:-37,kind:'terrace',plots:[[-4.6,-3.6,0,0],[0,-3.6,1,0],[4.6,-3.6,5,0]]},
 {x:-38,z:-11,kind:'garden',plots:[[-3.5,-3.8,2],[3.5,-2.9,0]]},
 {x:-38,z:15,kind:'park',plots:[]},
 {x:-38,z:41,kind:'tower',plots:[]},
 {x:-13,z:-37,kind:'court',plots:[[-4.6,-3.8,0,Math.PI],[0,-3.8,5,Math.PI],[4.6,-3.8,2,Math.PI],[-4.6,3.8,2,0],[0,3.8,0,0],[4.6,3.8,5,0]]},
 {x:-13,z:-11,kind:'civic',plots:[[-3.8,0,3],[3.6,1.4,2]]},
 {x:-13,z:15,kind:'arcade',plots:[[-4.6,-3.8,1,0],[0,-3.8,4,0],[4.6,-3.8,1,0]]},
 {x:-13,z:41,kind:'garden',plots:[[-3.5,2.8,0],[3.8,-2.7,5]]},
 {x:13,z:-37,kind:'depot',plots:[[-3.7,-2.8,'warehouse'],[3.8,2.2,4]]},
 {x:13,z:-11,kind:'square',plots:[[0,-2.8,2]]},
 {x:13,z:15,kind:'market',plots:[[-3.6,-3.4,4],[3.6,-3.4,1]]},
 {x:13,z:41,kind:'court',plots:[[-4.6,-3.8,5,Math.PI],[0,-3.8,0,Math.PI],[4.6,-3.8,2,Math.PI],[-4.6,3.8,2,0],[0,3.8,5,0],[4.6,3.8,0,0]]},
 {x:38,z:-37,kind:'works',plots:[[-3.8,-3.8,'warehouse'],[3.8,-2.8,3],[0,4.2,4]]},
 {x:38,z:-11,kind:'yard',plots:[[-2.8,-2.6,'warehouse']]},
 {x:38,z:15,kind:'terrace',plots:[[-4.6,3.6,1,Math.PI],[0,3.6,0,Math.PI],[4.6,3.6,5,Math.PI]]},
 {x:38,z:41,kind:'square',plots:[[2.5,1.4,3]]}
];
export const CITY_STREETS=[
 {axis:'z',at:-26,width:7,min:-54,max:50},{axis:'z',at:0,width:10,min:-56,max:56},{axis:'z',at:26,width:7,min:-52,max:49},
 {axis:'x',at:-24,width:7,min:-52,max:52},{axis:'x',at:2,width:9,min:-54,max:54},{axis:'x',at:28,width:7,min:-50,max:52}
];
// Parking shares the continuous asphalt, tucked against the curb, not inset bays.
export const CITY_PARKING=[
 {axis:'z',at:-26,side:-1,along:-39,type:'car'},{axis:'z',at:-26,side:1,along:-9,type:'car'},
 {axis:'z',at:0,side:-1,along:-35,type:'van'},{axis:'z',at:0,side:1,along:18,type:'car'},
 {axis:'z',at:26,side:-1,along:-39,type:'van'},{axis:'z',at:26,side:1,along:11,type:'car'},
 {axis:'z',at:-26,side:1,along:39,type:'car'},{axis:'z',at:26,side:-1,along:44,type:'van'},
 {axis:'x',at:-24,side:-1,along:-11,type:'car'},{axis:'x',at:2,side:1,along:38,type:'car'},
 {axis:'x',at:28,side:-1,along:12,type:'van'},{axis:'x',at:28,side:1,along:-39,type:'car'}
];
export function parkingPose(b){const street=CITY_STREETS.find(s=>s.axis===b.axis&&s.at===b.at),offset=b.side*(street.width/2-.8);return b.axis==='z'?{x:b.at+offset,z:b.along,yaw:b.side>0?0:Math.PI}:{x:b.along,z:b.at+offset,yaw:b.side>0?Math.PI/2:-Math.PI/2};}
export function curbIntervals(street){
 let intervals=[[street.min,street.max]];
 for(const crossing of CITY_STREETS.filter(s=>s.axis!==street.axis)){
  const lo=crossing.at-crossing.width/2-2,hi=crossing.at+crossing.width/2+2;
  intervals=intervals.flatMap(([a,b])=>hi<=a||lo>=b?[[a,b]]:[[a,Math.max(a,lo)],[Math.min(b,hi),b]].filter(([x,y])=>y-x>.1));
 }
 return intervals;
}
export function populateCity(add){
 const objects=[],place=(type,x,z,yaw=0)=>{
  // Small details cannot hide inside buildings or each other.
  const radii={tree:1.1,bench:.85,cart:1.15,crate:.42,bin:.46,lamp:.46,hydrant:.38,cone:.32};
  const radius=radii[type]||0;if(objects.some(o=>Math.hypot(o.x-x,o.z-z)<o.radius+radius+.18))return null;
  const o=add(type,x,z,yaw);objects.push(o);return o;
 };
 for(const [i,b]of CITY_BLOCKS.entries()){
  for(const [dx,dz,style,yaw]of b.plots){const o=add(style==='warehouse'?'warehouse':'building',b.x+dx,b.z+dz,yaw??(i%4)*Math.PI/2);if(style!=='warehouse')o.art=style;objects.push(o);}
 }
 const tower=add('landmark',-38,41);objects.push(tower);
 for(const [i,b]of CITY_BLOCKS.entries()){
  const {x,z,kind}=b,green=['park','garden','tower'].includes(kind),work=['yard','works','depot'].includes(kind),market=['market','arcade'].includes(kind);
  // Corners/services, not a bin every five metres on both sides of every road.
  if(i%2===0)place('hydrant',x+(i%3?6.5:-6.5),z+(i%3?7.6:-7.6));
  place('lamp',x+(i%3?7.4:-7.4),z+(i%2?-6.9:6.9));
  if(green||market||kind==='civic')place('bin',x+(i%2?5.8:-5.8),z+7.4);
  const anchors=green?[[-4,-3],[3,-4],[-3,3],[4,3],[0,6]]:work?[[-5,4],[-3,5],[0,4],[3,5],[5,5]]:market?[[-5,4],[-2,4],[1,5],[4,4],[0,7.3]]:[[-6.2,0],[6.2,1],[0,6.7],[-4,7],[4,-7]];
  for(const [j,[dx,dz]]of anchors.entries()){
   if(kind==='park')continue; // Its fountain, seating and grove are authored below.
   place(green?(j%2?'bench':'tree'):work?'crate':market?(j===2?'cart':'crate'):(j%2?'bench':'tree'),x+dx,z+dz,(i+j)%4*Math.PI/2);
  }
  // Deliveries cluster at service entrances; construction cones belong to works.
  if(work||market)for(const [dx,dz]of[[-5.7,6.8],[-4.5,6.9],[-5.8,5.6],[5.8,-6.7]])place('crate',x+dx,z+dz,.15*(i%3));
  if(['works','yard'].includes(kind))for(const [dx,dz]of[[1,6.8],[2.3,6.4],[3.4,6.9]])place('cone',x+dx,z+dz);
  // A few sidewalk fixtures keep each entrance playable at starting size.
  if(i%4===0)for(const [dx,dz]of[[-7.2,3.4],[6.9,-3.2]])place('crate',x+dx,z+dz);
 }
 // Parking has gaps and purpose: side-street visitors, loading and market vans.
 for(const [x,z]of[[0,-24],[0,2],[0,28],[-26,2],[26,2]]){
  const sx=CITY_STREETS.find(s=>s.axis==='z'&&s.at===x),sz=CITY_STREETS.find(s=>s.axis==='x'&&s.at===z),px=x+sx.width/2+1.3,pz=z+sz.width/2+1.3;
  const lamp=objects.filter(o=>o.type==='lamp'&&!o.signal).sort((a,b)=>Math.hypot(a.x-px,a.z-pz)-Math.hypot(b.x-px,b.z-pz))[0];
  lamp.x=px;lamp.z=pz;lamp.yaw=0;lamp.signal=true;lamp.junction={x,z};
 }
 for(const bay of CITY_PARKING){const p=parkingPose(bay);add(bay.type,p.x,p.z,p.yaw).parked=true;}
 populateParks(add);
 let tree=0;for(const o of objects)if(o.type==='tree')o.treeStyle=['linden','birch','cedar'][tree++%3];
}
