function mountainGeometry(THREE,{radiusX,radiusZ,segments,height,seed=0}){
  const positions=[],colors=[],indices=[];
  for(let index=0;index<segments;index++){
    const angle=index/segments*Math.PI*2,wave=.58+.22*Math.sin(angle*3.1+seed)+.14*Math.sin(angle*7.3-seed*.7)+.06*Math.cos(angle*13.7),x=Math.cos(angle)*radiusX,z=Math.sin(angle)*radiusZ,peak=height*Math.max(.28,wave);
    positions.push(x,-7,z,x,peak,z);
    const haze=.52+.16*Math.sin(angle*2+seed);colors.push(.19*haze,.25*haze,.27*haze,.28*haze,.35*haze,.36*haze);
  }
  for(let index=0;index<segments;index++){const next=(index+1)%segments,a=index*2,b=a+1,c=next*2,d=c+1;indices.push(a,c,b,b,c,d)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function environmentBudget(quality="high"){return quality==="low"?{layers:1,segments:72}:{layers:2,segments:quality==="medium"?120:180}}

export function addEnvironmentPresentation(THREE,scene,venue,quality="high"){
  const budget=environmentBudget(quality),meshes=[];
  const sky=new THREE.Mesh(new THREE.SphereGeometry(Math.max(venue.halfX,venue.halfZ)*2.45,quality==="low"?24:36,quality==="low"?14:20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x4f8fc0)},horizon:{value:new THREE.Color(0xc2dce7)},ground:{value:new THREE.Color(0xd9d4bb)},sunDirection:{value:new THREE.Vector3(-.42,.72,.3).normalize()}},vertexShader:`varying vec3 vDirection;void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 top;uniform vec3 horizon;uniform vec3 ground;uniform vec3 sunDirection;varying vec3 vDirection;void main(){vec3 direction=normalize(vDirection);float h=smoothstep(-.12,.72,direction.y);vec3 color=mix(ground,mix(horizon,top,h),smoothstep(-.18,.12,direction.y));float sun=pow(max(dot(direction,sunDirection),0.0),220.0);float cloudNoise=sin(direction.x*24.0+direction.z*17.0)+sin(direction.x*41.0-direction.z*29.0)*.45;float clouds=smoothstep(.72,1.18,cloudNoise)*smoothstep(.03,.16,direction.y)*(1.0-smoothstep(.38,.62,direction.y));color=mix(color,vec3(.94,.97,.98),clouds*.34);color+=vec3(1.0,.73,.38)*sun*.72;gl_FragColor=vec4(color,1.0);}`}));sky.position.set(venue.centerX,0,venue.centerZ);sky.frustumCulled=false;scene.add(sky);meshes.push(sky);
  for(let layer=0;layer<budget.layers;layer++){const scale=1.68+layer*.32,geometry=mountainGeometry(THREE,{radiusX:venue.halfX*scale,radiusZ:venue.halfZ*scale,segments:Math.max(48,Math.round(budget.segments/(layer+1))),height:28+layer*14,seed:1.7+layer*2.3}),material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,fog:true,side:THREE.DoubleSide}),mountains=new THREE.Mesh(geometry,material);mountains.position.set(venue.centerX,0,venue.centerZ);mountains.receiveShadow=true;scene.add(mountains);meshes.push(mountains)}
  const faces=Array.from({length:6},()=>{const canvas=document.createElement("canvas");canvas.width=canvas.height=32;const context=canvas.getContext("2d"),gradient=context.createLinearGradient(0,0,0,32);gradient.addColorStop(0,"#79acd0");gradient.addColorStop(.55,"#c3d9df");gradient.addColorStop(1,"#687261");context.fillStyle=gradient;context.fillRect(0,0,32,32);return canvas}),environment=new THREE.CubeTexture(faces);environment.colorSpace=THREE.SRGBColorSpace;environment.needsUpdate=true;scene.environment=environment;scene.environmentIntensity=.24;
  return{meshes,budget,environment};
}
