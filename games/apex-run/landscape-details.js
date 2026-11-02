const MODEL_PATHS=["./assets/polyhaven/shrub-02/shrub_02_1k.gltf","./assets/polyhaven/rock-moss-set-01/rock_moss_set_01_1k.gltf"];

export function landscapePlacements(samples,quality="high"){
  const limit=quality==="low"?32:quality==="medium"?64:96,candidates=[];
  for(let quarter=0;quarter<4;quarter++){const count=limit/4,start=Math.floor(samples.length*quarter/4),end=Math.floor(samples.length*(quarter+1)/4);for(let slot=0;slot<count;slot++){const i=Math.min(end-1,Math.floor(start+(slot+.5)*(end-start)/count)),sample=samples[i],preferred=(quarter+slot)%2?sample.left:sample.right,other=preferred===sample.left?sample.right:sample.left,scale=.78+((quarter*7+slot*3)%6)*.1,radius=(slot%2?3.8:2.8)*scale;let accepted=null;for(const side of[preferred,other]){const dx=side.x-sample.x,dz=side.z-sample.z,length=Math.hypot(dx,dz)||1;for(const offset of[22,30,38,46,56,72,88]){const placement={x:side.x+dx/length*offset,y:.35,z:side.z+dz/length*offset,scale,rotation:(quarter*1.7+slot*.91)%Math.PI*2,variant:(quarter+slot)%2,radius,quarter};const clearance=samples.reduce((best,road)=>Math.min(best,Math.hypot(placement.x-road.x,placement.z-road.z)-road.width/2-radius),Infinity);if(clearance>=12){accepted={...placement,clearance};break}}if(accepted)break}if(accepted)candidates.push(accepted)}}
  return candidates;
}

export async function addLandscapeDetails(THREE,scene,assetLoader,samples,quality="high"){
  const placements=landscapePlacements(samples,quality),loaded=await Promise.all(MODEL_PATHS.map(path=>assetLoader.loadAsync(path).then(result=>result.scene).catch(()=>null))),meshes=[];
  for(let variant=0;variant<loaded.length;variant++){
    const source=loaded[variant];if(!source)continue;
    const variantPlacements=placements.filter(item=>item.variant===variant),sourceMeshes=[];source.updateMatrixWorld(true);source.traverse(object=>{if(object.isMesh)sourceMeshes.push(object)});
    sourceMeshes.forEach((object,meshIndex)=>{
      const meshPlacements=variantPlacements.filter((_,index)=>index%sourceMeshes.length===meshIndex);if(!meshPlacements.length)return;
      // Asset-set files arrange several independent variants in one scene. Bake each
      // node's authored transform, recenter it, and assign one variant per placement;
      // instancing every node at every point would create an implausible overlapping pile.
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);geometry.computeBoundingBox();const bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.computeBoundingBox();
      const baseHeight=variant?3.8:2.6,scaleBase=baseHeight/(size.y||1),instanced=new THREE.InstancedMesh(geometry,object.material,meshPlacements.length),dummy=new THREE.Object3D();meshPlacements.forEach((placement,index)=>{const scale=scaleBase*placement.scale;dummy.position.set(placement.x,.35,placement.z);dummy.rotation.y=placement.rotation;dummy.scale.setScalar(scale);dummy.updateMatrix();instanced.setMatrixAt(index,dummy.matrix)});instanced.instanceMatrix.needsUpdate=true;instanced.castShadow=quality!=="low";instanced.receiveShadow=true;scene.add(instanced);meshes.push(instanced)
    })
  }
  return{meshes,count:placements.length,placements};
}
