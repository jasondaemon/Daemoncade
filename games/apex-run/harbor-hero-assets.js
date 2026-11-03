import {coastalDistrictSpecs} from "./harbor-coastal-districts.js";

export function placeHarborGantryCrane(THREE,scene,source,quality="high"){
  if(!source||quality==="low")return null;
  const spec=coastalDistrictSpecs(quality).find(item=>item.kind==="shipyard");
  if(!spec)return null;
  const model=source.clone(true),sourceBox=new THREE.Box3().setFromObject(model),size=sourceBox.getSize(new THREE.Vector3()),center=sourceBox.getCenter(new THREE.Vector3()),scale=42/Math.max(size.x,size.z,1),crane=new THREE.Group();
  model.scale.setScalar(scale);model.position.set(-center.x*scale,-sourceBox.min.y*scale,-center.z*scale);crane.add(model);
  crane.rotation.y=spec.rotation;crane.position.set(spec.x,.35,spec.z);
  crane.traverse(object=>{if(object.isMesh){object.castShadow=quality==="high";object.receiveShadow=true}});
  crane.userData={harborHero:"innerscene-container-gantry-crane",sourceWidth:size.x,scale};scene.add(crane);return crane;
}
