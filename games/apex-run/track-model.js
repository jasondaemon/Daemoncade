export const TRACK_BOXES=Object.freeze([
  // Grass is a forgiving 10 cm shoulder below the road, not a wheel-high curb.
  {x:0,y:-.65,z:-20,hx:220,hy:1,hz:220,surface:"grass"},
  {x:47,y:0,z:0,hx:58,hy:.45,hz:13},{x:101,y:0,z:-18,hx:20,hy:.45,hz:22},{x:101,y:0,z:-61,hx:13,hy:.45,hz:38},
  // Keep the hairpin exit coplanar: overlapping rotated box colliders exposed a
  // hard seam that could catch the chassis during an otherwise ordinary turn.
  {x:91,y:0,z:-103,hx:27,hy:.45,hz:13,surface:"bank"},{x:48,y:0,z:-103,hx:28,hy:.45,hz:13,surface:"bank"},
  {x:8,y:0,z:-103,hx:21,hy:.45,hz:18},{x:-35,y:0,z:-103,hx:24,hy:.45,hz:20},{x:-75,y:0,z:-103,hx:22,hy:.45,hz:20},
  {x:-82,y:0,z:9,hx:22,hy:.45,hz:116,surface:"bank"},{x:22,y:0,z:140,hx:120,hy:.45,hz:16},{x:150,y:0,z:72,hx:18,hy:.45,hz:68,surface:"bank"},
]);
export const CHECKPOINTS=Object.freeze([
  {x:99,z:-12,hx:18,hz:18,rotation:Math.PI/2},{x:101,z:-103,hx:18,hz:12,rotation:Math.PI/2},
  {x:-82,z:-103,hx:16,hz:16,rotation:0},{x:-82,z:125,hx:16,hz:18,rotation:Math.PI/2},
  {x:135,z:140,hx:18,hz:16,rotation:0},{x:150,z:8,hx:16,hz:12,rotation:Math.PI/2,finish:true},
]);
export const RECOVERY_SPOTS=Object.freeze([
  {x:-2,y:2.2,z:0,rotation:{x:0,y:0,z:0,w:1}},{x:93,y:1.8,z:-20,rotation:{x:0,y:.7071068,z:0,w:.7071068}},
  {x:82,y:1.9,z:-103,rotation:{x:0,y:1,z:0,w:0}},{x:-82,y:1.8,z:-80,rotation:{x:0,y:-.7071068,z:0,w:.7071068}},
  {x:-82,y:1.8,z:140,rotation:{x:0,y:0,z:0,w:1}},{x:150,y:1.8,z:125,rotation:{x:0,y:.7071068,z:0,w:.7071068}},
]);
export function recoveryForward(rotation){return{x:1-2*(rotation.y*rotation.y+rotation.z*rotation.z),z:2*(rotation.x*rotation.z-rotation.w*rotation.y)}}
const ROAD_BOUNDS=Object.freeze([
  [-11,121,-14,14],[81,121,-121,4],[-104,121,-123,-84],[-104,-60,-121,141],[-104,151,123,157],[132,168,-5,157],
]);
export function isOnRoad({x,z}){return ROAD_BOUNDS.some(([minX,maxX,minZ,maxZ])=>x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ)}
export function checkpointAdvance(current,position){const zone=CHECKPOINTS[current];return zone&&Math.abs(position.x-zone.x)<=zone.hx&&Math.abs(position.z-zone.z)<=zone.hz?current+1:current}
