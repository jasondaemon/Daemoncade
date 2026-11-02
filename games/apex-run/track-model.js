import {requestedTrackId} from "./track-catalog.js?v=0.5.0-alpha49-review3";
import {buildStuntLoop} from "./stunt-loop.js?v=0.5.0-alpha49-review3";

const ALPINE_ROUTE=Object.freeze([
  {x:-2,y:0,z:0,width:24,bank:0},{x:62,y:.5,z:0,width:24,bank:0},{x:96,y:2,z:-24,width:25,bank:-.08},{x:96,y:6,z:-72,width:25,bank:-.16},{x:78,y:9,z:-98,width:24,bank:-.1},{x:28,y:10,z:-108,width:23,bank:0},{x:-82,y:7,z:-103,width:24,bank:0},
  {x:-88,y:11,z:114,width:23,bank:.08},{x:-62,y:14,z:140,width:23,bank:.1},{x:126,y:11,z:140,width:24,bank:-.08},{x:150,y:7,z:114,width:25,bank:-.16},{x:150,y:2,z:8,width:23,bank:0},
]);
const SUMMIT_WIDTHS=[16,14,12,10,14,12,10,11,12,11,14,12,22,26,20,22,24,18,12,14,16];
const SUMMIT_ROUTE=Object.freeze([
  {x:-380,y:0,z:-280,bank:0},{x:-270,y:1,z:-330,bank:.08},{x:-120,y:5,z:-250,bank:.18},{x:40,y:9,z:-340,bank:-.18},{x:220,y:18,z:-300,bank:-.12},{x:360,y:28,z:-180,bank:-.2},{x:410,y:38,z:20,bank:.1},{x:280,y:30,z:240,bank:.18},{x:100,y:18,z:330,bank:.14},{x:-110,y:18,z:340,bank:-.12},{x:-300,y:30,z:260,bank:-.18},{x:-410,y:25,z:100,bank:-.12},{x:-400,y:14,z:-60,bank:.1},{x:-300,y:8,z:-160,bank:.18},{x:-150,y:12,z:-180,bank:.12},{x:0,y:20,z:-120,bank:-.1},{x:140,y:28,z:-20,bank:-.18},{x:220,y:22,z:90,bank:-.1},{x:340,y:14,z:110,bank:.04},{x:450,y:8,z:20,bank:.1},{x:500,y:2,z:-120,bank:0},
].map((point,index)=>Object.freeze({...point,width:SUMMIT_WIDTHS[index]})));
const TRACK_DEFINITIONS=Object.freeze({
  "alpine-sprint":Object.freeze({route:ALPINE_ROUTE,checkpointPoints:[2,6,9,11],stageRanges:[[0,2],[2,6],[6,9],[9,11]],humps:{5:14},jumpSegment:5}),
  "summit-circuit":Object.freeze({route:SUMMIT_ROUTE,checkpointPoints:[3,6,10,13,16,18,20],stageRanges:[[0,3],[3,6],[6,10],[10,13],[13,16],[16,18],[18,20]],humps:{10:12},jumpSegment:10}),
});
export const ACTIVE_TRACK_ID=requestedTrackId();
export const ACTIVE_TRACK_DEFINITION=TRACK_DEFINITIONS[ACTIVE_TRACK_ID]||TRACK_DEFINITIONS["alpine-sprint"];
const summit=ACTIVE_TRACK_ID==="summit-circuit";
export const VENUE=Object.freeze(summit?{centerX:45,centerZ:0,halfX:700,halfZ:450,stands:[{x:0,z:-418,rotation:0,length:130},{x:-508,z:30,rotation:Math.PI/2,length:108},{x:700,z:410,rotation:0,length:116}],basinRadius:680}:{centerX:0,centerZ:-20,halfX:220,halfZ:220,stands:[{x:10,z:-188,rotation:0,length:105},{x:-177,z:35,rotation:Math.PI/2,length:78},{x:212,z:62,rotation:-Math.PI/2,length:88}],basinRadius:245});
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
// Summit's reservoir jump is an honest missing section of deck.  All visual,
// collision, lane and rail builders consume this same interval; there is no
// invisible bridge.  Alpine remains byte-for-byte continuous.
export const SURFACE_GAPS=Object.freeze(summit?[Object.freeze({id:"reservoir-jump",start:routeSampleIndex(10,27),end:routeSampleIndex(10,38),side:"both"})]:[]);
const gapBetween=(index)=>SURFACE_GAPS.some(gap=>index>gap.start&&index<=gap.end);
const gapSample=(index)=>SURFACE_GAPS.some(gap=>index>=gap.start&&index<=gap.end);
const distance3=(a,b)=>Math.hypot(b.x-a.x,(b.y||0)-(a.y||0),b.z-a.z);
function tangentAt(index,key){
  const point=ROUTE_PATH[index],before=ROUTE_PATH[Math.max(0,index-1)],after=ROUTE_PATH[Math.min(ROUTE_PATH.length-1,index+1)];
  if(index===0)return(after[key]||0)-(point[key]||0);if(index===ROUTE_PATH.length-1)return(point[key]||0)-(before[key]||0);
  const length=Math.min(distance3(before,point),distance3(point,after))*.95,dx=after.x-before.x,dy=(after.y||0)-(before.y||0),dz=after.z-before.z,norm=Math.hypot(dx,dy,dz)||1;
  return({x:dx,y:dy,z:dz}[key]/norm)*length;
}
function hermite(a,b,ma,mb,t){const t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*a+(t3-2*t2+t)*ma+(-2*t3+3*t2)*b+(t3-t2)*mb}
const smooth5=t=>t**3*(10+t*(-15+6*t));
function sampleControl(index,t){
  // The crest uses a C2-continuous bump. Zero first and second derivatives at
  // both joins keep the visual ribbon and suspension collider from acquiring
  // the sharp pitch kink produced by the earlier Gaussian profile.
  const a=ROUTE_PATH[index],b=ROUTE_PATH[index+1],humpScale=ACTIVE_TRACK_DEFINITION.humps[index]||0,jumpProfile=t<=.08?0:t<=.27?260*(t-.08)**2:t<=.38?260*.19**2:t<=.62?260*.19**2*(1-.18*smooth5((t-.38)/.24)):t<.8?260*.19**2*.82*(1-smooth5((t-.62)/.18)):0,hump=summit&&index===10?jumpProfile:humpScale*Math.sin(Math.PI*t)**4;
  return{x:hermite(a.x,b.x,tangentAt(index,"x"),tangentAt(index+1,"x"),t),y:hermite(a.y,b.y,tangentAt(index,"y"),tangentAt(index+1,"y"),t)+hump+.55,z:hermite(a.z,b.z,tangentAt(index,"z"),tangentAt(index+1,"z"),t),width:a.width+(b.width-a.width)*t,bank:a.bank+(b.bank-a.bank)*t}
}
function framedConnector(start){
  // A broad authored exit replaces the old single Bezier that had to reverse
  // direction in too little space. That curve reached a five-metre radius,
  // folded its full-width ribbon, and produced the wall/wedge seen after the
  // loop. These anchors keep the full road above the basin and its tightest
  // centerline radius above 40 m.
  const anchors=[start,{x:560,y:1.8,z:325,width:15,bank:-.03},{x:650,y:7,z:325,width:22,bank:-.09},{x:710,y:13,z:230,width:28,bank:-.14},{x:720,y:10,z:60,width:34,bank:-.08},{x:650,y:3,z:-120,width:40,bank:0}],centers=[],tangents=anchors.map((point,index)=>index===0?{x:start.tangent.x*distance3(point,anchors[1]),y:start.tangent.y*distance3(point,anchors[1]),z:start.tangent.z*distance3(point,anchors[1])}:index===anchors.length-1?{x:point.x-anchors[index-1].x,y:point.y-anchors[index-1].y,z:point.z-anchors[index-1].z}:{x:(anchors[index+1].x-anchors[index-1].x)*.5,y:(anchors[index+1].y-anchors[index-1].y)*.5,z:(anchors[index+1].z-anchors[index-1].z)*.5});
  for(let segment=0;segment<anchors.length-1;segment++){const a=anchors[segment],b=anchors[segment+1],distance=distance3(a,b),steps=Math.ceil(distance/.5);for(let index=0;index<steps;index++){const t=index/steps,smooth=t*t*(3-2*t),ma=tangents[segment],mb=tangents[segment+1];centers.push({x:hermite(a.x,b.x,ma.x,mb.x,t),y:hermite(a.y,b.y,ma.y,mb.y,t),z:hermite(a.z,b.z,ma.z,mb.z,t),width:a.width+(b.width-a.width)*smooth,bank:a.bank+(b.bank-a.bank)*smooth,stunt:"connector"})}}centers.push({...anchors.at(-1),stunt:"connector"});
  for(let index=0;index<centers.length;index++){const sample=centers[index],before=centers[Math.max(0,index-1)],after=centers[Math.min(centers.length-1,index+1)],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),flatLateral=normalized({x:-forward.z,y:0,z:forward.x}),flatUp=normalized(cross(flatLateral,forward)),cos=Math.cos(sample.bank),sin=Math.sin(sample.bank),lateral={x:flatLateral.x*cos+flatUp.x*sin,y:flatLateral.y*cos+flatUp.y*sin,z:flatLateral.z*cos+flatUp.z*sin},up=normalized(cross(lateral,forward)),half=sample.width/2;sample.tangent=forward;sample.up=up;sample.left={x:sample.x+lateral.x*half,y:sample.y+lateral.y*half,z:sample.z+lateral.z*half};sample.right={x:sample.x-lateral.x*half,y:sample.y-lateral.y*half,z:sample.z-lateral.z*half};sample.heading=Math.atan2(forward.z,forward.x)}return centers
}
export function buildRoadMesh(stepsPerSegment=ROAD_STEPS_PER_SEGMENT){let samples=[],first=sampleControl(0,0),second=sampleControl(0,1/stepsPerSegment),dx=second.x-first.x,dz=second.z-first.z,length=Math.hypot(dx,dz)||1,fx=dx/length,fz=dz/length;for(let step=START_EXTENSION_SAMPLES;step>0;step--)samples.push({...first,x:first.x-fx*step*3,z:first.z-fz*step*3});for(let segment=0;segment<ROUTE_PATH.length-1;segment++)for(let step=0;step<stepsPerSegment;step++)samples.push(sampleControl(segment,step/stepsPerSegment));samples.push(sampleControl(ROUTE_PATH.length-2,1));for(let i=0;i<samples.length;i++){const before=samples[Math.max(0,i-1)],after=samples[Math.min(samples.length-1,i+1)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1,rx=-dz/length,rz=dx/length,half=samples[i].width/2,cos=Math.cos(samples[i].bank),sin=Math.sin(samples[i].bank);samples[i].heading=Math.atan2(dz,dx);samples[i].left={x:samples[i].x+rx*half*cos,y:samples[i].y+half*sin,z:samples[i].z+rz*half*cos};samples[i].right={x:samples[i].x-rx*half*cos,y:samples[i].y-half*sin,z:samples[i].z-rz*half*cos}}
  if(summit){const splice=routeSampleIndex(17),entry=samples[splice],before=samples[splice-1],after=samples[splice+1],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),lateral=normalized({x:entry.left.x-entry.right.x,y:entry.left.y-entry.right.y,z:entry.left.z-entry.right.z}),up=normalized(cross(lateral,forward)),loop=buildStuntLoop({height:28,width:9.5,entryWidth:entry.width,exitWidth:9.5,approach:220,exit:80,step:.5,separation:10,origin:entry,forward,up}),connector=framedConnector(loop.samples.at(-1));samples=[...samples.slice(0,splice+1),...loop.samples.slice(1).map(sample=>({...sample,right:{...sample.rightEdge},stunt:"loop"})),...connector.slice(1)];}
  // Keep the road top, underside, and edge-wall vertices separate. The old
  // shared vertices averaged normals across hard corners, making each curved
  // side quad reveal its diagonal as a sawtooth under chase-view lighting.
  const positions=[],indices=[],thickness=1.1;for(const sample of samples)positions.push(
    sample.left.x,sample.left.y,sample.left.z,sample.right.x,sample.right.y,sample.right.z,
    sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y-thickness,sample.right.z,
    sample.left.x,sample.left.y,sample.left.z,sample.left.x,sample.left.y-thickness,sample.left.z,
    sample.right.x,sample.right.y,sample.right.z,sample.right.x,sample.right.y-thickness,sample.right.z,
  );for(let i=0;i<samples.length-1;i++){if(gapBetween(i+1))continue;const a=i*8,b=(i+1)*8;indices.push(
    a,b,a+1,b,b+1,a+1,
    a+2,a+3,b+2,b+2,a+3,b+3,
    a+4,a+5,b+4,b+4,a+5,b+5,
    a+6,b+6,a+7,b+6,b+7,a+7,
  )}return{positions,indices,samples}}
export const ROAD_SAMPLES=Object.freeze(buildRoadMesh().samples.map(Object.freeze));
function buildBranchSamples(){
  if(!summit)return[];
  const entryIndex=routeSampleIndex(13),mergeIndex=routeSampleIndex(16),entry=ROAD_SAMPLES[entryIndex],merge=ROAD_SAMPLES[mergeIndex],steps=180,samples=[],mainDirection=index=>normalized({x:ROAD_SAMPLES[index+1].x-ROAD_SAMPLES[index-1].x,y:ROAD_SAMPLES[index+1].y-ROAD_SAMPLES[index-1].y,z:ROAD_SAMPLES[index+1].z-ROAD_SAMPLES[index-1].z});
  const anchors=[entry,{x:-220,y:11,z:-158},{x:30,y:18.5,z:-58},merge],directions=[mainDirection(entryIndex),normalized({x:250,y:7.5,z:100}),normalized({x:360,y:17.5,z:138}),mainDirection(mergeIndex)],magnitudes=[54,94,92,76],segmentSteps=steps/(anchors.length-1),bankStartSlope=(ROAD_SAMPLES[entryIndex+1].bank-entry.bank)*steps,bankEndSlope=(merge.bank-ROAD_SAMPLES[mergeIndex-1].bank)*steps;
  for(let index=0;index<=steps;index++){
    const overall=index/steps,segment=Math.min(anchors.length-2,Math.floor(index/segmentSteps)),local=(index-segment*segmentSteps)/segmentSteps,a=anchors[segment],b=anchors[segment+1],ma=directions[segment],mb=directions[segment+1],scaleA=magnitudes[segment],scaleB=magnitudes[segment+1],edgeWidth=entry.width+(merge.width-entry.width)*overall,width=edgeWidth-(edgeWidth-18)*Math.sin(Math.PI*overall)**2,bank=hermite(entry.bank,merge.bank,bankStartSlope,bankEndSlope,overall),sample={x:hermite(a.x,b.x,ma.x*scaleA,mb.x*scaleB,local),y:hermite(a.y,b.y,ma.y*scaleA,mb.y*scaleB,local),z:hermite(a.z,b.z,ma.z*scaleA,mb.z*scaleB,local),width,bank,progress:overall};samples.push(sample);
  }
  for(let index=0;index<samples.length;index++){const before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1,rx=-dz/length,rz=dx/length,half=samples[index].width/2,cos=Math.cos(samples[index].bank),sin=Math.sin(samples[index].bank);samples[index].heading=Math.atan2(dz,dx);samples[index].left={x:samples[index].x+rx*half*cos,y:samples[index].y+half*sin,z:samples[index].z+rz*half*cos};samples[index].right={x:samples[index].x-rx*half*cos,y:samples[index].y-half*sin,z:samples[index].z-rz*half*cos}}
  samples[0].left={...entry.left};samples[0].right={...entry.right};samples[0].heading=entry.heading;samples.at(-1).left={...merge.left};samples.at(-1).right={...merge.right};samples.at(-1).heading=merge.heading;return samples;
}
function roadMeshFromSamples(samples){const positions=[],indices=[],thickness=1.1;for(const sample of samples)positions.push(sample.left.x,sample.left.y,sample.left.z,sample.right.x,sample.right.y,sample.right.z,sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y-thickness,sample.right.z,sample.left.x,sample.left.y,sample.left.z,sample.left.x,sample.left.y-thickness,sample.left.z,sample.right.x,sample.right.y,sample.right.z,sample.right.x,sample.right.y-thickness,sample.right.z);for(let index=0;index<samples.length-1;index++){const a=index*8,b=(index+1)*8;indices.push(a,b,a+1,b,b+1,a+1,a+2,a+3,b+2,b+2,a+3,b+3,a+4,a+5,b+4,b+4,a+5,b+5,a+6,b+6,a+7,b+6,b+7,a+7)}return{positions,indices,samples}}
const shortcutSamples=buildBranchSamples();
function branchSurfaceSamples(samples){if(!samples.length)return[];const separated=samples.map(sample=>{let distance=Infinity,width=0;for(const main of ROAD_SAMPLES){const candidate=Math.hypot(sample.x-main.x,sample.z-main.z);if(candidate<distance){distance=candidate;width=main.width}}return distance>=(sample.width+width)/2-.5}),start=separated.indexOf(true),end=separated.lastIndexOf(true);return start<0?[]:samples.slice(start,end+1)}
const shortcutSurface=branchSurfaceSamples(shortcutSamples);
function closestMainLeft(point){let best={distance:Infinity,index:0,point:ROAD_SAMPLES[0].left};for(let index=0;index<ROAD_SAMPLES.length;index++){const candidate=ROAD_SAMPLES[index].left,distance=distance3(point,candidate);if(distance<best.distance)best={distance,index,point:candidate}}return best}
const entryJoin=shortcutSurface.length?closestMainLeft(shortcutSurface[0].right):null,exitJoin=shortcutSurface.length?closestMainLeft(shortcutSurface.at(-1).right):null;
if(shortcutSurface.length){shortcutSurface[0]={...shortcutSurface[0],right:{...entryJoin.point}};shortcutSurface[shortcutSurface.length-1]={...shortcutSurface.at(-1),right:{...exitJoin.point}}}
export const BRANCH_ROADS=Object.freeze(shortcutSamples.length?[Object.freeze({id:"inside-line",name:"ATTACK LINE",samples:Object.freeze(shortcutSamples.map(Object.freeze)),surfaceSamples:Object.freeze(shortcutSurface),mesh:roadMeshFromSamples(shortcutSurface)})]:[]);
function junctionRibbon(mainStart,mainEnd,outerStart,outerEnd,crossSection,reverse=false){const positions=[],indices=[],direction=Math.sign(mainEnd-mainStart)||1,count=Math.abs(mainEnd-mainStart),point=vertex=>({x:positions[vertex*3],y:positions[vertex*3+1],z:positions[vertex*3+2]}),pushTriangle=(ia,ib,ic)=>{const a=point(ia),b=point(ib),c=point(ic),ab={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},ac={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z},normalY=ab.z*ac.x-ab.x*ac.z;if(normalY>=0)indices.push(ia,ib,ic);else indices.push(ia,ic,ib)};for(let step=0;step<=count;step++){const index=mainStart+step*direction,t=count?step/count:1,smooth=t*t*(3-2*t),inner=ROAD_SAMPLES[index].left,outer={x:outerStart.x+(outerEnd.x-outerStart.x)*smooth,y:outerStart.y+(outerEnd.y-outerStart.y)*smooth,z:outerStart.z+(outerEnd.z-outerStart.z)*smooth};positions.push(outer.x,outer.y+.01,outer.z,inner.x,inner.y+.01,inner.z);if(step){const a=(step-1)*2,b=step*2,width=pair=>distance3(point(pair*2),point(pair*2+1)),previousWidth=width(step-1),currentWidth=width(step);if(previousWidth<.001)pushTriangle(a,b,b+1);else if(currentWidth<.001)pushTriangle(a,b,a+1);else{pushTriangle(a,b,a+1);pushTriangle(b,b+1,a+1)}}}return Object.freeze({positions:Object.freeze(positions),indices:Object.freeze(indices),apex:reverse?outerEnd:outerStart,crossSection,mainStart,mainEnd})}
export const BRANCH_JUNCTIONS=Object.freeze(shortcutSurface.length?[
  junctionRibbon(routeSampleIndex(13),entryJoin.index,ROAD_SAMPLES[routeSampleIndex(13)].left,shortcutSurface[0].left,shortcutSurface[0]),
  junctionRibbon(exitJoin.index,routeSampleIndex(16),shortcutSurface.at(-1).left,ROAD_SAMPLES[routeSampleIndex(16)].left,shortcutSurface.at(-1),true),
]:[]);
export const ROAD_PATHS=Object.freeze([ROAD_SAMPLES,...BRANCH_ROADS.map(branch=>branch.samples)]);
const ROAD_SURFACES=Object.freeze([ROAD_SAMPLES,...BRANCH_ROADS.map(branch=>branch.surfaceSamples)]);
export const SPLIT_LAYOUT=Object.freeze(shortcutSamples.length?{entrySample:routeSampleIndex(13),mergeSample:routeSampleIndex(16),gapSide:"left",gapRadius:45,branchId:"inside-line"}:null);
const obstacleAt=(samples,sampleIndex,offset,id,branchId=null,profile="column")=>{const sample=samples[sampleIndex],frame=sampleFrame(samples,sampleIndex),isIsland=profile==="island",height=isIsland?.8:5.2,radius=isIsland?.85:.9;return Object.freeze({id,branchId,profile,sampleIndex,x:sample.x+frame.lateral.x*offset,y:sample.y+frame.up.y*height/2,z:sample.z+frame.lateral.z*offset,radius,height,rotation:basisQuaternion(frame.forward,frame.up,frame.lateral)})};
export const INTENTIONAL_OBSTACLES=Object.freeze(shortcutSamples.length?[
  obstacleAt(ROAD_SAMPLES,routeSampleIndex(2,18),-3.1,"paddock-island-1",null,"island"),
  obstacleAt(ROAD_SAMPLES,routeSampleIndex(2,54),3.1,"paddock-island-2",null,"island"),
  ...[78,98,118].map((sampleIndex,index)=>obstacleAt(shortcutSamples,sampleIndex,(index%2?1:-1)*3.8,`inside-column-${index+1}`,"inside-line")),
]:[]);
// Suspension rays and chassis contacts use only the authored driving surface.
// The rendered mesh keeps its underside and edge walls for visual thickness,
// but those vertical triangles are not ground and must not catch a tire ray at
// the shoulder of a banked curve.
export function buildRoadColliderMesh(samples=ROAD_SAMPLES,lateralSegments=samples.some(sample=>sample.phase==="loop")?4:1){const positions=[],indices=[],stride=lateralSegments+1,isMain=samples===ROAD_SAMPLES;for(let i=0;i<samples.length;i++){const sample=samples[i];for(let lateral=0;lateral<=lateralSegments;lateral++){const t=lateral/lateralSegments;positions.push(sample.left.x+(sample.right.x-sample.left.x)*t,sample.left.y+(sample.right.y-sample.left.y)*t,sample.left.z+(sample.right.z-sample.left.z)*t)}if(i&&!(isMain&&gapBetween(i)))for(let lateral=0;lateral<lateralSegments;lateral++){const a=(i-1)*stride+lateral,b=i*stride+lateral;indices.push(a,b,a+1,b,b+1,a+1)}}return{positions,indices,samples}}
function sampleFrame(samples,index){const sample=samples[index],before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),lateral=normalized({x:sample.left.x-sample.right.x,y:sample.left.y-sample.right.y,z:sample.left.z-sample.right.z});return{forward,lateral,up:normalized(cross(lateral,forward))}}
export function buildLaneRibbon(samples=ROAD_SAMPLES,halfWidth=.11,lift=.075){const positions=[],indices=[],isMain=samples===ROAD_SAMPLES;for(let i=0;i<samples.length;i++){const sample=samples[i],{lateral,up}=sampleFrame(samples,i);for(const side of[-1,1])positions.push(sample.x+up.x*lift+lateral.x*halfWidth*side,sample.y+up.y*lift+lateral.y*halfWidth*side,sample.z+up.z*lift+lateral.z*halfWidth*side);if(i&&!(isMain&&gapBetween(i))){const a=(i-1)*2,b=i*2;indices.push(a,b,a+1,b,b+1,a+1)}}return{positions,indices}}
export const RAIL_PROFILE=Object.freeze({height:1.05});
export const STUNT_RAIL_GAPS=SURFACE_GAPS;
export function buildRailColliderMesh(samples=ROAD_SAMPLES,height=RAIL_PROFILE.height,gaps=[]){const positions=[],indices=[];for(const side of["left","right"]){const offset=positions.length/3;for(let i=0;i<samples.length;i++){const edge=samples[i][side],{up}=sampleFrame(samples,i);positions.push(edge.x+up.x*.02,edge.y+up.y*.02,edge.z+up.z*.02,edge.x+up.x*height,edge.y+up.y*height,edge.z+up.z*height);if(i&&!gaps.some(gap=>(gap.side===side||gap.side==="both")&&i>=gap.start&&i<=gap.end)){const a=offset+(i-1)*2,b=offset+i*2;if(side==="left")indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1)}}}return{positions,indices}}
function undersideHeightAt(samples,index,point){let nearest=samples[index],best=Infinity;for(let i=Math.max(0,index-8);i<=Math.min(samples.length-1,index+8);i++){const sample=samples[i],distance=(point.x-sample.x)**2+(point.z-sample.z)**2;if(distance<best){best=distance;nearest=sample}}const dx=nearest.left.x-nearest.right.x,dz=nearest.left.z-nearest.right.z,length2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((point.x-nearest.right.x)*dx+(point.z-nearest.right.z)*dz)/length2));return nearest.right.y+(nearest.left.y-nearest.right.y)*t-1.1}
export function buildSupportSpecs(samples=ROAD_SAMPLES,terrainTop=.35){const specs=[],start=Math.round(18*ROAD_STEPS_PER_SEGMENT/22),stride=Math.round(24*ROAD_STEPS_PER_SEGMENT/22),capHeight=.55,halfForward=2.5,halfLateral=1.1,clearance=.18;for(let index=start;index<samples.length-start/2;index+=stride){const sample=samples[index];if(sample.y<3.2||sample.stunt==="loop")continue;const frame=sampleFrame(samples,index),rotation=basisQuaternion(frame.forward,frame.up,frame.lateral);for(const side of["left","right"]){const edge=sample[side],localCorners=Array.from({length:8},(_,corner)=>({forward:(corner&1?1:-1)*halfForward,up:(corner&2?1:-1)*capHeight/2,lateral:(corner&4?1:-1)*halfLateral}));let capY=edge.y-1.1-clearance-capHeight/2;const cornersAt=y=>localCorners.map(corner=>({x:edge.x+frame.forward.x*corner.forward+frame.up.x*corner.up+frame.lateral.x*corner.lateral,y:y+frame.forward.y*corner.forward+frame.up.y*corner.up+frame.lateral.y*corner.lateral,z:edge.z+frame.forward.z*corner.forward+frame.up.z*corner.up+frame.lateral.z*corner.lateral}));let capCorners=cornersAt(capY),excess=Math.max(...capCorners.map(corner=>corner.y-(undersideHeightAt(samples,index,corner)-clearance)));if(excess>0)capY-=excess;capCorners=cornersAt(capY);const cornerClearances=capCorners.map(corner=>undersideHeightAt(samples,index,corner)-corner.y),roadBottom=Math.min(...capCorners.map(corner=>undersideHeightAt(samples,index,corner))),capTop=Math.max(...capCorners.map(corner=>corner.y)),pierTop=capY-capHeight/2,height=Math.max(.35,pierTop-terrainTop);specs.push({index,side,x:edge.x,z:edge.z,heading:sample.heading,rotation,roadBottom,capTop,capHeight,capY,capCorners,cornerClearances,pierHeight:height,pierY:terrainTop+height/2})}}return specs}
export function nearestRoadSample({x,y,z}){let result=ROAD_SAMPLES[0],best=Infinity;for(const samples of ROAD_SURFACES)for(const sample of samples){const distance=(x-sample.x)**2+(z-sample.z)**2+(Number.isFinite(y)?(y-sample.y)**2:0);if(distance<best){best=distance;result=sample}}return result}
function normalized(vector){const length=Math.hypot(vector.x,vector.y,vector.z)||1;return{x:vector.x/length,y:vector.y/length,z:vector.z/length}}
function cross(a,b){return{x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x}}
function basisQuaternion(forward,up,lateral){
  const m00=forward.x,m01=up.x,m02=lateral.x,m10=forward.y,m11=up.y,m12=lateral.y,m20=forward.z,m21=up.z,m22=lateral.z,trace=m00+m11+m22;let x,y,z,w;
  if(trace>0){const s=Math.sqrt(trace+1)*2;w=.25*s;x=(m21-m12)/s;y=(m02-m20)/s;z=(m10-m01)/s}else if(m00>m11&&m00>m22){const s=Math.sqrt(1+m00-m11-m22)*2;w=(m21-m12)/s;x=.25*s;y=(m01+m10)/s;z=(m02+m20)/s}else if(m11>m22){const s=Math.sqrt(1+m11-m00-m22)*2;w=(m02-m20)/s;x=(m01+m10)/s;y=.25*s;z=(m12+m21)/s}else{const s=Math.sqrt(1+m22-m00-m11)*2;w=(m10-m01)/s;x=(m02+m20)/s;y=(m12+m21)/s;z=.25*s}return{x,y,z,w}
}
export function roadPoseNear(position,lift=1.7){
  const sample=nearestRoadSample(position),samples=ROAD_SURFACES.find(path=>path.includes(sample))||ROAD_SAMPLES,index=samples.indexOf(sample),before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z}),lateral=normalized({x:sample.left.x-sample.right.x,y:sample.left.y-sample.right.y,z:sample.left.z-sample.right.z}),up=normalized(cross(lateral,forward)),orthogonalLateral=normalized(cross(forward,up));
  return{x:sample.x+up.x*lift,y:sample.y+up.y*lift,z:sample.z+up.z*lift,rotation:basisQuaternion(forward,up,orthogonalLateral)}
}
// Each checkpoint may only navigate along its own ordered route stage. This
// prevents a nearby later straight (especially the finish) from becoming a
// tempting but invalid cross-grass shortcut.
// Four meaningful sectors replace the inherited square-track doorway cadence:
// opening sweeper, crest/landing, elevated return, and the finish descent.
export const ROUTE_STAGE_RANGES=Object.freeze(ACTIVE_TRACK_DEFINITION.stageRanges.map(range=>Object.freeze([...range])));
const routePointSampleIndex=point=>summit&&point===ROUTE_PATH.length-1?ROAD_SAMPLES.length-1:Math.min(ROAD_SAMPLES.length-1,routeSampleIndex(point));
export function routeStage(checkpoint){const range=ROUTE_STAGE_RANGES[Math.max(0,Math.min(checkpoint,ROUTE_STAGE_RANGES.length-1))],start=routePointSampleIndex(range[0]),end=routePointSampleIndex(range[1]),points=ROAD_SAMPLES.slice(start,end+1).map(({x,y,z})=>({x,y,z})),gate=CHECKPOINTS[Math.max(0,Math.min(checkpoint,CHECKPOINTS.length-1))];return points.concat(gate?{x:gate.x,y:gate.y,z:gate.z}:[])}
function stageGeometry(checkpoint){const points=routeStage(checkpoint),segments=[];let total=0;for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=(b.y||0)-(a.y||0),dz=b.z-a.z,length=Math.hypot(dx,dy,dz);if(length<.001)continue;segments.push({a,b,dx,dy,dz,length,start:total});total+=length}return{segments,total}}
function pointAt(geometry,along){const wanted=Math.max(0,Math.min(geometry.total,along));for(const segment of geometry.segments)if(wanted<=segment.start+segment.length){const t=(wanted-segment.start)/segment.length;return{x:segment.a.x+segment.dx*t,y:(segment.a.y||0)+segment.dy*t,z:segment.a.z+segment.dz*t}}const last=geometry.segments.at(-1)?.b||{x:0,y:0,z:0};return{x:last.x,y:last.y||0,z:last.z}}
export function routeTarget(checkpoint,position,lookahead=28,minimumProgress=0){
  const geometry=stageGeometry(checkpoint),floor=Math.max(0,minimumProgress-5);let best={distance:Infinity,along:Math.max(0,minimumProgress)};
  for(const segment of geometry.segments){const t=Math.max(0,Math.min(1,((position.x-segment.a.x)*segment.dx+((position.y||0)-(segment.a.y||0))*segment.dy+(position.z-segment.a.z)*segment.dz)/(segment.length*segment.length))),along=segment.start+segment.length*t;if(along<floor)continue;const projected=pointAt(geometry,along),distance=Math.hypot(position.x-projected.x,(position.y||0)-(projected.y||0),position.z-projected.z);if(distance<best.distance)best={distance,along}}
  // Progress is monotonic within the checkpoint stage. The small projection
  // floor tolerates corner cutting while hysteresis prevents a passed helper
  // point from ever commanding a U-turn.
  const progress=Math.max(minimumProgress,best.along),distances=[lookahead*.45,lookahead,lookahead*1.55],breadcrumbs=distances.map(distance=>pointAt(geometry,progress+distance)),target=breadcrumbs[1];return{...target,stage:checkpoint,progress,total:geometry.total,breadcrumbs}
}
export function routeGuides(spacing=32){const guides=[];let carry=spacing*.5;for(let i=1;i<ROAD_SAMPLES.length;i++){const a=ROAD_SAMPLES[i-1],b=ROAD_SAMPLES[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.hypot(dx,dy,dz);while(carry<=length){const t=carry/length;guides.push({x:a.x+dx*t,y:a.y+dy*t,z:a.z+dz*t,heading:Math.atan2(dz,dx),segment:i-1});carry+=spacing}carry-=length}return guides}
function checkpointAt(routePoint,finish=false){
  const sampleIndex=finish?ROAD_SAMPLES.length-1:Math.min(ROAD_SAMPLES.length-1,routeSampleIndex(routePoint)),sample=ROAD_SAMPLES[sampleIndex],{forward,lateral,up}=sampleFrame(ROAD_SAMPLES,sampleIndex);
  return Object.freeze({x:sample.x,y:sample.y,z:sample.z,width:sample.width,sampleIndex,forward,lateral,up,rotation:basisQuaternion(forward,up,lateral),finish});
}
export const CHECKPOINTS=Object.freeze(ACTIVE_TRACK_DEFINITION.checkpointPoints.map((point,index)=>checkpointAt(point,index===ACTIVE_TRACK_DEFINITION.checkpointPoints.length-1)));
export const RECOVERY_SPOTS=Object.freeze([roadPoseNear(ROUTE_PATH[0]),...CHECKPOINTS.slice(0,-1).map(checkpoint=>roadPoseNear(checkpoint))].map(Object.freeze));
export function recoveryForward(rotation){return{x:1-2*(rotation.y*rotation.y+rotation.z*rotation.z),z:2*(rotation.x*rotation.z-rotation.w*rotation.y)}}
export function isOnRoad({x,y,z}){let best=Infinity,width=0,mainIndex=-1;for(const samples of ROAD_SURFACES)for(let index=0;index<samples.length;index++){const sample=samples[index],distance=Math.hypot(x-sample.x,z-sample.z,Number.isFinite(y)?y-sample.y:0);if(distance<best){best=distance;width=sample.width;mainIndex=samples===ROAD_SAMPLES?index:-1}}return best<=width*.58&&(mainIndex<0||!gapSample(mainIndex))}
export function isUnderRoad({x,y,z},clearance=2.6){if(!Number.isFinite(y))return false;const sample=nearestRoadSample({x,y,z});return Math.hypot(x-sample.x,z-sample.z)<=sample.width*.62&&y<sample.y-clearance}
export function advanceUnderRoadTime(previous,position,dt){return isUnderRoad(position)?Math.max(0,previous)+(Number.isFinite(dt)&&dt>0?dt:0):0}
export function checkpointAdvance(current,position){const zone=CHECKPOINTS[current];if(!zone)return current;const dx=position.x-zone.x,dy=(position.y??zone.y+1.5)-(zone.y+1.5),dz=position.z-zone.z,longitudinal=dx*zone.forward.x+dy*zone.forward.y+dz*zone.forward.z,lateral=dx*zone.lateral.x+dy*zone.lateral.y+dz*zone.lateral.z,vertical=dx*zone.up.x+dy*zone.up.y+dz*zone.up.z;return Math.abs(longitudinal)<=6&&Math.abs(lateral)<=zone.width/2+1&&Math.abs(vertical)<=5.5?current+1:current}
