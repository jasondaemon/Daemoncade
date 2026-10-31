import {METRO_CONTRACTS,ALL_CONTRACTS,worldFor,WORLDS} from './worlds.js?v=release48';
import {normalizeExploration,explorationBest} from './exploration.js?v=release48';
export {METRO_CONTRACTS as CONTRACTS,ALL_CONTRACTS};
export const CAREER_KEY='sinkhole.metro.career.v1';
export const RIMS=[
 {id:'mint',name:'Mint',medals:0,color:0x82d9c7},
 {id:'gold',name:'Treasure Mimic',medals:3,color:0xffd26d,style:'mimic'},
 {id:'coral',name:'Frog',medals:6,color:0x59b95d,style:'frog'},
 {id:'violet',name:'Cheshire Cat',medals:9,color:0xc3a0ff,style:'cat'},
 {id:'tide',name:'Kraken',medals:12,color:0x70d8ef,style:'kraken'},
 {id:'solar',name:'Dragon',medals:18,color:0xc84d39,style:'dragon'},
 {id:'prism',name:'Crystal Golem',medals:24,color:0xb4e9f3,style:'golem'},
 {id:'orbital',name:'Visitor',medals:30,color:0xa9baff,style:'visitor'},
 {id:'nova',name:'Sun Beast',medals:36,color:0xffb33a,style:'sunbeast'},
 {id:'eclipse',name:'Eclipse',medals:45,color:0xc2a2d6,style:'bat'},
 {id:'singularity',name:'Singularity',medals:54,color:0xa4ece1,style:'serpent'}
];
export function nextReward(career){return RIMS.find(r=>r.medals>medalCount(career))||null;}
export function earnedRewards(before,after){const a=medalCount(before),b=medalCount(after);return RIMS.filter(r=>r.medals>a&&r.medals<=b);}
export function medalCount(career,world=null){return ALL_CONTRACTS.filter(c=>!world||c.world===world).reduce((sum,c)=>sum+(career.records[c.id]?.medal||0),0);}
export function worldUnlocked(career,id){const w=WORLDS.find(w=>w.id===id);return Boolean(w&&(!w.requires||career.records[w.requires])&&(!w.previous||worldUnlocked(career,w.previous)&&medalCount(career,w.previous)>=w.unlock));}
export function rimFor(career,id){return RIMS.find(r=>r.id===id&&r.medals<=medalCount(career))||RIMS[0];}
export function normalizeCareer(raw){
 if(raw?.version!==undefined&&raw.version!==1)return {version:1,records:{},arena:{},exploration:{}};
 const records={};
 for(const [i,c] of ALL_CONTRACTS.entries()){
  if(!worldUnlocked({records},c.world))continue;
  const previous=ALL_CONTRACTS[i-1];if(previous?.world===c.world&&!records[previous.id])continue;
  const r=raw?.records?.[c.id];if(r&&(r.rulesVersion===undefined||Number.isInteger(r.rulesVersion)&&r.rulesVersion>=1&&r.rulesVersion<=(c.rulesVersion||1))&&Number.isInteger(r.medal)&&r.medal>=1&&r.medal<=3&&Number.isFinite(r.time)&&r.time>0&&Number.isFinite(r.score)&&r.score>=0){records[c.id]={medal:r.medal,time:r.time,score:Math.floor(r.score)};if(r.rulesVersion>=2)records[c.id].rulesVersion=r.rulesVersion;}
 }
 const arena={};for(const difficulty of['easy','normal','hard']){const r=raw?.arena?.[difficulty];if(r&&r.rulesVersion===1&&Number.isSafeInteger(r.score)&&r.score>=0&&Number.isSafeInteger(r.runs)&&r.runs>0&&Number.isSafeInteger(r.wins)&&r.wins>=0&&r.wins<=r.runs)arena[difficulty]={rulesVersion:1,score:r.score,runs:r.runs,wins:r.wins};}
 const exploration=normalizeExploration(raw?.exploration,WORLDS.filter(w=>worldUnlocked({records},w.id)).map(w=>w.id));
 return {version:1,records,arena,exploration};
}
export function recordExploration(career,run){
 const next=normalizeCareer(career);if(run.arena||!worldUnlocked(next,run.world))return next;
 const best=explorationBest(next.exploration[run.world],run);if(best)next.exploration[run.world]=best;return next;
}
export function unlocked(career,index){const c=ALL_CONTRACTS[index],previous=ALL_CONTRACTS[index-1];return Boolean(c&&worldUnlocked(career,c.world)&&(!previous||previous.world!==c.world||career.records[previous.id]));}
export function recordResult(career,run){
 const next=normalizeCareer(career),c=run.contract;
 if(run.arena&&run.done&&run.rulesVersion===1){const old=next.arena[run.difficulty]||{score:0,runs:0,wins:0};next.arena[run.difficulty]={rulesVersion:1,score:Math.max(old.score,run.score),runs:old.runs+1,wins:old.wins+(run.won?1:0)};return next;}
 if(!c||!run.won||!unlocked(next,ALL_CONTRACTS.findIndex(x=>x.id===c.id)))return next;
 const medal=run.time<=c.gold?3:run.time<=c.silver?2:1,old=next.records[c.id];
 const comparable=(old?.rulesVersion||1)===(c.rulesVersion||1);
 next.records[c.id]={medal:Math.max(medal,old?.medal||0),time:Math.min(run.time,comparable?old?.time||Infinity:Infinity),score:Math.max(run.score,comparable?old?.score||0:0)};if(c.rulesVersion>=2)next.records[c.id].rulesVersion=c.rulesVersion;return next;
}
export function encodeBackup(career){return JSON.stringify({app:'sinkhole-city-metro',version:1,career:normalizeCareer(career)},null,2);}
export function decodeBackup(text){
 if(typeof text!=='string'||text.length>65536)throw new Error('Choose a Metro save file smaller than 64 KB.');
 let raw;try{raw=JSON.parse(text);}catch{throw new Error('This file is not valid JSON.');}
 if(raw?.app!=='sinkhole-city-metro'||raw.version!==1||raw.career?.version!==1||!raw.career.records||typeof raw.career.records!=='object'||Array.isArray(raw.career.records))throw new Error('This is not a supported Metro save.');
 const clean=normalizeCareer(raw.career);
 if(Object.keys(raw.career.records).length!==Object.keys(clean.records).length)throw new Error('The save contains invalid contract records.');
 if(raw.career.arena&&(typeof raw.career.arena!=='object'||Array.isArray(raw.career.arena)||Object.keys(raw.career.arena).length!==Object.keys(clean.arena).length))throw new Error('The save contains invalid Arena records.');
 if(raw.career.exploration&&(typeof raw.career.exploration!=='object'||Array.isArray(raw.career.exploration)||Object.keys(raw.career.exploration).length!==Object.keys(clean.exploration).length))throw new Error('The save contains invalid exploration records.');
 // A later contract cannot be unlocked by an orphaned imported result.
 for(let i=1;i<ALL_CONTRACTS.length;i++)if(clean.records[ALL_CONTRACTS[i].id]&&!unlocked(clean,i))throw new Error('The save is missing an earlier contract.');
 return clean;
}
