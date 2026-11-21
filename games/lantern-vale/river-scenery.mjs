// World-space paint for the opening chapter. Collision stays in the room data.
const scenes = [
  {path:[[0,208],[110,145],[208,235],[365,183],[470,190],[640,199]], trees:[[21,110],[122,82],[264,57],[570,101],[84,305],[320,354],[568,315]], roofs:[[156,53],[490,268]]},
  {path:[[0,199],[155,196],[226,149],[307,124],[326,0]], trees:[[32,93],[136,72],[445,63],[103,290],[560,294]], bridge:true},
  {path:[[320,399],[300,305],[220,253],[225,167],[368,110],[459,101]], trees:[[149,114],[517,154],[217,40],[355,336]], ridge:true},
  null,null,null,
  {path:[[0,199],[133,190],[280,228],[381,222],[513,176],[596,125]], trees:[[22,105],[114,85],[205,64],[270,326],[588,292]], ridge:true},
];

function line(ctx, points, width, color) {
  ctx.beginPath();
  points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.lineWidth=width;
  ctx.lineJoin='round';
  ctx.strokeStyle=color;
  ctx.stroke();
}

function rect(ctx,color,x,y,w,h) {
  ctx.fillStyle=color;
  ctx.fillRect(x,y,w,h);
}

function willow(ctx,x,y) {
  rect(ctx,'#193132',x-26,y+12,57,13);
  rect(ctx,'#654e3e',x-5,y-12,11,33);
  rect(ctx,'#243b3b',x-29,y-29,58,31);
  rect(ctx,'#306252',x-25,y-35,48,29);
  rect(ctx,'#478167',x-18,y-38,34,11);
  rect(ctx,'#3c7359',x-29,y-20,12,29);
  rect(ctx,'#345b4a',x+18,y-15,13,28);
  rect(ctx,'#5a9470',x-20,y-27,19,4);
}

function house(ctx,x,y) {
  rect(ctx,'#40322e',x-32,y+1,64,34);
  rect(ctx,'#ba9161',x-26,y-2,51,33);
  rect(ctx,'#55383a',x-38,y-15,76,20);
  rect(ctx,'#8f5045',x-30,y-24,61,19);
  rect(ctx,'#b06a50',x-22,y-28,44,8);
  rect(ctx,'#523d31',x-6,y+8,14,23);
  rect(ctx,'#ffd886',x-21,y+10,9,8);
  rect(ctx,'#ffd886',x+13,y+10,9,8);
}

const terrainColors = [
  ['#3d6250','#264738','#52775a'],
  ['#355e53','#243f42','#4a7862'],
  ['#526d63','#314751','#638174'],
  null,null,null,
  ['#556a4e','#354d3c','#73825e'],
];

export function paintRiverGround(ctx,index,x,y,tile) {
  const [grass,bank,highlight]=terrainColors[index];
  const px=x*40, py=y*40, offset=(x*11+y*17)%23;
  if(tile==='~'){
    rect(ctx,'#285665',px,py,40,40);
    rect(ctx,'#458391',px+offset,py+9,12,2);
    rect(ctx,'#346b7a',px+24-offset,py+26,15,2);
    return;
  }
  rect(ctx,tile==='#'?bank:grass,px,py,40,40);
  if(tile==='#'){
    rect(ctx,grass,px+3,py+5,25+offset%10,14);
    rect(ctx,bank,px+1,py+22,37,16);
    rect(ctx,highlight,px+7,py+6,13,3);
  } else {
    rect(ctx,highlight,px+offset,py+7,7,2);
    rect(ctx,bank,px+27-offset,py+28,8,2);
    rect(ctx,highlight,px+offset+2,py+5,2,5);
  }
}

export function paintRiverScenery(ctx, index, drained, lampLit) {
  const scene=scenes[index];
  if(!scene) return;
  line(ctx,scene.path,21,'#576151');
  line(ctx,scene.path,13,'#8d8060');
  line(ctx,scene.path,3,'#a19371');
  if(scene.ridge) {
    line(ctx,[[138,92],[220,65],[309,60],[384,85]],9,'#334a4f');
    line(ctx,[[138,87],[220,60],[309,55],[384,80]],3,'#73928a');
  }
  for(const [x,y] of scene.trees) willow(ctx,x,y);
  for(const [x,y] of scene.roofs||[]) house(ctx,x,y);
  if(scene.bridge) {
    rect(ctx,'#315f69',398,320,82,40);
    rect(ctx,'#739998',405,325,25,3);
    rect(ctx,'#5c8d89',443,346,28,3);
    if(lampLit) {
      rect(ctx,'#654d37',399,324,82,33);
      for(let x=402;x<480;x+=8) rect(ctx,'#b6925c',x,327,5,27);
    }
    if(drained) {
      rect(ctx,'#504139',367,177,273,53);
      for(let x=369;x<640;x+=13) rect(ctx,'#a58b63',x,180,9,46);
      rect(ctx,'#d2ac70',371,179,269,4);
      rect(ctx,'#6b533e',371,225,269,4);
    } else {
      rect(ctx,'#36616f',359,160,281,80);
      for(let x=369;x<600;x+=37) rect(ctx,'#52818a',x,171+(x%5)*12,21,3);
      rect(ctx,'#523d36',596,166,44,67);
      for(let y=170;y<231;y+=12) rect(ctx,'#c0885c',600,y,39,5);
    }
  }
}
