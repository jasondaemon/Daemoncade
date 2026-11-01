export const FIXED_DT=1/120;
export function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
export function formatTime(seconds){
  const safe=Math.max(0,Number.isFinite(seconds)?seconds:0),minutes=Math.floor(safe/60),rest=safe-minutes*60;
  return `${String(minutes).padStart(2,"0")}:${rest.toFixed(3).padStart(6,"0")}`;
}
export function readBest(storage,key="apex-run:pb:v1"){
  const value=Number(storage.getItem(key));return Number.isFinite(value)&&value>1&&value<3600?value:null;
}
export function checkpointAdvance(current,position){
  const zones=[{x:99,z:-12,hx:18,hz:18},{x:101,z:-103,hx:18,hz:12},{x:-18,z:-105,hx:14,hz:16},{x:-82,z:-105,hx:10,hz:16}];
  const zone=zones[current];if(!zone)return current;
  return Math.abs(position.x-zone.x)<=zone.hx&&Math.abs(position.z-zone.z)<=zone.hz?current+1:current;
}
export class FixedStepper{
  constructor(step,dt=FIXED_DT){this.step=step;this.dt=dt;this.accumulator=0}
  advance(elapsed){this.accumulator=Math.min(.15,this.accumulator+Math.max(0,elapsed));let count=0;while(this.accumulator>=this.dt){this.step(this.dt);this.accumulator-=this.dt;count++}return{count,alpha:this.accumulator/this.dt}}
  reset(){this.accumulator=0}
}
