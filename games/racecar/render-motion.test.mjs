import test from 'node:test';
import assert from 'node:assert/strict';
import { captureMotion, interpolateMotion } from './render-motion.js';
const state=()=>({phase:'playing',time:0,player:{id:'player',x:0,z:0,speed:90},rivals:[],traffic:[]});
test('high-speed rendering advances evenly at 144 Hz over 60 Hz physics',()=>{
  const run=state();let accumulator=0,previous=null,last=null;
  for(let i=0;i<300;i++) {
    accumulator+=1/144;
    while(accumulator>=1/60) {
      previous=captureMotion(run);run.time+=1/60;run.player.z+=90/60;accumulator-=1/60;
    }
    const display=interpolateMotion(run,previous,accumulator*60);
    if(i>5) assert(Math.abs(display.player.z-last-90/144)<1e-8);
    last=display.player.z;
  }
});
test('interpolation is visual only and interpolates speed along with position',()=>{
  const run=state(),previous=captureMotion(run);
  run.player.z=1.5;run.player.speed=84;run.time=1/60;
  const shown=interpolateMotion(run,previous,0.5);
  assert.equal(shown.player.z,0.75);assert.equal(shown.player.speed,87);
  assert.equal(run.player.z,1.5);assert.equal(run.player.speed,84);
});
test('new actors do not inherit removed actors motion; pauses and restarts bypass interpolation',()=>{
  const run=state();run.traffic=[{id:'old',x:0,z:100,speed:20}];
  const previous=captureMotion(run);
  run.traffic=[{id:'new',x:0.5,z:150,speed:30}];
  assert.equal(interpolateMotion(run,previous,0.5).traffic[0].z,150);
  run.phase='paused';assert.equal(interpolateMotion(run,previous,0),run);
  const next=state();assert.equal(interpolateMotion(next,previous,0),next);
});
