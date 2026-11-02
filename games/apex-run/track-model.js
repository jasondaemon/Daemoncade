import {requestedTrackId} from "./track-catalog.js?v=0.5.0-alpha34";

const ALPINE_ROUTE=Object.freeze([
  {x:-2,y:0,z:0,width:24,bank:0},{x:62,y:.5,z:0,width:24,bank:0},{x:96,y:2,z:-24,width:25,bank:-.08},{x:96,y:6,z:-72,width:25,bank:-.16},{x:78,y:9,z:-98,width:24,bank:-.1},{x:28,y:10,z:-108,width:23,bank:0},{x:-82,y:7,z:-103,width:24,bank:0},
  {x:-88,y:11,z:114,width:23,bank:.08},{x:-62,y:14,z:140,width:23,bank:.1},{x:126,y:11,z:140,width:24,bank:-.08},{x:150,y:7,z:114,width:25,bank:-.16},{x:150,y:2,z:8,width:23,bank:0},
]);
const SUMMIT_ROUTE=Object.freeze([
  {x:-380,y:0,z:-280,bank:0},{x:-270,y:1,z:-330,bank:.08},{x:-120,y:5,z:-250,bank:.18},{x:40,y:9,z:-340,bank:-.18},{x:220,y:18,z:-300,bank:-.12},{x:360,y:28,z:-180,bank:-.2},{x:410,y:38,z:20,bank:.1},{x:280,y:30,z:240,bank:.18},{x:100,y:18,z:330,bank:.14},{x:-110,y:18,z:340,bank:-.12},{x:-300,y:30,z:260,bank:-.18},{x:-410,y:25,z:100,bank:-.12},{x:-400,y:14,z:-60,bank:.1},{x:-300,y:8,z:-160,bank:.18},{x:-150,y:12,z:-180,bank:.12},{x:0,y:20,z:-120,bank:-.1},{x:140,y:28,z:-20,bank:-.18},{x:220,y:22,z:90,bank:-.1},{x:340,y:14,z:110,bank:.04},{x:450,y:8,z:20,bank:.1},{x:500,y:2,z:-120,bank:0},
].map(point=>Object.freeze({...point,width:40})));
const TRACK_DEFINITIONS=Object.freeze({
  "alpine-sprint":Object.freeze({route:ALPINE_ROUTE,checkpointPoints:[2,6,9,11],stageRanges:[[0,2],[2,6],[6,9],[9,11]],humps:{5:14},jumpSegment:5}),
  "summit-circuit":Object.freeze({route:SUMMIT_ROUTE,checkpointPoints:[3,6,10,13,16,20],stageRanges:[[0,3],[3,6],[6,10],[10,13],[13,16],[16,20]],humps:{10:12},jumpSegment:10}),
});
export const ACTIVE_TRACK_ID=requestedTrackId();
export const ACTIVE_TRACK_DEFINITION=TRACK_DEFINITIONS[ACTIVE_TRACK_ID]||TRACK_DEFINITIONS["alpine-sprint"];
const summit=ACTIVE_TRACK_ID==="summit-circuit";
export const VENUE=Object.freeze(summit?{centerX:0,centerZ:0,halfX:540,halfZ:450,stands:[{x:0,z:-418,rotation:0,length:130},{x:-508,z:30,rotation:Math.PI/2,length:108},{x:508,z:280,rotation:-Math.PI/2,length:116}],basinRadius:515}:{centerX:0,centerZ:-20,halfX:220,halfZ:220,stands:[{x:10,z:-188,rotation:0,length:105},{x:-177,z:35,rotation:Math.PI/2,length:78},{x:212,z:62,rotation:-Math.PI/2,length:88}],basinRadius:245});
export const TRACK_BOXES=Object.freeze([
  // The stadium floor is the only box surface. The authored road and its
  // Rapier collider are generated together by buildRoadMesh below.
  {x:VENUE.centerX,y:-.65,z:VENUE.centerZ,hx:VENUE.halfX,hy:1,hz:VENUE.halfZ,surface:"grass"},
]);
// The grass slab is the final physical support surface. Keep gameplay recovery
// slightly inside its vertical edges so a chassis cannot settle unsupported in
// the void while still appearing to be on the field.
export const PLAY_AREA=Object.freeze({minX:VENUE.centerX-VENUE.halfX+2,maxX:VENUE.centerX+VENUE.halfX-2,minZ:VENUE.centerZ-VENUE.halfZ+2,maxZ:VENUE.centerZ+VENUE.halfZ-2,grace:.35});
export function isInPlayArea({x,z}){return Number.isFinite(x)&&Number.isFinite(z)&&x>=PLAY_AREA.minX&&x<=PLAY_AREA.maxX&&z>=PLAY_AREA.minZ&&z<=PLAY_AREA.maxZ}
export function advanceOutsidePlayTime(previous,position,dt){return isInPlayArea(position)?0:Math.max(0,previous)+(Number.isFinite(dt)&&dt>0?dt:0)}
// Single authoritative centerline for world arrows and the minimap. Points are
// ordered in race direction; all guidance tangents are derived from this list.
export const ROUTE_PATH=ACTIVE_TRACK_DEFINITION.route;
export const START_EXTENSION_SAMPLES=10;
// The timed spawn sits just beyond the authored route origin.  Keep the
// start gantry behind it on the straight apron: placing both at the same
// cross-section made Summit's 40 m beam fill the chase camera and visually
// slice the first bend.
export const START_SPAWN_SAMPLE_INDEX=START_EXTENSION_SAMPLES+2;
export const START_GATE_SAMPLE_INDEX=Math.max(1,START_EXTENSION_SAMPLES-4);
export const ROAD_STEPS_PER_SEGMENT=summit?100:88;
const routeSampleIndex=(routePoint,offset=0)=>START_EXTENSION_SAMPLES+routePoint*ROAD_STEPS_PER_SEGMENT+offset;
export const JUMP_ZONE=Object.freeze({approach:routeSampleIndex(ACTIVE_TRACK_DEFINITION.jumpSegment,8),takeoff:routeSampleIndex(ACTIVE_TRACK_DEFINITION.jumpSegment,36),landing:routeSampleIndex(ACTIVE_TRACK_DEFINITION.jumpSegment,68)});
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
  const a=ROUTE_PATH[index],b=ROUTE_PATH[index+1],hump=(ACTIVE_TRACK_DEFINITION.humps[index]||0)*Math.sin(Math.PI*t)**4;
  return{x:hermite(a.x,b.x,tangentAt(index,"x"),tangentAt(index+1,"x"),t),y:hermite(a.y,b.y,tangentAt(index,"y"),tangentAt(index+1,"y"),t)+hump+.55,z:hermite(a.z,b.z,tangentAt(index,"z"),tangentAt(index+1,"z"),t),width:a.width+(b.width-a.width)*t,bank:a.bank+(b.bank-a.bank)*t}
}
export function buildRoadMesh(stepsPerSegment=ROAD_STEPS_PER_SEGMENT){const samples=[],first=sampleControl(0,0),second=sampleControl(0,1/stepsPerSegment),dx=second.x-first.x,dz=second.z-first.z,length=Math.hypot(dx,dz)||1,fx=dx/length,fz=dz/length;for(let step=START_EXTENSION_SAMPLES;step>0;step--)samples.push({...first,x:first.x-fx*step*3,z:first.z-fz*step*3});for(let segment=0;segment<ROUTE_PATH.length-1;segment++)for(let step=0;step<stepsPerSegment;step++)samples.push(sampleControl(segment,step/stepsPerSegment));samples.push(sampleControl(ROUTE_PATH.length-2,1));for(let i=0;i<samples.length;i++){const before=samples[Math.max(0,i-1)],after=samples[Math.min(samples.length-1,i+1)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1,rx=-dz/length,rz=dx/length,half=samples[i].width/2,cos=Math.cos(samples[i].bank),sin=Math.sin(samples[i].bank);samples[i].heading=Math.atan2(dz,dx);samples[i].left={x:samples[i].x+rx*half*cos,y:samples[i].y+half*sin,z:samples[i].z+rz*half*cos};samples[i].right={x:samples[i].x-rx*half*cos,y:samples[i].y-half*sin,z:samples[i].z-rz*half*cos}}
  // Keep the road top, underside, and edge-wall vertices separate. The old
  // shared vertices averaged normals across hard corners, making each curved
  // side quad reveal its diagonal as a sawtooth under chase-view lighting.
  const positions=[],indices=[],thickness=1.1;for(const sample of samples)positions.push(
    sample.left.x,sample.left.y,sample.left.z,sample.right.x,sample.right.y,sample.right.z,
    sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y-thickness,sample.right.z,
    sample.left.x,sample.left.y,sample.left.z,sample.left.x,sample.left.y-thickness,sample.left.z,
    sample.right.x,sample.right.y,sample.right.z,sample.right.x,sample.right.y-thickness,sample.right.z,
  );for(let i=0;i<samples.length-1;i++){const a=i*8,b=(i+1)*8;indices.push(
    a,b,a+1,b,b+1,a+1,
    a+2,a+3,b+2,b+2,a+3,b+3,
    a+4,a+5,b+4,b+4,a+5,b+5,
    a+6,b+6,a+7,b+6,b+7,a+7,
  )}return{positions,indices,samples}}
export const ROAD_SAMPLES=Object.freeze(buildRoadMesh().samples.map(Object.freeze));
function bezier(a,b,c,d,t){const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d}
function buildBranchSamples(){
  if(!summit)return[];
  const entryIndex=routeSampleIndex(13),mergeIndex=routeSampleIndex(16),entry=ROAD_SAMPLES[entryIndex],merge=ROAD_SAMPLES[mergeIndex],steps=180,samples=[];
  const controls={a:entry,b:{x:-215,y:10.5,z:-112},c:{x:42,y:19.5,z:-74},d:merge};
  for(let index=0;index<=steps;index++){
    const t=index/steps,ease=t*t*(3-2*t),width=18+22*(1-Math.sin(Math.PI*t)**.55),bank=.08*Math.sin(Math.PI*t),sample={x:bezier(controls.a.x,controls.b.x,controls.c.x,controls.d.x,t),y:bezier(controls.a.y,controls.b.y,controls.c.y,controls.d.y,t),z:bezier(controls.a.z,controls.b.z,controls.c.z,controls.d.z,t),width,bank,progress:ease};samples.push(sample);
  }
  for(let index=0;index<samples.length;index++){const before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1,rx=-dz/length,rz=dx/length,half=samples[index].width/2,cos=Math.cos(samples[index].bank),sin=Math.sin(samples[index].bank);samples[index].heading=Math.atan2(dz,dx);samples[index].left={x:samples[index].x+rx*half*cos,y:samples[index].y+half*sin,z:samples[index].z+rz*half*cos};samples[index].right={x:samples[index].x-rx*half*cos,y:samples[index].y-half*sin,z:samples[index].z-rz*half*cos}}
  return samples;
}
function roadMeshFromSamples(samples){const positions=[],indices=[],thickness=1.1;for(const sample of samples)positions.push(sample.left.x,sample.left.y,sample.left.z,sample.right.x,sample.right.y,sample.right.z,sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y-thickness,sample.right.z,sample.left.x,sample.left.y,sample.left.z,sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y,sample.right.z,sample.right.x,sample.right.y-thickness,sample.right.z);for(let index=0;index<samples.length-1;index++){const a=index*8,b=(index+1)*8;indices.push(a,b,a+1,b,b+1,a+1,a+2,a+3,b+2,b+2,a+3,b+3,a+4,a+5,b+4,b+4,a+5,b+5,a+6,b+6,a+7,b+6,b+7,a+7)}return{positions,indices,samples}}
const shortcutSamples=buildBranchSamples();
export const BRANCH_ROADS=Object.freeze(shortcutSamples.length?[Object.freeze({id:"inside-line",name:"ATTACK LINE",samples:Object.freeze(shortcutSamples.map(Object.freeze)),mesh:roadMeshFromSamples(shortcutSamples)})]:[]);
export const ROAD_PATHS=Object.freeze([ROAD_SAMPLES,...BRANCH_ROADS.map(branch=>branch.samples)]);
export const SPLIT_LAYOUT=Object.freeze(shortcutSamples.length?{entrySample:routeSampleIndex(13),mergeSample:routeSampleIndex(16),gapSide:"left",gapRadius:45,branchId:"inside-line"}:null);
export const INTENTIONAL_OBSTACLES=Object.freeze(shortcutSamples.length?[58,92,126].map((sampleIndex,index)=>{const sample=shortcutSamples[sampleIndex],frame=sampleFrame(shortcutSamples,sampleIndex),offset=(index%2?1:-1)*3.8;return Object.freeze({id:`inside-column-${index+1}`,branchId:"inside-line",sampleIndex,x:sample.x+frame.lateral.x*offset,y:sample.y+frame.up.y*3.2,z:sample.z+frame.lateral.z*offset,radius:1.15,height:6.4,rotation:basisQuaternion(frame.forward,frame.up,frame.lateral)})}):[]);
// Suspension rays and chassis contacts use only the authored driving surface.
// The rendered mesh keeps its underside and edge walls for visual thickness,
// but those vertical triangles are not ground and must not catch a tire ray at
// the shoulder of a banked curve.
export function buildRoadColliderMesh(samples=ROAD_SAMPLES){const positions=[],indices=[];for(let i=0;i<samples.length;i++){const sample=samples[i];positions.push(sample.left.x,sample.left.y,sample.left.z,sample.right.x,sample.right.y,sample.right.z);if(i){const a=(i-1)*2,b=i*2;indices.push(a,b,a+1,b,b+1,a+1)}}return{positions,indices,samples}}
function sampleFrame(samples,index){const sample=samples[index],before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),lateral=normalized({x:sample.left.x-sample.right.x,y:sample.left.y-sample.right.y,z:sample.left.z-sample.right.z});return{forward,lateral,up:normalized(cross(lateral,forward))}}
export function buildLaneRibbon(samples=ROAD_SAMPLES,halfWidth=.11,lift=.075){const positions=[],indices=[];for(let i=0;i<samples.length;i++){const sample=samples[i],{lateral,up}=sampleFrame(samples,i);for(const side of[-1,1])positions.push(sample.x+up.x*lift+lateral.x*halfWidth*side,sample.y+up.y*lift+lateral.y*halfWidth*side,sample.z+up.z*lift+lateral.z*halfWidth*side);if(i){const a=(i-1)*2,b=i*2;indices.push(a,b,a+1,b,b+1,a+1)}}return{positions,indices}}
export const RAIL_PROFILE=Object.freeze({height:1.05});
export function buildRailColliderMesh(samples=ROAD_SAMPLES,height=RAIL_PROFILE.height,gaps=[]){const positions=[],indices=[];for(const side of["left","right"]){const offset=positions.length/3;for(let i=0;i<samples.length;i++){const edge=samples[i][side],{up}=sampleFrame(samples,i);positions.push(edge.x+up.x*.02,edge.y+up.y*.02,edge.z+up.z*.02,edge.x+up.x*height,edge.y+up.y*height,edge.z+up.z*height);if(i&&!gaps.some(gap=>(gap.side===side||gap.side==="both")&&i>=gap.start&&i<=gap.end)){const a=offset+(i-1)*2,b=offset+i*2;if(side==="left")indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1)}}}return{positions,indices}}
function undersideHeightAt(samples,index,point){let nearest=samples[index],best=Infinity;for(let i=Math.max(0,index-8);i<=Math.min(samples.length-1,index+8);i++){const sample=samples[i],distance=(point.x-sample.x)**2+(point.z-sample.z)**2;if(distance<best){best=distance;nearest=sample}}const dx=nearest.left.x-nearest.right.x,dz=nearest.left.z-nearest.right.z,length2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((point.x-nearest.right.x)*dx+(point.z-nearest.right.z)*dz)/length2));return nearest.right.y+(nearest.left.y-nearest.right.y)*t-1.1}
export function buildSupportSpecs(samples=ROAD_SAMPLES,terrainTop=.35){const specs=[],start=Math.round(18*ROAD_STEPS_PER_SEGMENT/22),stride=Math.round(24*ROAD_STEPS_PER_SEGMENT/22),capHeight=.55,halfForward=2.5,halfLateral=1.1,clearance=.18;for(let index=start;index<samples.length-start/2;index+=stride){const sample=samples[index];if(sample.y<3.2)continue;const frame=sampleFrame(samples,index),rotation=basisQuaternion(frame.forward,frame.up,frame.lateral);for(const side of["left","right"]){const edge=sample[side],localCorners=Array.from({length:8},(_,corner)=>({forward:(corner&1?1:-1)*halfForward,up:(corner&2?1:-1)*capHeight/2,lateral:(corner&4?1:-1)*halfLateral}));let capY=edge.y-1.1-clearance-capHeight/2;const cornersAt=y=>localCorners.map(corner=>({x:edge.x+frame.forward.x*corner.forward+frame.up.x*corner.up+frame.lateral.x*corner.lateral,y:y+frame.forward.y*corner.forward+frame.up.y*corner.up+frame.lateral.y*corner.lateral,z:edge.z+frame.forward.z*corner.forward+frame.up.z*corner.up+frame.lateral.z*corner.lateral}));let capCorners=cornersAt(capY),excess=Math.max(...capCorners.map(corner=>corner.y-(undersideHeightAt(samples,index,corner)-clearance)));if(excess>0)capY-=excess;capCorners=cornersAt(capY);const cornerClearances=capCorners.map(corner=>undersideHeightAt(samples,index,corner)-corner.y),roadBottom=Math.min(...capCorners.map(corner=>undersideHeightAt(samples,index,corner))),capTop=Math.max(...capCorners.map(corner=>corner.y)),pierTop=capY-capHeight/2,height=Math.max(.35,pierTop-terrainTop);specs.push({index,side,x:edge.x,z:edge.z,heading:sample.heading,rotation,roadBottom,capTop,capHeight,capY,capCorners,cornerClearances,pierHeight:height,pierY:terrainTop+height/2})}}return specs}
export function nearestRoadSample({x,z}){let result=ROAD_SAMPLES[0],best=Infinity;for(const samples of ROAD_PATHS)for(const sample of samples){const distance=(x-sample.x)**2+(z-sample.z)**2;if(distance<best){best=distance;result=sample}}return result}
function normalized(vector){const length=Math.hypot(vector.x,vector.y,vector.z)||1;return{x:vector.x/length,y:vector.y/length,z:vector.z/length}}
function cross(a,b){return{x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x}}
function basisQuaternion(forward,up,lateral){
  const m00=forward.x,m01=up.x,m02=lateral.x,m10=forward.y,m11=up.y,m12=lateral.y,m20=forward.z,m21=up.z,m22=lateral.z,trace=m00+m11+m22;let x,y,z,w;
  if(trace>0){const s=Math.sqrt(trace+1)*2;w=.25*s;x=(m21-m12)/s;y=(m02-m20)/s;z=(m10-m01)/s}else if(m00>m11&&m00>m22){const s=Math.sqrt(1+m00-m11-m22)*2;w=(m21-m12)/s;x=.25*s;y=(m01+m10)/s;z=(m02+m20)/s}else if(m11>m22){const s=Math.sqrt(1+m11-m00-m22)*2;w=(m02-m20)/s;x=(m01+m10)/s;y=.25*s;z=(m12+m21)/s}else{const s=Math.sqrt(1+m22-m00-m11)*2;w=(m10-m01)/s;x=(m02+m20)/s;y=(m12+m21)/s;z=.25*s}return{x,y,z,w}
}
export function roadPoseNear(position,lift=1.7){
  const sample=nearestRoadSample(position),samples=ROAD_PATHS.find(path=>path.includes(sample))||ROAD_SAMPLES,index=samples.indexOf(sample),before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),lateral=normalized({x:sample.left.x-sample.right.x,y:sample.left.y-sample.right.y,z:sample.left.z-sample.right.z}),up=normalized(cross(lateral,forward)),orthogonalLateral=normalized(cross(forward,up));
  return{x:sample.x+up.x*lift,y:sample.y+up.y*lift,z:sample.z+up.z*lift,rotation:basisQuaternion(forward,up,orthogonalLateral)}
}
// Each checkpoint may only navigate along its own ordered route stage. This
// prevents a nearby later straight (especially the finish) from becoming a
// tempting but invalid cross-grass shortcut.
// Four meaningful sectors replace the inherited square-track doorway cadence:
// opening sweeper, crest/landing, elevated return, and the finish descent.
export const ROUTE_STAGE_RANGES=Object.freeze(ACTIVE_TRACK_DEFINITION.stageRanges.map(range=>Object.freeze([...range])));
export function routeStage(checkpoint){const range=ROUTE_STAGE_RANGES[Math.max(0,Math.min(checkpoint,ROUTE_STAGE_RANGES.length-1))],start=routeSampleIndex(range[0]),end=Math.min(ROAD_SAMPLES.length-1,routeSampleIndex(range[1])),points=ROAD_SAMPLES.slice(start,end+1).map(({x,y,z})=>({x,y,z})),gate=CHECKPOINTS[Math.max(0,Math.min(checkpoint,CHECKPOINTS.length-1))];return points.concat(gate?{x:gate.x,y:gate.y,z:gate.z}:[])}
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
function checkpointAt(routePoint,finish=false){
  const sampleIndex=Math.min(ROAD_SAMPLES.length-1,routeSampleIndex(routePoint)),sample=ROAD_SAMPLES[sampleIndex],{forward,lateral,up}=sampleFrame(ROAD_SAMPLES,sampleIndex);
  return Object.freeze({x:sample.x,y:sample.y,z:sample.z,width:sample.width,sampleIndex,forward,lateral,up,rotation:basisQuaternion(forward,up,lateral),finish});
}
export const CHECKPOINTS=Object.freeze(ACTIVE_TRACK_DEFINITION.checkpointPoints.map((point,index)=>checkpointAt(point,index===ACTIVE_TRACK_DEFINITION.checkpointPoints.length-1)));
export const RECOVERY_SPOTS=Object.freeze([roadPoseNear(ROUTE_PATH[0]),...CHECKPOINTS.slice(0,-1).map(checkpoint=>roadPoseNear(checkpoint))].map(Object.freeze));
export function recoveryForward(rotation){return{x:1-2*(rotation.y*rotation.y+rotation.z*rotation.z),z:2*(rotation.x*rotation.z-rotation.w*rotation.y)}}
export function isOnRoad({x,y,z}){let best=Infinity,width=0,height=0;for(const samples of ROAD_PATHS)for(const sample of samples){const distance=Math.hypot(x-sample.x,z-sample.z);if(distance<best){best=distance;width=sample.width;height=sample.y}}return best<=width*.58&&(!Number.isFinite(y)||Math.abs(y-height)<=5.5)}
export function isUnderRoad({x,y,z},clearance=2.6){if(!Number.isFinite(y))return false;const sample=nearestRoadSample({x,z});return Math.hypot(x-sample.x,z-sample.z)<=sample.width*.62&&y<sample.y-clearance}
export function advanceUnderRoadTime(previous,position,dt){return isUnderRoad(position)?Math.max(0,previous)+(Number.isFinite(dt)&&dt>0?dt:0):0}
export function checkpointAdvance(current,position){const zone=CHECKPOINTS[current];if(!zone)return current;const dx=position.x-zone.x,dy=(position.y??zone.y+1.5)-(zone.y+1.5),dz=position.z-zone.z,longitudinal=dx*zone.forward.x+dy*zone.forward.y+dz*zone.forward.z,lateral=dx*zone.lateral.x+dy*zone.lateral.y+dz*zone.lateral.z,vertical=dx*zone.up.x+dy*zone.up.y+dz*zone.up.z;return Math.abs(longitudinal)<=6&&Math.abs(lateral)<=zone.width/2+1&&Math.abs(vertical)<=5.5?current+1:current}
