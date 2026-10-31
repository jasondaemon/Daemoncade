import {Soundscape} from './soundscape.js?v=infinity44';
// Short physical effects, plus an independently controlled bounded soundscape.
export function soundProfile(type){
 if(['person','deer','fox'].includes(type))return {filter:1200,modes:[217],decay:.12};
 if(['satellite','probe','shuttle'].includes(type))return {filter:2400,modes:[233,701],decay:.3};
 if(type==='planet')return {filter:480,modes:[65,131],decay:.5};
 if(['shard','crystal','resonator','pod'].includes(type))return {filter:2700,modes:[523,1319],decay:.3};
 if(['fish','ray','turtle','jellyfish','shark','dolphin','whale'].includes(type))return {filter:1400,modes:[320,620],decay:.18};
 if(['fence','gate','car','van','rv','bin','lamp','hydrant','landmark','cart','salvage','treasure'].includes(type))return {filter:2100,modes:[173,467],decay:.34};
 if(['bench','log','picnic','cabin','tree','pine','crate','wreck'].includes(type))return {filter:920,modes:[121,283],decay:.23};
 if(['tent','cooler','cone','seafan','kelp'].includes(type))return {filter:1200,modes:[217],decay:.12};
 return {filter:650,modes:[83,197],decay:.42};
}
export class GameAudio{
 constructor(){this.voices=new Set();this.context=null;this.ambience=new Soundscape(this);}
 unlock(){
  if(globalThis.document?.hidden)return;
  const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return;
  if(!this.context){
   const c=this.context=new Context();this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);
   const samples=this.noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
   this.master=c.createGain();this.master.gain.value=.55;
   this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-16;this.limiter.ratio.value=8;
   this.master.connect(this.limiter);this.limiter.connect(c.destination);
  }
  this.context.resume().catch(()=>{});
 }
 play(object,strike=0,low=false){
  const c=this.context;if(!c||c.state!=='running'||globalThis.document?.hidden||this.voices.size>=(low?4:8))return;
  const p=soundProfile(object.type),now=c.currentTime,duration=strike?Math.min(.28,p.decay):Math.min(.65,p.decay+object.radius*.035);
  const nodes=[],sources=[],gain=c.createGain();nodes.push(gain);
  gain.gain.setValueAtTime(strike?Math.min(.16,strike*.022):Math.min(.3,.09+object.radius*.025),now);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);gain.connect(this.master);
  const source=c.createBufferSource(),filter=c.createBiquadFilter();source.buffer=this.noise;filter.type='lowpass';
  filter.frequency.setValueAtTime(p.filter*(strike?1.4:1),now);filter.frequency.exponentialRampToValueAtTime(75,now+duration);
  source.connect(filter);filter.connect(gain);nodes.push(source,filter);sources.push(source);
  for(const f of p.modes.slice(0,low?1:2)){
   const oscillator=c.createOscillator(),level=c.createGain();oscillator.type='sine';
   oscillator.frequency.setValueAtTime(f/(1+object.radius*.13),now);oscillator.frequency.exponentialRampToValueAtTime(f/(1+object.radius*.13)*(strike?.88:.58),now+duration);
   level.gain.value=.12;oscillator.connect(level);level.connect(gain);nodes.push(oscillator,level);sources.push(oscillator);
  }
  const voice={cleanup:()=>{if(!this.voices.delete(voice))return;for(const node of nodes)node.disconnect();},stop:()=>{for(const s of sources)try{s.stop();}catch{}voice.cleanup();}};
  this.voices.add(voice);source.onended=voice.cleanup;
  for(const s of sources){s.start(now);s.stop(now+duration);}
 }
 cue(type,chain=10,low=false){
  const c=this.context;if(!c||c.state!=='running'||globalThis.document?.hidden)return;
  // Replace one oldest voice rather than lose a rare milestone under a shoal.
  // Never grow the shared pool or queue playback for later.
  if(this.voices.size>=(low?4:8))this.voices.values().next().value.stop();
  const now=c.currentTime,notes=type==='win'?[392,493.88,587.33]:chain>=50?[659.25,783.99]:chain>=25?[523.25,659.25]:[392,493.88],sources=[],nodes=[];
  for(const [i,f]of notes.entries())for(const harmonic of low?[1]:[1,2.005]){
   const start=now+i*.075,end=start+(type==='win'?.65:.32),osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(f*harmonic,start);
   gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(harmonic===1?.10:.025,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,end);
   osc.connect(gain);gain.connect(this.master);sources.push(osc);nodes.push(osc,gain);osc.start(start);osc.stop(end);
  }
  const voice={cleanup:()=>{if(!this.voices.delete(voice))return;for(const node of nodes)node.disconnect();},stop:()=>{for(const s of sources)try{s.stop();}catch{}voice.cleanup();}};
  this.voices.add(voice);sources.at(-1).onended=()=>{
   const active=this.voices.has(voice);voice.cleanup();
   // A completed reward should not leave an idle mobile audio session running.
   // Explicitly stopped/replaced voices cannot suspend a newly started run.
   if(type==='win'&&active&&!this.voices.size)c.suspend().catch(()=>{});
  };
 }
 stopVoices(){for(const v of [...this.voices])v.stop();}
 suspend(){this.ambience.stop();this.stopVoices();this.context?.suspend().catch(()=>{});}
}
