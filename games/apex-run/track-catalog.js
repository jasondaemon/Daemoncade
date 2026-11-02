export const DEFAULT_TRACK_ID="alpine-sprint";
const tracks=[{id:DEFAULT_TRACK_ID,name:"Alpine Sprint",description:"The original elevated stadium time attack.",difficulty:"INTERMEDIATE",storage:{pb:"apex-run:pb:v9",replay:"apex-run:replay:v10"},replayVersion:10,checkpointCount:4,status:"playable"}];
export const TRACK_CATALOG=Object.freeze(tracks.map(track=>Object.freeze({...track,storage:Object.freeze({...track.storage})})));
export function resolveTrack(trackId=DEFAULT_TRACK_ID){return TRACK_CATALOG.find(track=>track.id===trackId)||TRACK_CATALOG[0]}
export function trackStorageKeys(trackId=DEFAULT_TRACK_ID){const track=resolveTrack(trackId);if(track.id===DEFAULT_TRACK_ID)return track.storage;return Object.freeze({pb:`apex-run:track:${track.id}:pb:v1`,replay:`apex-run:track:${track.id}:replay:v1`})}
export function validTrackId(value){return typeof value==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)&&TRACK_CATALOG.some(track=>track.id===value)}
