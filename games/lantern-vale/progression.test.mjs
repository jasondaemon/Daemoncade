import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,step,interact,toggle,attack,secondary,encode,decode} from './campaign.mjs';
const wait=(s,t)=>{for(let i=0;i<Math.ceil(t/.04);i++)step(s,{},.04);};
const at=(s,x,y)=>Object.assign(s,{x,y});
test('optional links preserve threshold exits and return without consuming route items',()=>{
 const s=fresh();s.room=15;at(s,5.5,2.5);assert.equal(interact(s),true);assert.equal(s.room,27);assert.equal(s.enemies[27].length,0);assert.equal(interact(s),true);assert.equal(s.room,15);assert.deepEqual(s.keys,[]);
});
test('root shutter needs sustained light, then shade; reward and inscription are once only',()=>{
 const s=fresh();s.room=27;at(s,4.5,4.5);interact(s);at(s,9.5,4.5);wait(s,2.2);assert.ok(!s.events.includes('puzzle-root'));toggle(s);wait(s,2.1);assert.ok(!s.events.includes('puzzle-root'));at(s,4.5,4.5);interact(s);wait(s,.04);assert.ok(s.events.includes('puzzle-root'));assert.equal(s.coins,8);assert.equal(s.potions,3);wait(s,2);assert.equal(s.coins,8);at(s,12.5,2.5);interact(s);assert.ok(s.events.includes('root-inscription'));
});
test('water and prism solve with distinct orientations and require light',()=>{
 const s=fresh();s.room=28;at(s,4.5,4.5);interact(s);at(s,9.5,4.5);interact(s);interact(s);at(s,3.5,2.5);wait(s,.04);assert.ok(!s.events.includes('puzzle-water'));toggle(s);wait(s,.04);assert.ok(s.events.includes('archive-cache'));assert.equal(s.tonicCapacity,10);
 s.room=29;at(s,6.5,2.5);interact(s);at(s,10.5,2.5);interact(s);interact(s);interact(s);at(s,3.5,2.5);wait(s,.04);assert.ok(s.events.includes('prism-cache'));
});
test('reed quest grants usable disc; projectile stuns moth and toggles distant shutter',()=>{
 const s=fresh();assert.equal(secondary(s),false);toggle(s);for(const [room,x,y] of [[3,3.5,2.5],[7,11.5,2.5],[12,11.5,2.5]]){s.room=room;at(s,x,y);wait(s,.04);}assert.ok(s.events.includes('reed-disc'));s.room=3;at(s,8.5,4.5);s.facing=[1,0];const e=s.enemies[3][0];e.x=10;e.y=4.5;assert.equal(secondary(s),true);assert.equal(secondary(s),false);wait(s,.2);assert.ok(e.stun>0);assert.equal(e.hp,1);
 s.room=27;s.projectiles=[];s.discCooldown=0;at(s,1.5,4.5);secondary(s);wait(s,.4);assert.equal(s.puzzleState[27].a,1);
});
test('warden tells freeze targets, attacks differ and recovery permits bounded counterattacks',()=>{
 const attacks=[];for(const room of [18,22,26]){const s=fresh();s.room=room;toggle(s);at(s,10.5,5.5);step(s,{},.04);const e=s.enemies[room][0];assert.equal(e.phase,'tell');const aim=[...e.aim];s.facing=[1,0];attack(s);assert.equal(e.hp,8);at(s,9,6);wait(s,.4);assert.deepEqual(e.aim,aim);for(let i=0;i<60&&e.phase==='tell';i++)step(s,{},.04);assert.equal(e.phase,'strike');attacks.push(e.kind);for(let i=0;i<30&&e.phase==='strike';i++)step(s,{},.04);assert.equal(e.phase,'recover');at(s,e.x-.8,e.y);s.cooldown=0;attack(s);assert.equal(e.hp,7);wait(s,2);assert.equal(e.phase,'tell');}assert.equal(new Set(attacks).size,3);
});
test('orchard and recurring NPC rewards are durable and cannot be farmed',()=>{
 const s=fresh();s.room=11;at(s,3.5,6.5);interact(s);assert.match(s.message,/graft/);at(s,11.5,2.5);toggle(s);wait(s,2.1);assert.equal(s.coins,5);assert.equal(s.potions,3);at(s,3.5,6.5);interact(s);assert.match(s.message,/buds/);wait(s,3);assert.equal(s.coins,5);
});
test('legacy defaults and extended checkpoint round trips reject malformed progression and reset transient combat',()=>{
 const s=fresh();const old=JSON.parse(encode(s));delete old.progress;old.enemies=old.enemies.slice(0,27);const migrated=decode(JSON.stringify(old));assert.ok(migrated);assert.deepEqual(migrated.events,[]);assert.equal(migrated.tonicCapacity,9);
 s.visited.push(27,28,29);s.events=['quest-reeds','reed-disc','puzzle-water','archive-cache'];s.dialogue=['sen-reeds'];s.puzzleState={'28':{a:1,b:2,charge:0,grown:false}};s.tonicCapacity=10;s.potions=10;s.projectiles=[{life:1}];s.discCooldown=.8;s.enemies[18][0].phase='strike';const r=decode(encode(s));assert.ok(r);assert.deepEqual(r.events,s.events);assert.deepEqual(r.puzzleState,s.puzzleState);assert.equal(r.potions,10);assert.equal(r.tonicCapacity,10);assert.deepEqual(r.projectiles,[]);assert.equal(r.discCooldown,0);assert.equal(r.enemies[18][0].phase,'idle');assert.deepEqual(r.facing,[1,0]);
 for(const progress of [{events:['unknown'],dialogue:[],puzzles:{}},{events:[],dialogue:[],puzzles:{'__proto__':{},evil:{a:1}}},{events:[],dialogue:[],puzzles:{27:{a:-1}}},{events:['reed-disc','reed-disc'],dialogue:[],puzzles:{}}]){const bad=JSON.parse(encode(s));bad.progress=progress;assert.equal(decode(JSON.stringify(bad)),null);}
});

test('patrols stay active in darkness; sentinel locks a readable ranged tell',()=>{
 const s=fresh();s.room=1;const crawler=s.enemies[1][0],x=crawler.x;wait(s,.4);assert.notEqual(crawler.x,x);s.room=9;at(s,4.5,4.5);toggle(s);step(s,{},.04);const sentinel=s.enemies[9][0];assert.equal(sentinel.phase,'tell');const aim=[...sentinel.aim];at(s,4.5,6.5);wait(s,1.15);assert.equal(sentinel.phase,'recover');assert.ok(s.projectiles.length);assert.deepEqual([s.projectiles[0].dx,s.projectiles[0].dy],aim);
});
test('sun-disc is available through existing interact action and returns without repeating hits',()=>{
 const s=fresh();s.events.push('reed-disc');s.room=0;at(s,8.5,5.5);assert.equal(interact(s),true);assert.equal(s.projectiles.length,1);wait(s,1.6);assert.equal(s.projectiles.length,0);
});

test('root seed needs uninterrupted light before growth',()=>{
 const s=fresh();s.room=27;at(s,4.5,4.5);interact(s);at(s,9.5,4.5);toggle(s);wait(s,1.2);toggle(s);wait(s,.04);toggle(s);wait(s,1.2);assert.equal(s.puzzleState[27].grown,false);wait(s,.9);assert.equal(s.puzzleState[27].grown,true);
});

test('every optional chamber is reachable on foot from its threshold and returns safely',()=>{
 for(let d=0;d<3;d++){
  const s=fresh();s.room=15+d*4;at(s,1.5,5.5);
  function walk(x,y){for(let i=0;i<400&&Math.hypot(s.x-x,s.y-y)>.08;i++)step(s,{x:x-s.x,y:y-s.y},.04);assert.ok(Math.hypot(s.x-x,s.y-y)<.1,`${s.room}: path to ${x},${y}`);}
  walk(5.5,5.5);walk(5.5,2.5);interact(s);assert.equal(s.room,27+d);
  // Approach every puzzle object and inscription through actual collision rules.
  for(const [x,y] of [[4.5,4.5],[9.5,4.5],[3.5,2.5],[6.5,2.5],[10.5,2.5],[12.5,2.5],[1.5,5.5]])walk(x,y);
  interact(s);assert.equal(s.room,15+d*4);assert.ok(s.x===5.5&&s.y===3.5);assert.deepEqual(s.keys,[]);
 }
});
