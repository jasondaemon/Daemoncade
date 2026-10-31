import {seeded} from './habitats.js?v=ocean10';

// Displaced groves surround an impact basin, not a street network.
export const ALIEN_GROVES=[[-30,32],[-8,24],[28,30],[33,-6],[8,-29],[-29,-25]];
// Authored clearings: crescent, fork, fan, offset arc, split garden, spiral.
// Shared by prop placement and the visible mineral-vein network.
export const GROVE_LAYOUTS=[
 {pods:[[4.8,1],[-.8,5.8],[-5.5,.5]],angle:.3,stretch:1},
 {pods:[[5.8,-1],[1.8,6],[-5.5,2]],angle:1.2,stretch:.85},
 {pods:[[4.5,-4.5],[6,1],[-1,6.5]],angle:2.1,stretch:1.1},
 {pods:[[-5.8,-3],[-5,3.8],[1.5,6]],angle:3.4,stretch:.9},
 {pods:[[-6,-1],[5.5,2],[.5,-6.5]],angle:4.2,stretch:1.05},
 {pods:[[4.8,-1.8],[1.5,6],[-6,2.5]],angle:5.1,stretch:.95}
];
export function groveVein(index,pod,t){
 const [x,z]=GROVE_LAYOUTS[index].pods[pod],bend=Math.sin(Math.PI*t)*(pod%2?-.85:.85),d=Math.hypot(x,z);
 return {x:x*t-z/d*bend,z:z*t+x/d*bend};
}
export function groveCharge(relay,time,reduced=false){
 if(!relay?.discharged)return 0;
 if(reduced)return 1;
 const t=Math.max(0,Math.min(1,(time-(relay.dischargedAt??0))/.8));return t*t*(3-2*t);
}
export function populateAlien(add,seed=0){
 const random=seeded(712^seed),occupied=[];
 const place=(type,x,z,yaw=0)=>{const o=add(type,x,z,yaw);occupied.push(o);return o;};
 for(const [index,[x,z]]of ALIEN_GROVES.entries()){
  const layout=GROVE_LAYOUTS[index];
  const relay=place('resonator',x,z);relay.relay=true;relay.grove=index;
  for(let i=0;i<3;i++){
   const [dx,dz]=layout.pods[i],a=Math.atan2(dz,dx),px=x+dx,pz=z+dz;
   const pod=place('pod',px,pz,a);pod.grove=index;pod.phase='sealed';
  }
  for(let i=0;i<4;i++){const a=i*Math.PI/2+layout.angle;place('crystal',x+Math.cos(a)*10,z+Math.sin(a)*10,a);}
 }
 // Reserve every grove's large silhouettes before packing any small growth.
 for(const [index,[x,z]]of ALIEN_GROVES.entries()){
  const layout=GROVE_LAYOUTS[index];
  for(let i=0;i<22;i++){
   const type=i%3===0?'spore':'shard',radius=type==='spore'?.65:.38;
   for(let attempt=0;attempt<120;attempt++){
    const a=layout.angle+(i%3)*2.1,d=8.5+(i%3)*1.1,spread=1.5+attempt*.035,b=random()*Math.PI*2,r=Math.sqrt(random())*spread;
    const px=x+Math.cos(a)*d+Math.cos(b)*r,pz=z+Math.sin(a)*d*layout.stretch+Math.sin(b)*r;
    if(Math.abs(px)>50||Math.abs(pz)>50||occupied.some(o=>Math.hypot(o.x-px,o.z-pz)<o.radius+radius+.18))continue;
    place(type,px,pz,random()*Math.PI*2).grove=index;break;
   }
  }
 }
 for(let i=0;i<28;i++){
  const a=i*Math.PI*2/28,x=Math.cos(a)*47,z=Math.sin(a)*47;
  if(occupied.every(o=>Math.hypot(o.x-x,o.z-z)>o.radius+3.5))place('monolith',x,z,a);
 }
 const portal=add('landmark',0,-4);portal.variant='portal';portal.phase='sealed';portal.revealGroup='portal';
}

// A relay opens its three nearby pods. They remain physical objects: no remote
// points, auto-consumption, or oversized objects pulled through a small hole.
export function energizeGrove(run,source){
 if(!source.relay||source.discharged)return;
 source.discharged=true;source.dischargedAt=run.time;let count=0;
 for(const o of run.objects)if(o.phase==='sealed'&&o.grove===source.grove){o.phase='idle';o.charged=true;o.openedAt=run.time;count++;}
 run.relays=(run.relays||0)+1;
 run.events.push({type:'chain',object:source,count,actor:'you'});
 if(run.relays===ALIEN_GROVES.length){
  const portal=run.objects.find(o=>o.revealGroup==='portal');
  if(portal?.phase==='sealed'){portal.phase='idle';run.events.push({type:'portal',actor:'you',object:portal});}
 }
}
