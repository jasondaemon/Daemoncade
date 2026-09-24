import RAPIER from './vendor/rapier-0.17.3.js';
import {TABLE,clamp,segments} from './table.js?v=1.0.0-beta.3.1';
export const STEP=1/240, RADIUS=.235;
export async function initPhysics(){await RAPIER.init();}

export class PinballPhysics {
  constructor(onEvent=()=>{}) {
    this.onEvent=onEvent; this.time=0; this.nextId=0; this.balls=[];this.flippers=[];
    this.cooldowns=new Map();this.tags=new Map();this.held=[false,false];
    // Arcade world scale: stronger surface gravity and a brisk downhill return.
    this.world=new RAPIER.World({x:0,y:-32,z:-6.2});this.world.timestep=STEP;
    this.world.integrationParameters.numSolverIterations=8;
    this.world.integrationParameters.maxCcdSubsteps=4;
    this.queue=new RAPIER.EventQueue(true);
    this.ground=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    this.box(0,-.18,10,5.2,.18,11);
    // Invisible glass prevents energetic collisions ejecting a ball from the cabinet.
    this.box(0,4.5,10,5.2,.1,11);
    for(const path of TABLE.rails)for(const [a,b] of segments(path))this.rail(a,b,.9,.11);
    for(let i=0;i<TABLE.slings.length;i++){
      const path=TABLE.slings[i];segments([...path,path[0]]).forEach(([a,b],edge)=>this.rail(a,b,.6,.12,edge===0?{type:'sling',id:i}:undefined));
    }
    for(let i=0;i<TABLE.bumpers.length;i++){
      const p=TABLE.bumpers[i];this.collider(RAPIER.ColliderDesc.cylinder(.42,.6).setTranslation(p.x,.42,p.z).setRestitution(.85),{type:'bumper',id:i,...p});
    }
    this.targetColliders=[];
    for(let i=0;i<TABLE.targets.length;i++){
      const p=TABLE.targets[i];this.targetColliders.push(this.box(p.x,.4,p.z,.25,.4,.12,{type:'target',id:i}));
    }
    this.sensor(TABLE.scoop.x,TABLE.scoop.z,.48,{type:'scoop'});
    this.sensor(TABLE.modeScoop.x,TABLE.modeScoop.z,.42,{type:'mode-scoop'});
    this.sensor(TABLE.spinner.x,TABLE.spinner.z,.4,{type:'spinner'});
    TABLE.rollovers.forEach((p,id)=>this.sensor(p.x,p.z,.33,{type:'rollover',id}));
    this.sensor(0,18.7,.65,{type:'skill'});
    this.sensor(-4.2,10,.26,{type:'orbit'});
    this.rampMeshes=[];this.rampSupports=[];
    TABLE.ramps.forEach((path,id)=>{const p=path.at(-1);this.sensor(p[0],p[2],.34,{type:'ramp',id},.35);this.makeRamp(path);});this.makeFlippers();
  }
  collider(desc,tag,body=this.ground){
    desc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    const c=this.world.createCollider(desc,body);if(tag)this.tags.set(c.handle,tag);return c;
  }
  box(x,y,z,hx,hy,hz,tag){return this.collider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRestitution(.45),tag);}
  rail(a,b,height=.8,r=.1,tag){
    const dx=b[0]-a[0],dz=b[1]-a[1],angle=Math.atan2(dx,dz);
    return this.collider(RAPIER.ColliderDesc.cuboid(r,height/2,Math.hypot(dx,dz)/2+r)
      .setTranslation((a[0]+b[0])/2,height/2,(a[1]+b[1])/2)
      .setRotation({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)}).setRestitution(.65),tag);
  }
  sensor(x,z,r,tag,y=.28){this.collider(RAPIER.ColliderDesc.ball(r).setTranslation(x,y,z).setSensor(true),tag);}
  makeRamp(path){
    // Continuous triangular road bed plus solid side walls; no teleporting along a spline.
    const half=.46,vertices=[],indices=[];
    for(let i=0;i<path.length;i++){
      const p=path[i],a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)];
      const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len;
      vertices.push(p[0]-nx*half,p[1],p[2]-nz*half,p[0]+nx*half,p[1],p[2]+nz*half);
      if(i){const n=i*2;indices.push(n-2,n,n-1,n-1,n,n+1);}
    }
    this.collider(RAPIER.ColliderDesc.trimesh(new Float32Array(vertices),new Uint32Array(indices)).setRestitution(.05));
    // A continuous solid plinth closes the entire low-clearance U-shaped
    // underside, rather than leaving blind pockets between individual wedges.
    const solid=[...vertices];for(let i=0;i<vertices.length;i+=3)solid.push(vertices[i],-.04,vertices[i+2]);
    const hull=RAPIER.ColliderDesc.convexHull(new Float32Array(solid));
    if(hull){const c=this.collider(hull.setRestitution(.1).setFriction(.08));this.rampSupports.push({vertices:Array.from(c.vertices()),indices:Array.from(c.indices())});}
    for(let i=1;i<path.length;i++)for(const edge of [0,1]){
      const n=(i-1)*6+edge*3,m=i*6+edge*3;
      const a={x:vertices[n],y:vertices[n+1]+.19,z:vertices[n+2]},b={x:vertices[m],y:vertices[m+1]+.19,z:vertices[m+2]};
      const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz);
      const axis={x:dz,y:0,z:-dx},al=Math.hypot(axis.x,axis.z),angle=Math.acos(clamp(dy/len,-1,1));
      const q=al?{x:axis.x/al*Math.sin(angle/2),y:0,z:axis.z/al*Math.sin(angle/2),w:Math.cos(angle/2)}:{x:0,y:0,z:0,w:1};
      this.collider(RAPIER.ColliderDesc.capsule(len/2,.065).setTranslation((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2).setRotation(q).setRestitution(.25));
      this.collider(RAPIER.ColliderDesc.capsule(len/2,.065).setTranslation((a.x+b.x)/2,(a.y+b.y)/2+.32,(a.z+b.z)/2).setRotation(q).setRestitution(.1));
    }
    this.rampMeshes.push({vertices,indices,path});
  }
  makeFlippers(){
    TABLE.flippers.forEach((p,id)=>{
      const angle=.36*p.side,body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x,.3,p.z).setRotation({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)}).setCcdEnabled(true));
      // Rounded tapered bat, with no square shoulder for the return to snag on.
      const vertices=[];for(const y of [-.29,.29])for(const [x,r]of [[0,.23],[2.05,.14]])for(let j=0;j<12;j++){const a=j*Math.PI/6;vertices.push(p.side*(x+Math.cos(a)*r),y,Math.sin(a)*r);}
      this.collider(RAPIER.ColliderDesc.convexHull(new Float32Array(vertices)).setFriction(.12).setRestitution(.3),{type:'flipper',id},body);
      this.flippers.push({body,side:p.side,angle,rising:false});
    });
  }
  setFlipper(i,up){this.held[i]=up;}
  setGarageOpen(open){if(open===this.garageOpen)return;this.garageOpen=open;this.targetColliders.forEach(c=>c.setEnabled(!open));}
  addBall(x=4.16,z=1.4,velocity={x:0,y:0,z:0},y=RADIUS+.025){
    const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,y,z).setCcdEnabled(true).setCanSleep(false).setLinearDamping(.06).setAngularDamping(.08));
    const c=this.collider(RAPIER.ColliderDesc.ball(RADIUS).setDensity(1).setRestitution(.45).setFriction(.16),null,body);
    const ball={id:++this.nextId,body,handle:c.handle,previous:{...body.translation()},age:0,still:0,rampTransit:false};
    this.tags.set(c.handle,{type:'ball',id:ball.id});body.setLinvel(velocity,true);this.balls.push(ball);return ball;
  }
  removeBall(ball){this.tags.delete(ball.handle);this.world.removeRigidBody(ball.body);this.balls=this.balls.filter(b=>b!==ball);}
  launch(ball,power){ball.launched=true;ball.body.setLinvel({x:0,y:0,z:17+clamp(power,0,1)*7},true);}
  nudge(dx){for(const b of this.balls){const v=b.body.linvel();b.body.setLinvel({x:v.x+dx*1.8,y:v.y+.18,z:v.z+1.2},true);}}
  clear(){for(const b of [...this.balls])this.removeBall(b);this.cooldowns.clear();this.held.forEach((_,i)=>this.setFlipper(i,false));}
  tick(){
    // Once a real shot climbs into the raised rail channel, constrain its return
    // to that channel. This avoids tiny rail seams ejecting balls at arcade speed.
    for(const b of this.balls){
      let p=b.body.translation();
      if(!b.ride&&p.y>.33&&b.body.linvel().z>2){
        for(let id=0;id<TABLE.ramps.length&&!b.ride;id++)for(let i=3;i<13;i++){
          const q=TABLE.ramps[id][i];if(Math.hypot(p.x-q[0],p.z-q[2])<.46&&Math.abs(p.y-q[1]-RADIUS)<.35){b.ride={id,next:i+1};b.rampTransit=true;b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);this.world.getCollider(b.handle).setEnabled(false);break;}
        }
      }
      if(b.ride){const ride=b.ride,q=TABLE.ramps[ride.id][ride.next],dx=q[0]-p.x,dy=q[1]+RADIUS+.025-p.y,dz=q[2]-p.z,d=Math.hypot(dx,dy,dz),step=8*STEP,k=Math.min(1,step/Math.max(.0001,d));b.body.setNextKinematicTranslation({x:p.x+dx*k,y:p.y+dy*k,z:p.z+dz*k});
        if(d<=step&&++ride.next>=TABLE.ramps[ride.id].length){const id=ride.id;b.ride=null;b.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);b.body.setTranslation({x:q[0],y:q[1]+RADIUS+.025,z:q[2]},true);this.world.getCollider(b.handle).setEnabled(true);b.body.setLinvel({x:0,y:0,z:-5},true);this.cooldowns.set(`${b.id}:ramp:${id}`,this.time+2);this.onEvent({type:'ramp',id,ballId:b.id},b);}
      }
    }
    for(let i=0;i<2;i++){const f=this.flippers[i],target=(this.held[i]?-.5:.36)*f.side,delta=clamp(target-f.angle,-.085,.085);f.rising=this.held[i]&&Math.abs(delta)>.001;f.angle+=delta;f.body.setNextKinematicRotation({x:0,y:Math.sin(f.angle/2),z:0,w:Math.cos(f.angle/2)});}
    this.time+=STEP;for(const b of this.balls){b.previous={...b.body.translation()};b.age+=STEP;}
    this.world.step(this.queue);const events=[];
    // A powered stroke also handles an existing resting contact (Rapier does not
    // emit a new collision-start for a ball already lying against the rubber).
    for(const f of this.flippers)if(f.rising)for(const b of this.balls){
      const p=b.body.translation(),o=f.body.translation(),dx=p.x-o.x,dz=p.z-o.z,c=Math.cos(f.angle),s=Math.sin(f.angle),along=(dx*c-dz*s)*f.side,front=dx*s+dz*c;
      if(p.y<.9&&along>-.04&&along<2.3&&front>-.12&&front<.68&&this.time>(b.lastStroke||0)+.3){const t=clamp(along/2.05,0,1),aim=f.side*(.85-1.25*t);b.body.setLinvel({x:aim*29,y:0,z:29},true);b.lastStroke=this.time;}
    }
    this.queue.drainCollisionEvents((a,b,started)=>{
      if(!started)return;const at=this.tags.get(a),bt=this.tags.get(b);
      const ballTag=at?.type==='ball'?at:bt?.type==='ball'?bt:null,other=at===ballTag?bt:at;
      if(!ballTag||!other||other.type==='ball')return;
      const key=`${ballTag.id}:${other.type}:${other.id??0}`;
      if((this.cooldowns.get(key)||0)>this.time)return;
      this.cooldowns.set(key,this.time+({bumper:.085,sling:.2,target:.5,scoop:1,orbit:2,ramp:2,skill:2}[other.type]||.1));
      events.push({ballId:ballTag.id,...other});
    });
    for(const e of events){
      const b=this.balls.find(b=>b.id===e.ballId);if(!b)continue;
      if(e.type==='flipper'&&this.flippers[e.id].rising&&!b.ride){const f=this.flippers[e.id],p=b.body.translation(),t=clamp(Math.abs(p.x-f.body.translation().x)/2.05,0,1),dx=f.side*(.85-1.25*t);b.body.setLinvel({x:dx*29,y:0,z:29},true);}
      if(e.type==='bumper'||e.type==='sling'){
        const p=b.body.translation(),v=b.body.linvel();
        if(e.type==='bumper'){const dx=p.x-e.x,dz=p.z-e.z,len=Math.max(.01,Math.hypot(dx,dz));b.body.setLinvel({x:dx/len*11,y:0,z:dz/len*11},true);}
        else b.body.setLinvel({x:e.id===0?6:-6,y:0,z:Math.max(7,Math.abs(v.z)*.8)},true);
      }
      this.onEvent(e,b);
    }
    for(const b of [...this.balls]){
      const p=b.body.translation(),v=b.body.linvel(),speed=Math.hypot(v.x,v.y,v.z);
      if(p.y>.85&&p.z>9)b.rampTransit=true;
      if(speed>32)b.body.setLinvel({x:v.x*32/speed,y:v.y*32/speed,z:v.z*32/speed},true);
      if(p.z<.2||p.y<-.7||Math.abs(p.x)>6||p.z>22){this.onEvent({type:'drain',ballId:b.id},b);continue;}
      b.still=speed<.12?b.still+STEP:0;
      if(!b.region||Math.hypot(p.x-b.region.x,p.z-b.region.z)>.65){b.region={x:p.x,z:p.z};b.regionTime=0;}else b.regionTime+=STEP;
      if(b.still>1.5&&p.x>3.65&&p.z<2&&b.launched){b.still=0;this.onEvent({type:'shooter-return',ballId:b.id},b);}
      if((b.still>5||b.regionTime>5)&&p.x<3.65&&!(p.z<4.4&&this.held.some(Boolean))){b.still=0;b.regionTime=0;this.onEvent({type:'stuck',ballId:b.id},b);}
    }
    if(this.cooldowns.size>256)for(const [key,time]of this.cooldowns)if(time<this.time)this.cooldowns.delete(key);
  }
  dispose(){this.queue.free();this.world.free();}
}
