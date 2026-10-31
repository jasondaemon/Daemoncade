import {supportFraction} from './rim.js?v=contact15';

export function contactHint(run){
 if(run.arena||run.done)return null;
 const p=run.player;let nearest=null,best=Infinity;
 for(const o of run.objects){
  if(!['idle','sealed'].includes(o.phase)||o.owner&&o.owner!==run.id)continue;
  if(o.phase!=='sealed'&&o.radius<=p.radius*.82)continue;
  const distance=Math.hypot(o.x-p.x,o.z-p.z);
  if(distance>p.radius+Math.min(1.5,o.radius*.6)||distance>=best)continue;
  // This explains the collection gate, not an obstacle collision. Directly
  // underneath a hollow structure still needs a wider hole to swallow it.
  const overlap=o.swim||o.orbital||o.phase==='sealed'?distance<p.radius+o.radius*.2:distance<p.radius*.75||supportFraction(o,p)>=.15;
  if(overlap){nearest=o;best=distance;}
 }
 if(!nearest)return null;
 if(nearest.phase==='sealed'){
  const text=nearest.type==='pod'?'Sealed pod · swallow its grove relay first':run.world==='alien'?`Portal sealed · relays ${run.relays||0}/6`:`Helios sealed · planets ${run.counts.planets}/4`;
  return {object:nearest,kind:'sealed',text};
 }
 const percent=Math.max(5,Math.ceil((nearest.radius/(p.radius*.82)-1)*20)*5);
 return {object:nearest,kind:'size',percent,text:`Too large · grow your hole ${percent}% wider`};
}
