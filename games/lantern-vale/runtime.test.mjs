import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh,encode} from './campaign.mjs';
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
 let rasterDraws=0,keeperPosition=null,artFails=true;
 const keeperRects=Object.entries(manifest.frames).filter(([name])=>name.startsWith('keeper.')).map(([,f])=>f.rect.slice(0,2).join(','));
 const noop=()=>{},gradient={addColorStop:noop};canvas.getContext=()=>new Proxy({createRadialGradient:()=>gradient,drawImage(...args){rasterDraws++;if(keeperRects.includes(args.slice(1,3).join(',')))keeperPosition=args.slice(5,7);}},{get:(o,k)=>o[k]??noop});
 doc.getElementById=id=>{assert.ok(nodes[id],`Missing HTML id: ${id}`);return nodes[id];};doc.querySelector=()=>new Element();doc.querySelectorAll=()=>pad;
 let frame;Object.assign(globalThis,{Image:class{naturalWidth=1024;naturalHeight=1232;async decode(){if(artFails)throw Error('decode failed');}},document:doc,window:win,HTMLButtonElement:Element,devicePixelRatio:2,ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn();}},requestAnimationFrame:fn=>{frame=fn;},localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
 await import('./game.mjs');await new Promise(resolve=>setImmediate(resolve));let now=performance.now();const tick=()=>{now+=40;frame(now);};tick();assert.match(nodes['save-status'].textContent,/map mode/);assert.equal(nodes['retry-art'].hidden,false);
 artFails=false;nodes['retry-art'].onclick();await new Promise(resolve=>setImmediate(resolve));tick();assert.equal(nodes['retry-art'].hidden,true);assert.ok(rasterDraws>160,'live browser adapter draws the loaded raster atlas');assert.doesNotMatch(nodes['save-status'].textContent,/artwork/);
 nodes.continue.onclick();assert.match(nodes['title-status'].textContent,/Storage unavailable/);
 globalThis.localStorage={getItem:()=>'{invalid',setItem(){throw Error('blocked');}};nodes.continue.onclick();assert.match(nodes['title-status'].textContent,/No valid checkpoint/);
 nodes.begin.onclick();tick();assert.match(nodes.message.textContent,/Mira:/);assert.equal(nodes.map.textContent.split('\n').length,3,'map displays three overworld rows');assert.ok(nodes['journal-text'].textContent.includes('\n\n'),'journal separates quest entries into paragraphs');assert.ok(!nodes['journal-text'].textContent.includes('\\n'),'journal does not display escaped newline text');assert.equal(nodes['title-screen'].hidden,true);assert.equal(canvas.width,1440);
 nodes.interact.onclick();tick();assert.match(nodes['save-status'].textContent,/not saved/);
 nodes.pause.onclick();tick();assert.match(nodes.overlay.textContent,/Paused/);nodes.pause.onclick();tick();assert.equal(nodes.overlay.hidden,true);
 nodes.journal.onclick();tick();assert.equal(nodes['journal-panel'].hidden,false);assert.match(nodes['journal-text'].textContent,/Sen:/);nodes['journal-close'].onclick();tick();assert.match(nodes.overlay.textContent,/Paused/);nodes.pause.onclick();tick();
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
 for(const k of ['Image','document','window','HTMLButtonElement','devicePixelRatio','ResizeObserver','requestAnimationFrame','localStorage'])delete globalThis[k];
});
