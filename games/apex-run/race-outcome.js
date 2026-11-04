import {resolveTrack} from "./track-catalog.js?v=0.5.0-alpha105-skyline";

export function createRunId(cryptoObject=globalThis.crypto){const uuid=cryptoObject?.randomUUID?.();if(typeof uuid==="string")return`race:${uuid}`;const bytes=new Uint32Array(4);cryptoObject?.getRandomValues?.(bytes);if(bytes.some(Boolean))return`race:${[...bytes].map(value=>value.toString(16).padStart(8,"0")).join("")}`;throw new Error("Secure run ID generation is unavailable")}
export function raceOutcomeFromFinish({race,trackId,splits,runId,testMode=false,isolatedTest=false}){
  const track=resolveTrack(trackId);if((testMode&&!isolatedTest)||track.id!==trackId||race?.state!=="finished"||race.eligible!==true||race.checkpoint!==track.checkpointCount||!Array.isArray(splits)||splits.length!==track.checkpointCount)return null;
  return{schema:1,source:"apex-run-race",runId,trackId,time:race.time,finished:true,eligible:true,practice:false,debug:false,recoveryCount:0,checkpointCount:track.checkpointCount,checkpointTimes:[...splits]};
}
