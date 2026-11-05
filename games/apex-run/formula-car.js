export const FORMULA_VISUAL={
  length:4.99,width:2.63,height:1.3,
  frontAxle:1.55,rearAxle:-1.45,trackHalf:1.02,
  frontWingX:2.7,rearWingX:-2.35,cockpitX:-.15,
  sourceFrontAxle:4.344886,sourceRearAxle:-2.968857,sourceTrackHalf:1.996825,
  scale:{width:.510815,height:.466635,length:.410206},
  offset:{x:-.232,y:-.8},
  asset:"assets/low-poly-f1.glb"
};

const WHEEL_NAMES=["FR_Tire","FL_Tire","RR_Tire","RL_Tire"];
const defaultMaterials={
  BaseColor:{color:0x19c6d7,metalness:.42,roughness:.3},
  Dark_Black:{color:0x10161a,metalness:.5,roughness:.34},
  "2ndColor":{color:0xffc83d,metalness:.32,roughness:.38},
  "3rdColor":{color:0xeaf7f7,metalness:.2,roughness:.4},
  Mirror:{color:0x9dd9e2,metalness:.75,roughness:.16},
  Bloody_Red:{color:0xa8bac5,metalness:.82,roughness:.2}
};

function materialParameters(THREE,source,colors){
  const parameters={...(defaultMaterials[source?.name]||defaultMaterials.Dark_Black)};
  if(source?.name==="BaseColor"&&colors?.primary)parameters.color=new THREE.Color(colors.primary);
  else if(source?.name==="2ndColor"&&colors?.secondary)parameters.color=new THREE.Color(colors.secondary);
  else if(source?.name==="3rdColor"&&colors?.accent)parameters.color=new THREE.Color(colors.accent);
  return parameters;
}
function materialFor(THREE,source,ghost=false,colors=null){
  if(ghost)return new THREE.MeshStandardMaterial({color:0xbef8ff,emissive:0x30d7ff,emissiveIntensity:1,transparent:true,opacity:.27,depthWrite:false});
  const material=new THREE.MeshStandardMaterial(materialParameters(THREE,source,colors));material.name=source?.name||"Dark_Black";return material;
}

function removeWheels(root){for(const name of WHEEL_NAMES)root.getObjectByName(name)?.removeFromParent()}
function style(root,THREE,ghost=false,colors=null){root.traverse(object=>{if(!object.isMesh)return;object.material=materialFor(THREE,object.material,ghost,colors);object.castShadow=!ghost;object.receiveShadow=!ghost});return root}
function orient(root){root.rotation.y=Math.PI/2;root.scale.set(FORMULA_VISUAL.scale.width,FORMULA_VISUAL.scale.height,FORMULA_VISUAL.scale.length);root.position.set(FORMULA_VISUAL.offset.x,FORMULA_VISUAL.offset.y,0);return root}

export function makeFormulaCar(THREE,assetScene,colors=null){
  const group=new THREE.Group();group.name="formula-car";const model=assetScene.clone(true);removeWheels(model);style(model,THREE,false,colors);orient(model);group.add(model);return group;
}

function displayGeometry(THREE,assetScene,wheels=false){const model=assetScene.clone(true);orient(model);model.updateMatrixWorld(true);const geometries=[];model.traverse(object=>{if(!object.isMesh)return;let node=object,isWheel=false;while(node){if(WHEEL_NAMES.includes(node.name)){isWheel=true;break}node=node.parent}if(isWheel!==wheels)return;let geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);for(const name of Object.keys(geometry.attributes))if(name!=="position"&&name!=="normal")geometry.deleteAttribute(name);if(geometry.index)geometry=geometry.toNonIndexed();geometries.push(geometry)});return mergeGeometries(geometries,false)}
export function makeFormulaDisplayLod(THREE,assetScene){return{bodyGeometry:displayGeometry(THREE,assetScene,false),wheelGeometry:displayGeometry(THREE,assetScene,true)}}

function centeredWheel(THREE,assetScene,name,ghost=false){
  const source=assetScene.getObjectByName(name);if(!source)throw new Error(`Formula asset is missing ${name}`);
  // The source FBX wheel parent matrices contain opposite +/-4 degree static
  // camber plus placement/scale. Keeping that matrix while rolling around the
  // runtime local-Z axle makes the tire plane cone visibly. Preserve the
  // authored tire/hub child geometry, but normalize away source placement and
  // camber before establishing the exact runtime steering/roll hierarchy.
  const model=new THREE.Group();for(const child of source.children)model.add(child.clone(true));model.updateWorldMatrix(true,true);const center=new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()),centerer=new THREE.Group();model.position.sub(center);centerer.add(model);style(centerer,THREE,ghost);centerer.rotation.y=Math.PI/2;centerer.scale.set(FORMULA_VISUAL.scale.width,FORMULA_VISUAL.scale.height,FORMULA_VISUAL.scale.height);return centerer;
}

export function makeFormulaWheelVisual(THREE,assetScene,index,ghost=false){
  const root=new THREE.Group(),steer=new THREE.Group(),roll=new THREE.Group(),tire=centeredWheel(THREE,assetScene,WHEEL_NAMES[index],ghost);roll.add(tire);steer.add(roll);root.add(steer);return{root,steer,roll,tire};
}

export function makeFormulaGhost(THREE,car,wheelOffsets,assetScene){
  const ghost=car.clone(true);ghost.name="formula-ghost";style(ghost,THREE,true);wheelOffsets.forEach((offset,index)=>{const wheel=makeFormulaWheelVisual(THREE,assetScene,index,true);wheel.root.position.set(offset.x,-.4,offset.z);ghost.add(wheel.root)});ghost.visible=false;return ghost;
}
import {mergeGeometries} from "../vendor/three/addons/utils/BufferGeometryUtils.js";
