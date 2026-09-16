// Short synthesized cues; no downloads, autoplay, or long-running audio nodes.
export class Sound {
  constructor(enabled=true){this.enabled=enabled;this.context=null;this.lastShot=0;}
  unlock(){if(!this.enabled)return;try{this.context??=new(window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});}catch{}}
  note(freq,duration,gain=.05,type='sine',end=freq){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(c.destination);o.start();o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect()};
  }
  noise(duration=.14,gain=.07,cutoff=1100){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const c=this.context,t=c.currentTime,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
    const s=c.createBufferSource(),g=c.createGain(),filter=c.createBiquadFilter();s.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(filter).connect(g).connect(c.destination);s.start();s.onended=()=>{s.disconnect();filter.disconnect();g.disconnect()};
  }
  play(type,weapon){
    if(type==='fire'){const t=this.context?.currentTime||0;if(t-this.lastShot<.08)return;this.lastShot=t;this.noise(weapon==='rocket'?.18:.045,weapon==='rocket'?.08:.025,weapon==='flame'?700:2500);this.note(weapon==='rocket'?100:180,.05,.015,'triangle',50);}
    if(type==='explosion'){this.noise(.25,.12,650);this.note(90,.22,.08,'sine',28)}
    if(type==='hurt'){this.noise(.09,.09,2000);this.note(170,.13,.04,'sawtooth',50)}
    if(type==='reward'||type==='weapon'){this.note(540,.16,.05,'triangle',1080);this.note(810,.2,.03,'sine',1620)}
    if(type==='boost'){this.note(200,.55,.045,'sawtooth',1200)}
    if(type==='win'){this.note(523,.6,.045);this.note(659,.6,.035);this.note(784,.8,.04)}
    if(type==='lose')this.note(180,.55,.045,'triangle',45);
  }
}
