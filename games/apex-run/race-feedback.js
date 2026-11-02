import {checkpointAdvance} from "./track-model.js?v=0.5.0-alpha22";

export function replayCheckpointSplits(replay){
  if(!replay?.frames?.length||!Number.isFinite(replay.hz)||replay.hz<=0)return[];
  const splits=[];let checkpoint=0;
  for(const frame of replay.frames){
    const next=checkpointAdvance(checkpoint,{x:frame[1],y:frame[2],z:frame[3]});
    if(next!==checkpoint){checkpoint=next;splits.push(frame[0]/replay.hz);if(checkpoint>=6)break}
  }
  return splits;
}

export function formatSplitDelta(current,reference){
  if(!Number.isFinite(current)||!Number.isFinite(reference))return "";
  const delta=current-reference,sign=delta<=0?"−":"+";
  return `${sign}${Math.abs(delta).toFixed(3)}`;
}

export function splitTone(delta){
  if(!Number.isFinite(delta))return "neutral";
  return delta<=0?"ahead":"behind";
}

export function summarizeSplits(current,reference){
  const deltas=current.map((time,index)=>Number.isFinite(time)&&Number.isFinite(reference?.[index])?time-reference[index]:null),valid=deltas.map((delta,index)=>({delta,index})).filter(({delta})=>Number.isFinite(delta));
  if(!valid.length)return "Set a clean PB to unlock sector analysis.";
  const best=valid.reduce((a,b)=>b.delta<a.delta?b:a),worst=valid.reduce((a,b)=>b.delta>a.delta?b:a),label=index=>index===current.length-1?"finish":"gate "+(index+1),signed=delta=>`${delta<=0?"gained":"lost"} ${Math.abs(delta).toFixed(3)}s`;
  if(best.index===worst.index)return `${label(best.index)}: ${signed(best.delta)}.`;
  return `Best: ${signed(best.delta)} at ${label(best.index)}. Biggest loss: ${Math.abs(worst.delta).toFixed(3)}s at ${label(worst.index)}.`;
}
