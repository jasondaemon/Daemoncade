import {mergeGeometries} from "../vendor/three/addons/utils/BufferGeometryUtils.js";

const WHEEL_ORDER=["WheelFrontL","WheelFrontR","WheelRearL","WheelRearR"];
const RACE_WHEEL_ORDER=["WheelFrontR","WheelFrontL","WheelRearR","WheelRearL"];
export const RACE_WHEEL_TARGETS=Object.freeze([{x:1.55,y:-.4,z:1.02},{x:1.55,y:-.4,z:-1.02},{x:-1.45,y:-.4,z:1.02},{x:-1.45,y:-.4,z:-1.02}]);

function cloneMaterial(material){if(Array.isArray(material))return material.map(item=>item.clone());return material?.clone?.()||material}
function setColor(material,value){if(material?.color&&value)material.color.set(value)}
export function configureCarMaterial(material){
  if(!material||!/glass/i.test(material.name||""))return material;
  // Full source transmission is too clear for the optimized cabin, but the
  // exterior pane should still read as glass over the cabin backing below.
  material.color?.set?.(0x0b2028);
  material.transmission=.72;
  material.opacity=1;
  material.transparent=false;
  material.depthWrite=true;
  material.depthTest=true;
  material.roughness=.14;
  material.metalness=0;
  material.ior=1.45;
  material.thickness=.1;
  material.clearcoat=.42;
  material.clearcoatRoughness=.14;
  material.needsUpdate=true;
  return material;
}
export function addCockpitBackings(THREE,root){
  const panes=[],material=new THREE.MeshStandardMaterial({name:"Cockpit Interior",color:0x061219,roughness:.72,metalness:.04,side:THREE.DoubleSide});root.traverse(object=>{if(!object.isMesh||Array.isArray(object.material))return;if(/glass/i.test(object.material?.name||""))panes.push(object)});
  for(const pane of panes){
    const geometry=pane.geometry.clone();geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);geometry.scale(.985,.985,.985);geometry.translate(center.x,center.y,center.z);
    const backing=new THREE.Mesh(geometry,material);backing.name=`${pane.name||"CockpitGlass"}Backing`;backing.castShadow=false;backing.receiveShadow=false;backing.renderOrder=(pane.renderOrder||0)-1;pane.add(backing);
  }
  if(panes.length){root.updateMatrixWorld(true);const bounds=new THREE.Box3();for(const pane of panes)bounds.expandByObject(pane);const size=bounds.getSize(new THREE.Vector3()),center=root.worldToLocal(bounds.getCenter(new THREE.Vector3())),minimum=root.worldToLocal(bounds.min.clone()),tub=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),material),floor=new THREE.Mesh(new THREE.CircleGeometry(1,24),material);tub.name="CockpitTub";tub.scale.set(size.x*.44,Math.max(.075,size.y*.3),size.z*.56);tub.position.set(center.x,minimum.y-size.y*.12,center.z);floor.name="CockpitFloor";floor.rotation.x=-Math.PI/2;floor.scale.set(size.x*.48,size.z*.59,1);floor.position.set(center.x,minimum.y-size.y*.035,center.z);for(const part of[tub,floor]){part.castShadow=false;part.receiveShadow=false;root.add(part)}}
  return panes.length;
}
function normalizeMergeGeometry(THREE,geometry){for(const name of Object.keys(geometry.attributes))if(!["position","normal","uv"].includes(name))geometry.deleteAttribute(name);if(!geometry.getAttribute("normal"))geometry.computeVertexNormals();if(!geometry.getAttribute("uv"))geometry.setAttribute("uv",new THREE.BufferAttribute(new Float32Array(geometry.getAttribute("position").count*2),2));return geometry}
export function applyCarPalette(root,palette){
  const materials=new Map(),clone=material=>{if(!material)return material;if(!materials.has(material))materials.set(material,configureCarMaterial(cloneMaterial(material)));return materials.get(material)};root.traverse(object=>{if(!object.isMesh)return;object.geometry=object.geometry.clone();object.material=Array.isArray(object.material)?object.material.map(clone):clone(object.material);for(const material of(Array.isArray(object.material)?object.material:[object.material])){const name=material?.name||"";if(name.startsWith("Paint 1")||name.includes("BaseColor"))setColor(material,palette?.primary);else if(name.startsWith("Paint 2")||name.includes("2ndColor"))setColor(material,palette?.secondary);else if(name==="Brake"||name.includes("3rdColor"))setColor(material,palette?.accent);material.needsUpdate=true}});return root;
}
export function inspectAuthoredCar(scene,THREE){
  scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(scene),size=box.getSize(new THREE.Vector3()),wheels=WHEEL_ORDER.map(name=>{const node=scene.getObjectByName(name);if(!node)throw new Error(`Missing authored wheel group: ${name}`);const bounds=new THREE.Box3().setFromObject(node),center=bounds.getCenter(new THREE.Vector3()),wheelSize=bounds.getSize(new THREE.Vector3());return{name,center:[center.x,center.y,center.z],size:[wheelSize.x,wheelSize.y,wheelSize.z]}});return{bounds:{min:box.min.toArray(),max:box.max.toArray(),size:size.toArray()},wheels};
}
function bakeWheel(THREE,model,wheelNode){
  model.updateMatrixWorld(true);const inverseModel=model.matrixWorld.clone().invert(),parts=[],bounds=new THREE.Box3();let authoredRim=false;
  wheelNode.traverse(source=>{if((source.name||"").endsWith("Rim"))authoredRim=true;if(!source.isMesh)return;const geometry=normalizeMergeGeometry(THREE,source.geometry.clone()),matrix=inverseModel.clone().multiply(source.matrixWorld);geometry.applyMatrix4(matrix);geometry.computeBoundingBox();bounds.union(geometry.boundingBox);parts.push({geometry,material:cloneMaterial(source.material),castShadow:source.castShadow,receiveShadow:source.receiveShadow})});
  if(bounds.isEmpty())throw new Error(`Wheel ${wheelNode.name} has no renderable geometry`);const center=bounds.getCenter(new THREE.Vector3()),steer=new THREE.Group(),roll=new THREE.Group();steer.name=`${wheelNode.name}Steer`;roll.name=`${wheelNode.name}Roll`;steer.position.copy(center);steer.add(roll);if(authoredRim){for(const part of parts){part.geometry.translate(-center.x,-center.y,-center.z);const mesh=new THREE.Mesh(part.geometry,part.material);mesh.castShadow=part.castShadow;mesh.receiveShadow=part.receiveShadow;roll.add(mesh)}}else{const tires=[],metals=[];for(const part of parts){part.geometry.translate(-center.x,-center.y,-center.z);((part.material?.name||"").startsWith("Tire")?tires:metals).push(part.geometry);part.material?.dispose?.()}const size=bounds.getSize(new THREE.Vector3()),hubGeometry=new THREE.CylinderGeometry(Math.min(size.y,size.z)*.28,Math.min(size.y,size.z)*.34,Math.max(.08,size.x*.42),12);hubGeometry.rotateZ(Math.PI/2);metals.push(hubGeometry);for(const[name,geometries,material]of[["Tire",tires,new THREE.MeshStandardMaterial({color:0x12181b,metalness:.05,roughness:.72})],["Hub",metals,new THREE.MeshStandardMaterial({color:0x26343b,metalness:.72,roughness:.3})]]){if(!geometries.length)continue;const geometry=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);if(!geometry)throw new Error(`Unable to merge ${wheelNode.name} ${name}`);const mesh=new THREE.Mesh(geometry,material);mesh.name=`${wheelNode.name}Race${name}`;mesh.castShadow=true;mesh.receiveShadow=true;roll.add(mesh)}}return{root:steer,roll,center:center.clone(),name:wheelNode.name};
}
function mergeStaticBody(THREE,model){
  model.updateMatrixWorld(true);const inverse=model.matrixWorld.clone().invert(),groups=new Map(),sources=[];model.traverse(object=>{if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];if(materials.length!==1)return;const geometry=normalizeMergeGeometry(THREE,object.geometry.clone()),matrix=inverse.clone().multiply(object.matrixWorld);geometry.applyMatrix4(matrix);const list=groups.get(materials[0])||[];list.push(geometry);groups.set(materials[0],list);sources.push(object)});for(const source of sources){source.geometry.dispose();source.removeFromParent()}let count=0;for(const[material,geometries]of groups){const geometry=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);if(!geometry)throw new Error(`Unable to merge GT body material ${material?.name||"unnamed"}`);const mesh=new THREE.Mesh(geometry,material),nonStructural=/glass|cockpit|headlight|brakelight|signallight/i.test(material?.name||"");mesh.name=`ApexMergedBody${count++}`;mesh.castShadow=!nonStructural;mesh.receiveShadow=!/glass|cockpit/i.test(material?.name||"");mesh.userData.apexShadowPolicy=true;model.add(mesh)}return count;
}
export function createRaceCarVisual({THREE,sourceScene,palette,targetLength=4.55}){
  const model=applyCarPalette(sourceScene.clone(true),palette);addCockpitBackings(THREE,model);const wheelNodes=RACE_WHEEL_ORDER.map(name=>model.getObjectByName(name));if(wheelNodes.some(node=>!node))throw new Error("Car asset does not expose all four authored wheel groups");model.updateMatrixWorld(true);const wheels=wheelNodes.map(node=>bakeWheel(THREE,model,node));wheelNodes.forEach(node=>{node.traverse(object=>{if(object.isMesh)object.geometry.dispose()});node.removeFromParent()});const bodyMeshes=mergeStaticBody(THREE,model);wheels.forEach(wheel=>model.add(wheel.root));
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),sourceLength=Math.max(size.x,size.z),scale=targetLength/sourceLength,lateralScale=scale*.72,authoredWheelY=wheels.reduce((sum,wheel)=>sum+wheel.center.y,0)/wheels.length,bodyVerticalOffset=RACE_WHEEL_TARGETS[0].y-authoredWheelY*scale,visualRoot=new THREE.Group();visualRoot.name="ApexSelectedCar";model.rotation.y=Math.PI/2;model.scale.set(lateralScale,scale,scale);model.position.y=bodyVerticalOffset;visualRoot.add(model);model.traverse(object=>{if(object.isMesh&&object.userData.apexShadowPolicy!==true){object.castShadow=true;object.receiveShadow=true}});
  function setChassisPose(position,quaternion){visualRoot.position.copy(position);visualRoot.quaternion.copy(quaternion)}
  function setWheelState(index,{steering=0,rotation=0,suspensionOffset=0}={}){const wheel=wheels[index],target=RACE_WHEEL_TARGETS[index];if(!wheel||!target)return;wheel.root.rotation.y=steering;wheel.root.position.set(-target.z/lateralScale,(target.y+suspensionOffset-bodyVerticalOffset)/scale,target.x/scale);wheel.roll.rotation.x=rotation}
  function dispose(){model.traverse(object=>{if(!object.isMesh)return;object.geometry?.dispose?.();for(const material of(Array.isArray(object.material)?object.material:[object.material]))material?.dispose?.()})}
  let drawMeshes=0;model.traverse(object=>{if(object.isMesh)drawMeshes++});return{root:visualRoot,model,wheels,setChassisPose,setWheelState,dispose,metrics:{sourceLength,scale,lateralScale,targetLength,rollAxis:"x",bodyMeshes,drawMeshes,bodyVerticalOffset}};
}
export function createStaticCarVisual({THREE,sourceScene,palette,targetLength=4.55}){const model=applyCarPalette(sourceScene.clone(true),palette);addCockpitBackings(THREE,model);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),sourceLength=Math.max(size.x,size.y,size.z),root=new THREE.Group(),scale=targetLength/sourceLength;model.scale.setScalar(scale);root.add(model);model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true}});return{root,model,metrics:{sourceLength,scale,targetLength},dispose(){model.traverse(object=>{if(!object.isMesh)return;object.geometry.dispose();for(const material of(Array.isArray(object.material)?object.material:[object.material]))material.dispose()})}}}
