export const DEFAULT_TRACK_ID="alpine-sprint";
const tracks=[
  {id:DEFAULT_TRACK_ID,name:"Alpine Sprint",description:"The original elevated stadium time attack.",difficulty:"INTERMEDIATE",storage:{pb:"apex-run:pb:v9",replay:"apex-run:replay:v10"},replayVersion:10,checkpointCount:4,status:"playable"},
  {id:"summit-circuit",name:"Summit Circuit",description:"A longer technical climb with linked banks, two crests and an elevated return.",difficulty:"ADVANCED",storage:{pb:"apex-run:track:summit-circuit:pb:v1",replay:"apex-run:track:summit-circuit:replay:v1"},replayVersion:1,checkpointCount:6,status:"playable"},
];
export const TRACK_CATALOG=Object.freeze(tracks.map(track=>Object.freeze({...track,storage:Object.freeze({...track.storage})})));
export function resolveTrack(trackId=DEFAULT_TRACK_ID){return TRACK_CATALOG.find(track=>track.id===trackId)||TRACK_CATALOG[0]}
export function trackStorageKeys(trackId=DEFAULT_TRACK_ID){const track=resolveTrack(trackId);if(track.id===DEFAULT_TRACK_ID)return track.storage;return Object.freeze({pb:`apex-run:track:${track.id}:pb:v1`,replay:`apex-run:track:${track.id}:replay:v1`})}
export function validTrackId(value){return typeof value==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)&&TRACK_CATALOG.some(track=>track.id===value)}
export function requestedTrackId(search=globalThis.location?.search||""){try{const value=new URLSearchParams(search).get("track");return validTrackId(value)?value:DEFAULT_TRACK_ID}catch{return DEFAULT_TRACK_ID}}
export function activeTrack(search){return resolveTrack(requestedTrackId(search))}
