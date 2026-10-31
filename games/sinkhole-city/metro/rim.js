// A small active-body solver for the moving opening. Props at rest stay batched.
// Contact is against the solid volume: y <= street height AND outside the hole.
// The closest surface is either the pavement or the vertical inside of the rim.
const FLOOR=.075, SLOP=.003;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
export function rotate(q,v){
 const u=cross(q,v),t={x:u.x*2,y:u.y*2,z:u.z*2},r=cross(q,t);
 return {x:v.x+q.w*t.x+r.x,y:v.y+q.w*t.y+r.y,z:v.z+q.w*t.z+r.z};
}
function inverseInertia(b,v){
 const local=rotate({x:-b.q.x,y:-b.q.y,z:-b.q.z,w:b.q.w},v);
 return rotate(b.q,{x:local.x*b.invI.x,y:local.y*b.invI.y,z:local.z*b.invI.z});
}
export function createBody(o){
 const shape=o.shape||{width:o.radius*1.25,depth:o.radius*1.25,height:o.radius*2};
 const {width:w,depth:d,height:h}=shape,m=Math.max(.1,o.mass);
 const points=shape.contacts||[];
 // Bottom support, edges and upper corners all become contacts as a prop tips.
 if(!shape.contacts){
  for(const y of[-h/2,h/2])for(const x of[-w/2,0,w/2])for(const z of[-d/2,0,d/2])points.push({x,y,z});
  for(const y of[-h/4,0,h/4])for(const x of[-w/2,w/2])for(const z of[-d/2,d/2])points.push({x,y,z});
 }
 const envelope=shape.contacts?[-1,1].flatMap(y=>[-1,1].flatMap(x=>[-1,1].map(z=>({x:x*w/2,y:y*h/2,z:z*d/2})))):points;
 return {x:o.x,y:FLOOR+h/2,z:o.z,v:o.intakeVelocity?{...o.intakeVelocity}:{x:0,y:0,z:0},w:{x:0,y:0,z:0},q:{x:0,y:Math.sin(o.yaw/2),z:0,w:Math.cos(o.yaw/2)},
  invMass:1/m,invI:{x:12/(m*(h*h+d*d)),y:12/(m*(w*w+d*d)),z:12/(m*(w*w+h*h))},points,envelope,shape,rest:0,age:0,impactUntil:0};
}
function impulse(b,r,n,j){
 b.v.x+=n.x*j*b.invMass;b.v.y+=n.y*j*b.invMass;b.v.z+=n.z*j*b.invMass;
 const turn=inverseInertia(b,cross(r,{x:n.x*j,y:n.y*j,z:n.z*j}));b.w.x+=turn.x;b.w.y+=turn.y;b.w.z+=turn.z;
}
function contactVelocity(b,r){const spin=cross(b.w,r);return {x:b.v.x+spin.x,y:b.v.y+spin.y,z:b.v.z+spin.z};}
function denominator(b,r,n){return b.invMass+dot(cross(inverseInertia(b,cross(r,n)),r),n);}
function advanceOrientation(b,dt){
 const q=b.q,w=b.w;
 const x=q.x,y=q.y,z=q.z,s=q.w;
 q.x+=(w.x*s+w.y*z-w.z*y)*dt*.5;q.y+=(-w.x*z+w.y*s+w.z*x)*dt*.5;
 q.z+=(w.x*y-w.y*x+w.z*s)*dt*.5;q.w+=(-w.x*x-w.y*y-w.z*z)*dt*.5;
 const n=Math.hypot(q.x,q.y,q.z,q.w);q.x/=n;q.y/=n;q.z/=n;q.w/=n;
}
function verticalBounds(b){
 let top=-Infinity,bottom=Infinity;
 for(const point of b.envelope||b.points){const y=b.y+rotate(b.q,point).y;top=Math.max(top,y);bottom=Math.min(bottom,y);}
 return {top,bottom};
}
function commitDeepFall(b,hole){
 if(b.committed)return;
 const {top,bottom}=verticalBounds(b);
 // The center is well below the rim: most of the body has already entered.
 // Closing pavement must not turn that accepted descent into an upward impact.
 if(b.y<FLOOR-Math.max(.08,(top-bottom)*.08)){
  b.committed=true;b.intake={x:hole.x,z:hole.z,radius:hole.radius};
  b.ceiling=top;b.v.y=Math.min(0,b.v.y);b.rest=0;
 }
}
export function supportFraction(o,hole){
 const b=o.body,shape=b?.shape||o.shape||{width:o.radius*1.25,depth:o.radius*1.25,height:o.radius*2};
 if(b){
  // After a prop lands on its side, its lowest face becomes the new support.
  const points=b.points.map(point=>rotate(b.q,point)),lowest=Math.min(...points.map(point=>point.y));let unsupported=0,total=0;
  for(const point of points)if(point.y<lowest+.04){total++;if(Math.hypot(b.x+point.x-hole.x,b.z+point.z-hole.z)<hole.radius)unsupported++;}
  return unsupported/Math.max(1,total);
 }
 const yaw=o.yaw,c=Math.cos(yaw),s=Math.sin(yaw),x=b?.x??o.x,z=b?.z??o.z;let missing=0;
 if(shape.supports){for(const p of shape.supports){const px=x+p.x*c+p.z*s,pz=z-p.x*s+p.z*c;if(Math.hypot(px-hole.x,pz-hole.z)<hole.radius)missing++;}return missing/shape.supports.length;}
 for(const u of[-.5,0,.5])for(const v of[-.5,0,.5]){
  const px=x+u*shape.width*c+v*shape.depth*s,pz=z-u*shape.width*s+v*shape.depth*c;
  if(Math.hypot(px-hole.x,pz-hole.z)<hole.radius)missing++;
 }
 return missing/9;
}
export function stepBody(o,hole,dt,time){
 const b=o.body||(o.body=createBody(o));b.age+=dt;
 commitDeepFall(b,hole);
 // Finish in world space at the intake; neither attach to the player nor let
 // the moving rim teleport closing-ground contacts underneath a swallowed body.
 const intake=b.intake||hole;
 const dx=intake.x-b.x,dz=intake.z-b.z,distance=Math.hypot(dx,dz),inside=Math.max(0,1-distance/intake.radius);
 // A mild pressure field keeps tiny clutter collectable at running speed. It is
 // acceleration, not attachment: a moving hole can still leave a prop behind.
 b.v.y-=(22+Math.max(0,1-o.radius/2)*35)*dt;
 if(distance>.01&&inside>0){b.v.x+=(dx/distance*6-dz/distance*1.2)*inside*dt;b.v.z+=(dz/distance*6+dx/distance*1.2)*inside*dt;}
 const drag=Math.exp(-.24*dt);b.v.x*=drag;b.v.z*=drag;b.w.x*=drag;b.w.y*=drag;b.w.z*=drag;
 b.x+=b.v.x*dt;b.y+=b.v.y*dt;b.z+=b.v.z*dt;advanceOrientation(b,dt);
 commitDeepFall(b,hole);
 let impact=null,contacts=0;
 for(let iteration=0;iteration<6&&!b.committed;iteration++){
  for(const local of b.points){
   const r=rotate(b.q,local),px=b.x+r.x,py=b.y+r.y,pz=b.z+r.z,dx=px-hole.x,dz=pz-hole.z,radial=Math.hypot(dx,dz),depth=FLOOR-py;
   if(depth < -SLOP || radial < hole.radius)continue;
   const radialDepth=radial-hole.radius;
   const wall=radialDepth < depth && depth>.025;
   const n=wall?{x:-dx/Math.max(.001,radial),y:0,z:-dz/Math.max(.001,radial)}:{x:0,y:1,z:0};
   const penetration=wall?radialDepth:depth;
   const v=contactVelocity(b,r),speed=dot(v,n),bias=Math.min(2.5,Math.max(0,penetration-SLOP)*.2/dt);
   const bounce=speed < -1.3 ? .16 : 0,j=Math.max(0,(bias-(1+bounce)*speed)/denominator(b,r,n));
   if(j<=0)continue;contacts++;impulse(b,r,n,j);
   const after=contactVelocity(b,r),normalSpeed=dot(after,n),t={x:after.x-n.x*normalSpeed,y:after.y-n.y*normalSpeed,z:after.z-n.z*normalSpeed},length=Math.hypot(t.x,t.y,t.z);
   if(length>.0001){t.x/=length;t.y/=length;t.z/=length;const friction=Math.min(length/denominator(b,r,t),j*(wall?.22:.62));impulse(b,r,t,-friction);}
   if(iteration===0&&-speed>.8&&time>b.impactUntil){b.impactUntil=time+.14;impact={x:px,y:FLOOR,z:pz,nx:n.x,nz:n.z,speed:-speed,rim:wall||Math.abs(radial-hole.radius)<o.radius*.4};}
  }
 }
 // Only numerical extremes are bounded; normal tipping and angular momentum persist.
 for(const axis of['x','y','z']){b.w[axis]=clamp(b.w[axis],-12,12);b.v[axis]=clamp(b.v[axis],-35,35);}
 o.x=b.x;o.z=b.z;
 let {top,bottom}=verticalBounds(b);
 if(b.committed){
  // Continued rotation may otherwise swing a long end back through the street.
  // Preserve its angular motion, but never raise the visible upper envelope.
  const rise=Math.max(0,top-b.ceiling);b.y-=rise;top-=rise;bottom-=rise;
  b.ceiling=Math.min(b.ceiling,top);b.v.y=Math.min(0,b.v.y);
 }
 const settled=contacts>0&&Math.hypot(b.v.x,b.v.y,b.v.z)<.6&&Math.hypot(b.w.x,b.w.y,b.w.z)<.8;
 b.rest=settled?b.rest+dt:0;
 return {top,bottom,impact,settled:b.rest>.35};
}
