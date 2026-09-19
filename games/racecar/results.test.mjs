import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from './rules.js';
import { restore,record } from './progress.js';
import { resultPresentation } from './results.js';
test('crossing first immediately opens completed results without waiting for rivals',()=>{
  const run=new Run({mode:'race',stage:0,difficulty:'normal'});
  run.phase='playing';run.player.z=run.goal-0.1;run.player.speed=70;
  run.update(1/60,{throttle:true});
  assert.equal(run.phase,'finished');assert.equal(run.position,1);
  assert(run.rivals.every(r=>r.finish===null));
  assert.equal(run.drain().filter(e=>e.type==='end').length,1);
  const p=restore(),outcome=record(p,run);
  assert.equal(resultPresentation(run,outcome).primary,'CONTINUE TO GARAGE');
  assert.equal(resultPresentation(run,outcome).title,'VICTORY');
  assert.equal(p.cursors['race:normal'],1);
  run.update(1/60,{});assert.equal(run.drain().length,0);
});
test('non-qualifying results offer retry instead of advancing',()=>{
  const run={phase:'finished',mode:'race',position:3,championship:{place:2}};
  const display=resultPresentation(run,{qualified:false});
  assert.equal(display.primary,'RETRY');assert.match(display.subtitle,/top 2/);
});
test('cup and career completion have distinct results',()=>{
  const run={phase:'finished',mode:'race',position:1,eventIndex:5};
  assert.equal(resultPresentation(run,{qualified:true}).title,'CHAMPIONSHIP COMPLETE');
  run.eventIndex=17;
  assert.equal(resultPresentation(run,{qualified:true}).title,'CAREER COMPLETE');
});
