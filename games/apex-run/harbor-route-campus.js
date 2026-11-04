// Route-point anchors survive centerline edits; raw sample numbers silently
// attached these buildings to different corners when the breakwater changed.
const harborRouteSample=(point,offset=0)=>10+point*100+offset;
const CAMPUS_SAMPLES=[[19,-10],[19,40],[19,90],[20,40],[20,90],[21,40]].map(([point,offset])=>harborRouteSample(point,offset));
const CAMPUS_ROAD_START=harborRouteSample(18,70),CAMPUS_ROAD_END=harborRouteSample(21,50);

function frame(samples,index){
  const sample=samples[index],before=samples[Math.max(0,index-2)],after=samples[Math.min(samples.length-1,index+2)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1;
  return{sample,tx:dx/length,tz:dz/length,nx:-dz/length,nz:dx/length,heading:-Math.atan2(dz,dx)};
}

export function harborCampusSpecs(samples){
  return CAMPUS_SAMPLES.map((sampleIndex,index)=>{const f=frame(samples,sampleIndex),offset=-40;return{sampleIndex,index,x:f.sample.x+f.nx*offset,z:f.sample.z+f.nz*offset,heading:f.heading,width:26+(index%3)*4,height:7.5+(index%2)*2.2,depth:15+(index%2)*3}});
}

function compose(dummy,spec,x,y,z,sx,sy,sz){dummy.position.set(spec.x+Math.cos(spec.heading)*x+Math.sin(spec.heading)*z,y,spec.z-Math.sin(spec.heading)*x+Math.cos(spec.heading)*z);dummy.rotation.set(0,spec.heading,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();return dummy.matrix.clone()}

export function metreBox(THREE,width,height,depth,metres=2.4){
  const geometry=new THREE.BoxGeometry(width,height,depth),position=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
  for(let index=0;index<position.count;index++){
    const nx=Math.abs(normal.getX(index)),ny=Math.abs(normal.getY(index)),nz=Math.abs(normal.getZ(index));
    if(nx>=ny&&nx>=nz)uv.setXY(index,position.getZ(index)/metres,position.getY(index)/metres);else if(ny>=nz)uv.setXY(index,position.getX(index)/metres,position.getZ(index)/metres);else uv.setXY(index,position.getX(index)/metres,position.getY(index)/metres);
  }
  uv.needsUpdate=true;geometry.userData.metresPerTile=metres;return geometry;
}

export function addHarborRouteCampus(THREE,scene,samples,quality="high",maps={}){
  if(quality==="low")return null;
  const specs=harborCampusSpecs(samples),group=new THREE.Group(),dummy=new THREE.Object3D(),concrete=new THREE.MeshStandardMaterial({color:0x8b9492,map:maps.concreteColor||null,normalMap:quality==="high"?maps.concreteNormal||null:null,roughnessMap:maps.concreteArm||null,roughness:.88}),graphite=new THREE.MeshStandardMaterial({color:0x273238,roughness:.48,metalness:.42}),glass=new THREE.MeshStandardMaterial({color:0x2d7180,roughness:.16,metalness:.34}),accent=new THREE.MeshStandardMaterial({color:0x3ed2df,emissive:0x083f47,emissiveIntensity:.45,roughness:.42}),cargo=new THREE.MeshStandardMaterial({color:0xc86738,roughness:.67,metalness:.18});
  const add=(geometry,material,matrices,shadow=true)=>{const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.castShadow=shadow;mesh.receiveShadow=true;group.add(mesh);return mesh};
  for(const spec of specs){const shell=new THREE.Mesh(metreBox(THREE,spec.width,spec.height,spec.depth),concrete);shell.position.set(spec.x,spec.height/2,spec.z);shell.rotation.y=spec.heading;shell.castShadow=true;shell.receiveShadow=true;shell.userData.harborHallShell=true;group.add(shell)}
  add(new THREE.BoxGeometry(1,1,1),graphite,specs.map(spec=>compose(dummy,spec,0,spec.height+.45,0,spec.width+1.2,.65,spec.depth+1.2)));
  const bays=specs.flatMap(spec=>[-.28,0,.28].map(ratio=>compose(dummy,spec,spec.width*ratio,2.45,spec.depth/2+.12,5.4,4.5,.22)));add(new THREE.BoxGeometry(1,1,1),graphite,bays);
  const framePosts=specs.flatMap(spec=>[-.28,0,.28].flatMap(ratio=>[-1,1].map(side=>compose(dummy,spec,spec.width*ratio+side*2.9,2.55,spec.depth/2+.3,.24,4.9,.26))));add(new THREE.BoxGeometry(1,1,1),concrete,framePosts);
  const frameLintels=specs.flatMap(spec=>[-.28,0,.28].map(ratio=>compose(dummy,spec,spec.width*ratio,5,spec.depth/2+.3,6.05,.28,.26)));add(new THREE.BoxGeometry(1,1,1),concrete,frameLintels);
  const awnings=specs.flatMap(spec=>[-.28,0,.28].map(ratio=>compose(dummy,spec,spec.width*ratio,5.28,spec.depth/2+.95,6.3,.25,1.6)));add(new THREE.BoxGeometry(1,1,1),accent,awnings,false);
  const windows=specs.map(spec=>compose(dummy,spec,0,spec.height-1.35,spec.depth/2+.16,spec.width*.78,1.55,.2));add(new THREE.BoxGeometry(1,1,1),glass,windows,false);
  const vents=specs.flatMap(spec=>[-.25,.25].map(ratio=>compose(dummy,spec,spec.width*ratio,spec.height+1.2,0,2.6,1.45,2.6)));add(new THREE.BoxGeometry(1,1,1),graphite,vents);
  const yards=specs.flatMap((spec,specIndex)=>Array.from({length:specIndex%2?4:2},(_,index)=>compose(dummy,spec,-spec.width*.32+index*5.8,1.55,-spec.depth*.72,5.2,2.6,2.35)));add(new THREE.BoxGeometry(1,1,1),cargo,yards);
  const posts=specs.flatMap(spec=>[-1,1].map(side=>compose(dummy,spec,side*(spec.width/2+2.4),4.4,-spec.depth*.35,.26,8,.26)));add(new THREE.BoxGeometry(1,1,1),graphite,posts);
  const lights=specs.flatMap(spec=>[-1,1].map(side=>compose(dummy,spec,side*(spec.width/2+2.4),8.45,-spec.depth*.35,1.6,.22,.55)));add(new THREE.BoxGeometry(1,1,1),accent,lights,false);

  const positions=[],uvs=[],indices=[];for(let index=CAMPUS_ROAD_START;index<=CAMPUS_ROAD_END;index+=8){const f=frame(samples,index);for(const offset of[-34,-42]){positions.push(f.sample.x+f.nx*offset,.43,f.sample.z+f.nz*offset);uvs.push((index-CAMPUS_ROAD_START)/16,offset===-34?0:1)}}for(let row=0;row<positions.length/6-1;row++){const a=row*2,b=a+1,c=a+2,d=a+3;indices.push(a,c,b,b,c,d)}const roadGeometry=new THREE.BufferGeometry();roadGeometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));roadGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));roadGeometry.setIndex(indices);roadGeometry.computeVertexNormals();const serviceRoad=new THREE.Mesh(roadGeometry,graphite);serviceRoad.receiveShadow=true;serviceRoad.userData.harborServiceRoad=true;group.add(serviceRoad);
  const edgeMatrices=[];for(let index=CAMPUS_ROAD_START;index<=CAMPUS_ROAD_END;index+=16){const f=frame(samples,index),spec={x:f.sample.x+f.nx*-42.4,z:f.sample.z+f.nz*-42.4,heading:f.heading};edgeMatrices.push(compose(dummy,spec,0,.8,0,7.5,1.25,.34))}add(new THREE.BoxGeometry(1,1,1),concrete,edgeMatrices);
  group.userData={harborRouteCampus:true,districts:specs.length,serviceRoad:true,colorDraws:group.children.length,license:"Authored geometry using existing Poly Haven CC0 concrete maps"};scene.add(group);return group;
}
