import assert from "node:assert/strict";
import {pickAccessibleTerrainCorner,pickVisibleTerrainCorner,pointInPolygon,resolveCommittedTerrainCorner} from "./terrain-picking.mjs";

const corner=(x,y,sx,sy,h=1)=>({world:{x,y},screen:{x:sx,y:sy},screenHeight:h});
const rear={world:{x:1,y:1},depth:2,corners:[corner(1,1,40,10),corner(2,1,70,30),corner(2,2,40,50),corner(1,2,10,30)]};
const front={world:{x:8,y:8},depth:5,corners:[corner(8,8,40,20,4),corner(9,8,75,40,4),corner(9,9,40,65,4),corner(8,9,5,40,4)]};

assert.equal(pointInPolygon({x:40,y:30},rear.corners.map(value=>value.screen)),true);
assert.equal(pointInPolygon({x:90,y:30},rear.corners.map(value=>value.screen)),false);
const visible=pickVisibleTerrainCorner([rear,front],{x:40,y:22},40);
assert.deepEqual({x:visible.x,y:visible.y,screenHeight:visible.screenHeight},{x:8,y:8,screenHeight:4},"the front surface owns an overlapping pointer; the hidden rear corner cannot be selected");
assert.equal(pickVisibleTerrainCorner([rear,front],{x:40,y:42},8),null,"a click far from a visible corner is rejected instead of guessing");
assert.equal(pickVisibleTerrainCorner([rear],{x:40,y:11},36).x,1,"an unobscured visible corner remains selectable");

const heights=[
  [1,1,1,1,1],
  [1,2,2,2,1],
  [1,2,3,2,1],
  [1,2,2,2,1],
  [1,1,1,1,1]
],size=4,tileWidth=64,tileHeight=32,heightStep=16;
const rotate=(x,y,rotation)=>rotation===0?{x,y}:rotation===1?{x:y,y:size-x}:rotation===2?{x:size-x,y:size-y}:{x:size-y,y:x};
for(let rotation=0;rotation<4;rotation+=1){
  const candidates=[];
  for(let y=0;y<=size;y+=1)for(let x=0;x<=size;x+=1){const p=rotate(x,y,rotation),screen={x:320+(p.x-p.y)*tileWidth/2,y:180+(p.x+p.y)*tileHeight/2-heights[y][x]*heightStep};candidates.push({world:{x,y},screen,screenHeight:heights[y][x],depth:p.x+p.y});}
  for(const candidate of candidates){const picked=pickAccessibleTerrainCorner(candidates,candidate.screen,10);assert.deepEqual({x:picked.x,y:picked.y},{x:candidate.world.x,y:candidate.world.y},`rotation ${rotation} must keep joint ${candidate.world.x},${candidate.world.y} directly accessible`);}
}

const tied=[corner(1,1,20,20),corner(2,2,20,20)].map((value,index)=>({...value,depth:index+1}));
assert.deepEqual(pickAccessibleTerrainCorner(tied,{x:20,y:20},5).x,2,"an exact projection tie resolves toward the visually deeper joint");
assert.equal(pickAccessibleTerrainCorner(tied,{x:80,y:80},5),null,"a distant click never guesses a joint");
assert.equal(resolveCommittedTerrainCorner(null,()=>({x:3,y:3})),null,"a press that began without a joint cannot acquire one on release");
assert.deepEqual(resolveCommittedTerrainCorner(undefined,()=>({x:3,y:3})),{x:3,y:3},"non-pointer callers can still request a fresh lookup");
console.log("Meddle terrain picking: rendered tiles and all source-ratio terrain joints remain addressable");
