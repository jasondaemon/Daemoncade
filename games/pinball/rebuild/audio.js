export class AudioEngine{
 constructor(){this.enabled=true;this.context=null;this.last=new Map();this.voices=0;}
 async unlock(){
  if(!this.enabled)return;
  if(!this.context){
   const c=this.context=new(window.AudioContext||window.webkitAudioContext)();
   this.master=c.createGain();this.master.gain.value=.65;
   const limiter=c.createDynamicsCompressor();limiter.threshold.value=-15;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.12;
   this.master.connect(limiter);limiter.connect(c.destination);
   this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=this.noise.getChannelData(0);let low=0;
   for(let i=0;i<data.length;i++){low=.85*low+.15*(Math.random()*2-1);data[i]=low*2;}
   const roll=c.createBufferSource(),filter=c.createBiquadFilter();roll.buffer=this.noise;roll.loop=true;filter.type='bandpass';filter.frequency.value=430;filter.Q.value=.7;
   this.rolling=c.createGain();this.rolling.gain.value=0;roll.connect(filter);filter.connect(this.rolling);this.rolling.connect(this.master);roll.start();
  }
  if(this.context.state==='suspended')await this.context.resume();
 }
 suspend(){if(this.rolling)this.rolling.gain.value=0;this.context?.suspend().catch(()=>{});}
 update(balls,active){
  const c=this.context;if(!c||c.state!=='running')return;let speed=0;
  if(active&&this.enabled)for(const b of balls){const v=b.body.linvel();speed+=Math.hypot(v.x,v.z)*(b.ride?.35:1);}
  this.rolling.gain.setTargetAtTime(Math.min(.045,speed*.0015),c.currentTime,.08);
 }
 layer(freq,end,duration,volume,delay=0,noise=false){
  const c=this.context;if(this.voices>=48)return;this.voices++;
  const t=c.currentTime+delay,g=c.createGain(),source=noise?c.createBufferSource():c.createOscillator();let filter;
  if(noise){source.buffer=this.noise;filter=c.createBiquadFilter();filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=1.3;source.connect(filter);filter.connect(g);}
  else {source.type='sine';source.frequency.setValueAtTime(freq,t);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);source.connect(g);}
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+duration);g.connect(this.master);
  if(noise)source.start(t,Math.random());else source.start(t);source.stop(t+duration+.01);
  source.onended=()=>{source.disconnect();filter?.disconnect();g.disconnect();this.voices--;};
 }
 sound(type){
  const c=this.context;if(!this.enabled||!c||c.state!=='running')return;
  const now=c.currentTime,limit=type==='jackpot'?.6:.035;if(now-(this.last.get(type)??-10)<limit)return;this.last.set(type,now);
  const variation=.95+Math.random()*.1;
  const knock=(pitch=95,power=.2)=>{this.layer(pitch*variation,45,.11,power);this.layer(1800,1800,.035,power*.65,0,true);this.layer(340,180,.055,power*.3,.022);};
  const chime=(pitch,delay=0,power=.08)=>{this.layer(pitch,pitch*.998,.38,power,delay);this.layer(pitch*2.76,pitch*2.76,.16,power*.35,delay);this.layer(pitch*4.07,pitch*4.07,.07,power*.15,delay);};
  switch(type){
   case 'flipper':knock(115,.23);break;
   case 'release':knock(75,.09);break;
   case 'bumper':knock(165,.18);chime(610*variation,0,.055);break;
   case 'sling':knock(135,.17);this.layer(900,160,.09,.055);break;
   case 'target':knock(230,.09);chime(1050*variation,0,.065);break;
   case 'spinner':this.layer(2600,2600,.035,.09,0,true);chime(1400,0,.035);break;
   case 'rollover':chime(920,0,.045);break;
   case 'launch':knock(85,.23);for(let i=0;i<6;i++)this.layer(900+i*180,900,.04,.045,i*.028,true);break;
   case 'ramp':for(let i=0;i<7;i++)this.layer(1500-i*120,900,.045,.035,i*.045,true);chime(740,.08);chime(1110,.18);break;
   case 'lock':knock(70,.2);[440,554,660].forEach((f,i)=>chime(f,i*.075));break;
   case 'drain':knock(60,.25);[330,247,165].forEach((f,i)=>chime(f,i*.13,.06));break;
   case 'nudge':knock(55,.18);break;
   default:[523,659,784,1047].forEach((f,i)=>chime(f,i*.095,.085));this.layer(90,45,.3,.13);break;
  }
 }
}
