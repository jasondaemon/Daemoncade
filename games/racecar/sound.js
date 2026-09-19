export class Sound {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.context = null;
    this.music=new Audio();this.music.loop=true;this.music.volume=.12;this.music.preload='none';
  }
  track(name,loop=true) {
    const src=new URL(`../circuit-rush/assets/${name}.mp3`,import.meta.url).href;
    if(this.music.src!==src){this.music.src=src;this.music.loop=loop;}
    if(this.enabled&&!document.hidden)this.music.play().catch(()=>{});
  }
  raceMusic(circuit) {this.track(['harbor-loop','sunscar','harbor-loop','alpine-crown','midnight-crown'][circuit]||'harbor-loop');}
  pauseMusic(){this.music.pause();}
  resumeMusic(){if(this.enabled&&this.music.src&&!document.hidden)this.music.play().catch(()=>{});}
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      this.context.resume().catch(() => {});
    } catch {}
  }
  drive(speed, active) {
    if (!this.enabled || !active) {
      this.stop();
      return;
    }
    if (!this.context) return;
    if (!this.osc) {
      this.osc = this.context.createOscillator();
      this.gain = this.context.createGain();
      this.osc.type = "sawtooth";
      this.gain.gain.value = 0.012;
      this.osc.connect(this.gain).connect(this.context.destination);
      this.osc.start();
    }
    this.osc.frequency.setTargetAtTime(
      40 + speed * 1.6,
      this.context.currentTime,
      0.08,
    );
  }
  stopSkid() {
    if(this.skid){for(const node of this.skid.sources){node.stop();node.disconnect();}for(const node of this.skid.nodes)node.disconnect();this.skid=null;}
  }
  stop() {
    this.stopSkid();
    if (this.osc) {
      this.osc.stop();
      this.osc.disconnect();
      this.gain.disconnect();
      this.osc = null;
    }
  }
  drift(speed,amount,active) {
    if(!this.enabled||!active){this.stopSkid();return;}
    if(!this.context)return;
    const c=this.context,level=Math.max(0,Math.min(1,amount))*Math.min(1,Math.max(0,speed-5)/25);
    if(!this.skid&&level>.01) {
      const buffer=c.createBuffer(1,c.sampleRate,c.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      const noise=c.createBufferSource(),filter=c.createBiquadFilter(),tone=c.createOscillator(),gain=c.createGain(),toneGain=c.createGain();
      noise.buffer=buffer;noise.loop=true;filter.type='bandpass';filter.Q.value=1.8;
      tone.type='triangle';toneGain.gain.value=.13;gain.gain.value=0;
      noise.connect(filter).connect(gain);tone.connect(toneGain).connect(gain);gain.connect(c.destination);
      noise.start();tone.start();
      this.skid={sources:[noise,tone],nodes:[filter,toneGain,gain],filter,tone,gain};
    }
    if(this.skid){
      this.skid.gain.gain.setTargetAtTime(level*.065,c.currentTime,level>.01?.06:.12);
      this.skid.filter.frequency.setTargetAtTime(1100+speed*13,c.currentTime,.1);
      this.skid.tone.frequency.setTargetAtTime(680+speed*6+Math.sin(c.currentTime*19)*30,c.currentTime,.06);
    }
  }
  effect(type) {
    if (!this.enabled || !this.context) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type === "hit" ? "square" : "triangle";
    o.frequency.setValueAtTime(
      type === "hit" ? 100 : type === "go" ? 750 : 520,
      c.currentTime,
    );
    o.frequency.exponentialRampToValueAtTime(
      type === "hit" ? 35 : 1000,
      c.currentTime + 0.15,
    );
    g.gain.setValueAtTime(0.035, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    o.connect(g).connect(c.destination);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
    o.start();
    o.stop(c.currentTime + 0.21);
  }
}
