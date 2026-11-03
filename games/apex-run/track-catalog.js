export const DEFAULT_TRACK_ID="alpine-sprint";
const ALPINE_MEDALS=Object.freeze([{name:"APEX",time:48,color:0x55efff},{name:"GOLD",time:60,color:0xffd454},{name:"SILVER",time:75,color:0xd6e2ec},{name:"BRONZE",time:95,color:0xd58b55},{name:"ROOKIE",time:120,color:0x79d987}]);
const SUMMIT_MEDALS=Object.freeze([{name:"APEX",time:105,color:0x55efff},{name:"GOLD",time:130,color:0xffd454},{name:"SILVER",time:155,color:0xd6e2ec},{name:"BRONZE",time:180,color:0xd58b55},{name:"ROOKIE",time:210,color:0x79d987}]);
const HARBOR_MEDALS=Object.freeze([{name:"APEX",time:120,color:0x55efff},{name:"GOLD",time:145,color:0xffd454},{name:"SILVER",time:170,color:0xd6e2ec},{name:"BRONZE",time:195,color:0xd58b55},{name:"ROOKIE",time:225,color:0x79d987}]);
const tracks=[
  {id:DEFAULT_TRACK_ID,name:"Alpine Sprint",description:"The original elevated stadium time attack.",difficulty:"INTERMEDIATE",storage:{pb:"apex-run:pb:v9",replay:"apex-run:replay:v10"},replayVersion:10,replayBounds:300,replayHz:30,replayMaxSeconds:300,checkpointCount:4,medals:ALPINE_MEDALS,status:"playable"},
  {id:"summit-circuit",name:"Summit Circuit",description:"A varied advanced time attack with a narrow paddock slalom, reservoir jump, route choice and physical stunt loop.",difficulty:"ADVANCED",storage:{pb:"apex-run:track:summit-circuit:pb:v8",replay:"apex-run:track:summit-circuit:replay:v9"},replayVersion:9,replayBounds:760,replayHz:15,replayMaxSeconds:900,checkpointCount:7,medals:SUMMIT_MEDALS,status:"playable"},
  {id:"harbor-run",name:"Harbor Run",description:"A coastal-industrial sprint through dockside esses, a channel jump, crane causeways and the breakwater finish.",difficulty:"EXPERT",storage:{pb:"apex-run:track:harbor-run:pb:v1",replay:"apex-run:track:harbor-run:replay:v1"},replayVersion:1,replayBounds:900,replayHz:15,replayMaxSeconds:720,checkpointCount:7,medals:HARBOR_MEDALS,status:"playable"},
];
export const TRACK_CATALOG=Object.freeze(tracks.map(track=>Object.freeze({...track,storage:Object.freeze({...track.storage}),medals:track.medals})));
export function resolveTrack(trackId=DEFAULT_TRACK_ID){return TRACK_CATALOG.find(track=>track.id===trackId)||TRACK_CATALOG[0]}
export function trackStorageKeys(trackId=DEFAULT_TRACK_ID){return resolveTrack(trackId).storage}
export function validTrackId(value){return typeof value==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)&&TRACK_CATALOG.some(track=>track.id===value)}
export function requestedTrackId(search=globalThis.location?.search||""){try{const value=new URLSearchParams(search).get("track");return validTrackId(value)?value:DEFAULT_TRACK_ID}catch{return DEFAULT_TRACK_ID}}
export function activeTrack(search){return resolveTrack(requestedTrackId(search))}
