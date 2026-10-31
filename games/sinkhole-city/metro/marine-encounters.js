// A living encounter, not a combat simulation: predators herd but never remove
// collectibles. Reuse group lists; no per-creature searches or physics bodies.
export const MIGRATION_ROUTES=[
 [[18,-28],[32,-8],[23,14],[3,24],[-13,9],[-7,-14]],
 [[-25,26],[-34,8],[-22,-12],[-5,-27],[10,-6],[-2,14]]
];
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const closest=(list,g)=>{let best=null,distance=Infinity;for(const item of list){const d=Math.hypot(item.x-g.x,item.z-g.z);if(d<distance){best=item;distance=d;}}return {best,distance};};
export function stepMarineGroups(objects,schools,dt,time,player){
 const cache=schools.encounters||(schools.encounters={fish:[],sharks:[],whales:[]});
 for(const list of Object.values(cache))list.length=0;
 for(const g of schools.values())g.active=false;
 for(const o of objects)if(o.phase==='idle'){const g=schools.get(o.swim.group);if(g)g.active=true;}
 for(const g of schools.values())if(g.active){if(g.type==='fish')cache.fish.push(g);if(g.type==='shark')cache.sharks.push(g);if(g.type==='whale')cache.whales.push(g);}
 for(const g of schools.values()){
  if(!g.active)continue;
  const a=time*.13+g.phase;let tx=g.homeX+Math.cos(a)*g.range,tz=g.homeZ+Math.sin(a*.83)*g.range*.65,speed=g.speed,turn=.85;
  g.behavior='foraging';g.leader=null;let tightness=1;
  if(g.type==='whale'){
   const route=MIGRATION_ROUTES[g.route||0];
   if(g.waypoint===undefined){let best=0,d=Infinity;route.forEach(([x,z],i)=>{const distance=Math.hypot(g.x-x,g.z-z);if(distance<d){best=i;d=distance;}});g.waypoint=(best+1)%route.length;}
   if(Math.hypot(route[g.waypoint][0]-g.x,route[g.waypoint][1]-g.z)<4)g.waypoint=(g.waypoint+1)%route.length;
   [tx,tz]=route[g.waypoint];turn=.38;g.behavior='migrating';
  }else if(g.type==='dolphin'&&cache.whales.length){
   const leader=cache.whales.find(w=>w.route===g.escort)||cache.whales[0],side=(g.side||1)*6.5,c=Math.cos(leader.heading),s=Math.sin(leader.heading);
   tx=leader.x+side*c-s*3+Math.sin(time*.6+g.phase)*.7;tz=leader.z-side*s-c*3;
   speed=Math.min(g.speed*1.15,.65+Math.hypot(tx-g.x,tz-g.z)*.3);turn=1.2;g.behavior='escorting';g.leader=leader.group;
  }else if(g.type==='shark'&&cache.fish.length){
   const {best}=closest(cache.fish,g),orbit=time*.24+g.phase;
   tx=best.x+Math.cos(orbit)*6;tz=best.z+Math.sin(orbit)*6;g.behavior='hunting';
  }
  let desired=Math.atan2(tx-g.x,tz-g.z);
  if(g.type==='fish'){
   g.behavior='schooling';const {best,distance}=closest(cache.sharks,g);
   if(best&&distance<13){const threat=Math.min(1,(13-distance)/6);desired+=delta(Math.atan2(g.x-best.x,g.z-best.z),desired)*threat;tightness=1-threat*.65;g.behavior='baitball';}
  }
  if(player&&g.radius<=player.radius*.82){const dx=g.x-player.x,dz=g.z-player.z,d=Math.hypot(dx,dz),reach=player.radius+6;if(d<reach)desired+=delta(Math.atan2(dx,dz),desired)*Math.min(1,(reach-d)/3);}
  // Soft territorial recovery takes precedence over hunting/evasion at the edge.
  // It turns a group back into the bay instead of bouncing or chasing off-map.
  if(Math.abs(g.x)>46||Math.abs(g.z)>46||g.type==='fish'&&Math.hypot(g.x-g.homeX,g.z-g.homeZ)>g.range*1.8+4)desired=Math.atan2(g.homeX-g.x,g.homeZ-g.z);
  g.tightness=(g.tightness??1)+(tightness-(g.tightness??1))*(1-Math.exp(-2*dt));g.travelSpeed=speed;
  g.heading+=Math.max(-turn*dt,Math.min(turn*dt,delta(desired,g.heading)));
  g.x+=Math.sin(g.heading)*speed*dt;g.z+=Math.cos(g.heading)*speed*dt;
 }
}
export function dolphinRoll(time,phase){
 const t=(time+phase*2)%24,bank=Math.sin(time*.8+phase)*.16;
 if(time<8||t>=2.8)return bank;
 const u=t/2.8;return bank+Math.PI*2*u*u*(3-2*u);
}
