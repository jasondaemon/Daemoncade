function mediumGeometry(THREE){
  const profile=[[-.5,0],[.5,0],[.34,.28],[.24,1],[-.24,1],[-.34,.28]],positions=[],indices=[],length=4;
  for(const x of[-length/2,length/2])for(const [z,y] of profile)positions.push(x,y,z);
  const count=profile.length;
  for(let side=0;side<count;side++){const next=(side+1)%count;indices.push(side,next,count+side,next,count+next,count+side)}
  for(let index=1;index<count-1;index++)indices.push(0,index+1,index,count,count+index,count+index+1);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function makeBarrierLOD(THREE,quality){
  const geometry=quality==="low"?new THREE.BoxGeometry(4,1,.8):mediumGeometry(THREE),material=new THREE.MeshStandardMaterial({color:quality==="low"?0xa9a69f:0xb8b3a9,roughness:.88,metalness:.01});
  const mesh=new THREE.Mesh(geometry,material);mesh.name=`apex-barrier-${quality}-lod`;mesh.position.y=.5;return mesh;
}

export function barrierTriangleCount(asset){let triangles=0;asset.traverse(object=>{if(!object.isMesh)return;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3});return triangles}
