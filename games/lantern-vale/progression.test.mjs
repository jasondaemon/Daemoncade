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

import {installExpansion,roomInfo,campaignMap,continueAdventure,resetPuzzle,canStand,objective,VERSION} from './campaign.mjs';
// Compact authored fixtures exercise the public expansion contract, not shipped content.
const grid=()=>Array.from({length:10},(_,y)=>y===0||y===9?'################':'#..............#');
const hubTiles=grid();hubTiles[5]='#.......~......#';
installExpansion({rooms:[{
 id:30,name:'Test Keeper Port',kind:'overworld',land:'test-coast',checkpoint:true,tiles:hubTiles,
 puzzles:[{id:'test-circuit',source:[4.5,5.5],seconds:2,controls:[{at:[4.5,3.5],states:4,target:2}],reward:{id:'test-boots',equipment:'tide-boots'},text:'The tide remembers.'}],
 links:[{id:'test-stair',at:[12.5,5.5],to:31,entry:[1.5,5.5],requires:['test-circuit']}],
 rewards:[{id:'test-purse',at:[3.5,2.5],coins:20,maxHp:40,sword:3}],shops:[{id:'test-shop',at:[3.5,7.5],price:6,item:'tonic'}],
 characters:[{id:'test-mira',at:[2.5,6.5],text:'Carry the six distant seals to the Far Lantern.'}],
 ending:{id:'test-resolution',at:[13.5,7.5],requires:Array.from({length:6},(_,i)=>`test-seal-${i}`),text:'The Far Lantern answers all nine lights.'}
},...['charge','volley','ring','sweep','cross','hunt'].map((kind,i)=>({
 id:31+i,name:`Test Sanctum ${kind}`,kind:'dungeon',dungeon:3+i,tiles:grid(),
 links:[{id:`test-return-${i}`,at:[1.5,5.5],to:30,entry:[12.5,5.5],requires:[]},...(i<5?[{id:`test-next-${i}`,at:[13.5,2.5],to:32+i,entry:[1.5,5.5],requires:[`test-reward-${i}`]}]:[])],
 encounters:[{x:10.5,y:5.5,hp:2,boss:true,kind,tell:.4,strike:.4,recover:2}],
 rewards:[{id:`test-reward-${i}`,at:[12.5,5.5],clear:true,seal:`test-seal-${i}`,coins:4,...(i===0?{equipment:'sun-disc'}:{})}]
}))],quests:[{id:'test-coast-quest',requires:['test-circuit'],text:'The coast opens its roads.',reward:{id:'test-coast-reward',tonics:1}}]});
const enterExpansion=()=>{const s=fresh();s.status='won';s.beaconRestored=true;assert.equal(continueAdventure(s,30),true);return s;};
const walk=(s,x,y)=>{for(let i=0;i<700&&Math.hypot(s.x-x,s.y-y)>.07;i++)step(s,{x:x-s.x,y:y-s.y},.04);assert.ok(Math.hypot(s.x-x,s.y-y)<.1,`walk ${s.room} to ${x},${y}: ${s.x},${s.y}`);};

test('expansion registration is atomic, stable and does not rewrite legacy metadata',()=>{
 assert.equal(roomInfo(16).part,'trial');assert.equal(roomInfo(27).kind,'optional');assert.equal(roomInfo(30).kind,'overworld');
 assert.throws(()=>installExpansion({rooms:[{id:40,name:'Bad room',kind:'overworld',tiles:grid(),exits:{east:2047}}]}),/exit target/);assert.equal(roomInfo(40),null);
 assert.throws(()=>installExpansion({rooms:[{...roomInfo(30)}]}),/room ID/);
 const s=fresh();const map=campaignMap(s);assert.equal(map.find(r=>r.id===30).visited,false);assert.equal(map.find(r=>r.id===30).links[0].open,false);
});

test('spatial circuit resets interrupted charge; earned boots open a physical revisit',()=>{
 let s=enterExpansion();assert.equal(canStand(s,8.5,5.5),false);
 walk(s,4.5,5.5);toggle(s);wait(s,2.1);assert.ok(!s.events.includes('test-circuit'));
 walk(s,4.5,3.5);interact(s);interact(s);walk(s,4.5,5.5);wait(s,.2);toggle(s);wait(s,.04);assert.equal(s.expandedPuzzles['test-circuit'].charge,0);
 assert.equal(resetPuzzle(s,'test-circuit'),true);assert.deepEqual(s.expandedPuzzles,{});
 walk(s,4.5,3.5);interact(s);interact(s);walk(s,4.5,5.5);toggle(s);wait(s,2.1);
 assert.ok(s.events.includes('test-circuit'));assert.ok(s.equipment.includes('tide-boots'));assert.ok(s.quests.includes('test-coast-quest'));toggle(s);assert.equal(canStand(s,8.5,5.5),true);
 walk(s,3.5,5.5);assert.equal(interact(s),'save');s=decode(encode(s));assert.ok(s);assert.equal(s.room,30);assert.equal(s.light,false);assert.equal(canStand(s,8.5,5.5),true);assert.equal(resetPuzzle(s,'test-circuit'),false);
 walk(s,12.5,5.5);assert.equal(interact(s),true);assert.equal(s.room,31);
});

test('all six boss patterns lock a tell, recover and preserve rewards across waystones',()=>{
 const seen=new Set();for(let i=0;i<6;i++){
  const s=enterExpansion();s.room=31+i;at(s,8.5,5.5);toggle(s);step(s,{},.04);const e=s.enemies[s.room][0];seen.add(e.kind);assert.equal(e.phase,'tell');const target=[...e.target];at(s,3.5,2.5);wait(s,.12);assert.deepEqual(e.target,target);
  for(let t=0;t<20&&e.phase==='tell';t++)step(s,{},.04);assert.equal(e.phase,'strike');if(e.kind==='volley')assert.ok(s.projectiles.length===3);
  for(let t=0;t<20&&e.phase==='strike';t++)step(s,{},.04);assert.equal(e.phase,'recover');at(s,e.x-.8,e.y);s.facing=[1,0];attack(s);assert.equal(e.hp,1);wait(s,.32);attack(s);assert.equal(e.hp,0);
  at(s,12.5,5.5);interact(s);assert.ok(s.seals.includes(`test-seal-${i}`));const coins=s.coins;interact(s);assert.equal(s.coins,coins);
  at(s,1.5,5.5);interact(s);assert.equal(s.room,30);walk(s,3.5,5.5);assert.equal(interact(s),'save');const restored=decode(encode(s));assert.ok(restored);assert.equal(restored.enemies[31+i][0].hp,0);assert.deepEqual(restored.seals,s.seals);
 }assert.equal(seen.size,6);
});

test('shops charge only successful purchases; full final dependency set is required',()=>{
 const s=enterExpansion();walk(s,3.5,2.5);interact(s);assert.equal(s.coins,20);interact(s);assert.equal(s.coins,20);walk(s,3.5,7.5);const n=s.potions;interact(s);assert.equal(s.potions,n+1);assert.equal(s.coins,14);
 s.potions=s.tonicCapacity;interact(s);assert.equal(s.coins,14);
 walk(s,7.5,7.5);walk(s,13.5,7.5);toggle(s);interact(s);assert.equal(s.status,'playing');assert.equal(s.expandedEnding,false);
 s.seals=Array.from({length:6},(_,i)=>`test-seal-${i}`);interact(s);assert.equal(s.status,'won');assert.equal(s.expandedEnding,true);assert.match(objective(s),/nine lights/);
});

test('version-one migration and expanded saves validate bounded fields and safe spawn',()=>{
 const legacy=JSON.parse(encode(fresh()));legacy.version=1;delete legacy.expansion;const migrated=decode(JSON.stringify(legacy));assert.ok(migrated);assert.equal(migrated.version,VERSION);assert.deepEqual(migrated.equipment,[]);assert.equal(migrated.enemies[36][0].hp,2);
 const s=enterExpansion();const raw=encode(s);assert.ok(decode(raw));
 for(const mutate of [v=>v.expansion.equipment=['forged-wings'],v=>v.expansion.seals=['unearned-id'],v=>v.expansion.puzzles={'test-circuit':{controls:[99],charge:0}},v=>v.expansion.enemies[31]=[101],v=>v.expansion.enemies.evil=[],v=>v.expansion.ending=true,v=>v.visited.push(2000),v=>v.room=31]){const bad=JSON.parse(raw);mutate(bad);assert.equal(decode(JSON.stringify(bad)),null);}
});


test('expanded arc moves through circuit, six earned seals, reload and final resolution',()=>{
 let s=enterExpansion();
 walk(s,3.5,2.5);interact(s);walk(s,4.5,3.5);interact(s);interact(s);walk(s,4.5,5.5);toggle(s);wait(s,2.1);
 walk(s,12.5,5.5);interact(s);assert.equal(s.room,31);
 for(let i=0;i<6;i++){
  const e=s.enemies[s.room][0];let ticks=0;
  while(e.hp>0&&ticks++<1500){
   if(s.hp<=5)potion(s);
   const dx=e.x-s.x,dy=e.y-s.y;
   step(s,{x:dx,y:dy},.04);attack(s);assert.equal(s.status,'playing');
  }
  assert.equal(e.hp,0);walk(s,12.5,5.5);interact(s);assert.ok(s.seals.includes(`test-seal-${i}`));
  if(i<5){walk(s,13.5,2.5);interact(s);assert.equal(s.room,32+i);}
 }
 walk(s,1.5,5.5);interact(s);assert.equal(s.room,30);
 walk(s,3.5,5.5);assert.equal(interact(s),'save');s=decode(encode(s));assert.ok(s);assert.equal(s.seals.length,6);assert.ok(s.equipment.includes('sun-disc'));
 walk(s,7.5,7.5);walk(s,13.5,7.5);toggle(s);interact(s);assert.equal(s.status,'won');assert.equal(s.expandedEnding,true);
});

test('metadata boundary exits, equipment gates, hazards and unsafe checkpoints use actual collision',()=>{
 const west=grid(),east=grid();west[5]='#..............D';east[5]='................';east[4]='.........^.....#';
 installExpansion({rooms:[
  {id:37,name:'Test Forge',kind:'overworld',tiles:west,checkpoint:true,exits:{east:38},gates:[{at:[15.5,5.5],equipment:'ember-cloak'}],rewards:[{id:'test-cloak',at:[5.5,5.5],equipment:'ember-cloak'}]},
  {id:38,name:'Test Cinder Road',kind:'overworld',tiles:east,exits:{west:37},hazards:[{at:[10.5,5.5],damage:2,equipment:'ember-cloak'}]},
  {id:39,name:'Test Unsafe Waystone',kind:'overworld',tiles:grid(),checkpoint:true,checkpointAt:[.5,.5]}
 ]});
 const s=enterExpansion();s.room=37;at(s,3.5,5.5);assert.equal(canStand(s,15.5,5.5),false);
 walk(s,5.5,5.5);interact(s);assert.equal(canStand(s,15.5,5.5),true);walk(s,14.5,5.5);
 for(let i=0;i<40&&s.room===37;i++)step(s,{x:1},.04);assert.equal(s.room,38);walk(s,10.5,5.5);const hp=s.hp;wait(s,.2);assert.equal(s.hp,hp);assert.equal(canStand(s,9.5,4.5),true);
 const unsafe=JSON.parse(encode(s));unsafe.room=39;assert.equal(decode(JSON.stringify(unsafe)),null);
 const unprotected=fresh();unprotected.room=38;at(unprotected,10.5,5.5);step(unprotected,{},.04);assert.equal(unprotected.hp,6);assert.equal(canStand(unprotected,9.5,4.5),false);
});
