import test from 'node:test';import assert from 'node:assert/strict';import {TouchDrive} from './touch-drive.js';
test('one finger accelerates and steers relatively; lifting brakes',()=>{
 const t=new TouchDrive();t.down(1,100,300,0);t.move(1,160,300,400);assert.equal(t.read(10).steer,.5);assert.equal(t.read(10).throttle,true);
 t.up(1,20);assert.equal(t.read(20).brake,true);assert.equal(t.read(20).steer,0);
});
test('second finger hold drifts while a tap pulses nitro without drift',()=>{
 const t=new TouchDrive();t.down(1,100,300,0);t.down(2,250,300,10);
 assert.equal(t.read(200).drift,false);assert.equal(t.read(240).drift,true);t.up(2,300);assert.equal(t.read(301).boost,false);
 t.down(3,250,300,400);t.up(3,500);assert.equal(t.read(501).boost,true);assert.equal(t.read(1501).boost,false);assert.equal(t.read(501).throttle,true);
});
test('cancellation, long moved taps and unrelated touches cannot trigger nitro or steal steering',()=>{
 const t=new TouchDrive();t.down(1,100,300,0);t.down(2,250,300,0);t.down(3,350,300,0);t.up(3,10);assert.equal(t.primary.id,1);assert.equal(t.secondary.id,2);
 t.up(2,100,true);assert.equal(t.read(100).boost,false);
 t.down(2,250,300,200);t.move(2,280,300,400);t.up(2,210);assert.equal(t.read(210).boost,false);
 t.down(2,250,300,220);t.up(1,230,true);assert.equal(t.read(500).drift,false);assert.equal(t.read(500).boost,false);assert.equal(t.read(500).brake,true);
 t.reset();assert.equal(t.read(600).enabled,false);
});
