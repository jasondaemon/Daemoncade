import {regionalStories,seals,equipment,opening,resolution,campaign as storyCampaign} from './story.mjs';

// Stable integration IDs. Install this campaign together with the dungeon campaign.
// The original stairs remain the only automatic entrances; these are E-interaction portals.
export const dungeonEntrances = [
 {dungeon:0,from:34,to:15,name:'Rootvault'},
 {dungeon:1,from:39,to:19,name:'Drowned Archive'},
 {dungeon:2,from:45,to:23,name:'Prism Crypt'},
 ...['Bell Cistern','Ember Foundry','Gale Observatory','Winter Reservoir','Moon Conservatory','Horizon Engine'].map((name,i)=>({dungeon:i+3,from:30+(i+1)*18+10,to:300+i*16,name,seal:seals[i],equipment:equipment[i],returnTo:[12.5,2.5]}))
];
export const continuation = {room:30,at:[3.5,5.5],text:opening};
export const legacyPortals = []; // No legacy exit, stair, plate, bridge or control is replaced.

// Each row is an authored traversal stop, not a numbered repetition of an empty map.
// Six-column, three-row regional geography gives loops, two approaches to each stair,
// and branch routes between settlements and landmarks.
const sceneNames = [
 ['Mira’s Far Road','Ninefold Milestone','Pilgrim Hearth','Copperleaf Cut','Rootkeepers’ Postern','Lantern Market','Old Survey Camp','Menders’ Green','Three Heart Memorial','Archive Ferry','Keepers’ Council','Firefly Aqueduct','Dawn Petitioners','Bellbridge Gardens','Astronomers’ Postern','Roadward Shelter','Six Window Court','The Far Lantern'],
 ['Silt Orchard','Floodmark Steps','Reedwright Village','Dry Net Square','Heron Tollhouse','Medicine Ferry','Willow Narrows','Capsized Chapel','Three Lock Weir','Bellrope Market','Lockkeeper Quay','Undertow Watch','Pearl Mudflats','Sunken School','Eelgrass Labyrinth','Saltwick Refuge','Returned Boats','River Mouth Beacon'],
 ['Ashfall Gate','Black Apple Terrace','Kilnmarket','Claycutters’ Yard','Cooled Lava Ford','Rain Collectors','Sootglass Pass','Charcoal Hospice','Furnace Spillway','Smelters’ Bell','Foundry Mouth','Cinderwatch','Obsidian Orchard','Broken Crucible','Steamflower Pools','Seedbank Shelter','Rainward Balcony','Ember Wellspring'],
 ['Whistling Saddle','Kite Shepherds','Cloudrest Village','Woolwind Yard','Bell Carvers','Broken Gondola','Needle Gap','Echo Hospice','Suspended Stair','Windmill Crown','Observatory Foot','Gale Watch','Thunder Cairns','Silent Choir','Sky Rope Gardens','Caravan Refuge','Returning Voices','Westwind Beacon'],
 ['Hoarfrost Gate','Blue Reed Shore','Ferryfire Village','Net Thaw Yard','Icebound Chapel','Lost Boats','Whiteout Cut','Winter Hospice','Pressure Ridges','Snowbell Market','Reservoir Mouth','Aurora Watch','Buried Orchard','Mirror Ice','Warm Spring Gardens','Ferry Refuge','Open Channels','Thaw Beacon'],
 ['Starlit Gate','Sleepwalker Path','Petalrest Village','Mothsilk Yard','Old Moon Shrine','Dream Ferrymen','Briar Narrows','Sleepless Hospice','Borrowed Star Grove','Nightflower Market','Conservatory Gate','Owl Watch','Fallen Constellation','Shadow Orchard','Dewglass Gardens','Dreamers’ Refuge','Waking Flowers','Moonrise Beacon'],
 ['Saltwind Gate','Shell Pilgrim Steps','Horizon Village','Sailmakers’ Yard','Tideglass Chapel','Dry Ferry','Sea Arch Narrows','Shipwreck Hospice','Shuttered Causeway','Dawnfish Market','Engine Landing','Horizon Watch','Glass Tide Pools','Drowned Orchard','Sun Salt Gardens','Mariners’ Refuge','Open Shutters','First Light Beacon']
];
const roles = ['gateway','landmark','settlement','workshop','shrine','crossing','hazard','healer','puzzle','market','dungeon-entrance','watchtower','secret','ruin','garden','checkpoint','consequence','beacon'];
const descriptions = [
 'A forked road curves around a sheltered lantern bowl. Follow the milestone before entering the exposed country.',
 'Terraces climb beside a survey monument. A pale seam marks a small lantern-revealed cache.',
 'Homes face a common fire. A keeper offers directions and a free resting place beside the waystone.',
 'Workbenches and drying racks leave two narrow approaches to a supply chest; prowlers guard the outer yard.',
 'A roofless shrine shelters a keeper inscription. Its courtyard offers both a direct path and a quiet outer loop.',
 'A broken crossing lights one span at a time. The raised lantern reveals a safe passage while the bank remains open.',
 'The old road is scarred. Read the hazard marks and take the long bank, or return wearing the regional equipment.',
 'A hospice opens onto a sheltered court. The shop sells tonics, but the waystone heals without payment.',
 'Two controls face a dark lamp. Match their marks and hold light at the source; leaving it resets only the charge.',
 'Market awnings encircle a water trough. Medicines cost coins; no purchase is required to reach a dungeon.',
 'An underground stair stands apart from the road. A return marker and a camp let travelers prepare before descending.',
 'A ruined watchtower overlooks the entire road. Sentries patrol the terrace rather than the marked center lane.',
 'A veiled side alcove holds an old keeper gift. The region’s earned equipment unlocks this return visit.',
 'Collapsed buildings divide the courtyard into flanking lanes. A mixed patrol protects abandoned provisions.',
 'A garden survives around a sunken cistern. Shade, rather than direct light, settles its restless seed lamp.',
 'A roofed waystone offers a safe return point. The nearby milestone names the next land and the road home.',
 'A gathering place remembers the harm done here. Return after restoring its seal to hear what has changed.',
 'The beacon looks back across the whole region. A final inscription offers a clear route toward the shared dawn.'
];
// Wall segments deliberately differ in shape and flank openings. Reserved interaction
// rows (2, 5, 7) and approach columns (3, 8, 12) remain connected in every scene.
const wallMotifs = [
 [[1,1,5],[10,8,4]],[[4,1,4],[1,4,2],[10,6,2]],[[1,3,2],[5,3,3],[10,3,2],[13,6,2]],
 [[4,4,3],[9,4,3],[1,8,2]],[[1,1,2],[4,3,3],[9,6,3],[13,8,2]],[[4,1,4],[9,8,3]],
 [[1,3,2],[4,4,3],[9,6,3],[13,3,2]],[[1,1,2],[4,1,3],[9,1,3],[13,1,2],[4,8,3]],
 [[4,3,3],[9,3,3],[4,6,3],[9,6,3]],[[1,4,2],[4,1,3],[10,4,2],[13,8,2]],
 [[1,3,2],[4,3,3],[9,3,3],[13,3,2],[1,8,2],[13,8,2]],[[4,1,3],[4,3,3],[9,6,3],[9,8,3]],
 [[1,1,2],[1,3,2],[4,6,3],[10,8,2]],[[1,3,2],[5,4,2],[9,1,3],[13,6,2]],
 [[4,1,3],[9,1,3],[1,6,2],[13,6,2]],[[1,1,2],[13,1,2],[1,8,2],[13,8,2]],
 [[4,3,2],[6,4,1],[9,6,2],[11,8,1]],[[1,1,2],[4,1,3],[9,1,3],[13,1,2],[4,8,3],[9,8,3]]
];
// Regional landforms: root terraces, river fingers, cooled lava benches,
// wind-cut spires, ice shelves, moonlit briars and tidal rock pools.
const regionalLandforms = [
 [[1,4,2,'#'],[9,6,3,'#']],
 [[1,3,2,'~'],[4,4,4,'~'],[9,6,3,'~'],[13,8,2,'~']],
 [[1,6,2,'^'],[4,3,3,'^'],[9,4,3,'^'],[13,6,2,'#']],
 [[1,1,2,'#'],[4,4,1,'#'],[7,6,1,'#'],[11,3,1,'#'],[14,8,1,'#']],
 [[1,8,2,'~'],[4,6,3,'~'],[9,3,3,'~'],[13,4,2,'#']],
 [[1,3,2,'#'],[4,6,2,'#'],[7,3,1,'#'],[9,4,2,'#'],[13,8,2,'#']],
 [[1,6,2,'~'],[4,8,3,'~'],[9,4,3,'~'],[13,3,2,'#']]
];
export const regions = regionalStories.map((r,i)=>({...r,index:i,mapOrigin:[i*6,0],size:[6,3],sceneIds:Array.from({length:18},(_,j)=>30+i*18+j)}));
const idAt=(region,col,row)=>30+region*18+row*6+col;
function exitsAt(region,j){const x=j%6,y=Math.floor(j/6),exits={};if(x)exits.west=idAt(region,x-1,y);if(x<5)exits.east=idAt(region,x+1,y);if(y)exits.north=idAt(region,x,y-1);if(y<2)exits.south=idAt(region,x,y+1);return exits;}
function layout(region,j,exits){
 const grid=Array.from({length:10},(_,y)=>Array.from({length:16},(_,x)=>x===0||x===15||y===0||y===9?'#':'.'));
 for(const [direction,[x,y]] of Object.entries({west:[0,5],east:[15,5],north:[8,0],south:[8,9]}))if(exits[direction]!==undefined)grid[y][x]='.';
 for(const [x,y,length] of wallMotifs[j])for(let n=0;n<length;n++)if(![3,8,12].includes(x+n))grid[y][x+n]='#';
 // Banks leave the central road and all interaction approaches open.
 for(const [x,y,length,terrain] of regionalLandforms[region])for(let n=0;n<length;n++)if(![3,8,12].includes(x+n))grid[y][x+n]=terrain;
 if(j===5)for(let x=4;x<=7;x++)grid[4][x]='~';
 if(j===12){for(const [x,y] of [[11,6],[13,6],[11,7],[13,7],[11,8],[12,8],[13,8]])grid[y][x]='#';grid[6][12]='D';}
 return grid.map(row=>row.join(''));
}
const point=(x,y)=>[x+.5,y+.5];
function makeScene(region,j){
 const r=regions[region],id=idAt(region,j%6,Math.floor(j/6)),prefix=`${r.id}-${j}`,exits=exitsAt(region,j);
 const checkpoint=[0,2,7,10,15].includes(j);
 const scene={id,name:sceneNames[region][j],kind:'overworld',land:r.id,dungeon:-1,exits,tiles:layout(region,j,exits),checkpoint,checkpointAt:[3.5,5.5],map:{x:r.mapOrigin[0]+j%6,y:Math.floor(j/6),region:r.id},role:roles[j],description:`${descriptions[j]} ${r.problem}`,art:{terrain:r.art,landmark:`${r.id}-${roles[j]}`,transition:`${r.id}-bank`,palette:r.id},scenery:[{kind:`${r.id}-${roles[j]}`,x:6.5,y:1.5,solid:false},{kind:`${r.id}-road-marker`,x:14.5,y:7.5,solid:false}],links:[],gates:[],hazards:[],puzzles:[],rewards:[],shops:[],characters:[],encounters:[]};
 if(!checkpoint){const types=region===1||region===4?['fen-moth','brambleling']:region===3||region===6?['glass-sentinel','fen-moth']:['brambleling','glass-sentinel'];scene.encounters=[{kind:types[j%2],x:10.5,y:2.5,hp:2+Math.floor(region/3)},{kind:types[(j+1)%2],x:13.5,y:j===12?5.5:7.5,hp:2+Math.floor(j/9)}];if([6,13].includes(j))scene.encounters.push({kind:types[0],x:5.5,y:5.5,hp:3});}
 if([1,3,11,13,17].includes(j))scene.rewards.push({id:`${prefix}-cache`,at:[12.5,7.5],requires:[],coins:5+j,tonics:1,clear:j===13,text:`Supplies recovered at ${scene.name}.`});
 if(j===6)scene.hazards.push({at:[10.5,6.5],damage:1,...(region?{equipment:equipment[region-1]}:{})});
 if(j===8||j===14){const puzzleId=`${prefix}-light`;scene.puzzles.push({id:puzzleId,source:[8.5,2.5],seconds:j===8?1.5:2.5,shade:j===14,requires:[],controls:[{at:[3.5,2.5],states:3,target:1},{at:[12.5,2.5],states:4,target:region%3+1}],hint:j===8?`Set the west mark to 1 and east mark to ${region%3+1}; hold your lantern at the middle lamp.`:`Set the west mark to 1 and east mark to ${region%3+1}; lower your lantern at the seed lamp.`,reward:{id:`${prefix}-puzzle-gift`,coins:16,tonics:2},text:`${scene.name}: the keeper circuit holds. A safe passage is marked for the next traveler.`});}
 if(j===9||j===7)scene.shops.push({id:`${prefix}-tonics`,at:[12.5,7.5],price:6,item:'tonic'});
 if(region&&j===12){scene.gates.push({at:[12.5,6.5],requires:[],equipment:equipment[region-1]});scene.rewards.push({id:`${prefix}-return-gift`,at:[12.5,7.5],requires:[equipment[region-1]],coins:30,tonics:2,text:`An old keeper cache opens to your ${equipment[region-1]}.`});}
 if(region&&j===2)scene.characters.push({id:`${r.id}-witness`,name:r.npc,at:[5.5,7.5],requires:[],text:`${r.npc}: ${r.problem} ${r.goal}`,quest:`quest-${r.id}-restored`,after:`${r.npc}: ${r.consequence}`});
 if(region&&j===16)scene.characters.push({id:`${r.id}-homecoming`,name:r.npc,at:[5.5,7.5],requires:[seals[region-1]],text:`${r.npc}: ${r.consequence} Bring our seal to Mira at the Far Lantern.`});
 if((j===0&&region)||j===15)scene.characters.push({id:`${prefix}-sign`,name:'Road inscription',at:[5.5,7.5],requires:[],text:region?`${r.name}: ${r.goal} The village is two roads east of the gate; the stair is in the middle row, fifth road. Return to Lantern Confluence from this gate.`:opening});
 return scene;
}
export const rooms = regions.flatMap((_,i)=>sceneNames[i].map((_,j)=>makeScene(i,j)));
const room=id=>rooms.find(r=>r.id===id);
// Hub spokes are opt-in and never share a legacy interaction location.
for(let i=1;i<7;i++){
 const from=30+i,to=30+i*18;
 room(from).links.push({id:`road-to-${regions[i].id}`,at:[3.5,2.5],to,entry:[3.5,5.5],requires:[],label:regions[i].name});
 room(to).links.push({id:`road-from-${regions[i].id}`,at:[12.5,2.5],to:from,entry:[4.5,2.5],requires:[],label:'Lantern Confluence'});
 // Earned regional equipment opens a cross-country shortcut, never the only exit.
 const destination=i===6?48:30+(i+1)*18;
 room(to+17).links.push({id:`${regions[i].id}-keeper-shortcut`,at:[12.5,2.5],to:destination,entry:[8.5,5.5],requires:[equipment[i-1]],hint:`Return with ${equipment[i-1]} to open the keeper road.`,label:'Keeper shortcut'});
}
for(const portal of dungeonEntrances)room(portal.from).links.push({id:`dungeon-road-${portal.dungeon}`,at:[12.5,2.5],to:portal.to,entry:[1.5,5.5],requires:[],label:portal.name});
room(30).characters.push({id:'mira-far-road',name:'Mira',at:[5.5,7.5],requires:[],text:opening});
room(40).characters.push({id:'ida-six-roads',name:'Ida',at:[5.5,7.5],requires:[],text:'Ida: Six keeper lights failed because each kept its flame alone. Visit the settlements first. Their keepers know the stairs. Every earned tool opens a keeper road and an old cache; no merchant sells the only way forward.'});
room(47).characters.push({id:'mira-far-lantern',name:'Mira',at:[5.5,7.5],requires:[],text:'Mira: This is the Far Lantern. Bring the river, cinder, gale, frost, night and dawn seals. Our three hearts will join their light; they will never be taken away.'});
room(47).checkpoint=true;room(47).encounters=[];
room(47).ending={id:'ending-shared-dawn',at:[8.5,7.5],requires:['beacon-restored',...seals],text:resolution,hint:'Six distant seals are needed. The original three-heart beacon remains restored.'};
export const campaign = {rooms,quests:storyCampaign.quests};
export const navigation = rooms.map(r=>({id:r.id,name:r.name,...r.map,checkpoint:r.checkpoint,role:r.role,art:r.art,neighbors:Object.values(r.exits),portals:r.links.map(l=>({label:l.label,to:l.to,requires:l.requires}))}));
export const artSemanticIds = [...new Set(rooms.flatMap(r=>Object.values(r.art)))];

// Adapter for dungeon authors with different reserved numeric ranges. Resolve by
// dungeon index, never by title or array order; publish a single atomic install.
export function withDungeons(module){
 const source=module.campaign||module;
 if(!Array.isArray(source.rooms))throw new TypeError('Dungeon campaign needs rooms');
 const copy=structuredClone(rooms);
 for(const portal of dungeonEntrances.filter(d=>d.dungeon>=3)){
  const candidates=source.rooms.filter(r=>r.kind==='dungeon'&&r.dungeon===portal.dungeon).sort((a,b)=>a.id-b.id);
  const target=candidates.find(r=>r.part==='threshold'||r.part==='entrance')||candidates[0];
  if(!target)throw new TypeError(`Missing dungeon ${portal.dungeon}`);
  copy.find(r=>r.id===portal.from).links.find(l=>l.id===`dungeon-road-${portal.dungeon}`).to=target.id;
 }
 return {rooms:[...copy,...structuredClone(source.rooms)],quests:[...structuredClone(storyCampaign.quests),...structuredClone(source.quests||[])]};
}
