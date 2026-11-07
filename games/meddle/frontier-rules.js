export const FRONTIER_SIZE=52;
export const FRONTIER_FACTIONS=Object.freeze([
  Object.freeze({id:"player",name:"Your people",color:"#59ddd2",human:true}),
  Object.freeze({id:"veyra",name:"Veyra",color:"#ed716b"}),
  Object.freeze({id:"orun",name:"Orun",color:"#d9a85b"})
]);
export const FRONTIER_COSTS=Object.freeze({farm:{wood:28,stone:0},home:{wood:36,stone:8},2:{wood:24,stone:14},3:{wood:42,stone:34},4:{wood:70,stone:86},armageddon:{food:600,wood:520,stone:480}});
export const DEFAULT_PRIORITIES=Object.freeze({food:35,wood:30,stone:20,build:15});

export function normalizedPriorities(value={}){
  const entries=["food","wood","stone","build"].map(key=>[key,Math.max(0,Number(value[key])||0)]),sum=entries.reduce((n,[,v])=>n+v,0)||1;
  return Object.fromEntries(entries.map(([key,v])=>[key,v/sum]));
}
export function factionStarts(size=FRONTIER_SIZE){
  const m=7;return[{x:m,y:m},{x:size-m,y:m+2},{x:Math.round(size/2),y:size-m}];
}
export function startFairness(starts,nodes,radius=9){
  return starts.map(start=>({forest:nodes.filter(n=>n.type==="forest"&&Math.hypot(n.x-start.x,n.y-start.y)<=radius).length,mine:nodes.filter(n=>n.type==="mine"&&Math.hypot(n.x-start.x,n.y-start.y)<=radius).length}));
}
export function canUpgrade(level,resources){const cost=FRONTIER_COSTS[level+1];if(!cost)return{ok:false,missing:"maximum stage"};for(const key of ["wood","stone"]){const need=cost[key]||0,have=resources[key]||0;if(have<need)return{ok:false,missing:`${need-have} ${key}`};}return{ok:true,cost};}
export function spendUpgrade(level,resources){const verdict=canUpgrade(level,resources);if(!verdict.ok)return{...verdict,resources:{...resources}};return{ok:true,resources:{...resources,wood:resources.wood-(verdict.cost.wood||0),stone:resources.stone-(verdict.cost.stone||0)}};}
export function assignJobs(count,priorities){const p=normalizedPriorities(priorities),keys=["food","wood","stone","build"],out={food:0,wood:0,stone:0,build:0};for(let i=0;i<count;i++){let best=keys[0];for(const key of keys)if(out[key]/Math.max(.001,p[key])<out[best]/Math.max(.001,p[best]))best=key;out[best]++;}return out;}
export function reveal(explored,size,x,y,radius){for(let yy=Math.max(0,Math.floor(y-radius));yy<Math.min(size,Math.ceil(y+radius)+1);yy++)for(let xx=Math.max(0,Math.floor(x-radius));xx<Math.min(size,Math.ceil(x+radius)+1);xx++)if(Math.hypot(xx+.5-x,yy+.5-y)<=radius)explored[yy*size+xx]=1;return explored;}
export function validFrontierSave(v){return !!v&&v.version===1&&v.mode==="frontier"&&Number.isInteger(v.size)&&v.size>=40&&v.size<=72&&Array.isArray(v.factions)&&v.factions.length>=3&&Array.isArray(v.workers)&&Array.isArray(v.nodes)&&Array.isArray(v.structures)&&Array.isArray(v.explored)&&v.explored.length===v.size*v.size;}
