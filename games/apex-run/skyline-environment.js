const budgets={low:{stations:5,beacons:3},medium:{stations:8,beacons:5},high:{stations:11,beacons:7}};
export function skylineEnvironmentSpecs(samples,quality="high"){
  const budget=budgets[quality]||budgets.high,stations=[],beacons=[];
  for(let slot=0;slot<budget.stations;slot++){
    const fraction=.08+slot/(budget.stations-1)*.82,index=Math.min(samples.length-2,Math.round(fraction*(samples.length-1))),sample=samples[index];
    if(sample.phase==="loop")continue;const side=slot%2?"left":"right",edge=sample[side],dx=edge.x-sample.x,dz=edge.z-sample.z,length=Math.hypot(dx,dz)||1,offset=32+(slot%3)*8;
    stations.push(Object.freeze({index,x:edge.x+dx/length*offset,z:edge.z+dz/length*offset,roadY:sample.y,heading:sample.heading,side,kind:slot%3===0?"jump-tower":slot%3===1?"shelf-hub":"marshal-deck"}));
  }
  for(let slot=0;slot<budget.beacons;slot++){const angle=(slot+.35)/budget.beacons*Math.PI*2,radius=520+slot%2*105;beacons.push(Object.freeze({x:80+Math.cos(angle)*radius,z:-120+Math.sin(angle)*radius,height:22+(slot%3)*7,rotation:-angle}));}
  return Object.freeze({stations:Object.freeze(stations),beacons:Object.freeze(beacons),budget});
}
export function addSkylineEnvironment(THREE,scene,samples,quality="high"){
  const specs=skylineEnvironmentSpecs(samples,quality),concrete=new THREE.MeshStandardMaterial({color:0x777c78,roughness:.88,metalness:.06}),dark=new THREE.MeshStandardMaterial({color:0x263238,roughness:.5,metalness:.42}),glass=new THREE.MeshPhysicalMaterial({color:0x5c94a2,roughness:.18,metalness:.14,clearcoat:.65,transparent:true,opacity:.84}),accent=new THREE.MeshStandardMaterial({color:0x45e3f2,emissive:0x0a5964,emissiveIntensity:.75,roughness:.3,metalness:.4}),groups=[];
  for(const spec of specs.stations){const group=new THREE.Group(),height=Math.max(9,spec.roadY-.35),base=new THREE.Mesh(new THREE.CylinderGeometry(7.5,11,height,8),concrete),deck=new THREE.Mesh(new THREE.BoxGeometry(spec.kind==="jump-tower"?24:18,1.2,spec.kind==="jump-tower"?15:12),dark),cab=new THREE.Mesh(new THREE.BoxGeometry(spec.kind==="marshal-deck"?9:13,4.5,8),glass),bar=new THREE.Mesh(new THREE.BoxGeometry(spec.kind==="jump-tower"?22:15,.35,.45),accent);base.position.y=height/2;deck.position.y=height+.3;cab.position.y=height+3.1;bar.position.set(0,height+4.5,4.2);for(const mesh of[base,deck,cab,bar]){mesh.castShadow=quality!=="low";mesh.receiveShadow=true;group.add(mesh)}group.position.set(spec.x,.35,spec.z);group.rotation.y=-spec.heading;scene.add(group);groups.push(group)}
  const beaconGeometry=new THREE.CylinderGeometry(.7,1.4,1,8),beacons=new THREE.InstancedMesh(beaconGeometry,dark,specs.beacons.length),dummy=new THREE.Object3D();specs.beacons.forEach((spec,index)=>{dummy.position.set(spec.x,spec.height/2,spec.z);dummy.scale.set(1,spec.height,1);dummy.rotation.y=spec.rotation;dummy.updateMatrix();beacons.setMatrixAt(index,dummy.matrix)});beacons.instanceMatrix.needsUpdate=true;beacons.castShadow=quality==="high";beacons.receiveShadow=true;scene.add(beacons);groups.push(beacons);
  return{...specs,groups,drawCalls:specs.stations.length*4+1};
}
