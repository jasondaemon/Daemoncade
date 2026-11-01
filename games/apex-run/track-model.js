export const TRACK_BOXES=Object.freeze([
  // The stadium floor is the only box surface. The authored road and its
  // Rapier collider are generated together by buildRoadMesh below.
  {x:0,y:-.65,z:-20,hx:220,hy:1,hz:220,surface:"grass"},
]);
// The grass slab is the final physical support surface. Keep gameplay recovery
// slightly inside its vertical edges so a chassis cannot settle unsupported in
// the void while still appearing to be on the field.
export const PLAY_AREA=Object.freeze({minX:-218,maxX:218,minZ:-238,maxZ:198,grace:.35});
export function isInPlayArea({x,z}){return Number.isFinite(x)&&Number.isFinite(z)&&x>=PLAY_AREA.minX&&x<=PLAY_AREA.maxX&&z>=PLAY_AREA.minZ&&z<=PLAY_AREA.maxZ}
export function advanceOutsidePlayTime(previous,position,dt){return isInPlayArea(position)?0:Math.max(0,previous)+(Number.isFinite(dt)&&dt>0?dt:0)}
// Single authoritative centerline for world arrows and the minimap. Points are
// ordered in race direction; all guidance tangents are derived from this list.
export const ROUTE_PATH=Object.freeze([
  {x:-2,y:0,z:0,width:24,bank:0},{x:62,y:.5,z:0,width:24,bank:0},{x:96,y:2,z:-24,width:25,bank:-.08},{x:96,y:6,z:-72,width:25,bank:-.16},{x:78,y:9,z:-98,width:24,bank:-.1},{x:28,y:10,z:-108,width:23,bank:0},{x:-82,y:7,z:-103,width:24,bank:0},
  {x:-88,y:11,z:114,width:23,bank:.08},{x:-62,y:14,z:140,width:23,bank:.1},{x:126,y:11,z:140,width:24,bank:-.08},{x:150,y:7,z:114,width:25,bank:-.16},{x:150,y:2,z:8,width:23,bank:0},
]);
const distance3=(a,b)=>Math.hypot(b.x-a.x,(b.y||0)-(a.y||0),b.z-a.z);
function tangentAt(index,key){
  const point=ROUTE_PATH[index],before=ROUTE_PATH[Math.max(0,index-1)],after=ROUTE_PATH[Math.min(ROUTE_PATH.length-1,index+1)];
  if(index===0)return(after[key]||0)-(point[key]||0);if(index===ROUTE_PATH.length-1)return(point[key]||0)-(before[key]||0);
  const length=Math.min(distance3(before,point),distance3(point,after))*.95,dx=after.x-before.x,dy=(after.y||0)-(before.y||0),dz=after.z-before.z,norm=Math.hypot(dx,dy,dz)||1;
  return({x:dx,y:dy,z:dz}[key]/norm)*length;
}
function hermite(a,b,ma,mb,t){const t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*a+(t3-2*t2+t)*ma+(-2*t3+3*t2)*b+(t3-t2)*mb}
function sampleControl(index,t){
  // The crest uses a C2-continuous bump. Zero first and second derivatives at
  // both joins keep the visual ribbon and suspension collider from acquiring
  // the sharp pitch kink produced by the earlier Gaussian profile.
  const a=ROUTE_PATH[index],b=ROUTE_PATH[index+1],hump=index===5?672*t**3*(1-t)**3:0;
  return{x:hermite(a.x,b.x,tangentAt(index,"x"),tangentAt(index+1,"x"),t),y:hermite(a.y,b.y,tangentAt(index,"y"),tangentAt(index+1,"y"),t)+hump+.55,z:hermite(a.z,b.z,tangentAt(index,"z"),tangentAt(index+1,"z"),t),width:a.width+(b.width-a.width)*t,bank:a.bank+(b.bank-a.bank)*t}
}
export function buildRoadMesh(stepsPerSegment=18){const samples=[];for(let segment=0;segment<ROUTE_PATH.length-1;segment++)for(let step=0;step<stepsPerSegment;step++)samples.push(sampleControl(segment,step/stepsPerSegment));samples.push(sampleControl(ROUTE_PATH.length-2,1));for(let i=0;i<samples.length;i++){const before=samples[Math.max(0,i-1)],after=samples[Math.min(samples.length-1,i+1)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1,rx=-dz/length,rz=dx/length,half=samples[i].width/2,cos=Math.cos(samples[i].bank),sin=Math.sin(samples[i].bank);samples[i].heading=Math.atan2(dz,dx);samples[i].left={x:samples[i].x+rx*half*cos,y:samples[i].y+half*sin,z:samples[i].z+rz*half*cos};samples[i].right={x:samples[i].x-rx*half*cos,y:samples[i].y-half*sin,z:samples[i].z-rz*half*cos}}
  const positions=[],indices=[],thickness=1.1;for(const sample of samples)positions.push(sample.left.x,sample.left.y,sample.left.z,sample.right.x,sample.right.y,sample.right.z,sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y-thickness,sample.right.z);for(let i=0;i<samples.length-1;i++){const a=i*4,b=(i+1)*4;indices.push(a,b,a+1,b,b+1,a+1,a+2,a+3,b+2,b+2,a+3,b+3,a,a+2,b,b,a+2,b+2,a+1,b+1,a+3,b+1,a+3,b+3)}return{positions,indices,samples}}
export const ROAD_SAMPLES=Object.freeze(buildRoadMesh(22).samples.map(Object.freeze));
function sampleFrame(samples,index){const sample=samples[index],before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),lateral=normalized({x:sample.left.x-sample.right.x,y:sample.left.y-sample.right.y,z:sample.left.z-sample.right.z});return{forward,lateral,up:normalized(cross(lateral,forward))}}
export function buildLaneRibbon(samples=ROAD_SAMPLES,halfWidth=.11,lift=.075){const positions=[],indices=[];for(let i=0;i<samples.length;i++){const sample=samples[i],{lateral,up}=sampleFrame(samples,i);for(const side of[-1,1])positions.push(sample.x+up.x*lift+lateral.x*halfWidth*side,sample.y+up.y*lift+lateral.y*halfWidth*side,sample.z+up.z*lift+lateral.z*halfWidth*side);if(i){const a=(i-1)*2,b=i*2;indices.push(a,b,a+1,b,b+1,a+1)}}return{positions,indices}}
export const RAIL_PROFILE=Object.freeze({height:1.05,thickness:.32});
export function buildRailColliderMesh(samples=ROAD_SAMPLES,height=RAIL_PROFILE.height,thickness=RAIL_PROFILE.thickness){const positions=[],indices=[];for(const side of["left","right"]){const offset=positions.length/3,outward=side==="left"?1:-1;for(let i=0;i<samples.length;i++){const edge=samples[i][side],{lateral,up}=sampleFrame(samples,i),outer={x:edge.x+lateral.x*thickness*outward,y:edge.y+lateral.y*thickness*outward,z:edge.z+lateral.z*thickness*outward};positions.push(edge.x+up.x*.02,edge.y+up.y*.02,edge.z+up.z*.02,edge.x+up.x*height,edge.y+up.y*height,edge.z+up.z*height,outer.x+up.x*.02,outer.y+up.y*.02,outer.z+up.z*.02,outer.x+up.x*height,outer.y+up.y*height,outer.z+up.z*height);if(i){const a=offset+(i-1)*4,b=offset+i*4;indices.push(a,b,a+1,b,b+1,a+1,a+2,a+3,b+2,b+2,a+3,b+3,a+1,b+1,a+3,b+1,b+3,a+3,a,b,a+2,b,b+2,a+2)}}}return{positions,indices}}
export function nearestRoadSample({x,z}){let result=ROAD_SAMPLES[0],best=Infinity;for(const sample of ROAD_SAMPLES){const distance=(x-sample.x)**2+(z-sample.z)**2;if(distance<best){best=distance;result=sample}}return result}
function normalized(vector){const length=Math.hypot(vector.x,vector.y,vector.z)||1;return{x:vector.x/length,y:vector.y/length,z:vector.z/length}}
function cross(a,b){return{x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x}}
function basisQuaternion(forward,up,lateral){
  const m00=forward.x,m01=up.x,m02=lateral.x,m10=forward.y,m11=up.y,m12=lateral.y,m20=forward.z,m21=up.z,m22=lateral.z,trace=m00+m11+m22;let x,y,z,w;
  if(trace>0){const s=Math.sqrt(trace+1)*2;w=.25*s;x=(m21-m12)/s;y=(m02-m20)/s;z=(m10-m01)/s}else if(m00>m11&&m00>m22){const s=Math.sqrt(1+m00-m11-m22)*2;w=(m21-m12)/s;x=.25*s;y=(m01+m10)/s;z=(m02+m20)/s}else if(m11>m22){const s=Math.sqrt(1+m11-m00-m22)*2;w=(m02-m20)/s;x=(m01+m10)/s;y=.25*s;z=(m12+m21)/s}else{const s=Math.sqrt(1+m22-m00-m11)*2;w=(m10-m01)/s;x=(m02+m20)/s;y=(m12+m21)/s;z=.25*s}return{x,y,z,w}
}
export function roadPoseNear(position,lift=1.7){
  const sample=nearestRoadSample(position),index=ROAD_SAMPLES.indexOf(sample),before=ROAD_SAMPLES[Math.max(0,index-1)],after=ROAD_SAMPLES[Math.min(ROAD_SAMPLES.length-1,index+1)],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),lateral=normalized({x:sample.left.x-sample.right.x,y:sample.left.y-sample.right.y,z:sample.left.z-sample.right.z}),up=normalized(cross(lateral,forward)),orthogonalLateral=normalized(cross(forward,up));
  return{x:sample.x+up.x*lift,y:sample.y+up.y*lift,z:sample.z+up.z*lift,rotation:basisQuaternion(forward,up,orthogonalLateral)}
}
// Each checkpoint may only navigate along its own ordered route stage. This
// prevents a nearby later straight (especially the finish) from becoming a
// tempting but invalid cross-grass shortcut.
export const ROUTE_STAGE_RANGES=Object.freeze([[0,2],[2,3],[3,6],[6,7],[7,9],[9,11]].map(Object.freeze));
export function routeStage(checkpoint){const range=ROUTE_STAGE_RANGES[Math.max(0,Math.min(checkpoint,ROUTE_STAGE_RANGES.length-1))],start=range[0]*22,end=Math.min(ROAD_SAMPLES.length-1,range[1]*22),points=ROAD_SAMPLES.slice(start,end+1).map(({x,y,z})=>({x,y,z})),gate=CHECKPOINTS[Math.max(0,Math.min(checkpoint,CHECKPOINTS.length-1))];return points.concat(gate?{x:gate.x,y:gate.y,z:gate.z}:[])}
function stageGeometry(checkpoint){const points=routeStage(checkpoint),segments=[];let total=0;for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=(b.y||0)-(a.y||0),dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.001)continue;segments.push({a,b,dx,dy,dz,length,start:total});total+=length}return{segments,total}}
function pointAt(geometry,along){const wanted=Math.max(0,Math.min(geometry.total,along));for(const segment of geometry.segments)if(wanted<=segment.start+segment.length){const t=(wanted-segment.start)/segment.length;return{x:segment.a.x+segment.dx*t,y:(segment.a.y||0)+segment.dy*t,z:segment.a.z+segment.dz*t}}const last=geometry.segments.at(-1)?.b||{x:0,y:0,z:0};return{x:last.x,y:last.y||0,z:last.z}}
export function routeTarget(checkpoint,position,lookahead=28,minimumProgress=0){
  const geometry=stageGeometry(checkpoint),floor=Math.max(0,minimumProgress-5);let best={distance:Infinity,along:Math.max(0,minimumProgress)};
  for(const segment of geometry.segments){const t=Math.max(0,Math.min(1,((position.x-segment.a.x)*segment.dx+(position.z-segment.a.z)*segment.dz)/(segment.length*segment.length))),along=segment.start+segment.length*t;if(along<floor)continue;const projected=pointAt(geometry,along),distance=Math.hypot(position.x-projected.x,position.z-projected.z);if(distance<best.distance)best={distance,along}}
  // Progress is monotonic within the checkpoint stage. The small projection
  // floor tolerates corner cutting while hysteresis prevents a passed helper
  // point from ever commanding a U-turn.
  const progress=Math.max(minimumProgress,best.along),distances=[lookahead*.45,lookahead,lookahead*1.55],breadcrumbs=distances.map(distance=>pointAt(geometry,progress+distance)),target=breadcrumbs[1];return{...target,stage:checkpoint,progress,total:geometry.total,breadcrumbs}
}
export function routeGuides(spacing=32){const guides=[];let carry=spacing*.5;for(let i=1;i<ROAD_SAMPLES.length;i++){const a=ROAD_SAMPLES[i-1],b=ROAD_SAMPLES[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.hypot(dx,dy,dz);while(carry<=length){const t=carry/length;guides.push({x:a.x+dx*t,y:a.y+dy*t,z:a.z+dz*t,heading:Math.atan2(dz,dx),segment:i-1});carry+=spacing}carry-=length}return guides}
export const CHECKPOINTS=Object.freeze([
  {x:99,y:2,z:-12,hx:18,hz:18,rotation:Math.PI/2},{x:96,y:6,z:-72,hx:28,hz:26,rotation:Math.PI/2},
  {x:-82,y:7,z:-103,hx:16,hz:16,rotation:0},{x:-82,y:13,z:125,hx:40,hz:20,rotation:Math.PI/2},
  {x:135,y:10,z:140,hx:18,hz:16,rotation:0},{x:150,y:2,z:8,hx:16,hz:12,rotation:Math.PI/2,finish:true},
]);
export const RECOVERY_SPOTS=Object.freeze([
  roadPoseNear({x:-2,z:0}),roadPoseNear({x:93,z:-20}),roadPoseNear({x:76,z:-102}),
  roadPoseNear({x:-85,z:-78}),roadPoseNear({x:-76,z:132}),roadPoseNear({x:148,z:124}),
].map(Object.freeze));
export function recoveryForward(rotation){return{x:1-2*(rotation.y*rotation.y+rotation.z*rotation.z),z:2*(rotation.x*rotation.z-rotation.w*rotation.y)}}
export function isOnRoad({x,y,z}){let best=Infinity,width=0,height=0;for(const sample of ROAD_SAMPLES){const distance=Math.hypot(x-sample.x,z-sample.z);if(distance<best){best=distance;width=sample.width;height=sample.y}}return best<=width*.58&&(!Number.isFinite(y)||Math.abs(y-height)<=5.5)}
export function isUnderRoad({x,y,z},clearance=2.6){if(!Number.isFinite(y))return false;const sample=nearestRoadSample({x,z});return Math.hypot(x-sample.x,z-sample.z)<=sample.width*.62&&y<sample.y-clearance}
export function advanceUnderRoadTime(previous,position,dt){return isUnderRoad(position)?Math.max(0,previous)+(Number.isFinite(dt)&&dt>0?dt:0):0}
export function checkpointAdvance(current,position){const zone=CHECKPOINTS[current];return zone&&Math.abs(position.x-zone.x)<=zone.hx&&Math.abs(position.z-zone.z)<=zone.hz&&(!Number.isFinite(position.y)||Math.abs(position.y-(zone.y+1.5))<7)?current+1:current}
