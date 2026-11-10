import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
class Element {
 constructor(){this.events={};this.style={};this.hidden=false;this.textContent='';this.dataset={};}
 addEventListener(k,f){(this.events[k]??=[]).push(f);}
 emit(k,e={}){for(const f of this.events[k]??[])f(e);}
 setAttribute(){} setPointerCapture(){} focus(){} getBoundingClientRect(){return {width:800,height:450};}
}
test('browser adapter: save failure, pause, title, resize and touch cancellation',async()=>{
 const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8'),ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]),nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
 const pad=['up','down','left','right'].map(dir=>{const b=new Element();b.dataset.dir=dir;return b;});
 const win=new Element(),doc=new Element(),canvas=nodes.world;
 const noop=()=>{},gradient={addColorStop:noop};canvas.getContext=()=>new Proxy({createRadialGradient:()=>gradient},{get:(o,k)=>o[k]??noop});
 doc.getElementById=id=>{assert.ok(nodes[id],`Missing HTML id: ${id}`);return nodes[id];};doc.querySelector=()=>new Element();doc.querySelectorAll=()=>pad;
 let frame;Object.assign(globalThis,{document:doc,window:win,HTMLButtonElement:Element,devicePixelRatio:2,ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn();}},requestAnimationFrame:fn=>{frame=fn;},localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
 await import('./game.mjs');const tick=()=>frame(performance.now()+20);tick();
 nodes.continue.onclick();assert.match(nodes['title-status'].textContent,/Storage unavailable/);
 nodes.begin.onclick();tick();assert.equal(nodes['title-screen'].hidden,true);assert.equal(canvas.width,1440);
 nodes.interact.onclick();tick();assert.match(nodes['save-status'].textContent,/not saved/);
 nodes.pause.onclick();tick();assert.match(nodes.overlay.textContent,/Paused/);nodes.pause.onclick();tick();assert.equal(nodes.overlay.hidden,true);
 pad[0].emit('pointerdown',{pointerId:1,preventDefault:noop});pad[0].emit('pointercancel',{pointerId:1});pad[1].emit('lostpointercapture',{pointerId:2});
 win.emit('blur');tick();assert.match(nodes.overlay.textContent,/Paused/);nodes.pause.onclick();tick();assert.equal(nodes.overlay.hidden,true);
 win.emit('keydown',{key:'r',target:canvas,preventDefault:noop});assert.equal(nodes['title-screen'].hidden,false);
 for(const k of ['document','window','HTMLButtonElement','devicePixelRatio','ResizeObserver','requestAnimationFrame','localStorage'])delete globalThis[k];
});
