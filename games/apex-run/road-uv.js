const distance3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

// The authored road mesh has eight vertices per cross-section: top, underside,
// left wall and right wall. UVs are generated from physical arc length and
// width, so every face remains continuous even when no texture happened to
// load. This is deliberately independent of material state.
export function roadMeshUV(samples,{metresPerTile=7,wallTile=.16}={}){
  const uv=new Float32Array(samples.length*8*2);let distance=0,cursor=0;
  for(let index=0;index<samples.length;index++){
    if(index)distance+=distance3(samples[index],samples[index-1]);
    const along=distance/metresPerTile,across=samples[index].width/metresPerTile;
    for(const value of [along,0,along,across,along,0,along,across,along,0,along,wallTile,along,across,along,across-wallTile])uv[cursor++]=value;
  }
  return uv;
}

// Fork junctions are top-only ribbons stored as outer/inner vertex pairs.
export function ribbonUV(positions,{metresPerTile=7}={}){
  if(positions.length%6)throw new Error("ribbon positions must contain vertex pairs");
  const count=positions.length/6,uv=new Float32Array(count*4);let distance=0,cursor=0,previous=null;
  for(let index=0;index<count;index++){
    const offset=index*6,outer={x:positions[offset],y:positions[offset+1],z:positions[offset+2]},inner={x:positions[offset+3],y:positions[offset+4],z:positions[offset+5]},mid={x:(outer.x+inner.x)/2,y:(outer.y+inner.y)/2,z:(outer.z+inner.z)/2};
    if(previous)distance+=distance3(mid,previous);previous=mid;
    const along=distance/metresPerTile,across=distance3(outer,inner)/metresPerTile;
    uv[cursor++]=along;uv[cursor++]=0;uv[cursor++]=along;uv[cursor++]=across;
  }
  return uv;
}
