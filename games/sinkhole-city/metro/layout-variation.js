import {seeded,CAMP_SITES,campDry} from './habitats.js?v=camp-life32';
import {CITY_BLOCKS} from './city-layout.js?v=parks42';

export function freshSeed(){
 const a=new Uint32Array(1);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(a);else a[0]=Math.floor(Math.random()*4294967296);
 return a[0]||1;
}
export function cityPermutation(seed=0){
 const indices=CITY_BLOCKS.map((_,i)=>i);if(!seed)return indices;
 const random=seeded(seed^0x637479);for(let i=indices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}return indices;
}
export function variedBlocks(seed=0){const order=cityPermutation(seed);return CITY_BLOCKS.map((b,i)=>({...b,x:CITY_BLOCKS[order[i]].x,z:CITY_BLOCKS[order[i]].z}));}
export function varyCity(run){
 const order=cityPermutation(run.seed);run.cityBlocks=variedBlocks(run.seed);
 if(!run.seed)return;
 for(const o of run.objects){
  // Street traffic, curb parking, junction signals and pedestrian routes retain
  // their road-space coordinates. Only authored lot contents move as a unit.
  if(o.traffic||o.parked||o.signal||o.walker)continue;
  let nearest=0,distance=Infinity;for(const [i,b]of CITY_BLOCKS.entries()){const d=Math.hypot(o.x-b.x,o.z-b.z);if(d<distance){distance=d;nearest=i;}}
  const from=CITY_BLOCKS[nearest],to=CITY_BLOCKS[order[nearest]];o.x+=to.x-from.x;o.z+=to.z-from.z;o.lot=order[nearest];
 }
}
export function varyCamp(run){
 run.campSwaps=0;if(!run.seed)return;const random=seeded(run.seed^0x63616d70),groups=CAMP_SITES.map((_,i)=>run.objects.filter(o=>o.site===i));
 // Swap complete authored pitches, never individual tents or the coupled FJ /
 // trailer placement. Reject wet, out-of-bounds and newly obstructed positions.
 for(let attempt=0;attempt<40&&run.campSwaps<3;attempt++){
  const a=Math.floor(random()*groups.length),b=Math.floor(random()*groups.length);if(a===b)continue;
  const moved=new Set([...groups[a],...groups[b]]),others=run.objects.filter(o=>!moved.has(o)&&!o.walker),candidates=[];
  for(const [from,to]of[[a,b],[b,a]])for(const o of groups[from])candidates.push({o,x:o.x+CAMP_SITES[to].x-CAMP_SITES[from].x,z:o.z+CAMP_SITES[to].z-CAMP_SITES[from].z,site:to});
  if(candidates.some((p,i)=>Math.abs(p.x)>51||Math.abs(p.z)>51||!campDry(p.x,p.z,p.o.radius)||others.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<(p.o.radius+o.radius)*.8)||candidates.some((q,j)=>j<i&&p.site!==q.site&&Math.hypot(p.x-q.x,p.z-q.z)<(p.o.radius+q.o.radius)*.8)))continue;
  for(const p of candidates){p.o.x=p.x;p.o.z=p.z;p.o.site=p.site;}
  [groups[a],groups[b]]=[groups[b],groups[a]];run.campSwaps++;
 }
}
