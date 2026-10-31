// Render pacing never skips simulation ticks or adjusts the gameplay clock.
export class RenderPacer{
 constructor(rate=60){this.setRate(rate);}
 setRate(rate){this.rate=rate===30?30:60;this.period=1000/this.rate;this.reset();}
 reset(){this.last=null;this.next=null;}
 take(now,force=false){
  if(!Number.isFinite(now))return null;
  if(this.last===null||now<this.last){this.last=now;this.next=now+this.period;return 1/this.rate;}
  if(!force&&now+.1<this.next)return null;
  const dt=Math.max(0,Math.min(.1,(now-this.last)/1000));this.last=now;
  if(now>=this.next-.1)this.next+=(Math.floor(Math.max(0,now-this.next)/this.period)+1)*this.period;
  return dt;
 }
}
