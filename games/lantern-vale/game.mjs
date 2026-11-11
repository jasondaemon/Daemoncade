import {controlLabel} from './expansion/mechanics.mjs';
import {quests,characters,discoveries,rewards} from './content.mjs?v=0.3.0-alpha.6';
import {loadAtlas} from './assets/gameplay/atlas.mjs?v=0.3.0-alpha.6';
import {drawWorld,drawFallback,bossTell} from './renderer.mjs?v=0.3.0-alpha.6';
import {fresh,step,secondary,toggle,pause,attack,potion,interact,names,objective,encode,decode,entrances,camps,rooms,roomInfo,installExpansion,continueAdventure,campaignMap,tile,solid} from './campaign.mjs?v=0.3.0-alpha.6';
import * as world from './expansion/world.mjs';
import * as depths from './expansion/dungeons.mjs?v=0.3.0-alpha.6';
import * as story from './expansion/story.mjs';
import {adventure,dungeonArtIds} from './expansion/adventure.mjs?v=0.3.0-alpha.6';
installExpansion(adventure);
const human=id=>String(id).replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
const $=id=>document.getElementById(id),c=$('world'),g=c.getContext('2d'),stage=document.querySelector('.stage'),keys=new Set(),blocked=new Set(),pointers=new Map(),saveKey='daemoncade.lantern-vale.waystone.v1';
let s=fresh(),started=false,storageMessage='',atlas=null,artMessage='Loading valley artwork…',animationMs=0,moving=false;
let loading=false,tab='quests',regionFilter=null;
async function artwork(){if(loading)return;loading=true;$('retry-art').hidden=true;artMessage='Loading valley artwork…';let timer;try{atlas=await Promise.race([loadAtlas(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Artwork timeout')),8000);})]);artMessage='';}catch{artMessage='Artwork unavailable. Playing in map mode. Retry artwork to restore sprites.';$('retry-art').hidden=false;}finally{clearTimeout(timer);loading=false;draw();}}
$('retry-art').onclick=artwork;artwork();
function clear(){for(const k of keys)blocked.add(k);keys.clear();pointers.clear();moving=false;}
function action(fn){if(started&&!$('journal-panel').hidden)return;if(started)fn();}
function save(){try{localStorage.setItem(saveKey,encode(s));storageMessage='Saved on this device.';}catch{storageMessage='Storage unavailable. You can keep playing; this checkpoint was not saved.';}}
function start(load=false){if(load){try{const saved=decode(localStorage.getItem(saveKey));if(!saved){$('title-status').textContent='No valid checkpoint found. Start a new journey.';return;}s=saved;}catch{$('title-status').textContent='Storage unavailable. Start a new journey to play without saving.';return;}}else s=fresh();storageMessage=load?'Checkpoint loaded.':'New journey: save at a waystone to replace your checkpoint.';started=true;$('journal-panel').hidden=true;$('title-screen').hidden=true;clear();c.focus();}
function menu(){$('journal-panel').hidden=true;started=false;clear();$('title-screen').hidden=false;}
$('venture').onclick=()=>{if(continueAdventure(s,world.continuation.room,world.continuation.at)){clear();c.focus();}};
$('begin').onclick=()=>start();$('continue').onclick=()=>start(true);$('restart').onclick=menu;
function use(){if(interact(s)==='save')save();}
function journal(){if(!started)return;clear();if($('journal-panel').hidden){if(s.status==='playing')pause(s);$('journal-panel').hidden=false;$('journal-close').focus();}else{$('journal-panel').hidden=true;c.focus();}}
$('light').onclick=()=>action(()=>toggle(s));$('attack').onclick=()=>action(()=>attack(s));$('potion').onclick=()=>action(()=>potion(s));$('interact').onclick=()=>action(use);$('secondary').onclick=()=>action(()=>secondary(s));$('journal').onclick=journal;$('journal-close').onclick=journal;
$('pause').onclick=()=>action(()=>{pause(s);clear();});
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},moves={w:dirs.up,arrowup:dirs.up,s:dirs.down,arrowdown:dirs.down,a:dirs.left,arrowleft:dirs.left,d:dirs.right,arrowright:dirs.right};
window.addEventListener('keydown',e=>{if(!started)return;const k=e.key.toLowerCase();if(!moves[k]&&![' ','j','l','p','r','e','q','x','k','escape'].includes(k))return;if(e.target instanceof HTMLButtonElement&&k===' ')return;e.preventDefault();if(blocked.has(k)||e.repeat)return;if(k==='k'||k==='escape'){journal();return;}if(!$('journal-panel').hidden)return;if(moves[k]&&s.status==='playing')keys.add(k);if(k==='l')toggle(s);if(k===' '||k==='j')attack(s);if(k==='p'){pause(s);clear();}if(k==='q')potion(s);if(k==='x')secondary(s);if(k==='e'&&interact(s)==='save')save();if(k==='r')menu();});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);blocked.delete(k);if(!keys.size&&!pointers.size)moving=false;});
for(const b of document.querySelectorAll('[data-dir]')){b.addEventListener('pointerdown',e=>{if(!started||s.status!=='playing'||!$('journal-panel').hidden)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,dirs[b.dataset.dir]);});for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,e=>{pointers.delete(e.pointerId);if(!keys.size&&!pointers.size)moving=false;});}
function suspend(){clear();if(s.status==='playing')pause(s);}window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
function resize(){
 const b=stage.getBoundingClientRect();if(b.width<=0||b.height<=0)return;
 const z=Math.min(b.width/640,b.height/400),d=Math.min(devicePixelRatio||1,3);
 c.style.width=`${640*z}px`;c.style.height=`${400*z}px`;
 const width=Math.max(1,Math.round(640*z*d)),height=Math.max(1,Math.round(400*z*d));
 // Assigning either backing dimension clears Canvas, even if it is unchanged.
 // Paint in this callback so a resize never depends on the next animation frame.
 if(c.width!==width||c.height!==height){c.width=width;c.height=height;draw();}
}
// Expanded room metadata is rendered directly; the legacy renderer owns IDs 0–29.
function drawExpanded(){
 const r=roomInfo(s.room),art=atlas?.manifest,artId=dungeonArtIds[r.dungeon],terrain=r.kind==='overworld'?art?.contentBindings.lands[r.land]:art?.contentBindings.dungeons[artId]||artId,set=art?.regionSets[terrain];
 const sprite=(name,x,y,scale=1)=>atlas?.draw(g,name,x*40,y*40,animationMs,scale);
 const label=(text,x,y)=>{g.font='11px system-ui';g.textAlign='center';g.fillStyle='#10151ee8';g.fillRect(x*40-65,y*40-32,130,17);g.fillStyle='#ffe3aa';g.fillText(text,x*40,y*40-20);};
 for(let y=0;y<10;y++)for(let x=0;x<16;x++){const t=tile(s.room,x,y);if(set){atlas.draw(g,set.floor[(x+y*7)%set.floor.length],x*40,y*40,animationMs);if(t==='#')atlas.draw(g,set.wall[(x+y)%set.wall.length],x*40,y*40,animationMs);if(t==='~'){atlas.draw(g,set.water,x*40,y*40,animationMs);const mask=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]].reduce((m,[dx,dy,b])=>m|(tile(s.room,x+dx,y+dy)!=='~'?b:0),0);atlas.draw(g,set.shore[mask],x*40,y*40,animationMs);}if(t==='^')sprite('effect.danger-ring',x+.5,y+.5);}else{g.fillStyle=t==='#'?'#575568':t==='~'?'#173650':'#243b38';g.fillRect(x*40,y*40,39,39);}if(t==='D'&&solid(s,x+.5,y+.5))sprite('prop.gate.0',x+.5,y+.5);}
 const mark=(name,at,text)=>{if(atlas)sprite(name,...at);else{g.fillStyle='#f4d080';g.fillRect(at[0]*40-9,at[1]*40-9,18,18);}label(text,...at);};
 if(r.checkpoint)mark('prop.waystone',r.checkpointAt||[3.5,5.5],'Waystone · E');
 for(const l of r.links||[])mark('prop.stairs.0',l.at,(l.label||roomInfo(l.to)?.name.split(' · ')[0]||'Passage')+' · E');
 for(const p of r.scenery||[])sprite(art?.scenerySets[p.kind]||set?.landmark||'prop.mossward.foliage',p.x,p.y);
 for(const h of r.hazards||[])mark('effect.danger-ring',h.at,h.equipment?human(h.equipment)+' protects':'Hazard · keep clear');
 for(const p of r.characters||[])mark(art?.contentBindings.characters[p.name]||'npc.ida.idle',p.at,(p.name||'Keeper')+' · E');
 for(const p of r.puzzles||[]){const v=s.expandedPuzzles[p.id],done=s.events.includes(p.id);mark(done?'prop.plate-lit.0':'prop.plate.0',p.source,done?'Circuit restored':p.mechanic?'Source · E for instructions':p.shade?'Lower light here':'Raise light here');for(const [i,c] of p.controls.entries())mark(v?.marks?.[i]?'prop.plate-lit.0':p.mechanic==='roots'?'prop.relic-root':p.mechanic==='frost'||p.mechanic==='reflection'?'prop.moon-mirror.0':'prop.relic-prism',c.at,p.mechanic?controlLabel(p,v,i):`${v?.controls?.[i]||0}/${c.target} · E`);}
 for(const reward of r.rewards||[])if(!s.events.includes(reward.id))mark('prop.chest.0',reward.at,'Keeper gift · E');
 for(const shop of r.shops||[])mark('prop.chest.0',shop.at,`${human(shop.item)} · ${shop.price} coins · E`);
 if(r.ending)mark('prop.beacon',r.ending.at,'Far Lantern · E');
 for(const e of s.enemies[s.room])if(e.hp>0){if(e.boss)bossTell(g,(name,x,y,scale)=>sprite(name,x/40,y/40,scale),s,e);else if(e.phase==='tell'){sprite('effect.danger-ring',e.x,e.y);}const kind=e.boss?art?.bossSets[artId]:e.kind==='brambleling'?'briarling':e.kind;sprite(`enemy.${kind}.${e.phase==='recover'?'hurt':e.phase==='tell'?'windup':e.phase==='strike'?'attack':'walk'}`,e.x,e.y);if(!atlas){g.fillStyle='#e58b83';g.fillRect(e.x*40-10,e.y*40-10,20,20);}if(e.boss)label(e.phase==='recover'?'Exposed · strike':e.name||'Warden',e.x,e.y);}
 for(const p of s.projectiles)sprite(p.disc?'prop.secondary-boomerang.0':'effect.projectile',p.x,p.y);
 if(s.light)sprite('effect.lantern-glow',s.x,s.y,3);
 const direction=Math.abs(s.facing[0])>=Math.abs(s.facing[1])?(s.facing[0]<0?'left':'right'):(s.facing[1]<0?'up':'down');sprite(`keeper.${direction}.${s.swing?'strike':moving?'walk':'idle'}`,s.x,s.y);
 if(!atlas){g.fillStyle='#e2f6c0';g.fillRect(s.x*40-10,s.y*40-10,20,20);}
}
function navigationText(){
 const here=roomInfo(s.room),all=campaignMap(s),group=regionFilter|| (here.kind==='overworld'?'land:'+here.land:'dungeon:'+here.dungeon);
 const visible=all.filter(r=>group.startsWith('land:')?r.kind==='overworld'&&r.land===group.slice(5):r.kind!=='overworld'&&String(r.dungeon)===group.slice(8));
 const title=group.startsWith('land:')?human(group.slice(5)):visible[0]?.name.split(' · ')[0];
 $('region-name').textContent=title||'Current region';
 const lines=[title,...(here.puzzles||[]).map(p=>p.hint),'◆ You · ✦ Waystone · ▣ Stair · ? Unvisited','Routes show known places; explore to reveal their names.'];
 if(here.mechanic&&group==='dungeon:'+here.dungeon)lines.push(here.mechanic);
 const cells=visible.filter(r=>roomInfo(r.id).map);
 if(cells.length){const rows=new Map();for(const r of cells){const p=roomInfo(r.id).map;const row=rows.get(p.y)||[];row.push({x:p.x,mark:r.id===s.room?'◆':r.visited?r.checkpoint?'✦':'·':'?'});rows.set(p.y,row);}lines.push([...rows.entries()].sort((a,b)=>a[0]-b[0]).map(([,row])=>row.sort((a,b)=>a.x-b.x).map(c=>c.mark).join('  ')).join('\n'));}
 for(const r of visible){const meta=roomInfo(r.id),known=r.visited||r.id===s.room;
  lines.push(`${r.id===s.room?'◆':r.checkpoint?'✦':meta.links?.length?'▣':'◇'} ${known?r.name:'? Unexplored'}${known?' — '+[...Object.entries(r.exits).map(([dir,to])=>dir+': '+(s.visited.includes(to)?roomInfo(to).name:'?')), ...r.links.map(l=>(l.open?'Passage: ':'Sealed passage: ')+(s.visited.includes(l.to)?roomInfo(l.to).name:'?'))].join(' · '):''}`);
 }
 lines.push('Nearby: '+[...(here.links||[]).map(l=>`${l.label||roomInfo(l.to)?.name||'Passage'} — interact at the marked stair`),...(here.shops||[]).map(x=>`${human(x.item)} shop · ${x.price} coins`)].join(' · '));
 return lines.join('\n\n');
}
function renderJournal(){
 const here=roomInfo(s.room);$('journal-location').textContent=`${here.name} · ${s.visited.length}/${rooms.length} places explored`;
 for(const id of ['quests','navigation','inventory'])$('tab-'+id).setAttribute('aria-pressed',String(tab===id));
 $('region-controls').hidden=tab!=='navigation';
 if(tab==='navigation'){$('journal-text').textContent=navigationText();return;}
 if(tab==='inventory'){$('journal-text').textContent=[`Blade ${s.sword} · Hearts ${s.hp}/${s.maxHp} · Relics ${s.relics.length}/3 · Seals ${story.seals.filter(id=>s.seals.includes(id)).length}/6`, `Lantern: ${s.light?'raised':'lowered'}. Reveals bridges and caches; light and shade both power keeper circuits.`, `Tonic ${s.potions}/${s.tonicCapacity} · Q restores five hearts. Waystones heal freely; shops sell supplies for coins.`, `Sun-disc: ${s.events.includes('reed-disc')||s.equipment.includes('sun-disc')?'X throws a returning stun weapon.':'Seek Sen and illuminate the three singing reeds.'}`, ...s.equipment.map(id=>'✓ '+human(id)+(rooms.some(r=>(r.gates||[]).some(g=>g.equipment===id))?' · Opens marked keeper roads and caches.':'')),...rewards.filter(r=>s.events.includes(r.id)).map(r=>'✓ '+(r.description||human(r.id))), 'Earned equipment works automatically at matching hazards and keeper roads. Maps reveal the dungeon route; no equipment is consumed.'].join('\n\n');return;}
 const optional=quests.map(q=>{const giver=characters.find(c=>c.id===q.giver),done=q.steps.filter(st=>s.events.includes(st.id||st.discovery)).length;return `${s.events.includes(q.id)?'✓':'◇'} ${giver?.name||'Keeper'}: ${q.steps.map(st=>{const d=discoveries.find(d=>d.id===st.discovery);return st.room!==undefined?`${human(st.action)} at ${roomInfo(st.room)?.name||st.room}`:d?`Read ${roomInfo(27+discoveries.indexOf(d))?.name}`:human(st.discovery);}).join('; ')} · ${done}/${q.steps.length}`;});
 const regional=adventure.quests.map(q=>`${s.quests.includes(q.id)?'✓':'◇'} ${q.text}`);
 $('journal-text').textContent=[objective(s),...(here.puzzles||[]).map(p=>p.hint),'Mira’s request: restore Rootvault, Drowned Archive and Prism Crypt, then raise the lantern at the northern beacon. Each heart strengthens your blade.', 'Beyond the beacon: choose Follow the distant lights after restoring dawn. Mira waits on the Far Road; explore six lands, recover their seals and bring them to the Far Lantern.',...optional,...(s.beaconRestored?regional:[]),'Close this journal, then press P or Resume to continue.'].join('\n\n');
}
for(const id of ['quests','navigation','inventory'])$('tab-'+id).onclick=()=>{tab=id;regionFilter=null;renderJournal();};
const groups=[...new Set(rooms.map(r=>r.kind==='overworld'?'land:'+r.land:'dungeon:'+r.dungeon))];
for(const [id,delta] of [['region-prev',-1],['region-next',1]])$(id).onclick=()=>{const r=roomInfo(s.room),current=regionFilter||(r.kind==='overworld'?'land:'+r.land:'dungeon:'+r.dungeon);regionFilter=groups[(groups.indexOf(current)+delta+groups.length)%groups.length];$('region-name').textContent=regionFilter.startsWith('land:')?human(regionFilter.slice(5)):rooms.find(r=>r.kind!=='overworld'&&String(r.dungeon)===regionFilter.slice(8))?.name.split(' · ')[0];renderJournal();};
function draw(){g.setTransform(c.width/640,0,0,c.height/400,0,0);g.imageSmoothingEnabled=false;
 g.clearRect(0,0,640,400);
 if(s.room>=30)drawExpanded();else if(atlas)drawWorld(g,atlas,s,animationMs,moving);else drawFallback(g,s);
 $('secondary').disabled=!s.events.includes('reed-disc')&&!s.equipment.includes('sun-disc');$('secondary').textContent=(s.events.includes('reed-disc')||s.equipment.includes('sun-disc'))?'Sun-disc · X':'Sun-disc · seek Sen';
 renderJournal();
 $('venture').hidden=!(s.status==='won'&&s.beaconRestored&&!s.expandedEnding);
 $('room').textContent=names[s.room];$('stats').textContent=`Hearts ${s.hp}/${s.maxHp} · Blade ${s.sword} · Relics ${s.relics.length}/3 · ${s.coins} coins${s.beaconRestored?' · Seals '+story.seals.filter(id=>s.seals.includes(id)).length+'/6':''}`;$('objective').textContent=objective(s);const speaker=characters.find(person=>person.encounters.some(e=>e.room===s.room&&(e.text===s.message||e.after===s.message)));$('message').textContent=(speaker?speaker.name+': ':'')+s.message;$('save-status').textContent=[storageMessage,artMessage].filter(Boolean).join(' ');$('potion').textContent=`Tonic ${s.potions} · Q`;$('light').textContent=`Lantern ${s.light?'ON':'OFF'} · L`;$('light').setAttribute('aria-pressed',String(s.light));$('pause').textContent=s.status==='paused'?'Resume · P':'Pause · P';$('overlay').hidden=s.status==='playing';$('overlay').textContent=s.status==='paused'?'Paused · P to resume':`${s.message} Use Journey to continue or restart.`;
 const map=[];for(let row=0;row<3;row++){map.push(Array.from({length:5},(_,col)=>{const id=row*5+col;return s.room===id?'◆':entrances.includes(id)?'▣':camps.includes(id)?'✦':s.visited.includes(id)?'·':'?';}).join('  '));}$('map').textContent=map.join('\n');
}
let last=null,accumulator=0;function frame(now){const elapsed=last===null?0:Math.min(.12,Math.max(0,(now-last)/1000));last=now;if(started&&s.status==='playing'){accumulator+=elapsed;while(accumulator>=1/60){let x=0,y=0;for(const k of keys){const v=moves[k];if(v){x+=v[0];y+=v[1];}}for(const v of pointers.values()){x+=v[0];y+=v[1];}const previousX=s.x,previousY=s.y;step(s,{x,y},1/60);moving=s.x!==previousX||s.y!==previousY;animationMs+=1000/60;accumulator-=1/60;}}else accumulator=0;draw();requestAnimationFrame(frame);}resize();new ResizeObserver(resize).observe(stage);requestAnimationFrame(frame);
