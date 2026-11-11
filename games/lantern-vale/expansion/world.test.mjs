import test from 'node:test';
import assert from 'node:assert/strict';
import * as world from './world.mjs';
import {seals,equipment} from './story.mjs';
import * as legacy from '../content.mjs';
import {installExpansion,fresh,canStand,step,interact,roomInfo,rooms as runtimeRooms,resetPuzzle} from '../campaign.mjs';

// Contract fixtures represent the separately owned dungeon module, not completed
// dungeons or evidence of their gameplay. These catch portal/reward ID integration.
const dungeonFixtures=world.dungeonEntrances.filter(d=>d.dungeon>=3).map((d,i)=>({
 id:d.to,name:`External dungeon contract ${i}`,kind:'dungeon',dungeon:d.dungeon,
 tiles:Array.from({length:10},(_,y)=>y===0||y===9?'################':'#..............#'),exits:{},
 rewards:[{id:`fixture-seal-${i}`,at:[12.5,5.5],seal:seals[i],equipment:equipment[i]}],
 links:[{id:`fixture-return-${i}`,at:[1.5,5.5],to:d.from,entry:d.returnTo,requires:[]}]
}));
installExpansion(world.campaign,{rooms:dungeonFixtures});
const byId=new Map(world.rooms.map(r=>[r.id,r]));
function flood(r,start=[8,5],gateEquipment=false){
 const seen=new Set(),pending=[start];while(pending.length){const [x,y]=pending.pop(),key=`${x},${y}`;if(seen.has(key)||x<0||y<0||x>15||y>9)continue;const t=r.tiles[y][x];if(t==='#'||t==='D'&&!gateEquipment)continue;seen.add(key);pending.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}return seen;
}
function allObjects(r){return [...r.links,...r.characters,...r.shops,...r.rewards,...r.puzzles.flatMap(p=>[{at:p.source},...p.controls]),...(r.ending?[r.ending]:[])];}

test('126 authored additions preserve all legacy rooms and boundary exits',()=>{
 assert.equal(world.rooms.length,126);assert.ok(15+world.rooms.length>=128);
 assert.deepEqual(world.rooms.map(r=>r.id),Array.from({length:126},(_,i)=>i+30));
 for(let i=0;i<27;i++){assert.deepEqual(roomInfo(i).exits,legacy.rooms[i].exits);assert.equal(roomInfo(i).name,legacy.rooms[i].name);}
 assert.equal(runtimeRooms.filter(r=>r.id<30).length,30);
 assert.deepEqual(world.legacyPortals,[]);
 assert.equal(new Set(world.rooms.map(r=>r.name)).size,126);
 assert.equal(new Set(world.rooms.map(r=>r.tiles.join('\n'))).size,126);
 for(const r of world.rooms){assert.equal(r.tiles.length,10);assert.ok(r.tiles.every(row=>row.length===16));assert.ok(r.description.length>90);assert.ok(r.scenery.length>=2);assert.ok(r.checkpoint||r.encounters.length>=2);}
});

test('all regions and nine dungeon portals connect from continuation; boundary exits are reciprocal',()=>{
 const seen=new Set(),todo=[world.continuation.room];
 while(todo.length){const id=todo.pop();if(seen.has(id))continue;seen.add(id);const r=byId.get(id);if(r)todo.push(...Object.values(r.exits),...r.links.map(l=>l.to));}
 for(const r of world.rooms)assert.ok(seen.has(r.id),r.name);
 for(const d of world.dungeonEntrances){assert.ok(seen.has(d.to));assert.ok(roomInfo(d.to));}
 const reverse={west:'east',east:'west',north:'south',south:'north'};
 for(const r of world.rooms)for(const [dir,to] of Object.entries(r.exits))assert.equal(byId.get(to).exits[reverse[dir]],r.id);
 for(const region of world.regions){assert.equal(region.sceneIds.length,18);assert.ok(region.sceneIds.filter(id=>byId.get(id).checkpoint).length>=4);}
});

test('every interaction, encounter, return landing and exit is accessible on authored collision',()=>{
 for(const r of world.rooms){const reachable=flood(r,[8,5],true);
  for(const item of [...allObjects(r),...r.encounters.map(e=>({at:[e.x,e.y]})),{at:r.checkpointAt}]){const [x,y]=item.at;assert.ok(reachable.has(`${Math.floor(x)},${Math.floor(y)}`),`${r.id} ${item.id||item.at}`);}
  const ends={west:[0,5],east:[15,5],north:[8,0],south:[8,9]};for(const dir of Object.keys(r.exits))assert.ok(reachable.has(ends[dir].join(',')),`${r.id} ${dir}`);
  for(const l of r.links){const target=byId.get(l.to);if(target)assert.ok(flood(target,[8,5],true).has(l.entry.map(Math.floor).join(',')),l.id);}
  const interactables=[...r.links,...r.characters,...r.shops,...r.rewards,...r.puzzles.flatMap(p=>p.controls),...(r.ending?[r.ending]:[])];for(let a=0;a<interactables.length;a++)for(let b=a+1;b<interactables.length;b++)assert.ok(Math.hypot(...interactables[a].at.map((v,i)=>v-interactables[b].at[i]))>=1.9,`${r.id} overlapping interactions`);
 }
});

test('actual runtime movement crosses every expanded boundary without special equipment',()=>{
 const offsets={east:[15.3,5.5,1,0],west:[.7,5.5,-1,0],north:[8.5,.7,0,-1],south:[8.5,9.3,0,1]};
 for(const r of world.rooms)for(const [dir,to] of Object.entries(r.exits)){const s=fresh(),[x,y,dx,dy]=offsets[dir];Object.assign(s,{room:r.id,x,y,light:true,inv:100});assert.ok(canStand(s,x,y));for(let n=0;n<10&&s.room===r.id;n++)step(s,{x:dx,y:dy},.04);assert.equal(s.room,to,`${r.id} ${dir}`);}
});

test('regional puzzles reset, recover, and award unique one-time gifts',()=>{
 const gifts=[];
 for(const r of world.rooms)for(const p of r.puzzles){const s=fresh();Object.assign(s,{room:r.id,x:p.source[0],y:p.source[1],light:!p.shade,inv:100});step(s,{},.05);assert.ok(resetPuzzle(s,p.id));assert.equal(s.expandedPuzzles[p.id],undefined);
 for(const c of p.controls){s.x=c.at[0];s.y=c.at[1];for(let i=0;i<c.target;i++)assert.equal(interact(s),true);}s.x=p.source[0];s.y=p.source[1];for(let i=0;i<80;i++)step(s,{},.05);assert.ok(s.events.includes(p.id),p.id);assert.ok(s.events.includes(p.reward.id));const coins=s.coins;for(let i=0;i<80;i++)step(s,{},.05);assert.equal(s.coins,coins);assert.equal(resetPuzzle(s,p.id),false);gifts.push(p.reward.id);}
 assert.equal(gifts.length,14);assert.equal(new Set(gifts).size,14);
});

test('equipment return alcoves have real barriers but never gate the main road',()=>{
 for(let i=1;i<7;i++){const r=byId.get(30+i*18+12),s=fresh();Object.assign(s,{room:r.id,light:true});assert.equal(canStand(s,12.5,6.5),false);assert.ok(!flood(r).has('12,7'));s.equipment=[equipment[i-1]];assert.equal(canStand(s,12.5,6.5),true);assert.ok(flood(r,[8,5],true).has('12,7'));s.x=12.5;s.y=7.5;assert.equal(interact(s),true);assert.ok(s.events.includes(`${r.land}-12-return-gift`));}
});

test('navigation and art semantics describe all actual scenes and contain no remote assets',()=>{
 assert.equal(world.navigation.length,126);for(const n of world.navigation){const r=byId.get(n.id);assert.deepEqual(n.neighbors,Object.values(r.exits));assert.equal(n.x,r.map.x);assert.ok(world.artSemanticIds.includes(n.art.landmark));}
 assert.ok(!JSON.stringify(world.campaign).includes('https://'));
});

test('runtime movement reaches every authored interaction through its actual floor paths',()=>{
 for(const r of world.rooms){const s=fresh();Object.assign(s,{room:r.id,x:8.5,y:5.5,light:true,inv:10000,equipment:[...equipment]});
 for(const object of allObjects(r)){
  const start=[Math.floor(s.x),Math.floor(s.y)],goal=object.at.map(Math.floor),queue=[start],previous=new Map([[start.join(','),null]]);
  for(let i=0;i<queue.length&&!previous.has(goal.join(','));i++){const [x,y]=queue[i];for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const key=`${nx},${ny}`;if(nx<1||nx>14||ny<1||ny>8||previous.has(key)||!canStand(s,nx+.5,ny+.5))continue;previous.set(key,[x,y]);queue.push([nx,ny]);}}
  assert.ok(previous.has(goal.join(',')),`${r.id}: no runtime path to ${object.id}`);
  const route=[];let cursor=goal;while(cursor){route.unshift(cursor);cursor=previous.get(cursor.join(','));}
  for(const [x,y] of route){const target=[x+.5,y+.5];for(let tick=0;tick<100&&Math.hypot(s.x-target[0],s.y-target[1])>.075;tick++)step(s,{x:Math.abs(target[0]-s.x)>.04?target[0]-s.x:0,y:Math.abs(target[1]-s.y)>.04?target[1]-s.y:0},.02);assert.ok(Math.hypot(s.x-target[0],s.y-target[1])<.08,`${r.id}: blocked at ${s.x},${s.y}`);assert.equal(s.room,r.id);assert.equal(s.status,'playing');}
 }
 }
});
