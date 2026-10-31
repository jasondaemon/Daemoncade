// Restrained, world-anchored material variation. No bitmaps, animation,
// geometry, tiling lines or high-frequency detail beyond the pixel footprint.
export function groundFinish(material,enabled){
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,...args)=>{
  previous(shader,...args);shader.uniforms.terrainFinish=enabled;
  shader.fragmentShader='uniform float terrainFinish;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(terrainFinish>.5){
    vec2 ft=vHoleWorld.xz;float fm=sin(ft.x*.37+sin(ft.y*.21))*cos(ft.y*.43);
    float fp=1.-smoothstep(.3,1.1,length(fwidth(ft*9.)));
    float fg=fract(sin(dot(floor(ft*9.),vec2(127.1,311.7)))*43758.5453)-.5;
    diffuseColor.rgb*=.985+fm*.022+fg*.035*fp;
   }`);
 };material.customProgramCacheKey=()=>key()+'-matte-finish-48';
}
