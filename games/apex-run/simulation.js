export const FIXED_DT=1/120;
export {checkpointAdvance,isOnRoad} from "./track-model.js?v=0.5.0-alpha146-route-preview";
import {activeTrack,requestedTrackId,trackStorageKeys} from "./track-catalog.js?v=0.5.0-alpha105-skyline";
export const REPLAY_VERSION=activeTrack().replayVersion;
const REPLAY_BOUNDS=activeTrack().replayBounds;
const REPLAY_MAX_SECONDS=activeTrack().replayMaxSeconds;
export function requestedTestStorageScope(search=globalThis.location?.search||"",root=globalThis.document?.documentElement){if(root?.dataset?.apexTest!=="1")return null;try{const value=new URLSearchParams(search).get("testStorage");return typeof value==="string"&&/^[a-z0-9-]{8,80}$/.test(value)?value:null}catch{return null}}
const trackId=requestedTrackId(),productionKeys=trackStorageKeys(trackId),testScope=requestedTestStorageScope();
export const BEST_KEY=testScope?`apex-run:test:${trackId}:${testScope}:pb`:productionKeys.pb;
export const REPLAY_KEY=testScope?`apex-run:test:${trackId}:${testScope}:replay`:productionKeys.replay;
export const REPLAY_HZ=activeTrack().replayHz;
export const MEDALS=activeTrack().medals;
export function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
export function frameGapInvalidates(elapsed){return Number.isFinite(elapsed)&&elapsed>.25}
// A failed loop can keep sliding upside-down on the exit ribbon at jogging
// speed. Recover that clearly stranded state without touching a moving car at
// the crown or any normally upright jump/landing.
export function advanceInvertedStallTime(elapsed,rotation,speed,dt){const upY=1-2*(rotation.x*rotation.x+rotation.z*rotation.z);return upY<-.35&&speed<6?elapsed+dt:0}
export function formatTime(seconds){
  const totalMs=Math.round(Math.max(0,Number.isFinite(seconds)?seconds:0)*1000),minutes=Math.floor(totalMs/60000),rest=totalMs-minutes*60000;
  return `${String(minutes).padStart(2,"0")}:${String(Math.floor(rest/1000)).padStart(2,"0")}.${String(rest%1000).padStart(3,"0")}`;
}
export function readBest(storage,key=BEST_KEY){
  try{const value=Number(storage.getItem(key));return Number.isFinite(value)&&value>1&&value<3600?value:null}catch{return null}
}
export function reconcileBest(best,replay){return replay&&(!best||replay.time<best)?replay.time:best}
export function replayForBest(best,replay){return replay&&Number.isFinite(best)&&Math.abs(replay.time-best)<1e-6?replay:null}
export function saveBest(storage,time,key=BEST_KEY){if(!Number.isFinite(time)||time<=1||time>=3600)return false;try{storage.setItem(key,String(time));return true}catch{return false}}
function finiteArray(value,length){return Array.isArray(value)&&value.length===length&&value.every(Number.isFinite)}
export function validateReplay(value){
  if(!value||value.version!==REPLAY_VERSION||!Number.isFinite(value.time)||value.time<=1||value.time>REPLAY_MAX_SECONDS||value.hz!==REPLAY_HZ||!Array.isArray(value.frames)||value.frames.length<2||value.frames.length>REPLAY_HZ*REPLAY_MAX_SECONDS)return null;
  let previous=-1;
  for(const frame of value.frames){if(!finiteArray(frame,8))return null;const norm=Math.hypot(...frame.slice(4));if(!Number.isInteger(frame[0])||frame[0]<=previous||frame[0]>REPLAY_HZ*REPLAY_MAX_SECONDS||Math.abs(frame[1])>REPLAY_BOUNDS||frame[2]<-20||frame[2]>100||Math.abs(frame[3])>REPLAY_BOUNDS||frame.slice(4).some(v=>Math.abs(v)>1.001)||norm<.9||norm>1.1)return null;previous=frame[0]}
  if(value.frames[0][0]!==0||Math.abs(value.frames.at(-1)[0]-Math.round(value.time*value.hz))>2)return null;
  return value;
}
export function readReplay(storage,key=REPLAY_KEY){try{return validateReplay(JSON.parse(storage.getItem(key)))}catch{return null}}
export function saveReplay(storage,time,frames,key=REPLAY_KEY){const replay=validateReplay({version:REPLAY_VERSION,time,hz:REPLAY_HZ,frames});if(!replay)return false;try{storage.setItem(key,JSON.stringify(replay));return true}catch{return false}}
export function commitResult(storage,currentBest,time,frames,{eligible=true,keys={pb:BEST_KEY,replay:REPLAY_KEY}}={}){
  if(!eligible)return{best:currentBest,replay:readReplay(storage,keys.replay),isBest:false,eligible:false,replaySaved:false,bestSaved:false};
  const isBest=!currentBest||time<currentBest;if(!isBest)return{best:currentBest,replay:readReplay(storage,keys.replay),isBest:false,replaySaved:false};
  const bestSaved=saveBest(storage,time,keys.pb),replaySaved=saveReplay(storage,time,frames,keys.replay),replay=replaySaved?readReplay(storage,keys.replay):null;
  return{best:time,replay,isBest:true,bestSaved,replaySaved,ghostUnavailable:bestSaved&&!replaySaved,storageUnavailable:!bestSaved&&!replaySaved};
}
export function persistenceNote(result){if(result?.storageUnavailable)return" · RESULT NOT SAVED; STORAGE UNAVAILABLE";return result?.ghostUnavailable?" · PB SAVED; GHOST UNAVAILABLE":""}
export function replayFrameAt(replay,seconds){
  if(!replay)return null;const tick=Math.max(0,seconds*replay.hz),frames=replay.frames;let lo=0,hi=frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(frames[mid][0]<=tick)lo=mid;else hi=mid-1}
  const a=frames[lo],b=frames[Math.min(lo+1,frames.length-1)],span=Math.max(1,b[0]-a[0]),t=clamp((tick-a[0])/span,0,1),out=new Array(8);out[0]=tick;for(let i=1;i<8;i++)out[i]=a[i]+(b[i]-a[i])*t;return out;
}
export function medalFor(seconds){return MEDALS.find(m=>seconds<=m.time)||null}
export class FixedStepper{
  constructor(step,dt=FIXED_DT){this.step=step;this.dt=dt;this.accumulator=0}
  advance(elapsed){let remaining=Math.min(.15,Math.max(0,elapsed)),count=0;while(remaining>0){const chunk=Math.min(remaining,1/60);this.accumulator+=chunk;while(this.accumulator+1e-12>=this.dt){this.step(this.dt);this.accumulator-=this.dt;count++}remaining-=chunk}return{count,alpha:this.accumulator/this.dt}}
  reset(){this.accumulator=0}
}
