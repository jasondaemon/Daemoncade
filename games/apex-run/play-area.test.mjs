import assert from "node:assert/strict";
import {PLAY_AREA,ROAD_SAMPLES,TRACK_BOXES,advanceOutsidePlayTime,advanceUnderRoadTime,isInPlayArea,isUnderRoad} from "./track-model.js";

const grass=TRACK_BOXES.find(box=>box.surface==="grass");
assert.ok(grass,"physical terrain support is missing");
const support={minX:grass.x-grass.hx,maxX:grass.x+grass.hx,minZ:grass.z-grass.hz,maxZ:grass.z+grass.hz};
assert.ok(PLAY_AREA.minX>support.minX&&PLAY_AREA.maxX<support.maxX,"recovery X envelope must be inset from terrain edge");
assert.ok(PLAY_AREA.minZ>support.minZ&&PLAY_AREA.maxZ<support.maxZ,"recovery Z envelope must be inset from terrain edge");

for(const point of[
  {x:PLAY_AREA.minX,z:0},{x:PLAY_AREA.maxX,z:0},{x:0,z:PLAY_AREA.minZ},{x:0,z:PLAY_AREA.maxZ},
])assert.equal(isInPlayArea(point),true,`boundary should remain playable: ${JSON.stringify(point)}`);
for(const point of[
  {x:PLAY_AREA.minX-.01,z:0},{x:PLAY_AREA.maxX+.01,z:0},{x:0,z:PLAY_AREA.minZ-.01},{x:0,z:PLAY_AREA.maxZ+.01},
])assert.equal(isInPlayArea(point),false,`unsupported point should recover: ${JSON.stringify(point)}`);

const dt=1/120,outside={x:PLAY_AREA.maxX+1,z:0},inside={x:0,z:0};let elapsed=0;
for(let i=0;i<Math.ceil(PLAY_AREA.grace/dt);i++)elapsed=advanceOutsidePlayTime(elapsed,outside,dt);
assert.ok(elapsed>=PLAY_AREA.grace,"stationary unsupported chassis must reach automatic recovery threshold");
assert.equal(advanceOutsidePlayTime(elapsed,inside,dt),0,"returning to supported terrain must cancel the grace timer");
let fast=0;for(let i=0;i<18;i++)fast=advanceOutsidePlayTime(fast,outside,dt);
assert.ok(fast<PLAY_AREA.grace,"a brief edge crossing must not recover immediately");
const elevated=ROAD_SAMPLES.reduce((best,sample)=>sample.y>best.y?sample:best,ROAD_SAMPLES[0]),under={x:elevated.x,y:elevated.y-4,z:elevated.z},onDeck={x:elevated.x,y:elevated.y+1,z:elevated.z};assert.equal(isUnderRoad(under),true);assert.equal(isUnderRoad(onDeck),false);let underElapsed=0;for(let i=0;i<66;i++)underElapsed=advanceUnderRoadTime(underElapsed,under,dt);assert.ok(underElapsed>=.55,"stranded chassis beneath elevated road must recover promptly");assert.equal(advanceUnderRoadTime(underElapsed,onDeck,dt),0,"valid road height must clear under-road recovery timer");let jumpGap=0;for(let i=0;i<30;i++)jumpGap=advanceUnderRoadTime(jumpGap,under,dt);assert.ok(jumpGap<.55,"brief vertical excursion must retain recovery grace");

console.log("Apex Run playable terrain/recovery envelope passed",JSON.stringify({support,playArea:PLAY_AREA}));
