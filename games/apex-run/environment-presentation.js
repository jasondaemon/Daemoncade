export function mountainGeometry(THREE,{radiusX,radiusZ,segments,height,seed=0,rings=5}){
  const positions=[],colors=[],indices=[];
  for(let ring=0;ring<rings;ring++){
    const t=ring/(rings-1),profile=Math.sin(Math.PI*t),radialScale=.82+t*.36;
    for(let index=0;index<segments;index++){
      const angle=index/segments*Math.PI*2,wave=.58+.22*Math.sin(angle*3.1+seed)+.14*Math.sin(angle*7.3-seed*.7)+.06*Math.cos(angle*13.7),jitter=1+.025*Math.sin(angle*11.2+ring*1.7+seed),x=Math.cos(angle)*radiusX*radialScale*jitter,z=Math.sin(angle)*radiusZ*radialScale*jitter,peak=height*Math.max(.28,wave),y=ring===0||ring===rings-1?-12:profile*peak-(1-profile)*5;
      positions.push(x,y,z);
      const haze=.49+.14*Math.sin(angle*2+seed),lift=.12*profile;colors.push(.19*haze+lift*.32,.25*haze+lift*.4,.27*haze+lift*.42);
    }
  }
  for(let ring=0;ring<rings-1;ring++)for(let index=0;index<segments;index++){const next=(index+1)%segments,a=ring*segments+index,b=(ring+1)*segments+index,c=ring*segments+next,d=(ring+1)*segments+next;indices.push(a,c,b,b,c,d)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function environmentBudget(quality="high"){return quality==="low"?{layers:1,segments:56,rings:4,cloudPuffs:9}:{layers:2,segments:quality==="medium"?88:128,rings:quality==="medium"?4:5,cloudPuffs:quality==="medium"?12:18}}

export function addEnvironmentPresentation(THREE,scene,venue,quality="high"){
  const budget=environmentBudget(quality),meshes=[];
  const sky=new THREE.Mesh(new THREE.SphereGeometry(Math.max(venue.halfX,venue.halfZ)*2.45,quality==="low"?24:36,quality==="low"?14:20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x4f8fc0)},horizon:{value:new THREE.Color(0xc2dce7)},ground:{value:new THREE.Color(0xd9d4bb)},sunDirection:{value:new THREE.Vector3(-.42,.72,.3).normalize()}},vertexShader:`varying vec3 vDirection;void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 top;uniform vec3 horizon;uniform vec3 ground;uniform vec3 sunDirection;varying vec3 vDirection;void main(){vec3 direction=normalize(vDirection);float h=smoothstep(-.12,.72,direction.y);vec3 color=mix(ground,mix(horizon,top,h),smoothstep(-.18,.12,direction.y));float sun=pow(max(dot(direction,sunDirection),0.0),220.0);float longitude=atan(direction.z,direction.x);float cloudNoise=sin(longitude*2.4+direction.y*8.0)+.36*sin(longitude*6.2-direction.y*13.0)+.2*cos(longitude*11.0);float cloudShape=smoothstep(.05,.62,cloudNoise);float cloudBand=smoothstep(.035,.11,direction.y)*(1.0-smoothstep(.38,.58,direction.y));float clouds=cloudShape*cloudBand;color=mix(color,vec3(.96,.978,.985),clouds*.5);color+=vec3(1.0,.73,.38)*sun*.72;gl_FragColor=vec4(color,1.0);}`}));sky.position.set(venue.centerX,0,venue.centerZ);sky.frustumCulled=false;scene.add(sky);meshes.push(sky);
  const cloudGeometry=new THREE.SphereGeometry(1,16,8),cloudMaterial=new THREE.MeshBasicMaterial({color:0xf3f7f8,transparent:true,opacity:.18,depthWrite:false,fog:true}),clouds=new THREE.InstancedMesh(cloudGeometry,cloudMaterial,budget.cloudPuffs),matrix=new THREE.Matrix4();
  for(let index=0;index<budget.cloudPuffs;index++){const cluster=Math.floor(index/3),part=index%3,angle=.42+cluster*1.37,range=.46+.09*(cluster%3),x=venue.centerX+Math.cos(angle)*venue.halfX*range+part*24,z=venue.centerZ+Math.sin(angle)*venue.halfZ*range+(part-1)*18,y=78+(cluster%3)*18+part*3,sx=42+part*15+(cluster%2)*9,sy=7+part*2,sz=22+(2-part)*8;matrix.compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(sx,sy,sz));clouds.setMatrixAt(index,matrix)}
  clouds.instanceMatrix.needsUpdate=true;clouds.frustumCulled=false;scene.add(clouds);meshes.push(clouds);
  for(let layer=0;layer<budget.layers;layer++){const scale=1.72+layer*.38,geometry=mountainGeometry(THREE,{radiusX:venue.halfX*scale,radiusZ:venue.halfZ*scale,segments:Math.max(40,Math.round(budget.segments/(layer+1))),rings:budget.rings,height:25+layer*13,seed:1.7+layer*2.3}),material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,fog:true,side:THREE.FrontSide}),mountains=new THREE.Mesh(geometry,material);mountains.position.set(venue.centerX,0,venue.centerZ);mountains.receiveShadow=false;scene.add(mountains);meshes.push(mountains)}
  const faces=Array.from({length:6},()=>{const canvas=document.createElement("canvas");canvas.width=canvas.height=32;const context=canvas.getContext("2d"),gradient=context.createLinearGradient(0,0,0,32);gradient.addColorStop(0,"#79acd0");gradient.addColorStop(.55,"#c3d9df");gradient.addColorStop(1,"#687261");context.fillStyle=gradient;context.fillRect(0,0,32,32);return canvas}),environment=new THREE.CubeTexture(faces);environment.colorSpace=THREE.SRGBColorSpace;environment.needsUpdate=true;scene.environment=environment;scene.environmentIntensity=.24;
  return{meshes,budget,environment};
}
