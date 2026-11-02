export const VENUE_IDENTITY=Object.freeze({unit:"metre",colors:Object.freeze({graphite:0x273239,concrete:0xd8d7d1,cyan:0x38d9ef,gold:0xffc74a})});

export function venueMaterials(THREE){return{graphite:new THREE.MeshStandardMaterial({color:VENUE_IDENTITY.colors.graphite,roughness:.48,metalness:.32}),concrete:new THREE.MeshStandardMaterial({color:VENUE_IDENTITY.colors.concrete,roughness:.63,metalness:.06}),cyan:new THREE.MeshStandardMaterial({color:VENUE_IDENTITY.colors.cyan,emissive:0x075565,emissiveIntensity:.48,roughness:.3,metalness:.42})}}

export function addRadialServiceBays(THREE,scene,{x,z,y,radius,count=10,openingAngle=.72}){
  const materials=venueMaterials(THREE),frames=new THREE.InstancedMesh(new THREE.BoxGeometry(7.2,5.4,1.1),materials.graphite,count),panels=new THREE.InstancedMesh(new THREE.BoxGeometry(5.8,3.6,1.24),materials.cyan,count),dummy=new THREE.Object3D();let placed=0;
  for(let index=0;index<count;index++){const angle=openingAngle+(index/(count-1))*(Math.PI*2-openingAngle*2),px=x+Math.cos(angle)*radius,pz=z+Math.sin(angle)*radius;dummy.position.set(px,y+2.7,pz);dummy.rotation.y=-angle;dummy.updateMatrix();frames.setMatrixAt(placed,dummy.matrix);dummy.position.y=y+2.75;dummy.updateMatrix();panels.setMatrixAt(placed,dummy.matrix);placed++}
  for(const mesh of[frames,panels]){mesh.count=placed;mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh)}return{frames,panels,count:placed,materials};
}

export function addServiceCauseway(THREE,scene,{x,y,z,length,rotation=0}){const {graphite,concrete}=venueMaterials(THREE),group=new THREE.Group(),deck=new THREE.Mesh(new THREE.BoxGeometry(length,.7,5.5),concrete),railA=new THREE.Mesh(new THREE.BoxGeometry(length,.45,.32),graphite),railB=railA.clone();deck.position.y=.35;railA.position.set(0,1.1,-2.65);railB.position.set(0,1.1,2.65);for(const mesh of[deck,railA,railB]){mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}group.position.set(x,y,z);group.rotation.y=rotation;scene.add(group);return group}
