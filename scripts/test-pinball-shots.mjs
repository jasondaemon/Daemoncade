import assert from 'node:assert/strict';
import {initPhysics,PinballPhysics} from '../games/pinball/rebuild/physics.js';
await initPhysics();
const coverage=new Set(),success=[0,0],traps=[];
for(const speed of [2,3,4])for(const side of [0,1])for(let delay=150;delay<=450;delay+=8){
 let high=0;const p=new PinballPhysics((e,b)=>{if(e.type==='ramp'&&(!b.rampTransit||b.body.linvel().z>=0))return;if(['ramp','target','scoop','mode-scoop','spinner','orbit','bumper'].includes(e.type))coverage.add(e.type+(e.type==='ramp'?e.id:''));});
 const b=p.addBall(side?2.5:-3.1,6.8,{x:0,y:0,z:-speed});
 for(let i=0;i<1800;i++){p.setFlipper(side,i>=delay&&i<delay+55);p.tick();if(i>=delay)high=Math.max(high,b.body.translation().z);}
 if(high>10)success[side]++;if(high<4.5&&b.body.translation().z>2&&b.body.translation().z<4.5)traps.push({side,delay});p.dispose();
}
console.log({coverage:[...coverage],success,traps});
assert.ok(success.every(n=>n>=5),'each inlane needs a usable shot timing window');
assert.equal(traps.length,0,'a missed timing must not leave a heel trap');
for(const feature of ['ramp0','ramp1','target','scoop','mode-scoop','spinner','orbit','bumper'])assert.ok(coverage.has(feature),'unreachable objective: '+feature);
