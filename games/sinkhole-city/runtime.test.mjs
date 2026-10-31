import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RunClock,SceneAssets,readJSON,writeStorage} from './runtime.js';

test('five seconds of fixed simulation is identical at 10, 20, 30, 60 and 120 FPS',()=>{
 const distances=[];
 for(const fps of [10,20,30,60,120]){
  const clock=new RunClock();let x=0,v=0,ticks=0;
  for(let i=0;i<=fps*5;i++)clock.advance(i*1000/fps,dt=>{v+=(270-v)*Math.min(1,dt*8);x+=v*dt;ticks++;});
  distances.push(x);assert.equal(ticks,300);assert.ok(Math.abs(clock.elapsed-5)<1e-8);
 }
 assert.ok(distances.every(x=>Math.abs(x-distances[0])<1e-8));
});
test('long stall requests pause without advancing time; resume discards only paused time',()=>{
 const clock=new RunClock();clock.advance(0,()=>{});clock.advance(100,()=>{});
 const before=clock.elapsed;assert.equal(clock.advance(2000,()=>assert.fail('should not simulate')),false);
 assert.equal(clock.elapsed,before);clock.advance(7000,()=>{});clock.advance(7100,()=>{});
 assert.ok(Math.abs(clock.elapsed-before-.1)<1e-8);
});
test('scene loading selects only the chosen assets and releases obsolete sources',async()=>{
 const assets=new SceneAssets(),make=()=>({src:'',decode:async()=>{},removeAttribute(){this.src='';}});
 const a=make(),b=make(),shared=make();assets.register(a,'campsite','camp.png');assets.register(b,'city','city.png');assets.register(shared,['city','campsite'],'tree.png');
 await assets.load('campsite');assert.equal(a.src,'camp.png');assert.equal(b.src,'');assert.equal(shared.src,'tree.png');
 assets.releaseExcept('city');await assets.load('city');assert.equal(a.src,'');assert.equal(b.src,'city.png');assert.equal(shared.src,'tree.png');
 b.decode=async()=>{throw Error('network')};assets.releaseExcept('space');assert.deepEqual(await assets.load('city'),['city.png']);
});
test('storage failures preserve a playable fallback',()=>{
 globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
 assert.deepEqual(readJSON('save',{}),{});assert.equal(writeStorage('save','{}'),false);
});
