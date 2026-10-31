export const SOUNDSCAPES={
 ascension:{filter:280,level:.035,notes:[261.63,392,523.25],interval:18,duration:.85},
 metro:{filter:380,level:.035,notes:[146.83,196],interval:15,duration:.65},
 basecamp:{filter:1400,level:.045,notes:[2900,3600,2500],interval:12,duration:.13},
 deep:{filter:220,level:.075,notes:[420,730,1050],interval:11,duration:.21},
 alien:{filter:650,level:.035,notes:[174.61,261.63,349.23],interval:16,duration:1.1},
 orbit:{filter:120,level:.045,notes:[659.25,987.77],interval:19,duration:.55}
};

// One cached mono bed, one looping source and at most one short three-note
// detail. No timers, assets, queued catch-up events or per-frame node creation.
export class Soundscape{
 constructor(owner){this.owner=owner;this.bed=null;this.detail=null;this.world=null;this.next=Infinity;}
 buffer(){
  if(this.noise)return this.noise;
  const c=this.owner.context,b=this.noise=c.createBuffer(1,c.sampleRate*8,c.sampleRate),data=b.getChannelData(0);let seed=7331,filtered=0;
  for(let i=0;i<data.length;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;filtered+=.06*((seed/4294967296*2-1)-filtered);
   const t=i/c.sampleRate,edge=Math.min(1,t/.025,(8-t)/.025);
   data[i]=filtered*2*(.85+.15*Math.sin(t*Math.PI/4))*Math.max(0,edge);
  }
  return b;
 }
 update(world,time,enabled,low=false){
  const c=this.owner.context;
  if(!enabled||globalThis.document?.hidden||!c||c.state!=='running'){this.stop();return;}
  const p=SOUNDSCAPES[world]||SOUNDSCAPES.metro;
  if(this.world!==world||!this.bed){
   this.stop();this.world=world;this.next=time+5;
   const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.buffer();source.loop=true;filter.type='lowpass';filter.frequency.value=p.filter;
   gain.gain.setValueAtTime(0,c.currentTime);gain.gain.linearRampToValueAtTime(p.level,c.currentTime+.5);
   source.connect(filter);filter.connect(gain);gain.connect(this.owner.master);source.start();
   this.bed={source,filter,gain};
  }
  if(time>=this.next&&!this.detail){this.next=time+p.interval+(Math.sin(time*.77)+1)*2;this.playDetail(world,p,low);}
 }
 playDetail(world,p,low){
  const c=this.owner.context,now=c.currentTime,nodes=[],sources=[];
  for(const [i,f]of p.notes.slice(0,low?1:3).entries()){
   const start=now+i*(world==='basecamp'?.21:.16),end=start+p.duration,osc=c.createOscillator(),gain=c.createGain();osc.type='sine';
   osc.frequency.setValueAtTime(f,start);osc.frequency.exponentialRampToValueAtTime(f*(world==='deep'?1.8:world==='basecamp'?.7:.985),end);
   gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(world==='basecamp'?.025:.018,start+Math.min(.02,p.duration/4));gain.gain.exponentialRampToValueAtTime(.0001,end);
   osc.connect(gain);gain.connect(this.owner.master);sources.push(osc);nodes.push(osc,gain);
  }
  const detail={sources,nodes};this.detail=detail;
  sources.at(-1).onended=()=>this.clearDetail(detail);
  for(const [i,source]of sources.entries()){const start=now+i*(world==='basecamp'?.21:.16);source.start(start);source.stop(start+p.duration);}
 }
 clearDetail(detail=this.detail){
  if(!detail||this.detail!==detail)return;this.detail=null;
  for(const source of detail.sources)try{source.stop();}catch{}
  for(const node of detail.nodes)node.disconnect();
 }
 stop(){
  this.clearDetail();const b=this.bed;this.bed=null;this.world=null;this.next=Infinity;
  if(b){try{b.source.stop();}catch{}b.source.disconnect();b.filter.disconnect();b.gain.disconnect();}
 }
}
