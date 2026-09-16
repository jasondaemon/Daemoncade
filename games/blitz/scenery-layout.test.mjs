import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENERY_MODELS,sceneryLayout,sceneryZ} from './scenery-layout.js';
test('both sides contain the full scenery set, with bounded road clearance',()=>{
  const layout=sceneryLayout();assert.deepEqual(layout,sceneryLayout());
  for(const side of [-1,1])assert.equal(new Set(layout.filter(p=>Math.sign(p.x)===side).map(p=>p.model)).size,SCENERY_MODELS.length);
  for(const p of layout)assert.ok(Math.abs(p.x)-p.width/2>6.2);
});
test('scenery wraps only after its entire footprint passes behind the camera',()=>{
  for(const p of sceneryLayout())for(let distance=0;distance<320;distance+=.5){
    const before=sceneryZ(p.offset,distance),after=sceneryZ(p.offset,distance+.5);
    if(after<before)assert.ok(before-p.width/2>31);
    else assert.ok(Math.abs(after-before-.5)<1e-8);
  }
});
