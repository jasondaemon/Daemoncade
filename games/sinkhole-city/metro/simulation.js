import {supportFraction,stepBody} from './rim.js?v=contact15';
import {populateWorld} from './districts.js?v=layouts43';
import {updatePeople,updateCityTraffic} from './city-life.js?v=camp-life32';
import {dressWorld} from './world-dressing.js?v=parks42';
import {populateCampLife,updateCampLife} from './camp-life.js?v=camp-life32';
import {updateOrbit,captureOrbiter,collapsePlanet} from './orbit.js?v=collapse29';
import {energizeGrove} from './alien.js?v=groves30';
import {updateTraffic} from './traffic.js?v=life21';
import {createSchools,updateMarine,captureSwimmer} from './marine.js?v=reef27';
import {NearbyObjects} from './spatial.js?v=perf17';
import {varyCity,varyCamp} from './layout-variation.js?v=layouts43';
import {populateAscension,finishScale,advanceScale,collectScale,SCALE_COUNT,SCALE_LIMIT} from './ascension.js?v=release48';
export const DISTRICT = {half:54, duration:120, title:'Market District'};
const catalog = {
 quantum:{radius:.5,mass:.5,score:50},
 fence:{radius:1.75,mass:.12,score:40},gate:{radius:2.2,mass:.2,score:70},fountain:{radius:2,mass:1.6,score:280},
 person:{radius:.3,mass:.12,score:15},
 deer:{radius:.65,mass:.38,score:65},fox:{radius:.4,mass:.22,score:40},
 debris:{radius:.35,mass:.24,score:35},satellite:{radius:.95,mass:1.1,score:180},probe:{radius:1.35,mass:1.8,score:260},shuttle:{radius:2.2,mass:3.8,score:500},planet:{radius:3.5,mass:8,score:1400},
 shard:{radius:.38,mass:.24,score:35},spore:{radius:.65,mass:.42,score:60},resonator:{radius:1.25,mass:1.7,score:250},pod:{radius:1.65,mass:2.2,score:330},crystal:{radius:1.05,mass:1,score:140},monolith:{radius:2.8,mass:5,score:650},
 cone:{radius:.32,mass:.13,score:20},bin:{radius:.46,mass:.19,score:30},hydrant:{radius:.38,mass:.16,score:25},
 bench:{radius:.85,mass:.38,score:65},lamp:{radius:.46,mass:.24,score:45},tree:{radius:1.1,mass:.7,score:110},
 car:{radius:1.35,mass:1.2,score:180},van:{radius:1.65,mass:1.7,score:240},
 crate:{radius:.42,mass:.18,score:30},cart:{radius:1.15,mass:.8,score:130},
 cooler:{radius:.4,mass:.18,score:30},log:{radius:.55,mass:.25,score:45},firepit:{radius:.65,mass:.35,score:65},picnic:{radius:.9,mass:.55,score:90},
 pine:{radius:1.15,mass:.75,score:120},tent:{radius:1.05,mass:.9,score:140},rv:{radius:1.7,mass:1.9,score:260},cabin:{radius:3,mass:4.5,score:600},
 building:{radius:3.3,mass:5,score:650},warehouse:{radius:3.7,mass:6,score:800},landmark:{radius:4.6,mass:10,score:2000},
 shell:{radius:.34,mass:.15,score:25},amphora:{radius:.45,mass:.22,score:40},seafan:{radius:.7,mass:.3,score:55},kelp:{radius:.75,mass:.3,score:60},coral:{radius:1.15,mass:.85,score:130},reef:{radius:2.2,mass:3,score:400},salvage:{radius:1.25,mass:1.1,score:160},wreck:{radius:3,mass:6,score:1000},treasure:{radius:.5,mass:.6,score:300},
 fish:{radius:.28,mass:.2,score:30},ray:{radius:.85,mass:.7,score:110},turtle:{radius:.75,mass:.65,score:100},jellyfish:{radius:.6,mass:.4,score:60},shark:{radius:1.45,mass:1.7,score:230},dolphin:{radius:1.5,mass:1.9,score:260},whale:{radius:4.3,mass:10,score:1800}
};
export function stage(radius){return radius<1.65?'Street clutter':radius<4.03?'Vehicles & trees':radius<5.61?'Buildings':'Water tower';}
export class DistrictRun {
 constructor({free=false,contract=null,world=contract?.world||'metro',traffic=true,spatial=true,seed=0}={}){
  this.seed=Number.isInteger(seed)?seed>>>0:0;
  this.spatialEnabled=spatial;this.nearby=null;
  this.world=['basecamp','deep','alien','orbit','ascension'].includes(world)?world:'metro';this.id='you';this.name='You';this.contract=contract;this.duration=contract?.duration||DISTRICT.duration;this.counts={clutter:0,vehicles:0,landmark:0,camp:0,treasure:0,marine:0,giants:0,cores:0,spacecraft:0,planets:0,scales:0};this.scaleStage=0;this.pendingScale=null;
  this.free=free;this.time=0;this.score=0;this.eaten=0;this.done=false;this.won=false;this.combo=0;this.comboTime=0;this.streak=0;this.peakStreak=0;this.events=[];
  this.player={x:-26,z:32,vx:0,vz:0,radius:1.2,area:1.44};this.objects=[];
  const add=(type,x,z,yaw=0)=>{const o={id:this.objects.length,type,x,z,yaw,...catalog[type],phase:'idle',fall:0};this.objects.push(o);return o;};
  if(this.world==='basecamp'){this.player.x=-30;this.player.z=36;}
  if(this.world==='deep'){this.player.x=-30;this.player.z=36;}
  if(this.world==='alien'){this.player.x=-30;this.player.z=40;}
  if(this.world==='orbit'){this.player.x=-30;this.player.z=29;}
  if(this.world==='ascension'){this.player.x=0;this.player.z=0;this.scaleZoom=1;this.scaleProgress=0;populateAscension(add,this.seed);}
  else populateWorld(this.world,add,{traffic,seed:this.seed});
  if(this.world!=='ascension'&&(traffic||this.world!=='metro'))dressWorld(this.world,this.objects,add);
  if(this.world==='basecamp')populateCampLife(add);
  if(traffic&&this.world==='metro')varyCity(this);
  if(this.world==='basecamp')varyCamp(this);
  this.traffic=this.objects.filter(o=>o.traffic);
  this.people=this.objects.filter(o=>o.walker);
  this.campObstacles=this.world==='basecamp'?this.objects.filter(o=>!o.walker):[];
  this.cityEncounter=null;if(this.world==='metro'&&traffic){const signals=this.objects.filter(o=>o.signal);this.cityEncounter={player:this.player,traffic:this.traffic,signals,signalMap:new Map(signals.map(o=>[o.junction.x*128+o.junction.z,o])),slots:new Map()};}
  this.orbiters=this.objects.filter(o=>o.orbital);
  this.marine=this.objects.filter(o=>o.swim);this.schools=createSchools(this.marine);
  // A mostly moving world (currently Orbit) costs more to reindex than scan.
  // Keep its direct collection path instead of imposing broad-phase overhead.
  this.spatialEnabled=spatial&&(this.traffic.length+this.orbiters.length+this.marine.length+this.people.length)<this.objects.length*.5;
  this.reefObstacles=this.world==='deep'?this.objects.filter(o=>['reef','coral','wreck','salvage','landmark'].includes(o.type)):[];
  this.total=this.objects.length;
 }
 eligible(o){return (!o.owner||o.owner===this.id)&&!['consumed','falling','buried','sealed','diving','dormant'].includes(o.phase)&&o.radius<=this.player.radius*.82;}
 consume(actor,o){
  if(o.phase==='consumed')return;
  if(o.phase==='sealed'||o.phase==='buried'||o.phase==='dormant')return;
  // Campaign growth should reward working a district, not skipping whole size tiers.
  // Keep the competitive Arena rules unchanged for existing records.
  const growth=this.arena?1:this.world==='ascension'?.15:this.world==='basecamp'?.36:this.world==='orbit'?.32:.25;
  const p=actor.player;o.phase='consumed';p.area+=o.mass*growth;actor.streak=actor.comboTime>0?(actor.streak||0)+1:1;actor.peakStreak=Math.max(actor.peakStreak||0,actor.streak);actor.combo=Math.min(10,actor.combo+1);actor.comboTime=2;const points=Math.round(o.score*(1+actor.combo*.08));actor.score+=points;actor.eaten++;this.events.push({type:'consume',object:o,actor:actor.id,points});
  if(!this.arena&&[10,25,50].includes(actor.streak))this.events.push({type:'streak',object:o,actor:actor.id,chain:actor.streak});
  if(o.reveals){let count=0;for(const hidden of this.objects)if(hidden.phase==='buried'&&hidden.revealGroup===o.reveals){hidden.phase='idle';count++;}if(count)this.events.push({type:'reveal',object:o,count,actor:actor.id});}
  if(this.world==='alien'){energizeGrove(this,o);if(o.type==='pod'&&o.charged)actor.counts.cores++;if(['shard','spore'].includes(o.type))actor.counts.clutter++;}
  if(this.world==='orbit'){collapsePlanet(this,o);if(o.type==='debris')actor.counts.clutter++;if(['satellite','probe','shuttle'].includes(o.type))actor.counts.spacecraft++;}
  if(['cone','bin','hydrant','bench','lamp','crate','cooler','log','firepit','picnic','shell','amphora','seafan','kelp'].includes(o.type))actor.counts.clutter++;
  if(o.swim)actor.counts.marine++;if(o.type==='whale')actor.counts.giants++;
  if(o.type==='treasure')actor.counts.treasure++;if(['tent','rv'].includes(o.type))actor.counts.camp++;
  if(['car','van'].includes(o.type))actor.counts.vehicles++;if(o.type==='landmark')actor.counts.landmark++;
  if(this.world==='ascension')finishScale(this);
  if(!this.arena){
   if(this.contract&&!this.free){if(this.counts[this.contract.kind]>=this.contract.target)this.won=this.done=true;}
   else if(o.type==='landmark'){this.won=true;if(!this.free)this.done=true;}
  }
 }
 move(actor,dt,input){
  actor.comboTime=Math.max(0,actor.comboTime-dt);if(!actor.comboTime){actor.combo=0;actor.streak=0;}
  const p=actor.player,len=Math.hypot(input.x,input.y),scale=len>1?1/len:1;
  // Retain immediate steering response; reduce map traversal speed in campaign
  // and exploration so collecting a district is not a single high-speed sweep.
  const speed=this.world==='ascension'?3.6*Math.max(1,p.radius/1.8):!this.arena&&(this.contract||this.free)?Math.max(7.8,9.8-p.radius*.3):Math.max(9,14-p.radius*.45);
  p.vx+=(input.x*scale*speed-p.vx)*(1-Math.exp(-10*dt));p.vz+=(input.y*scale*speed-p.vz)*(1-Math.exp(-10*dt));
  const limit=this.world==='ascension'?SCALE_LIMIT:51;
  p.x=Math.max(-limit,Math.min(limit,p.x+p.vx*dt));p.z=Math.max(-limit,Math.min(limit,p.z+p.vz*dt));
  p.radius+=((this.world==='ascension'?Math.sqrt(p.area):Math.min(8.5,Math.sqrt(p.area)))-p.radius)*(1-Math.exp(-7*dt));
 }
 collect(actor,dt){
  if(this.world==='ascension'){collectScale(this,dt);return;}
  const p=actor.player;
  let candidates=this.objects;
  if(this.spatialEnabled&&!this.arena){this.nearby??=new NearbyObjects();this.nearby.update(this.objects);candidates=this.nearby.query(p);}
  for(const o of candidates){
   try{
   if(o.phase==='consumed'||o.phase==='buried'||o.phase==='sealed'||o.phase==='dormant'||o.owner&&o.owner!==actor.id)continue;
   if(o.orbital){const before=o.phase;if(captureOrbiter(o,p,dt))this.consume(actor,o);else if(before==='idle'&&o.phase==='diving'){o.owner=actor.id;this.events.push({type:'capture',object:o,actor:actor.id});}continue;}
   if(o.swim){const before=o.phase;if(captureSwimmer(o,p,dt))this.consume(actor,o);else if(before==='idle'&&o.phase==='diving'){o.owner=actor.id;this.events.push({type:'capture',object:o,actor:actor.id});}continue;}
   o.rockVelocity=(o.rockVelocity||0)+((o.rockTarget||0)-(o.rockAngle||0))*65*dt;
   o.rockVelocity*=Math.exp(-11*dt);o.rockAngle=(o.rockAngle||0)+o.rockVelocity*dt;o.rockTarget=0;
   const fits=o.radius<=p.radius*.82,near=Math.hypot((o.body?.x??o.x)-p.x,(o.body?.z??o.z)-p.z)<p.radius+o.radius*1.2;
   if(o.phase==='idle'){
    if(!near)continue;
    const unsupported=supportFraction(o,p);
    const threshold=o.shape?.profile==='model'&&Math.hypot(o.x-p.x,o.z-p.z)<p.radius ? .5 : 5/9;
    if(!fits || unsupported<threshold){
     // Large fixed structures can rock locally, but do not tunnel through a small opening.
     o.rockTarget=unsupported>0&&unsupported<.9?Math.min(.09,unsupported*.12):0;
     o.rockDirection=Math.atan2(p.x-o.x,p.z-o.z);continue;
    }
    o.phase='contact';o.owner=actor.id;this.events.push({type:'capture',object:o,actor:actor.id});
    if(o.traffic&&!o.traffic.stopped){o.traffic.stopped=true;o.intakeVelocity={x:o.traffic.vx,y:0,z:o.traffic.vz};}
   }
   let outcome;
   // Two 120 Hz contact steps keep small props stable at the lip at a 60 Hz game tick.
   for(let sub=0;sub<2;sub++){
    const result=stepBody(o,p,dt/2,this.time);outcome=result;
    if(result.impact)this.events.push({type:'impact',object:o,actor:actor.id,...result.impact});
   }
   o.phase=o.body.committed||outcome.bottom<-.12?'falling':'contact';
   if(outcome.top<-.35){
    this.consume(actor,o);
   }else if(outcome.settled && (!near || supportFraction(o,p)<.34)){
    o.phase='idle';o.owner=null;o.x=o.body.x;o.z=o.body.z;o.body.v={x:0,y:0,z:0};o.body.w={x:0,y:0,z:0};
   }
   }finally{this.nearby?.track(o);}
  }
 }
 continueExploring(){
  if(this.arena||!this.done||!this.won||this.eaten>=this.total||this.world==='ascension'&&this.infinityComplete)return false;
  // Detach the completed contract. The same scene/player/clock continue, but
  // exploration can never improve its medal or award its result a second time.
  this.contract=null;this.free=true;this.done=false;this.won=false;this.combo=this.comboTime=this.streak=0;this.events.length=0;if(this.world==='ascension')advanceScale(this);return true;
 }
 step(dt,input){
  if(this.done)return;this.time+=dt;updateTraffic(this.traffic,dt);updateCityTraffic(this.traffic,dt,this.time,this.people,this.cityEncounter);updatePeople(this.people,dt,this.time,this.player,this.cityEncounter);updateCampLife(this.people,dt,this.time,this.player,this.campObstacles);updateOrbit(this.orbiters,dt,this.time,this.counts.planets);updateMarine(this.marine,this.schools,dt,this.time,this.reefObstacles,this.player);this.move(this,dt,input);this.collect(this,dt);
  if(!this.free&&this.time>=this.duration)this.done=true;
  if(this.world==='ascension'&&!this.done){advanceScale(this,dt);if(this.infinityComplete){this.done=this.won=true;}}
  if(this.world!=='ascension'&&this.eaten===this.total){this.done=true;this.won=true;}
 }
}
