import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {ArenaRun} from './arena.js';
import {CITY_ROUTES,cityPose,routeLength,updateCityTraffic} from './city-life.js';
import {prepareJunctions,liveSignal,hazardSpeed,escapeFactor,crossingWait} from './city-encounters.js';
import {signalState} from './junctions.js';
function fixture(){const r=new DistrictRun({free:true}),car=r.traffic[0];car.traffic.distance=19;Object.assign(car,cityPose(19,CITY_ROUTES[0]));r.cityEncounter.traffic=[car];r.player.x=r.player.z=50;return {r,car,context:r.cityEncounter};}

test('drivers stop before the hole, queue behind one another, and resume when it leaves',()=>{
 const {r,car,context}=fixture(),other=structuredClone(car);other.id=999;other.traffic.distance=14;Object.assign(other,cityPose(14,CITY_ROUTES[0]));const cars=[car,other];context.traffic=cars;
 r.player.x=4;r.player.z=car.z;
 for(let i=0;i<360;i++)updateCityTraffic(cars,1/60,0,[],context);
 assert.ok(car.traffic.waiting&&other.traffic.waiting);assert.ok(Math.hypot(car.x-r.player.x,car.z-r.player.z)>r.player.radius+car.radius);assert.ok(car.x-other.x>2.7);
 const positions=cars.map(o=>o.x);r.player.x=r.player.z=50;
 for(let i=0;i<240;i++)updateCityTraffic(cars,1/60,0,[],context);
 cars.forEach((o,i)=>assert.ok(o.x>positions[i]+3));
});
test('drivers flee a hole behind, but nearby holes across a different lane do not stop them',()=>{
 const {r,car}=fixture();r.player.x=car.x-2;r.player.z=car.z;assert.ok(escapeFactor(car,r.player)>1);assert.equal(hazardSpeed(car,r.player),Infinity);
 r.player.x=car.x+3;r.player.z=car.z+8;assert.equal(hazardSpeed(car,r.player),Infinity);assert.equal(escapeFactor(car,r.player),1);
});
test('a swallowed signal releases its red junction rather than leaving an invisible red light',()=>{
 const {r,car,context}=fixture();const signal=liveSignal(context,0,-24);assert.ok(signal);
 for(let i=0;i<180;i++)updateCityTraffic([car],1/60,8,[],context);const stopped=car.x;assert.ok(car.traffic.waiting);
 r.consume(r,signal);assert.equal(liveSignal(context,0,-24),undefined);
 for(let i=0;i<120;i++)updateCityTraffic([car],1/60,8,[],context);assert.ok(car.x>stopped+4);assert.equal(r.counts.clutter,1);
});
test('uncontrolled junction reservations release on capture and departure, with deterministic ordering',()=>{
 const car=(id,x,z,yaw)=>({id,x,z,yaw,radius:1.35,phase:'idle',traffic:{city:true,stopped:false}}),a=car(1,-5,-25.1,Math.PI/2),b=car(2,1.1,-29,0),context={player:{x:50,z:50,radius:1.2},signals:[],slots:new Map()};
 prepareJunctions([b,a],context);assert.equal(context.slots.get('0:-24').owner,1);
 a.phase='consumed';prepareJunctions([a,b],context);assert.equal(context.slots.get('0:-24').owner,2);
 b.z=-23;prepareJunctions([a,b],context);assert.equal(context.slots.get('0:-24').entered,true);
 b.z=-16;prepareJunctions([a,b],context);assert.equal(context.slots.has('0:-24'),false);
});
test('uncontrolled pedestrians wait for actual traffic gaps, not a missing signal',()=>{
 const {r,car,context}=fixture(),crossing={at:0,z:33.8};assert.equal(crossingWait(crossing,8,signalState,context),true);
 r.consume(r,liveSignal(context,0,28));assert.equal(crossingWait(crossing,8,signalState,context),false);
 car.x=1.1;car.z=33;assert.equal(crossingWait(crossing,8,signalState,context),true);car.phase='consumed';assert.equal(crossingWait(crossing,8,signalState,context),false);
});
test('the encounter is isolated from Arena and other worlds',()=>{
 assert.equal(new ArenaRun().cityEncounter,null);assert.equal(new DistrictRun({world:'deep'}).cityEncounter,null);
 const r=new DistrictRun();assert.equal(r.cityEncounter.signals.length,5);assert.equal(r.total,240);assert.equal(r.traffic.length,16);assert.ok(r.cityEncounter.signals.every(o=>o.junction));
});
test('ten-minute traffic soaks keep every driver moving, with signals present or swallowed',()=>{
 for(const remove of[false,true]){
  const r=new DistrictRun({free:true});r.player.x=r.player.z=50;if(remove)for(const signal of r.cityEncounter.signals)r.consume(r,signal);
  const distances=r.traffic.map(()=>0),idle=r.traffic.map(()=>0),longest=r.traffic.map(()=>0);
  for(let tick=0;tick<600*60;tick++){
   const before=r.traffic.map(o=>o.traffic.distance);r.step(1/60,{x:0,y:0});r.events.length=0;
   r.traffic.forEach((o,i)=>{let d=o.traffic.distance-before[i];if(d<0)d+=routeLength(CITY_ROUTES[o.traffic.route]);distances[i]+=d;idle[i]=d<.001?idle[i]+1/60:0;longest[i]=Math.max(longest[i],idle[i]);});
  }
  assert.ok(distances.every(d=>d>700),JSON.stringify({remove,distances}));assert.ok(longest.every(t=>t<30),JSON.stringify({remove,longest}));
 }
});
