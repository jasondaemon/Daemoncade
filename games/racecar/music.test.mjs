import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound} from './sound.js';
globalThis.document={hidden:false};
globalThis.Audio=class {src='';paused=true;play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
test('circuit music follows coastal, desert, alpine and night environments',()=>{
 const s=new Sound();
 for(const [i,name] of ['harbor-loop','sunscar','harbor-loop','alpine-crown','midnight-crown'].entries()){s.raceMusic(i);assert.ok(s.music.src.endsWith(name+'.mp3'));assert.equal(s.music.loop,true);}
});
test('result music is a one-shot; lobby restores looping',()=>{
 const s=new Sound();s.track('win',false);assert.equal(s.music.loop,false);s.track('lobby');assert.equal(s.music.loop,true);
});
test('music respects mute and pause/resume',()=>{
 const s=new Sound(false);s.raceMusic(0);assert.equal(s.music.paused,true);s.enabled=true;s.resumeMusic();assert.equal(s.music.paused,false);s.pauseMusic();assert.equal(s.music.paused,true);
});
test('tire sound follows slip, reuses sources, fades on release and stops on pause/mute',()=>{
 const nodes=[];
 const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
 const node=()=>{const n={frequency:param(),gain:param(),Q:param(),connect(){return this;},start(){},stop(){this.stopped=true;},disconnect(){this.disconnected=true;}};nodes.push(n);return n;};
 const s=new Sound();s.context={sampleRate:64,currentTime:1,destination:{},createBuffer(){return {getChannelData(){return new Float32Array(64);}};},createBufferSource:node,createOscillator:node,createBiquadFilter:node,createGain:node};
 s.drift(35,0,true);assert.equal(nodes.length,0);
 s.drift(35,1,true);assert.ok(s.skid.gain.gain.value>0);const count=nodes.length,sources=[...s.skid.sources];
 s.drift(40,.7,true);assert.equal(nodes.length,count);
 s.drift(35,0,true);assert.equal(s.skid.gain.gain.value,0);
 s.drift(35,1,false);assert.equal(s.skid,null);assert.ok(sources.every(n=>n.stopped&&n.disconnected));
 s.drift(35,1,true);s.enabled=false;s.drift(35,1,true);assert.equal(s.skid,null);
});
