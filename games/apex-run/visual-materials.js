export function roadMaterialParameters(THREE,{colorMap=null,normalMap=null,roughnessMap=null}={}){
  return {color:colorMap?0x62676a:0x282c2e,map:colorMap,normalMap,normalScale:new THREE.Vector2(.34,.34),roughnessMap,roughness:.88,metalness:.01};
}
