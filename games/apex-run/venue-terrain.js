export function terrainBudget(quality="high"){
  return quality==="low"?{x:42,z:30}:quality==="medium"?{x:68,z:48}:{x:100,z:70};
}
function roadClearance(x,z,samples){
  let best=Infinity;
  for(const sample of samples)best=Math.min(best,Math.hypot(x-sample.x,z-sample.z)-sample.width/2);
  return best;
}
function smoothstep(a,b,value){const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t)}

export function buildVenueTerrainGeometry(THREE,venue,samples,trackId="alpine-sprint",quality="high"){
  const budget=terrainBudget(quality),positions=[],colors=[],uvs=[],indices=[],active=[],harbor=trackId==="harbor-run";
  for(let zi=0;zi<=budget.z;zi++)for(let xi=0;xi<=budget.x;xi++){
    const u=xi/budget.x,v=zi/budget.z,x=venue.centerX+(u-.5)*venue.halfX*2,z=venue.centerZ+(v-.5)*venue.halfZ*2;
    const clearance=roadClearance(x,z,samples),corridor=smoothstep(harbor?48:80,harbor?94:140,clearance);
    const nx=(x-venue.centerX)/venue.halfX,nz=(z-venue.centerZ)/venue.halfZ,radial=Math.hypot(nx,nz);
    const macro=Math.sin(x*.011+z*.004)*.42+Math.cos(z*.014-x*.003)*.27+Math.sin((x+z)*.026)*.13;
    const landformField=Math.sin(x*.0041+z*.0017)*.46+Math.cos(z*.0053-x*.0019)*.36+Math.sin((x-z)*.0071)*.18;
    const landform=harbor?0:smoothstep(.14,.82,landformField)*smoothstep(95,165,clearance)*(7.5+2.5*Math.max(0,macro));
    const secondary=Math.sin(x*.031-z*.017)*.5+.5,harborShelf=smoothstep(.34,.62,radial+.07*macro);
    const enabled=!harbor||harborShelf>.035,height=harbor?harborShelf*(4.4+2.4*macro)*corridor:(2.8+3.5*macro+Math.max(0,radial-.45)*5.4)*corridor+landform;
    const y=(harbor?.18:.37)+Math.max(0,height);
    positions.push(x,y,z);uvs.push(x/1.4,z/1.4);active.push(enabled);
    const altitude=Math.max(0,Math.min(1,height/(harbor?7:15))),soil=Math.max(0,Math.min(1,.45+.4*macro));
    if(harbor)colors.push(.19+soil*.06,.29+altitude*.11,.23+altitude*.04);
    else{
      const biome=Math.sin(x*.0067+z*.0021)*.48+Math.cos(z*.0083-x*.0017)*.34+Math.sin((x-z)*.014)*.18;
      const shoulderPattern=Math.sin(x*.041+z*.019)*.52+Math.cos(z*.057-x*.013)*.31+Math.sin((x-z)*.093)*.17;
      const shoulderCoverage=smoothstep(-.32,.42,shoulderPattern),inner=10+5*(secondary-.5),outer=34+12*(secondary-.5);
      const shoulderMask=smoothstep(inner,inner+9,clearance)*(1-smoothstep(outer,outer+13,clearance))*shoulderCoverage;
      const macroDx=Math.cos(x*.011+z*.004)*.00462+Math.sin(z*.014-x*.003)*.00081+Math.cos((x+z)*.026)*.00338;
      const macroDz=Math.cos(x*.011+z*.004)*.00168-Math.sin(z*.014-x*.003)*.00378+Math.cos((x+z)*.026)*.00338;
      const slopeMask=smoothstep(.012,.026,Math.hypot(macroDx,macroDz))*(1-shoulderMask);
      const soilMask=smoothstep(.28,.72,biome)*(1-shoulderMask),meadowMask=smoothstep(-.55,.2,biome)*(1-soilMask)*(1-shoulderMask);
      const succession=smoothstep(4,11,height),rockMask=Math.max(smoothstep(.72,1.05,radial+altitude*.18),slopeMask,smoothstep(.58,.95,succession+biome*.18))*(1-soilMask)*(1-shoulderMask);
      const grass=[.34+.07*secondary,.5+.08*secondary,.24+.04*secondary],earth=[.46,.36,.23],stone=[.44,.45,.4],gravel=[.54,.45,.32];
      const base=1-soilMask-rockMask-shoulderMask;
      const red=grass[0]*base+earth[0]*soilMask+stone[0]*rockMask+gravel[0]*shoulderMask;
      const green=grass[1]*base+earth[1]*soilMask+stone[1]*rockMask+gravel[1]*shoulderMask;
      const blue=grass[2]*base+earth[2]*soilMask+stone[2]*rockMask+gravel[2]*shoulderMask;
      colors.push(red+meadowMask*.025,green+meadowMask*.035,blue);
    }
  }
  const stride=budget.x+1;
  for(let zi=0;zi<budget.z;zi++)for(let xi=0;xi<budget.x;xi++){
    const a=zi*stride+xi,b=a+1,c=a+stride,d=c+1;
    if(active[a]&&active[b]&&active[c])indices.push(a,c,b);
    if(active[b]&&active[c]&&active[d])indices.push(b,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData={budget,trackId};return geometry;
}

export function terrainHeightAt(geometry,venue,x,z){
  const{budget}=geometry.userData,u=(x-(venue.centerX-venue.halfX))/(venue.halfX*2)*budget.x,v=(z-(venue.centerZ-venue.halfZ))/(venue.halfZ*2)*budget.z;
  const xi=Math.max(0,Math.min(budget.x-1,Math.floor(u))),zi=Math.max(0,Math.min(budget.z-1,Math.floor(v)));
  const fx=Math.max(0,Math.min(1,u-xi)),fz=Math.max(0,Math.min(1,v-zi)),stride=budget.x+1,position=geometry.getAttribute("position");
  const a=zi*stride+xi,b=a+1,c=a+stride,d=c+1;
  if(fx+fz<=1)return position.getY(a)*(1-fx-fz)+position.getY(b)*fx+position.getY(c)*fz;
  return position.getY(d)*(fx+fz-1)+position.getY(b)*(1-fz)+position.getY(c)*(1-fx);
}

export function addVenueTerrain(THREE,scene,venue,samples,trackId,quality,maps={}){
  const geometry=buildVenueTerrainGeometry(THREE,venue,samples,trackId,quality);
  const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,map:maps.color||null,normalMap:quality==="low"?null:maps.normal||null,roughnessMap:maps.roughness||null,normalScale:new THREE.Vector2(.16,.16),roughness:1,metalness:0});
  const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;mesh.castShadow=quality==="high";scene.add(mesh);return mesh;
}
