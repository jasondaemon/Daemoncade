const FOOTPRINT={halfX:27,halfZ:18};
const HARBOR_KINDS=["container-yard","warehouse-pier","crane-deck","breakwater-ops"];
const ALPINE_KINDS=["spectator-terrace","service-depot","hospitality","mountain-station"];
export function routeDistrictBudget(quality="high"){return quality==="low"?2:quality==="medium"?3:4}
export function routeDistrictCorners(spec){const result=[],c=Math.cos(spec.rotation),s=Math.sin(spec.rotation);for(const x of[-FOOTPRINT.halfX,FOOTPRINT.halfX])for(const z of[-FOOTPRINT.halfZ,FOOTPRINT.halfZ])result.push({x:spec.x+x*c+z*s,z:spec.z-x*s+z*c});return result}
function clearance(spec,samples){return routeDistrictCorners(spec).reduce((best,corner)=>samples.reduce((near,sample)=>Math.min(near,Math.hypot(corner.x-sample.x,corner.z-sample.z)-sample.width/2),best),Infinity)}
export function routeDistrictSpecs(samples,trackId="alpine-sprint",quality="high"){
  const harbor=trackId==="harbor-run",wanted=routeDistrictBudget(quality),fractions=harbor?[.16,.38,.61,.84]:[.12,.35,.62,.84],kinds=harbor?HARBOR_KINDS:ALPINE_KINDS,specs=[];
  for(let slot=0;slot<fractions.length&&specs.length<wanted;slot++){const index=Math.min(samples.length-2,Math.max(1,Math.round(samples.length*fractions[slot]))),sample=samples[index],side=(slot+1)%2?"left":"right",edge=sample[side],dx=edge.x-sample.x,dz=edge.z-sample.z,length=Math.hypot(dx,dz)||1;for(const offset of[44,56,70,86,104,126]){const partial={slot,index,side,x:edge.x+dx/length*offset,z:edge.z+dz/length*offset,y:.35,rotation:-sample.heading,kind:kinds[slot]},measured=clearance(partial,samples);if(measured>=10){specs.push(Object.freeze({...partial,clearance:measured}));break}}}
  return specs;
}
function compose(dummy,spec,x,y,z,sx,sy,sz,ry=0){const a=spec.rotation,c=Math.cos(a),s=Math.sin(a);dummy.position.set(spec.x+x*c+z*s,y,spec.z-x*s+z*c);dummy.rotation.set(0,a+ry,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();return dummy.matrix.clone()}
function palette(THREE,harbor){return{concrete:new THREE.MeshStandardMaterial({color:harbor?0x9ca7a4:0xc9c5b8,roughness:.88}),graphite:new THREE.MeshStandardMaterial({color:0x263239,roughness:.48,metalness:.44}),glass:new THREE.MeshPhysicalMaterial({color:harbor?0x4f7b88:0x76a9b5,roughness:.16,metalness:.16,transparent:true,opacity:.82}),accent:new THREE.MeshStandardMaterial({color:harbor?0xf0a33b:0x42dce8,emissive:harbor?0x6b2d05:0x08707b,emissiveIntensity:.58,roughness:.35}),ground:new THREE.MeshStandardMaterial({color:harbor?0x465052:0x5d625e,roughness:.98}),container:[0xb84b3b,0x346d7c,0xd3a53b].map(color=>new THREE.MeshStandardMaterial({color,roughness:.57,metalness:.36}))}}
export function addRouteDistricts(THREE,scene,samples,trackId="alpine-sprint",quality="high"){
  const specs=routeDistrictSpecs(samples,trackId,quality),harbor=trackId==="harbor-run",m=palette(THREE,harbor),dummy=new THREE.Object3D(),parts=[];
  const add=(geometry,material,transforms,shadow=true)=>{const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);transforms.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=quality==="high"&&shadow;mesh.receiveShadow=true;scene.add(mesh);parts.push(mesh);return mesh};
  const matrices=(fn)=>specs.flatMap((spec,index)=>fn(spec,index));
  add(new THREE.BoxGeometry(1,.18,1),m.ground,matrices(spec=>[compose(dummy,spec,0,.44,0,62,1,40)]),false);
  add(new THREE.BoxGeometry(1,1,1),m.concrete,matrices(spec=>[compose(dummy,spec,0,1.05,0,58,1.4,36),compose(dummy,spec,-26,2.2,0,1.4,3.8,36),compose(dummy,spec,26,2.2,0,1.4,3.8,36)]));
  add(new THREE.BoxGeometry(1,1,1),m.graphite,matrices(spec=>{if(spec.kind==="container-yard")return[compose(dummy,spec,-11,2.2,-7,12,3.7,5),compose(dummy,spec,4,2.2,4,12,3.7,5),compose(dummy,spec,17,2.2,-3,12,3.7,5)];if(spec.kind==="warehouse-pier")return[compose(dummy,spec,2,6,0,43,11,22)];if(spec.kind==="crane-deck")return[compose(dummy,spec,-18,10,0,2,19,2),compose(dummy,spec,18,10,0,2,19,2),compose(dummy,spec,0,20,0,43,2,3)];if(spec.kind==="breakwater-ops")return[compose(dummy,spec,-9,4,0,18,7,18),compose(dummy,spec,14,7,2,9,13,9)];if(spec.kind==="spectator-terrace")return[compose(dummy,spec,0,3.2,3,46,5,22)];if(spec.kind==="service-depot")return[compose(dummy,spec,-9,4,0,18,7,20),compose(dummy,spec,13,3,3,16,5,13)];if(spec.kind==="hospitality")return[compose(dummy,spec,0,5,0,38,9,20)];return[compose(dummy,spec,0,6,0,28,11,22)]}));
  add(new THREE.BoxGeometry(1,1,.2),m.glass,matrices(spec=>spec.kind==="container-yard"?[]:[compose(dummy,spec,0,5.5,-10.8,30,4,1)]));
  add(new THREE.BoxGeometry(1,.5,1),m.graphite,matrices(spec=>spec.kind==="container-yard"?[]:[compose(dummy,spec,0,harbor?11.8:10.2,0,harbor?48:44,1,harbor?25:24)]));
  add(new THREE.BoxGeometry(1,.22,.22),m.accent,matrices(spec=>[compose(dummy,spec,0,harbor?9:8,-11.1,harbor?38:36,1,1)]),false);
  const mastTransforms=matrices(spec=>[-24,24].flatMap(x=>[-15,15].map(z=>compose(dummy,spec,x,5,z,1,9,1)))),lampTransforms=matrices(spec=>[-24,24].flatMap(x=>[-15,15].map(z=>compose(dummy,spec,x,9.6,z,1,1,1))));
  add(new THREE.CylinderGeometry(.12,.2,1,8),m.graphite,mastTransforms);
  add(new THREE.BoxGeometry(3,.18,.4),m.accent,lampTransforms,false);
  if(harbor){for(let color=0;color<3;color++)add(new THREE.BoxGeometry(6.06,2.59,2.44),m.container[color],matrices(spec=>spec.kind==="container-yard"?[0,1,2,3].filter(n=>n%3===color).map(n=>compose(dummy,spec,-18+n*12,2.4,n%2?8:-8,1,1,1,n%2?Math.PI/2:0)):[]));}
  else add(new THREE.BoxGeometry(3.8,1.25,1.7),m.accent,matrices(spec=>spec.kind==="spectator-terrace"?[-18,-9,0,9,18].map(x=>compose(dummy,spec,x,6,-7,1,1,1)):[]),false);
  return{specs,meshes:parts,drawCalls:parts.length,kinds:specs.map(spec=>spec.kind)};
}
