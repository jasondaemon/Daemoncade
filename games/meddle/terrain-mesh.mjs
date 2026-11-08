const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;

function faceLight(points) {
  const [a,b,c]=points,ux=b.x-a.x,uy=b.y-a.y,uz=b.h-a.h,vx=c.x-a.x,vy=c.y-a.y,vz=c.h-a.h,
    nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,length=Math.hypot(nx,ny,nz)||1;
  return Math.max(-1,Math.min(1,(nx*-.42+ny*-.28+nz*.86)/length));
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
  const center={x:average(corners.map(point=>point.x)),y:average(corners.map(point=>point.y)),h:average(corners.map(point=>point.h))};
  return corners.map((point,index)=>{
    const next=corners[(index+1)%corners.length],points=[point,next,center],low=Math.min(...points.map(item=>item.h)),high=Math.max(...points.map(item=>item.h)),mean=average(points.map(item=>item.h)),coastal=low<=sea+.001;
    return {material:coastal?"earth":"land",light:faceLight(points),points};
  });
}

export function meshMaterialCounts(faces){return faces.reduce((counts,face)=>({...counts,[face.material]:(counts[face.material]||0)+1}),{});}
