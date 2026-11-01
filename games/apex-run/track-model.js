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
function catmull(a,b,c,d,t){const t2=t*t,t3=t2*t;return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3)}
function sampleControl(index,t){const a=ROUTE_PATH[Math.max(0,index-1)],b=ROUTE_PATH[index],c=ROUTE_PATH[Math.min(ROUTE_PATH.length-1,index+1)],d=ROUTE_PATH[Math.min(ROUTE_PATH.length-1,index+2)],hump=index===5?10*Math.exp(-Math.pow((t-.55)/.12,2)):0;return{x:catmull(a.x,b.x,c.x,d.x,t),y:catmull(a.y,b.y,c.y,d.y,t)+hump+.55,z:catmull(a.z,b.z,c.z,d.z,t),width:b.width+(c.width-b.width)*t,bank:b.bank+(c.bank-b.bank)*t}}
export function buildRoadMesh(stepsPerSegment=18){const samples=[];for(let segment=0;segment<ROUTE_PATH.length-1;segment++)for(let step=0;step<stepsPerSegment;step++)samples.push(sampleControl(segment,step/stepsPerSegment));samples.push({...ROUTE_PATH.at(-1)});for(let i=0;i<samples.length;i++){const before=samples[Math.max(0,i-1)],after=samples[Math.min(samples.length-1,i+1)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1,rx=-dz/length,rz=dx/length,half=samples[i].width/2,cos=Math.cos(samples[i].bank),sin=Math.sin(samples[i].bank);samples[i].heading=Math.atan2(dz,dx);samples[i].left={x:samples[i].x+rx*half*cos,y:samples[i].y+half*sin,z:samples[i].z+rz*half*cos};samples[i].right={x:samples[i].x-rx*half*cos,y:samples[i].y-half*sin,z:samples[i].z-rz*half*cos}}
  const positions=[],indices=[],thickness=1.1;for(const sample of samples)positions.push(sample.left.x,sample.left.y,sample.left.z,sample.right.x,sample.right.y,sample.right.z,sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y-thickness,sample.right.z);for(let i=0;i<samples.length-1;i++){const a=i*4,b=(i+1)*4;indices.push(a,b,a+1,b,b+1,a+1,a+2,a+3,b+2,b+2,a+3,b+3,a,a+2,b,b,a+2,b+2,a+1,b+1,a+3,b+1,a+3,b+3)}return{positions,indices,samples}}
export const ROAD_SAMPLES=Object.freeze(buildRoadMesh(22).samples.map(Object.freeze));
export function nearestRoadSample({x,z}){let result=ROAD_SAMPLES[0],best=Infinity;for(const sample of ROAD_SAMPLES){const distance=(x-sample.x)**2+(z-sample.z)**2;if(distance<best){best=distance;result=sample}}return result}
export function roadPoseNear(position,lift=1.7){const sample=nearestRoadSample(position),half=-sample.heading/2;return{x:sample.x,y:sample.y+lift,z:sample.z,rotation:{x:0,y:Math.sin(half),z:0,w:Math.cos(half)}}}
// Each checkpoint may only navigate along its own ordered route stage. This
// prevents a nearby later straight (especially the finish) from becoming a
// tempting but invalid cross-grass shortcut.
export const ROUTE_STAGE_RANGES=Object.freeze([[0,2],[2,3],[3,6],[6,7],[7,9],[9,11]].map(Object.freeze));
export function routeStage(checkpoint){const range=ROUTE_STAGE_RANGES[Math.max(0,Math.min(checkpoint,ROUTE_STAGE_RANGES.length-1))],points=ROUTE_PATH.slice(range[0],range[1]+1);const gate=CHECKPOINTS[Math.max(0,Math.min(checkpoint,CHECKPOINTS.length-1))];return points.concat(gate?{x:gate.x,z:gate.z}:[])}
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
export function routeGuides(spacing=32){const guides=[];for(let i=0;i<ROUTE_PATH.length-1;i++){const a=ROUTE_PATH[i],b=ROUTE_PATH[i+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),steps=Math.max(1,Math.floor(length/spacing));for(let step=0;step<steps;step++){const t=(step+.5)/steps;guides.push({x:a.x+dx*t,y:a.y+(b.y-a.y)*t,z:a.z+dz*t,heading:Math.atan2(dz,dx),segment:i})}}return guides}
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
export function isOnRoad({x,z}){let best=Infinity,width=0;for(const sample of ROAD_SAMPLES){const distance=Math.hypot(x-sample.x,z-sample.z);if(distance<best){best=distance;width=sample.width}}return best<=width*.58}
export function checkpointAdvance(current,position){const zone=CHECKPOINTS[current];return zone&&Math.abs(position.x-zone.x)<=zone.hx&&Math.abs(position.z-zone.z)<=zone.hz?current+1:current}
