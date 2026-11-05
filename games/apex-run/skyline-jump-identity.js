const palettes=Object.freeze([
  Object.freeze({id:"glacier",color:0x58e6ff,emissive:0x0a6270}),
  Object.freeze({id:"solar",color:0xffc857,emissive:0x76510a}),
  Object.freeze({id:"magenta",color:0xff6fd8,emissive:0x74265f}),
]);

function frameAt(samples,index){
  const sample=samples[index],before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)],forward={x:after.x-before.x,y:after.y-before.y,z:after.z-before.z},forwardLength=Math.hypot(forward.x,forward.y,forward.z)||1,lateral={x:sample.left.x-sample.right.x,y:sample.left.y-sample.right.y,z:sample.left.z-sample.right.z},lateralLength=Math.hypot(lateral.x,lateral.y,lateral.z)||1;
  forward.x/=forwardLength;forward.y/=forwardLength;forward.z/=forwardLength;lateral.x/=lateralLength;lateral.y/=lateralLength;lateral.z/=lateralLength;
  const up={x:lateral.y*forward.z-lateral.z*forward.y,y:lateral.z*forward.x-lateral.x*forward.z,z:lateral.x*forward.y-lateral.y*forward.x},upLength=Math.hypot(up.x,up.y,up.z)||1;up.x/=upLength;up.y/=upLength;up.z/=upLength;
  return{sample,forward,lateral,up};
}
function marker(samples,index,{length,width,lift=.075,lateralOffset=0,kind,palette,zone,gapId}){const{sample,forward,lateral,up}=frameAt(samples,index);return Object.freeze({index,kind,zone,gapId,palette:palette.id,color:palette.color,emissive:palette.emissive,length,width,height:.035,lift,lateralOffset,x:sample.x+up.x*lift+lateral.x*lateralOffset,y:sample.y+up.y*lift+lateral.y*lateralOffset,z:sample.z+up.z*lift+lateral.z*lateralOffset,forward:Object.freeze(forward),lateral:Object.freeze(lateral),up:Object.freeze(up)});}
function localSegmentLength(samples,index){const before=samples[Math.max(0,index-1)],after=samples[Math.min(samples.length-1,index+1)];return Math.hypot(after.x-before.x,after.y-before.y,after.z-before.z)*1.015;}
function gatePost(samples,index,side,palette,gapId){const{sample,forward,lateral,up}=frameAt(samples,index),edge=sample[side],sign=side==="left"?1:-1,offset=1.25,height=side==="left"?6.4:4.8;return Object.freeze({index,kind:"landing-pylon",zone:"landing",gapId,palette:palette.id,color:palette.color,emissive:palette.emissive,length:.55,width:.55,height,x:edge.x+lateral.x*sign*offset+up.x*height/2,y:edge.y+lateral.y*sign*offset+up.y*height/2,z:edge.z+lateral.z*sign*offset+up.z*height/2,forward:Object.freeze(forward),lateral:Object.freeze(lateral),up:Object.freeze(up)});}

export function skylineJumpIdentitySpecs(samples,gaps){
  const markings=[],pylons=[],jumps=[];
  gaps.forEach((gap,jumpIndex)=>{
    const palette=palettes[jumpIndex%palettes.length],approachIndices=[gap.start-30,gap.start-20,gap.start-10],landingIndices=[gap.end+8,gap.end+18,gap.end+28],landingGate=Math.min(samples.length-1,gap.end+12);
    approachIndices.forEach((index,step)=>markings.push(marker(samples,index,{length:1.05,width:samples[index].width*(.48+step*.17),kind:"approach-chevron",palette,zone:"approach",gapId:gap.id})));
    landingIndices.forEach(index=>markings.push(marker(samples,index,{length:1.3,width:samples[index].width*.82,kind:"landing-bar",palette,zone:"landing",gapId:gap.id})));
    const bracketIndices=[];for(let index=gap.end+13;index<=gap.end+23;index+=2)bracketIndices.push(index);
    for(const side of[-1,1])for(const index of bracketIndices)markings.push(marker(samples,index,{length:localSegmentLength(samples,index),width:.48,lateralOffset:side*(samples[index].width/2-1),kind:"landing-bracket",palette,zone:"landing",gapId:gap.id}));
    pylons.push(gatePost(samples,landingGate,"left",palette,gap.id),gatePost(samples,landingGate,"right",palette,gap.id));
    jumps.push(Object.freeze({id:gap.id,palette:palette.id,color:palette.color,approach:Object.freeze(approachIndices),landing:Object.freeze(landingIndices),landingGate}));
  });
  return Object.freeze({markings:Object.freeze(markings),pylons:Object.freeze(pylons),jumps:Object.freeze(jumps),drawCalls:2});
}

function instanceMatrix(THREE,spec,dummy){
  const basis=new THREE.Matrix4().makeBasis(new THREE.Vector3(spec.forward.x,spec.forward.y,spec.forward.z),new THREE.Vector3(spec.up.x,spec.up.y,spec.up.z),new THREE.Vector3(spec.lateral.x,spec.lateral.y,spec.lateral.z));
  dummy.position.set(spec.x,spec.y,spec.z);dummy.quaternion.setFromRotationMatrix(basis);dummy.scale.set(spec.length,spec.height,spec.width);dummy.updateMatrix();return dummy.matrix;
}
export function addSkylineJumpIdentity(THREE,scene,samples,gaps,quality="high"){
  const specs=skylineJumpIdentitySpecs(samples,gaps),dummy=new THREE.Object3D(),surfaceMaterial=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),surface=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),surfaceMaterial,specs.markings.length);
  specs.markings.forEach((spec,index)=>{surface.setMatrixAt(index,instanceMatrix(THREE,spec,dummy));surface.setColorAt(index,new THREE.Color(spec.color))});surface.instanceMatrix.needsUpdate=true;surface.instanceColor.needsUpdate=true;surface.receiveShadow=true;scene.add(surface);
  const pylonMaterial=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),pylons=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pylonMaterial,specs.pylons.length);
  specs.pylons.forEach((spec,index)=>{pylons.setMatrixAt(index,instanceMatrix(THREE,spec,dummy));pylons.setColorAt(index,new THREE.Color(spec.color))});pylons.instanceMatrix.needsUpdate=true;pylons.instanceColor.needsUpdate=true;pylons.castShadow=quality==="high";pylons.receiveShadow=true;scene.add(pylons);
  return{...specs,surface,pylons,quality};
}
