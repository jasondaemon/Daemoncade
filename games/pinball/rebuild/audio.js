export class AudioEngine{
 constructor(){this.enabled=true;this.context=null;this.last=new Map();}
 async unlock(){if(!this.enabled)return;this.context??=new(window.AudioContext||window.webkitAudioContext)();if(this.context.state==='suspended')await this.context.resume();}
 suspend(){this.context?.suspend().catch(()=>{});}
 sound(type){
  const c=this.context;if(!this.enabled||!c||c.state!=='running')return;
  const now=c.currentTime;if(now-(this.last.get(type)??-10)<.045)return;this.last.set(type,now);
  const notes={flipper:[105,50,.06,.12],bumper:[520,190,.15,.075],sling:[140,65,.09,.1],target:[840,510,.09,.04],launch:[100,700,.2,.05],lock:[440,880,.25,.07],jackpot:[880,1320,.4,.06],drain:[190,70,.35,.07],nudge:[65,40,.09,.1]};
  const [start,end,duration,volume]=notes[type]||[350,500,.13,.06];
  const o=c.createOscillator(),g=c.createGain();o.type=['flipper','sling','nudge'].includes(type)?'triangle':'sine';o.frequency.setValueAtTime(start,now);o.frequency.exponentialRampToValueAtTime(end,now+duration);g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};
 }
}
