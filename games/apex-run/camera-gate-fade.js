const clamp01=value=>Math.max(0,Math.min(1,value));

function boxDistance(point,center,half){
  const dx=Math.max(Math.abs(point.x-center.x)-half.x,0);
  const dy=Math.max(Math.abs(point.y-center.y)-half.y,0);
  const dz=Math.max(Math.abs(point.z-center.z)-half.z,0);
  return Math.hypot(dx,dy,dz);
}

export function gateStructureDistance(point,{halfWidth,height=5,thickness=.38}){
  const radius=thickness/2;
  const top=boxDistance(point,{x:0,y:height,z:0},{x:radius,y:radius,z:halfWidth+radius});
  const left=boxDistance(point,{x:0,y:height/2,z:-halfWidth},{x:radius,y:height/2,z:radius});
  const right=boxDistance(point,{x:0,y:height/2,z:halfWidth},{x:radius,y:height/2,z:radius});
  return Math.min(top,left,right);
}

export function gateCameraOpacity(distance,{hiddenUntil=2.8,fullyVisibleAt=7}={}){
  const t=clamp01((distance-hiddenUntil)/(fullyVisibleAt-hiddenUntil));
  return t*t*(3-2*t);
}
