import * as world from './world.mjs';
import * as depths from './dungeons.mjs?v=0.3.0-alpha.6';
import * as story from './story.mjs';
// Reconcile the independent authors' reward vocabulary at the adapter boundary.
const returns=Object.fromEntries(depths.dungeonDefinitions.map((d,i)=>[d.id,{room:world.dungeonEntrances[i].from,at:[12.5,3.5]}]));
const dungeonContent=depths.createDungeonCampaign({returns});
const aliases=new Map(depths.dungeonDefinitions.slice(3).flatMap((d,i)=>[[d.seal,story.seals[i]],[d.equipment,story.equipment[i]]]));
function vocabulary(value){if(typeof value==='string')return aliases.get(value)||value;if(Array.isArray(value))return value.map(vocabulary);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,vocabulary(v)]));return value;}
export const adventure=world.withDungeons(vocabulary(dungeonContent));
// Road signs must name the dungeon actually reached by their stair.
for(let i=3;i<9;i++){
 const old=world.dungeonEntrances[i].name,name=depths.dungeonDefinitions[i].name;
 function rename(v){if(typeof v==='string')return v.replaceAll(old,name);if(Array.isArray(v))return v.map(rename);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,rename(x)]));return v;}
 Object.assign(adventure,rename(adventure));
}
for(const portal of world.dungeonEntrances.slice(0,3))adventure.rooms.find(r=>r.id===portal.from).links.find(l=>l.id===`dungeon-road-${portal.dungeon}`).to=300+portal.dungeon*12;

export const dungeonArtIds=['rootvault','drowned-archive','prism-crypt','bell-cistern','ember-foundry','gale-observatory','winter-reservoir','moon-conservatory','horizon-engine'];

// Regional witnesses, dungeon briefings and aftermath describe the same road.
for(let i=3;i<9;i++){
 const region=story.regionalStories[i-2],def=depths.dungeonDefinitions[i];
 for(const room of adventure.rooms.filter(r=>r.kind==='dungeon'&&r.dungeon===i)){
  room.land=region.id;
  for(const c of room.characters||[]){
   if(c.id===`${def.id}-briefing`)c.text=`${region.npc}: ${region.problem} ${region.goal.replaceAll(world.dungeonEntrances[i].name,def.name)}`;
   if(c.id===`${def.id}-aftermath`)c.text=`${region.npc}: ${region.consequence}`;
  }
  for(const reward of room.rewards||[]){
   if(reward.equipment===story.equipment[i-3])reward.text=`Keeper equipment: ${story.equipment[i-3]}. Opens this land’s keeper shortcut and protects its marked hazards.`;
   if(reward.seal)reward.text=`${def.boss} yields. ${region.consequence}`;
  }
 }
 const quest=adventure.quests.find(q=>q.id===`${def.id}-restored`);quest.text=region.consequence;
}
