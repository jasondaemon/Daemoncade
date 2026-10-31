import {CITY_BLOCKS,CITY_STREETS} from './city-layout.js?v=streets28';
import {signalState} from './junctions.js?v=identity23';
import {hazardSpeed,escapeFactor,prepareJunctions,junctionSpeed,liveSignal,crossingWait} from './city-encounters.js?v=streets28';
const TAU=Math.PI*2;
export const CITY_ROUTES=[
 {left:-27.1,right:27.1,top:-25.1,bottom:29.1,direction:1},
 {left:-24.9,right:24.9,top:-22.9,bottom:26.9,direction:-1},
 {left:-27.1,right:1.1,top:-25.1,bottom:29.1,direction:1},
 {left:-1.1,right:27.1,top:-25.1,bottom:29.1,direction:1}
];
export function routeLength(r){return 2*(r.right-r.left+r.bottom-r.top)-8*4+TAU*4;}
export function cityPose(distance,r){
 const radius=4,length=routeLength(r);let d=((distance*r.direction)%length+length)%length;
 const segments=[r.right-r.left-8,r.bottom-r.top-8,r.right-r.left-8,r.bottom-r.top-8],starts=[[r.left+4,r.top,1,0],[r.right,r.top+4,0,1],[r.right-4,r.bottom,-1,0],[r.left,r.bottom-4,0,-1]],centers=[[r.right-4,r.top+4],[r.right-4,r.bottom-4],[r.left+4,r.bottom-4],[r.left+4,r.top+4]];
 for(let i=0;i<4;i++){
  const [x,z,vx,vz]=starts[i];if(d<segments[i])return {x:x+vx*d,z:z+vz*d,vx:vx*r.direction,vz:vz*r.direction,yaw:Math.atan2(vx*r.direction,vz*r.direction)};d-=segments[i];
  if(d<Math.PI*2){const a=-Math.PI/2+i*Math.PI/2+d/4,[cx,cz]=centers[i],vx=-Math.sin(a)*r.direction,vz=Math.cos(a)*r.direction;return {x:cx+Math.cos(a)*4,z:cz+Math.sin(a)*4,vx,vz,yaw:Math.atan2(vx,vz)};}d-=Math.PI*2;
 }
 return cityPose(0,r);
}
export function populateLife(add){
 for(let route=0;route<CITY_ROUTES.length;route++)for(let i=0;i<4;i++){
  const path=CITY_ROUTES[route],distance=(i+.13*route)*routeLength(path)/4,p=cityPose(distance,path),car=add(route===3&&i%2?'van':'car',p.x,p.z,p.yaw);
  car.traffic={city:true,route,distance,speed:3.2+route*.2,vx:p.vx*3.2,vz:p.vz*3.2,stopped:false};
 }
 for(let i=0;i<24;i++){
  const block=CITY_BLOCKS[i%CITY_BLOCKS.length],crossing=i>=20?{at:i%2?-26:0,z:i%2?-18.2:33.8}:null;
  const path=crossing?{left:crossing.at-7,right:crossing.at+7,top:crossing.z,bottom:crossing.z,length:28}:walkPath(block),distance=(i*.371%1)*path.length,p=walkPose(distance,path),o=add('person',p.x,p.z,p.yaw);
  o.walker={path,crossing,distance,direction:i%2?1:-1,speed:1.05+(i%3)*.1,panicUntil:0,pace:1,gait:i*2.399};
  o.art=i%3;
 }
}
function walkPath(b){
 const xs=CITY_STREETS.filter(s=>s.axis==='z'),zs=CITY_STREETS.filter(s=>s.axis==='x');
 const edge=(streets,c,side)=>{const candidates=streets.filter(s=>side<0?s.at<c:s.at>c).sort((a,b)=>Math.abs(a.at-c)-Math.abs(b.at-c));return candidates.length?candidates[0].at-side*(candidates[0].width/2+2):side*51;};
 const left=edge(xs,b.x,-1),right=edge(xs,b.x,1),top=edge(zs,b.z,-1),bottom=edge(zs,b.z,1);
 return {left,right,top,bottom,length:2*(right-left+bottom-top)};
}
function walkPose(distance,p){
 let d=((distance%p.length)+p.length)%p.length,w=p.right-p.left,h=p.bottom-p.top;
 if(d<w)return {x:p.left+d,z:p.top,yaw:Math.PI/2,tx:1,tz:0};d-=w;
 if(d<h)return {x:p.right,z:p.top+d,yaw:0,tx:0,tz:1};d-=h;
 if(d<w)return {x:p.right-d,z:p.bottom,yaw:-Math.PI/2,tx:-1,tz:0};d-=w;
 return {x:p.left,z:p.bottom-d,yaw:Math.PI,tx:0,tz:-1};
}
export function updatePeople(objects,dt,time,hole,context=null){
 for(const o of objects){
  if(o.walker.camp)continue;
  if(o.phase!=='idle'||o.body)continue;const w=o.walker,p=walkPose(w.distance,w.path),dx=o.x-hole.x,dz=o.z-hole.z,near=Math.hypot(dx,dz)<hole.radius+5;
  if(near&&time>w.panicUntil){w.direction=dx*p.tx+dz*p.tz>=0?1:-1;w.panicUntil=time+1.2;}
  const panic=near||time<w.panicUntil,waiting=w.crossing&&(context?crossingWait(w.crossing,time,signalState,context):signalState(time,'x')!=='green')&&Math.abs(o.x-w.crossing.at)>((w.crossing.at===0?10:7)/2+.4);
  w.pace+=((waiting?0:panic?2:1)-w.pace)*(1-Math.exp(-8*dt));w.gait+=7*w.pace*dt;
  if(!waiting)w.distance+=w.direction*w.speed*(panic?2:1)*dt;
  const next=walkPose(w.distance,w.path);o.x=next.x;o.z=next.z;const desired=next.yaw+(w.direction<0?Math.PI:0),delta=Math.atan2(Math.sin(desired-o.yaw),Math.cos(desired-o.yaw));o.yaw+=Math.max(-6*dt,Math.min(6*dt,delta));
 }
}
export function updateCityTraffic(objects,dt,time,people=[],context=null){
 if(context)prepareJunctions(objects,context,time);
 const changes=[];
 for(const o of objects){
  const t=o.traffic;if(!t.city||t.stopped||o.body||o.phase!=='idle')continue;
  const path=CITY_ROUTES[t.route],p=cityPose(t.distance,path);let speed=t.speed;
  if(context){t.escape=(t.escape||1)+(escapeFactor(o,context.player)-(t.escape||1))*(1-Math.exp(-3*dt));speed*=t.escape;speed=Math.min(speed,hazardSpeed(o,context.player),junctionSpeed(o,p,context));}
  // Project actual nearby cars onto this driver's heading: works across routes.
  for(const other of objects){if(other===o||other.phase!=='idle'||other.body)continue;const dx=other.x-o.x,dz=other.z-o.z,along=dx*p.vx+dz*p.vz,lateral=Math.abs(dx*p.vz-dz*p.vx);if(along>0&&along<4&&lateral<1.2)speed=Math.min(speed,Math.max(0,(along-2.8)*2));}
  for(const person of people){if(!person.walker.crossing||person.phase!=='idle'||person.body)continue;const dx=person.x-o.x,dz=person.z-o.z,ahead=dx*p.vx+dz*p.vz,lateral=Math.abs(dx*p.vz-dz*p.vx);if(ahead>0&&ahead<4.5&&lateral<1.3)speed=Math.min(speed,Math.max(0,(ahead-1.8)*2));}
  const horizontal=Math.abs(p.vx)>.95,vertical=Math.abs(p.vz)>.95;
  if(horizontal&&signalState(time,'x')!=='green'||vertical&&signalState(time,'z')!=='green')for(const x of[-26,0,26])for(const z of[-24,2,28]){
   if(context&&!liveSignal(context,x,z))continue;
   const slot=context?.slots.get(`${x}:${z}`);if(slot?.owner===o.id&&slot.entered)continue;
   const dx=x-o.x,dz=z-o.z,ahead=dx*p.vx+dz*p.vz,lateral=Math.abs(dx*p.vz-dz*p.vx);
   if(ahead>2.5&&ahead<5&&lateral<1.6)speed=Math.min(speed,Math.max(0,(ahead-2.7)*2));
  }
  t.waiting=speed<.2;t.braking=speed<t.speed*.65;const distance=t.distance+speed*dt,next=cityPose(distance,path);changes.push({o,t,distance,next,speed});
 }
 for(const {o,t,distance,next,speed}of changes){t.distance=distance%routeLength(CITY_ROUTES[t.route]);o.x=next.x;o.z=next.z;o.yaw=next.yaw;t.vx=next.vx*speed;t.vz=next.vz*speed;}
}
