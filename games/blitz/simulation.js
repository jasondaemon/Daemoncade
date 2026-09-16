// Renderer-independent rules. Fixed-step simulation keeps combat identical at 30/60/120 Hz.
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const PLAYER_Z = 3;
export const MAX_FORCE = 60;
export const DIFFICULTIES = {
  easy:{speed:4.1,hp:.7,damage:1,recruits:1.2,gateCharge:10,warning:1.2,fireInterval:2.8,bossInterval:1.6,bulletSpeed:9,contact: .75},
  normal:{speed:4.8,hp:1,damage:2,recruits:1,gateCharge:14,warning:.9,fireInterval:2,bossInterval:1.25,bulletSpeed:11,contact:1},
  hard:{speed:5.6,hp:1.4,damage:4,recruits:.75,gateCharge:24,warning:.65,fireInterval:1.35,bossInterval:.9,bulletSpeed:15,contact:1.5},
};
export const WEAPONS = {
  rifle:{name:'ASSAULT',short:'AR',color:0xffdf86,rate:.32,damage:1.2,speed:45,range:42},
  machine:{name:'MINIGUN',short:'MG',color:0x7cf5ff,rate:.13,damage:.85,speed:53,range:46},
  flame:{name:'INCINERATOR',short:'FL',color:0xff903a,rate:.16,damage:2.4,speed:34,range:24,splash:2.1},
  rocket:{name:'ROCKETS',short:'RPG',color:0xc9fb85,rate:.65,damage:7.2,speed:34,range:48,splash:3.2},
};
const gate=(at,a,b)=>({at,kind:'gates',choices:[a,b]});
const add=n=>({type:'add',value:n});
const mul=n=>({type:'multiply',value:n});
const enemy=(at,x,count)=>({at,kind:'enemy',x,count});
const weapon=(at,x,weapon)=>({at,kind:'weapon',x,weapon,hp:20});
const supply=(at,x,reward)=>({at,kind:'supply',x,reward,hp:18});
const barrier=(at,x)=>({at,kind:'barrier',x});
export const MISSIONS = [
  {name:'HARBOR BREACH',district:'01 / THE DOCKS',brief:'Build your squad. Break the gun crates. Take the harbor.',color:0x60dec9,boss:'DOCK WARDEN',bossHp:520,events:[
    gate(28,add(8),mul(1.6)),weapon(49,-2.6,'machine'),supply(49,2.6,7),enemy(76,0,12),
    gate(101,mul(1.7),add(12)),barrier(124,-2.7),weapon(143,2.6,'rocket'),supply(143,-2.6,10),
    enemy(171,-1.8,18),gate(194,add(10),mul(1.5)),enemy(218,1.8,22),{at:250,kind:'boss'},
  ]},
  {name:'IRON CHANNEL',district:'02 / THE FOUNDRY',brief:'Burn through the close ranks. Watch the marked firing lanes.',color:0xffbd74,boss:'IRONCLAD',bossHp:680,events:[
    gate(27,add(10),mul(1.6)),weapon(47,2.6,'flame'),weapon(47,-2.6,'machine'),enemy(76,1.4,15),
    supply(97,-2.6,10),barrier(97,2.7),gate(119,add(-6),mul(1.8)),enemy(146,0,24),
    weapon(170,-2.6,'rocket'),supply(170,2.6,12),gate(195,mul(1.6),add(14)),enemy(221,-1.6,28),{at:258,kind:'boss'},
  ]},
  {name:'LAST TRANSMISSION',district:'03 / THE CITADEL',brief:'Choose your firepower. Outmaneuver the command tank.',color:0xc8b4ff,boss:'OVERSEER',bossHp:850,events:[
    gate(27,mul(1.7),add(10)),weapon(47,-2.6,'machine'),weapon(47,2.6,'rocket'),enemy(74,-1.5,18),
    gate(98,add(12),mul(1.5)),barrier(122,-2.7),supply(122,2.6,12),enemy(146,1.5,24),
    weapon(171,-2.6,'flame'),weapon(171,2.6,'rocket'),gate(195,mul(1.7),add(-8)),enemy(223,0,30),{at:262,kind:'boss'},
  ]},
];
// Compact centered rows; no troop extends beyond the road when steering at its limit.
export function formation(count,spacing=.52) {
  const cols=Math.min(7,Math.max(1,Math.ceil(Math.sqrt(count*1.35))));
  const rows=Math.ceil(count/cols);
  return Array.from({length:count},(_,i)=>{const row=Math.floor(i/cols),width=Math.min(cols,count-row*cols);return {x:(i%cols-(width-1)/2)*spacing,z:(row-(rows-1)/2)*.51}});
}
export function segmentHit(ax,az,bx,bz,x,z,rx,rz) {
  let enter=0,exit=1;
  for(const [a,b,c,r] of [[ax,bx,x,rx],[az,bz,z,rz]]) {
    const d=b-a;if(Math.abs(d)<1e-8){if(Math.abs(a-c)>r)return null;continue}
    let lo=(c-r-a)/d,hi=(c+r-a)/d;if(lo>hi)[lo,hi]=[hi,lo];enter=Math.max(enter,lo);exit=Math.min(exit,hi);if(enter>exit)return null;
  }
  return enter;
}
export class Run {
  constructor(mission=0,difficulty='normal') {
    this.mission=clamp(Math.floor(mission)||0,0,MISSIONS.length-1);this.definition=MISSIONS[this.mission];this.difficulty=DIFFICULTIES[difficulty]?difficulty:'normal';this.rules=DIFFICULTIES[this.difficulty];
    this.time=0;this.distance=0;this.x=0;this.targetX=0;this.force=12;this.peak=12;this.weapon='rifle';this.score=0;this.kills=0;this.losses=0;this.energy=0;this.boost=0;this.invulnerable=0;this.shotClock=.1;this.bossTime=0;this.status='playing';this.events=[];this.objects=[];this.bullets=[];this.nextEvent=0;this.id=0;this.bossEngaged=false;
  }
  emit(type,data={}){this.events.push({type,...data})}
  drain(){return this.events.splice(0)}
  boostNow(){if(this.status!=='playing'||this.energy<100||this.boost>0)return false;this.energy=0;this.boost=5;this.emit('boost');return true}
  setForce(n){this.force=clamp(Math.floor(n),0,MAX_FORCE);this.peak=Math.max(this.peak,this.force);if(!this.force)this.end(false)}
  end(win){if(this.status!=='playing')return;this.status=win?'won':'lost';if(win)this.score+=2000+this.force*60;this.emit('end',{win})}
  spawn(data){
    const o={...data,id:++this.id,z:PLAYER_Z-(data.at-this.distance),prevZ:PLAYER_Z-(data.at-this.distance),x:data.x||0,flash:0};
    if(o.kind==='gates')o.choices=o.choices.map((g,i)=>({...g,value:g.type==='multiply'?Math.round((1+(g.value-1)*this.rules.recruits)*10)/10:g.value>0?Math.max(1,Math.round(g.value*this.rules.recruits)):g.value,x:i?2.65:-2.65,charge:0,chargeRequired:this.rules.gateCharge}));
    if(o.kind==='supply')o.reward=Math.max(1,Math.round(o.reward*this.rules.recruits));
    if(o.kind==='enemy'){o.maxHp=o.hp=o.count*3*this.rules.hp;o.remaining=o.count;o.fireClock=this.rules.fireInterval*.6;o.warning=0;o.radius=1.7;}
    if(o.kind==='boss'){o.maxHp=o.hp=this.definition.bossHp*this.rules.hp;o.fireClock=1.1;o.warning=0;o.radius=2.5;}
    if(o.kind==='supply'||o.kind==='weapon'){o.maxHp=o.hp=o.hp*this.rules.hp;o.radius=1.15;}
    if(o.kind==='barrier')o.radius=1.65;
    this.objects.push(o);this.emit('spawn',{object:o});
  }
  remove(o){if(o.dead)return;o.dead=true;this.emit('remove',{object:o})}
  hurt(n,x=this.x,z=PLAYER_Z){
    if(this.status!=='playing'||this.invulnerable>0)return;
    const lost=Math.min(this.force,n);this.losses+=lost;this.invulnerable=.32;this.emit('hurt',{amount:lost,x,z});this.setForce(this.force-lost);
  }
  hit(o,damage,x,z){
    if(o.dead)return;o.hp-=damage;if(o.kind==='boss'&&!this.bossEngaged)o.hp=Math.max(o.hp,o.maxHp*.8);o.flash=.09;
    this.emit('hit',{x,z,kind:o.kind});
    if(o.kind==='enemy'){
      const previous=o.remaining;o.remaining=Math.max(0,Math.ceil(o.hp/(o.maxHp/o.count)));const kills=previous-o.remaining;
      if(kills){this.kills+=kills;this.score+=kills*50;this.energy=clamp(this.energy+kills*3,0,100);this.emit('casualty',{object:o,previous})}
    }
    if(o.hp>0)return;
    if(o.kind==='supply'){const before=this.force;this.setForce(this.force+o.reward);this.score+=250;this.emit('reward',{text:`+${this.force-before} REINFORCEMENTS`,x:o.x,z:o.z})}
    if(o.kind==='weapon'){this.weapon=o.weapon;this.shotClock=0;this.score+=350;this.emit('weapon',{weapon:this.weapon,x:o.x,z:o.z})}
    this.emit('explosion',{x:o.x,z:o.z,big:o.kind==='boss'});this.remove(o);if(o.kind==='boss')this.end(true);
  }
  firePlayer(){
    const w=WEAPONS[this.weapon],streams=Math.min(7,Math.max(1,Math.ceil(this.force/6))),power=this.force/streams*.16;
    for(let i=0;i<streams;i++){
      const x=this.x+(i-(streams-1)/2)*.4,z=PLAYER_Z-1.1;
      const b={id:++this.id,x,z,prevX:x,prevZ:z,vx:this.weapon==='flame'?(i-(streams-1)/2)*.5:0,vz:-w.speed,damage:w.damage*power*(this.boost>0?1.4:1),life:w.range/w.speed,weapon:this.weapon,team:'blue',splash:w.splash||0};this.bullets.push(b);
    }
    this.emit('fire',{weapon:this.weapon,x:this.x,z:PLAYER_Z-1.1});
  }
  fireEnemy(o){
    const boss=o.kind==='boss',count=boss?3:Math.min(3,Math.ceil(o.remaining/8));
    for(let i=0;i<count;i++){
      const x=o.x+(i-(count-1)/2)*.65,z=o.z+1.2,speed=this.rules.bulletSpeed+(boss?2:0),t=(PLAYER_Z-z)/speed;
      this.bullets.push({id:++this.id,x,z,prevX:x,prevZ:z,vx:(o.aimX+(i-(count-1)/2)*.8-x)/Math.max(t,.5),vz:speed,damage:this.rules.damage,life:8,team:'red',weapon:boss?'rocket':'rifle'});
    }
    this.emit('enemyFire',{x:o.x,z:o.z});
  }
  update(dt){
    if(this.status!=='playing')return;
    this.time+=dt;this.boost=Math.max(0,this.boost-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);
    this.targetX=clamp(this.targetX,-3.7,3.7);this.x+=(this.targetX-this.x)*(1-Math.exp(-20*dt));
    const speed=this.bossEngaged?0:this.rules.speed;this.distance+=speed*dt;
    const script=this.definition.events;
    while(this.nextEvent<script.length&&script[this.nextEvent].at-this.distance<64)this.spawn(script[this.nextEvent++]);
    for(const o of this.objects){
      if(o.dead)continue;o.prevZ=o.z;o.z+=speed*dt;o.flash=Math.max(0,o.flash-dt);
      if(o.kind==='boss'&&o.z>=-15&&!this.bossEngaged){this.bossEngaged=true;o.z=-15;this.emit('boss',{name:this.definition.boss});}
      if((o.kind==='enemy'||o.kind==='boss')&&o.z>-31&&o.z<0){
        if(o.warning>0){o.warning-=dt;if(o.warning<=0){this.fireEnemy(o);o.fireClock=o.kind==='boss'?this.rules.bossInterval:this.rules.fireInterval;}}
        else {o.fireClock-=dt;if(o.fireClock<=0){o.aimX=this.x;o.warning=this.rules.warning;o.warningDuration=this.rules.warning;this.emit('warning',{object:o})}}
      }
      if(o.z<PLAYER_Z||o.kind==='boss')continue;
      if(o.kind==='gates'){
        const g=o.choices[this.x>=0?1:0],before=this.force;
        this.setForce(g.type==='multiply'?this.force*g.value:this.force+g.value);this.score+=Math.max(0,this.force-before)*20;this.energy=clamp(this.energy+15,0,100);
        this.emit('reward',{text:`${this.force-before>=0?'+':''}${this.force-before} SQUAD`,x:this.x,z:PLAYER_Z});
      }else if(o.kind==='enemy'&&Math.abs(this.x-o.x)<2.2)this.hurt(Math.max(2,Math.ceil(o.remaining*.7*this.rules.contact)));
      else if(o.kind==='barrier'&&Math.abs(this.x-o.x)<o.radius+.75)this.hurt(Math.ceil(6*this.rules.contact));
      else if((o.kind==='weapon'||o.kind==='supply')&&Math.abs(this.x-o.x)<1.6)this.hurt(Math.ceil(3*this.rules.contact));
      this.remove(o);
    }
    if(this.status!=='playing')return;
    this.shotClock-=dt;if(this.shotClock<=0){this.shotClock+=WEAPONS[this.weapon].rate*(this.boost>0?.55:1);this.firePlayer()}
    const troops=formation(this.force);
    for(const b of this.bullets){
      b.prevX=b.x;b.prevZ=b.z;b.x+=b.vx*dt;b.z+=b.vz*dt;b.life-=dt;
      if(b.life<=0)continue;
      if(b.team==='red'){
        for(const p of troops){if(segmentHit(b.prevX,b.prevZ,b.x,b.z,this.x+p.x,PLAYER_Z+p.z,.26,.3)!==null){this.hurt(b.damage,b.x,b.z);b.life=0;break}}
        continue;
      }
      let nearest=null,at=Infinity,choice=null;
      for(const o of this.objects){
        if(o.dead||o.kind==='barrier')continue;
        const candidates=o.kind==='gates'?o.choices:[o];
        for(const target of candidates){
          // Swept relative motion catches both fast projectiles and moving targets.
          const t=segmentHit(b.prevX,b.prevZ+(o.z-o.prevZ),b.x,b.z,target.x,o.z,o.kind==='gates'?2.25:o.radius,.8);
          if(t!==null&&t<at){at=t;nearest=o;choice=target}
        }
      }
      if(!nearest)continue;b.life=0;
      if(nearest.kind==='gates'){
        choice.charge+=b.damage;
        while(choice.charge>=choice.chargeRequired){choice.charge-=choice.chargeRequired;choice.value=choice.type==='multiply'?Math.min(2.5,Math.round((choice.value+.1)*10)/10):Math.min(25,choice.value+1);nearest.flash=.1}
      }else{
        this.hit(nearest,b.damage,b.x,nearest.z);
        if(b.splash)for(const o of this.objects)if(o!==nearest&&!o.dead&&o.hp&&Math.hypot(o.x-nearest.x,o.z-nearest.z)<b.splash)this.hit(o,b.damage*.5,o.x,o.z);
      }
    }
    this.objects=this.objects.filter(o=>!o.dead);this.bullets=this.bullets.filter(b=>b.life>0&&Math.abs(b.x)<12&&b.z<14);
    if(this.bossEngaged){this.bossTime+=dt;if(this.bossTime>45)this.end(false)}
  }
}
