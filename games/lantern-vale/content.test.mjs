import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from './content.mjs';
import {tile,camps,entrances,canStand,fresh} from './campaign.mjs';

test('authored base map exactly preserves exits, camps, stairs and traversal coordinates',()=>{
 assert.deepEqual(c.rooms.map(r=>r.id),Array.from({length:27},(_,i)=>i));
 assert.deepEqual(c.camps,camps);assert.deepEqual(c.entrances,entrances);
 for(const room of c.rooms){
  const r=room.id,expected={};
  if(r<15){if(r%5)expected.west=r-1;if(r%5<4)expected.east=r+1;if(r>=5)expected.north=r-5;if(r<10)expected.south=r+5;}
  else {expected.west=(r-15)%4?r-1:entrances[Math.floor((r-15)/4)];if((r-15)%4<3)expected.east=r+1;}
  assert.deepEqual(room.exits,expected,`room ${r}`);
  assert.equal(room.camp,camps.includes(r));
  assert.equal(room.entrance,entrances.includes(r)?15+entrances.indexOf(r)*4:null);
  for(const prop of room.scenery){assert.equal(prop.solid,false);assert.notEqual(prop.y,5.5);assert.notEqual(prop.x,8.5);}
 }
 assert.deepEqual(c.routeContract.waystone,[3.5,5.5]);assert.deepEqual(c.routeContract.dungeonStair,[12.5,2.5]);
 assert.deepEqual(c.routeContract.plate,{at:[12.5,5.5],rooms:[16,20,24]});
 assert.deepEqual(c.routeContract.keyRooms,[17,21,25]);assert.deepEqual(c.routeContract.relicRooms,[18,22,26]);
 assert.deepEqual(c.routeContract.beacon,{room:4,at:[12.5,5.5]});
 for(const r of c.routeContract.bridge.parts){assert.equal(tile(r,8,5),'~');const s=fresh();s.room=r;assert.equal(canStand(s,8.5,5.5),false);s.light=true;assert.equal(canStand(s,8.5,5.5),true);}
});

test('every authored area is reachable and optional chambers always return without gates',()=>{
 const graph=new Map(c.rooms.map(r=>[r.id,[...Object.values(r.exits),...(r.entrance===null?[]:[r.entrance])]]));
 for(const link of c.optionalLinks){assert.equal(link.optional,true);assert.equal(link.trigger,'interact');assert.deepEqual(link.requires,[]);assert.ok(graph.has(link.from));graph.get(link.from).push(link.to);graph.set(link.to,[link.from]);}
 const seen=new Set(),pending=[0];while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);assert.ok(graph.has(id));pending.push(...graph.get(id));}
 assert.equal(seen.size,30);
 for(const room of c.optionalRooms){assert.ok(seen.has(room.id));assert.deepEqual(room.entry,room.exit);assert.equal(c.optionalLinks.filter(l=>l.to===room.id).length,1);}
 // Each mandatory dungeon remains a direct, unmodified eastward chain.
 for(let d=0;d<3;d++)for(let p=0;p<3;p++)assert.equal(c.rooms[15+d*4+p].exits.east,16+d*4+p);
});

test('unique identifiers and references across narrative, rewards and puzzle definitions',()=>{
 const groups=[c.rooms,c.optionalRooms,c.lands,c.characters,c.quests,c.discoveries,c.puzzles,c.rewards,c.enemyTypes,c.wardens,c.interactions,c.optionalLinks,c.completionEvents];
 for(const group of groups)assert.equal(new Set(group.map(v=>v.id)).size,group.length);
 const events=new Map(c.completionEvents.map(e=>[e.id,e]));
 const rewards=new Map(c.rewards.map(r=>[r.id,r]));
 const roomIds=new Set([...c.rooms,...c.optionalRooms].map(r=>r.id));
 for(const item of [...c.interactions,...c.discoveries,...c.wardens])assert.ok(roomIds.has(item.room),item.id);
 for(const q of c.quests){assert.ok(c.characters.some(n=>n.id===q.giver));assert.ok(rewards.has(q.reward));assert.ok(rewards.get(q.reward).requires.includes(q.id));for(const s of q.steps)if(s.room!==undefined)assert.ok(roomIds.has(s.room));}
 for(const room of c.optionalRooms){const puzzle=c.puzzles.find(p=>p.id===room.puzzle);assert.equal(puzzle.room,room.id);assert.ok(rewards.get(room.reward).requires.includes(puzzle.id));}
 const active=new Set(),done=new Set();function visit(id){assert.ok(events.has(id),`unknown dependency ${id}`);assert.ok(!active.has(id),`circular reward dependency ${id}`);if(done.has(id))return;active.add(id);for(const dep of events.get(id).requires)visit(dep);active.delete(id);done.add(id);}
 for(const e of events.values())visit(e.id);
 for(const reward of c.rewards){assert.ok(reward.requires.length);for(const dep of reward.requires)visit(dep);}
 for(const interaction of c.interactions)for(const dep of interaction.requires??[])visit(dep);
 assert.ok(c.rewards.some(r=>r.kind==='weapon'&&r.weapon==='sun-disc'));
 assert.ok(c.rewards.every(r=>r.kind!=='supplies'||r.coins>0&&r.tonics>0));
});

test('placed interactions are on reachable floor and avoid legacy control points',()=>{
 const existing=c.interactions.filter(i=>i.action!=='talk'&&i.action!=='read');
 for(const i of [...c.interactions,...c.optionalLinks.map(l=>({room:l.from,at:l.at})),...c.quests.flatMap(q=>q.steps.filter(s=>s.room!==undefined))]){
  assert.ok(i.at.every(Number.isFinite));assert.ok(i.at[0]>=1&&i.at[0]<=15&&i.at[1]>=1&&i.at[1]<=9);
  if(typeof i.room==='number')assert.equal(tile(i.room,Math.floor(i.at[0]),Math.floor(i.at[1])),'.',`${i.id} on floor`);
  if(i.action==='talk')for(const old of existing.filter(e=>e.room===i.room))assert.ok(Math.hypot(i.at[0]-old.at[0],i.at[1]-old.at[1])>=1,`${i.id} overlaps ${old.id}`);
 }
});

test('lands, puzzles, recurring story and wardens have differentiated content',()=>{
 assert.equal(new Set(c.rooms.slice(0,15).map(r=>r.name)).size,15);
 for(const land of c.lands){assert.ok(c.rooms.some(r=>r.land===land.id));assert.equal(land.features.length,3);}
 assert.equal(new Set(c.lands.map(l=>l.ground)).size,3);
 assert.equal(new Set(c.puzzles.map(p=>p.mechanic)).size,3);
 for(const p of c.puzzles){assert.equal(p.reset,'on-request');assert.deepEqual(p.requires,[]);assert.ok(p.hint.length>30);assert.ok(p.rules.some(r=>r.effect===p.completion));assert.equal(new Set(p.objects.map(o=>o.id)).size,p.objects.length);for(const o of p.objects)assert.ok(o.at.every(n=>n>0&&n<16));}
 const mira=c.characters.find(n=>n.id==='mira');assert.deepEqual(mira.encounters.map(e=>e.when.relics),[0,1,2,3]);assert.match(mira.encounters[0].text,/three hearts/);assert.match(mira.encounters[3].text,/beacon/);
 assert.equal(new Set(c.wardens.map(w=>w.pattern.find(p=>p.attack).attack)).size,3);
 c.wardens.forEach((w,d)=>{assert.equal(w.room,18+d*4);assert.equal(w.relic,d);assert.equal(w.activation,'lantern-lit');assert.equal(w.darkness,'dormant');assert.ok(w.pattern[0].cue);assert.ok(w.pattern[0].seconds>=1);assert.ok(w.pattern.some(p=>p.vulnerable&&p.seconds>=1));assert.equal(w.pattern.find(p=>p.attack).tracking,false);});
});

test('campaign rewards and treasure preserve the established progression economy',()=>{
 assert.deepEqual(c.treasure.map(t=>t.room),[1,3,5,7,9,10,11,12,13]);
 for(const cache of c.treasure){assert.deepEqual(cache.at,[4.5,2.5]);assert.deepEqual(cache.requires,['lantern-lit']);assert.equal(cache.coins,5);assert.equal(cache.tonics,1);assert.equal(cache.once,true);}
 assert.deepEqual(c.campaignRewards.map(r=>r.room),[18,22,26]);assert.deepEqual(c.campaignRewards.map(r=>r.sword),[2,3,3]);assert.deepEqual(c.campaignRewards.map(r=>r.maxHp),[10,12,14]);
 assert.deepEqual(c.weaponTypes[0].damageByRelicCount,[1,2,3,3]);
 const disc=c.weaponTypes.find(w=>w.id==='sun-disc');assert.ok(c.rewards.some(r=>r.id===disc.acquisition));assert.ok(disc.returns&&disc.range>c.weaponTypes[0].range&&disc.stunSeconds>0);
});
