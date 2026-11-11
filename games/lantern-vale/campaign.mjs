import {regionalStep,regionalInteract,mechanics} from './expansion/mechanics.mjs';
import * as content from './content.mjs?v=0.3.0-alpha.6';
// Data and deterministic rules are independent from the browser and renderer.
export const W=16,H=10, VERSION=2;
export const lands=['Mossward','Amber Fen','Glass Highlands'];
export const entrances=[6,8,14];
export const camps=[0,2,4,6,8,14];
// Stable IDs 0–29 are reserved forever, including the three optional chambers.
export const rooms = content.rooms.map(r=>({...r,kind:r.dungeon<0?'overworld':'dungeon',part:r.dungeon<0?null:['threshold','trial','key','heart'][(r.id-15)%4],checkpoint:r.camp,checkpointAt:[3.5,5.5]}));
rooms.push(...content.optionalRooms.map((r,i)=>({...r,id:27+i,kind:'optional',part:'optional',exits:{},checkpoint:false})));
export const roomById = new Map(rooms.map(r=>[r.id,r]));
export const names=rooms.map(r=>r.name);
export function roomInfo(id){return roomById.get(id)||null;}
export function fresh(){
 const state={version:VERSION,room:0,x:3.5,y:5.5,facing:[1,0],hp:8,maxHp:8,light:false,status:'playing',inv:0,cooldown:0,swing:0,potions:2,coins:0,sword:1,relics:[],keys:[],switches:[],opened:[],visited:[0],message:'Mira: The three wardens swallowed our dawn. Take my lantern. Restore their hearts, then return to the northern beacon.',enemies:[],events:[],dialogue:[],puzzleState:{},tonicCapacity:9,discCooldown:0,projectiles:[],equipment:[],quests:[],seals:[],expandedPuzzles:{},beaconRestored:false,expandedEnding:false};
 for(const r of rooms){
  if(r.id>=30){state.enemies[r.id]=spawnEncounter(r);continue;}
  const boss=r.part==='heart';
  state.enemies[r.id]=r.checkpoint||r.kind==='optional'?[]:boss?[{x:11.5,y:5.5,hp:8,boss:true}]:r.kind==='dungeon'?[{x:10.5,y:4.5,hp:3},{x:12.5,y:6.5,hp:3}]:[{x:11.5,y:4.5,hp:2},{x:12.5,y:7.5,hp:2}];
  for(const e of state.enemies[r.id])Object.assign(e,{kind:boss?content.wardens[r.dungeon].id:r.kind==='overworld'?content.enemyTypes[Math.min(2,Math.floor(r.id%5/2))].id:'brambleling',phase:'idle',timer:0,stun:0});
 }
 return state;
}
export function dungeon(r){return roomInfo(r)?.dungeon ?? -1;}
export function tile(r,x,y){
 if(x<0||x>=W||y<0||y>=H||!roomInfo(r))return '#';
 if(r>=30)return roomInfo(r).tiles[y][x];
 if(roomInfo(r).kind==='optional')return x===0||x===15||y===0||y===9?'#':'.';
 const meta=roomInfo(r);
 if(meta.kind==='overworld'){if(y===0)return meta.exits.north!==undefined&&x===8?'.':'#';if(y===9)return meta.exits.south!==undefined&&x===8?'.':'#';if(x===0)return meta.exits.west!==undefined&&y===5?'.':'#';if(x===15)return meta.exits.east!==undefined&&y===5?'.':'#';}
 else {if(y===0||y===9)return '#';if(x===0)return y===5?'.':'#';if(x===15)return meta.exits.east!==undefined&&y===5?'D':'#';if(meta.part==='trial'&&x===8)return y===5?'~':'#';}
 if((x===6||x===10)&&(y===3||y===7))return '#';
 return '.';
}
function gateOpen(s){const m=roomInfo(s.room),d=m.dungeon;return m.part==='threshold'||m.part==='trial'&&s.switches.includes(d)||m.part==='key'&&s.keys.includes(d);}
export function solid(s,x,y){if(s.room>=30)return expandedSolid(s,x,y);const t=tile(s.room,Math.floor(x),Math.floor(y));return t==='#'||t==='~'&&!s.light||t==='D'&&!gateOpen(s);}
export function canStand(s,x,y){return [-.23,.23].every(a=>[-.23,.23].every(b=>!solid(s,x+a,y+b)));}
function move(s,a,dx,dy){if(canStand(s,a.x+dx,a.y))a.x+=dx;if(canStand(s,a.x,a.y+dy))a.y+=dy;}
export function toggle(s){if(s.status==='playing'){s.light=!s.light;if(s.light)for(const e of s.enemies[s.room])if(e.kind==='brambleling')e.stun=s.events.includes('prism-cache')?.8:.6;}}
export function pause(s){if(s.status==='playing')s.status='paused';else if(s.status==='paused')s.status='playing';}
export function attack(s){if(s.status!=='playing'||s.cooldown>0)return;s.cooldown=.3;s.swing=.17;for(const e of s.enemies[s.room]){const dx=e.x-s.x,dy=e.y-s.y;if(e.hp>0&&(!e.boss||(s.room>=30?s.light&&e.phase==='recover':!s.light||e.phase==='recover'||e.phase==='idle'))&&Math.hypot(dx,dy)<1.8&&dx*s.facing[0]+dy*s.facing[1]>-.15){e.hp=Math.max(0,e.hp-s.sword);if(!e.hp)s.coins=Math.min(9999,s.coins+(e.boss?12:3));}}}
export function potion(s){if(s.status!=='playing'||!s.potions||s.hp===s.maxHp)return false;s.potions--;s.hp=Math.min(s.maxHp,s.hp+5);s.message='Sunleaf tonic restores five hearts.';return true;}
function changeRoom(s,r,x,y){s.room=r;s.x=x;s.y=y;s.inv=1;s.projectiles=[];s.message=names[r]||content.optionalRooms[r-27]?.name;if(!s.visited.includes(r))s.visited.push(r);}
export function interact(s){
 if(s.status!=='playing')return false;
 const expandedAction=expansionInteract(s);if(expandedAction)return expandedAction;
 if(authoredInteract(s))return true;
 if(camps.includes(s.room)&&Math.hypot(s.x-3.5,s.y-5.5)<1.6){s.hp=s.maxHp;if(s.coins>=6&&s.potions<s.tonicCapacity){s.coins-=6;s.potions++;}s.message='Waystone: health restored. Checkpoint saved. Six coins buys one tonic when available.';return 'save';}
 const d=entrances.indexOf(s.room);if(d>=0&&Math.hypot(s.x-12.5,s.y-2.5)<1.6){changeRoom(s,15+d*4,1.5,5.5);s.message=['Rootvault: carry light across the broken roots.','Drowned Archive: awaken the sun plate, then defeat its sentries.','Prism Crypt: the last warden guards the stolen dawn.'][d]+' Optional keeper chamber: interact at the northwest alcove (5.5, 2.5).';return true;}
 if(s.room===4&&Math.hypot(s.x-12.5,s.y-5.5)<1.6){if(s.relics.length===3&&s.light){s.beaconRestored=true;s.status='won';s.message='Mira watches the dawn climb over Lantern Vale. The wardens sleep; the roads are yours again.';}else s.message='The beacon needs all three heart relics and a raised lantern.';return true;}
 if(secondary(s))return true;s.message='Seek a glowing waystone, dungeon stair, sun plate or treasure chest.';return false;
}
export function step(s,input,dt){
 if(s.status!=='playing'||!Number.isFinite(dt))return;dt=Math.max(0,Math.min(dt,.04));
 if(input.secondary)secondary(s);
 s.discCooldown=Math.max(0,s.discCooldown-dt);
 for(const k of ['inv','cooldown','swing'])s[k]=Math.max(0,s[k]-dt);
 let dx=Number.isFinite(input.x)?input.x:0,dy=Number.isFinite(input.y)?input.y:0;const n=Math.hypot(dx,dy);if(n){dx/=n;dy/=n;s.facing=[dx,dy];move(s,s,dx*3.5*dt,dy*3.5*dt);}
 const r=s.room,d=dungeon(r),meta=roomInfo(r),part=meta.part;
 if(r>=30){expandedStep(s,dt);return;}
 if(meta.kind==='overworld'){let dest=r,px=s.x,py=s.y;if(s.x>15.5){dest=meta.exits.east;px=.55;}else if(s.x<.5){dest=meta.exits.west;px=15.45;}else if(s.y<.5){dest=meta.exits.north;py=8.45;}else if(s.y>9.5){dest=meta.exits.south;py=.55;}
 // South doorway crosses at 9.5; tile map includes the outer half-tile apron.
 if(dest!==undefined&&dest!==r){const column=dest%5,need=column>=4?2:column>=2?1:0;if(s.relics.length<need){s.x=Math.max(.55,Math.min(15.45,s.x));s.y=Math.max(.55,Math.min(9.45,s.y));s.message=`The dusk veil needs ${need} restored heart relic${need===1?'':'s'}.`;}else changeRoom(s,dest,px,py);}}
 else if(meta.kind==='dungeon'&&s.x<.5){if(part==='threshold')changeRoom(s,meta.exits.west,12.5,3.5);else changeRoom(s,meta.exits.west,14.5,5.5);}else if(meta.kind==='dungeon'&&s.x>15.5&&meta.exits.east!==undefined)changeRoom(s,meta.exits.east,.55,5.5);
 if(s.room!==r)return;
 if(meta.kind==='dungeon'&&part==='trial'&&s.light&&Math.hypot(s.x-12.5,s.y-5.5)<.8&&!s.switches.includes(d)){s.switches.push(d);s.message='The sun plate opens the sealed hall.';}
 updateCombat(s,dt);
 updateAuthored(s,dt);
 if(meta.kind==='dungeon'&&part==='key'&&s.enemies[r].every(e=>e.hp===0)&&!s.keys.includes(d)){s.keys.push(d);s.message='The sentries drop a warden key. The eastern gate opens.';}
 if(meta.kind==='dungeon'&&part==='heart'&&s.enemies[r].every(e=>e.hp===0)&&!s.relics.includes(d)&&Math.hypot(s.x-12.5,s.y-5.5)<1.2){s.relics.push(d);s.sword=Math.min(3,1+s.relics.length);s.maxHp=Math.max(s.maxHp,8+s.relics.length*2);s.hp=s.maxHp;s.potions=Math.min(s.tonicCapacity,s.potions+1);s.message='Heart restored. Your blade grows brighter. Return west to the waystone to save.';}
 if(r<15&&!camps.includes(r)&&!s.opened.includes(r)&&s.light&&Math.hypot(s.x-4.5,s.y-2.5)<.8){s.opened.push(r);s.coins+=5;s.potions=Math.min(s.tonicCapacity,s.potions+1);s.message='Lantern reveals a cache: five coins and a sunleaf tonic.';}
}
export function objective(s){if(s.expandedEnding)return 'The nine lights are joined. The Far Lantern shines for every land.';if(s.beaconRestored&&s.status==='playing')return expansionObjective(s);if(s.status==='won')return 'Dawn restored · explore or start a new journey.';if(s.status==='dead')return 'Your lantern dims. Continue from your last waystone or start anew.';if(s.relics.length===3)return 'Return to the northeast beacon. Raise the lantern and interact.';return `Restore ${['Rootvault (west grove)','Drowned Archive (central grove)','Prism Crypt (southeast)'][s.relics.length]} · ${s.relics.length}/3 hearts. E interacts; waystones heal and save.`;}
// Accept only canonical, bounded records; never merge arbitrary stored properties.
export function encode(s){return JSON.stringify({expansion:saveExpansion(s),progress:{events:s.events.filter(id=>eventIds.has(id)),dialogue:s.dialogue,puzzles:s.puzzleState},version:VERSION,room:s.room,hp:s.hp,maxHp:s.maxHp,potions:s.potions,coins:s.coins,sword:s.sword,relics:s.relics,keys:s.keys,switches:s.switches,opened:s.opened,visited:s.visited,enemies:s.enemies.slice(0,27).map(es=>es.map(e=>({hp:e.hp})))});}
export function decode(raw){try{if(typeof raw!=='string'||raw.length>1000000)return null;const v=JSON.parse(raw),s=fresh();const int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;const list=(v,a,b)=>Array.isArray(v)&&v.length<=b-a+1&&v.every(x=>int(x,a,b))&&new Set(v).size===v.length;if(![1,VERSION].includes(v.version)||v.version===1&&!camps.includes(v.room)||!roomInfo(v.room)?.checkpoint||!int(v.maxHp,8,v.version===1?14:40)||!int(v.hp,1,v.maxHp)||!int(v.potions,0,10)||!int(v.coins,0,9999)||!int(v.sword,1,3))return null;for(const k of ['relics','keys','switches'])if(!list(v[k],0,2))return null;if(!list(v.opened,0,26)||!Array.isArray(v.visited)||v.visited.length>rooms.length||new Set(v.visited).size!==v.visited.length||!v.visited.every(id=>roomById.has(id)&&(v.version!==1||id<=29)))return null;if(!Array.isArray(v.enemies)||v.enemies.length!==27)return null;for(let r=0;r<27;r++){if(!Array.isArray(v.enemies[r])||v.enemies[r].length!==s.enemies[r].length)return null;for(let i=0;i<s.enemies[r].length;i++){const e=v.enemies[r][i],base=s.enemies[r][i];if(!e||!int(e.hp,0,base.hp))return null;base.hp=e.hp;}}for(const k of ['room','hp','maxHp','potions','coins','sword','relics','keys','switches','opened','visited'])s[k]=v[k];if(!restoreProgress(s,v.progress))return null;if(!restoreExpansion(s,v.expansion,v.version))return null;[s.x,s.y]=roomInfo(s.room).checkpointAt||[3.5,5.5];if(!canStand(s,s.x,s.y))return null;s.message='The waystone remembers. Your journey continues.';return s;}catch{return null;}}

// Additive action for adapters: input.secondary or secondary(state).
export function secondary(s){
 if(s.status!=='playing'||s.discCooldown>0||!s.events.includes('reed-disc')&&!s.equipment.includes('sun-disc'))return false;
 s.discCooldown=.8;s.projectiles.push({x:s.x,y:s.y,dx:s.facing[0],dy:s.facing[1],life:1.5,disc:true,hits:[]});
 s.message='Sun-disc: its light stills moths and reaches distant shutters.';return true;
}
export const attackSecondary=secondary;
const near=(s,at,r=1.25)=>Math.hypot(s.x-at[0],s.y-at[1])<r;
function event(s,id){if(!s.events.includes(id))s.events.push(id);}
function reward(s,id){if(s.events.includes(id))return;const r=content.rewards.find(r=>r.id===id);event(s,id);s.coins=Math.min(9999,s.coins+(r.coins||0));if(r.stat==='tonicCapacity')s.tonicCapacity=10;s.potions=Math.min(s.tonicCapacity,s.potions+(r.tonics||0));s.message=r.weapon?'Sun-disc acquired. Interact away from people and objects to throw; face a distant shutter or enemy.':r.description||'A keeper’s gift: '+id+'.';}
function complete(s,id){event(s,id);const q=content.quests.find(q=>q.id===id),p=content.puzzles.find(p=>p.id===id);if(q||p)reward(s,(q||p).reward||content.optionalRooms.find(r=>r.puzzle===id).reward);}
function puzzle(s){return s.puzzleState[s.room] ||= {a:0,b:0,grown:false,charge:0};}
function authoredInteract(s){
 if(roomInfo(s.room)?.kind==='optional'){const room=content.optionalRooms[s.room-27],p=content.puzzles[s.room-27],v=puzzle(s);
 if(near(s,room.exit)){changeRoom(s,15+room.dungeon*4,5.5,3.5);return true;}
 const inscription=content.discoveries[s.room-27];if(near(s,inscription.at)){if(s.events.includes(p.id)){event(s,inscription.id);s.message=inscription.text;}else s.message=p.hint;return true;}
 for(const [i,o] of p.objects.entries())if(near(s,o.at)&&['toggle','rotate'].includes(o.action)){if(i===0||o.id==='prism-left')v.a=(v.a+1)%(o.orientations||2);else v.b=(v.b+1)%(o.orientations||2);s.message=p.hint+' Position '+v.a+' / '+v.b;return true;}
 if(secondary(s))return true;s.message=p.hint;return true;
 }
 const link=content.optionalLinks.find(l=>l.from===s.room&&near(s,l.at));if(link){changeRoom(s,27+content.optionalLinks.indexOf(link),1.5,5.5);s.message=content.puzzles[s.room-27].hint;return true;}
 for(const c of content.characters){const e=c.encounters.find(e=>e.room===s.room&&(!e.when||e.when.relics===s.relics.length)&&near(s,e.at,.95));if(e){if(!s.dialogue.includes(e.id))s.dialogue.push(e.id);s.message=s.events.includes(content.quests.find(q=>q.giver===c.id)?.id)?e.after||e.text:e.text;return true;}}
 return false;
}
function updateAuthored(s,dt){
 for(const q of content.quests){for(const st of q.steps){if(st.seconds&&!s.events.includes(st.id)&&!(st.room===s.room&&near(s,st.at)&&s.light)&&s.puzzleState.orchard)s.puzzleState.orchard.charge=0;if(st.room===s.room&&near(s,st.at)&&s.light){if(st.seconds){const v=s.puzzleState.orchard ||= {charge:0};v.charge=Math.min(100000,v.charge+dt);if(v.charge>=st.seconds)event(s,st.id);}else event(s,st.id);}}if(q.steps.every(st=>s.events.includes(st.id||st.discovery))&&!s.events.includes(q.id))complete(s,q.id);}
 if(roomInfo(s.room)?.kind!=='optional')return;const v=puzzle(s),i=s.room-27,p=content.puzzles[i];if(s.events.includes(p.id))return;
 if(i===0){if(v.a===1&&s.light&&near(s,[9.5,4.5]))v.charge=Math.min(100000,v.charge+dt);if(!v.grown&&!(v.a===1&&s.light&&near(s,[9.5,4.5])))v.charge=0;if(v.charge>=2)v.grown=true;if(v.grown&&v.a===0)complete(s,p.id);}
 if(i===1&&v.a===1&&v.b===2&&s.light&&near(s,[3.5,2.5]))complete(s,p.id);
 if(i===2&&v.a===1&&v.b===3&&s.light&&near(s,[3.5,2.5]))complete(s,p.id);
}
function hurt(s,n){if(s.inv>0)return;s.hp=Math.max(0,s.hp-n);s.inv=1.1;if(!s.hp)s.status='dead';}
function updateCombat(s,dt){
 for(const p of s.projectiles){p.life-=dt;if(p.disc&&p.life<.75){const distance=Math.hypot(s.x-p.x,s.y-p.y);if(distance<.4){p.life=0;continue;}p.dx=(s.x-p.x)/distance;p.dy=(s.y-p.y)/distance;}p.x+=p.dx*dt*8;p.y+=p.dy*dt*8;if(p.disc){for(const e of s.enemies[s.room])if(e.hp>0&&!p.hits.includes(e)&&Math.hypot(e.x-p.x,e.y-p.y)<.7){p.hits.push(e);e.stun=s.light?1.2:.3;if(!e.boss){e.hp--;if(!e.hp)s.coins=Math.min(9999,s.coins+3);}}if(s.room===27&&Math.hypot(p.x-4.5,p.y-4.5)<.7&&!p.shutter){p.shutter=true;puzzle(s).a=1-puzzle(s).a;}}else if(Math.hypot(p.x-s.x,p.y-s.y)<.5){hurt(s,1);p.life=0;}}
 s.projectiles=s.projectiles.filter(p=>p.life>0&&!solid(s,p.x,p.y));
 for(const e of s.enemies[s.room]){if(e.hp<=0)continue;e.stun=Math.max(0,e.stun-dt);if(e.stun)continue;
 const dx=s.x-e.x,dy=s.y-e.y,dist=Math.hypot(dx,dy);
 if(e.boss&&s.room>=30){expandedBoss(s,e,dt);continue;}
 if(e.boss&&s.light){const w=content.wardens[dungeon(s.room)];if(e.phase==='idle'){e.phase='tell';e.timer=w.pattern[0].seconds;e.aim=[dx/(dist||1),dy/(dist||1)];e.target=[s.x,s.y];s.message=w.name+': '+w.pattern[0].cue+'. '+w.counter;}
 e.timer-=dt;if(e.timer<=0){const i=w.pattern.findIndex(p=>p.phase===e.phase),next=w.pattern[(i+1)%3];e.phase=next.phase;e.timer=next.seconds;if(e.phase==='tell'){e.aim=[dx/(dist||1),dy/(dist||1)];e.target=[s.x,s.y];s.message=w.name+': '+w.pattern[0].cue;}}
 if(e.phase==='strike'){const [ax,ay]=e.aim;if(w.relic===0){move(s,e,ax*dt*4,ay*dt*4);if(dist<.9)hurt(s,2);}if(w.relic===1&&[-1.5,0,1.5].some(o=>Math.hypot(s.x-e.target[0]-o,s.y-e.target[1])<.75))hurt(s,2);if(w.relic===2){const angle=Math.atan2(ay,ax)+(1-e.timer/.8)*Math.PI/2; if(dist<6&&Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle)))<.17)hurt(s,2);}}
 if(e.phase==='recover'&&dist>1.2)move(s,e,dx/(dist||1)*dt*.9,dy/(dist||1)*dt*.9);
 }else if(!e.boss){e.timer-=dt;if(e.kind==='glass-sentinel'&&dist>3&&s.light){if(e.timer<=0){if(e.phase==='tell'){s.projectiles.push({x:e.x,y:e.y,dx:e.aim[0],dy:e.aim[1],life:1.2});e.phase='recover';e.timer=1.8;}else{e.phase='tell';e.aim=[dx/(dist||1),dy/(dist||1)];e.timer=1.1;s.message='Glass sentinel: its core brightens. Step sideways before the straight shot.';}}}else if(dist<(s.light?9:2.4)&&dist>.05){if(e.kind==='fen-moth'){if(e.timer<=0){e.phase=e.phase==='dive'?'orbit':'dive';e.timer=e.phase==='dive'?.65:1.2;}const orbit=e.phase==='orbit'&&dist>1.5;move(s,e,(orbit?-dy:dx)/dist*dt*(orbit?.7:1.7),(orbit?dx:dy)/dist*dt*(orbit?.7:1.7));}else move(s,e,dx/dist*dt*1.1,dy/dist*dt*1.1);}else {if(e.timer<=0){e.patrol=e.patrol===1?-1:1;e.timer=1;}move(s,e,(e.patrol||1)*dt*.35,0);}}
 if(dist<(e.boss?.85:.65)&&(!e.boss||!s.light))hurt(s,e.boss?2:1);
 }
}
const eventIds=new Set([...content.quests.flatMap(q=>[q.id,...q.steps.map(st=>st.id||st.discovery)]),...content.rewards.map(r=>r.id),...content.puzzles.map(p=>p.id),...content.discoveries.map(d=>d.id)]);
function restoreProgress(s,p){if(p===undefined)return true;if(!p||typeof p!=='object'||Array.isArray(p))return false;
 const strings=(v,allowed)=>Array.isArray(v)&&v.length<=allowed.size&&new Set(v).size===v.length&&v.every(x=>allowed.has(x));
 if(!strings(p.events,eventIds)||!strings(p.dialogue,new Set(content.characters.flatMap(c=>c.encounters.map(e=>e.id))))||!p.puzzles||typeof p.puzzles!=='object'||Array.isArray(p.puzzles))return false;
 for(const [k,v] of Object.entries(p.puzzles)){if(!['27','28','29','orchard'].includes(k)||!v||typeof v!=='object'||Array.isArray(v))return false;for(const [key,x] of Object.entries(v)){if(key==='grown'){if(typeof x!=='boolean')return false;}else if(!['a','b','charge'].includes(key)||!Number.isFinite(x)||x<0||x>(key==='charge'?100000:3)||key!=='charge'&&!Number.isInteger(x))return false;}}
 s.events=p.events;s.dialogue=p.dialogue;s.puzzleState=p.puzzles;s.tonicCapacity=s.events.includes('archive-cache')?10:9;return s.potions<=s.tonicCapacity;
}

/** Additive authored-content contract for expansion/world.mjs and expansion/dungeons.mjs.
 * Install before calling fresh() or decode(). Both modules export a data-only `campaign` object accepted by installExpansion(world, dungeons).
 * rooms: {id:30..2047,name,kind:'overworld'|'dungeon',land,dungeon,tiles:string[10],
 *   exits:{east|west|north|south:roomId},checkpoint?,checkpointAt?,encounters:[],
 *   links:[{id,at,to,entry,requires:[]}],gates:[{at,requires:[],equipment?}],
 *   hazards:[{at,damage,equipment?}],puzzles:[],rewards:[],shops:[],characters:[],ending?}.
 * Each puzzle has id, source:[x,y], seconds, shade?, controls:[{at,states,target}],
 *   requires:[], reward?; all controls must match while holding light at source.
 * Rewards: {id,at,requires,coins,tonics,equipment,seal,sword,maxHp}; quests:
 *   {id,text,requires:[],reward?}. Dependencies are event, quest, equipment or seal IDs,
 *   plus campaign-relic-0..2 / beacon-restored. Links never rewrite legacy exits.
 * Boss encounters use kind:'charge'|'volley'|'ring'|'sweep'|'cross'|'hunt', boss:true,
 *   hp,x,y,tell?,strike?,recover?. Maps are derived from actual links and exploration.
 * IDs and definitions must remain stable between releases. No module is required for
 * the legacy campaign; installation is atomic and rejects malformed authoring.
 */
const expansion={quests:[]};
const directions=['west','east','north','south'];
const safeId=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(x);
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=.25&&p[0]<=15.75&&p[1]>=.25&&p[1]<=9.75;
const requiresValid=a=>a===undefined||Array.isArray(a)&&a.length<=128&&a.every(safeId);
const bounded=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
const integer=(x,a,b)=>Number.isInteger(x)&&bounded(x,a,b);
const bossKinds=['charge','volley','ring','sweep','cross','hunt'];
function authored(condition,what){if(!condition)throw new TypeError('Invalid expansion '+what);}
export function installExpansion(...modules){
 const additions=modules.flatMap(m=>m?.campaign?[m.campaign]:m?[m]:[]);
 const incoming=additions.flatMap(m=>m.rooms||[]),quests=additions.flatMap(m=>m.quests||[]);
 authored(rooms.length+incoming.length<=2048,'room count');
 const ids=new Set(roomById.keys()),events=new Set(expansionIds());
 const claim=id=>{authored(safeId(id)&&!events.has(id),'event ID');events.add(id);};
 const deps=o=>authored(requiresValid(o.requires),'dependencies');
 const checkReward=r=>{claim(r.id);deps(r);if(r.at!==undefined)authored(point(r.at),'reward location');for(const k of ['coins','tonics','sword','maxHp'])if(r[k]!==undefined)authored(integer(r[k],0,k==='coins'?9999:k==='tonics'?10:k==='sword'?3:40),'reward '+k);for(const k of ['equipment','seal'])if(r[k]!==undefined)authored(safeId(r[k]),'reward '+k);};
 for(const r of incoming){
  authored(integer(r.id,30,2047)&&!ids.has(r.id),'room ID');ids.add(r.id);
  authored(typeof r.name==='string'&&r.name.length>0&&r.name.length<=160,'room name');
  authored(['overworld','dungeon'].includes(r.kind)&&integer(r.dungeon??-1,-1,255),'room kind');
  authored(Array.isArray(r.tiles)&&r.tiles.length===H&&r.tiles.every(row=>typeof row==='string'&&row.length===W&&/^[.#~D^=]+$/.test(row)),'collision grid');
  if(r.checkpoint)authored(point(r.checkpointAt||[3.5,5.5]),'checkpoint');
  authored(!r.exits||Object.keys(r.exits).every(k=>directions.includes(k)),'exits');
  authored((r.encounters||[]).length<=32,'encounter count');
  for(const e of r.encounters||[]){authored(point([e.x,e.y])&&integer(e.hp,1,100)&&(!e.boss||bossKinds.includes(e.kind)),'encounter');for(const k of ['tell','strike','recover'])if(e[k]!==undefined)authored(bounded(e[k],.1,10),'boss timing');}
  for(const l of r.links||[]){claim(l.id);deps(l);authored(point(l.at)&&point(l.entry),'link coordinates');}
  for(const g of r.gates||[]){authored(point(g.at),'gate');deps(g);if(g.equipment)authored(safeId(g.equipment),'gate equipment');}
  for(const h of r.hazards||[])authored(point(h.at)&&integer(h.damage,1,8)&&(!h.equipment||safeId(h.equipment)),'hazard');
  for(const p of r.puzzles||[]){claim(p.id);deps(p);authored(!p.mechanic||mechanics.includes(p.mechanic),'regional mechanic');authored(point(p.source)&&bounded(p.seconds??1,.04,30)&&Array.isArray(p.controls)&&p.controls.length<=8,'puzzle');for(const c of p.controls)authored(point(c.at)&&integer(c.states,2,8)&&integer(c.target,0,c.states-1),'puzzle control');if(p.reward)checkReward(p.reward);}
  for(const t of r.rewards||[])checkReward(t);
  for(const shop of r.shops||[]){claim(shop.id);authored(point(shop.at)&&integer(shop.price,0,9999),'shop');authored(shop.item==='tonic'||safeId(shop.item),'shop item');}
  for(const c of r.characters||[]){claim(c.id);deps(c);authored(point(c.at)&&typeof c.text==='string'&&c.text.length<=2000,'character');}
  if(r.ending){claim(r.ending.id);deps(r.ending);authored(point(r.ending.at)&&typeof r.ending.text==='string','ending');}
 }
 for(const q of quests){claim(q.id);deps(q);authored(typeof q.text==='string'&&q.text.length<=2000,'quest');if(q.reward)checkReward(q.reward);}
 const dependencyIds=new Set([...events,'beacon-restored','campaign-relic-0','campaign-relic-1','campaign-relic-2']);
 const allRooms=[...rooms,...incoming],allQuests=[...expansion.quests,...quests];
 for(const r of allRooms){for(const t of [...(r.rewards||[]),...(r.puzzles||[]).map(p=>p.reward).filter(Boolean)]){if(t.equipment)dependencyIds.add(t.equipment);if(t.seal)dependencyIds.add(t.seal);}for(const shop of r.shops||[])dependencyIds.add(shop.item);}
 for(const q of allQuests)if(q.reward){if(q.reward.equipment)dependencyIds.add(q.reward.equipment);if(q.reward.seal)dependencyIds.add(q.reward.seal);}
 const checkDependencies=o=>authored((o.requires||[]).every(id=>dependencyIds.has(id)),'unknown dependency');
 for(const r of incoming)for(const o of [...(r.links||[]),...(r.gates||[]),...(r.puzzles||[]),...(r.rewards||[]),...(r.characters||[]),...(r.ending?[r.ending]:[])])checkDependencies(o);
 for(const q of quests)checkDependencies(q);
 for(const r of incoming){for(const id of Object.values(r.exits||{}))authored(ids.has(id),'exit target');for(const l of r.links||[])authored(ids.has(l.to),'link target');}
 // Clone before publishing so caller mutations cannot silently change save validation.
 const copy=JSON.parse(JSON.stringify(incoming));
 for(const r of copy){r.dungeon??=-1;r.exits??={};rooms.push(r);roomById.set(r.id,r);names[r.id]=r.name;}
 expansion.quests.push(...JSON.parse(JSON.stringify(quests)));
 return copy.map(r=>r.id);
}
function spawnEncounter(r){return (r.encounters||[]).map(e=>({...e,phase:'idle',timer:0,stun:0}));}
function expansionIds(){return [...eventIds,...rooms.filter(r=>r.id>=30).flatMap(r=>[...(r.links||[]),...(r.puzzles||[]),...(r.rewards||[]),...(r.shops||[]),...(r.characters||[]),...(r.ending?[r.ending]:[])].flatMap(o=>[o.id,...(o.reward?[o.reward.id]:[])])),...expansion.quests.flatMap(q=>[q.id,...(q.reward?[q.reward.id]:[])])];}
function has(s,id){return id==='beacon-restored'?s.beaconRestored:id.startsWith('campaign-relic-')?s.relics.includes(Number(id.slice(15))):s.events.includes(id)||s.equipment.includes(id)||s.quests.includes(id)||s.seals.includes(id);}
function eligible(s,o){return (o.requires||[]).every(id=>has(s,id));}
function expandedSolid(s,x,y){const ix=Math.floor(x),iy=Math.floor(y),r=roomInfo(s.room),t=tile(s.room,ix,iy);if(t==='#')return true;if(t==='~'&&!s.light&&!s.equipment.includes('tide-boots'))return true;if(t==='^'&&!s.equipment.includes('ember-cloak'))return true;
 if((r.gates||[]).some(g=>Math.floor(g.at[0])===ix&&Math.floor(g.at[1])===iy&&(!eligible(s,g)||g.equipment&&!s.equipment.includes(g.equipment))))return true;
 if(t==='D'&&!(r.gates||[]).some(g=>Math.floor(g.at[0])===ix&&Math.floor(g.at[1])===iy&&eligible(s,g)&&(!g.equipment||s.equipment.includes(g.equipment))))return true;return false;}
function expandedReward(s,r){if(!r||s.events.includes(r.id)||!eligible(s,r))return false;event(s,r.id);s.coins=Math.min(9999,s.coins+(r.coins||0));s.potions=Math.min(s.tonicCapacity,s.potions+(r.tonics||0));if(r.equipment&&!s.equipment.includes(r.equipment))s.equipment.push(r.equipment);if(r.seal&&!s.seals.includes(r.seal))s.seals.push(r.seal);if(r.sword)s.sword=Math.max(s.sword,r.sword);if(r.maxHp){s.maxHp=Math.max(s.maxHp,r.maxHp);s.hp=s.maxHp;}s.message=r.text||'A keeper reward: '+(r.equipment||r.seal||r.id)+'.';return true;}
export function resetPuzzle(s,id){if(s.status!=='playing')return false;
 const r=roomInfo(s.room);if(r.kind==='optional'){const p=content.puzzles[s.room-27];if(id!==undefined&&id!==p.id||s.events.includes(p.id))return false;delete s.puzzleState[s.room];s.message=p.hint;return true;}
 const p=(r.puzzles||[]).find(p=>p.id===id);if(!p||s.events.includes(id))return false;delete s.expandedPuzzles[id];s.projectiles=[];s.message='The light mechanism returns to its starting position.';return true;}
function expansionInteract(s){
 // The original three-heart ending remains won until explicitly continued.
 if(s.room<30)return false;
 const r=roomInfo(s.room);
 if(r.checkpoint&&near(s,r.checkpointAt||[3.5,5.5])){s.hp=s.maxHp;s.message='Waystone: health restored. Save this checkpoint.';return 'save';}
 for(const l of r.links||[])if(near(s,l.at)){if(!eligible(s,l)){s.message=l.hint||'This road needs another keeper’s light.';return true;}event(s,l.id);changeRoom(s,l.to,...l.entry);return true;}
 for(const p of r.puzzles||[])if(p.mechanic&&near(s,p.source)){s.message=p.hint;return true;}
 for(const p of r.puzzles||[])for(let i=0;i<p.controls.length;i++)if(near(s,p.controls[i].at)){if(s.events.includes(p.id)){s.message='The mechanism holds its light.';return true;}const v=expandedPuzzle(s,p);if(p.mechanic){regionalInteract(s,p,v,i);s.message=p.hint;return true;}v.controls[i]=(v.controls[i]+1)%p.controls[i].states;v.charge=0;s.message=p.hint||`Light mechanism: ${v.controls.join(' / ')}`;return true;}
 for(const c of r.characters||[])if(near(s,c.at)&&eligible(s,c)){event(s,c.id);s.message=c.after&&s.quests.includes(c.quest)?c.after:c.text;return true;}
 for(const shop of r.shops||[])if(near(s,shop.at)){if(shop.item==='tonic'&&s.potions>=s.tonicCapacity){s.message='Your tonic satchel is full.';return true;}if(shop.item!=='tonic'&&s.equipment.includes(shop.item)){s.message='You already carry this equipment.';return true;}if(s.coins<shop.price){s.message=`The shop asks ${shop.price} coins.`;return true;}s.coins-=shop.price;event(s,shop.id);if(shop.item==='tonic')s.potions++;else s.equipment.push(shop.item);s.message='Trade complete.';return true;}
 for(const t of r.rewards||[])if(t.at&&near(s,t.at)&&eligible(s,t)&&(!t.clear||s.enemies[s.room].every(e=>e.hp===0))){expandedReward(s,t);return true;}
 if(r.ending&&near(s,r.ending.at)){if(s.light&&s.beaconRestored&&eligible(s,r.ending)){event(s,r.ending.id);s.expandedEnding=true;s.status='won';s.message=r.ending.text;}else s.message=r.ending.hint||'Join the keeper lights, then raise your lantern.';return true;}return false;
}
function expandedPuzzle(s,p){return s.expandedPuzzles[p.id] ||= {controls:p.controls.map(()=>0),charge:0};}
function expandedStep(s,dt){const r=roomInfo(s.room);
 let direction=null,entry=null;if(s.x<.5){direction='west';entry=[15.45,s.y];}else if(s.x>15.5){direction='east';entry=[.55,s.y];}else if(s.y<.5){direction='north';entry=[s.x,8.45];}else if(s.y>9.5){direction='south';entry=[s.x,.55];}
 if(direction&&r.exits[direction]!==undefined){const dest=roomInfo(r.exits[direction]),probe={...s,room:dest.id};if(canStand(probe,...entry)){changeRoom(s,dest.id,...entry);return;}}
 updateCombat(s,dt);
 for(const h of r.hazards||[])if(near(s,h.at,.65)&&(!h.equipment||!s.equipment.includes(h.equipment)))hurt(s,h.damage);
 for(const p of r.puzzles||[]){if(s.events.includes(p.id))continue;const v=expandedPuzzle(s,p);const ready=regionalStep(s,p,v,dt);const active=eligible(s,p)&&ready&&s.light!==Boolean(p.shade)&&near(s,p.source,.8)&&(p.mechanic||p.controls.every((c,i)=>v.controls[i]===c.target));v.charge=active?Math.min(p.seconds??1,v.charge+dt):0;if(v.charge>=(p.seconds??1)){event(s,p.id);expandedReward(s,p.reward);s.message=p.text||'The light circuit is complete.';}}
 for(const q of expansion.quests)if(!s.quests.includes(q.id)&&eligible(s,q)){s.quests.push(q.id);expandedReward(s,q.reward);s.message=q.text;}
}
export function continueAdventure(s,entryId,at){if(s.status!=='won'||!s.beaconRestored||s.expandedEnding)return false;const r=roomInfo(entryId);if(!r||r.id<30||!point(at||r.checkpointAt||[3.5,5.5]))return false;const pos=at||r.checkpointAt||[3.5,5.5];if(!canStand({...s,room:entryId},...pos))return false;s.status='playing';changeRoom(s,entryId,...pos);s.message='Mira: Dawn has returned here, but six distant keeper lights remain silent. Follow their roads and join them at the Far Lantern.';return true;}
function expansionObjective(s){const q=expansion.quests.find(q=>!s.quests.includes(q.id));return q?.text||`Join the distant keeper lights · ${s.seals.filter(id=>['river-seal','cinder-seal','gale-seal','frost-seal','night-seal','dawn-seal'].includes(id)).length}/6 seals. Seek the Far Lantern.`;}
export function campaignMap(s){return rooms.map(r=>({id:r.id,name:r.name,kind:r.kind,land:r.land,dungeon:r.dungeon,visited:s.visited.includes(r.id),checkpoint:!!r.checkpoint,exits:{...r.exits},links:(r.links||[]).map(l=>({to:l.to,open:eligible(s,l)}))}));}
function expandedBoss(s,e,dt){const dx=s.x-e.x,dy=s.y-e.y,dist=Math.hypot(dx,dy)||1;
 if(!s.light){e.phase='idle';e.timer=0;return;}
 if(e.phase==='idle'){e.phase='tell';e.timer=e.tell||1.3;e.aim=[dx/dist,dy/dist];e.target=[s.x,s.y];s.message=(e.name||e.kind)+': '+({charge:'a straight trail glows',volley:'three sparks gather',ring:'a circle expands',sweep:'a beam turns clockwise',cross:'two lanes brighten',hunt:'a shadow marks your last step'}[e.kind])+'.';}
 e.timer-=dt;if(e.timer<=0){if(e.phase==='tell'){e.phase='strike';e.timer=e.strike||.6;e.fired=false;}else if(e.phase==='strike'){e.phase='recover';e.timer=e.recover||1.5;}else{e.phase='idle';} }
 if(e.phase!=='strike')return;
 if(e.kind==='charge')move(s,e,e.aim[0]*dt*4,e.aim[1]*dt*4);
 if(e.kind==='hunt')move(s,e,(e.target[0]-e.x)*dt*5,(e.target[1]-e.y)*dt*5);
 if(e.kind==='volley'&&!e.fired){e.fired=true;const a=Math.atan2(e.aim[1],e.aim[0]);for(const o of [-.3,0,.3])s.projectiles.push({x:e.x,y:e.y,dx:Math.cos(a+o),dy:Math.sin(a+o),life:1.3});}
 const angle=Math.atan2(dy,dx),aim=Math.atan2(e.aim[1],e.aim[0])+(1-e.timer/(e.strike||.6))*Math.PI;
 if((['charge','hunt'].includes(e.kind)&&dist<1)||(e.kind==='ring'&&Math.abs(dist-(1-e.timer/(e.strike||.6))*6)<.65)||(e.kind==='cross'&&(Math.abs(s.x-e.target[0])<.6||Math.abs(s.y-e.target[1])<.6))||(e.kind==='sweep'&&dist<7&&Math.abs(Math.atan2(Math.sin(angle-aim),Math.cos(angle-aim)))<.2))hurt(s,2);
}
function saveExpansion(s){return {equipment:s.equipment,quests:s.quests,seals:s.seals,puzzles:s.expandedPuzzles,beaconRestored:s.beaconRestored,ending:s.expandedEnding,events:s.events.filter(id=>!eventIds.has(id)),enemies:Object.fromEntries(rooms.filter(r=>r.id>=30).map(r=>[r.id,(s.enemies[r.id]||[]).map(e=>e.hp)]))};}
function restoreExpansion(s,v,version){if(v===undefined)return version===1||!rooms.some(r=>r.id>=30);
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 const allowed=new Set(expansionIds()),equipment=new Set(),seals=new Set();
 for(const r of rooms.filter(r=>r.id>=30)){for(const t of [...(r.rewards||[]),...(r.puzzles||[]).map(p=>p.reward).filter(Boolean)]){if(t.equipment)equipment.add(t.equipment);if(t.seal)seals.add(t.seal);}for(const shop of r.shops||[])if(shop.item!=='tonic')equipment.add(shop.item);}
 for(const q of expansion.quests){if(q.reward?.equipment)equipment.add(q.reward.equipment);if(q.reward?.seal)seals.add(q.reward.seal);}
 const strings=(a,set)=>Array.isArray(a)&&a.length<=set.size&&new Set(a).size===a.length&&a.every(id=>set.has(id));
 if(!strings(v.equipment,equipment)||!strings(v.seals,seals)||!strings(v.quests,new Set(expansion.quests.map(q=>q.id)))||!strings(v.events,allowed)||typeof v.beaconRestored!=='boolean'||typeof v.ending!=='boolean'||v.ending&&!v.beaconRestored)return false;
 if(!v.puzzles||typeof v.puzzles!=='object'||Array.isArray(v.puzzles)||!v.enemies||typeof v.enemies!=='object'||Array.isArray(v.enemies))return false;
 const definitions=new Map(rooms.flatMap(r=>r.puzzles||[]).map(p=>[p.id,p]));
 for(const [id,a] of Object.entries(v.puzzles)){const p=definitions.get(id);if(!p||!a||!Array.isArray(a.controls)||a.controls.length!==p.controls.length||!a.controls.every((n,i)=>integer(n,0,p.controls[i].states-1))||!bounded(a.charge,0,p.seconds??1))return false;if(a.marks!==undefined&&(!Array.isArray(a.marks)||a.marks.length!==p.controls.length||!a.marks.every(n=>integer(n,0,1))))return false;if(a.dwell!==undefined&&(!Array.isArray(a.dwell)||a.dwell.length!==p.controls.length||!a.dwell.every(n=>bounded(n,0,.6))))return false;for(const k of ['reserve','rest'])if(a[k]!==undefined&&!bounded(a[k],0,k==='reserve'?20:.6))return false;}
 for(const [id,hps] of Object.entries(v.enemies)){const r=roomInfo(Number(id));if(!r||r.id<30||String(r.id)!==id||!Array.isArray(hps)||hps.length!==s.enemies[r.id].length||!hps.every((hp,i)=>integer(hp,0,s.enemies[r.id][i].hp)))return false;hps.forEach((hp,i)=>s.enemies[r.id][i].hp=hp);}
 // Newly installed rooms retain their authored encounters when absent in an older checkpoint.
 s.equipment=[...v.equipment];s.seals=[...v.seals];s.quests=[...v.quests];s.expandedPuzzles=structuredClone(v.puzzles);s.beaconRestored=v.beaconRestored;s.expandedEnding=v.ending;for(const id of v.events)event(s,id);if(s.expandedEnding&&!rooms.some(r=>r.ending&&s.events.includes(r.ending.id)&&eligible(s,r.ending)))return false;return true;
}
