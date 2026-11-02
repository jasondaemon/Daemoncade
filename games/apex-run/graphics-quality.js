export const QUALITY_PROFILES=Object.freeze({
  high:Object.freeze({id:"high",pixelRatio:1.7,shadowMap:2048,shadowExtent:260,railStride:2,railRadial:7,sceneryRatio:1}),
  medium:Object.freeze({id:"medium",pixelRatio:1.35,shadowMap:1024,shadowExtent:200,railStride:3,railRadial:6,sceneryRatio:.72}),
  low:Object.freeze({id:"low",pixelRatio:1,shadowMap:512,shadowExtent:140,railStride:5,railRadial:5,sceneryRatio:.45}),
});

export function resolveQuality(value){return QUALITY_PROFILES[value]||QUALITY_PROFILES.high}

const normalize=vector=>{const length=Math.hypot(vector.x,vector.y,vector.z)||1;return{x:vector.x/length,y:vector.y/length,z:vector.z/length}}
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;

// Keep the sun direction fixed while snapping its moving orthographic volume
// in light space. This prevents sub-texel camera motion from crawling across
// the car, without tying lighting direction to the vehicle or track heading.
export function shadowPlacement(position,profile,offset={x:-60,y:110,z:35}){
  const forward=normalize({x:-offset.x,y:-offset.y,z:-offset.z}),right=normalize(cross(forward,{x:0,y:1,z:0})),up=normalize(cross(right,forward)),texel=profile.shadowExtent*2/profile.shadowMap;
  const rightDistance=Math.round(dot(position,right)/texel)*texel,upDistance=Math.round(dot(position,up)/texel)*texel,forwardDistance=dot(position,forward),target={
    x:right.x*rightDistance+up.x*upDistance+forward.x*forwardDistance,
    y:right.y*rightDistance+up.y*upDistance+forward.y*forwardDistance,
    z:right.z*rightDistance+up.z*upDistance+forward.z*forwardDistance,
  };
  return{target,light:{x:target.x+offset.x,y:target.y+offset.y,z:target.z+offset.z},texel,lightSpace:{right:rightDistance,up:upDistance},basis:{right,up,forward}};
}
