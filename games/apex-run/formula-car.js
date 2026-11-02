export const FORMULA_VISUAL={
  length:5.05,width:2.52,height:1.32,
  frontAxle:1.55,rearAxle:-1.45,trackHalf:1.02,
  frontWingX:2.4,rearWingX:-2.08,cockpitX:-.25
};

export function makeFormulaCar(THREE){
  const group=new THREE.Group();group.name="formula-car";
  const paint=new THREE.MeshStandardMaterial({color:0x22c7d8,metalness:.48,roughness:.28}),paintDark=new THREE.MeshStandardMaterial({color:0x087c8b,metalness:.38,roughness:.34}),carbon=new THREE.MeshStandardMaterial({color:0x11161a,metalness:.62,roughness:.3}),gold=new THREE.MeshStandardMaterial({color:0xffc83d,metalness:.35,roughness:.36}),glass=new THREE.MeshPhysicalMaterial({color:0x162934,roughness:.12,metalness:.08,transmission:.18}),driverMat=new THREE.MeshStandardMaterial({color:0xf1f4f2,roughness:.42});
  const add=(name,geometry,material,position,rotation=[0,0,0],scale=[1,1,1])=>{const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
  add("floor",new THREE.BoxGeometry(4.35,.08,1.65),carbon,[-.1,-.32,0]);
  add("monocoque",new THREE.CapsuleGeometry(.38,2.65,5,14),paint,[-.18,.02,0],[0,0,Math.PI/2],[1,.8,1.05]);
  add("nose",new THREE.ConeGeometry(.46,2.5,4),paint,[1.92,-.05,0],[0,0,-Math.PI/2],[1,.68,1]);
  add("nose-stripe",new THREE.BoxGeometry(1.9,.045,.18),gold,[1.65,.23,0]);
  add("front-wing-main",new THREE.BoxGeometry(.34,.075,2.52),carbon,[2.4,-.28,0]);
  add("front-wing-flap",new THREE.BoxGeometry(.28,.055,2.18),gold,[2.2,-.18,0],[0,0,-.08]);
  for(const side of[-1,1])add(`front-endplate-${side}`,new THREE.BoxGeometry(.42,.42,.07),carbon,[2.35,-.1,side*1.23],[0,0,-.06]);
  for(const side of[-1,1]){
    add(`sidepod-${side}`,new THREE.CapsuleGeometry(.34,1.45,5,12),paintDark,[-.38,-.02,side*.77],[0,0,Math.PI/2],[1,.72,1.05]);
    add(`sidepod-livery-${side}`,new THREE.BoxGeometry(1.65,.05,.16),gold,[-.28,.25,side*.96],[side*.15,0,0]);
    add(`rear-haunch-${side}`,new THREE.CapsuleGeometry(.32,.78,5,12),paint,[-1.22,.03,side*.58],[0,0,Math.PI/2],[1,.72,.9]);
  }
  add("engine-cover",new THREE.CapsuleGeometry(.33,1.48,5,14),paint,[-1.02,.38,0],[0,0,Math.PI/2],[1,1.1,.9]);
  add("shark-fin",new THREE.BoxGeometry(1.25,.58,.055),gold,[-1.25,.68,0],[0,0,-.08]);
  add("cockpit-recess",new THREE.SphereGeometry(.52,16,10,0,Math.PI*2,0,Math.PI*.62),glass,[-.22,.42,0],[0,0,0],[1.12,.62,.78]);
  add("driver-helmet",new THREE.SphereGeometry(.24,14,9),driverMat,[-.32,.68,0],[0,0,0],[1,.92,1]);
  add("halo",new THREE.TorusGeometry(.47,.065,8,24,Math.PI),carbon,[-.18,.65,0],[0,Math.PI/2,0]);
  add("halo-pillar",new THREE.BoxGeometry(.08,.58,.08),carbon,[.18,.48,0],[0,0,-.25]);
  add("rear-wing",new THREE.BoxGeometry(.3,.16,2.3),carbon,[-2.08,.76,0]);
  add("rear-wing-flap",new THREE.BoxGeometry(.28,.1,2.12),gold,[-1.98,.96,0],[0,0,.08]);
  for(const side of[-1,1])add(`rear-endplate-${side}`,new THREE.BoxGeometry(.48,.78,.075),carbon,[-2.07,.67,side*1.12]);
  add("diffuser",new THREE.BoxGeometry(.62,.24,1.5),carbon,[-2.13,-.23,0],[0,0,-.12]);
  return group;
}

export function makeFormulaGhost(THREE,car,wheelOffsets){
  const ghost=car.clone(true),material=new THREE.MeshStandardMaterial({color:0xbef8ff,emissive:0x30d7ff,emissiveIntensity:1,transparent:true,opacity:.27,depthWrite:false});
  ghost.name="formula-ghost";ghost.traverse(object=>{if(object.isMesh)object.material=material});
  const tireGeometry=new THREE.CylinderGeometry(.43,.43,.38,18);tireGeometry.rotateX(Math.PI/2);
  for(const offset of wheelOffsets){const wheel=new THREE.Mesh(tireGeometry,material);wheel.position.set(offset.x,-.32,offset.z);ghost.add(wheel)}
  ghost.visible=false;return ghost;
}
