const clamp=x=>Math.max(-1,Math.min(1,x));
export class TouchDrive {
 constructor(){this.reset();}
 reset(){this.enabled=false;this.primary=null;this.secondary=null;this.boostUntil=0;}
 down(id,x,y,time){
  this.enabled=true;
  if(!this.primary)this.primary={id,x,y,start:x,steer:0};
  else if(!this.secondary&&id!==this.primary.id)this.secondary={id,x,y,time,moved:false};
 }
 move(id,x,y,width){
  if(this.primary?.id===id)this.primary.steer=clamp((x-this.primary.start)/Math.min(150,width*.3));
  if(this.secondary?.id===id&&Math.hypot(x-this.secondary.x,y-this.secondary.y)>16)this.secondary.moved=true;
 }
 up(id,time,cancel=false){
  if(this.primary?.id===id){this.primary=null;this.secondary=null;this.boostUntil=0;}
  else if(this.secondary?.id===id){
   if(!cancel&&!this.secondary.moved&&time-this.secondary.time<220&&this.primary)this.boostUntil=time+1000;
   this.secondary=null;
  }
 }
 read(time){return {enabled:this.enabled,steer:this.primary?.steer||0,throttle:!!this.primary,brake:this.enabled&&!this.primary,
  drift:!!(this.primary&&this.secondary&&time-this.secondary.time>=220),boost:!!this.primary&&time<this.boostUntil};}
}
