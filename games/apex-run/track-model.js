export const TRACK_BOXES=Object.freeze([
  // Grass is a forgiving 10 cm shoulder below the road, not a wheel-high curb.
  {x:0,y:-.65,z:-20,hx:220,hy:1,hz:220,surface:"grass"},
  {x:47,y:0,z:0,hx:58,hy:.45,hz:13},{x:101,y:0,z:-18,hx:20,hy:.45,hz:22},{x:101,y:0,z:-55,hx:20,hy:.45,hz:34},
  // A broad first-sector apron gives new players room to brake late and draw
  // a progressive arc into the westbound lane instead of hitting a slab end.
  {x:76,y:-.02,z:-80,hx:50,hy:.45,hz:38,surface:"runoff"},
  // Keep the hairpin exit coplanar: overlapping rotated box colliders exposed a
  // hard seam that could catch the chassis during an otherwise ordinary turn.
  {x:91,y:0,z:-103,hx:27,hy:.45,hz:13,surface:"bank"},{x:48,y:0,z:-103,hx:28,hy:.45,hz:13,surface:"bank"},
  {x:8,y:0,z:-103,hx:21,hy:.45,hz:18},{x:-35,y:0,z:-103,hx:24,hy:.45,hz:20},{x:-75,y:0,z:-103,hx:22,hy:.45,hz:20},
  // Visible outside runoff catches an imperfect first turn and leaves room to
  // add steering, rather than dropping the car directly onto slow grass.
  {x:20,y:-.02,z:-140,hx:105,hy:.45,hz:17,surface:"runoff"},
  {x:-82,y:0,z:9,hx:22,hy:.45,hz:116,surface:"bank"},
  // The north straight visibly overlaps the vertical lane by a full car width.
  // Its former -98 m edge left one tire on the lower grass at the corner seam.
  {x:18,y:0,z:140,hx:124,hy:.45,hz:16},{x:135,y:-.02,z:125,hx:55,hy:.45,hz:45,surface:"runoff"},{x:150,y:0,z:72,hx:18,hy:.45,hz:68,surface:"bank"},
]);
// Single authoritative centerline for world arrows and the minimap. Points are
// ordered in race direction; all guidance tangents are derived from this list.
export const ROUTE_PATH=Object.freeze([
  {x:-2,z:0},{x:72,z:0},{x:96,z:-20},{x:96,z:-72},{x:88,z:-92},{x:58,z:-103},{x:-82,z:-103},
  {x:-82,z:120},{x:-62,z:140},{x:130,z:140},{x:150,z:116},{x:150,z:8},
]);
export function routeGuides(spacing=32){const guides=[];for(let i=0;i<ROUTE_PATH.length-1;i++){const a=ROUTE_PATH[i],b=ROUTE_PATH[i+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),steps=Math.max(1,Math.floor(length/spacing));for(let step=0;step<steps;step++){const t=(step+.5)/steps;guides.push({x:a.x+dx*t,z:a.z+dz*t,heading:Math.atan2(dz,dx),segment:i})}}return guides}
export const CHECKPOINTS=Object.freeze([
  {x:99,z:-12,hx:18,hz:18,rotation:Math.PI/2},{x:96,z:-72,hx:28,hz:26,rotation:Math.PI/2},
  {x:-82,z:-103,hx:16,hz:16,rotation:0},{x:-82,z:125,hx:40,hz:20,rotation:Math.PI/2},
  {x:135,z:140,hx:18,hz:16,rotation:0},{x:150,z:8,hx:16,hz:12,rotation:Math.PI/2,finish:true},
]);
export const RECOVERY_SPOTS=Object.freeze([
  {x:-2,y:2.2,z:0,rotation:{x:0,y:0,z:0,w:1}},{x:93,y:1.8,z:-20,rotation:{x:0,y:.7071068,z:0,w:.7071068}},
  {x:82,y:1.9,z:-103,rotation:{x:0,y:1,z:0,w:0}},{x:-82,y:1.8,z:-80,rotation:{x:0,y:-.7071068,z:0,w:.7071068}},
  {x:-82,y:1.8,z:140,rotation:{x:0,y:0,z:0,w:1}},{x:150,y:1.8,z:125,rotation:{x:0,y:.7071068,z:0,w:.7071068}},
]);
export function recoveryForward(rotation){return{x:1-2*(rotation.y*rotation.y+rotation.z*rotation.z),z:2*(rotation.x*rotation.z-rotation.w*rotation.y)}}
const ROAD_BOUNDS=Object.freeze([
  [-11,121,-14,14],[26,126,-118,-42],[81,121,-121,4],[-104,121,-123,-84],[-85,125,-157,-123],[-104,-40,-121,141],[-104,190,80,170],[-104,151,123,157],[132,168,-5,157],
]);
export function isOnRoad({x,z}){return ROAD_BOUNDS.some(([minX,maxX,minZ,maxZ])=>x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ)}
export function checkpointAdvance(current,position){const zone=CHECKPOINTS[current];return zone&&Math.abs(position.x-zone.x)<=zone.hx&&Math.abs(position.z-zone.z)<=zone.hz?current+1:current}
