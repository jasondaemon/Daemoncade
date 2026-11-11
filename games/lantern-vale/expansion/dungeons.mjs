import {mechanics,instructions} from './mechanics.mjs';
/** Nine additive, renderer-independent dungeon networks for campaign.installExpansion.
 * IDs 300–407 are reserved here; overworld authoring owns 30–299.
 * Integration: installExpansion(world.campaign, createDungeonCampaign({returns}));
 * world entrance links target dungeonEntrances[i].to at dungeonEntrances[i].entry.
 * `returns` maps dungeon slug to {room, at}; omitted bindings return to the stable
 * legacy entrance (first three) or northern beacon. No legacy room is rewritten.
 * All gates use durable events, never consumable keys. Equipment is earned locally.
 */
export const dungeonDefinitions = [
 {id:'rootvault',name:'Rootvault',land:'mossward',returnRoom:6,legacy:[15,16,17,18,27],mechanic:'Grow living roots in light, then bank their warmth in shade.',equipment:'root-thread',seal:'root-memory',boss:'The Grafted Regent',kind:'charge',enemy:'brambleling',tell:1.45,strike:.45,recover:1.9,
  parts:['Seedkeeper Stair','Buried Survey','Sapwheel Gallery','Nurse Log Crossing','Blind Root Cistern','Grafting Table','Thorn Choir','Keeper’s Rest','Crown Trellis','Amber Seedbank','Root Crown Arena','Springwell'],story:'Mira: The old heart is safe. Below it, a graft drinks the distant lights. Free the seedkeeper without disturbing the upper vault.',consequence:'New roots carry clean spring water back to Mossward.'},
 {id:'drowned-archive',name:'Drowned Archive',land:'amber-fen',returnRoom:8,legacy:[19,20,21,22,28],mechanic:'Still the current, align silver pages, and cross reflections with light.',equipment:'tide-boots',seal:'tide-memory',boss:'The Index Leviathan',kind:'volley',enemy:'fen-moth',tell:1.65,strike:.65,recover:2.1,
  parts:['Lower Catalogue','Flood Survey','Sluice Registers','Sunken Bindery','Unwritten Pool','Boatwright’s Desk','Silt Stacks','Air Bell Refuge','Mirror Catalogue','Lost Names','Leviathan Index','Clearwater Lift'],story:'Sen: The upper library remembers dawn. Its lower sluices still swallow the names of the coast. Bring them into still water.',consequence:'The sluices open; Amber Fen’s ferries can sail again.'},
 {id:'prism-crypt',name:'Prism Crypt',land:'glass-highlands',returnRoom:14,legacy:[23,24,25,26,29],mechanic:'Split a beam across opposed facets; darkness reveals the final constellation.',equipment:'prism-lens',seal:'prism-memory',boss:'The Eclipse Orrery',kind:'sweep',enemy:'glass-sentinel',tell:1.8,strike:.9,recover:1.65,
  parts:['Undersky Stair','Star Survey','Dawn Facets','Shattered Meridian','Blind Observatory','Lensmaker’s Bench','Meteor Aisle','Astronomer’s Rest','Twin Zenith','Star Tomb','Eclipse Orrery','Daybreak Lift'],story:'Ida: The first astronomer shared the sky. Find her lens below the crypt and turn the eclipse away from our roads.',consequence:'The highland observatories can guide lost travelers again.'},
 {id:'cinder-forge',name:'Cinder Forge',land:'cinder-coast',returnRoom:4,legacy:[],mechanic:'Bank furnace shutters in shade before lighting the paired bellows.',equipment:'ember-cloak',seal:'cinder-seal',boss:'The Bellows Colossus',kind:'cross',enemy:'glass-sentinel',tell:1.75,strike:.7,recover:2,
  parts:['Ash Descent','Foundry Plan','Banked Furnace','Cooling Flume','Soot Chamber','Cloak Loom','Hammer Procession','Smith’s Refuge','Twin Bellows','Cold Crucible','Colossus Furnace','Ember Lift'],story:'Oren: We followed the smoke beyond the beacon. The coast smiths need a keeper to bank the furnace before the next ash tide.',consequence:'The forge makes warming lamps for the coast villages.'},
 {id:'gale-spire',name:'Gale Spire',land:'storm-reach',returnRoom:4,legacy:[],mechanic:'Orient wind vanes and shelter the flame inside a broken storm tower.',equipment:'gale-feather',seal:'gale-seal',boss:'The Stormwing Matriarch',kind:'ring',enemy:'fen-moth',tell:1.9,strike:1.1,recover:1.7,
  parts:['Hollow Tower Foot','Wind Chart','Vane Choir','Cloud Causeway','Windless Eye','Feather Roost','Thunder Stair','Pilgrim Shelter','Paired Turbines','Silent Belfry','Stormwing Nest','Leeward Lift'],story:'Sen: The ferries can cross now, but the storm bells never rest. Carry a sheltered flame up the hollow spire.',consequence:'Storm bells warn the Reach before the squalls arrive.'},
 {id:'frost-mirror',name:'Frost Mirror',land:'wintermere',returnRoom:4,legacy:[],mechanic:'Thaw the near mirror, leave the far mirror cold, and light the winter dial.',equipment:'frost-charm',seal:'frost-seal',boss:'The White Hart',kind:'hunt',enemy:'glass-sentinel',tell:2,strike:.5,recover:2.2,
  parts:['Rime Descent','Ice Survey','Thawing Dial','Blue Ice Bridge','Snowblind Well','Winter Jeweler','Antler Gallery','Hearth Refuge','Solstice Mirrors','Frozen Orchard','White Hart Hollow','Thawwater Lift'],story:'Mira: Wintermere’s trees still sleep. The white hart follows a remembered footprint; give it a new road to spring.',consequence:'Wintermere’s orchard sheds its ice and bears its first buds.'},
 {id:'hollow-clock',name:'Hollow Clock',land:'brass-heath',returnRoom:4,legacy:[],mechanic:'Set escapements in sequence, pause in shade, and wind the dawn spring.',equipment:'clockwork-key',seal:'clock-seal',boss:'The Hourless Custodian',kind:'charge',enemy:'brambleling',tell:2.15,strike:1.1,recover:1.2,
  parts:['Clockroot Stair','Gear Survey','Escapement Hall','Pendulum Crossing','Stopped Minute','Keymaker’s Bench','Brass Watch','Clockmaker Refuge','Twin Escapements','Lost Hour','Custodian Dial','Morning Lift'],story:'Ida: Brass Heath forgot its mornings when the clock stopped. Listen between its heavy steps; every machine must rest.',consequence:'The village clock marks mornings again, and the market returns.'},
 {id:'umbral-well',name:'Umbral Well',land:'umbral-wood',returnRoom:4,legacy:[],mechanic:'Carry light across black water but extinguish it at the listening wells.',equipment:'shade-mantle',seal:'umbral-seal',boss:'The Unmoored Echo',kind:'volley',enemy:'fen-moth',tell:1.2,strike:1.15,recover:2.4,
  parts:['Listening Descent','Echo Survey','Whisper Shutters','Blackwater Span','Unlit Listener','Mantle Weave','Echo Procession','Quiet Refuge','Paired Listeners','Forgotten Voices','Unmoored Echo','Voicewell Lift'],story:'Oren: The wood repeats our fears. Lower the lantern at the listening wells, then carry the voices home without following them.',consequence:'The Umbral Wood returns the voices of its missing keepers.'},
 {id:'aurora-sanctum',name:'Aurora Sanctum',land:'aurora-crown',returnRoom:4,legacy:[],mechanic:'Weave the six keeper colors through light and shade into a shared dawn.',equipment:'aurora-crown',seal:'aurora-seal',boss:'The Nightglass Sovereign',kind:'sweep',enemy:'glass-sentinel',tell:1.35,strike:1.7,recover:2.3,
  parts:['Far Light Descent','Dawn Atlas','Color Loom','Nightglass Span','Last Shadow','Crown Loom','Keeper Procession','Dawn Refuge','Sixfold Window','Names of the Keepers','Nightglass Throne','Shared Dawn Lift'],story:'Mira: Each land has lent us its own light. The last keeper waits beneath the aurora. Share the dawn; do not let one crown own it.',consequence:'The six distant lights join the beacon. Every land keeps its own dawn.'}
];

export const dungeonEntrances = dungeonDefinitions.map((d,i)=>({
 id:d.id,name:d.name,dungeon:i,to:300+i*12,entry:[2.5,5.5],
 legacyRooms:d.legacy,returnRoom:d.returnRoom,
 // First three deepen the original vaults without gating their tested upper route.
 suggestedFrom:i<3?15+i*4:null,at:[11.5,8.5],
 requires:i===8?['cinder-seal','gale-seal','frost-seal','clock-seal','umbral-seal']:[],
 completion:i<3?`${d.id}-depths-cleared`:d.seal
}));

// Topology is a ladder with two side loops, a refuge, a reward branch and a
// one-way unlockable lift back to the stair. Spatial gates cannot seal retreat.
const connections = [[0,'east',1],[1,'east',2],[1,'south',3],[2,'south',4],
 [3,'east',4],[3,'south',5],[4,'east',6],[5,'east',7],[6,'south',8],
 [7,'east',8],[8,'east',9],[9,'south',10],[10,'west',11],[11,'north',7]];
const reverse={east:'west',west:'east',north:'south',south:'north'};
// Authored wall runs [x,y,length,vertical]. Distinct rooms have different
// occlusion, loops and sight lines, while portals always have a safe approach.
const masonry = [
 [[6,2,3,1],[10,6,2,1]], [[4,2,4,1],[11,5,3,1]],
 [[7,1,3,1],[7,6,3,1]], [[3,3,3,0],[10,6,3,0]],
 [[5,2,2,0],[10,2,2,0],[5,7,2,0],[10,7,2,0]],
 [[5,3,3,1],[10,3,3,1]], [[3,2,3,0],[10,7,3,0],[8,3,2,1]],
 [[6,2,2,0],[9,7,2,0]], [[7,1,3,1],[7,6,3,1],[11,3,2,1]],
 [[4,3,3,0],[9,6,3,0]], [[4,2,2,0],[11,7,2,0]],
 [[6,2,3,1],[10,6,2,1],[11,2,2,0]]
];
// Regional architecture persists across each network: root ribs, shelving,
// facets, kilns, wind piers, ice fins, gear teeth, listening niches, crown rays.
const regionalMasonry = [
 [[2,3],[2,4],[13,6]], [[2,6],[3,6],[4,6]], [[9,3],[10,3],[11,3]],
 [[12,3],[12,4],[13,4]], [[2,3],[13,3],[2,7],[13,7]],
 [[9,2],[9,3],[9,4]], [[2,6],[3,6],[4,6],[5,6],[12,6]],
 [[2,4],[3,4],[4,4]], [[9,6],[9,7],[9,8],[12,3],[12,4]]
];
function grid(index,dungeon,exits){
 const a=Array.from({length:10},(_,y)=>Array.from({length:16},(_,x)=>x===0||y===0||x===15||y===9?'#':'.'));
 // Alternate architectural hands, retaining safe object locations below.
 for(const [sx,sy,n,v] of masonry[index])for(let j=0;j<n;j++){
  const x=dungeon%2?15-(sx+(v?0:j)):sx+(v?0:j),y=sy+(v?j:0);a[y][x]='#';
 }
 for(const [x,y] of regionalMasonry[dungeon])a[y][x]='#';
 for(const dir of Object.keys(exits)){
  const [x,y]=({west:[0,5],east:[15,5],north:[8,0],south:[8,9]})[dir];a[y][x]='.';
  if(dir==='north'||dir==='south')for(let yy=1;yy<9;yy++)a[yy][8]='.';
  else for(let xx=1;xx<15;xx++)a[5][xx]='.';
 }
 // Every puzzle, reward, spawn and stair has a clear tile and breathing room.
 for(const [x,y] of [[2,5],[3,2],[4,7],[6,2],[10,2],[12,2],[12,7],[11,5],[3,5],[3,7],[5,7],[6,7],[10,7]])a[y][x]='.';
 // Narrow light bridges are genuine collision barriers, not decoration.
 if(index===3){for(let y=1;y<9;y++)a[y][7]='#';a[5][7]='~';}
 return a.map(row=>row.join(''));
}
// Regional mechanisms use authored stations; their state machines govern light,
// facing, carrying, temperature and ordered interaction rather than face numbers.
const circuitFaces = [
 [[[6,2,2,1]],[[6,2,2,1],[10,2,2,0]],[[6,2,4,1],[10,2,4,3]]],
 [[[6,2,2,1]],[[6,2,4,2],[10,2,4,2]],[[4,7,2,0],[10,7,4,3],[12,7,2,1]]],
 [[[6,2,4,1],[10,2,4,3]],[[6,2,4,2],[10,2,4,0]],[[4,7,4,1],[6,7,4,2],[10,7,4,3]]],
 [[[6,2,2,1]],[[6,2,3,2],[10,2,3,1]],[[4,7,2,0],[10,7,2,1],[12,7,2,1]]],
 [[[6,2,3,1],[10,2,3,2]],[[6,2,4,3],[10,2,4,1]],[[4,7,3,2],[10,7,3,1],[12,7,3,2]]],
 [[[6,2,2,1],[10,2,2,0]],[[6,2,4,2]],[[4,7,4,3],[6,7,4,1],[10,7,2,0]]],
 [[[6,2,3,1],[10,2,3,2]],[[4,7,4,1],[6,7,4,2],[10,7,4,3]],[[6,2,4,3],[10,2,4,1]]],
 [[[6,2,2,0],[10,2,2,1]],[[6,2,3,2],[10,2,3,0]],[[4,7,2,1],[10,7,2,0],[12,7,2,1]]],
 [[[6,2,3,1],[10,2,3,2]],[[4,7,4,3],[6,7,4,2],[10,7,4,1]],[[6,2,3,1],[10,2,3,2],[4,7,3,1],[6,7,3,2],[10,7,3,1],[12,7,3,2]]]
];
function lightPuzzle(d,i,stage,at,requires=[],shade=false){
 const controls=circuitFaces[i][stage-1].map(([x,y,states,target])=>[x+.5,y+.5,states,target]);
 shade=![3,4,6,8].includes(i);
 return {mechanic:mechanics[i],id:`${d.id}-circuit-${stage}`,source:at,seconds:[1.2,1.7,2.2][stage-1],shade,requires,
 controls:controls.map(([x,y,states,target])=>({at:[x,y],states,target})),
 hint:`${d.name}: ${instructions[mechanics[i]]} Hold each action for a moment. Reset is always safe; the entrance stays open.`,
 text:`${d.name}: circuit ${stage} holds. ${stage===3?'The arena passage opens.':'The next keeper mechanism answers.'}`,
 reward:{id:`${d.id}-circuit-${stage}-gift`,coins:4+stage,tonics:stage===2?1:0}};
}

export function createDungeonCampaign({returns={}}={}){
 const rooms=[],quests=[];
 for(const [di,d] of dungeonDefinitions.entries()){
  const base=300+di*12,network=Array.from({length:12},()=>({}));
  for(const [a,dir,b] of connections){network[a][dir]=base+b;network[b][reverse[dir]]=base+a;}
  const circuits=[1,2,3].map(n=>`${d.id}-circuit-${n}`);
  for(let i=0;i<12;i++){
   const r={id:base+i,name:`${d.name} · ${d.parts[i]}`,kind:'dungeon',land:d.land,dungeon:di,part:i===10?'boss':'depths',
    exits:network[i],tiles:grid(i,di,network[i]),encounters:[],links:[],puzzles:[],rewards:[],characters:[],gates:[],hazards:[],
    scenery:[{id:`${d.id}-architecture-${i}`,kind:d.parts[i],x:5.5,y:1.5,solid:false}],mechanic:d.mechanic};
   if([2,3,6,8,9].includes(i))r.encounters=[{kind:d.enemy,x:11.5,y:5.5,hp:i>5?4:3},...(i===6?[{kind:d.enemy,x:12.5,y:7.5,hp:3}]:[])];
   if(i===0){
    const binding=returns[d.id]||{room:d.returnRoom,at:di<3?[12.5,3.5]:[10.5,5.5]};
    r.links.push({id:`${d.id}-return`,at:[2.5,5.5],to:binding.room,entry:binding.at,requires:[]});
    r.characters.push({id:`${d.id}-briefing`,at:[4.5,7.5],text:d.story});
   }
   if(i===1){r.rewards.push({id:`${d.id}-map`,at:[12.5,2.5],equipment:`${d.id}-map`,coins:3,text:`${d.name} map: two loops meet at the refuge; the eastern chambers lead to the arena. The lift returns to the entry.`});}
   if(i===2)r.puzzles.push(lightPuzzle(d,di,1,[3.5,2.5],[],di===3||di===7));
   if(i===4)r.puzzles.push(lightPuzzle(d,di,2,[3.5,2.5],[circuits[0]],true));
   if(i===5)r.rewards.push({id:`${d.id}-equipment`,at:[12.5,7.5],requires:[circuits[0]],equipment:d.equipment,tonics:1,text:`Keeper equipment: ${d.equipment}. ${d.mechanic}`});
   if(i===6){r.hazards=[{at:[5.5,7.5],damage:1,equipment:d.equipment}];r.rewards.push({id:`${d.id}-guard-cache`,at:[12.5,2.5],clear:true,coins:15,tonics:1});}
   if(i===7){r.checkpoint=true;r.checkpointAt=[3.5,5.5];r.links.push({id:`${d.id}-equipment-shortcut`,at:[12.5,2.5],to:base+6,entry:[3.5,5.5],requires:[d.equipment],hint:`Bring the ${d.equipment} from the western workshop to open this passage.`});r.characters.push({id:`${d.id}-refuge-hint`,at:[12.5,7.5],text:`Ida’s note: ${d.mechanic} ${instructions[mechanics[di]]} The third circuit needs the second; no key is spent. The refuge and return stair always remain open.`});}
   if(i===8)r.puzzles.push(lightPuzzle(d,di,3,[3.5,2.5],[circuits[1]],di===7));
   if(i===9){r.rewards.push({id:`${d.id}-secret`,at:[12.5,7.5],requires:[d.equipment],coins:24,tonics:2,text:`The ${d.parts[i]} preserves a keeper’s memory and a tonic reserve.`});
    // Boundary gates cover the sole south doorway, leaving every retreat free.
    r.gates.push({at:[8.5,9.5],requires:[circuits[2]]});}
   if(i===10){r.encounters=[{kind:d.kind,name:d.boss,boss:true,hp:12+di*2,x:11.5,y:5.5,tell:d.tell,strike:d.strike,recover:d.recover}];
    r.rewards.push({id:`${d.id}-depths-cleared`,at:[12.5,2.5],clear:true,requires:[circuits[2]],seal:d.seal,coins:30,tonics:2,maxHp:16+di*2,text:`${d.boss} yields. ${d.consequence}`});
    r.characters.push({id:`${d.id}-boss-warning`,at:[3.5,7.5],text:`${d.boss}: ${({charge:'sidestep the fixed glowing trail',volley:'move between the three sparks',ring:'step through the expanding ring',sweep:'circle behind the turning beam',cross:'leave both marked lanes',hunt:'move away from your marked footprint'})[d.kind]}. Strike only during recovery with your lantern raised. Lower light to stop the pattern; retreat west to recover.`});}
   if(i===11){r.links.push({id:`${d.id}-lift`,at:[12.5,7.5],to:base,entry:[3.5,5.5],requires:[`${d.id}-depths-cleared`]});
    // The loop back into the arena cannot bypass its three circuits.
    r.gates.push({at:[15.5,5.5],requires:[circuits[2]]});
    r.characters.push({id:`${d.id}-aftermath`,at:[3.5,2.5],requires:[`${d.id}-depths-cleared`],text:d.consequence});}
   rooms.push(r);
  }
  quests.push({id:`${d.id}-restored`,requires:[`${d.id}-depths-cleared`],text:d.consequence});
 }
 return {rooms,quests};
}
export const campaign=createDungeonCampaign();
export const dungeonRooms=campaign.rooms;
export default campaign;
