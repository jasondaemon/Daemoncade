const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;

function faceLight(points) {
  const [a,b,c]=points,ux=b.x-a.x,uy=b.y-a.y,uz=b.h-a.h,vx=c.x-a.x,vy=c.y-a.y,vz=c.h-a.h,
    nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,length=Math.hypot(nx,ny,nz)||1;
  return Math.max(-1,Math.min(1,(nx*-.42+ny*-.28+nz*.86)/length));
}

function intersectSea(a,b,sea){
  const span=b.h-a.h,t=Math.abs(span)<1e-9?0:(sea-a.h)/span;
  return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,h:sea};
}

function clipAtSea(points,sea,keepAbove){
  const result=[];
  for(let index=0;index<points.length;index+=1){
    const a=points[index],b=points[(index+1)%points.length],aInside=keepAbove?a.h>=sea:a.h<=sea,bInside=keepAbove?b.h>=sea:b.h<=sea;
    if(aInside)result.push({...a});
    if(aInside!==bInside)result.push(intersectSea(a,b,sea));
  }
  return result;
}

// Four corner heights form four stable triangular faces around the tile
// center. This mirrors the original game's finite shape-bank idea without
// copying its art: geometry selects a small material vocabulary deterministically.
export function terrainMeshFaces(vertices, water) {
  if(!Array.isArray(vertices)||vertices.length!==4||!Number.isFinite(Number(water)))return [];
  const corners=vertices.map(point=>({x:Number(point.x),y:Number(point.y),h:Number(point.h)}));
  if(corners.some(point=>!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(point.h)))return [];
  const sea=Number(water);
  if(corners.every(point=>point.h<=sea))return [{material:"water",light:0,points:corners.map(point=>({...point,h:sea}))}];
  const center={x:average(corners.map(point=>point.x)),y:average(corners.map(point=>point.y)),h:average(corners.map(point=>point.h))},faces=[];
  for(const [index,point] of corners.entries()){
    const triangle=[point,corners[(index+1)%corners.length],center],land=clipAtSea(triangle,sea,true),waterPart=clipAtSea(triangle,sea,false);
    if(land.length>=3)faces.push({material:triangle.some(item=>item.h<=sea+.001)?"earth":"land",light:faceLight(land),points:land});
    if(waterPart.length>=3)faces.push({material:"water",light:0,points:waterPart.map(item=>({...item,h:sea}))});
  }
  return faces;
}

export function meshMaterialCounts(faces){return faces.reduce((counts,face)=>({...counts,[face.material]:(counts[face.material]||0)+1}),{});}
