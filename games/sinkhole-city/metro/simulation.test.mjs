import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {METRO_CONTRACTS} from './worlds.js';

test('objects require footprint fit and score once after falling, rather than on overlap',()=>{
 const run=new DistrictRun(),o=run.objects.find(o=>o.type==='cone');run.player.x=o.x;run.player.z=o.z;
 run.step(1/60,{x:0,y:0});assert.equal(o.phase,'contact');assert.equal(run.eaten,0);assert.equal(run.score,0);
 for(let i=0;i<90;i++)run.step(1/60,{x:0,y:0});assert.equal(o.phase,'consumed');const score=run.score;
 for(let i=0;i<90;i++)run.step(1/60,{x:0,y:0});assert.equal(run.score,score);
 const tower=run.objects.find(o=>o.type==='landmark');assert.equal(run.eligible(tower),false);
});
test('a greedy route can reach the landmark within its campaign mission budget',()=>{
 const run=new DistrictRun({contract:METRO_CONTRACTS.find(c=>c.id==='tower')});let target;
 for(let i=0;i<run.duration*60+1&&!run.done;i++){
  const p=run.player;let best=null,distance=Infinity;
  for(const o of run.objects){if(!run.eligible(o))continue;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<distance){distance=d;best=o;}}
  const tower=run.objects.find(o=>o.type==='landmark');if(run.eligible(tower))best=tower;
  if(target?.phase==='consumed')target=null;
  if(!target||best===tower)target=best;
  const x=target?target.x-p.x:0,y=target?target.z-p.z:0,d=Math.hypot(x,y)||1;run.step(1/60,{x:d<.12?0:x/d,y:d<.12?0:y/d});run.events.length=0;
 }
 assert.equal(run.won,true);assert.ok(run.time<run.duration);assert.equal(run.objects.find(o=>o.type==='landmark').phase,'consumed');
});
test('timed and untimed play have distinct endings, with no state changes after completion',()=>{
 const timed=new DistrictRun(),free=new DistrictRun({free:true});
 for(let i=0;i<121*60;i++){timed.step(1/60,{x:0,y:0});free.step(1/60,{x:0,y:0});}
 assert.equal(timed.done,true);assert.equal(timed.won,false);assert.equal(free.done,false);const t=timed.time;timed.step(1,{x:1,y:1});assert.equal(timed.time,t);
});

function rimFixture(distance=1.1){
 const run=new DistrictRun({free:true}),object=run.objects.find(o=>o.type==='cone');
 run.objects=[object];run.total=1;run.player.x=object.x-distance;run.player.z=object.z;
 return {run,object};
}
test('an off-center object tips over the rim before its entire footprint fits',()=>{
 const {run,object}=rimFixture(1.1),originalX=object.x;
 assert.ok(1.1+object.radius>run.player.radius,'old full-containment test would reject this position');
 let tilt=0;
 for(let i=0;i<120&&!run.done;i++){run.step(1/60,{x:0,y:0});if(object.body)tilt=Math.max(tilt,Math.hypot(object.body.q.x,object.body.q.z));}
 assert.equal(object.phase,'consumed');assert.ok(tilt>.2);assert.ok(object.x<originalX-.05,'rim contact must translate as well as rotate the body');
});
test('a shallow graze rocks and recovers without consuming or moving the prop',()=>{
 const {run,object}=rimFixture(1.35),original=object.x;
 for(let i=0;i<60;i++)run.step(1/60,{x:0,y:0});
 assert.ok(object.rockAngle>.01);assert.equal(run.eaten,0);assert.equal(object.x,original);
 run.player.x-=5;
 for(let i=0;i<180;i++)run.step(1/60,{x:0,y:0});
 assert.ok(Math.abs(object.rockAngle)<.001);assert.equal(run.eaten,0);
});
test('withdrawing the hole early returns the body to pavement; falling does not attach it to the player',()=>{
 const {run,object}=rimFixture(1.1);run.step(1/60,{x:0,y:0});const x=object.x;
 run.player.x-=4;
 for(let i=0;i<180;i++)run.step(1/60,{x:0,y:0});
 assert.equal(run.eaten,0);assert.ok(Math.abs(object.x-x)<.5);assert.ok(object.body.y>0);
 assert.equal(object.phase,'idle');
});
test('driving past a mostly submerged car or building cannot push it back above the street',()=>{
 let exercised=0;
 for(const [type,offset] of [['car',0],['car',.25],['building',0]]){
  const run=new DistrictRun({free:true}),o=run.objects.find(o=>o.type===type);run.objects=[o];run.total=1;o.x=o.z=0;
  const p=run.player;p.radius=o.radius/.82+1.5;p.area=p.radius**2;p.x=-p.radius-o.radius-2;p.z=p.radius*offset;p.vx=14-p.radius*.45;
  let submerged=false,lowest=Infinity,rebound=0;
  for(let tick=0;tick<600&&!run.done;tick++){
   run.step(1/60,{x:1,y:0});run.events.length=0;if(!o.body)continue;
   if(o.body.y<-.4)submerged=true;
   if(submerged){lowest=Math.min(lowest,o.body.y);rebound=Math.max(rebound,o.body.y-lowest);}
  }
  assert.ok(submerged,`${type}: drive-through fixture must actually enter the hole`);
  exercised++;
  assert.ok(rebound<.01,`${type}: body rose ${rebound.toFixed(2)} after dropping below the rim`);
  assert.equal(o.phase,'consumed');assert.equal(run.eaten,1);
 }
 assert.equal(exercised,3,'all reproduced drive-through cases must enter the hole');
});
test('rim response stays finite for slender, long and heavy proxies at multiple angles',()=>{
 for(const shape of [{width:.22,depth:.22,height:4},{width:1.1,depth:2.1,height:.8},{width:5,depth:4,height:12}])for(const yaw of [0,.6,1.4]){
  const {run,object}=rimFixture();object.shape=shape;object.yaw=yaw;object.radius=Math.hypot(shape.width,shape.depth)/1.8;
  run.player.radius=object.radius/.82+.3;run.player.area=run.player.radius**2;run.player.x=object.x-run.player.radius*.8;
  for(let i=0;i<300&&!run.done;i++){run.step(1/60,{x:0,y:0});if(object.body){const b=object.body;assert.ok(Number.isFinite(b.x+b.y+b.z+b.q.x+b.q.y+b.q.z+b.q.w));assert.ok(Math.abs(Math.hypot(b.q.x,b.q.y,b.q.z,b.q.w)-1)<1e-6);}run.events.length=0;}
  if(object.phase!=='consumed'){
   // Long props can bridge an edge. Re-centering a sufficiently large opening
   // must release that support instead of leaving a permanent solver jam.
   run.player.x=object.body.x;run.player.z=object.body.z;run.player.radius=8.5;run.player.area=8.5**2;
   for(let i=0;i<180&&!run.done;i++){run.step(1/60,{x:0,y:0});run.events.length=0;}
  }
  assert.equal(object.phase,'consumed');
 }
});
