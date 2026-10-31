// Authored geography with repeatable, irregular dressing; no Cartesian prop rows.
export function seeded(seed){return ()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
export const CAMP_SITES=[[-29,31],[-7,24],[22,30],[34,7],[13,-8],[-16,-6],[-33,-24],[-3,-29],[25,-30]].map(([x,z])=>({x,z}));
export const CAMP_POND={x:-39,z:6,rx:9,rz:7};
export function campDry(x,z,margin=0){const p=CAMP_POND;return Math.hypot((x-p.x)/(p.rx+margin),(z-p.z)/(p.rz+margin))>1;}
export const CAMP_LAYOUTS=[
 {kind:'backpacking',tents:3,rv:0,tables:0,logs:5,coolers:3,pines:2,angle:.2},
 {kind:'touring',tents:1,rv:1,tables:2,logs:2,coolers:6,pines:1,angle:1.1},
 {kind:'picnic grove',tents:2,rv:0,tables:2,logs:3,coolers:4,pines:3,angle:2.3},
 {kind:'caravan meadow',tents:0,rv:2,tables:1,logs:2,coolers:7,pines:1,angle:.5},
 {kind:'group camp',tents:4,rv:0,tables:0,logs:6,coolers:2,pines:2,angle:1.8},
 {kind:'forest pitch',tents:1,rv:1,tables:1,logs:3,coolers:4,pines:1,angle:3.1},
 {kind:'ridge camp',tents:3,rv:0,tables:0,logs:6,coolers:2,pines:3,angle:4},
 {kind:'woodland clearing',tents:2,rv:0,tables:1,logs:5,coolers:3,pines:3,angle:2.7},
 {kind:'lodge approach',tents:2,rv:0,tables:2,logs:4,coolers:5,pines:2,angle:5.2}
];
export const CAMP_TRAILS=[
 [[-30,38],[-29,31],[-7,24],[22,30],[34,7],[25,-30],[3,-40]],
 [[-29,31],[-16,-6],[-33,-24],[-3,-29],[3,-40]],
 [[-16,-6],[13,-8],[34,7]]
].map(path=>path.map(([x,z])=>({x,z})));
export const REEF_HABITATS=[[-32,30],[-8,34],[24,24],[33,-4],[9,-18],[-19,-14],[-30,-35],[23,-34]].map(([x,z],i)=>({x,z,radius:7+i%3*1.5}));
export function populateCamp(add){
 const rand=seeded(714),occupied=[];
 const place=(type,c,r,angle,site)=>{const o=add(type,c.x+Math.cos(angle)*r,c.z+Math.sin(angle)*r,angle+Math.PI/2);o.site=site;occupied.push(o);return o;};
 for(const [i,c]of CAMP_SITES.entries()){
  const l=CAMP_LAYOUTS[i],a=l.angle;
  place('firepit',c,0,a,i);
  for(let j=0;j<l.tents;j++)place('tent',c,6.7,a+[-2.5,-1.2,1.3,2.5][j],i);
  for(let j=0;j<l.rv;j++){
   const o=place('rv',c,7.7,a+(l.rv===2?j*Math.PI:.2),i);o.rig=i===1?'roof-jeep':i===5?'popup-pickup':j===0?'fj-suv':'explore-trailer';
   if(o.rig==='explore-trailer'){
    const tow=occupied.find(p=>p.site===i&&p.rig==='fj-suv');o.yaw=tow.yaw;o.x=tow.x-Math.sin(o.yaw)*3.35;o.z=tow.z-Math.cos(o.yaw)*3.35;o.radius=2.3;o.mass=2.8;o.score=400;
   }
  }
  for(let j=0;j<l.tables;j++)place('picnic',c,3.6,a+Math.PI/2+j*Math.PI,i);
  for(let j=0;j<l.pines;j++)place('pine',c,11.5,a+.6+j*2.4,i);
 }
 for(const [x,z]of[[-40,-15],[-21,-30],[-8,-40],[18,-33],[36,-22]]){const o=add('cabin',x,z,rand()*Math.PI*2);occupied.push(o);}
 const lodge=add('landmark',3,-40);lodge.variant='lodge';occupied.push(lodge);
 for(let i=0;i<36;i++)for(let attempt=0;attempt<100;attempt++){
  const a=i*2.39996+attempt*.12,r=44+rand()*7,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(!campDry(x,z,1.5)||occupied.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+1.3))continue;
  const tree=add('pine',x,z,rand()*6);occupied.push(tree);break;
 }
 // Reserve every large silhouette before packing firewood and picnic supplies.
 for(const [i,c]of CAMP_SITES.entries())for(const type of['log','cooler']){
  const l=CAMP_LAYOUTS[i],count=type==='log'?l.logs:l.coolers,radius=type==='log'?.55:.4;
  for(let j=0;j<count;j++)for(let attempt=0;attempt<200;attempt++){
   const side=type==='log'?1:-1,b=rand()*Math.PI*2,spread=1.5+attempt*.04,d=Math.sqrt(rand())*spread;
   const dx=side*3.2+Math.cos(b)*d,dz=Math.sin(b)*d,ca=Math.cos(l.angle),sa=Math.sin(l.angle),x=c.x+dx*ca-dz*sa,z=c.z+dx*sa+dz*ca;
   if(Math.abs(x)>51||Math.abs(z)>51||!campDry(x,z,radius)||occupied.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+radius+.12))continue;
   const o=add(type,x,z,l.angle+(type==='log'?Math.PI/2:0));o.site=i;occupied.push(o);break;
  }
 }
}
