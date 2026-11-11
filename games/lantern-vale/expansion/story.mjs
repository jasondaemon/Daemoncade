// Narrative uses completion IDs, never inventory-consuming tolls.
export const seals = ['river-seal','cinder-seal','gale-seal','frost-seal','night-seal','dawn-seal'];
export const equipment = ['tide-boots','ember-cloak','wind-hook','frost-lens','moon-mirror','dawn-thread'];
export const regionalStories = [
 {id:'confluence',name:'Lantern Confluence',npc:'Mira',problem:'The restored beacon reveals six roads whose keepers have fallen silent.',goal:'Visit the six distant lands. Carry their seals to the Far Lantern.',consequence:'The first beacon stays lit; every distant light can share its dawn.',art:'moss'},
 {id:'riverreach',name:'Riverreach',npc:'Sen',problem:'The river runs backward around a drowned bell; boats cannot bring medicine home.',goal:'Find the Bell Cistern below Lockkeeper Quay and recover the river seal.',consequence:'The bell rings downstream. Ferries carry medicine again.',art:'peat'},
 {id:'cinderstep',name:'Cinderstep',npc:'Oren',problem:'A furnace drinks the orchard rain, leaving ash where seedlings should grow.',goal:'Enter the Ember Foundry beneath Kilnmarket and recover the cinder seal.',consequence:'Warm rain returns. Oren plants the first orchard beyond the valley.',art:'ember'},
 {id:'windscar',name:'Windscar',npc:'Ida',problem:'The mountain bells steal voices; caravans lose one another in the wind.',goal:'Climb to the Gale Observatory and recover the gale seal.',consequence:'The bells answer names again. Lost caravans follow their voices home.',art:'chalk'},
 {id:'frostmere',name:'Frostmere',npc:'Sen',problem:'The lake holds a winter that never ends, trapping the ferry families below its ice.',goal:'Descend into the Winter Reservoir and recover the frost seal.',consequence:'Channels thaw between the houses. Families reunite at the ferry fire.',art:'ice'},
 {id:'nightbloom',name:'Nightbloom',npc:'Oren',problem:'Borrowed stars have kept the forest awake; its flowers no longer know when to open.',goal:'Find the Moon Conservatory and recover the night seal.',consequence:'The stolen stars return overhead. Flowers open on their own time.',art:'night'},
 {id:'dawncoast',name:'Dawncoast',npc:'Mira',problem:'The last lighthouse hoards the horizon, believing a shared flame must die.',goal:'Cross the Tide of Glass, recover the dawn seal in the Horizon Engine, then gather all six seals.',consequence:'The lighthouse opens its shutters. Dawn reaches every shore.',art:'sand'}
];
export const quests = regionalStories.slice(1).flatMap((r,i)=>[
 {id:`quest-${r.id}-witness`,requires:[`${r.id}-witness`],text:`${r.npc}: ${r.problem} ${r.goal}`},
 {id:`quest-${r.id}-lamps`,requires:[`${r.id}-8-light`,`${r.id}-14-light`],text:`${r.npc}: The road lamps now hold both daylight and shade. Travelers can find the hospice again.`,reward:{id:`reward-${r.id}-lamps`,coins:20,tonics:1}},
 {id:`quest-${r.id}-restored`,requires:[seals[i]],text:`${r.npc}: ${r.consequence}`,reward:{id:`reward-${r.id}-thanks`,coins:18,tonics:2}}
]);
export const finalQuest = {id:'quest-shared-dawn',requires:['beacon-restored',...seals],text:'All six roads answer. Return to the Far Lantern in Lantern Confluence; raise your light beside Mira.'};
export const campaign = {rooms:[],quests:[...quests,finalQuest]};
export const opening = 'Mira: Our three hearts are home. This dawn is real. Beyond the beacon, six distant keeper lights are silent. You may rest, or follow their roads from Lantern Confluence. No heart must be surrendered.';
export const resolution = 'Mira opens the Far Lantern. Sen rings the river bell, Oren brings living branches, and Ida names every missing keeper. Six lights join the three hearts without consuming them. Across river, ash, wind, ice, forest and sea, windows open to a dawn that belongs to everyone. The roads remain yours to explore.';
export function regionalConsequence(land,progress={}) {
 const r=regionalStories.find(r=>r.id===land); if(!r)return null;
 const index=regionalStories.indexOf(r)-1;
 return index>=0&&(progress.seals||[]).includes(seals[index])?r.consequence:r.problem;
}
export const durationEvidence = {measuredPlaySessions:[],completionEstimateHours:null,basis:'No timed human play session has been performed. Scene count and deterministic traversal do not establish completion duration.'};
