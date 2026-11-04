const validTime=value=>Number.isFinite(value)&&value>1&&value<3600;

export function shortTime(seconds){
  if(!validTime(seconds))return "--:--.---";
  const milliseconds=Math.round(seconds*1000),minutes=Math.floor(milliseconds/60000),remainder=milliseconds-minutes*60000;
  return `${String(minutes).padStart(2,"0")}:${String(Math.floor(remainder/1000)).padStart(2,"0")}.${String(remainder%1000).padStart(3,"0")}`;
}

export function medalState(track,time){
  const medals=track?.medals||[],earned=validTime(time)?medals.find(medal=>time<=medal.time)||null:null,index=earned?medals.indexOf(earned):-1;
  const next=!validTime(time)?medals.at(-1)||null:earned?(index>0?medals[index-1]:null):medals.at(-1)||null;
  return{earned,next};
}

export function raceBriefing({track,best=null,replay=null,carName="Apex Formula"}){
  const {earned,next}=medalState(track,best),pb=validTime(best)?shortTime(best):"NO PB";
  return{
    difficulty:track?.difficulty||"UNRATED",
    checkpoints:Number.isInteger(track?.checkpointCount)&&track.checkpointCount>0?`${track.checkpointCount-1} + FINISH`:"—",
    pb,
    medal:earned?.name||"NONE",
    target:next?`${next.name} ≤ ${shortTime(next.time)}`:earned?"APEX SECURED":"NO TARGET",
    provisional:track?.medalsProvisional===true,
    car:carName,
    ghost:replay?"GHOST READY":"NO GHOST",
  };
}

export function resultNextStep({track,time,best=null,practice=false,eligible=true,result=null}){
  if(practice)return"Practice complete. Sector times stay in this session; start a clean race to save progress.";
  if(!eligible)return"Recovery used. This time did not change your PB, medals, ghost, or achievements.";
  if(result?.storageUnavailable)return"Storage unavailable. This result and ghost were not saved.";
  if(result?.isBest&&result?.replaySaved)return"PB and ghost saved. Race again to chase your new ghost.";
  if(result?.isBest&&result?.bestSaved)return"PB saved, but a matching ghost could not be saved.";
  const {next}=medalState(track,best??time);
  return next?`Next target: ${next.name} in ${shortTime(next.time)} or faster.`:"Apex target secured. Race again to improve your PB.";
}
