// Low-contrast world-space detail: stable under camera motion, no image downloads.
export function detailSurface(material,kind='terrain') {
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 detailWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ndetailWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader=`varying vec3 detailWorld;
float detailHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float detailNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(detailHash(i),detailHash(i+vec2(1,0)),f.x),mix(detailHash(i+vec2(0,1)),detailHash(i+vec2(1,1)),f.x),f.y);}
`+shader.fragmentShader;
    const asphalt=kind==='asphalt';
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec2 surfaceUV=detailWorld.xz;
float fade=1.-smoothstep(35.,160.,length(detailWorld-cameraPosition));
float grain=(detailNoise(surfaceUV*${asphalt?'8.':'3.'})-.5)*fade;
float broad=detailNoise(surfaceUV*.09)-.5;
diffuseColor.rgb*=1.+grain*${asphalt?'.18':'.24'}+broad*${asphalt?'.12':'.28'};
${asphalt?'float repair=smoothstep(.74,.8,detailNoise(surfaceUV*.22));diffuseColor.rgb*=1.-repair*.12;':'float ripple=sin(surfaceUV.x*.8+detailNoise(surfaceUV*.05)*8.);diffuseColor.rgb*=1.+ripple*.025*fade;'}
`);
  };
  material.customProgramCacheKey=()=>`racecar-surface-${kind}-1`;
  material.needsUpdate=true;return material;
}
