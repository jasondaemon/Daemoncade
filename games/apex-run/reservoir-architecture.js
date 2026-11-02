export function reservoirLayout(start,end,terrainTop=.35){
  const waterY=Math.min(start.y,end.y)-12,waterRadius=62,shoreWidth=9,topRadius=waterRadius+shoreWidth,bottomRadius=topRadius+24;
  return Object.freeze({centerX:(start.x+end.x)/2,centerZ:(start.z+end.z)/2,waterY,waterRadius,shoreWidth,topRadius,bottomRadius,bankBottom:terrainTop-.4,bankTop:waterY-.22,wallHeight:4.5});
}

export function isReservoirFailure(position,layout){
  const radius=Math.hypot(position.x-layout.centerX,position.z-layout.centerZ);
  return radius<=layout.bottomRadius&&position.y<=Math.max(layout.waterY,layout.bankTop+.15);
}

export function addReservoirArchitecture(THREE,scene,start,end,terrainTop=.35){
  const layout=reservoirLayout(start,end,terrainTop),bankHeight=layout.bankTop-layout.bankBottom,
    earth=new THREE.MeshStandardMaterial({color:0x58645b,roughness:.96,metalness:.01}),
    stone=new THREE.MeshStandardMaterial({color:0x767c79,roughness:.82,metalness:.04}),
    waterMaterial=new THREE.MeshStandardMaterial({color:0x176b85,roughness:.18,metalness:.12,transparent:true,opacity:.9});
  const bank=new THREE.Mesh(new THREE.CylinderGeometry(layout.topRadius,layout.bottomRadius,bankHeight,72,3,false),earth);
  bank.position.set(layout.centerX,layout.bankBottom+bankHeight/2,layout.centerZ);bank.castShadow=true;bank.receiveShadow=true;scene.add(bank);
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(layout.topRadius+.8,layout.topRadius+1.9,layout.wallHeight,72,1,true),stone);
  wall.position.set(layout.centerX,layout.bankTop-layout.wallHeight/2+.05,layout.centerZ);wall.castShadow=true;wall.receiveShadow=true;scene.add(wall);
  const coping=new THREE.Mesh(new THREE.TorusGeometry(layout.topRadius+.35,.38,6,72),stone);
  coping.rotation.x=Math.PI/2;coping.position.set(layout.centerX,layout.bankTop+.08,layout.centerZ);coping.castShadow=true;scene.add(coping);
  const water=new THREE.Mesh(new THREE.CircleGeometry(layout.waterRadius,72),waterMaterial);
  water.rotation.x=-Math.PI/2;water.position.set(layout.centerX,layout.waterY,layout.centerZ);water.receiveShadow=true;scene.add(water);
  return{group:[bank,wall,coping,water],layout};
}
