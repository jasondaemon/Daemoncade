function fittedWidthClone(THREE,source,name,width){
  const original=source.getObjectByName(name);if(!original)return null;
  const clone=original.clone(true),box=new THREE.Box3().setFromObject(clone),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=width/Math.max(size.x,.001);
  clone.scale.setScalar(scale);clone.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);return clone;
}

export function harborServicePose(samples,index=2200,offset=53){
  const sample=samples[index],before=samples[index-2],after=samples[index+2],tx=after.x-before.x,tz=after.z-before.z,length=Math.hypot(tx,tz)||1,nx=-tz/length,nz=tx/length;
  return{x:sample.x+nx*offset,z:sample.z+nz*offset,heading:-Math.atan2(tz,tx),sampleIndex:index,offset};
}

export function addHarborServiceDistrict(THREE,scene,source,roadSamples,quality="high"){
  if(!source||quality!=="high")return null;
  const pose=harborServicePose(roadSamples),group=new THREE.Group(),concrete=new THREE.MeshStandardMaterial({color:0x7c8788,roughness:.9}),graphite=new THREE.MeshStandardMaterial({color:0x25333a,roughness:.43,metalness:.48}),accent=new THREE.MeshStandardMaterial({color:0x32c4d6,emissive:0x073e47,emissiveIntensity:.45,roughness:.38});
  const apron=new THREE.Mesh(new THREE.BoxGeometry(62,.35,34),concrete);apron.position.y=.2;apron.receiveShadow=true;group.add(apron);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(48,6.8,.5),concrete);wall.position.set(0,3.8,-10.35);group.add(wall);
  const openings=new THREE.InstancedMesh(new THREE.BoxGeometry(5.3,4.7,.12),graphite,6),dummy=new THREE.Object3D();
  for(let index=0;index<6;index++){
    const x=-18+index*7.2;dummy.position.set(x,2.85,-10.68);dummy.updateMatrix();openings.setMatrixAt(index,dummy.matrix);
    const bay=fittedWidthClone(THREE,source,index%3===0?"dado_garage_door_01":"dado_garage_centered_01",7.2);if(bay){bay.position.set(x,.45,-10.82);group.add(bay)}
    const window=fittedWidthClone(THREE,source,"window_centered_medium_03",5.4);if(window){window.position.set(x,3.15,-10.72);group.add(window)}
    const cornice=fittedWidthClone(THREE,source,"cornice03_standard_standard_01",7.2);if(cornice){cornice.position.set(x,6.65,-10.75);group.add(cornice)}
  }
  group.add(openings);
  const posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,3.2,.18),graphite,18),rails=new THREE.InstancedMesh(new THREE.BoxGeometry(3.6,.12,.12),accent,16),lamps=new THREE.InstancedMesh(new THREE.BoxGeometry(.24,6,.24),graphite,4),heads=new THREE.InstancedMesh(new THREE.BoxGeometry(1.2,.25,.45),accent,4);
  for(let index=0;index<18;index++){dummy.position.set(-30+index*3.55,1.8,15.5);dummy.updateMatrix();posts.setMatrixAt(index,dummy.matrix);if(index<16){dummy.position.set(-28.2+index*3.55,2.7,15.5);dummy.updateMatrix();rails.setMatrixAt(index,dummy.matrix)}}
  for(let index=0;index<4;index++){const x=-24+index*16;dummy.position.set(x,3.3,5);dummy.updateMatrix();lamps.setMatrixAt(index,dummy.matrix);dummy.position.y=6.35;dummy.updateMatrix();heads.setMatrixAt(index,dummy.matrix)}
  group.add(posts,rails,lamps,heads);group.position.set(pose.x,.35,pose.z);group.rotation.y=pose.heading;let colorDraws=0,shadowDraws=0;group.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;colorDraws++;shadowDraws++}});group.userData={harborServiceDistrict:true,pose,license:"CC0 factory modules",colorDraws,shadowDraws,totalPasses:colorDraws+shadowDraws};scene.add(group);return group;
}
