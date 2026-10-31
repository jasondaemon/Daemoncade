import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio,soundProfile} from './audio.js';

test('sound materials use distinct, bounded impact resonances',()=>{
 for(const type of ['car','log','tent','building']){
  const p=soundProfile(type);assert.ok(p.filter>=650&&p.filter<=2100);assert.ok(p.decay>0&&p.decay<.5);
  assert.ok(p.modes.every(f=>Number.isFinite(f)&&f>0&&f<500));
 }
 assert.notDeepEqual(soundProfile('car'),soundProfile('log'));
});
test('sound voices are bounded and every source is stopped/disconnected on suspension',()=>{
 const nodes=[],sources=[];let ended=0;
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>{const n={connect(){},disconnect(){this.disconnected=true;},gain:param(),frequency:param(),threshold:param(),ratio:param()};nodes.push(n);return n;};
 const source=()=>{const n=node();n.start=()=>{};n.stop=()=>{ended++;};sources.push(n);return n;};
 class Context{
  constructor(){this.state='suspended';this.sampleRate=100;this.currentTime=0;this.destination={};}
  createBuffer(){return {getChannelData:()=>new Float32Array(100)};}
  createGain(){return node();}createDynamicsCompressor(){return node();}createBufferSource(){return source();}createOscillator(){return source();}createBiquadFilter(){return node();}
  resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
 }
 const previous=globalThis.AudioContext;globalThis.AudioContext=Context;
 try{
  const audio=new GameAudio();audio.unlock();for(let i=0;i<20;i++)audio.play({type:'car',radius:1.3});
  assert.equal(audio.voices.size,8);assert.equal(sources.length,24);
  audio.suspend();assert.equal(audio.voices.size,0);assert.equal(audio.context.state,'suspended');
  assert.ok(sources.every(n=>n.disconnected));assert.equal(ended,48);
  const count=nodes.length;audio.play({type:'car',radius:1});assert.equal(nodes.length,count);
  audio.unlock();for(let i=0;i<20;i++)audio.play({type:'log',radius:.5},2,true);assert.equal(audio.voices.size,4);audio.suspend();
  audio.unlock();for(let i=0;i<20;i++)audio.cue('win');assert.equal(audio.voices.size,8);audio.suspend();assert.equal(audio.voices.size,0);assert.ok(sources.every(n=>n.disconnected));
  audio.unlock();for(let i=0;i<20;i++)audio.cue('streak',50,true);assert.equal(audio.voices.size,4);audio.suspend();assert.equal(audio.voices.size,0);
  audio.unlock();audio.cue('win');sources.at(-1).onended();assert.equal(audio.voices.size,0);assert.equal(audio.context.state,'suspended');
 }finally{if(previous===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=previous;}
});
