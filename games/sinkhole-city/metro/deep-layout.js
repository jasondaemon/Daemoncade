import {REEF_HABITATS,seeded} from './habitats.js?v=ocean10';
import {populateMarine} from './marine.js?v=layouts43';
export function populateDeep(add,seed=0){
 const rand=seeded(410^seed),placed=[];
 for(const c of REEF_HABITATS){
  for(let i=0;i<17;i++){
   const type=i<4?'coral':i<7?'seafan':i<11?'shell':i<14?'amphora':'kelp';
   let x,z;for(let tries=0;tries<25;tries++){
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*c.radius;x=c.x+Math.cos(a)*r;z=c.z+Math.sin(a)*r;
    if(placed.every(p=>Math.hypot(x-p.x,z-p.z)>1.5))break;
   }
   add(type,x,z,rand()*Math.PI*2);placed.push({x,z});
  }
  add('reef',c.x+c.radius*.7,c.z-c.radius*.6,rand()*Math.PI*2);
 }
 for(let i=0;i<9;i++){const a=rand()*Math.PI*2,r=6+rand()*9;add('salvage',Math.cos(a)*r,-17+Math.sin(a)*r,rand()*6);}
 const wreck=add('wreck',0,-17,1.1);wreck.reveals='wreck-gold';
 for(let i=0;i<6;i++){const a=i*2.39996,gold=add('treasure',Math.cos(a)*2,-17+Math.sin(a)*1.4);gold.phase='buried';gold.revealGroup='wreck-gold';}
 const station=add('landmark',5,-40);station.variant='station';
 populateMarine(add,seed);
}
