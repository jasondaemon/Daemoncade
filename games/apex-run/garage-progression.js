import {ACHIEVEMENTS,DEFAULT_CAR_ID,DEFAULT_COSMETIC_ID,achievementById,carById,carUnlocked,cosmeticById,cosmeticUnlocked,resolveSelection} from "./car-catalog.js";
import {resolveTrack} from "./track-catalog.js";

export const GARAGE_KEY="apex-run:garage:v1";
export const GARAGE_VERSION=1;
const RUN_ID=/^[a-zA-Z0-9][a-zA-Z0-9:_-]{7,95}$/;
const isoNow=now=>new Date(now).toISOString();

export function createGarageState(){return{version:GARAGE_VERSION,selection:{carId:DEFAULT_CAR_ID,cosmeticId:DEFAULT_COSMETIC_ID},achievements:{},stats:{cleanFinishes:0,cleanStreak:0,tracks:{},medals:{APEX:0,GOLD:0,SILVER:0,BRONZE:0,ROOKIE:0}},recentRunIds:[]}}
const finiteTime=value=>Number.isFinite(value)&&value>1&&value<3600;
function plainObject(value){return value&&typeof value==="object"&&!Array.isArray(value)}
function sanitizeAchievement(value){return plainObject(value)&&typeof value.unlockedAt==="string"?{unlockedAt:value.unlockedAt}:null}
function sanitizeState(value){
  const state=createGarageState();if(!plainObject(value)||value.version!==GARAGE_VERSION)return state;
  if(plainObject(value.selection)){if(typeof value.selection.carId==="string")state.selection.carId=value.selection.carId;if(typeof value.selection.cosmeticId==="string")state.selection.cosmeticId=value.selection.cosmeticId}
  if(plainObject(value.achievements))for(const achievement of ACHIEVEMENTS){const safe=sanitizeAchievement(value.achievements[achievement.id]);if(safe)state.achievements[achievement.id]=safe}
  const stats=value.stats;if(plainObject(stats)){state.stats.cleanFinishes=Math.max(0,Math.min(1e6,Math.trunc(Number(stats.cleanFinishes)||0)));state.stats.cleanStreak=Math.max(0,Math.min(1e4,Math.trunc(Number(stats.cleanStreak)||0)));if(plainObject(stats.tracks))for(const[id,track]of Object.entries(stats.tracks)){if(!/^[a-z0-9-]{1,80}$/.test(id)||!plainObject(track))continue;const finishes=Math.max(0,Math.min(1e6,Math.trunc(Number(track.cleanFinishes)||0))),best=finiteTime(Number(track.best))?Number(track.best):null;state.stats.tracks[id]={cleanFinishes:finishes,best}}if(plainObject(stats.medals))for(const name of Object.keys(state.stats.medals))state.stats.medals[name]=Math.max(0,Math.min(1e6,Math.trunc(Number(stats.medals[name])||0)))}
  if(Array.isArray(value.recentRunIds))state.recentRunIds=value.recentRunIds.filter(id=>typeof id==="string"&&RUN_ID.test(id)).slice(-50);
  const resolved=resolveSelection(state);state.selection={carId:resolved.car.id,cosmeticId:resolved.cosmetic.id};return state;
}

export function readGarage(storage){try{return sanitizeState(JSON.parse(storage.getItem(GARAGE_KEY)))}catch{return createGarageState()}}
export function saveGarage(storage,state){try{storage.setItem(GARAGE_KEY,JSON.stringify(sanitizeState(state)));return true}catch{return false}}
export function migrateGarage(storage){
  const state=readGarage(storage);if(state.stats.cleanFinishes||Object.keys(state.achievements).length)return{state,migrated:false,saved:true};
  let carId,cosmeticId;try{carId=storage.getItem("apex-run:selected-car:v1");cosmeticId=storage.getItem("apex-run:selected-livery:v1")}catch{}
  if(typeof carId!=="string"&&typeof cosmeticId!=="string")return{state,migrated:false,saved:true};state.selection={carId,cosmeticId};const resolved=resolveSelection(state);state.selection={carId:resolved.car.id,cosmeticId:resolved.cosmetic.id};return{state,migrated:true,saved:saveGarage(storage,state)};
}

export function validateRaceOutcome(value){
  if(!plainObject(value)||value.schema!==1||value.source!=="apex-run-race"||value.debug===true||value.finished!==true||value.eligible!==true||value.practice===true||value.recoveryCount!==0||!RUN_ID.test(value.runId)||!finiteTime(value.time))return null;
  const track=resolveTrack(value.trackId);if(track.id!==value.trackId||!Number.isInteger(value.checkpointCount)||value.checkpointCount!==track.checkpointCount||!Array.isArray(value.checkpointTimes)||value.checkpointTimes.length!==track.checkpointCount)return null;
  let previous=0;for(const split of value.checkpointTimes){if(!finiteTime(split)||split<=previous||split>value.time+.001)return null;previous=split}if(Math.abs(previous-value.time)>.05)return null;
  const medal=track.medals.find(item=>value.time<=item.time)?.name||null;return{runId:value.runId,trackId:track.id,time:value.time,medal};
}

function unlock(state,id,now,unlocked){if(state.achievements[id]?.unlockedAt)return;state.achievements[id]={unlockedAt:isoNow(now)};unlocked.push(id)}
export function recordRaceOutcome(current,value,{now=Date.now()}={}){
  const state=sanitizeState(current),outcome=validateRaceOutcome(value);if(!outcome)return{state,accepted:false,duplicate:false,unlocked:[]};if(state.recentRunIds.includes(outcome.runId))return{state,accepted:false,duplicate:true,unlocked:[]};
  state.recentRunIds=[...state.recentRunIds,outcome.runId].slice(-50);state.stats.cleanFinishes++;state.stats.cleanStreak++;const track=state.stats.tracks[outcome.trackId]||{cleanFinishes:0,best:null};track.cleanFinishes++;track.best=track.best==null?outcome.time:Math.min(track.best,outcome.time);state.stats.tracks[outcome.trackId]=track;if(outcome.medal)state.stats.medals[outcome.medal]++;
  const unlocked=[];unlock(state,"first-clean-finish",now,unlocked);if(Object.values(state.stats.tracks).filter(item=>item.cleanFinishes>0).length>=2)unlock(state,"two-track-finisher",now,unlocked);if(state.stats.cleanStreak>=3)unlock(state,"three-clean-streak",now,unlocked);if(state.stats.medals.APEX>0)unlock(state,"apex-medal",now,unlocked);return{state,accepted:true,duplicate:false,unlocked,outcome};
}
export function recordInvalidatedRun(current){const state=sanitizeState(current);state.stats.cleanStreak=0;return state}
export function selectGarageItem(current,{carId,cosmeticId}){const state=sanitizeState(current),car=carById(carId);if(!car||!carUnlocked(state,car))return{state,selected:false,reason:"car-locked"};const cosmetic=cosmeticById(car,cosmeticId);if(!cosmetic||!cosmeticUnlocked(state,cosmetic))return{state,selected:false,reason:"cosmetic-locked"};state.selection={carId:car.id,cosmeticId:cosmetic.id};return{state,selected:true,reason:null}}
export function achievementProgress(state,id){const achievement=achievementById(id);if(!achievement)return null;const tracks=Object.values(state?.stats?.tracks||{}).filter(track=>track.cleanFinishes>0).length,values={"first-clean-finish":state?.stats?.cleanFinishes||0,"two-track-finisher":tracks,"three-clean-streak":state?.stats?.cleanStreak||0,"apex-medal":state?.stats?.medals?.APEX||0};return{value:Math.min(achievement.target,values[id]||0),target:achievement.target,complete:Boolean(state?.achievements?.[id]?.unlockedAt)}}
