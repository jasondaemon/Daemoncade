import {worldSunDirection} from "./environment-presentation.js?v=0.5.0-alpha108-visible-sun-integrated";

const clamp01=value=>Math.max(0,Math.min(1,value));

export function sunGlareOpacity(ndcX,ndcY,ndcZ=0){
  if(ndcZ<0||ndcZ>1)return 0;
  const radius=Math.hypot(ndcX,ndcY),edge=clamp01((1.08-radius)/.26),facing=clamp01(1-radius/1.1);
  return .16*edge*(.28+.72*Math.pow(facing,.7));
}

function glareTexture(THREE){
  const canvas=document.createElement("canvas");canvas.width=canvas.height=128;const context=canvas.getContext("2d"),gradient=context.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,"rgba(255,244,214,.95)");gradient.addColorStop(.08,"rgba(255,218,151,.62)");gradient.addColorStop(.28,"rgba(255,181,94,.16)");gradient.addColorStop(1,"rgba(255,157,72,0)");context.fillStyle=gradient;context.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export function addSunGlare(THREE,scene,quality="high",trackId="summit-circuit"){
  const offset=worldSunDirection(trackId),direction=new THREE.Vector3(offset.x,offset.y,offset.z).normalize(),material=new THREE.SpriteMaterial({map:glareTexture(THREE),color:0xffd9a0,transparent:true,opacity:0,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),sprite=new THREE.Sprite(material),projected=new THREE.Vector3();
  sprite.name="sun-angle-glare";sprite.scale.setScalar(quality==="low"?21:27);sprite.renderOrder=1;scene.add(sprite);
  return{sprite,direction,update(camera){sprite.position.copy(camera.position).addScaledVector(direction,620);projected.copy(sprite.position).project(camera);material.opacity=sunGlareOpacity(projected.x,projected.y,projected.z);sprite.visible=material.opacity>.003},dispose(){scene.remove(sprite);material.map.dispose();material.dispose()}};
}
