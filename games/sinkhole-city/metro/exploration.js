import {worldFor} from './worlds.js?v=release48';
import {SCALE_NAMES,SCALE_COUNT,journeyFraction} from './ascension.js?v=release48';

const NAMES={person:'Pedestrian',cone:'Traffic cone',bin:'Bin',hydrant:'Fire hydrant',bench:'Bench',lamp:'Street light',tree:'Tree',car:'Car',van:'Van',crate:'Crate',cart:'Market cart',building:'Building',warehouse:'Warehouse',cooler:'Cooler',log:'Log',firepit:'Fire pit',picnic:'Picnic table',pine:'Pine',tent:'Tent',rv:'Camper',cabin:'Cabin',shell:'Shell',amphora:'Amphora',seafan:'Sea fan',kelp:'Kelp',coral:'Coral',reef:'Reef',salvage:'Lost cargo',wreck:'Shipwreck',treasure:'Gold cache',fish:'Fish',ray:'Ray',turtle:'Sea turtle',jellyfish:'Jellyfish',shark:'Shark',dolphin:'Dolphin',whale:'Whale',shard:'Crystal shard',spore:'Spore plant',resonator:'Grove relay',pod:'Energy pod',crystal:'Crystal',monolith:'Monolith',debris:'Orbital debris',satellite:'Satellite',probe:'Probe',shuttle:'Shuttle',planet:'Planet',landmark:'Landmark'};
const PARK_NAMES={fence:'Park railing',gate:'Park gate',fountain:'Fountain',quantum:'Cosmic matter'};
export const catchName=(type,world)=>type==='landmark'?worldFor(world).landmark:PARK_NAMES[type]||NAMES[type]||'—';
export const validCatch=type=>Object.hasOwn(NAMES,type)||Object.hasOwn(PARK_NAMES,type);
export function summarizeRun(run){
 const total=Math.max(1,run.total||0),eaten=Math.max(0,Math.min(total,run.eaten||0)),infinity=run.world==='ascension',full=infinity?Boolean(run.infinityComplete):eaten===total;
 const size=o=>o.type==='quantum'?(o.modelRadius||Math.min(2.6,o.radius))+(o.scaleStage??0)*16/(SCALE_COUNT-1):o.radius;
 let largest=null;for(const o of run.objects||[])if(o.phase==='consumed'&&(!largest||size(o)>size(largest)||size(o)===size(largest)&&o.score>largest.score))largest=o;
 const progress=infinity?journeyFraction(run):eaten/total;
 return {eaten,total,remaining:total-eaten,coverage:full?10000:Math.floor(progress*10000),percent:full?100:Math.floor(progress*100),full,chain:Math.max(0,run.peakStreak||0),largest:largest?.type||null,largestRadius:largest?size(largest):0,largestName:SCALE_NAMES[largest?.scaleKind]||catchName(largest?.type,run.world)};
}

export function normalizeExploration(raw,worlds){
 const out={};
 for(const world of worlds){
  const r=raw?.[world];if(!r||r.rulesVersion!==1||!Number.isInteger(r.coverage)||r.coverage<0||r.coverage>10000||!Number.isSafeInteger(r.chain)||r.chain<0||r.chain>10000)continue;
  if(r.largest!==null&&!validCatch(r.largest))continue;
  if(!Number.isFinite(r.largestRadius)||r.largestRadius<0||r.largestRadius>20)continue;
  if(r.clearTime!==null&&(!Number.isFinite(r.clearTime)||r.clearTime<=0||r.coverage!==10000))continue;
  out[world]={rulesVersion:1,coverage:r.coverage,chain:r.chain,largest:r.largest,largestRadius:r.largestRadius,clearTime:r.clearTime};
 }
 return out;
}
export function explorationBest(old,run){
 const s=summarizeRun(run);if(!s.eaten)return old||null;
 const larger=s.largestRadius>(old?.largestRadius||0),clearTime=s.full&&run.time>0?Math.min(run.time,old?.clearTime||Infinity):old?.clearTime||null;
 return {rulesVersion:1,coverage:Math.max(s.coverage,old?.coverage||0),chain:Math.max(s.chain,old?.chain||0),largest:larger?s.largest:old?.largest||s.largest,largestRadius:Math.max(s.largestRadius,old?.largestRadius||0),clearTime};
}
