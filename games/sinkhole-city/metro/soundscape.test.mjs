import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Soundscape,SOUNDSCAPES} from './soundscape.js';

function fixture(){
 const nodes=[],buffers=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
 const node=()=>{const n={gain:param(),frequency:param(),connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(n);return n;};
 const context={state:'running',currentTime:0,sampleRate:100,createGain:node,createBufferSource:node,createBiquadFilter:node,createOscillator:node,createBuffer(channels,length){const data=new Float32Array(length),b={getChannelData:()=>data};buffers.push(b);return b;}};
 return {context,nodes,buffers,scape:new Soundscape({context,master:{}})};
}

test('five distinct soundscapes reuse one bounded bed and never allocate every frame',()=>{
 assert.equal(Object.keys(SOUNDSCAPES).length,6);assert.equal(new Set(Object.values(SOUNDSCAPES).map(p=>JSON.stringify(p))).size,6);
 const {scape,nodes,buffers}=fixture();scape.update('basecamp',0,true);assert.equal(nodes.length,3);assert.equal(buffers.length,1);const source=scape.bed.source;
 for(let i=0;i<240;i++)scape.update('basecamp',i/60,true);
 assert.equal(nodes.length,3);assert.equal(scape.bed.source,source);
 const data=buffers[0].getChannelData(0);assert.equal(data.length,800);assert.ok(data.every(v=>Number.isFinite(v)&&Math.abs(v)<1));assert.ok(Math.abs(data[0])<1e-9);
 for(const world of Object.keys(SOUNDSCAPES)){scape.update(world,0,true);assert.equal(buffers.length,1);}
 scape.stop();assert.ok(nodes.every(n=>n.disconnected));assert.ok(nodes.filter(n=>n.started).every(n=>n.stopped));
});

test('detail pool is bounded, late frames do not queue catch-up notes, and stale cleanup is harmless',()=>{
 const {scape,nodes}=fixture();scape.update('basecamp',0,true);scape.update('basecamp',6,true);const detail=scape.detail;assert.equal(detail.sources.length,3);const count=nodes.length;
 for(let i=0;i<100;i++)scape.update('basecamp',1000+i,true);
 assert.equal(scape.detail,detail);assert.equal(nodes.length,count);
 scape.stop();assert.ok(detail.nodes.every(n=>n.disconnected));
 scape.update('deep',0,true,true);scape.update('deep',6,true,true);const next=scape.detail;assert.equal(next.sources.length,1);
 detail.sources.at(-1).onended();assert.equal(scape.detail,next,'old-world callbacks cannot disconnect the new world');
 next.sources.at(-1).onended();assert.equal(scape.detail,null);
 scape.stop();assert.ok(nodes.every(n=>n.disconnected));
});

test('mute, hidden documents and suspended audio dispose beds/details without restarting',()=>{
 const {scape,context,nodes}=fixture(),previous=globalThis.document;
 try{
  scape.update('alien',0,true);scape.update('alien',6,true);scape.update('alien',7,false);assert.equal(scape.bed,null);assert.equal(scape.detail,null);
  const count=nodes.length;scape.update('alien',10,false);assert.equal(nodes.length,count);
  scape.update('orbit',0,true);globalThis.document={hidden:true};scape.update('orbit',1,true);assert.equal(scape.bed,null);
  globalThis.document={hidden:false};context.state='suspended';const stopped=nodes.length;scape.update('orbit',2,true);assert.equal(nodes.length,stopped);
  assert.ok(nodes.every(n=>n.disconnected));
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
