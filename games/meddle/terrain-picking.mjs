const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function pointInPolygon(point,polygon){
  if(!point||!Array.isArray(polygon)||polygon.length<3)return false;
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j],cross=(point.x-a.x)*(b.y-a.y)-(point.y-a.y)*(b.x-a.x),onSegment=Math.abs(cross)<.001&&point.x>=Math.min(a.x,b.x)-.001&&point.x<=Math.max(a.x,b.x)+.001&&point.y>=Math.min(a.y,b.y)-.001&&point.y<=Math.max(a.y,b.y)+.001;
    if(onSegment)return true;
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

// Depth matches the terrain painter. Only the foremost surface beneath the
// pointer is eligible, so a hidden projected corner cannot win.
export function pickVisibleTerrainHit(tiles,point,maxDistance=36){
  if(!Array.isArray(tiles)||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
  let visible=null;
  for(const tile of tiles){const polygon=tile?.corners?.map(corner=>corner.screen);if(pointInPolygon(point,polygon)&&(!visible||tile.depth>=visible.depth))visible=tile;}
  if(!visible)return null;
  const candidate=visible.corners.reduce((best,corner)=>{const d=distance(point,corner.screen);return !best||d<best.distance?{...corner.world,screenHeight:corner.screenHeight,distance:d}:best;},null);
  return{tile:visible.world,corner:candidate&&candidate.distance<=maxDistance?candidate:null};
}

export const pickVisibleTerrainCorner=(tiles,point,maxDistance=36)=>pickVisibleTerrainHit(tiles,point,maxDistance)?.corner||null;

export function pickAccessibleTerrainCorner(corners,point,maxDistance=36){
  if(!Array.isArray(corners)||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
  let best=null;
  for(const corner of corners){
    if(!corner?.screen||!Number.isFinite(corner.screen.x)||!Number.isFinite(corner.screen.y))continue;
    const d=distance(point,corner.screen);
    if(d>maxDistance)continue;
    const depth=Number(corner.depth)||0;
    if(!best||d<best.distance-.001||(Math.abs(d-best.distance)<=.001&&depth>best.depth))best={...corner.world,screenHeight:corner.screenHeight,distance:d,depth};
  }
  return best;
}

export const resolveCommittedTerrainCorner=(committed,fallback)=>committed===undefined?fallback():committed;
export const terrainDragThreshold=pointerType=>pointerType==="touch"?12:3;
export function touchTerrainCommit(primed,selected){
  const same=selected&&primed&&selected.x===primed.x&&selected.y===primed.y;
  return same?{commit:true,next:null}:{commit:false,next:selected||null};
}
