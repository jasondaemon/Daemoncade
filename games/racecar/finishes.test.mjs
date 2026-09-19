import test from 'node:test';
import assert from 'node:assert/strict';
import { FINISHES,isPaintSlot } from './finishes.js';
import { CARS } from './garage.js';
import { followMovingTarget } from './camera-motion.js';
test('every car has a distinct finish and non-paint parts are protected',()=>{
  assert.equal(new Set(CARS.map(c=>FINISHES[c.id].color)).size,CARS.length);
  for(const slot of ['Black','Grey','Windows','Headlights','TailLights','BlueLights','WhiteLights']) assert(!isPaintSlot(slot));
  for(const slot of ['Blue','LightBlue','White','Orange','DarkOrange','Yellow']) assert(isPaintSlot(slot));
});
test('high-speed camera follow is independent of frame timing',()=>{
  const simulate=frames=>{
    let p=0,time=0;
    for(const dt of frames) {
      p=followMovingTarget(p,time*90,(time+dt)*90,dt);time+=dt;
    }
    return p;
  };
  const steady=simulate(Array(120).fill(1/60));
  const fast=simulate(Array(288).fill(1/144));
  const uneven=simulate(Array.from({length:120},(_,i)=>i%2?1/40:1/120));
  assert(Math.abs(steady-fast)<1e-8);
  assert(Math.abs(steady-uneven)<1e-8);
  assert.equal(followMovingTarget(5,10,10,0),5);
});
