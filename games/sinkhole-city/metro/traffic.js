const RADIUS=4,STRAIGHT=44,ARC=Math.PI*RADIUS/2;
export const TRAFFIC_LENGTH=4*(STRAIGHT+ARC);
export function trafficPose(distance){
 let d=((distance%TRAFFIC_LENGTH)+TRAFFIC_LENGTH)%TRAFFIC_LENGTH;
 const side=Math.floor(d/(STRAIGHT+ARC));d-=side*(STRAIGHT+ARC);
 const starts=[[-22,-24,1,0],[26,-20,0,1],[22,28,-1,0],[-26,24,0,-1]];
 if(d<STRAIGHT){const [x,z,vx,vz]=starts[side];return {x:x+vx*d,z:z+vz*d,vx,vz,yaw:Math.atan2(vx,vz)};}
 const centers=[[22,-20],[22,24],[-22,24],[-22,-20]],a=-Math.PI/2+side*Math.PI/2+(d-STRAIGHT)/RADIUS,[x,z]=centers[side],vx=-Math.sin(a),vz=Math.cos(a);
 return {x:x+Math.cos(a)*RADIUS,z:z+Math.sin(a)*RADIUS,vx,vz,yaw:Math.atan2(vx,vz)};
}
export function updateTraffic(objects,dt){
 for(const o of objects){
  const t=o.traffic;if(!t||t.city||t.stopped||o.body||o.phase!=='idle')continue;
  t.distance=(t.distance+t.speed*dt)%TRAFFIC_LENGTH;const p=trafficPose(t.distance);o.x=p.x;o.z=p.z;o.yaw=p.yaw;t.vx=p.vx*t.speed;t.vz=p.vz*t.speed;
 }
}
