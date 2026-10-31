import {objectiveMatches} from './worlds.js?v=orbit13';
const NAMES={resonator:'Grove relay',pod:'Energy pod',debris:'Orbital debris',satellite:'Satellite',probe:'Probe',shuttle:'Shuttle',planet:'Planet',landmark:'Final target',fish:'Fish school',whale:'Whale',wreck:'Shipwreck',treasure:'Gold cache',pine:'Pine',spore:'Spore plant',shard:'Crystal shard',car:'Car',van:'Van',tent:'Tent',rv:'Camper',cabin:'Cabin',coral:'Coral',reef:'Reef arch'};
export function chooseGuidance(run,previous=null){
 const available=run.objects.filter(o=>run.eligible(o));if(!available.length)return null;
 const objectives=run.contract?available.filter(o=>objectiveMatches(run.contract,o)):[];
 const candidates=objectives.length?objectives:available;
 // A modest hysteresis keeps nearby moving swimmers from flickering the guide.
 const utility=o=>Math.hypot(o.x-run.player.x,o.z-run.player.z)+2-(objectives.length?0:Math.min(4,Math.sqrt(o.mass)*2));
 let best=candidates[0];for(const o of candidates)if(utility(o)<utility(best))best=o;
 if(previous&&candidates.includes(previous)&&utility(previous)<utility(best)+3)best=previous;
 return {object:best,label:best.type==='landmark'?({metro:'Water tower',basecamp:'Summit lodge',deep:'Research station',alien:'Portal',orbit:'Helios star'}[run.world]):NAMES[best.type]||best.type,reason:run.contract&&!objectives.length?'Grow':'Collect'};
}

export function guidancePin(projected,width=430){
 const margin=Math.max(9,Math.min(24,6800/Math.max(280,width))),x=Math.max(margin,Math.min(100-margin,projected.x));
 let y=Math.max(35,Math.min(79,projected.y));if(x>65)y=Math.min(65,y);
 return {x,y,angle:Math.atan2(projected.y-57,projected.x-50)*180/Math.PI+90,edge:!projected.visible||x!==projected.x||y!==projected.y};
}
