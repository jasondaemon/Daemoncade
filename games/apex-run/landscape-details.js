const MODEL_PATHS=["./assets/polyhaven/shrub-02/shrub_02_1k.gltf","./assets/polyhaven/rock-moss-set-01/rock_moss_set_01_1k.gltf"];

export function macroTerrainPlacements(samples,quality="high"){
  const limit=quality==="low"?4:quality==="medium"?8:12,result=[];
  for(let slot=0;slot<limit;slot++){
    const quarter=slot%4,index=Math.min(samples.length-1,Math.floor((quarter+(Math.floor(slot/4)+.55)/(limit/4))*samples.length/4)),sample=samples[index],preferred=(slot+quarter)%2?sample.left:sample.right,radius=30+(slot%3)*7,height=4.5+(slot%4)*1.25;
    let accepted=false;for(const side of[preferred,preferred===sample.left?sample.right:sample.left]){const dx=side.x-sample.x,dz=side.z-sample.z,length=Math.hypot(dx,dz)||1;for(const offset of[74,88,104,122,144,168]){const x=side.x+dx/length*offset,z=side.z+dz/length*offset,clearance=samples.reduce((best,road)=>Math.min(best,Math.hypot(x-road.x,z-road.z)-road.width/2-radius),Infinity);if(clearance>=20){result.push({x,y:.3,z,radius,height,rotation:(slot*.73)%Math.PI,quarter,clearance,bed:slot%2?"soil":"gravel"});accepted=true;break}}if(accepted)break}
  }
  return result;
}

export function landscapePlacements(samples,quality="high"){
  const limit=quality==="low"?32:quality==="medium"?64:96,candidates=[];
  for(let quarter=0;quarter<4;quarter++){const count=limit/4,start=Math.floor(samples.length*quarter/4),end=Math.floor(samples.length*(quarter+1)/4);for(let slot=0;slot<count;slot++){const i=Math.min(end-1,Math.floor(start+(slot+.5)*(end-start)/count)),sample=samples[i],preferred=(quarter+slot)%2?sample.left:sample.right,other=preferred===sample.left?sample.right:sample.left,scale=.78+((quarter*7+slot*3)%6)*.1,variant=(quarter+slot)%2,radius=(variant?6.5:4)*scale;let accepted=null;for(const side of[preferred,other]){const dx=side.x-sample.x,dz=side.z-sample.z,length=Math.hypot(dx,dz)||1;for(const offset of[22,30,38,46,56,72,88]){const placement={x:side.x+dx/length*offset,y:.35,z:side.z+dz/length*offset,scale,rotation:(quarter*1.7+slot*.91)%Math.PI*2,variant,radius,quarter};const clearance=samples.reduce((best,road)=>Math.min(best,Math.hypot(placement.x-road.x,placement.z-road.z)-road.width/2-radius),Infinity);if(clearance>=12){accepted={...placement,clearance};break}}if(accepted)break}if(accepted)candidates.push(accepted)}}
  return candidates;
}

export async function addLandscapeDetails(THREE,scene,assetLoader,samples,quality="high"){
  const placements=landscapePlacements(samples,quality),terrain=macroTerrainPlacements(samples,quality),loaded=await Promise.all(MODEL_PATHS.map(path=>assetLoader.loadAsync(path).then(result=>result.scene).catch(()=>null))),meshes=[];
  const soilMaterial=new THREE.MeshStandardMaterial({color:0x786650,roughness:1}),gravelMaterial=new THREE.MeshStandardMaterial({color:0x777975,roughness:.96}),bermMaterial=new THREE.MeshStandardMaterial({color:0x69775e,roughness:1,vertexColors:true});
  for(const patch of terrain){const segments=quality==="low"?16:24,bedPositions=[0,.01,0],bedIndices=[];for(let segment=0;segment<segments;segment++){const angle=segment/segments*Math.PI*2,edge=patch.radius*(1.12+.12*Math.sin(segment*2.7+patch.rotation));bedPositions.push(Math.cos(angle)*edge,.01,Math.sin(angle)*edge);bedIndices.push(0,segment+1,(segment+1)%segments+1)}const bedGeometry=new THREE.BufferGeometry();bedGeometry.setAttribute("position",new THREE.Float32BufferAttribute(bedPositions,3));bedGeometry.setIndex(bedIndices);bedGeometry.computeVertexNormals();const bed=new THREE.Mesh(bedGeometry,patch.bed==="soil"?soilMaterial:gravelMaterial);bed.position.set(patch.x,.35,patch.z);bed.rotation.y=patch.rotation;bed.receiveShadow=true;scene.add(bed);meshes.push(bed);
    const rings=4,positions=[],colors=[],indices=[];for(let ring=0;ring<=rings;ring++)for(let segment=0;segment<segments;segment++){const angle=segment/segments*Math.PI*2,jitter=1+.13*Math.sin(segment*2.3+patch.rotation*3)+.06*Math.cos(segment*4.7),fraction=ring/rings,radius=patch.radius*fraction*jitter,height=patch.height*Math.pow(1-fraction,1.65)*(1+.09*Math.sin(angle*3+patch.rotation));positions.push(Math.cos(angle)*radius,height,Math.sin(angle)*radius*.62);const tone=.75+.25*(1-fraction);colors.push(.41*tone,.48*tone,.36*tone)}for(let ring=0;ring<rings;ring++)for(let segment=0;segment<segments;segment++){const a=ring*segments+segment,b=ring*segments+(segment+1)%segments,c=(ring+1)*segments+segment,d=(ring+1)*segments+(segment+1)%segments;indices.push(a,c,b,b,c,d)}const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();const ridge=new THREE.Mesh(geometry,bermMaterial);ridge.position.set(patch.x,patch.y,patch.z);ridge.rotation.y=patch.rotation;ridge.castShadow=quality!=="low";ridge.receiveShadow=true;scene.add(ridge);meshes.push(ridge)}
  for(let variant=0;variant<loaded.length;variant++){
    const source=loaded[variant];if(!source)continue;
    const variantPlacements=placements.filter(item=>item.variant===variant),sourceMeshes=[];source.updateMatrixWorld(true);source.traverse(object=>{if(object.isMesh)sourceMeshes.push(object)});sourceMeshes.sort((a,b)=>(a.geometry.index?.count||a.geometry.attributes.position.count)-(b.geometry.index?.count||b.geometry.attributes.position.count));const selectedMeshes=quality==="low"?sourceMeshes.slice(0,1):quality==="medium"?sourceMeshes.slice(0,Math.min(3,sourceMeshes.length)):sourceMeshes;
    selectedMeshes.forEach((object,meshIndex)=>{for(let quarter=0;quarter<4;quarter++){
      const quarterPlacements=variantPlacements.filter(item=>item.quarter===quarter),meshPlacements=quarterPlacements.filter((_,index)=>index%selectedMeshes.length===meshIndex);if(!meshPlacements.length)continue;
      // Asset-set files arrange several independent variants in one scene. Bake each
      // node's authored transform, recenter it, and assign one variant per placement;
      // instancing every node at every point would create an implausible overlapping pile.
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);geometry.computeBoundingBox();const bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.computeBoundingBox();
      const baseHeight=variant?3.8:2.6,scaleBase=baseHeight/(size.y||1),instanced=new THREE.InstancedMesh(geometry,object.material,meshPlacements.length),dummy=new THREE.Object3D();meshPlacements.forEach((placement,index)=>{const scale=scaleBase*placement.scale;dummy.position.set(placement.x,.35,placement.z);dummy.rotation.y=placement.rotation;dummy.scale.setScalar(scale);dummy.updateMatrix();instanced.setMatrixAt(index,dummy.matrix)});instanced.instanceMatrix.needsUpdate=true;instanced.castShadow=quality==="high";instanced.receiveShadow=true;scene.add(instanced);meshes.push(instanced)
    }})
  }
  return{meshes,count:placements.length,placements,terrain};
}
