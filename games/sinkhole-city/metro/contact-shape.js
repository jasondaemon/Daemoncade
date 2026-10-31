// Offline-at-load simplification of rendered triangles, not a per-frame mesh solver.
// Support points stay on real bottom surfaces (including separated feet). Upper
// contacts sample actual cross-sections; scoring keeps the conservative box envelope.
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
function hull(points){
 const sorted=[...new Map(points.map(p=>[`${p.x.toFixed(5)}:${p.z.toFixed(5)}`,p])).values()].sort((a,b)=>a.x-b.x||a.z-b.z);
 if(sorted.length<3)return sorted;
 const lower=[],upper=[];
 for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
 for(const p of [...sorted].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 lower.pop();upper.pop();return [...lower,...upper];
}
function spread(points,count){
 if(points.length<=count)return points;
 const chosen=[points[0]],remaining=new Set(points.slice(1));
 while(chosen.length<count&&remaining.size){
  let best=null,distance=-1;
  for(const p of remaining){const nearest=Math.min(...chosen.map(q=>(p.x-q.x)**2+(p.z-q.z)**2));if(nearest>distance){best=p;distance=nearest;}}
  chosen.push(best);remaining.delete(best);
 }
 return chosen;
}
export function sampleContactShape(triangles,shape){
 const {width,depth,height}=shape;if(![width,depth,height].every(n=>Number.isFinite(n)&&n>0)||triangles.length<9||triangles.length%9||!triangles.every(Number.isFinite))return null;
 const base=[],levels=[height*.33,height*.66,height],sections=levels.map(()=>[]),epsilon=Math.max(.002,height*.015);
 for(let i=0;i<triangles.length;i+=9){
  const v=[0,3,6].map(j=>({x:triangles[i+j],y:triangles[i+j+1],z:triangles[i+j+2]}));
  for(const p of v)if(p.y<=epsilon)base.push({x:p.x,y:0,z:p.z});
  if(v.every(p=>p.y<=epsilon))base.push({x:(v[0].x+v[1].x+v[2].x)/3,y:0,z:(v[0].z+v[1].z+v[2].z)/3});
  for(let level=0;level<levels.length;level++)for(let edge=0;edge<3;edge++){
   const y=levels[level],a=v[edge],b=v[(edge+1)%3];
   if(Math.abs(a.y-y)<.00001)sections[level].push({x:a.x,y,z:a.z});
   if((a.y-y)*(b.y-y)<0){const t=(y-a.y)/(b.y-a.y);sections[level].push({x:a.x+(b.x-a.x)*t,y,z:a.z+(b.z-a.z)*t});}
  }
 }
 // Quantized occupied cells prevent duplicate triangle vertices biasing support.
 const cells=new Map();for(const p of base){const key=`${Math.round(p.x/width*12)}:${Math.round(p.z/depth*12)}`;if(!cells.has(key))cells.set(key,p);}
 const supports=spread([...cells.values()],12),contacts=[...supports];
 for(const section of sections)contacts.push(...spread(hull(section),8));
 if(!supports.length||contacts.length<4)return null;
 const centered=points=>points.map(p=>({x:p.x,y:p.y-height/2,z:p.z}));
 return {...shape,profile:'model',supports:centered(supports),contacts:centered(contacts)};
}
