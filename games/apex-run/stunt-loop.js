const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const smooth=value=>value*value*(3-2*value);
const smooth5=value=>value**3*(10+value*(-15+6*value));
const normalized=vector=>{const length=Math.hypot(vector.x,vector.y,vector.z)||1;return{x:vector.x/length,y:vector.y/length,z:vector.z/length}};
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;

// One welded teardrop ribbon. Height is the total rise, not a radius. The
// return line moves monotonically across the road normal so entry and exit do
// not become overlapping collision sheets at the bottom junction.
export function buildStuntLoop({height=28,width=14,approach=70,exit=80,step=.5,separation=10,origin={x:0,y:0,z:0},forward={x:1,y:0,z:0},up={x:0,y:1,z:0}}={}){
  const worldForward=normalized(forward),worldUp=normalized(up),worldRight=normalized(cross(worldForward,worldUp)),bottomRadius=height*.72,crownRadius=height*.34,local=[];
  for(let x=0;x<approach;x+=step)local.push({x,y:0,z:0,phase:"approach"});
  const loopStart=local.length,angles=[];let theta=0;
  while(theta<Math.PI*2-1e-6){const crownFactor=(1-Math.cos(theta))/2,radius=bottomRadius+(crownRadius-bottomRadius)*smooth(crownFactor);angles.push({theta,radius});theta+=step/radius}
  angles.push({theta:Math.PI*2,radius:bottomRadius});
  let x=approach,y=0;
  for(let index=0;index<angles.length;index++){
    const angle=angles[index].theta,u=angle/(Math.PI*2);local.push({x,y,z:separation*smooth5(u),phase:"loop",angle,u});
    if(index<angles.length-1){const next=angles[index+1].theta,mid=(angle+next)/2,crownFactor=(1-Math.cos(mid))/2,radius=bottomRadius+(crownRadius-bottomRadius)*smooth(crownFactor),distance=radius*(next-angle);x+=Math.cos(mid)*distance;y+=Math.sin(mid)*distance}
  }
  const loopEnd=local.length-1,loopExit=local.at(-1);for(let distance=step;distance<=exit;distance+=step)local.push({x:loopExit.x+distance,y:loopExit.y,z:loopExit.z,phase:"exit"});
  let distance=0;
  for(let index=0;index<local.length;index++){
    const point=local[index],before=local[Math.max(0,index-1)],after=local[Math.min(local.length-1,index+1)],tangent=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z});if(index)distance+=Math.hypot(point.x-local[index-1].x,point.y-local[index-1].y,point.z-local[index-1].z);point.distance=distance;point.tangent=tangent;
  }
  const samples=local.map((point,index)=>{
    const before=local[Math.max(0,index-1)].tangent,after=local[Math.min(local.length-1,index+1)].tangent,curvature={x:after.x-before.x,y:after.y-before.y,z:after.z-before.z},curvatureLength=Math.hypot(curvature.x,curvature.y,curvature.z),planar=Math.hypot(point.tangent.x,point.tangent.y),localUp=point.phase==="loop"&&curvatureLength>1e-6?normalized(curvature):{x:-point.tangent.y/planar,y:point.tangent.x/planar,z:0},localRight=normalized(cross(point.tangent,localUp)),map=vector=>({x:worldForward.x*vector.x+worldUp.x*vector.y+worldRight.x*vector.z,y:worldForward.y*vector.x+worldUp.y*vector.y+worldRight.y*vector.z,z:worldForward.z*vector.x+worldUp.z*vector.y+worldRight.z*vector.z}),center=map(point),tangent=normalized(map(point.tangent)),roadUp=normalized(map(localUp)),right=normalized(map(localRight)),half=width/2;
    center.x+=origin.x;center.y+=origin.y;center.z+=origin.z;
    return Object.freeze({...center,phase:point.phase,angle:point.angle,distance:point.distance,width,bank:0,tangent,up:roadUp,right,left:{x:center.x-right.x*half,y:center.y-right.y*half,z:center.z-right.z*half},rightEdge:{x:center.x+right.x*half,y:center.y+right.y*half,z:center.z+right.z*half}});
  });
  // Match the road model's left/right cross-section names.
  const compatible=samples.map(sample=>Object.freeze({...sample,right:sample.rightEdge}));
  return Object.freeze({samples:Object.freeze(compatible),loopStart,loopEnd,width,height,separation,step});
}

export function buildStuntRibbon(model){const positions=[],indices=[];for(const point of model.samples)positions.push(point.left.x,point.left.y,point.left.z,point.right.x,point.right.y,point.right.z);for(let index=0;index<model.samples.length-1;index++){const a=index*2,b=a+1,c=a+2,d=a+3;indices.push(a,b,c,b,d,c)}return{positions:new Float32Array(positions),indices:new Uint32Array(indices)}}

export function auditStuntLoop(model,{clearance=9.75}={}){let maxTangentStep=0,maxNormalStep=0,minNonAdjacent=Infinity;const samples=model.samples;for(let index=1;index<samples.length;index++){maxTangentStep=Math.max(maxTangentStep,Math.acos(clamp(dot(samples[index-1].tangent,samples[index].tangent),-1,1)));maxNormalStep=Math.max(maxNormalStep,Math.acos(clamp(dot(samples[index-1].up,samples[index].up),-1,1)))}for(let first=0;first<samples.length;first++)for(let second=first+Math.ceil(30/model.step);second<samples.length;second++)minNonAdjacent=Math.min(minNonAdjacent,Math.hypot(samples[first].x-samples[second].x,samples[first].y-samples[second].y,samples[first].z-samples[second].z));const entry=samples[model.loopStart],exit=samples[model.loopEnd],entryExit=Math.hypot(entry.x-exit.x,entry.y-exit.y,entry.z-exit.z);return{maxTangentStepDeg:maxTangentStep*180/Math.PI,maxNormalStepDeg:maxNormalStep*180/Math.PI,minNonAdjacent,entryExit,clear:minNonAdjacent>clearance&&entryExit>clearance}}
