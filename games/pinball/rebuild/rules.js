export class Rules {
  constructor(emit=()=>{}){this.emit=emit;this.reset();}
  reset(){
    Object.assign(this,{score:0,ballNumber:1,locks:0,lockLit:false,targets:[false,false,false],multiplier:1,
      multiball:false,jackpots:0,orbits:0,ramps:0,bumperHits:0,banks:0,bonus:0,extraAwarded:false,
      ballsTotal:3,tilted:false,warnings:0,lastNudge:-10,missions:[false,false,false],wizard:false});
  }
  award(n){if(!this.tilted)this.score+=n;}
  event(type,data={}){this.emit({type,...data});}
  hit(e){
    if(this.tilted)return;
    if(e.type==='bumper'){this.award(100);this.bumperHits++;this.bonus+=20;}
    if(e.type==='sling')this.award(25);
    if(e.type==='target'){
      this.award(250);this.targets[e.id]=true;
      if(this.targets.every(Boolean)){
        this.banks++;this.targets.fill(false);this.lockLit=true;this.multiplier=Math.min(5,this.multiplier+1);
        this.award(2000);this.event('bank',{title:'GEAR UP',detail:`${this.multiplier}X BONUS / LOCK LIT`});
      }
    }
    if(e.type==='orbit'){this.orbits++;this.award(750);this.bonus+=100;this.event('orbit',{title:'NIGHT LAP',detail:`${this.orbits} / 3 LAPS`});}
    if(e.type==='ramp'){
      this.ramps++;this.award(1500);this.lockLit=true;this.bonus+=250;
      this.event('ramp',{title:'HIGHWAY RUN',detail:'GARAGE LOCK LIT'});
    }
    if(this.multiball&&(e.type==='ramp'||e.type==='orbit')){
      this.jackpots++;const big=this.jackpots%3===0,value=big?25000:5000;
      this.award(value);this.event('jackpot',{title:big?'SUPER JACKPOT':'JACKPOT',detail:`${value.toLocaleString()} POINTS`,priority:6});
    }
    const goals=[this.orbits>=3,this.banks>=2,this.bumperHits>=20];
    goals.forEach((done,i)=>{if(done&&!this.missions[i]){this.missions[i]=true;this.award(5000);this.event('mission',{title:['CITY CIRCUIT','TOP GEAR','REDLINE'][i],detail:'MISSION COMPLETE',priority:5});}});
    if(this.missions.every(Boolean)&&!this.wizard){this.wizard=true;this.award(15000);this.lockLit=true;this.event('wizard',{title:'MIDNIGHT PURSUIT',detail:'SHOOT GARAGE',priority:7});}
    if(this.score>=50000&&!this.extraAwarded){this.extraAwarded=true;this.ballsTotal++;this.event('extra',{title:'EXTRA BALL',detail:'KEEP THE NIGHT ALIVE',priority:7});}
  }
  lock(){
    if(!this.lockLit||this.tilted||this.multiball)return false;
    this.lockLit=false;this.locks++;this.award(1000);
    if(this.locks>=3||this.wizard){this.multiball=true;this.jackpots=0;this.event('multiball',{title:'MULTIBALL',detail:'SHOOT FOR JACKPOTS',priority:8});return 'multiball';}
    this.event('lock',{title:`BALL ${this.locks} LOCKED`,detail:`${3-this.locks} TO MULTIBALL`,priority:5});return 'locked';
  }
  endMultiball(){this.multiball=false;this.locks=0;this.event('mode-end',{title:'PURSUIT COMPLETE',detail:'BUILD YOUR NEXT LOCK'});}
  nudge(time){
    if(this.tilted)return false;
    this.warnings=time-this.lastNudge<3?this.warnings+1:1;this.lastNudge=time;
    if(this.warnings>=3){this.tilted=true;this.event('tilt',{title:'TILT',detail:'BONUS LOST',priority:20});return false;}
    this.event('warning',{title:this.warnings===2?'DANGER':'NUDGE',detail:this.warnings===2?'LET THE TABLE SETTLE':'',priority:10});return true;
  }
  endBall(){
    const amount=this.tilted?0:this.bonus*this.multiplier;this.score+=amount;this.bonus=0;
    this.event('bonus',{title:'END OF BALL',detail:`BONUS ${amount.toLocaleString()}`,priority:5});
    this.ballNumber++;this.multiplier=1;this.targets.fill(false);this.tilted=false;this.warnings=0;
    return this.ballNumber>this.ballsTotal;
  }
  objective(){
    if(this.tilted)return 'Tilt — flippers disabled for this ball';
    if(this.multiball)return 'Shoot the orbit or highway for jackpots';
    if(this.lockLit)return `Shoot the garage • lock ${this.locks+1} of 3`;
    return 'Complete GEAR targets or the highway to light a lock';
  }
}
