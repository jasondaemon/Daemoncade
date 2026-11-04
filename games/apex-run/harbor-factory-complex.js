import {coastalDistrictSpecs} from "./harbor-coastal-districts.js?v=0.5.0-alpha154-summit-descent";

function fittedClone(THREE,source,name,width,height){
  const original=source.getObjectByName(name);if(!original)return null;
  const clone=original.clone(true),box=new THREE.Box3().setFromObject(clone),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=Math.min(width/Math.max(size.x,.001),height/Math.max(size.y,.001));
  clone.scale.setScalar(scale);clone.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);return clone;
}
export function addHarborFactoryComplex(THREE,scene,source,quality="high"){
  if(!source||quality!=="high")return null;
  const spec=coastalDistrictSpecs(quality).find(item=>item.kind==="ferry-quay"),group=new THREE.Group(),bayCount=7,spacing=7.4;
  for(let index=0;index<bayCount;index++){
    const bay=fittedClone(THREE,source,index%3===1?"dado_garage_door_01":"dado_garage_centered_01",6.8,5.8);if(bay){bay.position.x=(index-(bayCount-1)/2)*spacing;group.add(bay)}
    if(index%2===0){const window=fittedClone(THREE,source,"window_centered_medium_03",5.4,3.4);if(window){window.position.set((index-(bayCount-1)/2)*spacing,6.1,0);group.add(window)}}
  }
  const cornice=fittedClone(THREE,source,"cornice03_standard_standard_01",bayCount*spacing+3,1.2);if(cornice){cornice.position.y=10;group.add(cornice)}
  for(const side of[-1,1])for(let index=0;index<3;index++){const wing=fittedClone(THREE,source,"dado_garage_centered_01",6.8,5.8);if(wing){wing.position.set(side*26,0,7+index*7);wing.rotation.y=side*Math.PI/2;group.add(wing)}}
  group.position.set(spec.x-35,.35,spec.z-3);group.rotation.y=spec.rotation;group.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true}});group.userData={harborFactory:true,bayCount,license:"CC0",source:"Poly Haven Modular Factory Facade"};scene.add(group);return group;
}
