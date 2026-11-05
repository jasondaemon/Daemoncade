import {addRadialServiceBays,addServiceCauseway,venueMaterials} from "./venue-models.js";

export function reservoirTrackEnabled(trackId){return trackId==="summit-circuit"}

export function reservoirLayout(start,end,terrainTop=.35){
  const waterY=Math.min(start.y,end.y)-12,waterRadius=62,shoreWidth=9,topRadius=waterRadius+shoreWidth,bottomRadius=topRadius+24;
  return Object.freeze({centerX:(start.x+end.x)/2,centerZ:(start.z+end.z)/2,waterY,waterRadius,shoreWidth,topRadius,bottomRadius,bankBottom:terrainTop-.4,bankTop:waterY-.22,wallHeight:4.5,terraces:[{radius:bottomRadius,height:8},{radius:bottomRadius-8,height:17},{radius:topRadius+3,height:waterY-terrainTop-.22}]});
}
export function isReservoirFailure(position,layout){
  const radius=Math.hypot(position.x-layout.centerX,position.z-layout.centerZ);
  return radius<=layout.waterRadius&&position.y<=layout.waterY;
}
function metreScaleCylinderUV(geometry,radius,height,metres=2.4){const uv=geometry.attributes.uv;for(let index=0;index<uv.count;index++)uv.setXY(index,uv.getX(index)*Math.PI*2*radius/metres,uv.getY(index)*height/metres);uv.needsUpdate=true;return geometry}

export function addReservoirArchitecture(THREE,scene,start,end,terrainTop=.35,detailMaps={}){
  const layout=reservoirLayout(start,end,terrainTop),
    earth=new THREE.MeshStandardMaterial({color:0x58645b,roughness:.96,metalness:.01}),
    stone=new THREE.MeshStandardMaterial({color:0x9a9a94,map:detailMaps.concreteColor||null,normalMap:detailMaps.concreteNormal||null,roughnessMap:detailMaps.concreteArm||null,normalScale:new THREE.Vector2(.42,.42),roughness:.82,metalness:.04}),
    {graphite,concrete:white,cyan}=venueMaterials(THREE),
    waterMaterial=new THREE.MeshPhysicalMaterial({color:0x176b85,roughness:.12,metalness:.05,transmission:.08,clearcoat:.7,clearcoatRoughness:.18,transparent:true,opacity:.92});
  const structures=[];
  for(const [index,terrace] of layout.terraces.entries()){const lower=index?layout.terraces[index-1].height:0,height=terrace.height-lower,radius=terrace.radius+(index?2.5:0),geometry=new THREE.CylinderGeometry(terrace.radius,terrace.radius+(index?5:0),height,72,1,false);if(index===1)metreScaleCylinderUV(geometry,radius,height);const mesh=new THREE.Mesh(geometry,index===1?stone:earth);mesh.position.set(layout.centerX,terrainTop+lower+height/2,layout.centerZ);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);structures.push(mesh)}
  const wallGeometry=metreScaleCylinderUV(new THREE.CylinderGeometry(layout.topRadius+.8,layout.topRadius+1.9,layout.wallHeight,72,1,true),layout.topRadius+1.35,layout.wallHeight),wall=new THREE.Mesh(wallGeometry,stone);
  wall.position.set(layout.centerX,layout.bankTop-layout.wallHeight/2+.05,layout.centerZ);wall.castShadow=true;wall.receiveShadow=true;scene.add(wall);
  const coping=new THREE.Mesh(new THREE.TorusGeometry(layout.topRadius+.35,.38,6,72),stone);
  coping.rotation.x=Math.PI/2;coping.position.set(layout.centerX,layout.bankTop+.08,layout.centerZ);coping.castShadow=true;scene.add(coping);
  const buttressGeometry=new THREE.BoxGeometry(2.2,layout.bankTop*.72,4.2),buttresses=new THREE.InstancedMesh(buttressGeometry,graphite,12),dummy=new THREE.Object3D();for(let index=0;index<12;index++){const angle=index/12*Math.PI*2,radius=layout.topRadius+3.2;dummy.position.set(layout.centerX+Math.cos(angle)*radius,terrainTop+layout.bankTop*.36,layout.centerZ+Math.sin(angle)*radius);dummy.rotation.y=-angle;dummy.updateMatrix();buttresses.setMatrixAt(index,dummy.matrix)}buttresses.instanceMatrix.needsUpdate=true;buttresses.castShadow=true;scene.add(buttresses);structures.push(buttresses);
  const serviceDeck=new THREE.Mesh(new THREE.TorusGeometry(layout.topRadius+5,2.1,6,72),white);serviceDeck.rotation.x=Math.PI/2;serviceDeck.position.set(layout.centerX,layout.bankTop-1.1,layout.centerZ);serviceDeck.castShadow=true;serviceDeck.receiveShadow=true;scene.add(serviceDeck);structures.push(serviceDeck);
  const control=new THREE.Group(),base=new THREE.Mesh(new THREE.BoxGeometry(18,6,9),graphite),glass=new THREE.Mesh(new THREE.BoxGeometry(14,3.4,9.2),cyan),roof=new THREE.Mesh(new THREE.BoxGeometry(21,.7,11),white);base.position.y=3;glass.position.y=7.4;roof.position.y=9.5;for(const mesh of[base,glass,roof]){mesh.castShadow=true;mesh.receiveShadow=true;control.add(mesh)}control.position.set(layout.centerX+layout.bottomRadius-18,terrainTop,layout.centerZ+34);control.rotation.y=-.48;scene.add(control);structures.push(control);
  const bays=addRadialServiceBays(THREE,scene,{x:layout.centerX,z:layout.centerZ,y:layout.bankTop-1,radius:layout.topRadius+2.4,count:10,openingAngle:.62});structures.push(bays.frames,bays.panels);
  const causeway=addServiceCauseway(THREE,scene,{x:layout.centerX+layout.bottomRadius-35,y:terrainTop+.05,z:layout.centerZ+22,length:64,rotation:-.48});structures.push(causeway);
  const water=new THREE.Mesh(new THREE.CircleGeometry(layout.waterRadius,72),waterMaterial);
  water.rotation.x=-Math.PI/2;water.position.set(layout.centerX,layout.waterY,layout.centerZ);water.receiveShadow=true;scene.add(water);
  return{group:[...structures,wall,coping,water],layout};
}
