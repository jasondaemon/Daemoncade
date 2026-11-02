function roundedBox(THREE,width,height,depth,radius,material){
  const x=width/2,y=height/2,r=Math.min(radius,x,y),shape=new THREE.Shape();
  shape.moveTo(-x+r,-y);shape.lineTo(x-r,-y);shape.quadraticCurveTo(x,-y,x,-y+r);
  shape.lineTo(x,y-r);shape.quadraticCurveTo(x,y,x-r,y);shape.lineTo(-x+r,y);
  shape.quadraticCurveTo(-x,y,-x,y-r);shape.lineTo(-x,-y+r);shape.quadraticCurveTo(-x,-y,-x+r,-y);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.08,bevelThickness:.08});
  geometry.translate(0,0,-depth/2);geometry.computeVertexNormals();return new THREE.Mesh(geometry,material);
}

function addInstances(THREE,group,geometry,material,items,castShadow=true){
  const mesh=new THREE.InstancedMesh(geometry,material,items.length),dummy=new THREE.Object3D();
  items.forEach(([x,y,z,rx=0],index)=>{dummy.position.set(x,y,z);dummy.rotation.set(rx,0,0);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix)});
  mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=castShadow;mesh.receiveShadow=true;group.add(mesh);return mesh;
}

export const PADDOCK_BUDGET=Object.freeze({drawMeshes:23,uniqueMaterials:7,maxTriangles:24000});
export function paddockLayout(roadWidth){
  const roadHalf=roadWidth/2,sideSetback=roadHalf+26;
  return Object.freeze({roadHalf,sideSetback});
}

export function addPaddockArchitecture(THREE,scene,sample,rotation){
  const group=new THREE.Group(),graphite=new THREE.MeshStandardMaterial({color:0x202a31,metalness:.38,roughness:.36}),
    concrete=new THREE.MeshStandardMaterial({color:0xd8d3c7,metalness:.04,roughness:.68}),
    white=new THREE.MeshStandardMaterial({color:0xf3f1e9,metalness:.08,roughness:.42}),
    cyan=new THREE.MeshStandardMaterial({color:0x4de7f2,emissive:0x123940,emissiveIntensity:.72,metalness:.45,roughness:.25}),
    gold=new THREE.MeshStandardMaterial({color:0xffc74a,emissive:0x3a2404,emissiveIntensity:.35,metalness:.38,roughness:.3}),
    glass=new THREE.MeshStandardMaterial({color:0x5e8997,metalness:.55,roughness:.16,transparent:true,opacity:.72}),
    recess=new THREE.MeshStandardMaterial({color:0x10171c,metalness:.18,roughness:.58});
  const add=(mesh,x,y,z,materialShadow=true)=>{mesh.position.set(x,y,z);mesh.castShadow=materialShadow;mesh.receiveShadow=true;group.add(mesh);return mesh};

  // Roadside pit building: a recessed garage rhythm, glazed race-control floor,
  // framed canopy and parapet. It is authored as one composition instead of a
  // uniformly scaled low-poly kit prop.
  const layout=paddockLayout(sample.width),side=layout.sideSetback,buildingX=39,buildingZ=-side;
  add(roundedBox(THREE,76,1.1,19,.7,concrete),buildingX,.55,buildingZ);
  add(roundedBox(THREE,76,2.1,18,.65,graphite),buildingX,10.8,buildingZ-.4);
  add(roundedBox(THREE,73,.85,3.2,.35,white),buildingX,8.15,buildingZ+7.55);
  add(roundedBox(THREE,75,.42,4.2,.24,graphite),buildingX,7.55,buildingZ+9.05);
  add(roundedBox(THREE,65,.22,.28,.1,cyan),buildingX,10.9,buildingZ+9.1,false);
  const bayXs=Array.from({length:7},(_,bay)=>buildingX-30+bay*10),canopyXs=[buildingX-33,buildingX-11,buildingX+11,buildingX+33];
  addInstances(THREE,group,new THREE.BoxGeometry(8.3,5.5,.34),recess,bayXs.map(x=>[x,3.75,buildingZ+9.02]));
  addInstances(THREE,group,new THREE.BoxGeometry(7.35,.11,.08),white,bayXs.flatMap(x=>[[x,1.6,buildingZ+9.23],[x,3.7,buildingZ+9.23]]),false);
  addInstances(THREE,group,new THREE.BoxGeometry(7.35,.11,.08),graphite,bayXs.flatMap(x=>[[x,2.65,buildingZ+9.23],[x,4.75,buildingZ+9.23]]),false);
  addInstances(THREE,group,new THREE.BoxGeometry(.62,6.3,.7),concrete,bayXs.map(x=>[x-4.7,3.5,buildingZ+9.18]));
  addInstances(THREE,group,new THREE.BoxGeometry(5.6,.13,.12),cyan,bayXs.filter((_,i)=>i%2===0).map(x=>[x,6.75,buildingZ+9.24]),false);
  addInstances(THREE,group,new THREE.BoxGeometry(5.6,.13,.12),gold,bayXs.filter((_,i)=>i%2===1).map(x=>[x,6.75,buildingZ+9.24]),false);
  addInstances(THREE,group,new THREE.BoxGeometry(4.45,2.35,.18),glass,Array.from({length:12},(_,window)=>[buildingX-32.5+window*5.9,9.35,buildingZ+8.72]));
  addInstances(THREE,group,new THREE.BoxGeometry(.48,8.1,.48),graphite,canopyXs.map(x=>[x,8.5,buildingZ+10.45]));
  addInstances(THREE,group,new THREE.BoxGeometry(.28,5.2,.28),graphite,canopyXs.map(x=>[x,10.2,buildingZ+8.95,-.58]));

  // Opposite-side timing pavilion gives the start a recognizable silhouette
  // without enclosing the course or blocking the chase camera.
  const towerZ=layout.sideSetback+1,towerX=18;
  add(roundedBox(THREE,22,1.2,15,.7,concrete),towerX,.6,towerZ);
  add(roundedBox(THREE,19,9.8,12,.8,graphite),towerX,5.7,towerZ);
  add(roundedBox(THREE,17,6.3,12.5,.65,glass),towerX,12.9,towerZ);
  add(roundedBox(THREE,23,.7,16,.3,white),towerX,16.35,towerZ);
  add(new THREE.Mesh(new THREE.BoxGeometry(17.5,.25,.3),cyan),towerX,15.45,towerZ-6.4,false);
  addInstances(THREE,group,new THREE.BoxGeometry(.42,6.1,.42),graphite,[towerX-7.3,towerX,towerX+7.3].map(x=>[x,12.8,towerZ-6.65]));
  const balcony=add(roundedBox(THREE,25,.42,4,.2,graphite),towerX,10.1,towerZ-7.1);balcony.castShadow=true;
  addInstances(THREE,group,new THREE.BoxGeometry(3.1,1.1,.16),cyan,[0,1,3,4].map(panel=>[towerX-7.2+panel*3.6,7.2,towerZ-6.18]),false);
  addInstances(THREE,group,new THREE.BoxGeometry(3.1,1.1,.16),gold,[[towerX,7.2,towerZ-6.18]],false);

  group.position.set(sample.x,sample.y,sample.z);group.quaternion.set(rotation.x,rotation.y,rotation.z,rotation.w);scene.add(group);
  return group;
}
