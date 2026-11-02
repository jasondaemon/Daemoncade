export async function loadOptionalAssets(loader,names,path="./assets/racing-kit/"){
  const settled=await Promise.allSettled(names.map(name=>loader.loadAsync(`${path}${name}.gltf`)));
  return Object.fromEntries(settled.map((result,index)=>[names[index],result.status==="fulfilled"?result.value.scene:null]));
}
