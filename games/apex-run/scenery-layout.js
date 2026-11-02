export function gantryLayout(roadWidth){
  const postWidth=.62,lateralMargin=1.5,half=roadWidth/2+lateralMargin;
  return Object.freeze({postWidth,lateralMargin,half,innerHalf:half-postWidth/2,height:6.4});
}
