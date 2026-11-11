import {prepareRegional} from './puzzle-walk.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../campaign.mjs';
import {adventure} from './adventure.mjs';
import {dungeonDefinitions} from './dungeons.mjs';
const {fresh,step,attack,toggle,potion,interact,encode,decode,entrances}=core;
core.installExpansion(adventure);
let simulatedSeconds=0;
const rules={...core,step(s,input,dt){
 if(s.hp<=6)core.potion(s);
 const enemy=s.enemies[s.room].find(e=>e.hp>0&&!e.boss&&Math.hypot(e.x-s.x,e.y-s.y)<1.8);
 if(enemy){core.step(s,{x:enemy.x-s.x,y:enemy.y-s.y},0);core.attack(s);}
 core.step(s,input,dt);simulatedSeconds+=dt;
 assert.equal(s.status,'playing',`${s.room}: ${s.message} hp ${s.hp}`);
}};
const wait=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds/.04);i++)rules.step(s,{},.04);};
function walk(s,at){
 const goal=at.map(Math.floor),start=[Math.floor(s.x),Math.floor(s.y)];
 const key=p=>p.join(','),queue=[start],prev=new Map([[key(start),null]]);
 for(let i=0;i<queue.length&&!prev.has(key(goal));i++){
  const p=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const q=[p[0]+dx,p[1]+dy];
   if(q[0]<1||q[0]>14||q[1]<1||q[1]>8||prev.has(key(q))||!rules.canStand(s,q[0]+.5,q[1]+.5))continue;
   prev.set(key(q),p);queue.push(q);
  }
 }
 assert.ok(prev.has(key(goal)),`${s.room}: no footprint path from ${start} to ${at}`);
 const path=[];for(let p=goal;p&&key(p)!==key(start);p=prev.get(key(p)))path.unshift([p[0]+.5,p[1]+.5]);
 for(const p of [...path,at]){for(let i=0;i<35&&Math.hypot(s.x-p[0],s.y-p[1])>.055;i++)rules.step(s,{x:p[0]-s.x,y:p[1]-s.y},.02);
  assert.ok(Math.hypot(s.x-p[0],s.y-p[1])<.08,`${s.room}: movement stalled at ${s.x},${s.y} en route to ${p}`);}
}
function cross(s,direction){const from=s.room,to=rules.roomInfo(from).exits[direction];assert.notEqual(to,undefined);
 const at=({east:[14.5,5.5],west:[1.5,5.5],north:[8.5,1.5],south:[8.5,8.5]})[direction];walk(s,at);
 const [x,y]=({east:[1,0],west:[-1,0],north:[0,-1],south:[0,1]})[direction];
 for(let i=0;i<20&&s.room===from;i++)rules.step(s,{x,y},.04);
 assert.equal(s.room,to,`failed ${from} ${direction}`);
 // Center the entry tile before BFS to avoid corner clipping.
 const center=[Math.max(1.5,Math.min(14.5,Math.floor(s.x)+.5)),Math.max(1.5,Math.min(8.5,Math.floor(s.y)+.5))];
 for(let i=0;i<30&&Math.hypot(s.x-center[0],s.y-center[1])>.055;i++)rules.step(s,{x:center[0]-s.x,y:center[1]-s.y},.02);
}
function solve(s){for(const p of rules.roomInfo(s.room).puzzles){
 if(p.mechanic)prepareRegional(s,p,{rules,walk,wait});
 else for(const [ci,c] of p.controls.entries()){walk(s,c.at);const current=s.expandedPuzzles[p.id]?.controls[ci]||0;for(let i=0;i<(c.target-current+c.states)%c.states;i++)rules.interact(s);}
 walk(s,p.source);if(s.light===Boolean(p.shade))core.toggle(s);wait(s,p.seconds+.1);assert.ok(s.events.includes(p.id),p.id);if(!s.light)core.toggle(s);
}}
function collect(s,id){const r=rules.roomInfo(s.room).rewards.find(r=>r.id===id);walk(s,r.at);rules.interact(s);assert.ok(s.events.includes(id),id);}


test('shipped adventure: uninterrupted legacy route, nine depths, earned tools, reloads and resolution',()=>{
let s=fresh(),ticks=0;
 function tick(input){if(s.hp<=5)potion(s);const e=s.enemies[s.room].filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];if(e){step(s,{x:e.x-s.x,y:e.y-s.y},0);attack(s);}step(s,input,1/60);assert.equal(s.status,'playing',`${s.room}: ${s.message}`);assert.ok(++ticks<90000);}
 function go(x,y){for(let i=0;i<3000&&Math.hypot(s.x-x,s.y-y)>.07;i++)tick({x:Math.abs(x-s.x)>.04?Math.sign(x-s.x):0,y:Math.abs(y-s.y)>.04?Math.sign(y-s.y):0});assert.ok(Math.hypot(s.x-x,s.y-y)<.1,`blocked room ${s.room} at ${s.x},${s.y} toward ${x},${y}`);}
 function east(){go(14.5,5.5);const old=s.room;while(s.room===old)tick({x:1});go(1.5,5.5);}
 function west(){go(1.5,5.5);const old=s.room;while(s.room===old)tick({x:-1});if(s.room>=15)go(14.5,5.5);}
 function south(){go(8.5,5.5);go(8.5,8.5);const old=s.room;while(s.room===old)tick({y:1});go(8.5,1.5);go(8.5,5.5);}
 function north(){go(8.5,5.5);go(8.5,1.5);const old=s.room;while(s.room===old)tick({y:-1});go(8.5,8.5);go(8.5,5.5);}
 function camp(){go(3.5,5.5);assert.equal(interact(s),'save');s=decode(encode(s));assert.ok(s);}
 function delve(d){go(12.5,5.5);go(12.5,2.5);assert.equal(interact(s),true);assert.equal(s.room,15+d*4);if(!s.light)toggle(s);east();go(12.5,5.5);assert.ok(s.switches.includes(d));east();go(8.5,5.5);for(let i=0;i<1000&&!s.keys.includes(d);i++)tick({});assert.ok(s.keys.includes(d));east();go(10.5,5.5);for(let i=0;i<1000&&s.enemies[s.room].some(e=>e.hp>0);i++)tick({});go(12.5,5.5);assert.ok(s.relics.includes(d));west();west();west();west();assert.equal(s.room,entrances[d]);go(12.5,5.5);camp();}
 go(8.5,5.5);south();east();camp();delve(0);east();east();camp();delve(1);south();east();camp();delve(2);west();west();if(!s.light)toggle(s);go(11.5,2.5);north();go(11.5,2.5);north();go(5.5,6.5);interact(s);east();go(3.5,2.5);assert.ok(s.events.includes('reed-disc'));assert.equal(core.secondary(s),true);east();go(12.5,5.5);if(!s.light)toggle(s);assert.equal(interact(s),true);assert.equal(s.status,'won');assert.equal(s.sword,3);assert.equal(fresh().relics.length,0);assert.equal(fresh().status,'playing');
 assert.equal(core.continueAdventure(s,30),true);
 function travel(target){
  const queue=[s.room],prev=new Map([[s.room,null]]);
  for(let i=0;i<queue.length&&!prev.has(target);i++){
   const r=core.roomInfo(queue[i]);
   for(const [dir,to] of Object.entries(r.exits))if(!prev.has(to)){prev.set(to,{from:r.id,dir});queue.push(to);}
   for(const link of r.links||[])if(link.to<300&&!prev.has(link.to)){prev.set(link.to,{from:r.id,link});queue.push(link.to);}
  }
  assert.ok(prev.has(target),`no route to ${target}`);
  const path=[];for(let id=target;id!==s.room;){const p=prev.get(id);path.unshift(p);id=p.from;}
  for(const p of path){if(p.link){walk(s,p.link.at);core.interact(s);}else cross(s,p.dir);}
  assert.equal(s.room,target);
 }
 for(let d=0;d<9;d++){
  const def=dungeonDefinitions[d],base=300+d*12;
  const portal=adventure.rooms.flatMap(r=>(r.links||[]).filter(l=>l.to===base).map(l=>({room:r.id,...l})))[0];
  travel(portal.room);walk(s,portal.at);core.interact(s);assert.equal(s.room,base);
  cross(s,'east');collect(s,`${def.id}-map`);cross(s,'east');solve(s);
  cross(s,'south');solve(s);cross(s,'west');cross(s,'south');collect(s,`${def.id}-equipment`);
  const tool=core.roomInfo(s.room).rewards.find(r=>r.id===`${def.id}-equipment`).equipment;
  assert.ok(s.equipment.includes(tool));cross(s,'east');
  walk(s,[12.5,2.5]);core.interact(s);assert.equal(s.room,base+6);walk(s,[5.5,7.5]);cross(s,'south');cross(s,'west');
  walk(s,[3.5,5.5]);assert.equal(core.interact(s),'save');s=core.decode(core.encode(s));assert.ok(s);
  cross(s,'east');solve(s);cross(s,'east');collect(s,`${def.id}-secret`);cross(s,'south');
  const boss=s.enemies[s.room][0];
  // Approach with the lantern lowered, then fight through real tells/recovery.
  if(s.light)core.toggle(s);walk(s,[10.5,5.5]);core.toggle(s);
  for(let tries=0;tries<6000&&boss.hp>0;tries++){
   const dx=boss.x-s.x,dy=boss.y-s.y,dist=Math.hypot(dx,dy);
   if(boss.phase==='recover'){
    rules.step(s,dist>1.1?{x:dx,y:dy}:{},.04);
    core.step(s,{x:dx,y:dy},0);core.attack(s);
   }else rules.step(s,{},.04);
  }
  assert.equal(boss.hp,0,def.boss);collect(s,`${def.id}-depths-cleared`);
  cross(s,'west');cross(s,'north');walk(s,[3.5,5.5]);assert.equal(core.interact(s),'save');
  const snapshot=core.encode(s);s=core.decode(snapshot);assert.ok(s);assert.equal(s.enemies[base+10][0].hp,0);assert.ok(s.equipment.includes(tool));
  cross(s,'south');walk(s,[12.5,7.5]);core.interact(s);assert.equal(s.room,base);
  walk(s,[2.5,5.5]);core.interact(s);
 }
 // Sweep every authored expansion scene through the same movement graph.
 for(const room of adventure.rooms.filter(r=>r.kind==='overworld')){
  travel(room.id);if(!s.light)core.toggle(s);
  if(room.checkpoint){walk(s,room.checkpointAt);assert.equal(core.interact(s),'save');}
  solve(s);
  for(const gift of room.rewards||[])if(!gift.clear){walk(s,gift.at);core.interact(s);}
 }
 assert.equal(adventure.rooms.filter(r=>r.kind==='overworld'&&s.visited.includes(r.id)).length,126);
 travel(47);walk(s,[3.5,5.5]);assert.equal(core.interact(s),'save');s=core.decode(core.encode(s));assert.ok(s);
 walk(s,[8.5,7.5]);if(!s.light)core.toggle(s);core.interact(s);
 assert.equal(adventure.rooms.filter(r=>r.kind==='dungeon'&&s.visited.includes(r.id)).length,108);
 assert.equal(s.status,'won');assert.equal(s.expandedEnding,true);assert.equal(s.relics.length,3);assert.equal(s.seals.length,9);
 console.log(`Automated expanded traversal: ${simulatedSeconds.toFixed(1)} simulation seconds; not a human play session.`);
});
