// Span is the approximate ground coverage of the viewport's shorter edge, in world units.
// Profiles are authored against each world's target sizes, not a shared distance multiplier.
export const CAMERA_PROFILES={
 ascension:{elevation:65,lead:.065,points:[[1.2,20],[2,24],[3.2,35],[5,48],[8.5,64]],fog:3},
 metro:{elevation:62,lead:.07,points:[[1.2,20],[2,21],[4.03,31],[5.61,42],[8.5,58]],fog:3},
 basecamp:{elevation:58,lead:.075,points:[[1.2,18],[2,19],[3.66,29],[5.61,42],[8.5,60]],fog:3},
 deep:{elevation:65,lead:.065,points:[[1.2,16],[2,18],[3.66,29],[5.25,40],[8.5,64]],fog:2.3},
 alien:{elevation:61,lead:.07,points:[[1.2,19],[2.02,20],[3.42,30],[5.61,43],[8.5,64]],fog:2.7},
 orbit:{elevation:64,lead:.065,points:[[1.2,20],[2,21],[2.69,29],[4.27,39],[8.5,68]],fog:3}
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function cameraSpan(world,radius){
 const {points}=CAMERA_PROFILES[world]||CAMERA_PROFILES.metro,r=Number.isFinite(radius)?radius:1.2;
 if(r<=points[0][0])return points[0][1];
 for(let i=1;i<points.length;i++)if(r<=points[i][0]){const [a,x]=points[i-1],[b,y]=points[i],t=clamp((r-a)/(b-a),0,1),ease=t*t*(3-2*t);return x+(y-x)*ease;}
 return points.at(-1)[1];
}
export class GrowthCamera{
 constructor(){this.world=null;this.span=0;}
 reset(world,radius){this.world=world;this.span=cameraSpan(world,radius);}
 update(world,radius,dt,reduced=false){
  if(this.world!==world)this.reset(world,radius);
  const target=cameraSpan(world,radius),blend=1-Math.exp(-.8*clamp(Number.isFinite(dt)?dt:0,0,.1));
  this.span+=(target-this.span)*blend;return this.span;
 }
 framing(aspect){
  const p=CAMERA_PROFILES[this.world]||CAMERA_PROFILES.metro,elevation=p.elevation*Math.PI/180;
  const distance=this.span/(2*Math.tan(20*Math.PI/180))*Math.max(1/clamp(aspect,.2,8),Math.sin(elevation));
  return {span:this.span,distance,height:distance*Math.sin(elevation),back:distance*Math.cos(elevation),lead:this.span*p.lead,fogNear:distance+this.span*.2,fogFar:distance+this.span*p.fog};
 }
}
