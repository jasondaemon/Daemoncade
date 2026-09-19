import test from 'node:test';
import assert from 'node:assert/strict';
import { restore,record } from './progress.js';
import { championshipEvent,raceCursor,configureEvent } from './championships.js';
import { Run } from './rules.js';
import { FrameDiagnostics } from './performance.js';
test('legacy progress migrates into the first championship without losing garage unlocks',()=>{
  const p=restore({cursors:{'race:normal':6},car:'apex'});
  assert.equal(raceCursor(p,'normal'),6);assert.equal(p.car,'apex');
  assert.equal(championshipEvent(6).name,'Club Championship');
});
test('eighteen events advance once, with stricter finish requirements per cup',()=>{
  const p=restore();
  for(let index=0;index<18;index++) {
    const event=championshipEvent(index);
    const run={mode:'race',difficulty:'normal',stage:event.stage,eventIndex:index,
      phase:'finished',position:event.place+1,player:{finish:60},score:100};
    assert.equal(record(p,run).qualified,false);
    assert.equal(raceCursor(p,'normal'),index);
    run.position=event.place;
    assert.equal(record(p,run).qualified,true);
    assert.equal(raceCursor(p,'normal'),index+1);
    record(p,run);assert.equal(raceCursor(p,'normal'),index+1);
  }
  assert.equal(restore(p).championships.normal,18);
  assert.equal(championshipEvent(18).index,17);
});
test('difficulty progression is independent and corrupt values are bounded',()=>{
  const p=restore({championships:{normal:Infinity,easy:-12,hard:500}});
  assert.equal(p.championships.easy,0);assert.equal(p.championships.hard,18);
  assert.equal(raceCursor(restore(),'hard'),0);
});
test('frame diagnostics uses a bounded window and counts long frames',()=>{
  const d=new FrameDiagnostics(4);
  [16,16,16,80,20].forEach(v=>d.add(v,2));
  const s=d.summary();assert.equal(d.frames.length,4);assert.equal(s.frames,5);
  assert.equal(s.longFrames,1);assert.equal(s.p95,80);assert.equal(s.work95,2);
});
test('championship pace changes do not mutate shared difficulty settings',()=>{
  const run=new Run({mode:'race',difficulty:'normal'});
  configureEvent(run,championshipEvent(12));
  assert.equal(run.rules.pace,1.08);
  assert.equal(new Run({mode:'race',difficulty:'normal'}).rules.pace,1);
});
