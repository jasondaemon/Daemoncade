import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ArenaRun,DIFFICULTIES} from './arena.js';
import {normalizeCareer,recordResult,medalCount,encodeBackup,decodeBackup} from './career.js';

test('Arena has three labeled rivals, fair initial growth and the exact same movement model',()=>{
 const run=new ArenaRun();assert.equal(run.rivals.length,3);
 for(const rival of run.rivals){assert.equal(rival.player.radius,run.player.radius);assert.equal(rival.player.area,run.player.area);assert.ok(Math.hypot(rival.player.x-run.player.x,rival.player.z-run.player.z)>40);}
 const rival=run.rivals[0];run.player.x=rival.player.x=0;run.player.z=rival.player.z=0;
 for(let i=0;i<120;i++){const input={x:.6,y:-.3};run.move(run,1/60,input);run.move(rival,1/60,input);}
 assert.deepEqual(rival.player,run.player);
 assert.ok(run.standings().every(r=>r.rank===1),'equal scores share a rank');
});
test('an ordinary collection route can win Easy without player-only movement bonuses',()=>{
 const run=new ArenaRun({difficulty:'easy'});let target;
 for(let tick=0;tick<7201&&!run.done;tick++){
  const p=run.player;if(target&&(target.phase==='consumed'||target.owner&&target.owner!==run.id))target=null;
  if(!target)target=run.objects.filter(o=>run.eligible(o)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;
 }
 assert.equal(run.won,true);assert.equal(run.standings()[0].id,'you');
});
test('two holes contesting one prop cannot duplicate its score or growth',()=>{
 const run=new ArenaRun(),o=run.objects.find(o=>o.type==='cone');run.objects=[o];run.total=1;
 for(const a of[run,...run.rivals]){a.player.x=o.x;a.player.z=o.z;}
 for(let i=0;i<180&&!run.done;i++)run.step(1/60,{x:0,y:0});
 const actors=[run,...run.rivals];assert.equal(o.phase,'consumed');assert.equal(actors.reduce((n,a)=>n+a.eaten,0),1);assert.equal(actors.reduce((n,a)=>n+a.score,0),Math.round(o.score*1.08));assert.ok(Math.abs(actors.reduce((n,a)=>n+a.player.area,0)-(4*1.44+o.mass))<1e-8);
});
for(const difficulty of Object.keys(DIFFICULTIES))test(`${difficulty} rivals collect and grow; an idle player does not automatically win`,()=>{
 const run=new ArenaRun({difficulty});
 for(let tick=0;tick<120*60+1&&!run.done;tick++){run.step(1/60,{x:0,y:0});run.events.length=0;}
 assert.equal(run.done,true);assert.equal(run.won,false);assert.ok(run.rivals.every(r=>r.eaten>2&&r.player.radius>1.2));
 const total=[run,...run.rivals].reduce((n,a)=>n+a.eaten,0);assert.equal(total,run.objects.filter(o=>o.phase==='consumed').length);
 assert.ok(run.standings()[0].score>run.score);const time=run.time;run.step(1,{x:1,y:1});assert.equal(run.time,time);
});
test('Arena records are separated by difficulty, survive backups and do not award campaign medals',()=>{
 const run=new ArenaRun({difficulty:'hard'});run.done=true;run.won=true;run.score=500;
 let career=recordResult(normalizeCareer({}),run);assert.equal(medalCount(career),0);assert.deepEqual(career.arena.hard,{rulesVersion:1,score:500,runs:1,wins:1});assert.equal(career.arena.normal,undefined);
 run.won=false;run.score=300;career=recordResult(career,run);assert.deepEqual(career.arena.hard,{rulesVersion:1,score:500,runs:2,wins:1});assert.deepEqual(decodeBackup(encodeBackup(career)),career);
 const malformed=JSON.parse(encodeBackup(career));malformed.career.arena.hard.wins=99;assert.throws(()=>decodeBackup(JSON.stringify(malformed)));
});
