import {seeded} from './habitats.js?v=ocean10';

export const ORBIT_LANES=[{x:0,z:0,rx:15,rz:12},{x:0,z:0,rx:29,rz:24},{x:0,z:0,rx:44,rz:37}];
// Four planet removals tighten the belts, never the remaining planets' routes.
// The final inner belt still has a navigable radius, rather than stacking every
// uncollected object on the star or awarding an automatic cleanup.
export function orbitContraction(planets=0){return 1-.12*Math.max(0,Math.min(4,Number.isFinite(planets)?planets:0));}
function place(add,type,lane,angle,speed,altitude){
 const o=add(type,lane.x+Math.cos(angle)*lane.rx,lane.z+Math.sin(angle)*lane.rz);
 o.orbital={...lane,angle,speed,altitude,contraction:1,vx:-Math.sin(angle)*lane.rx*speed,vz:Math.cos(angle)*lane.rz*speed};
 o.orbitY=altitude;o.yaw=Math.atan2(o.orbital.vx,o.orbital.vz);return o;
}
export function populateOrbit(add,seed=0){
 const random=seeded(1313^seed),phase=seed?random()*Math.PI*2:0;
 for(let belt=0;belt<3;belt++)for(let i=0;i<48;i++){
  const lane=ORBIT_LANES[belt],a=i*Math.PI/24+random()*.1+phase,offset=(random()-.5)*5;
  place(add,'debris',{...lane,rx:lane.rx+offset,rz:lane.rz+offset},a,.008+random()*.007,.12+random()*.15);
 }
 for(let i=0;i<10;i++)place(add,'satellite',ORBIT_LANES[i%3],i*Math.PI/5+.3+phase,i%2?.045:-.04,.55);
 for(let i=0;i<8;i++)place(add,'probe',ORBIT_LANES[1+i%2],i*Math.PI/4+.65+phase,i%2?-.06:.055,.7);
 for(let i=0;i<6;i++)place(add,'shuttle',ORBIT_LANES[1+i%2],i*Math.PI/3+.2+phase,i%2?.035:-.03,.75);
 for(let i=0;i<4;i++){
  const p=place(add,'planet',{x:0,z:0,rx:34,rz:29},i*Math.PI/2+.7+phase,.009,.3);p.variant=['ocean','desert','ringed','ice'][i];
 }
 const sun=place(add,'landmark',{x:0,z:0,rx:0,rz:0},0,0,.3);sun.variant='sun';sun.phase='sealed';
}

export function updateOrbit(objects,dt,time,planets=0){
 if(!(dt>0))return;
 const target=orbitContraction(planets),blend=1-Math.exp(-.18*dt);
 for(const o of objects){
  const b=o.orbital;
  // Advance even captured bodies' guide state so the renderer can always read
  // one shared belt scale. Intake itself retains its world-space commitment.
  b.contraction=(b.contraction??1)+(target-(b.contraction??1))*blend;
  if(o.phase!=='idle'&&o.phase!=='sealed')continue;
  const scale=['planet','landmark'].includes(o.type)?1:b.contraction;
  b.angle+=b.speed/Math.sqrt(scale)*dt;
  const x=b.x+Math.cos(b.angle)*b.rx*scale,z=b.z+Math.sin(b.angle)*b.rz*scale;
  // Recovery approaches the moving orbit at bounded speed instead of snapping back.
  const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz),step=Math.min(1,(Math.abs(b.speed)*Math.max(b.rx,b.rz)+2)*dt/Math.max(.0001,d));
  const px=o.x,pz=o.z;o.x+=dx*step;o.z+=dz*step;b.vx=(o.x-px)/dt;b.vz=(o.z-pz)/dt;
  if(Math.hypot(b.vx,b.vz)>.01){const desired=Math.atan2(b.vx,b.vz),delta=Math.atan2(Math.sin(desired-o.yaw),Math.cos(desired-o.yaw));o.yaw+=Math.max(-dt,Math.min(dt,delta));}
  o.orbitY+=(b.altitude+Math.sin(time*.8+o.id)*.045-o.orbitY)*(1-Math.exp(-4*dt));o.orbitPitch=(o.orbitPitch||0)*Math.exp(-4*dt);
 }
}

export function captureOrbiter(o,p,dt){
 if(o.phase==='idle'){
  if(o.radius>p.radius*.82||Math.hypot(o.x-p.x,o.z-p.z)>p.radius-o.radius*.45)return false;
  o.phase='diving';o.intake={x:p.x,z:p.z,vx:o.orbital.vx,vz:o.orbital.vz,vy:0,age:0};
 }
 const w=o.intake,shape=o.shape||{height:o.radius*1.8,depth:o.radius*1.8};w.age+=dt;
 if(!w.committed){
  if(o.orbitY+shape.height*.5<-.12)w.committed=true;
  else if(Math.hypot(o.x-p.x,o.z-p.z)>p.radius+o.radius*.15){o.phase='idle';o.owner=null;o.intake=null;return false;}
  if(!w.committed){w.x=p.x;w.z=p.z;}
 }
 const dx=w.x-o.x,dz=w.z-o.z,drag=Math.exp(-3*dt);
 w.vx=(w.vx+(dx*5-dz*.9)*dt)*drag;w.vz=(w.vz+(dz*5+dx*.9)*dt)*drag;
 o.x+=w.vx*dt;o.z+=w.vz*dt;w.vy-=(9+w.age*5)*dt;o.orbitY+=w.vy*dt;o.orbitPitch=Math.min(.5,w.age*.5);
 // Keep the full tilted envelope below the gravity sheet before any reward.
 return o.orbitY+shape.height+shape.depth*.5*Math.sin(o.orbitPitch)<-.35;
}

export function collapsePlanet(run,o){
 if(o.type!=='planet')return;
 run.counts.planets++;
 if(run.counts.planets===4){const sun=run.objects.find(o=>o.variant==='sun');if(sun?.phase==='sealed'){sun.phase='idle';run.events.push({type:'solar',actor:'you',object:sun});}}
}
