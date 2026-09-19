// One world-space coastline, not an offset of the racing line.
export function mainlandCoast(track) {
  const west=Math.min(...track.points.map(p=>p.x))-48;
  const shore=[];
  for(let z=-3000;z<=3000;z+=20)
    shore.push({x:west+Math.sin(z*.009)*7+Math.sin(z*.023)*3,z});
  return {shore,land:[...shore,{x:3000,z:3000},{x:3000,z:-3000}]};
}
export function beachSites(track) {
  const {shore}=mainlandCoast(track),umbrellas=[],houses=[];
  const near=(x,z)=>Math.min(...track.points.map(p=>Math.hypot(p.x-x,p.y-z)));
  for(let i=0;i<shore.length;i++) {
    const p=shore[i];
    if(i%2===0&&near(p.x,p.z)<180)for(let j=0;j<2;j++)
      umbrellas.push({x:p.x+10+j*9,z:p.z+j*7,color:(i+j)%4});
  }
  const west=Math.min(...track.points.map(p=>p.x));
  for(let i=0;i<track.points.length;i+=32) {
    const p=track.points[i],x=p.x-Math.sin(p.heading)*48,z=p.y+Math.cos(p.heading)*48;
    if(x<west+40||near(x,z)<28||houses.some(h=>Math.hypot(h.x-x,h.z-z)<28))continue;
    houses.push({x,z,color:houses.length%4,angle:-p.heading});
  }
  return {umbrellas,houses};
}
