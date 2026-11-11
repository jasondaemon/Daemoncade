import {characters,quests,puzzles,optionalLinks} from './content.mjs?v=0.3.0-alpha.6';
import {tile,solid,camps,entrances,dungeon,roomInfo} from './campaign.mjs?v=0.3.0-alpha.6';

// Rendering consumes the campaign state without changing collision or progression.
const feedback=new WeakMap();
export function drawWorld(g,atlas,s,time,moving=false){
 const previous=feedback.get(s)||{hp:s.hp,hits:new Map(),enemies:new Map(),clock:time};
 if(s.status==='playing')previous.clock=time;
 time=previous.clock;
 if(s.hp<previous.hp)previous.flash=time+240;
 previous.hp=s.hp;feedback.set(s,previous);
 const d=dungeon(s.room),land=s.room<15?Math.min(2,Math.floor(s.room%5/2)):d;
 const meta=roomInfo(s.room);
 const terrain=terrainFor(meta,atlas.manifest);
 const set=terrainSet(terrain,atlas.manifest);
 const draw=(name,x,y,scale=1,clock=time)=>atlas.draw(g,name,x,y,clock,scale);
 for(let y=0;y<10;y++)for(let x=0;x<16;x++){
  const t=tile(s.room,x,y),px=x*40,py=y*40;
  const road=(y===5||x===8),bank=tile(s.room,x,y-1)==='#'||tile(s.room,x-1,y)==='#';
  draw(set.floor[road?0:bank?1:2],px,py);
  if(t==='#')draw(set.wall[(x+y)%set.wall.length],px,py);
  if(t==='~'){draw(set.water,px,py);if(!solid(s,x+.5,y+.5))draw('prop.bridge.0',px+20,py+20);}
  if(t==='^')draw('effect.ember',px+20,py+20);
  if(t==='=' )draw('prop.bridge.0',px+20,py+20);
  if(t==='.'&&set.shore){let mask=0;for(const [dx,dy,bit] of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(tile(s.room,x+dx,y+dy)==='~')mask|=bit;if(mask)draw(set.shore[mask],px,py);}
  if(t==='D'&&solid(s,x+.5,y+.5))draw('prop.gate.0',px+20,py+20);
 }
 compose(g,draw,s,meta,set);
 // Authored interaction silhouettes stay at the coordinates used by the rules.
 for(const person of characters)for(const encounter of person.encounters){
  if(encounter.room!==s.room||(encounter.when&&encounter.when.relics!==s.relics.length))continue;
  draw('effect.shadow',encounter.at[0]*40,encounter.at[1]*40+14);
  draw(npcFrame(person.name,atlas.manifest),encounter.at[0]*40,encounter.at[1]*40);
  label(person.name+' · E',encounter.at[0]*40,encounter.at[1]*40-29);
 }
 for(const link of optionalLinks)if(link.from===s.room){draw('prop.stairs.0',link.at[0]*40,link.at[1]*40);label('Keeper chamber · E',link.at[0]*40,link.at[1]*40-26);}
 for(const q of quests)for(const st of q.steps)if(st.room===s.room){
  draw(q.id==='quest-orchard'?'prop.mossward.foliage':'prop.amber-fen.foliage',st.at[0]*40,st.at[1]*40);
  if(s.light){draw(s.events.includes(st.id)?'effect.spark':'effect.light-burst',st.at[0]*40,st.at[1]*40);label(s.events.includes(st.id)?'Awakened':'L · lend light',st.at[0]*40,st.at[1]*40-28);}
 }
 if(s.room>=27&&s.room<=29){
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
 if(s.room>=30)expanded(g,draw,s,meta,atlas.manifest,label);
 if(camps.includes(s.room))draw('prop.waystone',140,220);
 if(entrances.includes(s.room))draw('prop.stairs.0',500,100);
 if(s.room<27&&d>=0&&(s.room-15)%4===0)draw('prop.stairs-up.0',60,220);
 if(s.room===4)draw('prop.beacon',500,220);
 if(s.room<15&&!camps.includes(s.room)&&(s.opened.includes(s.room)||s.light))draw(s.opened.includes(s.room)?'prop.chest-open.0':'prop.chest.0',180,100);
 if(s.room<27&&d>=0&&(s.room-15)%4===1)draw(s.switches.includes(d)?'prop.plate-lit.0':'prop.plate.0',500,220);
 if(s.room<27&&d>=0&&(s.room-15)%4===3&&!s.relics.includes(d))draw(['prop.relic-root','prop.relic-tide','prop.relic-prism'][d],500,220);
 for(const e of s.enemies[s.room]||[])if(e.hp>0){
  const kind=e.boss?bossArt[d]:e.kind==='brambleling'?'briarling':e.kind||['briarling','fen-moth','glass-sentinel'][land];
  if(e.boss&&s.room>=30)bossTell(g,draw,s,e);
  const active=(!e.boss||s.light)&&Math.hypot(s.x-e.x,s.y-e.y)<(s.light?9:2.4);
  const old=previous.enemies.get(e);if(old!==undefined&&e.hp<old)previous.hits.set(e,time+220);previous.enemies.set(e,e.hp);
  const phase=e.stun>0||previous.hits.get(e)>time?'hurt':e.phase==='tell'?'windup':e.phase==='strike'||e.phase==='dive'?'attack':active?'walk':'idle';
  if(s.room<30&&(e.phase==='tell'||e.phase==='strike')&&(!e.boss||s.light)){
   const strike=e.phase==='strike';g.fillStyle=strike?'#ff6e5899':'#ffcd6a77';
   if(e.boss&&d===1&&e.target)for(const offset of [-1.5,0,1.5])draw('effect.danger-ring',(e.target[0]+offset)*40,e.target[1]*40,strike?1.4:1);
   else if(e.aim){g.save();g.translate(e.x*40,e.y*40);let angle=Math.atan2(e.aim[1],e.aim[0]);if(e.boss&&d===2&&strike)angle+=(1-e.timer/.8)*Math.PI/2;g.rotate(angle);g.fillRect(0,-(d===0?18:4),e.boss?240:160,d===0?36:8);g.restore();}
   draw('effect.danger-ring',e.x*40,e.y*40);
  }
  if(e.boss&&e.phase==='recover')label('Exposed',e.x*40,e.y*40-48);
  draw('effect.shadow',e.x*40,e.y*40+14);
  draw(`enemy.${kind}.${phase}`,e.x*40,e.y*40);
  g.fillStyle='#e59c72';g.fillRect(e.x*40-12,e.y*40-(e.boss?40:22),24*Math.min(1,e.hp/(meta.encounters?.find(a=>a.boss===e.boss&&a.kind===e.kind)?.hp||(e.boss?8:s.room>=15?3:2))),3);
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
 if(!s.light&&d>=0){const shade=g.createRadialGradient(x,y,25,x,y,260);shade.addColorStop(0,'#080a1000');shade.addColorStop(1,'#080a1099');g.fillStyle=shade;g.fillRect(0,0,640,400);}
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
 if(s.room>=27&&s.room<=29){mark(1.5,5.5,'#f4d080','E');for(const o of puzzles[s.room-27].objects)mark(...o.at,'#f4d080',o.action==='illuminate'?'L':'E');mark(12.5,2.5,'#f4d080','E');}
 const r=roomInfo(s.room);
 if(s.room>=30){
  if(r.checkpoint)mark(...(r.checkpointAt||[3.5,5.5]),'#f4d080','W');
  for(const l of r.links||[])mark(...l.at,'#f4d080','E');
  for(const c of r.characters||[])mark(...c.at,'#a9c2e0','E');
  for(const t of r.rewards||[])if(t.at)mark(...t.at,'#f4d080',s.events.includes(t.id)?'✓':'E');
  for(const shop of r.shops||[])mark(...shop.at,'#f4d080','E');
  for(const h of r.hazards||[])mark(...h.at,'#e58b83','!');
  for(const gate of r.gates||[])if(solid(s,...gate.at))mark(...gate.at,'#e58b83','×');
  for(const p of r.puzzles||[]){mark(...p.source,'#f4d080',p.shade?'Shade':'L');for(const c of p.controls)mark(...c.at,'#f4d080','E');}
  if(r.ending)mark(...r.ending.at,'#f4d080','B');
 }
 for(const p of s.projectiles||[])mark(p.x,p.y,'#f4d080','·');
 for(const e of s.enemies[s.room]||[])if(e.hp>0)mark(e.x,e.y,'#e58b83','!');
 mark(s.x,s.y,'#e2f6c0','●');
}

const bossArt=['root-warden','tide-warden','prism-warden','ember-colossus','storm-roc','frost-leviathan','bell-leviathan','moon-weaver','horizon-iris'];
const landArt={confluence:'mossward',riverreach:'amber-fen',cinderstep:'cinder-coast',windscar:'storm-peaks',frostmere:'sunken-garden',nightbloom:'moonwood',dawncoast:'starfall-desert'};
const depthArt=['rootvault','drowned-archive','prism-crypt','ember-forge','tempest-spire','verdant-cistern','solar-tomb','lunar-observatory','eclipse-citadel'];
function terrainFor(r,m){
 const requested=r.art?.terrain;
 if(m.terrainSets[requested])return requested;
 if(r.dungeon>=0)return depthArt[r.dungeon]||'rootvault';
 return landArt[r.land]||['mossward','amber-fen','glass-highlands'][Math.min(2,Math.floor(r.id%5/2))];
}
function terrainSet(name,m){
 const base=m.terrainSets[name]||{floor:[0,1,2].map(i=>`terrain.${name}.floor.${i}`),wall:[0,1].map(i=>`terrain.${name}.wall.${i}`),water:`terrain.${name}.water`};
 return {...base,shore:base.shore||Array.from({length:16},(_,i)=>`terrain.${name}.shore.${i}`),details:base.details||[0,1,2].map(i=>`prop.${name}.detail.${i}`),landmark:base.landmark||`landmark.${name}`};
}
function npcFrame(name,m){const id=`npc.${(name||'').toLowerCase()}`;return m.animations[id]||m.frames[id]?id:'prop.sign.0';}
// Scenery occupies the collision silhouette or the authored northern backdrop.
// No foreground canopy is painted over the walkable lane or an interaction.
function compose(g,draw,s,r,set){
 for(let y=0;y<10;y++)for(let x=0;x<16;x++)if(tile(s.room,x,y)==='#'){
  g.fillStyle='#090e192f';g.fillRect(x*40,y*40+34,40,6);
  if(x>0&&x<15&&y>0&&y<9&&set.details)draw(set.details[(x+2*y+r.id)%set.details.length],x*40+20,y*40+20);
 }
 for(const o of r.scenery||[]){
  const landmark=o===r.scenery[0];
  if(landmark&&set.landmark)draw(set.landmark,o.x*40,o.y*40,.8);
  else draw('prop.sign.0',o.x*40,o.y*40);
 }
 if(!r.scenery?.length&&set.landmark){
  // Legacy landmarks use the closed northern bank; doorways at x=8 stay clear.
  draw(set.landmark,(r.id%2?3:12)*40,52,.65);
 }
 if(['settlement','healer','market','workshop','checkpoint'].includes(r.role)){
  const interior=r.role==='healer'?'woven':r.role==='market'?'marble':'oak';
  for(const x of [1,2,13,14])draw(`interior.${interior}.floor.${x%3}`,x*40,40);
  const items={settlement:['prop.door.0','prop.hearth.0'],healer:['prop.bed.0','prop.bookshelf.0'],market:['prop.market-stall.0','prop.barrel.0'],workshop:['prop.counter.0','prop.barrel.0'],checkpoint:['prop.hearth.0','prop.sign.0']}[r.role];
  items.forEach((name,i)=>draw(name,(i?13.5:2.5)*40,64));
 }
}
function expanded(g,draw,s,r,m,label){
 const at=(name,p)=>draw(name,p[0]*40,p[1]*40);
 const has=id=>id==='beacon-restored'?s.beaconRestored:id.startsWith('campaign-relic-')?s.relics.includes(Number(id.slice(15))):[s.events,s.equipment,s.quests,s.seals].some(a=>a?.includes(id));
 const eligible=o=>(o.requires||[]).every(has);
 if(r.checkpoint)at('prop.waystone',r.checkpointAt||[3.5,5.5]);
 for(const l of r.links||[]){at(l.to<r.id?'prop.stairs-up.0':'prop.stairs.0',l.at);label(`${l.label||'Passage'} · E`,l.at[0]*40,l.at[1]*40-28);if(!eligible(l))at('effect.danger-ring',l.at);}
 for(const c of r.characters||[])if(eligible(c)){at('effect.shadow',[c.at[0],c.at[1]+.35]);at(npcFrame(c.name,m),c.at);label(`${c.name||'Inscription'} · E`,c.at[0]*40,c.at[1]*40-29);}
 for(const shop of r.shops||[]){at('npc.merchant',shop.at);label(`${shop.price} coins · E`,shop.at[0]*40,shop.at[1]*40-29);}
 for(const t of r.rewards||[])if(t.at){const done=s.events.includes(t.id);at(done?'prop.chest-open.0':'prop.chest.0',t.at);if(!done){const item=t.equipment&&`prop.${t.equipment}.0`;if(item&&m.frames[item])draw(item,t.at[0]*40,t.at[1]*40-18,.65);label(t.clear&&(s.enemies[s.room]||[]).some(e=>e.hp>0)?'Defeat guardians':'Gift · E',t.at[0]*40,t.at[1]*40-36);}}
 for(const h of r.hazards||[]){at('effect.danger-ring',h.at);label(h.equipment&&s.equipment.includes(h.equipment)?'Protected':'Danger',h.at[0]*40,h.at[1]*40-24);}
 for(const gate of r.gates||[])if(solid(s,...gate.at))at('prop.gate.0',gate.at);else at('prop.plate-lit.0',gate.at);
 for(const p of r.puzzles||[]){
  const v=s.expandedPuzzles[p.id]||{},done=s.events.includes(p.id),values=v.controls||[];
  at(done?'prop.plate-lit.0':'prop.plate.0',p.source);label(done?'Circuit restored':p.shade?'Lower lantern':'Raise lantern',p.source[0]*40,p.source[1]*40-28);
  for(const [i,c] of p.controls.entries()){
   const aligned=values[i]===c.target;
   at(aligned?'prop.plate-lit.0':'prop.relic-prism',c.at);label(`${values[i]||0} / ${c.target} · E`,c.at[0]*40,c.at[1]*40-28);
   // Segmented beams follow the exact control-to-source span, below all actors.
   if(done||aligned&&s.light!==Boolean(p.shade)){
    const dx=p.source[0]-c.at[0],dy=p.source[1]-c.at[1],n=Math.ceil(Math.hypot(dx,dy)*4);
    g.fillStyle=done?'#a1edc958':'#ffe9a868';for(let j=0;j<n;j++)g.fillRect((c.at[0]+dx*j/n)*40-2,(c.at[1]+dy*j/n)*40-2,4,4);
   }
  }
  if(v.charge>0){g.fillStyle='#ffe2a4';g.fillRect(p.source[0]*40-20,p.source[1]*40+20,40*Math.min(1,v.charge/(p.seconds||1)),4);}
 }
 if(r.ending)at('prop.beacon',r.ending.at);
}
export function bossWarningGeometry(e){
 const strike=e.phase==='strike',progress=strike?Math.max(0,Math.min(1,1-e.timer/(e.strike||.6))):0;
 const target=e.target||[e.x,e.y],angle=Math.atan2(e.aim?.[1]||0,e.aim?.[0]??1);
 if(e.kind==='cross')return [{x:target[0]*40-24,y:0,w:48,h:400},{x:0,y:target[1]*40-24,w:640,h:48}];
 const ray=(a,length,width)=>({x:e.x*40,y:e.y*40,angle:a,w:length,h:width});
 if(e.kind==='ring'){
  // During the tell show the complete expanding annulus travel area. During
  // strike show precisely the current damaging band (+/- .65 world units).
  const radius=progress*240,outer=strike?radius+26:266,inner=strike?Math.max(0,radius-26):0,rects=[];
  for(let y=-outer;y<outer;y+=4){
   const nearest=Math.max(0,Math.abs(y+2)-2),far=Math.abs(y+2)+2;
   const edge=Math.sqrt(Math.max(0,outer*outer-nearest*nearest));
   const hole=Math.sqrt(Math.max(0,inner*inner-far*far));
   if(hole){rects.push({x:e.x*40-edge,y:e.y*40+y,w:edge-hole,h:4},{x:e.x*40+hole,y:e.y*40+y,w:edge-hole,h:4});}
   else rects.push({x:e.x*40-edge,y:e.y*40+y,w:edge*2,h:4});
  }
  return rects;
 }
 if(e.kind==='sweep')return Array.from({length:strike?17:145},(_,i)=>ray(angle+(strike?progress*Math.PI:0)-.2+i*(strike?.4/16:(Math.PI+.4)/144),280,8));
 if(e.kind==='volley')return [-.3,0,.3].map(o=>ray(angle+o,416,40));
 if(e.kind==='charge')return [{...ray(angle,(strike?e.timer:(e.strike||.6))*160+80,80),x:e.x*40-Math.cos(angle)*40,y:e.y*40-Math.sin(angle)*40}];
 if(e.kind==='hunt'){const a=Math.atan2(target[1]-e.y,target[0]-e.x);return [{...ray(a,Math.hypot(target[0]-e.x,target[1]-e.y)*40+80,80),x:e.x*40-Math.cos(a)*40,y:e.y*40-Math.sin(a)*40},{x:target[0]*40-40,y:target[1]*40-40,w:80,h:80}];}
 return [];
}
export function bossTell(g,draw,s,e){
 if(!s.light||!['tell','strike'].includes(e.phase))return;
 g.fillStyle=e.phase==='strike'?'#ff6e5877':'#ffcd6a55';
 // Fill the union once: overlapping rays must not build an opaque veil.
 const path=typeof g.beginPath==='function'&&typeof g.rect==='function'&&typeof g.fill==='function';
 if(path)g.beginPath();
 const rect=(...args)=>path?g.rect(...args):g.fillRect(...args);
 for(const r of bossWarningGeometry(e)){
  if(r.angle!==undefined){g.save();g.translate(r.x,r.y);g.rotate(r.angle);rect(0,-r.h/2,r.w,r.h);g.restore();}
  else rect(r.x,r.y,r.w,r.h);
 }
 if(path)g.fill();
}
