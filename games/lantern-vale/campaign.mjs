import * as content from './content.mjs?v=0.2.0-alpha.4';
// Data and deterministic rules are independent from the browser and renderer.
export const W=16,H=10, VERSION=1;
export const lands=['Mossward','Amber Fen','Glass Highlands'];
export const entrances=[6,8,14];
export const camps=[0,2,4,6,8,14];
export const names=Array.from({length:27},(_,id)=>id<15?`${lands[Math.min(2,Math.floor((id%5)/2))]} · ${['Verge','Crossing','Grove'][Math.floor(id/5)]} ${id%5+1}`:`${['Rootvault','Drowned Archive','Prism Crypt'][Math.floor((id-15)/4)]} · ${['Threshold','Lantern Trial','Warden Hall','Heart Chamber'][(id-15)%4]}`);
names.push(...content.optionalRooms.map(r=>r.name));
export function fresh(){const state={version:VERSION,room:0,x:3.5,y:5.5,facing:[1,0],hp:8,maxHp:8,light:false,status:'playing',inv:0,cooldown:0,swing:0,potions:2,coins:0,sword:1,relics:[],keys:[],switches:[],opened:[],visited:[0],message:'Mira: The three wardens swallowed our dawn. Take my lantern. Restore their hearts, then return to the northern beacon.',enemies:Array.from({length:27},(_,r)=>camps.includes(r)?[]:r>=15?(r-15)%4===3?[{x:11.5,y:5.5,hp:8,boss:true}]:[{x:10.5,y:4.5,hp:3},{x:12.5,y:6.5,hp:3}]:[{x:11.5,y:4.5,hp:2},{x:12.5,y:7.5,hp:2}])}; state.events=[];state.dialogue=[];state.puzzleState={};state.tonicCapacity=9;state.discCooldown=0;state.projectiles=[];state.enemies.push([],[],[]);for(let r=0;r<30;r++)for(const e of state.enemies[r])Object.assign(e,{kind:e.boss?content.wardens[dungeon(r)].id:r<15?content.enemyTypes[Math.min(2,Math.floor(r%5/2))].id:'brambleling',phase:'idle',timer:0,stun:0});return state;}
export function dungeon(r){if(r>=27)return r-27;return r>=15?Math.floor((r-15)/4):-1;}
export function tile(r,x,y){
 if(x<0||x>=W||y<0||y>=H)return '#';
 if(r>=27)return x===0||x===15||y===0||y===9?'#':'.';
 if(r<15){if(y===0)return r>=5&&x===8?'.':'#';if(y===9)return r<10&&x===8?'.':'#';if(x===0)return r%5>0&&y===5?'.':'#';if(x===15)return r%5<4&&y===5?'.':'#';}
 else {if(y===0||y===9)return '#';if(x===0)return y===5?'.':'#';if(x===15)return (r-15)%4<3&&y===5?'D':'#';if((r-15)%4===1&&x===8)return y===5?'~':'#';}
 if((x===6||x===10)&&(y===3||y===7))return '#';
 return '.';
}
function gateOpen(s){const d=dungeon(s.room),part=(s.room-15)%4;return part===0||part===1&&s.switches.includes(d)||part===2&&s.keys.includes(d);}
export function solid(s,x,y){const t=tile(s.room,Math.floor(x),Math.floor(y));return t==='#'||t==='~'&&!s.light||t==='D'&&!gateOpen(s);}
export function canStand(s,x,y){return [-.23,.23].every(a=>[-.23,.23].every(b=>!solid(s,x+a,y+b)));}
function move(s,a,dx,dy){if(canStand(s,a.x+dx,a.y))a.x+=dx;if(canStand(s,a.x,a.y+dy))a.y+=dy;}
export function toggle(s){if(s.status==='playing'){s.light=!s.light;if(s.light)for(const e of s.enemies[s.room])if(e.kind==='brambleling')e.stun=s.events.includes('prism-cache')?.8:.6;}}
export function pause(s){if(s.status==='playing')s.status='paused';else if(s.status==='paused')s.status='playing';}
export function attack(s){if(s.status!=='playing'||s.cooldown>0)return;s.cooldown=.3;s.swing=.17;for(const e of s.enemies[s.room]){const dx=e.x-s.x,dy=e.y-s.y;if(e.hp>0&&(!e.boss||!s.light||e.phase==='recover'||e.phase==='idle')&&Math.hypot(dx,dy)<1.8&&dx*s.facing[0]+dy*s.facing[1]>-.15){e.hp=Math.max(0,e.hp-s.sword);if(!e.hp)s.coins+=e.boss?12:3;}}}
export function potion(s){if(s.status!=='playing'||!s.potions||s.hp===s.maxHp)return false;s.potions--;s.hp=Math.min(s.maxHp,s.hp+5);s.message='Sunleaf tonic restores five hearts.';return true;}
function changeRoom(s,r,x,y){s.room=r;s.x=x;s.y=y;s.inv=1;s.projectiles=[];s.message=names[r]||content.optionalRooms[r-27]?.name;if(!s.visited.includes(r))s.visited.push(r);}
export function interact(s){
 if(s.status!=='playing')return false;
 if(authoredInteract(s))return true;
 if(camps.includes(s.room)&&Math.hypot(s.x-3.5,s.y-5.5)<1.6){s.hp=s.maxHp;if(s.coins>=6&&s.potions<s.tonicCapacity){s.coins-=6;s.potions++;}s.message='Waystone: health restored. Checkpoint saved. Six coins buys one tonic when available.';return 'save';}
 const d=entrances.indexOf(s.room);if(d>=0&&Math.hypot(s.x-12.5,s.y-2.5)<1.6){changeRoom(s,15+d*4,1.5,5.5);s.message=['Rootvault: carry light across the broken roots.','Drowned Archive: awaken the sun plate, then defeat its sentries.','Prism Crypt: the last warden guards the stolen dawn.'][d]+' Optional keeper chamber: interact at the northwest alcove (5.5, 2.5).';return true;}
 if(s.room===4&&Math.hypot(s.x-12.5,s.y-5.5)<1.6){if(s.relics.length===3&&s.light){s.status='won';s.message='Mira watches the dawn climb over Lantern Vale. The wardens sleep; the roads are yours again.';}else s.message='The beacon needs all three heart relics and a raised lantern.';return true;}
 if(secondary(s))return true;s.message='Seek a glowing waystone, dungeon stair, sun plate or treasure chest.';return false;
}
export function step(s,input,dt){
 if(s.status!=='playing'||!Number.isFinite(dt))return;dt=Math.max(0,Math.min(dt,.04));
 if(input.secondary)secondary(s);
 s.discCooldown=Math.max(0,s.discCooldown-dt);
 for(const k of ['inv','cooldown','swing'])s[k]=Math.max(0,s[k]-dt);
 let dx=Number.isFinite(input.x)?input.x:0,dy=Number.isFinite(input.y)?input.y:0;const n=Math.hypot(dx,dy);if(n){dx/=n;dy/=n;s.facing=[dx,dy];move(s,s,dx*3.5*dt,dy*3.5*dt);}
 const r=s.room,d=dungeon(r),part=(r-15)%4;
 if(r<15){let dest=r,px=s.x,py=s.y;if(s.x>15.5){dest=r+1;px=.55;}else if(r<27&&s.x<.5){dest=r-1;px=15.45;}else if(s.y<.5){dest=r-5;py=8.45;}else if(s.y>9.5){dest=r+5;py=.55;}
 // South doorway crosses at 9.5; tile map includes the outer half-tile apron.
 if(dest!==r){const column=dest%5,need=column>=4?2:column>=2?1:0;if(s.relics.length<need){s.x=Math.max(.55,Math.min(15.45,s.x));s.y=Math.max(.55,Math.min(9.45,s.y));s.message=`The dusk veil needs ${need} restored heart relic${need===1?'':'s'}.`;}else changeRoom(s,dest,px,py);}}
 else if(r<27&&s.x<.5){if(part===0)changeRoom(s,entrances[d],12.5,3.5);else changeRoom(s,r-1,14.5,5.5);}else if(s.x>15.5&&part<3)changeRoom(s,r+1,.55,5.5);
 if(s.room!==r)return;
 if(r<27&&d>=0&&part===1&&s.light&&Math.hypot(s.x-12.5,s.y-5.5)<.8&&!s.switches.includes(d)){s.switches.push(d);s.message='The sun plate opens the sealed hall.';}
 updateCombat(s,dt);
 updateAuthored(s,dt);
 if(r<27&&d>=0&&part===2&&s.enemies[r].every(e=>e.hp===0)&&!s.keys.includes(d)){s.keys.push(d);s.message='The sentries drop a warden key. The eastern gate opens.';}
 if(r<27&&d>=0&&part===3&&s.enemies[r].every(e=>e.hp===0)&&!s.relics.includes(d)&&Math.hypot(s.x-12.5,s.y-5.5)<1.2){s.relics.push(d);s.sword=Math.min(3,1+s.relics.length);s.maxHp=8+s.relics.length*2;s.hp=s.maxHp;s.potions=Math.min(s.tonicCapacity,s.potions+1);s.message='Heart restored. Your blade grows brighter. Return west to the waystone to save.';}
 if(r<15&&!camps.includes(r)&&!s.opened.includes(r)&&s.light&&Math.hypot(s.x-4.5,s.y-2.5)<.8){s.opened.push(r);s.coins+=5;s.potions=Math.min(s.tonicCapacity,s.potions+1);s.message='Lantern reveals a cache: five coins and a sunleaf tonic.';}
}
export function objective(s){if(s.status==='won')return 'Dawn restored · explore or start a new journey.';if(s.status==='dead')return 'Your lantern dims. Continue from your last waystone or start anew.';if(s.relics.length===3)return 'Return to the northeast beacon. Raise the lantern and interact.';return `Restore ${['Rootvault (west grove)','Drowned Archive (central grove)','Prism Crypt (southeast)'][s.relics.length]} · ${s.relics.length}/3 hearts. E interacts; waystones heal and save.`;}
// Accept only canonical, bounded records; never merge arbitrary stored properties.
export function encode(s){return JSON.stringify({progress:{events:s.events,dialogue:s.dialogue,puzzles:s.puzzleState},version:VERSION,room:s.room,hp:s.hp,maxHp:s.maxHp,potions:s.potions,coins:s.coins,sword:s.sword,relics:s.relics,keys:s.keys,switches:s.switches,opened:s.opened,visited:s.visited,enemies:s.enemies.slice(0,27).map(es=>es.map(e=>({hp:e.hp})))});}
export function decode(raw){try{if(typeof raw!=='string'||raw.length>20000)return null;const v=JSON.parse(raw),s=fresh();const int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;const list=(v,a,b)=>Array.isArray(v)&&v.length<=b-a+1&&v.every(x=>int(x,a,b))&&new Set(v).size===v.length;if(v.version!==VERSION||!camps.includes(v.room)||!int(v.maxHp,8,14)||!int(v.hp,1,v.maxHp)||!int(v.potions,0,10)||!int(v.coins,0,9999)||!int(v.sword,1,3))return null;for(const k of ['relics','keys','switches'])if(!list(v[k],0,2))return null;if(!list(v.opened,0,26)||!list(v.visited,0,29))return null;if(!Array.isArray(v.enemies)||v.enemies.length!==27)return null;for(let r=0;r<27;r++){if(!Array.isArray(v.enemies[r])||v.enemies[r].length!==s.enemies[r].length)return null;for(let i=0;i<s.enemies[r].length;i++){const e=v.enemies[r][i],base=s.enemies[r][i];if(!e||!int(e.hp,0,base.hp))return null;base.hp=e.hp;}}for(const k of ['room','hp','maxHp','potions','coins','sword','relics','keys','switches','opened','visited'])s[k]=v[k];if(!restoreProgress(s,v.progress))return null;s.x=3.5;s.y=5.5;s.message='The waystone remembers. Your journey continues.';return s;}catch{return null;}}

// Additive action for adapters: input.secondary or secondary(state).
export function secondary(s){
 if(s.status!=='playing'||s.discCooldown>0||!s.events.includes('reed-disc'))return false;
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
 if(s.room>=27){const room=content.optionalRooms[s.room-27],p=content.puzzles[s.room-27],v=puzzle(s);
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
 if(s.room<27)return;const v=puzzle(s),i=s.room-27,p=content.puzzles[i];if(s.events.includes(p.id))return;
 if(i===0){if(v.a===1&&s.light&&near(s,[9.5,4.5]))v.charge=Math.min(100000,v.charge+dt);if(!v.grown&&!(v.a===1&&s.light&&near(s,[9.5,4.5])))v.charge=0;if(v.charge>=2)v.grown=true;if(v.grown&&v.a===0)complete(s,p.id);}
 if(i===1&&v.a===1&&v.b===2&&s.light&&near(s,[3.5,2.5]))complete(s,p.id);
 if(i===2&&v.a===1&&v.b===3&&s.light&&near(s,[3.5,2.5]))complete(s,p.id);
}
function hurt(s,n){if(s.inv>0)return;s.hp=Math.max(0,s.hp-n);s.inv=1.1;if(!s.hp)s.status='dead';}
function updateCombat(s,dt){
 for(const p of s.projectiles){p.life-=dt;if(p.disc&&p.life<.75){const distance=Math.hypot(s.x-p.x,s.y-p.y);if(distance<.4){p.life=0;continue;}p.dx=(s.x-p.x)/distance;p.dy=(s.y-p.y)/distance;}p.x+=p.dx*dt*8;p.y+=p.dy*dt*8;if(p.disc){for(const e of s.enemies[s.room])if(e.hp>0&&!p.hits.includes(e)&&Math.hypot(e.x-p.x,e.y-p.y)<.7){p.hits.push(e);e.stun=s.light?1.2:.3;if(!e.boss){e.hp--;if(!e.hp)s.coins+=3;}}if(s.room===27&&Math.hypot(p.x-4.5,p.y-4.5)<.7&&!p.shutter){p.shutter=true;puzzle(s).a=1-puzzle(s).a;}}else if(Math.hypot(p.x-s.x,p.y-s.y)<.5){hurt(s,1);p.life=0;}}
 s.projectiles=s.projectiles.filter(p=>p.life>0&&!solid(s,p.x,p.y));
 for(const e of s.enemies[s.room]){if(e.hp<=0)continue;e.stun=Math.max(0,e.stun-dt);if(e.stun)continue;
 const dx=s.x-e.x,dy=s.y-e.y,dist=Math.hypot(dx,dy);
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
