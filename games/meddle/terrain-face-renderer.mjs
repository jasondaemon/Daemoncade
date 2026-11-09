import { terrainMeshFaces } from "./terrain-mesh.mjs";

function intersect(a,b,height){const span=b.h-a.h,t=Math.abs(span)<1e-9?0:(height-a.h)/span;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,h:height};}

function clip(points,height,keepAbove){const result=[];for(let index=0;index<points.length;index+=1){const a=points[index],b=points[(index+1)%points.length],insideA=keepAbove?a.h>=height:a.h<=height,insideB=keepAbove?b.h>=height:b.h<=height;if(insideA)result.push({...a});if(insideA!==insideB)result.push(intersect(a,b,height));}return result;}

function band(points,low,high){let result=points;if(Number.isFinite(low))result=clip(result,low,true);if(result.length>=3&&Number.isFinite(high))result=clip(result,high,false);return result.length>=3?result:[];}

export function terrainMaterialFaces(vertices,water){
  const clean=vertices.map(point=>({x:Number(point.x),y:Number(point.y),h:Number(point.h)})),raw=terrainMeshFaces(clean,water),landHeights=clean.map(point=>point.h).filter(height=>height>water);
  if(!landHeights.length)return raw.map(face=>({...face,material:"water"}));
  const coastal=clean.some(point=>point.h<=water),low=coastal?Number(water):Math.min(...landHeights),high=Math.max(...landHeights),relief=high-low;
  if(relief<1e-6)return raw.map(face=>({...face,material:face.material==="water"?"water":"cover"}));
  const earthEnd=low+relief*.28,coverStart=low+relief*.53,result=[];
  for(const face of raw){if(face.material==="water"){result.push(face);continue;}for(const [material,min,max] of [["earth",-Infinity,earthEnd],["bank",earthEnd,coverStart],["cover",coverStart,Infinity]]){const points=band(face.points,min,max);if(points.length>=3)result.push({...face,material,points});}}
  return result;
}

export function terrainFaceDepth(face,rotate){const screenDepth=face.points.reduce((sum,point)=>{const rotated=rotate(point.x,point.y);return sum+rotated.x+rotated.y-point.h*.01;},0)/face.points.length;return screenDepth;}

export function terrainFaceMaterialCounts(faces){return faces.reduce((counts,face)=>({...counts,[face.material]:(counts[face.material]||0)+1}),{});}
