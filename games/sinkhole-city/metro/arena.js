import {DistrictRun} from './simulation.js?v=camp-life32';

export const DIFFICULTIES={
 easy:{label:'Easy',description:'Rivals take their time and focus on nearby objects.',interval:1.1,pause:.3},
 normal:{label:'Normal',description:'Rivals plan routes toward bigger objects as they grow.',interval:.45,pause:0},
 hard:{label:'Hard',description:'Rivals prioritize growth and reassess routes frequently.',interval:.18,pause:0}
};
export class ArenaRun extends DistrictRun{
 constructor({difficulty='normal'}={}){
  super({traffic:false});this.arena=true;this.rulesVersion=1;this.difficulty=Object.hasOwn(DIFFICULTIES,difficulty)?difficulty:'normal';this.duration=120;
  this.rivals=[[-26,-32,'Moss',0x7ab8ef],[26,-32,'Ember',0xff9a73],[26,32,'Plum',0xc3a0ff]].map(([x,z,name,color],i)=>({id:`ai-${i}`,name,color,player:{x,z,vx:0,vz:0,radius:1.2,area:1.44},score:0,eaten:0,combo:0,comboTime:0,counts:{clutter:0,vehicles:0,landmark:0},decision:i*.13,target:null,stuck:0,lastDistance:Infinity}));
 }
 steer(actor,dt){
  const p=actor.player,settings=DIFFICULTIES[this.difficulty];actor.decision-=dt;
  if(actor.target&&(actor.target.phase==='consumed'||actor.target.owner&&actor.target.owner!==actor.id))actor.target=null;
  if(actor.decision<=0||!actor.target){
   actor.decision=settings.interval;let best=null,value=-Infinity;
   for(const o of this.objects){
    if(o.phase==='consumed'||o.owner&&o.owner!==actor.id||o.radius>p.radius*.82)continue;
    const distance=Math.hypot(o.x-p.x,o.z-p.z),benefit=this.difficulty==='easy'?1:this.difficulty==='hard'?Math.sqrt(o.mass)*3:Math.pow(o.mass,.25)*2;
    const utility=benefit/(distance+2);
    if(utility>value){value=utility;best=o;}
   }
   if(best!==actor.target){actor.stuck=0;actor.lastDistance=Infinity;}
   actor.target=best;
  }
  const target=actor.target;if(!target)return {x:0,y:0};
  const x=target.x-p.x,y=target.z-p.z,d=Math.hypot(x,y);
  // Easy pauses between decisions; the underlying motion model stays identical.
  if(settings.pause&&actor.decision>settings.interval-settings.pause)return {x:0,y:0};
  actor.stuck=d<.2?actor.stuck+dt:0;actor.lastDistance=d;
  // A bridged prop gets a short repositioning attempt rather than permanent camping.
  if(actor.stuck>2.2){const angle=actor.stuck*2+Number(actor.id.at(-1));if(actor.stuck>3.2){actor.stuck=0;actor.target=null;}return {x:Math.cos(angle),y:Math.sin(angle)};}
  return {x:d<.12?0:x/Math.max(d,.01),y:d<.12?0:y/Math.max(d,.01)};
 }
 standings(){
  const rows=[this,...this.rivals].map(a=>({id:a.id,name:a.name,score:a.score,eaten:a.eaten,radius:a.player.radius})).sort((a,b)=>b.score-a.score||b.eaten-a.eaten||a.id.localeCompare(b.id));
  return rows.map(row=>({...row,rank:1+rows.filter(r=>r.score>row.score).length}));
 }
 step(dt,input){
  if(this.done)return;this.time+=dt;
  const actors=[this,...this.rivals];this.move(this,dt,input);for(const rival of this.rivals)this.move(rival,dt,this.steer(rival,dt));
  // Rotate first contact priority; shared props can only be claimed/scored once.
  const first=Math.floor(this.time*60)%actors.length;
  for(let i=0;i<actors.length;i++)this.collect(actors[(first+i)%actors.length],dt);
  if(this.time>=this.duration||this.objects.every(o=>o.phase==='consumed')){
   this.done=true;this.won=this.score>0&&this.rivals.every(r=>this.score>r.score);
  }
 }
}
