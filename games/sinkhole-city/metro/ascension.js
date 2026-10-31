import {seeded} from './habitats.js?v=camp-life32';

export const SCALE_STAGES=[
 {label:'Atoms',unit:'Atomic scale',kinds:['proton','atom','ion'],crown:'molecule',floor:0x142e49,sky:0x102038},
 {label:'Molecules',unit:'Molecular scale',kinds:['molecule','polymer','dna'],crown:'protein',floor:0x173e47,sky:0x122d39},
 {label:'Living cells',unit:'Microscopic scale',kinds:['bacterium','cell','amoeba'],crown:'colony',floor:0x305c60,sky:0x25505c},
 {label:'Microfauna',unit:'Microscopic life',kinds:['diatom','rotifer','tardigrade'],crown:'moss',floor:0x437568,sky:0x406660},
 {label:'Leaf litter',unit:'Insect scale',kinds:['ant','seed','pebble'],crown:'leaf',floor:0x61734c,sky:0x899b76},
 {label:'Garden',unit:'Flower-bed scale',kinds:['grass','fern','flower'],crown:'shrub',floor:0x617e4d,sky:0x99b78c},
 {label:'Undergrowth',unit:'Woodland floor',kinds:['mushroom','shrub','sapling'],crown:'oak',floor:0x567c53,sky:0x92b18e},
 {label:'Street life',unit:'Human scale',kinds:['person','bicycle','car'],crown:'shed',floor:0x64836a,sky:0x9cb6ab},
 {label:'Neighborhood',unit:'Neighborhood scale',kinds:['car','house','oak'],crown:'apartment',floor:0x5a8072,sky:0x91b5b1},
 {label:'City',unit:'City scale',kinds:['apartment','tower','district'],crown:'city',floor:0x537b79,sky:0x8bb0b9},
 {label:'Landscapes',unit:'Landscape scale',kinds:['grove','hill','mountain'],crown:'valley',floor:0x47786d,sky:0x88afb6},
 {label:'Regions',unit:'Regional scale',kinds:['valley','plateau','lake'],crown:'island',floor:0x376a78,sky:0x7eabb4},
 {label:'Archipelagos',unit:'Ocean-basin scale',kinds:['island','archipelago','landmass'],crown:'continent',floor:0x2c5e78,sky:0x638ea6},
 {label:'Continents',unit:'Continental scale',kinds:['continent','icecap','moon'],crown:'moon',floor:0x254e68,sky:0x476f8b},
 {label:'Planets',unit:'Planetary scale',kinds:['moon','earth','gas'],crown:'sun',space:true,floor:0x192441,sky:0x11182d},
 {label:'Stars',unit:'Stellar scale',kinds:['sun','giant','system'],crown:'nebula',space:true,floor:0x251d40,sky:0x16132b},
 {label:'Star clouds',unit:'Interstellar scale',kinds:['system','starcluster','nebula'],crown:'spiral',space:true,floor:0x201e3e,sky:0x14152e},
 {label:'Galaxies',unit:'Galactic scale',kinds:['spiral','galaxy','cluster'],crown:'supercluster',space:true,floor:0x171d36,sky:0x0b1021}
];
export const SCALE_COUNT=SCALE_STAGES.length;
export const LIFE_TARGET=SCALE_STAGES.findIndex(s=>s.label==='Landscapes')+1;
export const SCALE_NAMES={proton:'Proton',atom:'Atom',ion:'Ion',molecule:'Molecule',polymer:'Polymer',dna:'DNA helix',protein:'Protein',bacterium:'Bacterium',cell:'Cell',amoeba:'Amoeba',colony:'Cell colony',seed:'Seed',ant:'Ant',flower:'Flower',oak:'Oak tree',grove:'Woodland',house:'Village',mountain:'Mountain',island:'Island',moon:'Moon',earth:'Planet',gas:'Gas giant',sun:'Star',nebula:'Nebula',system:'Star system',spiral:'Spiral galaxy',galaxy:'Galaxy',cluster:'Galaxy cluster',supercluster:'Supercluster'};
SCALE_NAMES.shed='Garden shed';
export const SCALE_RATIO=3.4;
export const SCALE_LIMIT=25*SCALE_RATIO**(SCALE_COUNT-1);
Object.assign(SCALE_NAMES,{diatom:'Diatom',rotifer:'Rotifer',tardigrade:'Tardigrade',moss:'Moss cushion',pebble:'Pebble',leaf:'Fallen leaf',grass:'Grass tuft',fern:'Fern',shrub:'Shrub',mushroom:'Mushroom',sapling:'Sapling',person:'Person',bicycle:'Bicycle',car:'Car',house:'House',apartment:'Apartment building',tower:'Office tower',district:'City block',city:'City',hill:'Hill',valley:'River valley',plateau:'Plateau',lake:'Lake district',archipelago:'Archipelago',landmass:'Landmass',continent:'Continent',icecap:'Ice cap',giant:'Red giant',starcluster:'Star cluster'});
export function populateAscension(add,seed=0){
 const random=seeded(seed^0x1f1f1f);
 for(const [era,stage]of SCALE_STAGES.entries()){
  const unit=SCALE_RATIO**era,turn=random()*Math.PI*2;
  // Independent distributions in one shared space, not replacement boards.
  for(let i=0;i<68;i++){
   const crown=i>=64,j=crown?3:Math.floor(random()*3),radius=[.42,.72,1.15,1.35][j];
   const x=crown?(i%2?12:-12):(i%8-3.5)*4.6+(random()-.5)*3;
   const z=crown?(i<66?12:-12):(Math.floor(i/8)-3.5)*4.6+(random()-.5)*3;
   const px=(x*Math.cos(turn)-z*Math.sin(turn))*unit,pz=(x*Math.sin(turn)+z*Math.cos(turn))*unit,o=add('quantum',px,pz,random()*6.28);
   Object.assign(o,{scaleStage:era,scaleKind:crown?stage.crown:stage.kinds[j],modelRadius:radius,radius:radius*unit,mass:[.65,1.4,2.8,7][j]*unit*unit,score:(era+1)*(40+j*45),homeX:px,homeZ:pz,motionPhase:random()*6.28,unit,phase:'idle'});
  }
 }
}
export function finishScale(run){
 // Size drives progress; leftover atoms never have to be swept up.
 const progress=Math.max(0,Math.log(Math.sqrt(run.player.area)/1.2)/Math.log(SCALE_RATIO));
 run.scaleProgress=Math.min(SCALE_COUNT,progress);run.scaleStage=Math.min(SCALE_COUNT-1,Math.floor(progress));run.counts.scales=run.infinityComplete?SCALE_COUNT:Math.min(SCALE_COUNT-1,Math.floor(progress));
 // Maximum size is not a clear. Finish the actual galaxies before the final
 // intake gathers the now-subpixel remnants; none are credited beforehand.
 if(!run.infinityCollapse&&run.objects.filter(o=>o.scaleStage===SCALE_COUNT-1).every(o=>o.phase==='consumed')){
  const p=run.player;run.infinityCollapse={at:run.time,x:p.x,z:p.z,radius:p.radius,reach:Math.max(p.radius,...run.objects.filter(o=>o.phase!=='consumed').map(o=>Math.hypot(o.x-p.x,o.z-p.z)+o.radius*2))};
  for(const o of run.objects)if(o.phase!=='consumed'){o.captureX=o.x;o.captureZ=o.z;o.phase='diving';}
 }
}
export const COLLAPSE_SECONDS=4.5;
export function journeyFraction(run){return run.infinityComplete?1:Math.min(.99,(run.scaleProgress||0)/SCALE_COUNT);}
export function advanceScale(run,dt=1/60){
 if(run.infinityCollapse){
  const c=run.infinityCollapse,t=Math.min(1,(run.time-c.at)/COLLAPSE_SECONDS),ease=t*t*(3-2*t);
  Object.assign(run.player,{x:c.x,z:c.z,vx:0,vz:0,radius:c.radius+(c.reach-c.radius)*ease});run.player.area=run.player.radius**2;
  if(t>=1&&run.objects.every(o=>o.phase==='consumed')){run.infinityComplete=true;run.counts.scales=SCALE_COUNT;run.scaleProgress=SCALE_COUNT;}
  return false;
 }
 // Display units change smoothly; absolute positions, size and momentum persist.
 const target=Math.max(1,run.player.radius/1.8),old=run.scaleZoom||1;
 run.scaleZoom=old+(target-old)*(1-Math.exp(-2*dt));
 for(const o of run.objects){
  if(o.phase!=='idle')continue;
  const t=run.time*.3+o.motionPhase,amp=o.unit*(o.scaleStage<3?.32:.12);
  o.x=o.homeX+Math.sin(t*.73)*amp;o.z=o.homeZ+Math.cos(t*.91)*amp;
 }
 return false;
}
export function collectScale(run,dt){
 if(run.infinityCollapse){
  const c=run.infinityCollapse,t=Math.min(1,(run.time-c.at)/COLLAPSE_SECONDS),ease=t*t*(3-2*t),angle=t*2;
  for(const o of run.objects)if(o.phase!=='consumed'){
   const dx=o.captureX-c.x,dz=o.captureZ-c.z;o.x=c.x+(dx*Math.cos(angle)-dz*Math.sin(angle))*(1-ease);o.z=c.z+(dx*Math.sin(angle)+dz*Math.cos(angle))*(1-ease);o.intake=1-ease;
   if(t>=1)run.consume(run,o);
  }
  return;
 }
 const p=run.player;
 for(const o of run.objects){
  if(o.phase==='consumed'||o.radius>p.radius*.82)continue;
  const distance=Math.hypot(o.x-p.x,o.z-p.z);
  if(o.phase==='idle'&&distance<p.radius-o.radius*.35){o.phase='diving';o.captureAt=run.time;o.captureX=o.x;o.captureZ=o.z;run.events.push({type:'capture',object:o,actor:run.id});}
  if(o.phase==='diving'){
   const t=Math.min(1,(run.time-o.captureAt)/.7),angle=t*1.5,dx=o.captureX-p.x,dz=o.captureZ-p.z;
   o.x=p.x+(dx*Math.cos(angle)-dz*Math.sin(angle))*(1-t);o.z=p.z+(dx*Math.sin(angle)+dz*Math.cos(angle))*(1-t);o.intake=1-t;
   if(t>=1){run.consume(run,o);if(run.done||run.infinityCollapse)break;}
  }
 }
}
export function scaleInfo(index=0,radius=1.2){
 const progress=Math.max(0,Math.log(radius/1.2)/Math.log(SCALE_RATIO)),stage=SCALE_STAGES[index]||SCALE_STAGES[0];
 return {index,stage:stage.label,value:Math.max(0,Math.min(1,progress-index)),label:stage.unit+' · ×'+Math.round(radius/1.2).toLocaleString(),message:stage.unit,intro:'Grow from atomic matter to galaxies in one continuous world.',hint:'Grow into the larger forms around you.'};
}
