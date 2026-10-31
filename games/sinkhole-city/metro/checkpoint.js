import {DistrictRun} from './simulation.js?v=release48';
import {ALL_CONTRACTS} from './worlds.js?v=release48';
import {worldUnlocked,unlocked} from './career.js?v=release48';
import {createBody} from './rim.js?v=contact15';

export const CHECKPOINT_KEY='sinkhole.metro.run.v1';
const RULES='expedition-48',MAX_BYTES=1000000;
const FIELDS=['x','z','yaw','phase','fall','owner','rockAngle','rockVelocity','rockTarget','rockDirection','intakeVelocity','traffic','walker','swim','orbital','water','intake','swimY','swimPitch','swimRoll','orbitY','orbitPitch','discharged','dischargedAt','charged','openedAt','captureAt','captureX','captureZ'];
const BODY=['x','y','z','v','w','q','rest','age','impactUntil','committed','intake','ceiling'];
const RUN=['time','score','eaten','combo','comboTime','streak','peakStreak','relays','scaleStage','scaleZoom','scaleProgress','infinityCollapse'];
const PHASES=new Set(['idle','sealed','buried','contact','falling','diving','consumed']);
const finite=(n,min=-1e30,max=1e30)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
function safe(value,depth=0){
 if(depth>9)throw Error('Checkpoint nesting');
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='number'){if(!finite(value))throw Error('Checkpoint number');return value;}
 if(typeof value==='string'){if(value.length>120)throw Error('Checkpoint string');return value;}
 if(Array.isArray(value)){if(value.length>128)throw Error('Checkpoint array');return value.map(v=>safe(v,depth+1));}
 if(typeof value!=='object'||Object.keys(value).length>90)throw Error('Checkpoint object');
 const out={};for(const [key,v]of Object.entries(value)){if(v===undefined)continue;if(['__proto__','prototype','constructor'].includes(key))throw Error('Checkpoint key');out[key]=safe(v,depth+1);}return out;
}
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!==undefined).map(k=>[k,safe(o[k])]));
function matches(base,value){
 if(base===null)return value===null;
 if(typeof base!=='object')return typeof value===typeof base;
 if(!value||typeof value!=='object'||Array.isArray(base)!==Array.isArray(value))return false;
 return Object.entries(base).every(([k,v])=>v===undefined||Object.hasOwn(value,k)&&matches(v,value[k]));
}
export function makeCheckpoint(run){
 if(run.arena||run.done)return null;
 const data={version:1,rules:RULES,world:run.world,seed:run.seed,free:run.free,contract:run.contract?{id:run.contract.id,rules:run.contract.rulesVersion}:null,state:pick(run,RUN),player:safe(run.player),counts:safe(run.counts),objects:run.objects.map(o=>({id:o.id,type:o.type,state:pick(o,FIELDS),body:o.body?pick(o.body,BODY):null})),schools:[...run.schools].map(([id,s])=>[id,safe(s)])};
 if(JSON.stringify(data).length>MAX_BYTES)throw Error('Checkpoint too large');return data;
}
// Recreate static geography/actor references from the seed. Never deserialize
// prototypes, renderer geometry, contact-point clouds, assets or event queues.
export function restoreCheckpoint(raw,career){
 try{
  if(!raw||JSON.stringify(raw).length>MAX_BYTES||raw.version!==1||raw.rules!==RULES||!worldUnlocked(career,raw.world)||!Number.isInteger(raw.seed)||raw.seed<0||raw.seed>0xffffffff||typeof raw.free!=='boolean')return null;
  const index=raw.contract?ALL_CONTRACTS.findIndex(c=>c.id===raw.contract.id):-1,contract=index>=0?ALL_CONTRACTS[index]:null;
  if(raw.contract&&(!contract||contract.world!==raw.world||contract.rulesVersion!==raw.contract.rules||!unlocked(career,index))||!raw.free&&!contract)return null;
  const run=new DistrictRun({world:raw.world,contract,free:raw.free,seed:raw.seed}),state=safe(raw.state);
  if(Object.keys(state).some(k=>!RUN.includes(k))||!finite(state.time,0,172800)||!raw.free&&state.time>=run.duration||!Number.isSafeInteger(state.score)||state.score<0||!Number.isInteger(state.eaten)||!Array.isArray(raw.objects)||raw.objects.length!==run.total)return null;
  if(!['combo','comboTime','streak','peakStreak'].every(k=>finite(state[k],0,10000))||!Number.isInteger(state.scaleStage)||state.scaleStage<0||state.scaleStage>17||raw.world==='ascension'&&(!finite(state.scaleZoom,1,1e15)||!finite(state.scaleProgress,0,18)))return null;
  const p=safe(raw.player),limit=raw.world==='ascension'?1e15:100;
  if(Object.keys(p).sort().join()!=='area,radius,vx,vz,x,z'||!finite(p.x,-limit,limit)||!finite(p.z,-limit,limit)||!finite(p.radius,.1,limit)||!finite(p.area,.01,limit*limit)||!finite(p.vx,-limit,limit)||!finite(p.vz,-limit,limit))return null;
  const counts=safe(raw.counts);if(Object.keys(counts).sort().join()!==Object.keys(run.counts).sort().join()||Object.values(counts).some(n=>!Number.isInteger(n)||n<0||n>run.total))return null;
  for(let i=0;i<run.total;i++){
   const entry=raw.objects[i],o=run.objects[i],s=safe(entry.state);
   if(entry.id!==o.id||entry.type!==o.type||Object.keys(s).some(k=>!FIELDS.includes(k))||!PHASES.has(s.phase)||!finite(s.x,-limit*10,limit*10)||!finite(s.z,-limit*10,limit*10)||!finite(s.yaw))return null;
   for(const key of['traffic','walker','swim','orbital'])if(Boolean(s[key])!==Boolean(o[key])||o[key]&&!matches(o[key],s[key]))return null;
   if(s.water&&!['x','z','radius','age','vy','vx','vz'].every(k=>finite(s.water[k])))return null;
   if(s.intake&&typeof s.intake==='object'&&!['x','z','vx','vz','vy','age'].every(k=>finite(s.intake[k])))return null;
   Object.assign(o,s);
   if(entry.body){const b=safe(entry.body);if(Object.keys(b).some(k=>!BODY.includes(k))||!finite(b.x,-limit*10,limit*10)||!finite(b.y,-100,100)||!finite(b.z,-limit*10,limit*10)||!b.v||!b.w||!b.q||!finite(Math.hypot(b.q.x,b.q.y,b.q.z,b.q.w),.99,1.01)||!['v','w'].every(k=>['x','y','z'].every(a=>finite(b[k][a]))))return null;o.body=Object.assign(createBody(o),b);}
   else if(['contact','falling'].includes(o.phase))return null;
  }
  if(run.objects.filter(o=>o.phase==='consumed').length!==state.eaten||state.eaten>=run.total)return null;
  if(!Array.isArray(raw.schools)||raw.schools.length!==run.schools.size||new Set(raw.schools.map(s=>s[0])).size!==run.schools.size)return null;
  for(const [id,s]of raw.schools){if(!run.schools.has(id)||!matches(run.schools.get(id),s))return null;run.schools.set(id,safe(s));}
  Object.assign(run,state,{counts,events:[],nearby:null});Object.assign(run.player,p);
  if(run.infinityCollapse){const c=run.infinityCollapse;if(run.world!=='ascension'||!finite(c.at,0,run.time)||!finite(c.reach,run.player.radius,1e15)||!finite(c.radius,.1,c.reach)||!finite(c.x,-limit,limit)||!finite(c.z,-limit,limit)||run.objects.some(o=>o.phase!=='consumed'&&(o.phase!=='diving'||!finite(o.captureX)||!finite(o.captureZ))))return null;}
  return run;
 }catch{return null;}
}
// The renderer supplies model-derived contacts during loading. Bind the saved
// body's pose to that exact geometry, not a generic pre-load contact box.
export function bindCheckpointBodies(run){
 for(const o of run.objects)if(o.body)o.body=Object.assign(createBody(o),pick(o.body,BODY));
 run.nearby=null;
}
