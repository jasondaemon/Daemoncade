import assert from "node:assert/strict";
import {pickVisibleTerrainCorner,pointInPolygon} from "./terrain-picking.mjs";

const corner=(x,y,sx,sy,h=1)=>({world:{x,y},screen:{x:sx,y:sy},screenHeight:h});
const rear={world:{x:1,y:1},depth:2,corners:[corner(1,1,40,10),corner(2,1,70,30),corner(2,2,40,50),corner(1,2,10,30)]};
const front={world:{x:8,y:8},depth:5,corners:[corner(8,8,40,20,4),corner(9,8,75,40,4),corner(9,9,40,65,4),corner(8,9,5,40,4)]};

assert.equal(pointInPolygon({x:40,y:30},rear.corners.map(value=>value.screen)),true);
assert.equal(pointInPolygon({x:90,y:30},rear.corners.map(value=>value.screen)),false);
const visible=pickVisibleTerrainCorner([rear,front],{x:40,y:22},40);
assert.deepEqual({x:visible.x,y:visible.y,screenHeight:visible.screenHeight},{x:8,y:8,screenHeight:4},"the front surface owns an overlapping pointer; the hidden rear corner cannot be selected");
assert.equal(pickVisibleTerrainCorner([rear,front],{x:40,y:42},8),null,"a click far from a visible corner is rejected instead of guessing");
assert.equal(pickVisibleTerrainCorner([rear],{x:40,y:11},36).x,1,"an unobscured visible corner remains selectable");
console.log("Meddle terrain picking: foremost visible surface owns every terrain edit");
