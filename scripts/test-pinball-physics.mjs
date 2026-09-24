import assert from 'node:assert/strict';
import {initPhysics,PinballPhysics} from '../games/pinball/rebuild/physics.js';
await initPhysics();
// Return lanes behind both slings must feed a resting flipper without a rear kick.
for(const x of [-2.8,2.32])for(const speed of [0,3,6]){
 let flipper=false,slings=0;const lane=new PinballPhysics(e=>{if(e.type==='flipper')flipper=true;if(e.type==='sling')slings++;});
 lane.addBall(x,6,{x:0,y:0,z:-speed});for(let i=0;i<720;i++)lane.tick();
 assert.ok(flipper,'inlane must reach flipper '+x+' speed '+speed);assert.equal(slings,0,'rear sling must be passive');lane.dispose();
}
console.log('PASS: both inlanes feed resting flippers at three entry speeds without sling kicks.');
let events=[],p;
p=new PinballPhysics((e,b)=>{events.push(e.type);if(e.type==='drain')p.removeBall(b);});
// A served ball must remain in the shooter lane while the player reads the rules.
let ball=p.addBall();for(let i=0;i<240*10;i++)p.tick();assert.equal(p.balls.length,1);assert.ok(ball.body.translation().z>.8);
p.launch(ball,.8);for(let i=0;i<240*8;i++){p.setFlipper(0,i%150<50);p.setFlipper(1,i%180<60);p.tick();}
assert.ok(events.includes('skill')||events.includes('bumper')||events.includes('target'),'launch must reach the actual table');
// Fast, repeatable impacts directly at both flippers. CCD must register the contact.
let contacts=0;const cases=10000;
for(let i=0;i<cases;i++){
 p.clear();events=[];p.setFlipper(i%2,true);for(let j=0;j<25;j++)p.tick();
 const x=i%2?1.25:-1.25;ball=p.addBall(x,3.85,{x:0,y:0,z:-25});
 for(let j=0;j<18;j++)p.tick();if(events.includes('flipper'))contacts++;
 for(const b of p.balls){const v=b.body.translation();assert.ok(Number.isFinite(v.x+v.y+v.z));assert.ok(v.y>-.1,'ball tunneled through playfield');}
}
assert.ok(contacts>=cases*.995,'moving-flipper collision reliability: '+contacts+'/'+cases);
console.log('PASS: shooter dwell, launch-to-playfield, '+contacts+'/'+cases+' high-speed flipper contacts.');
p.dispose();
for(const speed of [23,25,27]){
 let completions=0,returnFeed=false;p=new PinballPhysics((e,b)=>{if(e.type==='ramp'&&b.rampTransit&&b.body.linvel().z<0)completions++;if(completions&&e.type==='flipper')returnFeed=true;if(e.type==='drain')p.removeBall(b);});
 p.addBall(2.15,7.2,{x:0,y:0,z:speed});for(let i=0;i<240*12;i++)p.tick();assert.ok(completions>0,'ramp must complete at speed '+speed);assert.ok(returnFeed,'ramp exit must feed a flipper');p.dispose();
}
console.log('PASS: three ramp approach speeds traverse the raised loop and exit into play.');
// Thirty simulated minutes with three balls; drains recycle without accumulating bodies.
let drains=0,stuck=0;
p=new PinballPhysics((e,b)=>{if(e.type==='drain'){p.removeBall(b);drains++;}if(e.type==='shooter-return')p.launch(b,.8);if(e.type==='stuck'){stuck++;b.body.setLinvel({x:b.body.translation().x>0?-2:2,y:.2,z:5},true);}});
for(let tick=0;tick<240*1800;tick++){
 while(p.balls.length<3){const b=p.addBall();p.launch(b,.6+(drains%4)*.1);}
 p.setFlipper(0,tick%130<50);p.setFlipper(1,tick%173<65);p.tick();
 if(tick%2400===0){assert.equal(p.balls.length<=3,true);for(const b of p.balls){const v=b.body.translation();assert.ok(Number.isFinite(v.x+v.y+v.z));}assert.ok(p.cooldowns.size<=256);}
}
assert.ok(stuck<=2,'excessive stuck-ball recovery: '+stuck);
console.log('PASS: 30 simulated minutes, three balls, '+drains+' drains, '+stuck+' automatic recoveries; bounded collision state.');p.dispose();
