import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GrowthCamera,CAMERA_PROFILES,cameraSpan} from './camera.js';

test('each world has continuous, bounded and monotonic growth framing with a readable starting view',()=>{
 for(const world of Object.keys(CAMERA_PROFILES)){
  let last=0;for(let radius=1.2;radius<=8.5;radius+=.005){const span=cameraSpan(world,radius);assert.ok(Number.isFinite(span)&&span>=last);assert.ok(span-last<.15||last===0);last=span;}
  assert.ok(cameraSpan(world,8.5)/cameraSpan(world,1.2)>2.8);
  assert.equal(cameraSpan(world,-20),cameraSpan(world,1.2));assert.equal(cameraSpan(world,100),cameraSpan(world,8.5));assert.equal(cameraSpan(world,NaN),cameraSpan(world,1.2));
 }
 assert.ok(cameraSpan('deep',1.2)<cameraSpan('basecamp',1.2));assert.ok(cameraSpan('basecamp',1.2)<cameraSpan('metro',1.2));
 assert.notEqual(CAMERA_PROFILES.metro.elevation,CAMERA_PROFILES.deep.elevation);
});
test('large growth rewards ease out without a one-frame jump, overshoot, or render-rate dependence',()=>{
 for(const world of Object.keys(CAMERA_PROFILES)){
  const snapshots=[];for(const fps of[20,30,60,120]){
   const camera=new GrowthCamera();camera.reset(world,1.2);const first=camera.update(world,8.5,1/fps);
   assert.ok(first>cameraSpan(world,1.2)&&first<cameraSpan(world,8.5)*.5);
   for(let i=1;i<fps*2;i++)camera.update(world,8.5,1/fps);
   snapshots.push(camera.span);assert.ok(camera.span<cameraSpan(world,8.5));
  }
  for(const value of snapshots)assert.ok(Math.abs(value-snapshots[0])<1e-9);
 }
});
test('pause redraws preserve zoom; new runs/worlds reset it; reduced motion stays bounded',()=>{
 const camera=new GrowthCamera();camera.reset('deep',1.2);camera.update('deep',8.5,.1);const span=camera.span;
 for(let i=0;i<10;i++)camera.update('deep',8.5,0);assert.equal(camera.span,span);
 camera.reset('deep',1.2);assert.equal(camera.span,16);camera.update('basecamp',1.2,0);assert.equal(camera.span,18);
 const reduced=camera.update('basecamp',8.5,1/60,true);assert.ok(reduced>18&&reduced<60);
});
test('portrait and landscape framing preserves short-edge coverage and keeps fog beyond the focal plane',()=>{
 for(const world of Object.keys(CAMERA_PROFILES))for(const radius of[1.2,4,8.5])for(const aspect of[.32,430/932,1,932/430]){
  const camera=new GrowthCamera();camera.reset(world,radius);const frame=camera.framing(aspect),view=2*frame.distance*Math.tan(Math.PI/9),pitch=CAMERA_PROFILES[world].elevation*Math.PI/180;
  const short=Math.min(view*aspect,view/Math.sin(pitch));assert.ok(Math.abs(short-frame.span)<1e-8);
  assert.ok(frame.fogNear>frame.distance&&frame.fogFar>frame.fogNear);assert.ok(Number.isFinite(frame.height+frame.back+frame.lead));
 }
});
