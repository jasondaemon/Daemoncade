import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CITY_STREETS,CITY_PARKING,parkingPose,curbIntervals} from './city-layout.js';
import {CITY_ROUTES,cityPose,routeLength,updateCityTraffic,updatePeople} from './city-life.js';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';
import {footLift} from './people-art.js';
import {signalState} from './junctions.js';

test('parking hugs the curb on continuous pavement, outside moving lanes and clear of junctions',()=>{
 assert.ok(new Set(CITY_STREETS.map(s=>s.width)).size>=3);
 for(const bay of CITY_PARKING){const p=parkingPose(bay),s=CITY_STREETS.find(s=>s.at===bay.at&&s.axis===bay.axis),cross=CITY_STREETS.filter(s=>s.axis!==bay.axis),offset=Math.abs((bay.axis==='z'?p.x:p.z)-bay.at);assert.ok(Math.abs(offset-(s.width/2-.8))<1e-10);assert.ok(offset+.7<s.width/2);assert.ok(offset-1.1>1.4);assert.ok(cross.every(c=>Math.abs(bay.along-c.at)>c.width/2+2.7+.5));}
});
test('curbs stop before intersections and pedestrian crossing approaches',()=>{
 for(const street of CITY_STREETS)for(const [a,b]of curbIntervals(street)){
  assert.ok(a>=street.min&&b<=street.max&&b>a);
  for(const cross of CITY_STREETS.filter(s=>s.axis!==street.axis))assert.ok(b<=cross.at-cross.width/2-2||a>=cross.at+cross.width/2+2);
 }
});
test('four traffic routes are continuous across straights, turns and loop seams',()=>{
 for(const route of CITY_ROUTES){const length=routeLength(route);for(let d=0;d<length;d+=.1){const a=cityPose(d,route),b=cityPose(d+.01,route);assert.ok(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-.01)<.00001);assert.ok(Math.abs(Math.hypot(a.vx,a.vz)-1)<1e-10);assert.ok(Number.isFinite(a.yaw));}const a=cityPose(0,route),b=cityPose(length-.001,route);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.00101);}
});
test('traffic yields at red intersections and follows a stopped car without teleporting',()=>{
 const r=new DistrictRun(),car=r.traffic[0],t=car.traffic;t.distance=19;Object.assign(car,cityPose(t.distance,CITY_ROUTES[0]));
 for(let i=0;i<180;i++)updateCityTraffic([car],1/60,8+i/60);assert.ok(car.x< -2.5&&car.x> -4.2);const stopped=car.x;
 for(let i=0;i<120;i++)updateCityTraffic([car],1/60,16+i/60);assert.ok(car.x>stopped+2);
 const lead={...car,x:car.x+3,z:car.z,phase:'idle',body:null,traffic:{city:false}},before=car.x;updateCityTraffic([car,lead],1/60,0);assert.ok(car.x-before<.02);
});
test('people patrol, flee along sidewalks, use alternating gait phases and stop moving during capture',()=>{
 const r=new DistrictRun(),o=r.people[0],start={x:o.x,z:o.z};r.player.x=r.player.z=50;
 updatePeople([o],1/60,0,r.player);assert.ok(Math.hypot(o.x-start.x,o.z-start.z)>0);assert.ok(o.walker.gait>0);
 r.player.x=o.x-.2;r.player.z=o.z;for(let i=0;i<60;i++)updatePeople([o],1/60,1+i/60,r.player);assert.ok(o.walker.pace>1.9);
 assert.ok(o.x>=o.walker.path.left&&o.x<=o.walker.path.right&&o.z>=o.walker.path.top&&o.z<=o.walker.path.bottom);
 o.phase='contact';const frozen={x:o.x,z:o.z,gait:o.walker.gait};updatePeople([o],1,4,r.player);assert.deepEqual({x:o.x,z:o.z,gait:o.walker.gait},frozen);
 assert.equal(r.people.length,24);assert.equal(r.people.filter(o=>o.walker.crossing).length,4);assert.equal(r.traffic.length,16);assert.equal(new ArenaRun().people.length,0);
});
test('ground compensation keeps the lowest shoe at its standing plane through both strides',()=>{
 for(const pace of[0,1,1.4,2])for(let phase=0;phase<Math.PI*2;phase+=.05){const angle=Math.sin(phase)*.7*Math.min(pace,1.4),low=.71-.69*Math.cos(angle)-.19*Math.abs(Math.sin(angle));assert.ok(Math.abs(low+footLift(phase,pace)-.02)<1e-10);}
});
test('junction signals have amber and all-red clearance; opposing traffic never has simultaneous green',()=>{
 assert.deepEqual([0,6,7,8,14,15,16].map(t=>[signalState(t,'x'),signalState(t,'z')]),[['green','red'],['amber','red'],['red','red'],['red','green'],['red','amber'],['red','red'],['green','red']]);
 for(let t=0;t<100;t+=.05)assert.ok(!(signalState(t,'x')==='green'&&signalState(t,'z')==='green'));
 const r=new DistrictRun();assert.equal(r.objects.filter(o=>o.signal).length,5);assert.equal(r.objects.filter(o=>o.type==='lamp').length,16);
 const person=r.people.find(o=>o.walker.crossing);person.phase='idle';person.body=null;
 const car=r.traffic[0],t=car.traffic;t.distance=19;Object.assign(car,cityPose(19,CITY_ROUTES[0]));person.x=car.x+2.5;person.z=car.z;const before=car.x;updateCityTraffic([car],1/60,0,[person]);assert.ok(car.x-before<.03);
});
