import { terrainMeshFaces } from "./terrain-mesh.mjs";

function slopeVector(points){const average=points.reduce((sum,point)=>sum+point.h,0)/points.length;return points.reduce((vector,point)=>({x:vector.x+point.x*(point.h-average),y:vector.y+point.y*(point.h-average)}),{x:0,y:0});}

export function terrainSlopeClass(points){
  if(!Array.isArray(points)||points.length<3)return"flat";
  const heights=points.map(point=>Number(point.h)),relief=Math.max(...heights)-Math.min(...heights);
  if(!Number.isFinite(relief)||relief<.02)return"flat";
  const vector=slopeVector(points);
  if(Math.abs(vector.x)>=Math.abs(vector.y))return vector.x>=0?"east":"west";
  return vector.y>=0?"south":"north";
}

// A face receives one authored coverage treatment. There are no horizontal
// contour slices: flat surfaces keep cover, water stays on a common plane,
// coastal clips use bank art, and each rising face selects directional art.
export function terrainMaterialFaces(vertices,water){
  return terrainMeshFaces(vertices,water).map(face=>{
    if(face.material==="water")return{...face,coverage:"water",slope:"flat"};
    const slope=terrainSlopeClass(face.points),coastal=face.material==="earth";
    return{...face,material:coastal?"bank":slope==="flat"?"cover":"bank",coverage:coastal?"coast":slope==="flat"?"cover":`slope-${slope}`,slope};
  });
}

export function terrainFaceDepth(face,rotate){return face.points.reduce((sum,point)=>{const rotated=rotate(point.x,point.y);return sum+rotated.x+rotated.y-point.h*.01;},0)/face.points.length;}

export function terrainFaceMaterialCounts(faces){return faces.reduce((counts,face)=>({...counts,[face.material]:(counts[face.material]||0)+1}),{});}
