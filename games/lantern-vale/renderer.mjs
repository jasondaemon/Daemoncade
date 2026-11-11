import {characters,quests,puzzles,optionalLinks} from './content.mjs?v=0.2.0-alpha.4';
import {tile,solid,camps,entrances,dungeon} from './campaign.mjs?v=0.2.0-alpha.4';

// Rendering consumes the campaign state without changing collision or progression.
const feedback=new WeakMap();
export function drawWorld(g,atlas,s,time,moving=false){
 const previous=feedback.get(s)||{hp:s.hp,hits:new Map(),enemies:new Map()};
 if(s.hp<previous.hp)previous.flash=time+240;
 previous.hp=s.hp;feedback.set(s,previous);
 const d=dungeon(s.room),land=s.room<15?Math.min(2,Math.floor(s.room%5/2)):d;
 const terrain=['mossward','amber-fen','glass-highlands','rootvault','drowned-archive','prism-crypt'][s.room<15?land:3+d];
 const set=atlas.manifest.terrainSets[terrain];
 const draw=(name,x,y,scale=1,clock=time)=>atlas.draw(g,name,x,y,clock,scale);
 for(let y=0;y<10;y++)for(let x=0;x<16;x++){
  const t=tile(s.room,x,y),px=x*40,py=y*40;
  draw(set.floor[(x+y*7)%set.floor.length],px,py);
  if(t==='#')draw(set.wall[(x+y)%set.wall.length],px,py);
  if(t==='~'){draw(set.water,px,py);if(s.light)draw('prop.bridge.0',px+20,py+20);}
  if(t==='D'&&solid(s,x+.5,y+.5))draw('prop.gate.0',px+20,py+20);
 }
 if(s.room<15)for(const [x,y] of [[2.5,1.5],[5.5,8.5],[13.5,8.5]])draw(`prop.${terrain}.foliage`,x*40,y*40);
 // Authored interaction silhouettes stay at the coordinates used by the rules.
 for(const person of characters)for(const encounter of person.encounters){
  if(encounter.room!==s.room||(encounter.when&&encounter.when.relics!==s.relics.length))continue;
  draw('effect.shadow',encounter.at[0]*40,encounter.at[1]*40+14);
  draw('npc.mira',encounter.at[0]*40,encounter.at[1]*40);
  label(person.name+' · E',encounter.at[0]*40,encounter.at[1]*40-29);
 }
 for(const link of optionalLinks)if(link.from===s.room){draw('prop.stairs.0',link.at[0]*40,link.at[1]*40);label('Keeper chamber · E',link.at[0]*40,link.at[1]*40-26);}
 for(const q of quests)for(const st of q.steps)if(st.room===s.room){
  draw(q.id==='quest-orchard'?'prop.mossward.foliage':'prop.amber-fen.foliage',st.at[0]*40,st.at[1]*40);
  if(s.light){draw(s.events.includes(st.id)?'effect.spark':'effect.light-burst',st.at[0]*40,st.at[1]*40);label(s.events.includes(st.id)?'Awakened':'L · lend light',st.at[0]*40,st.at[1]*40-28);}
 }
 if(s.room>=27){
  const p=puzzles[s.room-27],v=s.puzzleState[s.room]||{},done=s.events.includes(p.id);
  draw('prop.stairs-up.0',60,220);label('Return · E',60,190);
  for(const [i,o] of p.objects.entries()){
   const value=(i===0||o.id==='prism-left'?v.a:v.b)||0;
   draw(o.action==='illuminate'?(s.light?'prop.plate-lit.0':'prop.plate.0'):o.action==='rotate'?'prop.relic-prism':'prop.gate.0',o.at[0]*40,o.at[1]*40);
   label(o.action==='illuminate'?'L · light':o.action==='rotate'?['N','E','S','W'][value]+' · E':value?'Open · E':'Closed · E',o.at[0]*40,o.at[1]*40-29);
   if(s.light&&o.action==='illuminate')draw('effect.lantern-glow',o.at[0]*40,o.at[1]*40);
  }
  if(v.grown)draw('prop.bridge.0',380,180);
  if(v.charge>0&&!done){g.fillStyle='#f4ce83';g.fillRect(352,204,56*Math.min(1,v.charge/2),4);}
  draw(done?'prop.chest-open.0':'prop.chest.0',500,100);label(done?'Inscription · E':'Keeper seal',500,70);
 }
 function label(text,x,y){g.font='12px system-ui';g.textAlign='center';g.fillStyle='#10151ee8';g.fillRect(x-text.length*3.5-4,y-12,text.length*7+8,18);g.fillStyle='#ffe3aa';g.fillText(text,x,y);}
 if(camps.includes(s.room))draw('prop.waystone',140,220);
 if(entrances.includes(s.room))draw('prop.stairs.0',500,100);
 if(s.room<27&&d>=0&&(s.room-15)%4===0)draw('prop.stairs-up.0',60,220);
 if(s.room===4)draw('prop.beacon',500,220);
 if(s.room<15&&!camps.includes(s.room)&&(s.opened.includes(s.room)||s.light))draw(s.opened.includes(s.room)?'prop.chest-open.0':'prop.chest.0',180,100);
 if(s.room<27&&d>=0&&(s.room-15)%4===1)draw(s.switches.includes(d)?'prop.plate-lit.0':'prop.plate.0',500,220);
 if(s.room<27&&d>=0&&(s.room-15)%4===3&&!s.relics.includes(d))draw(['prop.relic-root','prop.relic-tide','prop.relic-prism'][d],500,220);
 for(const e of s.enemies[s.room])if(e.hp>0){
  const kind=e.boss?['root-warden','tide-warden','prism-warden'][d]:e.kind==='brambleling'?'briarling':e.kind||['briarling','fen-moth','glass-sentinel'][land];
  const active=(!e.boss||s.light)&&Math.hypot(s.x-e.x,s.y-e.y)<(s.light?9:2.4);
  const old=previous.enemies.get(e);if(old!==undefined&&e.hp<old)previous.hits.set(e,time+220);previous.enemies.set(e,e.hp);
  const phase=e.stun>0||previous.hits.get(e)>time?'hurt':e.phase==='tell'?'windup':e.phase==='strike'||e.phase==='dive'?'attack':active?'walk':'idle';
  if((e.phase==='tell'||e.phase==='strike')&&(!e.boss||s.light)){
   const strike=e.phase==='strike';g.fillStyle=strike?'#ff6e5899':'#ffcd6a77';
   if(e.boss&&d===1&&e.target)for(const offset of [-1.5,0,1.5])draw('effect.danger-ring',(e.target[0]+offset)*40,e.target[1]*40,strike?1.4:1);
   else if(e.aim){g.save();g.translate(e.x*40,e.y*40);let angle=Math.atan2(e.aim[1],e.aim[0]);if(e.boss&&d===2&&strike)angle+=(1-e.timer/.8)*Math.PI/2;g.rotate(angle);g.fillRect(0,-(d===0?18:4),e.boss?240:160,d===0?36:8);g.restore();}
   draw('effect.danger-ring',e.x*40,e.y*40);
  }
  if(e.boss&&e.phase==='recover')label('Exposed',e.x*40,e.y*40-48);
  draw('effect.shadow',e.x*40,e.y*40+14);
  draw(`enemy.${kind}.${phase}`,e.x*40,e.y*40);
  g.fillStyle='#e59c72';g.fillRect(e.x*40-12,e.y*40-(e.boss?40:22),24*e.hp/(e.boss?8:s.room>=15?3:2),3);
 }
 for(const p of s.projectiles||[])draw(p.disc?'prop.secondary-boomerang.0':'effect.projectile',p.x*40,p.y*40);
 const x=s.x*40,y=s.y*40;
 if(s.light)draw('effect.lantern-glow',x,y,3);
 if(!s.inv||Math.floor(s.inv*14)%2){
  const direction=Math.abs(s.facing[0])>=Math.abs(s.facing[1])?(s.facing[0]<0?'left':'right'):(s.facing[1]<0?'up':'down');
  draw('effect.shadow',x,y+14);
  draw(`keeper.${direction}.${s.swing?'strike':moving?'walk':'idle'}`,x,y,1,s.swing?(.17-s.swing)*1000:time);
 }
 if(s.swing){g.save();g.translate(x,y);g.rotate(Math.atan2(s.facing[1],s.facing[0]));draw('effect.sword-arc',0,0,1,(.17-s.swing)*1000);g.restore();}
 if(previous.flash>time){g.fillStyle='#f0786544';g.fillRect(0,0,640,400);draw('effect.spark',x,y);}
 if(!s.light&&d>=0){const shade=g.createRadialGradient(x,y,25,x,y,260);shade.addColorStop(0,'#080a1000');shade.addColorStop(1,'#080a10d9');g.fillStyle=shade;g.fillRect(0,0,640,400);}
}

// A readable emergency map keeps play available if the local image cannot decode.
export function drawFallback(g,s){
 for(let y=0;y<10;y++)for(let x=0;x<16;x++){const t=tile(s.room,x,y);g.fillStyle=t==='#'?'#575568':t==='~'?(s.light?'#b8ad7c':'#173650'):'#243b38';g.fillRect(x*40,y*40,39,39);}
 const mark=(x,y,color,text)=>{g.fillStyle=color;g.fillRect(x*40-12,y*40-12,24,24);g.fillStyle='#10151e';g.font='16px system-ui';g.textAlign='center';g.fillText(text,x*40,y*40+5);};
 if(camps.includes(s.room))mark(3.5,5.5,'#f4d080','W');
 if(entrances.includes(s.room))mark(12.5,2.5,'#f4d080','E');
 if(s.room===4)mark(12.5,5.5,'#f4d080','B');
 if(s.room>=15&&s.room<27){const part=(s.room-15)%4;if(part===0)mark(1.5,5.5,'#f4d080','E');if(part===1)mark(12.5,5.5,'#f4d080','P');if(part===3)mark(12.5,5.5,'#f4d080','R');}
 for(const person of characters)for(const e of person.encounters)if(e.room===s.room&&(!e.when||e.when.relics===s.relics.length))mark(...e.at,'#a9c2e0','E');
 for(const link of optionalLinks)if(link.from===s.room)mark(...link.at,'#f4d080','E');
 if(s.room>=27){mark(1.5,5.5,'#f4d080','E');for(const o of puzzles[s.room-27].objects)mark(...o.at,'#f4d080',o.action==='illuminate'?'L':'E');mark(12.5,2.5,'#f4d080','E');}
 for(const p of s.projectiles)mark(p.x,p.y,'#f4d080','·');
 for(const e of s.enemies[s.room])if(e.hp>0)mark(e.x,e.y,'#e58b83','!');
 mark(s.x,s.y,'#e2f6c0','●');
}
