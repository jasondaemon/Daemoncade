export const FRONTIER_FACTIONS=Object.freeze([
  Object.freeze({id:"player",name:"Your people",kind:"human",color:"#59ddd2"}),
  Object.freeze({id:"rival",name:"Veyra",kind:"ai",color:"#ed716b"}),
  Object.freeze({id:"rival2",name:"Orun",kind:"ai",color:"#d9a85b"})
]);

export function createFactionState(definitions=FRONTIER_FACTIONS,initialMana=130){return Object.fromEntries(definitions.map(def=>[def.id,{id:def.id,mana:initialMana,resources:{food:150,wood:95,stone:55},priorities:{food:35,wood:30,stone:20,build:15},intent:"surveying",nextAct:5}]))}
export function activeFactionIds(state){return Object.keys(state)}
export function addFactionIncome(state,id,{mana=0,food=0,wood=0,stone=0}={}){const current=state[id];if(!current)return false;current.mana=Math.min(999,Math.max(0,current.mana+mana));for(const [key,value] of Object.entries({food,wood,stone}))current.resources[key]=Math.max(0,current.resources[key]+value);return true}
export function spendFactionResources(state,id,cost={}){const current=state[id];if(!current)return{ok:false,missing:"faction"};for(const key of ["mana","food","wood","stone"]){const have=key==="mana"?current.mana:current.resources[key],need=Number(cost[key])||0;if(have<need)return{ok:false,missing:key,amount:need-have};}for(const key of ["mana","food","wood","stone"]){const need=Number(cost[key])||0;if(key==="mana")current.mana-=need;else current.resources[key]-=need;}return{ok:true};}
export function chooseHostileFaction(state,self,populations,recentHostility={}){return activeFactionIds(state).filter(id=>id!==self&&(populations[id]||0)>0).sort((a,b)=>(recentHostility[b]||0)-(recentHostility[a]||0)||(populations[a]||0)-(populations[b]||0)||a.localeCompare(b))[0]||null}
export function factionOutcome(populations,playerId="player",graceElapsed=true){if(!graceElapsed)return null;if((populations[playerId]||0)<=0)return false;return Object.entries(populations).every(([id,count])=>id===playerId||count<=0)?true:null}
export function chooseReckoningLoss(populations,roll){const living=Object.entries(populations).filter(([,count])=>count>0);if(living.length<2)return null;const total=living.reduce((sum,[,count])=>sum+count,0),ticket=roll*total;let cursor=0;for(const [id,count] of living){cursor+=total-count;if(ticket<cursor)return id;}return living[living.length-1][0];}
export function validFactionState(state,definitions=FRONTIER_FACTIONS){if(!state||typeof state!=="object")return false;return definitions.every(def=>{const item=state[def.id];return item&&item.id===def.id&&Number.isFinite(item.mana)&&item.mana>=0&&["food","wood","stone"].every(key=>Number.isFinite(item.resources?.[key])&&item.resources[key]>=0);});}
