import {seeded} from './habitats.js?v=ocean10';
import {stepMarineGroups,dolphinRoll} from './marine-encounters.js?v=reef27';
export const MARINE_TYPES=['fish','ray','turtle','jellyfish','shark','dolphin','whale'];
export function populateMarine(add,seed=0){
 const rand=seeded(930^seed);
 const spawn=(type,x,z,group,index,count,speed,range,altitude)=>{
  const a=rand()*Math.PI*2,r=type==='fish'?Math.sqrt(index)*.48:count>1?.9:0;
  const o=add(type,x+Math.cos(a)*r,z+Math.sin(a)*r,a);
  o.swim={group,homeX:x,homeZ:z,range,speed,altitude,phase:rand()*Math.PI*2,offsetX:Math.cos(a)*r,offsetZ:Math.sin(a)*r};
  o.swimY=altitude;o.swimPitch=0;return o;
 };
 let group=0;
 for(const [x,z]of[[-26,32],[-4,27],[24,17],[-20,1],[18,-15],[-22,-31]]){
  for(let i=0;i<12;i++)spawn('fish',x,z,group,i,12,1.4+rand()*.5,8,.3+rand()*.25);group++;
 }
 for(const [type,count,speed,range,altitude]of[['ray',4,1.1,8,.35],['turtle',4,.8,7,.3],['jellyfish',8,.55,8,.65],['shark',3,2.1,14,.65],['dolphin',4,2.4,13,.8],['whale',2,1.15,17,1]]){
  for(let i=0;i<count;i++){
   const x=type==='whale'?(i?-13:17):-32+rand()*64,z=type==='whale'?-20+i*23:-30+rand()*59;
   const o=spawn(type,x,z,group++,0,1,speed,range,altitude);
   if(type==='whale')o.swim.route=i;
   if(type==='dolphin'){o.swim.escort=i%2;o.swim.side=i<2?-1:1;}
  }
 }
}
export function createSchools(objects){
 const schools=new Map();for(const o of objects)if(o.swim&&!schools.has(o.swim.group)){
  const s=o.swim;schools.set(s.group,{group:s.group,type:o.type,route:s.route,escort:s.escort,side:s.side,x:s.homeX,z:s.homeZ,homeX:s.homeX,homeZ:s.homeZ,heading:s.phase,range:s.range,speed:s.speed,phase:s.phase,radius:o.radius});
 }
 for(const o of objects){const s=o.swim,g=schools.get(s.group),c=Math.cos(g.heading),n=Math.sin(g.heading);o.x=g.x+s.offsetX*c+s.offsetZ*n;o.z=g.z-s.offsetX*n+s.offsetZ*c;o.yaw=g.heading;o.swimY=s.altitude+Math.sin(s.phase)*.06;s.vx=Math.sin(g.heading)*g.speed;s.vz=Math.cos(g.heading)*g.speed;}
 return schools;
}
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function updateMarine(objects,schools,dt,time,obstacles=[],player=null){
 if(!objects.length)return;
 stepMarineGroups(objects,schools,dt,time,player);
 for(const o of objects){
  if(o.phase!=='idle')continue;
  const s=o.swim,g=schools.get(s.group),c=Math.cos(g.heading),n=Math.sin(g.heading);
  const tightness=g.tightness??1,speed=g.travelSpeed??g.speed,x=g.x+(s.offsetX*c+s.offsetZ*n)*tightness,z=g.z+(-s.offsetX*n+s.offsetZ*c)*tightness;
  let vx=Math.sin(g.heading)*speed+(x-o.x)*1.8,vz=Math.cos(g.heading)*speed+(z-o.z)*1.8;
  // Local steering keeps swimmers out of tall reef/cargo footprints without rigid-body work.
  for(const obstacle of obstacles){
   if(obstacle.phase==='consumed')continue;
   const dx=o.x-obstacle.x,dz=o.z-obstacle.z,d=Math.hypot(dx,dz),reach=obstacle.radius*.8+o.radius*.5+.5;
   if(d<reach&&d>.001){const push=(1-d/reach)*g.speed*4;vx+=dx/d*push;vz+=dz/d*push;}
  }
  const magnitude=Math.hypot(vx,vz),limit=g.speed*1.65;if(magnitude>limit){vx*=limit/magnitude;vz*=limit/magnitude;}
  const blend=1-Math.exp(-4*dt);s.vx+=(vx-s.vx)*blend;s.vz+=(vz-s.vz)*blend;o.x+=s.vx*dt;o.z+=s.vz*dt;
  o.yaw+=Math.max(-1.7*dt,Math.min(1.7*dt,angleDelta(Math.atan2(s.vx,s.vz),o.yaw)));
  o.swimY+=(s.altitude+Math.sin(time*(o.type==='jellyfish'?1.7:.9)+s.phase)*.06-o.swimY)*blend;o.swimPitch*=Math.exp(-4*dt);
  const near=player&&Math.hypot(o.x-player.x,o.z-player.z)<player.radius+5;
  const rollTarget=o.type==='dolphin'&&g.behavior==='escorting'&&!near?dolphinRoll(time,s.phase):0;
  o.swimRoll=(o.swimRoll||0)+Math.max(-3.8*dt,Math.min(3.8*dt,angleDelta(rollTarget,o.swimRoll||0)));
 }
}
export function captureSwimmer(o,player,dt){
 if(o.phase==='idle'){
  if(o.radius>player.radius*.82||Math.hypot(o.x-player.x,o.z-player.z)>player.radius-o.radius*.45)return false;
  o.phase='diving';o.water={x:player.x,z:player.z,radius:player.radius,age:0,vy:0,vx:o.swim.vx||0,vz:o.swim.vz||0};
 }
 const w=o.water,shape=o.shape||{height:o.radius*.7,depth:o.radius*1.7};w.age+=dt;
 o.swimRoll=(o.swimRoll||0)+Math.max(-3.8*dt,Math.min(3.8*dt,angleDelta(0,o.swimRoll||0)));
 if(!w.committed){
  if(o.swimY+shape.height*.5<-.12)w.committed=true;
  else if(Math.hypot(o.x-player.x,o.z-player.z)>player.radius+o.radius*.15){o.phase='idle';o.owner=null;o.swim.vx=w.vx;o.swim.vz=w.vz;o.water=null;return false;}
  if(!w.committed){w.x=player.x;w.z=player.z;w.radius=player.radius;}
 }
 const dx=w.x-o.x,dz=w.z-o.z,drag=Math.exp(-3*dt);
 w.vx=(w.vx+dx*5*dt-dz*.6*dt)*drag;w.vz=(w.vz+dz*5*dt+dx*.6*dt)*drag;
 o.x+=w.vx*dt;o.z+=w.vz*dt;w.vy-=dt*(8+w.age*5);o.swimY+=w.vy*dt;
 o.swimPitch=Math.min(.42,w.age*.45);
 // Conservatively include the pitched body's length; score only fully below the seabed.
 return o.swimY+shape.height+(shape.width||0)*.5*Math.abs(Math.sin(o.swimRoll||0))+shape.depth*.5*Math.sin(o.swimPitch)<-.35;
}
