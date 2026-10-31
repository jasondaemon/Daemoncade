import {signalState} from './junctions.js?v=identity23';
export const CITY_JUNCTIONS=[-26,0,26].flatMap(x=>[-24,2,28].map(z=>({x,z,key:`${x}:${z}`})));
const active=o=>o.phase==='idle'&&!o.body&&o.traffic?.city&&!o.traffic.stopped;
export function liveSignal(context,x,z){
 const signal=context.signalMap?context.signalMap.get(x*128+z):context.signals.find(o=>o.junction?.x===x&&o.junction?.z===z);
 return signal?.phase!=='consumed'?signal:undefined;
}
export function hazardSpeed(car,hole){
 if(!hole)return Infinity;
 const vx=Math.sin(car.yaw),vz=Math.cos(car.yaw),dx=hole.x-car.x,dz=hole.z-car.z,ahead=dx*vx+dz*vz,lateral=Math.abs(dx*vz-dz*vx);
 if(ahead<=0||ahead>hole.radius+9||lateral>hole.radius+car.radius*.6)return Infinity;
 return Math.max(0,(ahead-hole.radius-car.radius*.6-1.2)*1.5);
}
export function escapeFactor(car,hole){
 if(!hole)return 1;const dx=hole.x-car.x,dz=hole.z-car.z,ahead=dx*Math.sin(car.yaw)+dz*Math.cos(car.yaw),lateral=Math.abs(dx*Math.cos(car.yaw)-dz*Math.sin(car.yaw));
 return ahead<0&&ahead>-(hole.radius+6)&&lateral<hole.radius+1?1.28:1;
}
// Junctions admit one approaching car at a time; controlled ones also require
// green. Reservations release on capture/exit and use no wall-clock timers.
export function prepareJunctions(cars,context,time=0){
 const {slots,player}=context;
 for(const j of CITY_JUNCTIONS){
  const controlled=Boolean(liveSignal(context,j.x,j.z));
  let slot=slots.get(j.key),owner=slot&&cars.find(o=>o.id===slot.owner);
  if(slot){
   const d=owner?Math.hypot(owner.x-j.x,owner.z-j.z):Infinity;
   if(d<3)slot.entered=true;
   const green=owner&&signalState(time,Math.abs(Math.sin(owner.yaw))>.7?'x':'z')==='green';
   if(!owner||!active(owner)||d>10||slot.entered&&d>6||!slot.entered&&(hazardSpeed(owner,player)<.15||controlled&&!green)){slots.delete(j.key);slot=null;}
  }
  if(slot)continue;
  let candidate=null,best=Infinity;
  for(const car of cars){
   if(!active(car))continue;
   const dx=j.x-car.x,dz=j.z-car.z,d=Math.hypot(dx,dz),vx=Math.sin(car.yaw),vz=Math.cos(car.yaw),ahead=dx*vx+dz*vz,lateral=Math.abs(dx*vz-dz*vx);
   if(!(d<3||ahead>0&&ahead<7&&lateral<1.7)||d>=3&&(hazardSpeed(car,player)<.15||controlled&&signalState(time,Math.abs(vx)>.7?'x':'z')!=='green'))continue;
   const priority=d<3?d-10:ahead;
   if(priority<best||priority===best&&car.id<candidate.id){candidate=car;best=priority;}
  }
  if(candidate)slots.set(j.key,{owner:candidate.id,entered:Math.hypot(candidate.x-j.x,candidate.z-j.z)<3});
 }
}
export function junctionSpeed(car,pose,context){
 let limit=Infinity;
 for(const j of CITY_JUNCTIONS){
  if(context.slots.get(j.key)?.owner===car.id)continue;
  const dx=j.x-car.x,dz=j.z-car.z,ahead=dx*pose.vx+dz*pose.vz,lateral=Math.abs(dx*pose.vz-dz*pose.vx);
  if(ahead>2&&ahead<7&&lateral<1.7)limit=Math.min(limit,Math.max(0,(ahead-3)*1.6));
 }
 return limit;
}
export function crossingWait(crossing,time,signalState,context){
 const z=[-24,2,28].sort((a,b)=>Math.abs(a-crossing.z)-Math.abs(b-crossing.z))[0];
 if(liveSignal(context,crossing.at,z))return signalState(time,'x')!=='green';
 return context.traffic.some(car=>active(car)&&Math.abs(car.z-crossing.z)<5&&Math.abs(car.x-crossing.at)<4);
}
