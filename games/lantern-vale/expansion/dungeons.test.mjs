import {prepareRegional} from './puzzle-walk.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../campaign.mjs';
import {campaign,dungeonDefinitions,dungeonEntrances,createDungeonCampaign} from './dungeons.mjs';
const legacy=JSON.stringify(rules.rooms);
rules.installExpansion(campaign);
const wait=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds/.04);i++)rules.step(s,{},.04);};
function state(room){const s=rules.fresh();s.room=room;s.x=2.5;s.y=5.5;s.light=true;s.maxHp=s.hp=40;s.inv=1e6;return s;}
// BFS uses the real player footprint; all traversal then uses the actual step()
// collision and transition rules. No coordinate assignment is used by walk().
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
 walk(s,p.source);s.light=!p.shade;wait(s,p.seconds+.1);assert.ok(s.events.includes(p.id),p.id);s.light=true;
}}
function collect(s,id){const r=rules.roomInfo(s.room).rewards.find(r=>r.id===id);walk(s,r.at);rules.interact(s);assert.ok(s.events.includes(id),id);}

test('nine 12-room branches install without changing stable rooms or exits',()=>{
 assert.equal(JSON.stringify(rules.rooms.slice(0,30)),legacy);assert.equal(campaign.rooms.length,108);assert.equal(new Set(campaign.rooms.map(r=>r.tiles.join("\n"))).size,108);
 for(let d=0;d<9;d++){
  const rs=campaign.rooms.filter(r=>r.dungeon===d);assert.equal(rs.length,12);assert.equal(new Set(rs.map(r=>r.tiles.join('\n'))).size,12);
  const seen=new Set(),q=[300+d*12];while(q.length){const id=q.shift();if(seen.has(id))continue;seen.add(id);q.push(...Object.values(rules.roomInfo(id).exits));}
  assert.equal(seen.size,12);assert.equal(rs.filter(r=>r.encounters.some(e=>e.boss)).length,1);
 }
 assert.deepEqual(dungeonEntrances.slice(0,3).map(e=>e.legacyRooms),[[15,16,17,18,27],[19,20,21,22,28],[23,24,25,26,29]]);
 const linked=createDungeonCampaign({returns:{'cinder-forge':{room:55,at:[5.5,5.5]}}});assert.equal(linked.rooms[36].links[0].to,55);
});

test('every authored object is reachable with real footprint movement and all rooms have retreat',()=>{
 for(const r of campaign.rooms){const s=state(r.id);s.events=campaign.rooms.filter(x=>x.dungeon===r.dungeon).flatMap(x=>x.puzzles.map(p=>p.id));s.equipment=[dungeonDefinitions[r.dungeon].equipment];
  for(const o of [...r.rewards,...r.characters,...r.links,...r.puzzles.flatMap(p=>[{at:p.source},...p.controls])])walk(s,o.at);
  for(const direction of Object.keys(r.exits)){const copy=structuredClone(s);cross(copy,direction);}
 }
});

test('nine full dungeon walks solve circuits, earn equipment, discover maps, save and return',()=>{
 for(const [d,def] of dungeonDefinitions.entries()){
  const base=300+d*12,s=state(base);s.keys=[0,1,2];s.relics=[0,1,2];const keys=[...s.keys];
  walk(s,[4.5,7.5]);rules.interact(s);assert.match(s.message,new RegExp(def.story.slice(0,4)));
  cross(s,'east');collect(s,`${def.id}-map`);cross(s,'east');solve(s);
  cross(s,'south');solve(s);cross(s,'west');cross(s,'south');collect(s,`${def.id}-equipment`);
  assert.ok(s.equipment.includes(def.equipment));cross(s,'east');
  assert.equal(s.room,base+7);walk(s,[3.5,5.5]);assert.equal(rules.interact(s),'save', `${s.room} ${s.status} ${s.message}`);assert.ok(rules.decode(rules.encode(s)),'refuge checkpoint must decode');
  cross(s,'east');solve(s);cross(s,'east');collect(s,`${def.id}-secret`);cross(s,'south');
  assert.equal(s.room,base+10);const boss=s.enemies[s.room][0];
  // Combat is tested separately below. Here walk to the reward before defeat,
  // proving it cannot be obtained merely by reaching the arena.
  walk(s,[12.5,2.5]);rules.interact(s);assert.ok(!s.events.includes(`${def.id}-depths-cleared`));
  // Finish via actual recovery-window sword attacks, preserving boss state rules.
  walk(s,[10.5,5.5]);s.sword=3;s.light=true;
  for(let tries=0;tries<3000&&boss.hp>0;tries++){
   if(boss.phase==='recover'){
    const dx=boss.x-s.x,dy=boss.y-s.y,dist=Math.hypot(dx,dy);
    if(dist>1.1)rules.step(s,{x:dx,y:dy},.04);else{rules.step(s,{},.04);s.facing=[dx/(dist||1),dy/(dist||1)];rules.attack(s);}
   }else rules.step(s,{},.04);
  }
  assert.equal(boss.hp,0,`${def.boss}: actual sword fight completes`);
  collect(s,`${def.id}-depths-cleared`);assert.ok(s.seals.includes(def.seal));const coins=s.coins;
  rules.interact(s);assert.equal(s.coins,coins,'boss reward once only');
  cross(s,'west');cross(s,'north');walk(s,[3.5,5.5]);assert.equal(rules.interact(s),'save');
  const restored=rules.decode(rules.encode(s));assert.ok(restored);assert.ok(restored.seals.includes(def.seal));assert.ok(restored.events.includes(`${def.id}-depths-cleared`));assert.ok(restored.equipment.includes(`${def.id}-map`));assert.equal(restored.enemies[base+10][0].hp,0);
  cross(s,'south');walk(s,[12.5,7.5]);rules.interact(s);assert.equal(s.room,base);
  walk(s,[2.5,5.5]);rules.interact(s);assert.equal(s.room,def.returnRoom);assert.deepEqual(s.keys,keys);
 }
});

test('mistakes reset safely, interrupted charge is lost, reentry retains controls and keys',()=>{
 for(let d=0;d<9;d++){
  const base=300+d*12,s=state(base+2),p=rules.roomInfo(s.room).puzzles[0];s.keys=[1];
  // Deliberately choose a wrong orientation, regardless of regional radix.
  walk(s,p.controls[0].at);for(let k=0;k<(p.controls[0].target+1)%p.controls[0].states;k++)rules.interact(s);
  walk(s,p.source);s.light=!p.shade;wait(s,p.seconds+.1);assert.ok(!s.events.includes(p.id));
  assert.equal(rules.resetPuzzle(s,p.id),true);assert.equal(s.expandedPuzzles[p.id],undefined);
  if(p.mechanic)prepareRegional(s,p,{rules,walk,wait});
  else for(const c of p.controls){walk(s,c.at);for(let k=0;k<c.target;k++)rules.interact(s);}
  walk(s,p.source);s.light=!p.shade;wait(s,p.seconds/2);assert.ok(s.expandedPuzzles[p.id].charge>0,"the interrupted circuit was actually charging");s.light=p.shade;wait(s,.04);assert.equal(s.expandedPuzzles[p.id].charge,0);
  const orientations=[...s.expandedPuzzles[p.id].controls];s.light=true;cross(s,'west');cross(s,'east');assert.deepEqual(s.expandedPuzzles[p.id].controls,orientations);
  walk(s,p.source);s.light=!p.shade;wait(s,p.seconds+.1);assert.ok(s.events.includes(p.id));assert.equal(rules.resetPuzzle(s,p.id),false);assert.deepEqual(s.keys,[1]);
 }
});

test('third circuit gate blocks both arena approaches without trapping retreat',()=>{
 for(let d=0;d<9;d++)for(const [offset,dir,at,input] of [[9,'south',[8.5,8.5],{y:1}],[11,'east',[14.5,5.5],{x:1}]]){
  const s=state(300+d*12+offset);walk(s,at);wait(s,.1);for(let i=0;i<20;i++)rules.step(s,input,.04);assert.equal(s.room,300+d*12+offset);
  s.events.push(`${dungeonDefinitions[d].id}-circuit-3`);cross(s,dir);assert.equal(s.room,300+d*12+10);
 }
});

test('bosses telegraph fixed targets, expose recovery, and stop their patterns in darkness',()=>{
 const profiles=new Set();for(let d=0;d<9;d++){
  const s=state(310+d*12),e=s.enemies[s.room][0];s.x=10;s.y=5.5;
  rules.step(s,{},.04);assert.equal(e.phase,'tell');const target=[...e.target],hp=e.hp;rules.attack(s);assert.equal(e.hp,hp);
  walk(s,[3.5,7.5]);assert.deepEqual(e.target,target);profiles.add([e.kind,e.tell,e.strike,e.recover].join('/'));
  s.light=false;rules.step(s,{},.04);assert.equal(e.phase,'idle');assert.equal(e.timer,0);
  s.light=true;let recover=false;for(let i=0;i<150;i++){rules.step(s,{},.04);if(e.phase==='recover'){recover=true;break;}}assert.ok(recover);
 }assert.equal(profiles.size,9);
});


test('earned equipment opens shortcuts, protects regional hazards and cannot be farmed',()=>{
 for(const [d,def] of dungeonDefinitions.entries()){
  const base=300+d*12,s=state(base+7);walk(s,[12.5,2.5]);rules.interact(s);assert.equal(s.room,base+7);
  s.equipment.push(def.equipment);rules.interact(s);assert.equal(s.room,base+6);
  walk(s,[5.5,7.5]);s.inv=0;const hp=s.hp;wait(s,.04);assert.equal(s.hp,hp,'equipment protects regional hazard');
  s.equipment=[];wait(s,.04);assert.ok(s.hp<hp,'hazard is active without regional equipment');
  s.inv=100;s.light=false;const e=s.enemies[s.room][0],x=e.x,y=e.y;wait(s,.5);assert.ok(e.x!==x||e.y!==y,'encounters patrol without light');
 }
});

test('light bridges block darkness but never consume legacy keys or become permanent traps',()=>{
 for(let d=0;d<9;d++){
  const s=state(303+d*12);s.light=false;assert.equal(rules.canStand(s,7.5,5.5),false);
  s.light=true;assert.equal(rules.canStand(s,7.5,5.5),true);walk(s,[11.5,5.5]);walk(s,[2.5,5.5]);assert.deepEqual(s.keys,[]);
 }
});

test('all local progression dependencies have an acyclic producer chain',()=>{
 const producers=new Map();
 for(const r of campaign.rooms){
  for(const p of r.puzzles){producers.set(p.id,p.requires||[]);if(p.reward)producers.set(p.reward.id,[p.id]);}
  for(const reward of r.rewards){producers.set(reward.id,reward.requires||[]);if(reward.equipment&&reward.equipment!==reward.id)producers.set(reward.equipment,[reward.id]);if(reward.seal)producers.set(reward.seal,[reward.id]);}
 }
 const done=new Set(),active=new Set();function visit(id){if(done.has(id))return;assert.ok(!active.has(id),`cycle at ${id}`);assert.ok(producers.has(id),`missing producer ${id}`);active.add(id);for(const dep of producers.get(id))visit(dep);active.delete(id);done.add(id);}
 for(const id of producers.keys())visit(id);
});
