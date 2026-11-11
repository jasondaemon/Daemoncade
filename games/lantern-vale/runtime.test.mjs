import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh,encode,rooms,roomInfo,canStand} from './campaign.mjs?v=0.3.0-alpha.6';
import manifest from './assets/gameplay/manifest.mjs';
class Element {
 constructor(){this.events={};this.style={};this.hidden=false;this.textContent='';this.dataset={};}
 addEventListener(k,f){(this.events[k]??=[]).push(f);}
 emit(k,e={}){for(const f of this.events[k]??[])f(e);}
 setAttribute(){} setPointerCapture(){} focus(){} getBoundingClientRect(){return {width:800,height:450};}
}
test('browser adapter: save failure, pause, title, resize and touch cancellation',async()=>{
 const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8'),ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]),nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
 assert.match(html,/<\/footer><p id="save-status" role="status">/,'checkpoint feedback stays outside the guide hidden on short screens');
 const pad=['up','down','left','right'].map(dir=>{const b=new Element();b.dataset.dir=dir;return b;});
 const win=new Element(),doc=new Element(),canvas=nodes.world;
 let rasterDraws=0,keeperPosition=null,artFails=true,keeperWorld=null;const warningRects=[],warningAngles=[];
 const keeperRects=Object.entries(manifest.frames).filter(([name])=>name.startsWith('keeper.')).map(([,f])=>f.rect.slice(0,2).join(','));
 const noop=()=>{},gradient={addColorStop:noop};canvas.getContext=()=>new Proxy({createRadialGradient:()=>gradient,fillRect(...a){if(['#ffcd6a55','#ff6e5877'].includes(this.fillStyle))warningRects.push(a);},rect(...a){if(['#ffcd6a55','#ff6e5877'].includes(this.fillStyle))warningRects.push(a);},rotate(a){warningAngles.push(a);},drawImage(...args){rasterDraws++;if(keeperRects.includes(args.slice(1,3).join(','))){keeperPosition=args.slice(5,7);const f=Object.values(manifest.frames).find(f=>f.rect[0]===args[1]&&f.rect[1]===args[2]);keeperWorld=[(args[5]+f.pivot[0])/40,(args[6]+f.pivot[1])/40];}}},{get:(o,k)=>o[k]??noop});
 doc.getElementById=id=>{assert.ok(nodes[id],`Missing HTML id: ${id}`);return nodes[id];};doc.querySelector=()=>new Element();doc.querySelectorAll=()=>pad;
 let frame;Object.assign(globalThis,{Image:class{naturalWidth=manifest.imageSize[0];naturalHeight=manifest.imageSize[1];async decode(){if(artFails)throw Error('decode failed');}},document:doc,window:win,HTMLButtonElement:Element,devicePixelRatio:2,ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn();}},requestAnimationFrame:fn=>{frame=fn;},localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
 await import('./game.mjs');await new Promise(resolve=>setImmediate(resolve));let now=performance.now();const tick=()=>{now+=40;frame(now);};tick();assert.match(nodes['save-status'].textContent,/map mode/);assert.equal(nodes['retry-art'].hidden,false);
 artFails=false;nodes['retry-art'].onclick();await new Promise(resolve=>setImmediate(resolve));tick();assert.equal(nodes['retry-art'].hidden,true);assert.ok(rasterDraws>160,'live browser adapter draws the loaded raster atlas');assert.doesNotMatch(nodes['save-status'].textContent,/artwork/);
 nodes.continue.onclick();assert.match(nodes['title-status'].textContent,/Storage unavailable/);
 globalThis.localStorage={getItem:()=>'{invalid',setItem(){throw Error('blocked');}};nodes.continue.onclick();assert.match(nodes['title-status'].textContent,/No valid checkpoint/);
 nodes.begin.onclick();tick();assert.match(nodes.message.textContent,/Mira:/);assert.equal(nodes.map.textContent.split('\n').length,3,'map displays three overworld rows');assert.ok(nodes['journal-text'].textContent.includes('\n\n'),'journal separates quest entries into paragraphs');assert.ok(!nodes['journal-text'].textContent.includes('\\n'),'journal does not display escaped newline text');assert.equal(nodes['title-screen'].hidden,true);assert.equal(canvas.width,1440);
 nodes.interact.onclick();tick();assert.match(nodes['save-status'].textContent,/not saved/);
 nodes.pause.onclick();tick();assert.match(nodes.overlay.textContent,/Paused/);nodes.pause.onclick();tick();assert.equal(nodes.overlay.hidden,true);
 nodes.journal.onclick();tick();assert.equal(nodes['journal-panel'].hidden,false);assert.match(nodes['journal-text'].textContent,/Sen:/);nodes['journal-close'].onclick();tick();assert.match(nodes.overlay.textContent,/Paused/);nodes.pause.onclick();tick();
 nodes.journal.onclick();nodes['tab-navigation'].onclick();tick();assert.match(nodes['journal-text'].textContent,/Mira’s Lantern Oak/);assert.match(nodes['journal-text'].textContent,/east:/,'navigation exposes actual directional exits');nodes['region-next'].onclick();tick();assert.ok(nodes['region-name'].textContent);nodes['tab-inventory'].onclick();tick();assert.match(nodes['journal-text'].textContent,/Tonic 2\/9/);assert.match(nodes['journal-text'].textContent,/Sen/);nodes['journal-close'].onclick();nodes.pause.onclick();tick();
 const key=(type,k,repeat=false)=>win.emit(type,{key:k,repeat,target:canvas,preventDefault:noop});
 const initial=keeperPosition.slice();key('keydown','d');pad[0].emit('pointerdown',{pointerId:7,preventDefault:noop});tick();const diagonal=keeperPosition.slice();assert.ok(diagonal[0]>initial[0]&&diagonal[1]<initial[1],'keyboard and touch move simultaneously');
 pad[0].emit('pointercancel',{pointerId:7});key('keyup','d');
 key('keydown','d');win.emit('blur');nodes.pause.onclick();tick();const resumed=keeperPosition.slice();key('keydown','d',true);tick();assert.deepEqual(keeperPosition,resumed,'held key cannot resume movement after focus loss');key('keyup','d');key('keydown','d');tick();assert.ok(keeperPosition[0]>resumed[0]);key('keyup','d');
 pad[0].emit('pointerdown',{pointerId:1,preventDefault:noop});pad[0].emit('pointercancel',{pointerId:1});pad[1].emit('lostpointercapture',{pointerId:2});
 win.emit('blur');tick();assert.match(nodes.overlay.textContent,/Paused/);nodes.pause.onclick();tick();assert.equal(nodes.overlay.hidden,true);
 win.emit('keydown',{key:'r',target:canvas,preventDefault:noop});assert.equal(nodes['title-screen'].hidden,false);
 const saved=fresh();saved.room=2;saved.coins=23;saved.events.push('reed-disc');saved.dialogue.push('mira-opening');
 let writes=0;globalThis.localStorage={getItem:()=>encode(saved),setItem(){writes++;}};nodes.continue.onclick();tick();assert.equal(nodes['title-screen'].hidden,true);assert.match(nodes.stats.textContent,/23 coins/);assert.equal(nodes.secondary.disabled,false);nodes.secondary.onclick();tick();assert.match(nodes.message.textContent,/Sun-disc:/);nodes.interact.onclick();tick();assert.match(nodes['save-status'].textContent,/Saved on this device/);
 key('keydown','d');for(let i=0;i<10;i++)tick();key('keyup','d');key('keydown','s');for(let i=0;i<5;i++)tick();key('keyup','s');nodes.interact.onclick();tick();assert.match(nodes.message.textContent,/Sen:/,'NPC dialogue names its speaker');
 nodes.restart.onclick();nodes.begin.onclick();tick();assert.equal(writes,1,'new journey leaves the saved checkpoint untouched');
 doc.hidden=true;doc.emit('visibilitychange');tick();assert.match(nodes.overlay.textContent,/Paused/);doc.hidden=false;doc.emit('visibilitychange');tick();assert.match(nodes.overlay.textContent,/Paused/);
 const expanded=fresh();Object.assign(expanded,{room:30,beaconRestored:true,visited:[0,30,48],equipment:['tide-boots','rootvault-map'],seals:['river-seal']});
 globalThis.localStorage={getItem:()=>encode(expanded),setItem(){writes++;}};nodes.restart.onclick();nodes.continue.onclick();tick();assert.match(nodes.room.textContent,/Far Road/);assert.match(nodes.stats.textContent,/Seals 1\/6/);
 nodes.journal.onclick();nodes['tab-inventory'].onclick();tick();assert.match(nodes['journal-text'].textContent,/Tide Boots/);nodes['tab-navigation'].onclick();tick();assert.match(nodes['journal-text'].textContent,/Far Road/);assert.match(nodes['journal-text'].textContent,/Unexplored/);nodes['tab-quests'].onclick();tick();assert.match(nodes['journal-text'].textContent,/Cinder Forge/);nodes['journal-close'].onclick();nodes.pause.onclick();nodes.interact.onclick();tick();assert.match(nodes['save-status'].textContent,/Saved on this device/);
 assert.equal(rooms.filter(r=>r.kind==='overworld').length,141);assert.equal(rooms.filter(r=>r.id>=300).length,108);for(const r of rooms)for(const link of r.links||[])assert.ok(roomInfo(link.to),'every interface passage resolves');
 // A completed original beacon remains an ending, with an explicit additive continuation.
 const beacon=fresh();Object.assign(beacon,{room:4,relics:[0,1,2],visited:[0,4]});globalThis.localStorage={getItem:()=>encode(beacon),setItem(){}};nodes.restart.onclick();nodes.continue.onclick();tick();
 nodes.journal.onclick();nodes['tab-navigation'].onclick();tick();assert.match(nodes['journal-text'].textContent,/Northern Beacon/);nodes['journal-close'].onclick();nodes.pause.onclick();tick();
 key('keydown','d');for(let i=0;i<65;i++)tick();key('keyup','d');key('keydown','l');key('keyup','l');key('keydown','e');key('keyup','e');tick();assert.equal(nodes.venture.hidden,false,'original beacon offers explicit continuation');nodes.venture.onclick();tick();assert.match(nodes.room.textContent,/Far Road/);assert.equal(nodes.venture.hidden,true);assert.match(nodes.message.textContent,/six distant/);
 for(let dungeon=0;dungeon<9;dungeon++){
  const checkpoint=rooms.find(r=>r.id>=300&&r.dungeon===dungeon&&r.checkpoint);assert.ok(checkpoint);const state=fresh();Object.assign(state,{room:checkpoint.id,visited:[0,checkpoint.id],beaconRestored:true});globalThis.localStorage={getItem:()=>encode(state),setItem(){}};nodes.restart.onclick();nodes.continue.onclick();tick();assert.equal(nodes.room.textContent,checkpoint.name);nodes.journal.onclick();nodes['tab-navigation'].onclick();tick();assert.match(nodes['journal-text'].textContent,/east:|west:|north:|south:/,'dungeon map contains traversable room connections');nodes['journal-close'].onclick();
 }
 // Exercise the actual drawExpanded adapter, rather than only the reusable renderer.
 for(let dungeon=0;dungeon<9;dungeon++){
  const arena=rooms.find(r=>r.id>=300&&r.dungeon===dungeon&&r.part==='boss'),boss=arena.encounters[0];
  const state=fresh(),refuge=arena.id-3;Object.assign(state,{room:refuge,visited:[0,refuge],maxHp:40,hp:40,events:[roomInfo(arena.id-1).gates[0].requires[0]]});
  globalThis.localStorage={getItem:()=>encode(state),setItem(){}};nodes.restart.onclick();nodes.continue.onclick();tick();
  // Reach each arena through real keyboard movement from its valid waystone.
  function go(at){
   const start=keeperWorld.map(Math.floor),goal=at.map(Math.floor),queue=[start],prev=new Map([[start.join(),null]]);
   for(let i=0;i<queue.length&&!prev.has(goal.join());i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const q=[queue[i][0]+dx,queue[i][1]+dy];if(q[0]<1||q[0]>14||q[1]<1||q[1]>8||prev.has(q.join())||!canStand(state,q[0]+.5,q[1]+.5))continue;
    prev.set(q.join(),queue[i]);queue.push(q);
   }
   assert.ok(prev.has(goal.join()));const path=[];for(let p=goal;p&&p.join()!==start.join();p=prev.get(p.join()))path.unshift(p.map(n=>n+.5));
   for(const p of [...path,at])for(const axis of [0,1]){
    for(let n=0;n<30&&Math.abs(keeperWorld[axis]-p[axis])>.09;n++){
     const k=axis===0?(keeperWorld[0]<p[0]?'d':'a'):(keeperWorld[1]<p[1]?'s':'w');key('keydown',k);tick();key('keyup',k);
    }
    assert.ok(Math.abs(keeperWorld[axis]-p[axis])<.1);
   }
  }
  for(const direction of ['east','east','south']){
   go(direction==='east'?[14.5,5.5]:[8.5,8.5]);const old=state.room,k=direction==='east'?'d':'s';key('keydown',k);
   for(let n=0;n<20&&nodes.room.textContent===roomInfo(old).name;n++)tick();key('keyup',k);state.room=roomInfo(old).exits[direction];assert.equal(nodes.room.textContent,roomInfo(state.room).name);
   go(direction==='east'?[1.5,5.5]:[8.5,1.5]);
  }
  key('keydown','l');key('keyup','l');warningRects.length=0;warningAngles.length=0;tick();
  assert.ok(warningRects.length,`${boss.kind}: actual expanded tell draws warnings`);
  const tellAngles=[...warningAngles];
  const shape=()=>{
   if(boss.kind==='cross'){assert.ok(warningRects.some(r=>r[2]===48&&r[3]===400));assert.ok(warningRects.some(r=>r[2]===640&&r[3]===48));}
   else if(boss.kind==='ring')assert.ok(warningRects.some(r=>r[3]===4),'annulus uses scanlines around boss');
   else if(boss.kind==='sweep')assert.ok(warningRects.some(r=>r[2]===280&&r[3]===8),'beam reaches seven tiles');
   else if(boss.kind==='volley'){assert.ok(warningRects.some(r=>r[2]===416&&r[3]===40));assert.ok(warningAngles.length>=3);}
   else assert.ok(warningRects.some(r=>r[3]===80),'moving boss corridor includes contact radius');
  };shape();
  for(let i=0;i<Math.ceil(boss.tell/.04)+2;i++)tick();
  warningRects.length=0;warningAngles.length=0;tick();shape();
  if(boss.kind==='sweep')assert.notDeepEqual(warningAngles,tellAngles,'strike beam advances through its previewed sweep');
 }
 const legacy=JSON.parse(encode(fresh()));legacy.version=1;delete legacy.expansion;delete legacy.progress;globalThis.localStorage={getItem:()=>JSON.stringify(legacy),setItem(){}};nodes.restart.onclick();nodes.continue.onclick();tick();assert.match(nodes.room.textContent,/Lantern Oak/,'version-1 checkpoint loads through the expanded adapter');assert.match(nodes['save-status'].textContent,/Checkpoint loaded/);
 for(const k of ['Image','document','window','HTMLButtonElement','devicePixelRatio','ResizeObserver','requestAnimationFrame','localStorage'])delete globalThis[k];
});
