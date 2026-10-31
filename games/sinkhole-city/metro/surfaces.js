const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*clamp(t));
// Continuous direction-space fields: no latitude seam, rectangular texture tiling,
// random per-frame color changes, or downloaded planetary textures.
export function surfaceColor(variant,x,y,z){
 const n=Math.sin(x*7+z*3)*.3+Math.sin(z*11+y*6)*.2+Math.sin(y*17+x*9)*.12+Math.sin((x+z)*29)*.04;
 if(variant==='ocean'){
  const land=smooth(.015,.09,n),shore=smooth(-.06,.015,n),ice=smooth(.83,.95,Math.abs(y)+n*.08);
  let c=mix([.12,.32,.58],[.19,.67,.73],shore);
  c=mix(c,mix([.31,.53,.3],[.69,.64,.38],smooth(.14,.45,n)),land);
  c=mix(c,[.89,.96,.95],ice);
  const cloud=smooth(.69,.87,Math.sin(x*5-z*7+y*3)*.5+Math.sin(z*13+x*6)*.3)*.65;
  return mix(c,[.95,.97,.97],cloud);
 }
 if(variant==='desert'){
  const strata=.5+.5*Math.sin(y*19+n*5),basin=smooth(-.28,.05,n);
  return mix(mix([.43,.23,.2],[.76,.42,.28],strata),[.92,.71,.44],basin*.75);
 }
 if(variant==='ringed')return mix([.43,.39,.62],[.88,.75,.65],.5+.5*Math.sin(y*37+n*3));
 if(variant==='ice'){
  const crack=1-smooth(.025,.12,Math.abs(Math.sin(x*11+z*5+n*2)));
  return mix(mix([.48,.72,.83],[.87,.97,.97],.5+n),[.2,.46,.63],crack*.65);
 }
 return mix([.93,.32,.09],[1,.87,.39],.5+.5*Math.sin(x*19+y*13+z*7+n*6));
}

export function openingProgress(object,time,reduced=false){
 if(!object.charged)return 0;if(reduced)return 1;
 return smooth(0,.65,Math.max(0,time-(object.openedAt??0)));
}
