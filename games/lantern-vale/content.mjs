// Renderer-independent authored content. Coordinates are tile centers in a 16 × 10 room.
// Optional links require explicit interaction: they never replace boundary exits.
export const contentVersion = 1;
export const lands = [
  {id:'mossward',name:'Mossward',columns:[0,1],ground:'moss',water:'spring',canopy:'broadleaf',features:['terraced roots','fern banks','fallen nurse logs']},
  {id:'amber-fen',name:'Amber Fen',columns:[2,3],ground:'peat',water:'reed pools',canopy:'willow',features:['reed islands','raised boardwalks','silt channels']},
  {id:'glass-highlands',name:'Glass Highlands',columns:[4],ground:'chalk',water:'glacial pools',canopy:'wind pine',features:['crystal seams','scree terraces','wind-carved arches']}
];
const landmarks = [
 ['Mira’s Lantern Oak','hollow oak','fern bank','nurse log'],['Bellroot Crossing','root arch','bluebell bed','split stump'],['Ferryman’s Rest','moored skiff','reed island','net rack'],['Saffron Sluice','waterwheel','silt channel','willow stand'],['Northern Beacon','beacon tower','crystal seam','wind pine'],
 ['Raincatch Grove','leaf cistern','mushroom shelf','fallen oak'],['Rootvault Gate','root-wrapped stair','fern terraces','stone lantern'],['Heron Narrows','heron roost','reed tunnel','boardwalk'],['Archive Landing','sunken stair','broken quay','willow roots'],['Cloudglass Shelf','glass arch','chalk terrace','ice pool'],
 ['Old Charcoal Ring','cold kiln','regrowth saplings','charcoal mound'],['Firefly Orchard','grafted apple tree','wildflower bank','bee log'],['The Listening Marsh','reed organ','peat islands','driftwood'],['Saltbell Causeway','bell buoy','dry dock','rush beds'],['Prism Approach','crystal stair','scree fan','windbreak pines']
];
export const camps = [0,2,4,6,8,14];
export const entrances = [6,8,14];
const dungeonNames=['Rootvault','Drowned Archive','Prism Crypt'];
const dungeonParts=['Threshold','Lantern Trial','Warden Hall','Heart Chamber'];
export const rooms = Array.from({length:27},(_,id)=>{
 const exits={};
 if(id<15){if(id%5>0)exits.west=id-1;if(id%5<4)exits.east=id+1;if(id>=5)exits.north=id-5;if(id<10)exits.south=id+5;}
 else {const d=Math.floor((id-15)/4),part=(id-15)%4;exits.west=part===0?entrances[d]:id-1;if(part<3)exits.east=id+1;}
 const d=id<15?-1:Math.floor((id-15)/4);
 return {id,name:id<15?landmarks[id][0]:`${dungeonNames[d]} · ${dungeonParts[(id-15)%4]}`,land:id<15?lands.find(l=>l.columns.includes(id%5)).id:null,dungeon:d,exits,camp:camps.includes(id),entrance:entrances.includes(id)?15+entrances.indexOf(id)*4:null,
 // Keep horizontal y=5.5 and vertical x=8.5 corridors clear; scenery is decorative.
 scenery:id<15?landmarks[id].slice(1).map((kind,i)=>({id:`scenery-${id}-${i}`,kind,x:[2.5,5.5,13.5][i],y:[1.5,8.5,8.5][i],solid:false})): [{id:`scenery-${id}`,kind:['carved root ribs','waterlogged shelves','split crystal pillars'][d],x:5.5,y:1.5,solid:false}]};
});
export const routeContract = {
 size:[16,10],overworldCount:15,baseRoomCount:27,
 boundary:{west:[0,5],east:[15,5],north:[8,0],south:[8,9]},
 waystone:[3.5,5.5],dungeonStair:[12.5,2.5],beacon:{room:4,at:[12.5,5.5]},
 bridge:{x:8,y:5,parts:[16,20,24],requires:'lantern-lit'},
 plate:{at:[12.5,5.5],rooms:[16,20,24]},keyRooms:[17,21,25],relicRooms:[18,22,26],
 cache:{at:[4.5,2.5],rooms:rooms.filter(r=>r.id<15&&!r.camp).map(r=>r.id)},
 eastGateRequirements:['threshold-clear','sun-plate','warden-key'],veilRelicsByColumn:[0,0,1,1,2]
};
export const rewards = [
 {id:'orchard-tonics',kind:'supplies',coins:5,tonics:1,requires:['quest-orchard']},
 {id:'reed-disc',kind:'weapon',weapon:'sun-disc',requires:['quest-reeds'],description:'A returning disc: stuns moths in lantern light and strikes distant optional shutters.'},
 {id:'root-cache',kind:'supplies',coins:8,tonics:1,requires:['puzzle-root']},
 {id:'archive-cache',kind:'capacity',stat:'tonicCapacity',amount:1,cap:10,requires:['puzzle-water']},
 {id:'prism-cache',kind:'charm',effect:'extend-brambleling-light-stun',amount:0.2,description:'Prism charm: raising the lantern holds bramblelings still for longer.',requires:['puzzle-prism']},
 {id:'keeper-purse',kind:'supplies',coins:12,tonics:2,requires:['quest-echoes']}
];
export const characters = [
 {id:'mira',name:'Mira',role:'keeper',encounters:[
  {id:'mira-opening',room:0,at:[4.5,6.5],when:{relics:0},text:'The wardens swallowed our dawn. Take my lantern. Follow the western grove to Rootvault; light reveals its bridge. Restore three hearts, then raise your lantern at the northern beacon.'},
  {id:'mira-root',room:6,at:[4.5,6.5],when:{relics:1},text:'The oak is waking. Your blade carries its strength. Cross into Amber Fen; the Archive waits at the landing.'},
  {id:'mira-water',room:8,at:[4.5,6.5],when:{relics:2},text:'I can hear the river again. Seek the crystal stair in the southeast. Let the last warden show its strike before you answer.'},
  {id:'mira-beacon',room:4,at:[10.5,6.5],when:{relics:3},text:'All three hearts are home. Raise the lantern beside the beacon and call the dawn.'}]},
 {id:'oren',name:'Oren',role:'orchard tender',encounters:[{id:'oren-orchard',room:11,at:[3.5,6.5],text:'My graft has forgotten sunrise. Hold your lantern by its crown; I will share my sunleaf tonic.',after:'There are new buds every time you return. Keep those tonics for the wardens.'}]},
 {id:'sen',name:'Sen',role:'reedwright',encounters:[{id:'sen-reeds',room:2,at:[5.5,6.5],text:'Three reeds still sing beneath the fog. Hear them with your lantern and I will mend this returning sun-disc.',after:'The disc returns to your hand. Its flash stills moths; your sword finishes the work.'}]},
 {id:'ida',name:'Ida',role:'bell keeper',encounters:[{id:'ida-echoes',room:14,at:[5.5,6.5],text:'Find the three keepers’ inscriptions in the hidden chambers. I have supplies for whoever brings their story home.',after:'Roots hold, water remembers, glass shares. That is how we keep a valley alive.'}]}
];
export const quests = [
 {id:'quest-orchard',giver:'oren',steps:[{id:'orchard-awake',room:11,at:[11.5,2.5],action:'hold-light',seconds:2}],reward:'orchard-tonics',optional:true},
 {id:'quest-reeds',giver:'sen',steps:[{id:'reed-west',room:3,at:[3.5,2.5],action:'illuminate'},{id:'reed-south',room:7,at:[11.5,2.5],action:'illuminate'},{id:'reed-east',room:12,at:[11.5,2.5],action:'illuminate'}],reward:'reed-disc',optional:true},
 {id:'quest-echoes',giver:'ida',steps:['root-inscription','water-inscription','prism-inscription'].map(id=>({discovery:id,action:'read'})),reward:'keeper-purse',optional:true}
];
export const discoveries = [
 {id:'root-inscription',room:'root-shutter',at:[12.5,2.5],text:'We left a gap for every root. A keeper guides growth; she does not command it.'},
 {id:'water-inscription',room:'water-reflection',at:[12.5,2.5],text:'Still water lends the sun a second road. Remember those who crossed before you.'},
 {id:'prism-inscription',room:'prism-beam',at:[12.5,2.5],text:'One flame, many windows. Dawn belongs to everyone beneath it.'}
];
export const optionalRooms = [
 {id:'root-shutter',name:'The Breathing Nursery',dungeon:0,entry:[1.5,5.5],exit:[1.5,5.5],scenery:['root lattice','seed beds','amber sap bowls'],puzzle:'puzzle-root',reward:'root-cache'},
 {id:'water-reflection',name:'The Still Reading Room',dungeon:1,entry:[1.5,5.5],exit:[1.5,5.5],scenery:['reflecting pool','submerged desks','lily lamps'],puzzle:'puzzle-water',reward:'archive-cache'},
 {id:'prism-beam',name:'The Borrowed Sunrise',dungeon:2,entry:[1.5,5.5],exit:[1.5,5.5],scenery:['three-faced prism','chalk star map','glass chimes'],puzzle:'puzzle-prism',reward:'prism-cache'}
];
export const optionalLinks = optionalRooms.map((room,d)=>({id:`link-${room.id}`,from:15+d*4,to:room.id,at:[5.5,2.5],returnTo:[5.5,3.5],trigger:'interact',requires:[],optional:true}));
// Declarative puzzle contracts consumed by the campaign adapter. No timer can seal an exit or consume a key.
export const puzzles = [
 {id:'puzzle-root',room:'root-shutter',mechanic:'root-shutter',reset:'on-request',requires:[],
  objects:[{id:'root-shutter',at:[4.5,4.5],action:'toggle',initial:'closed'},{id:'root-seed',at:[9.5,4.5],action:'illuminate',seconds:2}],
  rules:[{when:{shutter:'open',lantern:'lit',at:'root-seed'},effect:'grow-root-bridge'},{when:{bridge:'grown',shutter:'closed'},effect:'open-reward'}],
  hint:'Open the shutter to feed the seed. Close it once the root takes hold.',completion:'open-reward'},
 {id:'puzzle-water',room:'water-reflection',mechanic:'water-reflection',reset:'on-request',requires:[],
  objects:[{id:'water-sluice',at:[4.5,4.5],action:'toggle',initial:'flowing'},{id:'water-mirror',at:[9.5,4.5],action:'rotate',orientations:4},{id:'water-source',at:[3.5,2.5],action:'illuminate'}],
  rules:[{when:{sluice:'still',mirror:2,lantern:'lit',at:'water-source'},effect:'open-reward'}],
  hint:'Still the pool. Turn the silver page toward its reflection, then lend it your light.',completion:'open-reward'},
 {id:'puzzle-prism',room:'prism-beam',mechanic:'prism-beam',reset:'on-request',requires:[],
  objects:[{id:'prism-source',at:[3.5,2.5],action:'illuminate'},{id:'prism-left',at:[6.5,2.5],action:'rotate',orientations:4},{id:'prism-right',at:[10.5,2.5],action:'rotate',orientations:4}],
  rules:[{when:{left:1,right:3,lantern:'lit',at:'prism-source'},effect:'open-reward'}],
  hint:'Turn the first face east and the second west. A shared beam wakes both windows.',completion:'open-reward'}
];
export const enemyTypes = [
 {id:'brambleling',lands:['mossward'],silhouette:'low thorn-backed crawler',behavior:'pursue',lightResponse:'retreat briefly on lantern ignition',drop:{coins:3}},
 {id:'fen-moth',lands:['amber-fen'],silhouette:'wide amber wings',behavior:'orbit then dive',lightResponse:'approach lantern; sun-disc stun interrupts dive',drop:{coins:3}},
 {id:'glass-sentinel',lands:['glass-highlands'],silhouette:'tall split crystal',behavior:'telegraphed straight shot',lightResponse:'expose core while charging in light',drop:{coins:3}}
];
export const wardens = [
 {id:'root-warden',room:18,name:'The Knotted Gardener',relic:0,hp:8,activation:'lantern-lit',pattern:[{phase:'tell',seconds:1.2,cue:'roots gather in a straight line'},{phase:'strike',seconds:0.4,attack:'lane-charge',tracking:false},{phase:'recover',seconds:1.6,vulnerable:true}],counter:'Step aside after the root line appears, then strike the exposed knot.',darkness:'dormant',reward:'campaign-relic-0'},
 {id:'water-warden',room:22,name:'The Drowned Librarian',relic:1,hp:8,activation:'lantern-lit',pattern:[{phase:'tell',seconds:1.4,cue:'three ripples mark their landing sites'},{phase:'strike',seconds:0.5,attack:'three-fixed-ripples',tracking:false},{phase:'recover',seconds:1.8,vulnerable:true}],counter:'Leave the marked ripples and close in as the shell drains.',darkness:'dormant',reward:'campaign-relic-1'},
 {id:'prism-warden',room:26,name:'The Splintered Astronomer',relic:2,hp:8,activation:'lantern-lit',pattern:[{phase:'tell',seconds:1.5,cue:'a thin beam marks the next sweep'},{phase:'strike',seconds:0.8,attack:'quarter-turn-beam',tracking:false},{phase:'recover',seconds:1.5,vulnerable:true}],counter:'Circle behind the marked beam; the cracked rear face opens after the sweep.',darkness:'dormant',reward:'campaign-relic-2'}
];
export const interactions = [
 ...camps.map(room=>({id:`waystone-${room}`,room,at:routeContract.waystone,action:'heal-save-tonic',label:'Waystone'})),
 ...entrances.map((room,d)=>({id:`stair-${d}`,room,at:routeContract.dungeonStair,action:'enter-dungeon',target:15+d*4,label:dungeonNames[d]})),
 {id:'beacon',room:4,at:routeContract.beacon.at,action:'ending',requires:['campaign-relic-0','campaign-relic-1','campaign-relic-2','lantern-lit'],label:'Beacon'},
 ...characters.flatMap(c=>c.encounters.map(e=>({...e,character:c.id,action:'talk',label:c.name}))),
 ...discoveries.map(d=>({...d,action:'read',label:'Keeper inscription'}))
];
// Dependency edges name completion events rather than inventory keys. Optional rewards
// never occur in routeContract: a missing optional completion cannot gate the campaign.
export const completionEvents = [
 ...quests.map(q=>({id:q.id,requires:q.steps.filter(s=>s.discovery).map(s=>s.discovery)})),
 ...puzzles.map(p=>({id:p.id,requires:p.requires})),
 ...discoveries.map(d=>({id:d.id,requires:[]})),
 ...[0,1,2].map(d=>({id:`campaign-relic-${d}`,requires:[]})),
 {id:'lantern-lit',requires:[]}
];
export const weaponTypes = [
 {id:'keeper-blade',name:'Blade',acquisition:'starting-equipment',damageByRelicCount:[1,2,3,3],range:1.8,cooldown:0.3},
 {id:'sun-disc',name:'Sun-disc',acquisition:'reed-disc',damage:1,range:6,cooldown:0.8,returns:true,stunSeconds:1.2,lightEffect:'stun-fen-moth',optionalPuzzleEffect:'strike-distant-shutter'}
];
export const campaignRewards = [0,1,2].map(d=>({id:`campaign-relic-${d}`,room:18+d*4,at:[12.5,5.5],requires:['warden-defeated'],relic:d,sword:Math.min(3,2+d),maxHp:10+d*2,heal:'full',tonics:1,tonicCap:9}));
export const treasure = routeContract.cache.rooms.map(room=>({id:`cache-${room}`,room,at:routeContract.cache.at,requires:['lantern-lit'],coins:5,tonics:1,tonicCap:9,once:true}));
