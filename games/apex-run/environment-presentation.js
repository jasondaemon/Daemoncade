export const ENVIRONMENT_PALETTES=Object.freeze({
  alpine:Object.freeze({top:0x4f8fc0,horizon:0xc2dce7,ground:0xc8c4ad,fog:0x8fb7c9,fogDensity:.00086,mountainLow:[.18,.22,.22],mountainHigh:[.38,.42,.42],snow:[.78,.81,.8],snowLine:.7,reflection:["#79acd0","#c3d9df","#687261"]}),
  harbor:Object.freeze({top:0x345f78,horizon:0xb4cdd1,ground:0x8d968c,fog:0x91adb2,fogDensity:.0009,mountainLow:[.075,.105,.11],mountainHigh:[.22,.28,.29],snow:null,snowLine:2,reflection:["#608aa0","#b4ced0","#536865"]}),
  skyline:Object.freeze({top:0x78abd0,horizon:0xa5c2c3,ground:0x7f9f92,fog:0xa6bec0,fogDensity:.00072,mountainLow:[.16,.23,.22],mountainHigh:[.31,.4,.38],snow:null,snowLine:2,reflection:["#83b2cf","#b4cdce","#6d8378"]}),
});
export function environmentPalette(trackId="summit-circuit"){return trackId==="harbor-run"?ENVIRONMENT_PALETTES.harbor:trackId==="skyline-gauntlet"?ENVIRONMENT_PALETTES.skyline:ENVIRONMENT_PALETTES.alpine}
export const WORLD_SUN_DIRECTION=Object.freeze({x:-60,y:110,z:35});
export const ALPINE_SUN_DIRECTION=Object.freeze({x:-60,y:20,z:35});
export function worldSunDirection(trackId="summit-circuit"){return trackId==="alpine-sprint"?ALPINE_SUN_DIRECTION:WORLD_SUN_DIRECTION}

export function mountainGeometry(THREE,{radiusX,radiusZ,segments,height,seed=0,rings=5,palette=ENVIRONMENT_PALETTES.alpine}){
  const positions=[],colors=[],indices=[];
  for(let ring=0;ring<rings;ring++){
    const t=ring/(rings-1),profile=Math.sin(Math.PI*t),radialScale=.82+t*.36;
    for(let index=0;index<segments;index++){
      const angle=index/segments*Math.PI*2,wave=.58+.22*Math.sin(angle*3.1+seed)+.14*Math.sin(angle*7.3-seed*.7)+.06*Math.cos(angle*13.7),jitter=1+.025*Math.sin(angle*11.2+ring*1.7+seed),x=Math.cos(angle)*radiusX*radialScale*jitter,z=Math.sin(angle)*radiusZ*radialScale*jitter,peak=height*Math.max(.28,wave),y=ring===0||ring===rings-1?-12:profile*peak-(1-profile)*5;
      positions.push(x,y,z);
      const haze=.78+.16*Math.sin(angle*2+seed),altitude=.28+.72*profile,snowMix=palette.snow?Math.max(0,Math.min(1,(profile-palette.snowLine)/.16))*(.55+.45*Math.max(0,Math.sin(angle*5.3+seed))):0;for(let channel=0;channel<3;channel++){const rock=(palette.mountainLow[channel]+(palette.mountainHigh[channel]-palette.mountainLow[channel])*altitude)*haze,snow=palette.snow?.[channel]??rock;colors.push(rock+(snow-rock)*snowMix)}
    }
  }
  for(let ring=0;ring<rings-1;ring++)for(let index=0;index<segments;index++){const next=(index+1)%segments,a=ring*segments+index,b=(ring+1)*segments+index,c=ring*segments+next,d=(ring+1)*segments+next;indices.push(a,c,b,b,c,d)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function alpineMassSpecs(quality="high"){
  const specs=[
    {x:-1.58,z:-1.28,rx:.62,rz:.43,height:42,seed:.7,leanX:.12,leanZ:-.06,subX:.4,subZ:.11,subScale:.56},
    {x:1.68,z:.34,rx:.5,rz:.38,height:35,seed:2.1,leanX:-.09,leanZ:.1,subX:-.38,subZ:.15,subScale:.63},
    {x:.3,z:1.7,rx:.57,rz:.4,height:46,seed:3.7,leanX:.1,leanZ:.04,subX:.34,subZ:-.17,subScale:.58},
    {x:-1.82,z:.66,rx:.42,rz:.34,height:31,seed:5.2,leanX:.07,leanZ:.11,subX:.36,subZ:-.12,subScale:.6},
    {x:.98,z:-1.82,rx:.46,rz:.32,height:37,seed:6.4,leanX:-.12,leanZ:.04,subX:-.34,subZ:-.14,subScale:.57},
  ];
  return specs.slice(0,quality==="low"?3:quality==="medium"?4:5).map(spec=>Object.freeze(spec));
}

export function alpineMountainGeometry(THREE,venue,quality="high"){
  const positions=[],colors=[],indices=[],specs=alpineMassSpecs(quality),rings=quality==="low"?4:quality==="medium"?5:6,segments=quality==="low"?16:quality==="medium"?24:32;
  const lobeSpecs=specs.flatMap((spec,index)=>[spec,...(quality==="low"&&index===specs.length-1?[]:[{...spec,x:spec.x+spec.subX*spec.rx,z:spec.z+spec.subZ*spec.rz,rx:spec.rx*spec.subScale,rz:spec.rz*spec.subScale*.9,height:spec.height*(.52+.08*Math.sin(spec.seed)),seed:spec.seed+2.7,leanX:-spec.leanZ,leanZ:spec.leanX,secondary:true}])]);
  for(const spec of lobeSpecs){
    const start=positions.length/3,cx=venue.centerX+spec.x*venue.halfX,cz=venue.centerZ+spec.z*venue.halfZ,rx=spec.rx*venue.halfX,rz=spec.rz*venue.halfZ;
    for(let ring=0;ring<rings;ring++){
      const t=.08+.92*ring/(rings-1),profile=Math.pow(1-t,1.18),centerX=cx+spec.leanX*rx*(1-t),centerZ=cz+spec.leanZ*rz*(1-t);
      for(let index=0;index<segments;index++){
        const angle=index/segments*Math.PI*2,jitter=1+.07*Math.sin(angle*3+spec.seed)+.04*Math.sin(angle*7-spec.seed)+.035*Math.cos(angle*2.1+ring),shoulder=1+.12*Math.max(0,Math.sin(angle*2+spec.seed))*(.35+Math.sin(Math.PI*t)),x=centerX+Math.cos(angle)*rx*t*jitter*shoulder,z=centerZ+Math.sin(angle)*rz*t*jitter/shoulder,crest=.9+.075*Math.sin(angle*2.3+spec.seed)+.045*Math.cos(angle*5.1-spec.seed),y=ring===rings-1?-5:ring===0?spec.height*crest:-5+(spec.height+5)*profile*crest;
        positions.push(x,y,z);const altitude=Math.max(0,Math.min(1,(y+5)/(spec.height+5))),aspect=.82+.18*Math.max(0,Math.sin(angle+spec.seed)),rock=1-Math.min(1,altitude*2.25),haze=spec.secondary?.1:0;colors.push((.18+.23*altitude+.06*rock+haze)*aspect,(.2+.22*altitude+.05*rock+haze)*aspect,(.21+.19*altitude+.04*rock+haze)*aspect);
      }
    }
    for(let ring=0;ring<rings-1;ring++)for(let index=0;index<segments;index++){const a=start+ring*segments+index,b=start+ring*segments+(index+1)%segments,c=start+(ring+1)*segments+index,d=start+(ring+1)*segments+(index+1)%segments;indices.push(a,b,c,b,d,c)}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData={massCount:specs.length,lobeCount:lobeSpecs.length,rings,segments,specs};return geometry;
}

export function skylineRidgeGeometry(THREE,venue,quality="high"){
  const patches=[{angle:.05,height:29,seed:.7},{angle:.72,height:21,seed:1.8},{angle:1.42,height:34,seed:2.9},{angle:2.12,height:24,seed:4.1},{angle:2.84,height:31,seed:5.3},{angle:3.56,height:22,seed:6.4},{angle:4.28,height:33,seed:7.6},{angle:4.98,height:25,seed:8.8},{angle:5.65,height:30,seed:9.9}],span=.5,segments=quality==="low"?10:quality==="medium"?16:22,rings=quality==="low"?3:quality==="medium"?4:5,positions=[],colors=[],indices=[];
  for(const patch of patches){
    const start=positions.length/3;
    for(let ring=0;ring<rings;ring++){
      const depth=ring/(rings-1),cross=Math.pow(Math.sin(Math.PI*depth),.76),radius=1.07+depth*.13;
      for(let index=0;index<=segments;index++){
        const u=index/segments,angle=patch.angle+(u-.5)*span,shoulder=.12+.88*Math.pow(Math.sin(Math.PI*u),.42),detail=.72+.12*Math.sin(u*Math.PI*3.4+patch.seed)+.08*Math.sin(u*Math.PI*8.2-patch.seed),crest=patch.height*shoulder*detail,jitter=1+.018*Math.sin(u*Math.PI*9+patch.seed+ring),x=venue.centerX+Math.cos(angle)*venue.halfX*radius*jitter,z=venue.centerZ+Math.sin(angle)*venue.halfZ*radius*jitter,y=-12+(crest+12)*cross;
        positions.push(x,y,z);const altitude=Math.max(0,Math.min(1,(y+12)/(patch.height+12))),haze=.92+.05*Math.sin(angle*2.2+patch.seed);colors.push((.26+.06*altitude)*haze,(.36+.07*altitude)*haze,(.33+.065*altitude)*haze);
      }
    }
    const stride=segments+1;for(let ring=0;ring<rings-1;ring++)for(let index=0;index<segments;index++){const a=start+ring*stride+index,b=a+1,c=a+stride,d=c+1;indices.push(a,c,b,b,c,d)}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData={patchCount:patches.length,rings,segments,patches};return geometry;
}

export function skylineBackdropGeometry(THREE,venue,quality="high",layer=0){
  const segments=quality==="low"?72:quality==="medium"?96:128,radiusScale=layer===0?1.48:1.68,base=layer===0?42:58,positions=[],colors=[],indices=[];
  for(let index=0;index<=segments;index++){
    const angle=index/segments*Math.PI*2,radius=radiusScale*(1+.025*Math.sin(angle*7.0+layer)),x=venue.centerX+Math.cos(angle)*venue.halfX*radius,z=venue.centerZ+Math.sin(angle)*venue.halfZ*radius;
    const crest=base+12*Math.sin(angle*(layer===0?5:7)+.8+layer)+6*Math.sin(angle*(layer===0?11:15)-1.1)+3*Math.sin(angle*23+.4*layer);
    positions.push(x,-55,z,x,crest,z);const tint=layer===0?[.16,.24,.22]:[.28,.37,.36];colors.push(...tint,...tint);
    if(index<segments){const a=index*2,b=a+1,c=a+2,d=a+3;indices.push(a,c,b,b,c,d)}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData={segments,layer};return geometry;
}

export function environmentBudget(quality="high"){return quality==="low"?{layers:1,segments:56,rings:4}:{layers:2,segments:quality==="medium"?88:128,rings:quality==="medium"?4:5}}
export function ridgeComposition(trackId="summit-circuit"){
  if(trackId==="alpine-sprint")return Object.freeze([
    Object.freeze({scale:1.82,height:46,seed:1.7}),
    Object.freeze({scale:2.42,height:72,seed:4}),
  ]);
  if(trackId==="harbor-run")return Object.freeze([
    Object.freeze({scale:1.72,height:25,seed:1.7}),
    Object.freeze({scale:2.1,height:38,seed:4}),
  ]);
  return Object.freeze([
    Object.freeze({scale:1.38,height:46,seed:1.7}),
    Object.freeze({scale:1.72,height:70,seed:4}),
  ]);
}

export function addEnvironmentPresentation(THREE,scene,venue,quality="high",trackId="summit-circuit"){
  const budget=environmentBudget(quality),palette=environmentPalette(trackId),meshes=[];if(scene.fog?.isFogExp2){scene.fog.color.setHex(palette.fog);scene.fog.density=palette.fogDensity}
  const sunOffset=worldSunDirection(trackId),sunDirection=new THREE.Vector3(sunOffset.x,sunOffset.y,sunOffset.z).normalize();
  const sky=new THREE.Mesh(new THREE.SphereGeometry(Math.max(venue.halfX,venue.halfZ)*2.45,quality==="low"?24:36,quality==="low"?14:20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(palette.top)},horizon:{value:new THREE.Color(palette.horizon)},ground:{value:new THREE.Color(palette.ground)},sunDirection:{value:sunDirection}},vertexShader:`varying vec3 vDirection;void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 top;uniform vec3 horizon;uniform vec3 ground;uniform vec3 sunDirection;varying vec3 vDirection;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}float fbm(vec2 p){float value=0.0,weight=.55;for(int i=0;i<4;i++){value+=noise(p)*weight;p=p*2.03+vec2(17.7,9.2);weight*=.5;}return value;}void main(){vec3 direction=normalize(vDirection);float h=smoothstep(-.12,.72,direction.y);vec3 color=mix(ground,mix(horizon,top,h),smoothstep(-.18,.12,direction.y));float alignment=max(dot(direction,sunDirection),0.0);vec2 azimuth=normalize(direction.xz);vec2 cloudUV=azimuth*2.8+direction.y*vec2(1.7,5.3);float field=fbm(cloudUV*1.18)+.28*fbm(cloudUV*2.15+vec2(4.7,2.1));float band=smoothstep(.045,.13,direction.y)*(1.0-smoothstep(.5,.66,direction.y));float clouds=smoothstep(.62,.81,field)*band;float rim=smoothstep(.54,.72,field)*band;color=mix(color,vec3(.93,.955,.965),rim*.18);color=mix(color,vec3(.99),clouds*.52);float disc=smoothstep(.99972,.9999,alignment),corona=pow(alignment,420.0),cloudVeil=1.0-clouds*.42;color=mix(color,vec3(1.0,.91,.68),disc*.96*cloudVeil);color+=vec3(1.0,.72,.35)*corona*.2*cloudVeil;gl_FragColor=vec4(color,1.0);}`}));sky.position.set(venue.centerX,0,venue.centerZ);sky.frustumCulled=false;scene.add(sky);meshes.push(sky);
  if(trackId==="skyline-gauntlet"){sky.material.fragmentShader=`uniform vec3 top;uniform vec3 horizon;uniform vec3 ground;uniform vec3 sunDirection;varying vec3 vDirection;
    void main(){
      vec3 direction=normalize(vDirection);float y=direction.y,azimuth=atan(direction.z,direction.x);
      float lower=smoothstep(-.24,.14,y),upper=smoothstep(.02,.84,y);vec3 color=mix(ground,horizon,lower);color=mix(color,top,upper);
      float horizonHaze=exp(-pow((y-.035)/.115,2.0));color=mix(color,vec3(.59,.71,.72),horizonHaze*.28);
      float cloudBand=smoothstep(.16,.25,y)*(1.0-smoothstep(.5,.64,y));float cloudField=.5+.28*sin(azimuth*1.8+y*5.0)+.22*sin(azimuth*3.7-y*3.2+1.4);float cloud=smoothstep(.63,.92,cloudField)*cloudBand;color=mix(color,vec3(.82,.88,.89),cloud*.14);
      float alignment=max(dot(direction,sunDirection),0.0),disc=smoothstep(.99972,.9999,alignment),corona=pow(alignment,420.0);color=mix(color,vec3(1.0,.92,.7),disc*.96);color+=vec3(1.0,.76,.42)*corona*.18;gl_FragColor=vec4(color,1.0);
    }`;sky.material.needsUpdate=true;for(const layer of[1,0]){const geometry=skylineBackdropGeometry(THREE,venue,quality,layer),material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:layer===0?.38:.26,depthWrite:false,fog:false,side:THREE.DoubleSide}),backdrop=new THREE.Mesh(geometry,material);backdrop.renderOrder=-2+layer;scene.add(backdrop);meshes.push(backdrop)}}
  if(trackId==="alpine-sprint"){const geometry=alpineMountainGeometry(THREE,venue,quality),material=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,fog:true,side:THREE.FrontSide}),mountains=new THREE.Mesh(geometry,material);mountains.receiveShadow=false;scene.add(mountains);meshes.push(mountains)}else if(trackId!=="skyline-gauntlet"){const ridges=ridgeComposition(trackId);for(let layer=0;layer<budget.layers;layer++){const ridge=ridges[layer],geometry=mountainGeometry(THREE,{radiusX:venue.halfX*ridge.scale,radiusZ:venue.halfZ*ridge.scale,segments:Math.max(40,Math.round(budget.segments/(layer+1))),rings:budget.rings,height:ridge.height,seed:ridge.seed,palette}),material=new THREE.MeshBasicMaterial({vertexColors:true,fog:true,side:THREE.FrontSide}),mountains=new THREE.Mesh(geometry,material);mountains.position.set(venue.centerX,0,venue.centerZ);mountains.receiveShadow=false;scene.add(mountains);meshes.push(mountains)}}
  const faces=Array.from({length:6},()=>{const canvas=document.createElement("canvas");canvas.width=canvas.height=32;const context=canvas.getContext("2d"),gradient=context.createLinearGradient(0,0,0,32);gradient.addColorStop(0,palette.reflection[0]);gradient.addColorStop(.55,palette.reflection[1]);gradient.addColorStop(1,palette.reflection[2]);context.fillStyle=gradient;context.fillRect(0,0,32,32);return canvas}),environment=new THREE.CubeTexture(faces);environment.colorSpace=THREE.SRGBColorSpace;environment.needsUpdate=true;scene.environment=environment;scene.environmentIntensity=trackId==="harbor-run"?.3:.24;
  return{meshes,budget,environment,palette,sunDirection};
}
