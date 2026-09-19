const sequence=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
export class SecretCode {
 reset(){this.index=0;this.time=0;}
 constructor(){this.reset();}
 feed(key,time){if(time-this.time>5000)this.index=0;this.time=time;
  this.index=key===sequence[this.index]?this.index+1:key===sequence[0]?1:0;
  if(this.index===sequence.length){this.reset();return true;}return false;
 }
}
