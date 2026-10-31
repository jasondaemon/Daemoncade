import {seeded,campDry} from './habitats.js?v=camp-life32';

export const VEHICLES={sedan:'sedan-sports',suv:'suv-luxury',van:'van',flatbed:'delivery-flat'};
export function sourceKey(o){
 if(o.type==='quantum')return `quantum:${o.scaleKind}@${o.modelRadius||o.radius}`;
 if(o.treeStyle)return `tree:park-${o.treeStyle}`;
 if(o.type==='fountain')return 'fountain';
 if(o.parkStyle)return `${o.type}:${o.parkStyle}`;
 if(o.rig)return `rv:${o.rig}`;
 if(o.signal)return 'lamp:signal';
 if(o.vehicle)return `${o.type}:${o.vehicle}`;
 if(o.type==='planet')return `planet:${o.variant}`;
 if(o.type==='building')return o.art!==undefined?`building:quarter${o.art}`:`building:${o.variant||'shops'}`;
 if(o.type==='landmark'&&o.variant)return `landmark:${o.variant}`;
 return o.art!==undefined?`${o.type}@${o.art}`:o.type;
}
// Stable authored variation. Arena keeps its original layout and asset keys.
export function dressWorld(world,objects,add){
 const random=seeded(8019),choices={basecamp:['pine','log','cooler'],deep:['coral','amphora','kelp'],alien:['spore','shard','crystal']}[world];
 const variants={basecamp:{cabin:3,rv:2,picnic:2},deep:{coral:3,reef:2,amphora:2},alien:{spore:3,crystal:2,monolith:2},orbit:{debris:3,satellite:2,probe:2,shuttle:2}}[world]||{};
 if(choices){
  for(let i=0;i<36;i++){
   const type=choices[i%choices.length];
   for(let attempt=0;attempt<60;attempt++){
    const x=(random()-.5)*94,z=(random()-.5)*94;
    // Density must not bury existing silhouettes or block the starting clearing.
    if((world!=='basecamp'||campDry(x,z,2))&&objects.every(o=>Math.hypot(o.x-x,o.z-z)>o.radius+1.8)){add(type,x,z,random()*Math.PI*2);break;}
   }
  }
 }
 const counts={};for(const o of objects)if(variants[o.type]){const n=counts[o.type]||0;o.art=n%variants[o.type];counts[o.type]=n+1;}
 if(world==='metro'){
  const vehicleCounts={car:0,van:0};for(const o of objects){
   if(['car','van'].includes(o.type)){const models=o.type==='car'?['sedan','suv',null]:['van','flatbed',null];o.vehicle=models[vehicleCounts[o.type]++%models.length];}
  }
 }
}
