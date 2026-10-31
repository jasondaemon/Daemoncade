import {trafficPose,TRAFFIC_LENGTH} from './traffic.js?v=ocean10';
import {populateDeep} from './deep-layout.js?v=layouts43';
import {populateCamp} from './habitats.js?v=camp-life32';
import {populateAlien} from './alien.js?v=layouts43';
import {populateOrbit} from './orbit.js?v=layouts43';
import {populateCity} from './city-layout.js?v=parks42';
import {populateLife} from './city-life.js?v=streets28';
export function populateWorld(world,add,{traffic=true,seed=0}={}){
 if(world==='orbit'){populateOrbit(add,seed);return;}
 if(world==='alien'){populateAlien(add,seed);return;}
 if(world==='deep'){populateDeep(add,seed);return;}
 if(world==='basecamp'){populateCamp(add);return;}
 if(traffic){populateCity(add);populateLife(add);return;}
 for(const x of[-26,0,26])for(let z=-43;z<=44;z+=5){add('cone',x-4.9,z);add(Math.round(z)%3?'bin':'hydrant',x+5,z+1.3);}
 for(const z of[-24,2,28])for(let x=-43;x<=44;x+=10){if([-26,0,26].some(road=>Math.abs(x-road)<8))continue;add('bench',x,z+5.4,Math.PI/2);add('lamp',x,z-5.2);}
 for(const [ix,x]of[-38,-13,13,38].entries())for(const [iz,z]of[-37,-11,15,41].entries()){
  if(x===-38&&z===41)continue;
  if(traffic){
   for(const [slot,[dx,dz]]of[[-3.8,-3.8],[3.8,-3.8],[0,3.8]].entries()){
    const b=add(slot===0&&x>0&&z<0?'warehouse':'building',x+dx,z+dz);if(b.type==='building')b.art=(ix*3+iz+slot)%6;
   }
  }else{const b=add(x>0&&z<0?'warehouse':'building',x,z);b.variant=x<0?(z<0?'apartments':'shops'):'market';}
  add('tree',x+5,z+6);add('tree',x-5,z-6);
 }
 for(const x of[-26,0,26])for(const z of[-37,-11,15,41])add(z===41?'van':'car',x+(z<0?-1.8:1.8),z,z<0?Math.PI:0);
 add('landmark',-38,41);
 for(const x of[9,17,34,42])for(const z of[21,47])add('crate',x,z);
 for(const x of[7,19,32,44])add('cart',x,8,Math.PI/2);
 if(traffic)for(let i=0;i<4;i++){
  const distance=i*TRAFFIC_LENGTH/4,p=trafficPose(distance),car=add('car',p.x,p.z,p.yaw);
  car.traffic={distance,speed:3.2,vx:p.vx*3.2,vz:p.vz*3.2,stopped:false};
 }
}
