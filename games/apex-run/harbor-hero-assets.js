import {coastalDistrictSpecs} from "./harbor-coastal-districts.js";

export function placeHarborGantryCrane(THREE,scene,source,quality="high"){
  if(!source||quality==="low")return null;
  const spec=coastalDistrictSpecs(quality).find(item=>item.kind==="shipyard");
  if(!spec)return null;
  const crane=source.clone(true),sourceBox=new THREE.Box3().setFromObject(crane),size=sourceBox.getSize(new THREE.Vector3()),center=sourceBox.getCenter(new THREE.Vector3()),scale=42/Math.max(size.x,size.z,1);
  crane.scale.setScalar(scale);
  crane.rotation.y=spec.rotation;
  crane.position.set(spec.x-center.x*scale,.35-sourceBox.min.y*scale,spec.z-center.z*scale);
  crane.traverse(object=>{if(object.isMesh){object.castShadow=quality==="high";object.receiveShadow=true}});
  crane.userData={harborHero:"innerscene-container-gantry-crane",sourceWidth:size.x,scale};
  scene.add(crane);
  return crane;
}
