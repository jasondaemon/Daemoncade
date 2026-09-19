import test from 'node:test';import assert from 'node:assert/strict';
import {integrateHandling,cornerLimit} from './handling.js';
import {Run} from './rules.js';
test('unsteered car keeps its heading and leaves a bend instead of following it',()=>{
 const p={x:0,z:0,speed:40};let contacts=0;
 for(let i=0;i<180;i++)contacts+=integrateHandling(p,1/60,0,.006,1)?1:0;
 assert.ok(contacts>0);assert.ok(p.x<-.9);
});
test('appropriate steering holds a constant-radius turn',()=>{
 const steer=.006*40/(.85*40/48),p={x:0,z:0,speed:40,steering:steer};
 for(let i=0;i<180;i++)integrateHandling(p,1/60,steer,.006,1);
 assert.ok(Math.abs(p.x)<.12);
});
test('grip limits yaw at speed and improved tires increase corner capacity',()=>{
 const a={x:0,z:0,speed:65},b={...a};integrateHandling(a,.1,1,0,1);integrateHandling(b,.1,1,0,1.3);
 assert.equal(a.slipping,true);assert.ok(b.headingError>a.headingError);
 assert.ok(cornerLimit(.01,1.3)>cornerLimit(.01,1));
});
test('stationary steering does not translate or rotate the car',()=>{
 const p={x:0,z:0,speed:0};for(let i=0;i<60;i++)integrateHandling(p,1/60,1,.01);
 assert.equal(p.x,0);assert.equal(p.z,0);assert.equal(p.headingError,0);
});
test('release preserves heading instead of auto-centering the car',()=>{
 const p={x:0,z:0,speed:30,headingError:.15,steering:0};
 for(let i=0;i<30;i++)integrateHandling(p,1/60,0,0);
 assert.equal(p.headingError,.15);assert.ok(p.x>.1);
});
test('race lane targets cannot steer and barrier contact costs speed',()=>{
 const a=new Run({mode:'race'}),b=new Run({mode:'race'});
 for(const r of [a,b]){r.phase='playing';r.player.speed=40;r.rivals=[];}
 a.update(1/60,{throttle:true,targetX:1});b.update(1/60,{throttle:true});
 assert.equal(a.player.x,b.player.x);
 a.player.x=1.31;a.update(1/60,{throttle:true});
 assert.equal(a.collisions,1);assert.ok(a.player.speed<25);assert.equal(a.player.x,1.3);
});
test('upgraded brakes reduce speed faster and shoulders slow the car',()=>{
 const base=new Run({mode:'race'}),up=new Run({mode:'race'}),edge=new Run({mode:'race'});
 for(const r of [base,up,edge]){r.phase='playing';r.player.speed=45;r.rivals=[];r.car={brake:1};}
 up.car.brake=1.3;edge.player.x=1;
 base.update(.1,{brake:true});up.update(.1,{brake:true});edge.update(.1,{throttle:true});
 assert.ok(up.player.speed<base.player.speed);assert.ok(edge.player.speed<45);
});
test('normal grip can hold a tight bend that previously saturated steering',()=>{
 const speed=40,curve=.014,steer=curve*speed/(.85*speed/(speed+8));
 const p={x:0,z:0,speed,steering:steer};
 for(let i=0;i<180;i++)integrateHandling(p,1/60,steer,curve);
 assert.ok(Math.abs(p.x)<.15);assert.equal(p.slipping,false);
});
test('drift adds rotation, costs speed, and releases smoothly',()=>{
 const normal={x:0,z:0,speed:40,steering:.7},drift={...normal};
 for(let i=0;i<20;i++){integrateHandling(normal,1/60,.7,0);integrateHandling(drift,1/60,.7,0,1,true);}
 assert.ok(drift.headingError>normal.headingError);assert.ok(drift.speed<normal.speed);
 assert.ok(drift.slipping);assert.ok(drift.drifting);
 const amount=drift.driftAmount;integrateHandling(drift,1/60,0,0,1,false);
 assert.equal(drift.drifting,false);assert.ok(drift.driftAmount<amount&&drift.driftAmount>0);
});
test('drift works with no nitro upgrade or reserve and does not activate boost',()=>{
 const r=new Run({mode:'race'});r.phase='playing';r.player.speed=30;r.rivals=[];r.car={boost:0};r.boost=0;
 r.update(1/60,{throttle:true,steer:1,drift:true});
 assert.equal(r.player.drifting,true);assert.equal(r.boosting,false);
});
