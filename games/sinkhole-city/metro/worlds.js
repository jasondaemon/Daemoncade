import {scaleInfo,SCALE_COUNT,LIFE_TARGET} from './ascension.js?v=release48';
export const WORLDS=[
 {id:'metro',title:'Market District',label:'Metro',landmark:'Water tower',unlock:0},
 {id:'basecamp',title:'Pinewood Basecamp',label:'Basecamp',landmark:'Summit lodge',unlock:3,previous:'metro'},
 {id:'deep',title:'Abyssal Bay',label:'Deep Sink',landmark:'Research station',unlock:3,previous:'basecamp'},
 {id:'alien',title:'Resonance Basin',label:'Alien World',landmark:'Portal',unlock:3,previous:'deep'},
 {id:'orbit',title:'Helios Reach',label:'Orbit Collapse',landmark:'Helios star',unlock:3,previous:'alien'},
 {id:'ascension',title:'Infinity',label:'Infinity',landmark:'Supercluster',unlock:3,previous:'orbit',requires:'orbit-sun'}
];
export const METRO_CONTRACTS=[
 {id:'cleanup',world:'metro',rulesVersion:4,title:'Street sweep',description:'Swallow 72 street fixtures. Work the sidewalks and side streets.',duration:200,target:72,kind:'clutter',silver:140,gold:95},
 {id:'traffic',world:'metro',rulesVersion:4,title:'Clear the traffic',description:'Grow a vehicle-sized hole. Catch moving traffic or clear parked vehicles: 24 total.',duration:240,target:24,kind:'vehicles',silver:175,gold:120},
 {id:'tower',world:'metro',rulesVersion:4,title:'Tower demolition',description:'Work up through the neighbourhood and bring down the water tower.',duration:300,target:1,kind:'landmark',silver:225,gold:165}
];
export const BASECAMP_CONTRACTS=[
 {id:'camp-cleanup',world:'basecamp',rulesVersion:4,title:'Leave no trace',description:'Collect 90 coolers, fire pits, logs and picnic tables along the forest trails.',duration:200,target:90,kind:'clutter',silver:145,gold:100},
 {id:'camp-packup',world:'basecamp',rulesVersion:4,title:'Pack up camp',description:'Swallow 20 tents and camper vans. Clear the meadow and woodland pitches.',duration:260,target:20,kind:'camp',silver:195,gold:140},
 {id:'camp-lodge',world:'basecamp',rulesVersion:4,title:'Last lodge standing',description:'Grow through the campsite and cabins, then swallow the Summit lodge in the north clearing.',duration:300,target:1,kind:'landmark',silver:235,gold:175}
];
export const DEEP_CONTRACTS=[
 {id:'deep-cleanup',world:'deep',rulesVersion:4,title:'Shoal chaser',description:'Catch 85 sea creatures. Find the fish schools between the reefs and grow into rays and turtles.',duration:220,target:85,kind:'marine',silver:165,gold:115},
 {id:'deep-salvage',world:'deep',rulesVersion:4,title:'Lost cargo',description:'Swallow the old shipwreck to uncover six gold caches, then collect them all.',duration:300,target:6,kind:'treasure',silver:225,gold:165},
 {id:'deep-station',world:'deep',rulesVersion:4,title:'Ocean giants',description:'Grow through the marine food chain and catch both roaming whales. The research station is an optional bonus.',duration:330,target:2,kind:'giants',silver:260,gold:195}
];
export const ALIEN_CONTRACTS=[
 {id:'alien-forage',world:'alien',rulesVersion:4,title:'First contact',description:'Collect 110 crystal shards and spore plants around the violet groves.',duration:220,target:110,kind:'clutter',silver:165,gold:115},
 {id:'alien-cores',world:'alien',rulesVersion:4,title:'Resonance cascade',description:'Swallow the tall mint relays to open nearby pods, then collect 18 exposed energy cores.',duration:300,target:18,kind:'cores',silver:230,gold:170},
 {id:'alien-portal',world:'alien',rulesVersion:4,title:'Close the gateway',description:'Discharge all six grove relays to activate the portal. Grow large enough and swallow it.',duration:330,target:1,kind:'landmark',silver:265,gold:200}
];
export const ORBIT_CONTRACTS=[
 {id:'orbit-debris',world:'orbit',rulesVersion:4,title:'Kessler cleanup',description:'Collect 115 pieces of orbital debris. Follow the curved asteroid belts to build mass.',duration:240,target:115,kind:'clutter',silver:180,gold:125},
 {id:'orbit-fleet',world:'orbit',rulesVersion:4,title:'Fleet interception',description:'Intercept 21 moving satellites, probes or shuttles. Grow before taking the larger craft.',duration:300,target:21,kind:'spacecraft',silver:230,gold:170},
 {id:'orbit-sun',world:'orbit',rulesVersion:4,title:'Solar collapse',description:'Swallow all four planets to release the Helios star, then bring the star into your gravity well.',duration:330,target:1,kind:'landmark',silver:265,gold:200}
];
export const ASCENSION_CONTRACTS=[
 {id:'infinity-matter',world:'ascension',rulesVersion:3,title:'Matter',description:'Begin with atoms. Grow beyond the atomic and molecular scales.',duration:300,target:2,kind:'scales',silver:230,gold:170},
 {id:'infinity-life',world:'ascension',rulesVersion:3,title:'Life & landscapes',description:'Grow through microscopic life, gardens, neighborhoods and cities into landscapes.',duration:1000,target:LIFE_TARGET,kind:'scales',silver:750,gold:550},
 {id:'infinity-galaxies',world:'ascension',rulesVersion:4,title:'Everything',description:'One continuous journey: atomic matter to galaxies, with every scale in between.',duration:1500,target:SCALE_COUNT,kind:'scales',silver:1100,gold:850}
];
export const ALL_CONTRACTS=[...METRO_CONTRACTS,...BASECAMP_CONTRACTS,...DEEP_CONTRACTS,...ALIEN_CONTRACTS,...ORBIT_CONTRACTS,...ASCENSION_CONTRACTS];
export const TOTAL_MEDALS=ALL_CONTRACTS.length*3;
export const worldFor=id=>WORLDS.find(w=>w.id===id)||WORLDS[0];
export {CAMP_TRAILS as BASECAMP_TRAILS} from './habitats.js?v=ocean10';
export function objectiveMatches(c,o){return c.kind==='scales'?o.type==='quantum':c.kind==='spacecraft'?['satellite','probe','shuttle'].includes(o.type):c.kind==='cores'?['resonator','pod'].includes(o.type):c.kind==='marine'?Boolean(o.swim):c.kind==='giants'?o.type==='whale':c.kind==='treasure'?['wreck','treasure'].includes(o.type):c.kind==='landmark'?['landmark',...(c.world==='alien'?['resonator']:c.world==='orbit'?['planet']:[])].includes(o.type):c.kind==='camp'?['tent','rv'].includes(o.type):c.kind==='vehicles'?['car','van'].includes(o.type):['debris','shard','spore','cone','bin','hydrant','bench','lamp','crate','cooler','log','firepit','picnic','shell','amphora','seafan','kelp'].includes(o.type);}
const GUIDES={
 orbit:{bands:[1.2,1.65,2.69,5.61,8.5],stages:['Debris & satellites','Probes','Shuttles & planets','Helios star'],next:['probes','shuttles','star'],messages:['Collect debris along the belts. Spacecraft move around their orbits.','Probes now fit. Intercept their orbit rather than chasing their tail.','Shuttles now fit. Planets need a radius of 4.27.','Large enough for Helios. Swallow all four planets to release the star.'],hint:'Blue arrows mark spacecraft; violet circles mark planets. Helios is at the center.'},
 alien:{bands:[1.2,1.53,2.02,5.61,8.5],stages:['Shards & spores','Grove relays','Energy pods','Portal'],next:['relays','pods','portal'],messages:['Collect shards and spores; mint crystals mark the relays.','Relays now fit. Swallow one to open three nearby pods.','Open pods now fit. Discharge all six relays to activate the portal.','You are large enough for the portal. All six relays must be discharged.'],hint:'Mint map squares are relays; gold squares are open pods. Portal: central basin.'},
 metro:{bands:[1.2,1.65,4.03,5.61,8.5],stages:['Street clutter','Vehicles & trees','Buildings','Water tower'],next:['vehicles','buildings','tower'],messages:['Small objects first. Cyan map markers fit your hole.','Vehicles now fit.','Buildings now fit.','You can take the water tower.'],hint:'Trees and parked cars accelerate growth. Water tower: southwest square.'},
 basecamp:{bands:[1.2,1.4,3.66,5.61,8.5],stages:['Camp clutter','Tents & campers','Cabins','Summit lodge'],next:['tents','cabins','lodge'],messages:['Start with coolers and logs along the trails.','Tents and pines now fit.','Cabins now fit.','You can take the Summit lodge.'],hint:'Follow the trails. Summit lodge: orange marker to the north.'},
 deep:{bands:[1.2,1.83,3.66,5.25,8.5],stages:['Fish schools','Sharks & dolphins','Shipwreck','Whales'],next:['dolphins','shipwreck','whales'],messages:['Catch fish schools first. Swimmers dive into the current.','Sharks and dolphins now fit.','You can take the shipwreck. Gold lies underneath.','You can catch the whales.'],hint:'Blue arrows are swimmers. Purple marks the wreck; orange marks the research station.'}
};
export function growthInfo(world,radius,run=null){
 if(world==='ascension')return scaleInfo(run?.scaleStage||0,radius);
 const g=GUIDES[world]||GUIDES.metro,found=g.bands.findIndex((_,i)=>i<4&&radius<g.bands[i+1]),index=found<0?3:found;
 return {index,stage:g.stages[index],value:Math.max(0,Math.min(1,(radius-g.bands[index])/(g.bands[index+1]-g.bands[index]))),label:index===3?(radius>=8.49?'Maximum size':'Growing to maximum'):`Next: ${g.next[index]}`,message:g.messages[index],intro:g.messages[0],hint:g.hint};
}
export function districtLabel(world,p,run=null){
 if(world==='ascension')return `INFINITY · ${scaleInfo(run?.scaleStage||0,p.radius).label.toUpperCase()}`;
 if(world==='orbit')return `ORBIT COLLAPSE · ${Math.hypot(p.x,p.z)<12?'HELIOS CORE':Math.hypot(p.x,p.z)<30?'INNER ORBITS':'OUTER DEBRIS BELT'}`;
 if(world==='alien')return `ALIEN WORLD · ${Math.hypot(p.x,p.z+4)<13?'PORTAL BASIN':p.z<0?'OBSIDIAN RIDGE':'SPORE GARDENS'}`;
 if(world==='deep')return `DEEP SINK · ${p.z<-28?'RESEARCH OUTPOST':p.z<0?'WRECK GARDEN':p.x<0?'CORAL SHELF':'SHELL LAGOON'}`;
 if(world==='basecamp')return `BASECAMP · ${p.z<-20?'LODGE CLEARING':p.x<0?'PINE GROVE':'MEADOW PITCHES'}`;
 return `METRO · ${p.x<0?(p.z<0?'OLD TOWN':'CIVIC SQUARE'):(p.z<0?'WORKS YARD':'MARKET ROW')}`;
}
