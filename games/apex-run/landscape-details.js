const MODEL_PATHS=["./assets/polyhaven/shrub-02/shrub_02_1k.gltf","./assets/polyhaven/rock-moss-set-01/rock_moss_set_01_1k.gltf"];

export function macroTerrainPlacements(samples,quality="high"){
  const limit=quality==="low"?4:quality==="medium"?8:12,result=[];
  for(let slot=0;slot<limit;slot++){
    const quarter=slot%4,index=Math.min(samples.length-1,Math.floor((quarter+(Math.floor(slot/4)+.55)/(limit/4))*samples.length/4)),sample=samples[index],preferred=(slot+quarter)%2?sample.left:sample.right,radius=30+(slot%3)*7,height=4+(slot%4)*.6;
    const offsets=slot===6||slot===10?[260,300,340]:[74,88,104,122,144,168];let accepted=false;for(const side of[preferred,preferred===sample.left?sample.right:sample.left]){const dx=side.x-sample.x,dz=side.z-sample.z,length=Math.hypot(dx,dz)||1;for(const offset of offsets){const x=side.x+dx/length*offset,z=side.z+dz/length*offset,clearance=samples.reduce((best,road)=>Math.min(best,Math.hypot(x-road.x,z-road.z)-road.width/2-radius),Infinity);if(clearance>=20){result.push({x,y:.3,z,radius,height,rotation:(slot*.73)%Math.PI,quarter,slot,clearance,bed:slot%2?"soil":"gravel"});accepted=true;break}}if(accepted)break}
  }
  return result;
}

export function landscapePlacements(samples,quality="high"){
  const limit=quality==="low"?32:quality==="medium"?64:96,candidates=[];
  for(let quarter=0;quarter<4;quarter++){const count=limit/4,start=Math.floor(samples.length*quarter/4),end=Math.floor(samples.length*(quarter+1)/4),clusterSize=4,clusterCount=count/clusterSize;for(let slot=0;slot<count;slot++){const cluster=Math.floor(slot/clusterSize),member=slot%clusterSize,center=Math.floor(start+(cluster+.5)*(end-start)/clusterCount),i=Math.max(start,Math.min(end-1,center+(member-1)*3)),sample=samples[i],preferred=(quarter+cluster)%2?sample.left:sample.right,other=preferred===sample.left?sample.right:sample.left,variant=member===0?1:0,scale=variant?.5+((quarter+cluster)%3)*.08:.9+((quarter*5+cluster*2+member)%6)*.11,radius=(variant?3:5.5)*scale;let accepted=null;for(const side of[preferred,other]){const dx=side.x-sample.x,dz=side.z-sample.z,length=Math.hypot(dx,dz)||1;for(const offset of[28+member*7,42+member*7,58+member*8,78+member*9,104+member*10]){const placement={x:side.x+dx/length*offset,y:.35,z:side.z+dz/length*offset,scale,rotation:(quarter*1.7+cluster*1.13+member*.67)%Math.PI*2,variant,radius,quarter,cluster};const clearance=samples.reduce((best,road)=>Math.min(best,Math.hypot(placement.x-road.x,placement.z-road.z)-road.width/2-radius),Infinity);if(clearance>=12){accepted={...placement,clearance};break}}if(accepted)break}if(accepted)candidates.push(accepted)}}
  return candidates;
}

export function landscapeServicePlacements(samples,quality="high"){
  const target=quality==="low"?3:quality==="medium"?6:9,placements=[];
  for(let slot=0;slot<target;slot++){
    const centerIndex=Math.floor((slot+.65)*samples.length/target),span=Math.max(8,Math.floor(samples.length*.018)),side=slot%2?"left":"right",points=[];
    for(let index=Math.max(0,centerIndex-span);index<=Math.min(samples.length-1,centerIndex+span);index+=3){
      const sample=samples[index],edge=sample[side],dx=edge.x-sample.x,dz=edge.z-sample.z,length=Math.hypot(dx,dz)||1,offset=18+(slot%3)*4,x=edge.x+dx/length*offset,z=edge.z+dz/length*offset;
      const clearance=samples.reduce((best,road)=>Math.min(best,Math.hypot(x-road.x,z-road.z)-road.width/2),Infinity);
      if(clearance>=7)points.push({x,y:sample.y+.08,z,index,clearance});
    }
    if(points.length>=4)placements.push({slot,side,points});
  }
  return placements;
}

function serviceRibbonGeometry(THREE,points,width=5.5){
  const positions=[],uvs=[],indices=[];let distance=0;
  points.forEach((point,index)=>{const previous=points[Math.max(0,index-1)],next=points[Math.min(points.length-1,index+1)],dx=next.x-previous.x,dz=next.z-previous.z,length=Math.hypot(dx,dz)||1,lx=-dz/length,lz=dx/length;if(index)distance+=Math.hypot(point.x-points[index-1].x,point.z-points[index-1].z);positions.push(point.x+lx*width/2,point.y,point.z+lz*width/2,point.x-lx*width/2,point.y,point.z-lz*width/2);uvs.push(0,distance/5,1,distance/5);if(index<points.length-1){const a=index*2,b=a+1,c=a+2,d=a+3;indices.push(a,c,b,b,c,d)}});const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry
}

export async function addLandscapeDetails(THREE,scene,assetLoader,samples,quality="high"){
  const placements=landscapePlacements(samples,quality),terrain=macroTerrainPlacements(samples,quality),services=landscapeServicePlacements(samples,quality),loaded=await Promise.all(MODEL_PATHS.map(path=>assetLoader.loadAsync(path).then(result=>result.scene).catch(()=>null))),meshes=[];
  const soilMaterial=new THREE.MeshStandardMaterial({color:0x786650,roughness:1}),gravelMaterial=new THREE.MeshStandardMaterial({color:0x777975,roughness:.96}),bermMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true,emissive:0x182018,emissiveIntensity:.08}),serviceMaterial=new THREE.MeshStandardMaterial({color:0x5c6060,roughness:.96}),fenceMaterial=new THREE.MeshStandardMaterial({color:0x384246,roughness:.6,metalness:.48});
  for(const patch of terrain){const segments=quality==="low"?16:24,bedPositions=[0,.01,0],bedIndices=[];for(let segment=0;segment<segments;segment++){const angle=segment/segments*Math.PI*2,edge=patch.radius*(1.12+.12*Math.sin(segment*2.7+patch.rotation));bedPositions.push(Math.cos(angle)*edge,.01,Math.sin(angle)*edge);bedIndices.push(0,segment+1,(segment+1)%segments+1)}const bedGeometry=new THREE.BufferGeometry();bedGeometry.setAttribute("position",new THREE.Float32BufferAttribute(bedPositions,3));bedGeometry.setIndex(bedIndices);bedGeometry.computeVertexNormals();const bed=new THREE.Mesh(bedGeometry,patch.bed==="soil"?soilMaterial:gravelMaterial);bed.position.set(patch.x,.35,patch.z);bed.rotation.y=patch.rotation;bed.receiveShadow=true;scene.add(bed);meshes.push(bed);
    const rings=quality==="high"?10:quality==="medium"?8:6,positions=[],colors=[],indices=[];for(let ring=0;ring<=rings;ring++)for(let segment=0;segment<segments;segment++){const angle=segment/segments*Math.PI*2,jitter=1+.1*Math.sin(segment*2.3+patch.rotation*3)+.045*Math.cos(segment*4.7),fraction=ring/rings,radius=patch.radius*(ring===0?.04:fraction*jitter),profile=Math.pow(Math.cos(fraction*Math.PI/2),1.15),height=patch.height*profile*(ring===0?1:1+.035*Math.sin(angle*3+patch.rotation));positions.push(Math.cos(angle)*radius,height,Math.sin(angle)*radius*.62);const tone=.88+.12*(1-fraction);colors.push(.4*tone,.48*tone,.36*tone)}for(let ring=0;ring<rings;ring++)for(let segment=0;segment<segments;segment++){const a=ring*segments+segment,b=ring*segments+(segment+1)%segments,c=(ring+1)*segments+segment,d=(ring+1)*segments+(segment+1)%segments;indices.push(a,b,c,b,d,c)}const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();const ridge=new THREE.Mesh(geometry,bermMaterial);ridge.position.set(patch.x,patch.y,patch.z);ridge.rotation.y=patch.rotation;ridge.castShadow=false;ridge.receiveShadow=true;ridge.userData.macroRidgeSlot=patch.slot;scene.add(ridge);meshes.push(ridge)}
  for(let variant=0;variant<loaded.length;variant++){
    const source=loaded[variant];if(!source)continue;
    const variantPlacements=placements.filter(item=>item.variant===variant),sourceMeshes=[];source.updateMatrixWorld(true);source.traverse(object=>{if(object.isMesh)sourceMeshes.push(object)});sourceMeshes.sort((a,b)=>(a.geometry.index?.count||a.geometry.attributes.position.count)-(b.geometry.index?.count||b.geometry.attributes.position.count));const selectedMeshes=quality==="low"?sourceMeshes.slice(0,1):quality==="medium"?sourceMeshes.slice(0,Math.min(3,sourceMeshes.length)):sourceMeshes;
    selectedMeshes.forEach((object,meshIndex)=>{for(let quarter=0;quarter<4;quarter++){
      const quarterPlacements=variantPlacements.filter(item=>item.quarter===quarter),meshPlacements=quarterPlacements.filter((_,index)=>index%selectedMeshes.length===meshIndex);if(!meshPlacements.length)continue;
      // Asset-set files arrange several independent variants in one scene. Bake each
      // node's authored transform, recenter it, and assign one variant per placement;
      // instancing every node at every point would create an implausible overlapping pile.
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);geometry.computeBoundingBox();const bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.computeBoundingBox();
      const baseHeight=variant?1.7:3.6,scaleBase=baseHeight/(size.y||1),instanced=new THREE.InstancedMesh(geometry,object.material,meshPlacements.length),dummy=new THREE.Object3D();meshPlacements.forEach((placement,index)=>{const scale=scaleBase*placement.scale;dummy.position.set(placement.x,.35,placement.z);dummy.rotation.y=placement.rotation;dummy.scale.setScalar(scale);dummy.updateMatrix();instanced.setMatrixAt(index,dummy.matrix)});instanced.instanceMatrix.needsUpdate=true;instanced.castShadow=quality==="high";instanced.receiveShadow=true;scene.add(instanced);meshes.push(instanced)
    }})
  }
  const fenceGeometry=new THREE.BoxGeometry(.16,1.2,.16),fenceDummy=new THREE.Object3D();for(const service of services){const path=new THREE.Mesh(serviceRibbonGeometry(THREE,service.points),serviceMaterial);path.receiveShadow=true;scene.add(path);meshes.push(path);const posts=service.points.filter((_,index)=>index%2===0),fence=new THREE.InstancedMesh(fenceGeometry,fenceMaterial,posts.length);posts.forEach((point,index)=>{fenceDummy.position.set(point.x,point.y+.6,point.z);fenceDummy.updateMatrix();fence.setMatrixAt(index,fenceDummy.matrix)});fence.instanceMatrix.needsUpdate=true;fence.castShadow=quality==="high";fence.receiveShadow=true;scene.add(fence);meshes.push(fence)}
  return{meshes,count:placements.length,placements,terrain,services};
}
