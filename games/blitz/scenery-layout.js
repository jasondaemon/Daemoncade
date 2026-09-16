export const SCENERY_MODELS = ['shipping-container-a','shipping-container-b','water-tower','detail-tank-large','building-a','building-f','building-j','chimney-large'];
export const SCENERY_SPAN = 160;
export function sceneryLayout() {
  let seed=7319;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const result=[];
  for(const side of [-1,1]) {
    let order=[];
    for(let row=0;row<10;row++)for(let lane=0;lane<2;lane++) {
      if(!order.length){order=SCENERY_MODELS.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}}
      const model=order.pop(),width=lane?5+random()*2:2.8+random()*1.3;
      result.push({model,width,x:side*(lane?15+random()*2:8.8+random()*.7),offset:row*16+lane*5+random()*3,rotation:Math.floor(random()*4)*Math.PI/2});
    }
  }
  return result;
}
export function sceneryZ(offset,distance){return 48-(((offset-distance)%SCENERY_SPAN+SCENERY_SPAN)%SCENERY_SPAN)}
