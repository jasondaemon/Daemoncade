import {CAMP_SITES,CAMP_TRAILS,campDry} from './habitats.js?v=camp-life32';

export function populateCampLife(add){
 const create=(type,path,speed,art,role,offset=0)=>{
  const p=path[offset%path.length],o=add(type,p.x,p.z);o.art=art;
  o.walker={camp:true,path,next:(offset+1)%path.length,speed,pace:role==='fishing'?0:1,gait:offset*2.399,role,panicUntil:0};
  if(art===4&&type==='person'){o.radius=.23;o.mass=.08;}
  if(role==='fishing')o.radius=.45;
  return o;
 };
 for(const site of[0,2,4,8]){
  const c=CAMP_SITES[site],path=Array.from({length:8},(_,i)=>({x:c.x+Math.cos(i*Math.PI/4)*4.8,z:c.z+Math.sin(i*Math.PI/4)*4.8}));
  for(let i=0;i<3;i++)create('person',path,.62, i===2?4:3,'family',i*2);
 }
 for(let i=0;i<6;i++){
  const p=CAMP_TRAILS[i%3],path=[...p,...p.slice(1,-1).reverse()];create('person',path,.95,3,'hiking',i%path.length);
 }
 for(const [x,z,yaw]of[[-29.3,4.5,-Math.PI/2],[-33,12,-2.2],[-42,-1,0]]){
  const o=create('person',[{x,z},{x:x+1,z:z+.8}],.7,5,'fishing');o.yaw=yaw;
 }
 for(let i=0;i<12;i++){
  const c=[{x:-39,z:-34},{x:37,z:35},{x:18,z:-17}][i%3],path=Array.from({length:10},(_,j)=>({x:c.x+Math.cos(j*Math.PI/5)*5,z:c.z+Math.sin(j*Math.PI/5)*4}));
  create(i<8?'deer':'fox',path,i<8?.75:1.05,0,'wildlife',i%10);
 }
}

export function updateCampLife(people,dt,time,hole,obstacles){
 for(const o of people){
  const w=o.walker;if(!w.camp||o.phase!=='idle'||o.body)continue;
  const near=Math.hypot(o.x-hole.x,o.z-hole.z)<hole.radius+4;
  if(near)w.panicUntil=time+1.2;
  const fleeing=time<w.panicUntil;
  const resting=w.role==='fishing'&&!fleeing;
  const target=w.path[w.next];let dx=target.x-o.x,dz=target.z-o.z,d=Math.hypot(dx,dz);
  if(d<.6){w.next=(w.next+1)%w.path.length;}
  if(fleeing){dx+=(o.x-hole.x)*1.8;dz+=(o.z-hole.z)*1.8;}
  if(!resting){
   d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;
   // Soft avoidance keeps families from marching through parked rigs or trees.
   for(const other of obstacles){if(other===o||other.phase!=='idle')continue;const x=o.x-other.x,z=o.z-other.z,edge=other.radius+o.radius+.5,dist2=x*x+z*z;if(dist2<edge*edge&&dist2>.0001){const dist=Math.sqrt(dist2);dx+=x/dist*(edge-dist)*4;dz+=z/dist*(edge-dist)*4;}}
   d=Math.hypot(dx,dz)||1;const speed=w.speed*(fleeing?1.8:1),step=speed*dt,x=Math.max(-51,Math.min(51,o.x+dx/d*step)),z=Math.max(-51,Math.min(51,o.z+dz/d*step));
   if(campDry(x,z,.15)){o.x=x;o.z=z;}else{w.next=(w.next+1)%w.path.length;}
   const desired=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(desired-o.yaw),Math.cos(desired-o.yaw));o.yaw+=Math.max(-3*dt,Math.min(3*dt,delta));
  }
  w.pace+=((resting?.12:fleeing?1.8:1)-w.pace)*(1-Math.exp(-7*dt));w.gait+=dt*(resting?.7:7*w.pace);
 }
}
