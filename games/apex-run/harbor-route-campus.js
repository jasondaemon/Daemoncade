const CAMPUS_SAMPLES=[1900,1950,2000,2050,2100,2140];

function frame(samples,index){
  const sample=samples[index],before=samples[Math.max(0,index-2)],after=samples[Math.min(samples.length-1,index+2)],dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1;
  return{sample,tx:dx/length,tz:dz/length,nx:-dz/length,nz:dx/length,heading:-Math.atan2(dz,dx)};
}

export function harborCampusSpecs(samples){
  return CAMPUS_SAMPLES.map((sampleIndex,index)=>{const f=frame(samples,sampleIndex),offset=-40;return{sampleIndex,index,x:f.sample.x+f.nx*offset,z:f.sample.z+f.nz*offset,heading:f.heading,width:26+(index%3)*4,height:7.5+(index%2)*2.2,depth:15+(index%2)*3}});
}

function compose(dummy,spec,x,y,z,sx,sy,sz){dummy.position.set(spec.x+Math.cos(spec.heading)*x+Math.sin(spec.heading)*z,y,spec.z-Math.sin(spec.heading)*x+Math.cos(spec.heading)*z);dummy.rotation.set(0,spec.heading,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();return dummy.matrix.clone()}

export function addHarborRouteCampus(THREE,scene,samples,quality="high",maps={}){
  if(quality==="low")return null;
  const specs=harborCampusSpecs(samples),group=new THREE.Group(),dummy=new THREE.Object3D(),concrete=new THREE.MeshStandardMaterial({color:0x8b9492,map:maps.concreteColor||null,normalMap:quality==="high"?maps.concreteNormal||null:null,roughnessMap:maps.concreteArm||null,roughness:.88}),graphite=new THREE.MeshStandardMaterial({color:0x273238,roughness:.48,metalness:.42}),glass=new THREE.MeshStandardMaterial({color:0x2d7180,roughness:.16,metalness:.34}),accent=new THREE.MeshStandardMaterial({color:0x3ed2df,emissive:0x083f47,emissiveIntensity:.45,roughness:.42}),cargo=new THREE.MeshStandardMaterial({color:0xc86738,roughness:.67,metalness:.18});
  const add=(geometry,material,matrices,shadow=true)=>{const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.castShadow=shadow;mesh.receiveShadow=true;group.add(mesh);return mesh};
  add(new THREE.BoxGeometry(1,1,1),concrete,specs.map(spec=>compose(dummy,spec,0,spec.height/2,0,spec.width,spec.height,spec.depth)));
  add(new THREE.BoxGeometry(1,1,1),graphite,specs.map(spec=>compose(dummy,spec,0,spec.height+.45,0,spec.width+1.2,.65,spec.depth+1.2)));
  add(new THREE.BoxGeometry(1,1,1),glass,specs.map(spec=>compose(dummy,spec,0,spec.height*.58,-spec.depth/2-.03,spec.width*.76,spec.height*.34,.18)),false);
  add(new THREE.BoxGeometry(1,1,1),accent,specs.map(spec=>compose(dummy,spec,0,spec.height*.83,-spec.depth/2-.18,spec.width*.82,.22,.25)),false);
  const yards=specs.flatMap((spec,specIndex)=>Array.from({length:specIndex%2?4:2},(_,index)=>compose(dummy,spec,-spec.width*.32+index*5.8,1.55,spec.depth*.72,5.2,2.6,2.35)));add(new THREE.BoxGeometry(1,1,1),cargo,yards);
  const posts=specs.flatMap(spec=>[-1,1].map(side=>compose(dummy,spec,side*(spec.width/2+2.4),4.4,-spec.depth*.35,.26,8,.26)));add(new THREE.BoxGeometry(1,1,1),graphite,posts);
  const lights=specs.flatMap(spec=>[-1,1].map(side=>compose(dummy,spec,side*(spec.width/2+2.4),8.45,-spec.depth*.35,1.6,.22,.55)));add(new THREE.BoxGeometry(1,1,1),accent,lights,false);

  const positions=[],uvs=[],indices=[];for(let index=1880;index<=2160;index+=8){const f=frame(samples,index);for(const offset of[-34,-42]){positions.push(f.sample.x+f.nx*offset,.43,f.sample.z+f.nz*offset);uvs.push((index-1880)/16,offset===-34?0:1)}}for(let row=0;row<positions.length/6-1;row++){const a=row*2,b=a+1,c=a+2,d=a+3;indices.push(a,c,b,b,c,d)}const roadGeometry=new THREE.BufferGeometry();roadGeometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));roadGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));roadGeometry.setIndex(indices);roadGeometry.computeVertexNormals();const serviceRoad=new THREE.Mesh(roadGeometry,graphite);serviceRoad.receiveShadow=true;serviceRoad.userData.harborServiceRoad=true;group.add(serviceRoad);
  const edgeMatrices=[];for(let index=1880;index<=2160;index+=16){const f=frame(samples,index),spec={x:f.sample.x+f.nx*-42.4,z:f.sample.z+f.nz*-42.4,heading:f.heading};edgeMatrices.push(compose(dummy,spec,0,.8,0,7.5,1.25,.34))}add(new THREE.BoxGeometry(1,1,1),concrete,edgeMatrices);
  group.userData={harborRouteCampus:true,districts:specs.length,serviceRoad:true,colorDraws:group.children.length,license:"Authored geometry using existing Poly Haven CC0 concrete maps"};scene.add(group);return group;
}
