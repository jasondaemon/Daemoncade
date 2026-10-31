import {test} from 'node:test';
import assert from 'node:assert/strict';
import {trafficPose,TRAFFIC_LENGTH} from './traffic.js';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';

test('traffic follows a continuous, constant-speed street loop without corner teleports',()=>{
 const step=.01;
 for(let d=0;d<TRAFFIC_LENGTH;d+=.1){
  const a=trafficPose(d),b=trafficPose(d+step);
  assert.ok(Math.abs(Math.hypot(b.x-a.x,b.z-a.z)-step)<.00001);
  assert.ok(Math.abs(Math.hypot(a.vx,a.vz)-1)<1e-10);
  assert.ok(a.x>=-26.001&&a.x<=26.001&&a.z>=-24.001&&a.z<=28.001);
  assert.ok(Math.min(Math.abs(Math.abs(a.x)-26),Math.abs(a.z+24),Math.abs(a.z-28))<=1.18,'car stays on the road, including rounded corners');
 }
 const a=trafficPose(0),b=trafficPose(TRAFFIC_LENGTH);assert.deepEqual(a,b);
 const before=trafficPose(TRAFFIC_LENGTH-.001);assert.ok(Math.hypot(a.x-before.x,a.z-before.z)<.00101);
});
test('traffic moves in Expedition only; original Arena layout and Basecamp remain unchanged',()=>{
 const metro=new DistrictRun({free:true}),arena=new ArenaRun(),camp=new DistrictRun({world:'basecamp'});
 assert.equal(metro.traffic.length,16);assert.equal(arena.traffic.length,0);assert.equal(camp.traffic.length,0);
 assert.equal(arena.objects.length,202);assert.equal(metro.objects.length,240);
 const car=metro.traffic[0],start=car.x;for(let i=0;i<60;i++)metro.step(1/60,{x:0,y:0});
 assert.ok(Math.abs(car.x-start-3.2)<1e-8);
 metro.done=true;const x=car.x;metro.step(1,{x:0,y:0});assert.equal(car.x,x);
});
test('intercepted traffic transfers momentum into the fall and scores exactly once',()=>{
 const run=new DistrictRun({free:true}),car=run.traffic[0];run.objects=[car];run.traffic=[car];run.total=1;
 run.player.x=car.x;run.player.z=car.z;run.player.radius=3;run.player.area=9;
 run.step(1/60,{x:0,y:0});assert.equal(car.traffic.stopped,true);assert.ok(car.body);assert.equal(car.intakeVelocity.x,3.2);
 const routeDistance=car.traffic.distance;
 for(let i=0;i<240;i++)run.step(1/60,{x:0,y:0});
 assert.equal(car.traffic.distance,routeDistance);assert.equal(car.phase,'consumed');assert.equal(run.eaten,1);
 const events=run.events.filter(e=>e.type==='consume');assert.equal(events.length,1);assert.equal(events[0].points,run.score);
});
test('a shallowly caught car can recover onto pavement without snapping back to its traffic route',()=>{
 const run=new DistrictRun({free:true}),car=run.traffic[0];run.objects=[car];run.traffic=[car];run.total=1;
 run.player.x=car.x;run.player.z=car.z;run.player.radius=3;run.player.area=9;
 run.step(1/60,{x:0,y:0});const distance=car.traffic.distance;
 run.player.x-=12;
 for(let i=0;i<300;i++)run.step(1/60,{x:0,y:0});
 assert.equal(car.phase,'idle');assert.equal(car.traffic.stopped,true);assert.equal(car.traffic.distance,distance);assert.equal(run.eaten,0);
 const x=car.x,z=car.z;for(let i=0;i<60;i++)run.step(1/60,{x:0,y:0});
 assert.ok(Math.hypot(car.x-x,car.z-z)<.01,'recovered car remains parked where it settled');
});
