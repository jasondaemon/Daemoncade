import test from 'node:test';
import assert from 'node:assert/strict';
import {Rules} from './rules.js';
test('unique target bank lights a lock, boosts bonus, and resets targets',()=>{
 const r=new Rules();r.hit({type:'target',id:0});r.hit({type:'target',id:0});assert.equal(r.lockLit,false);
 r.hit({type:'target',id:1});r.hit({type:'target',id:2});assert.equal(r.lockLit,true);assert.equal(r.multiplier,2);assert.deepEqual(r.targets,[false,false,false]);
});
test('three qualified locks start multiball, every third jackpot is super',()=>{
 const events=[],r=new Rules(e=>events.push(e));assert.equal(r.lock(),false);
 for(let i=0;i<3;i++){r.lockLit=true;assert.equal(r.lock(),i===2?'multiball':'locked');}
 assert.equal(r.multiball,true);for(let i=0;i<3;i++)r.hit({type:'ramp'});
 assert.equal(r.jackpots,3);assert.ok(events.some(e=>e.title==='SUPER JACKPOT'));r.endMultiball();assert.equal(r.multiball,false);assert.equal(r.locks,0);
});
test('tilt disables scoring and forfeits bonus; next ball clears tilt',()=>{
 const r=new Rules();r.bonus=500;assert.equal(r.nudge(10),true);assert.equal(r.nudge(11),true);assert.equal(r.nudge(12),false);
 r.hit({type:'bumper'});assert.equal(r.score,0);r.endBall();assert.equal(r.score,0);assert.equal(r.tilted,false);assert.equal(r.ballNumber,2);
});
test('extra ball awarded once and final-ball accounting is exact',()=>{
 const r=new Rules();r.score=50000;r.hit({type:'bumper'});r.hit({type:'bumper'});assert.equal(r.ballsTotal,4);
 assert.equal(r.endBall(),false);assert.equal(r.endBall(),false);assert.equal(r.endBall(),false);assert.equal(r.endBall(),true);
});
test('all three objectives light wizard qualification',()=>{
 const r=new Rules();for(let i=0;i<20;i++)r.hit({type:'bumper'});for(let i=0;i<3;i++)r.hit({type:'orbit'});
 for(let bank=0;bank<2;bank++)for(let i=0;i<3;i++)r.hit({type:'target',id:i});assert.ok(r.wizard);assert.equal(r.lock(),'multiball');
});
test('pit-stop challenges score ordered checkpoints, spinner hits and alternating ramps',()=>{
 for(const mode of ['checkpoints','redline','combos']){const r=new Rules();r.startMode(mode);
  if(mode==='checkpoints')for(const type of ['orbit','ramp','target'])r.hit({type,id:0});
  if(mode==='redline')for(let i=0;i<5;i++)r.hit({type:'spinner'});
  if(mode==='combos')for(const id of [0,0,1,0])r.hit({type:'ramp',id});
  assert.equal(r.mode,null);assert.ok(r.score>=8000);
 }
 const r=new Rules();r.startMode('redline');r.tick(36);assert.equal(r.mode,null);
});
test('three unique rollovers qualify one two-ball mode',()=>{
 const events=[],r=new Rules(e=>events.push(e));for(const id of [0,0,1,2])r.hit({type:'rollover',id});assert.ok(r.multiball);assert.equal(events.filter(e=>e.type==='quick-multiball').length,1);
});
