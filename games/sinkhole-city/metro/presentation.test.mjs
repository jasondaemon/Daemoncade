import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three/three.module.min.js';
import {surfaceColor,openingProgress} from './surfaces.js';
import {LocalPulses} from './presentation.js';
import {chooseGuidance,guidancePin} from './guidance.js';
import {DistrictRun} from './simulation.js';
import {ALIEN_CONTRACTS,ORBIT_CONTRACTS,DEEP_CONTRACTS} from './worlds.js';

test('planet direction-space surfaces are deterministic, varied, finite and continuous across the texture meridian',()=>{
 for(const variant of['ocean','desert','ice','ringed','sun']){
  const colors=new Set();for(let i=0;i<200;i++){
   const a=i*2.39996,y=-1+i/100,r=Math.sqrt(1-y*y),x=Math.cos(a)*r,z=Math.sin(a)*r,c=surfaceColor(variant,x,y,z);
   assert.ok(c.every(n=>Number.isFinite(n)&&n>=0&&n<=1));assert.deepEqual(c,surfaceColor(variant,x,y,z));colors.add(c.map(n=>n.toFixed(2)).join(','));
  }
  assert.ok(colors.size>30);const a=surfaceColor(variant,1,0,-1e-7),b=surfaceColor(variant,1,0,1e-7);assert.ok(a.every((n,i)=>Math.abs(n-b[i])<.0001));
 }
});
test('pod opening is simulation-timed, bounded and immediate under reduced motion',()=>{
 const o={charged:true,openedAt:10};assert.equal(openingProgress(o,9),0);assert.equal(openingProgress(o,10),0);assert.ok(openingProgress(o,10.3)>0&&openingProgress(o,10.3)<1);assert.equal(openingProgress(o,11),1);assert.equal(openingProgress(o,10,true),1);assert.equal(openingProgress({charged:false},100),0);
});
test('local pulse effects stay pooled, expire, freeze on pause and suppress on low/reduced effects',()=>{
 const scene=new THREE.Scene(),pulses=new LocalPulses(scene);assert.equal(scene.children.length,8);
 for(let i=0;i<100;i++)pulses.add(i,0,10,4);assert.equal(scene.children.length,8);pulses.update(10.3,false);assert.equal(pulses.items.filter(i=>i.mesh.visible).length,8);
 const snapshot=pulses.items.map(i=>[i.mesh.scale.x,i.mesh.material.opacity]);pulses.update(10.3,false);assert.deepEqual(pulses.items.map(i=>[i.mesh.scale.x,i.mesh.material.opacity]),snapshot);
 pulses.update(11,false);assert.ok(pulses.items.every(i=>!i.mesh.visible));pulses.add(0,0,12);pulses.update(12.1,true);assert.ok(pulses.items.every(i=>!i.mesh.visible));
});
test('guidance respects sealed objectives, fit gates and actual contract prerequisites',()=>{
 for(const contract of[ALIEN_CONTRACTS[2],ORBIT_CONTRACTS[2],DEEP_CONTRACTS[1]]){
  const run=new DistrictRun({contract}),initial=chooseGuidance(run);assert.ok(run.eligible(initial.object));assert.equal(initial.reason,'Grow');
  run.player.radius=5;const grown=chooseGuidance(run);assert.equal(grown.reason,'Collect');assert.ok(['resonator','planet','wreck'].includes(grown.object.type));
  grown.object.phase='consumed';assert.notEqual(chooseGuidance(run,grown.object).object,grown.object);
 }
});
test('offscreen guide pins stay inside the usable mobile region with finite bearings',()=>{
 for(const width of[320,360,430,932])for(const x of[-100,0,50,100,200])for(const y of[-100,0,57,100,200]){const p=guidancePin({x,y,visible:false},width);assert.ok(p.x>=9&&p.x<=91&&p.y>=35&&p.y<=79&&Number.isFinite(p.angle));assert.ok(p.x*width/100>=61&&(100-p.x)*width/100>=61);if(p.x>65)assert.ok(p.y<=65);assert.equal(p.edge,true);}
});
