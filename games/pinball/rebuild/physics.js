import RAPIER from './vendor/rapier-0.17.3.js';
import {TABLE,clamp,segments} from './table.js?v=1.0.0-beta.1';
export const STEP=1/240, RADIUS=.235;
export async function initPhysics(){await RAPIER.init();}

export class PinballPhysics {
  constructor(onEvent=()=>{}) {
    this.onEvent=onEvent; this.time=0; this.nextId=0; this.balls=[];this.flippers=[];
    this.cooldowns=new Map();this.tags=new Map();this.held=[false,false];
    this.world=new RAPIER.World({x:0,y:-22,z:-3.8});this.world.timestep=STEP;
    this.world.integrationParameters.numSolverIterations=8;
    this.world.integrationParameters.maxCcdSubsteps=4;
    this.queue=new RAPIER.EventQueue(true);
    this.ground=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    this.box(0,-.18,10,5.2,.18,11);
    // Invisible glass prevents energetic collisions ejecting a ball from the cabinet.
    this.box(0,4.5,10,5.2,.1,11);
    for(const path of TABLE.rails)for(const [a,b] of segments(path))this.rail(a,b,.9,.11);
    for(let i=0;i<TABLE.slings.length;i++){
      const path=TABLE.slings[i];for(const [a,b] of segments([...path,path[0]]))this.rail(a,b,.6,.12,{type:'sling',id:i});
    }
    for(let i=0;i<TABLE.bumpers.length;i++){
      const p=TABLE.bumpers[i];this.collider(RAPIER.ColliderDesc.cylinder(.42,.6).setTranslation(p.x,.42,p.z).setRestitution(.85),{type:'bumper',id:i,...p});
    }
    for(let i=0;i<TABLE.targets.length;i++){
      const p=TABLE.targets[i];this.box(p.x,.4,p.z,.17,.4,.38,{type:'target',id:i});
    }
    this.sensor(TABLE.scoop.x,TABLE.scoop.z,.48,{type:'scoop'});
    this.sensor(0,18.7,.65,{type:'skill'});
    this.sensor(-4.2,10,.26,{type:'orbit'});
    this.sensor(-3.3,7,.34,{type:'ramp'},.35);
    this.makeRamp();this.makeFlippers();
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
  makeRamp(){
    // Continuous triangular road bed plus solid side walls; no teleporting along a spline.
    const path=TABLE.ramp,half=.57,vertices=[],indices=[];
    for(let i=0;i<path.length;i++){
      const p=path[i],a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)];
      const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len;
      vertices.push(p[0]-nx*half,p[1],p[2]-nz*half,p[0]+nx*half,p[1],p[2]+nz*half);
      if(i){const n=i*2;indices.push(n-2,n,n-1,n-1,n,n+1);}
    }
    this.collider(RAPIER.ColliderDesc.trimesh(new Float32Array(vertices),new Uint32Array(indices)).setRestitution(.05));
    this.rampSupports=[];
    for(let i=1;i<path.length;i++){
      if(Math.min(path[i-1][1],path[i][1])>.8)continue;
      const top=vertices.slice((i-1)*6,(i+1)*6),solid=[...top];
      for(let j=0;j<top.length;j+=3)solid.push(top[j],-.04,top[j+2]);
      const hull=RAPIER.ColliderDesc.convexHull(new Float32Array(solid));
      if(hull)this.collider(hull.setRestitution(.05).setFriction(.08));
      this.rampSupports.push(solid);
    }
    for(let i=1;i<path.length;i++)for(const edge of [0,1]){
      const n=(i-1)*6+edge*3,m=i*6+edge*3;
      const a={x:vertices[n],y:vertices[n+1]+.19,z:vertices[n+2]},b={x:vertices[m],y:vertices[m+1]+.19,z:vertices[m+2]};
      const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz);
      const axis={x:dz,y:0,z:-dx},al=Math.hypot(axis.x,axis.z),angle=Math.acos(clamp(dy/len,-1,1));
      const q=al?{x:axis.x/al*Math.sin(angle/2),y:0,z:axis.z/al*Math.sin(angle/2),w:Math.cos(angle/2)}:{x:0,y:0,z:0,w:1};
      this.collider(RAPIER.ColliderDesc.capsule(len/2,.065).setTranslation((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2).setRotation(q).setRestitution(.25));
      this.collider(RAPIER.ColliderDesc.capsule(len/2,.065).setTranslation((a.x+b.x)/2,(a.y+b.y)/2+.32,(a.z+b.z)/2).setRotation(q).setRestitution(.1));
    }
    this.rampMesh={vertices,indices};
  }
  makeFlippers(){
    TABLE.flippers.forEach(p=>{
      const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,.26,p.z).setCanSleep(false).setCcdEnabled(true));
      this.collider(RAPIER.ColliderDesc.cuboid(.85,.18,.18).setTranslation(p.side*.74,0,0).setDensity(12).setFriction(.8).setRestitution(.15),{type:'flipper'},body);
      const joint=this.world.createImpulseJoint(RAPIER.JointData.revolute({x:p.x,y:.26,z:p.z},{x:0,y:0,z:0},{x:0,y:1,z:0}),this.ground,body,true);
      joint.setLimits(p.side===1?-.52:-.36,p.side===1?.36:.52);
      joint.configureMotorPosition(.32*p.side,1800,90);
      this.flippers.push({body,joint,side:p.side});
    });
  }
  setFlipper(i,up){this.held[i]=up;const f=this.flippers[i];f.joint.configureMotorPosition((up?-.48:.32)*f.side,up?2600:1100,up?80:55);}
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
    this.time+=STEP;for(const b of this.balls){b.previous={...b.body.translation()};b.age+=STEP;}
    this.world.step(this.queue);const events=[];
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
      if(speed>24)b.body.setLinvel({x:v.x*24/speed,y:v.y*24/speed,z:v.z*24/speed},true);
      if(p.z<.2||p.y<-.7||Math.abs(p.x)>6||p.z>22){this.onEvent({type:'drain',ballId:b.id},b);continue;}
      b.still=speed<.12?b.still+STEP:0;
      if(b.still>1.5&&p.x>3.65&&p.z<2&&b.launched){b.still=0;this.onEvent({type:'shooter-return',ballId:b.id},b);}
      if(b.still>5&&p.x<3.65){b.still=0;this.onEvent({type:'stuck',ballId:b.id},b);}
    }
    if(this.cooldowns.size>256)for(const [key,time]of this.cooldowns)if(time<this.time)this.cooldowns.delete(key);
  }
  dispose(){this.queue.free();this.world.free();}
}
