export const FIXED_DT=1/120;
export const REPLAY_VERSION=2;
export const REPLAY_KEY="apex-run:replay:v2";
export const REPLAY_HZ=30;
export const MEDALS=Object.freeze([{name:"APEX",time:12,color:0x55efff},{name:"GOLD",time:14,color:0xffd454},{name:"SILVER",time:17,color:0xd6e2ec},{name:"BRONZE",time:22,color:0xd58b55}]);
export function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
export function formatTime(seconds){
  const safe=Math.max(0,Number.isFinite(seconds)?seconds:0),minutes=Math.floor(safe/60),rest=safe-minutes*60;
  return `${String(minutes).padStart(2,"0")}:${rest.toFixed(3).padStart(6,"0")}`;
}
export function readBest(storage,key="apex-run:pb:v1"){
  try{const value=Number(storage.getItem(key));return Number.isFinite(value)&&value>1&&value<3600?value:null}catch{return null}
}
export function reconcileBest(best,replay){return replay&&(!best||replay.time<best)?replay.time:best}
export function saveBest(storage,time,key="apex-run:pb:v1"){if(!Number.isFinite(time)||time<=1||time>=3600)return false;try{storage.setItem(key,String(time));return true}catch{return false}}
function finiteArray(value,length){return Array.isArray(value)&&value.length===length&&value.every(Number.isFinite)}
export function validateReplay(value){
  if(!value||value.version!==REPLAY_VERSION||!Number.isFinite(value.time)||value.time<=1||value.time>300||value.hz!==REPLAY_HZ||!Array.isArray(value.frames)||value.frames.length<2||value.frames.length>REPLAY_HZ*300)return null;
  let previous=-1;
  for(const frame of value.frames){if(!finiteArray(frame,8)||!Number.isInteger(frame[0])||frame[0]<=previous||frame[0]>REPLAY_HZ*300||Math.abs(frame[1])>300||frame[2]<-20||frame[2]>100||Math.abs(frame[3])>300||frame.slice(4).some(v=>Math.abs(v)>1.001))return null;previous=frame[0]}
  return value;
}
export function readReplay(storage,key=REPLAY_KEY){try{return validateReplay(JSON.parse(storage.getItem(key)))}catch{return null}}
export function saveReplay(storage,time,frames,key=REPLAY_KEY){const replay=validateReplay({version:REPLAY_VERSION,time,hz:REPLAY_HZ,frames});if(!replay)return false;try{storage.setItem(key,JSON.stringify(replay));return true}catch{return false}}
export function replayFrameAt(replay,seconds){
  if(!replay)return null;const tick=Math.max(0,seconds*replay.hz),frames=replay.frames;let lo=0,hi=frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(frames[mid][0]<=tick)lo=mid;else hi=mid-1}
  const a=frames[lo],b=frames[Math.min(lo+1,frames.length-1)],span=Math.max(1,b[0]-a[0]),t=clamp((tick-a[0])/span,0,1),out=new Array(8);out[0]=tick;for(let i=1;i<8;i++)out[i]=a[i]+(b[i]-a[i])*t;return out;
}
export function medalFor(seconds){return MEDALS.find(m=>seconds<=m.time)||null}
export function isOnRoad(position){const{x,z}=position;return(x>=-11&&x<=108&&Math.abs(z)<=14)||(x>=81&&x<=121&&z>=-103&&z<=4)||(x>=-91&&x<=121&&z>=-121&&z<=-84)}
export function checkpointAdvance(current,position){
  const zones=[{x:99,z:-12,hx:18,hz:18},{x:101,z:-103,hx:18,hz:12},{x:-18,z:-105,hx:14,hz:16},{x:-82,z:-105,hx:10,hz:16}];
  const zone=zones[current];if(!zone)return current;
  return Math.abs(position.x-zone.x)<=zone.hx&&Math.abs(position.z-zone.z)<=zone.hz?current+1:current;
}
export class FixedStepper{
  constructor(step,dt=FIXED_DT){this.step=step;this.dt=dt;this.accumulator=0}
  advance(elapsed){let remaining=Math.min(.15,Math.max(0,elapsed)),count=0;while(remaining>0){const chunk=Math.min(remaining,1/60);this.accumulator+=chunk;while(this.accumulator+1e-12>=this.dt){this.step(this.dt);this.accumulator-=this.dt;count++}remaining-=chunk}return{count,alpha:this.accumulator/this.dt}}
  reset(){this.accumulator=0}
}
