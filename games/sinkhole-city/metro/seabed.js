import {REEF_HABITATS} from './habitats.js?v=ocean10';
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function seabedColor(x,z){
 const ripple=Math.sin(x*.55+Math.sin(z*.18)*2)*.012+Math.sin(z*.31-x*.08)*.008;
 let color=[.64+ripple,.75+ripple,.65+ripple];
 for(const [i,c]of REEF_HABITATS.entries()){
  const a=i*1.8,dx=x-c.x,dz=z-c.z,u=dx*Math.cos(a)-dz*Math.sin(a),v=dx*Math.sin(a)+dz*Math.cos(a),angle=Math.atan2(v,u),edge=c.radius*(1+.12*Math.sin(angle*3+i)+.09*Math.cos(angle*5-i));
  const d=Math.hypot(u,v/ .77)/edge,t=(1-smooth(.35,1.55,d))*.76;
  color=mix(color,i%2?[.39,.61,.55]:[.48,.66,.54],t);
 }
 const channel=Math.abs(x-(Math.sin(z*.065)*8+z*.17));color=mix(color,[.43,.65,.63],(1-smooth(2,7,channel))*.3);
 const wreck=Math.hypot(x/8,(z+17)/5),hollow=mix(color,[.76,.78,.63],(1-smooth(.25,1.35,wreck))*.7);
 return mix(hollow,[155/255,186/255,173/255],smooth(62,72,Math.max(Math.abs(x),Math.abs(z))));
}
export function seabedHeight(x,z){const edge=Math.max(Math.abs(x),Math.abs(z)),fade=smooth(64,72,edge);return .012+smooth(54,63,edge)*(1-fade)*(1.2+.6*Math.sin(x*.23)*Math.cos(z*.19))-.032*fade;}
