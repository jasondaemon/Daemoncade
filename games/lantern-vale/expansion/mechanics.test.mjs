import test from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../campaign.mjs';
import {campaign} from './dungeons.mjs';
rules.installExpansion(campaign);
function fixture(d){const s=rules.fresh();s.room=302+d*12;s.visited.push(s.room);s.inv=10000;const p=rules.roomInfo(s.room).puzzles[0];return {s,p,v:()=>s.expandedPuzzles[p.id]};}
function hold(s,at,light,seconds=.7,facing=1){s.x=at[0];s.y=at[1];if(s.light!==light)rules.toggle(s);rules.step(s,{x:facing},0);for(let n=0;n<Math.ceil(seconds/.02);n++)rules.step(s,{},.02);}
test('roots require growth then banking; numeric matching alone cannot solve regional circuits',()=>{
 for(let d=0;d<9;d++){const {s,p}=fixture(d);for(const c of p.controls){s.x=c.at[0];s.y=c.at[1];for(let n=0;n<c.target;n++)rules.interact(s);}hold(s,p.source,!p.shade,p.seconds+.1);assert.ok(!s.events.includes(p.id));}
 const {s,p,v}=fixture(0);hold(s,p.controls[0].at,false);assert.equal(v().marks[0],0);hold(s,p.controls[0].at,true);assert.equal(v().marks[0],0);hold(s,p.controls[0].at,false,.04);assert.equal(v().marks[0],1);
});
test('currents must be stilled before reflections can be carried; facets require opposed facing',()=>{
 const a=fixture(1);hold(a.s,a.p.controls[0].at,true);assert.equal(a.v().marks[0],0);hold(a.s,a.p.source,false);hold(a.s,a.p.controls[0].at,true);assert.equal(a.v().marks[0],1);
 const b=fixture(2);hold(b.s,b.p.controls[0].at,true,.7,-1);assert.equal(b.v().marks[0],0);hold(b.s,b.p.controls[0].at,true);assert.equal(b.v().marks[0],1);hold(b.s,b.p.controls[1].at,true);assert.equal(b.v().marks[1],0);hold(b.s,b.p.controls[1].at,true,.7,-1);assert.equal(b.v().marks[1],1);
});
test('furnace reheats shutters; frost thaws only the near mirror and refreezes distant mirrors',()=>{
 const a=fixture(3);hold(a.s,a.p.controls[0].at,false);assert.equal(a.v().marks[0],1);hold(a.s,a.p.controls[0].at,true);assert.equal(a.v().marks[0],0);
 const b=fixture(5);hold(b.s,b.p.controls[0].at,false);assert.equal(b.v().marks[0],0);hold(b.s,b.p.controls[0].at,true);assert.equal(b.v().marks[0],1);hold(b.s,b.p.controls[1].at,false);assert.equal(b.v().marks[1],1);hold(b.s,b.p.controls[1].at,true);assert.equal(b.v().marks[1],0);hold(b.s,b.p.controls[1].at,false);assert.equal(b.v().marks[1],1);
});
test('wind shelter expires and can be renewed; echoes consume one carried voice per listener',()=>{
 const a=fixture(4);hold(a.s,a.p.controls[0].at,false);assert.equal(a.v().marks[0],0);hold(a.s,a.p.source,true);hold(a.s,[3.5,5.5],false,21);hold(a.s,a.p.controls[0].at,false);assert.equal(a.v().marks[0],0);hold(a.s,a.p.source,true);hold(a.s,a.p.controls[0].at,false);assert.equal(a.v().marks[0],1);
 const b=fixture(7);hold(b.s,b.p.source,true);hold(b.s,b.p.controls[0].at,false);assert.equal(b.v().marks[0],1);assert.equal(b.v().reserve,0);hold(b.s,b.p.controls[1].at,false);assert.equal(b.v().marks[1],0);hold(b.s,b.p.source,true);hold(b.s,b.p.controls[1].at,false);assert.equal(b.v().marks[1],1);
});
test('clock rejects wrong order, requires shade rest, and regional progress validates on reload',()=>{
 const {s,p,v}=fixture(6);hold(s,p.controls[1].at,false,.02);rules.interact(s);assert.deepEqual(v().marks,[0,0]);
 for(const c of p.controls){hold(s,c.at,false,.02);rules.interact(s);}assert.deepEqual(v().marks,[1,1]);hold(s,p.source,true,p.seconds+.1);assert.ok(!s.events.includes(p.id));hold(s,p.source,false);assert.equal(v().rest,.6);
 const puzzleRoom=s.room;s.room=379;s.visited.push(379);const restored=rules.decode(rules.encode(s));assert.ok(restored);assert.deepEqual(restored.expandedPuzzles[p.id],v());restored.room=puzzleRoom;hold(restored,p.source,true,p.seconds+.1);assert.ok(restored.events.includes(p.id));
 for(const mutate of [v=>v.marks=[2,0],v=>v.dwell=[-1,0],v=>v.reserve=21,v=>v.rest=1]){const data=JSON.parse(rules.encode(s));mutate(data.expansion.puzzles[p.id]);assert.equal(rules.decode(JSON.stringify(data)),null);}
 s.room=puzzleRoom;assert.equal(rules.resetPuzzle(s,p.id),true);assert.equal(s.expandedPuzzles[p.id],undefined);
});
test('aurora weave requires alternating colors in order and recovers after wrong light',()=>{
 const {s,p,v}=fixture(8);hold(s,p.controls[1].at,false);assert.deepEqual(v().marks,[0,0]);hold(s,p.controls[0].at,true);hold(s,p.controls[1].at,true);assert.deepEqual(v().marks,[0,0]);hold(s,p.controls[0].at,true);hold(s,p.controls[1].at,false);assert.deepEqual(v().marks,[1,1]);hold(s,p.source,true,p.seconds+.1);assert.ok(s.events.includes(p.id));
});
