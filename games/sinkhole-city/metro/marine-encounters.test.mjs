import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {dolphinRoll,MIGRATION_ROUTES} from './marine-encounters.js';

test('the living reef forms migrating pods and baitballs without eating or deleting any animals',()=>{
 const r=new DistrictRun({world:'deep',free:true});r.player.x=r.player.z=50;let baitballTicks=0,rolls=0;
 for(let i=0;i<90*60;i++){
  r.step(1/60,{x:0,y:0});r.events.length=0;
  if([...r.schools.values()].some(g=>g.behavior==='baitball'&&g.tightness<.7))baitballTicks++;
  if(r.marine.some(o=>o.type==='dolphin'&&Math.abs(Math.sin(o.swimRoll||0))>.8))rolls++;
 }
 assert.equal(r.marine.length,97);assert.ok(r.marine.every(o=>o.phase==='idle'));assert.equal(r.counts.marine,0);assert.ok(baitballTicks>300);assert.ok(rolls>30);
 for(const g of r.schools.values()){
  if(g.type==='whale'){assert.equal(g.behavior,'migrating');assert.ok(Number.isInteger(g.waypoint));}
  if(g.type==='shark')assert.equal(g.behavior,'hunting');
  if(g.type==='dolphin'){const leader=r.schools.get(g.leader);assert.equal(g.behavior,'escorting');assert.equal(leader.type,'whale');assert.ok(Math.hypot(g.x-leader.x,g.z-leader.z)<12);}
 }
});
test('captured or missing leaders/prey are not pursued as ghost targets; remaining creatures keep swimming',()=>{
 const r=new DistrictRun({world:'deep',free:true});r.player.x=r.player.z=50;
 for(const o of r.marine)if(['whale','fish'].includes(o.type))o.phase='consumed';
 for(let i=0;i<120;i++)r.step(1/60,{x:0,y:0});
 for(const g of r.schools.values())if(['dolphin','shark'].includes(g.type)){assert.equal(g.behavior,'foraging');assert.equal(g.leader,null);assert.ok(Number.isFinite(g.x+g.z));}
});
test('dolphin rolls remain rotationally continuous and all authored migration points stay inside the bay',()=>{
 for(const route of MIGRATION_ROUTES)for(const [x,z]of route)assert.ok(Math.abs(x)<40&&Math.abs(z)<40);
 for(const phase of[0,1,3,6]){let old=dolphinRoll(9,phase);for(let t=9+1/120;t<65;t+=1/120){const next=dolphinRoll(t,phase),delta=Math.atan2(Math.sin(next-old),Math.cos(next-old));assert.ok(Math.abs(delta)<.04);old=next;}}
});
