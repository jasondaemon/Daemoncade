const rms=values=>Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/(values.length||1));
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]||0;
const normalized=vector=>{const length=Math.hypot(vector.x,vector.y,vector.z)||1;return{x:vector.x/length,y:vector.y/length,z:vector.z/length}};
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});

function roadProjection(position,samples){
  let best={distance:Infinity,index:0,t:0};
  for(let index=0;index<samples.length-1;index++){
    const a=samples[index],b=samples[index+1],dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz;
    const t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/(length2||1)));
    const x=a.x+dx*t,z=a.z+dz*t,distance=(position.x-x)**2+(position.z-z)**2;
    if(distance<best.distance)best={distance,index,t};
  }
  const a=samples[best.index],b=samples[best.index+1],before=samples[Math.max(0,best.index-1)],after=samples[Math.min(samples.length-1,best.index+2)];
  const forward=normalized({x:after.x-before.x,y:after.y-before.y,z:after.z-before.z});
  const lateralA=normalized({x:a.left.x-a.right.x,y:a.left.y-a.right.y,z:a.left.z-a.right.z});
  const lateralB=normalized({x:b.left.x-b.right.x,y:b.left.y-b.right.y,z:b.left.z-b.right.z});
  const upA=normalized(cross(lateralA,forward)),upB=normalized(cross(lateralB,forward));
  const up=normalized({x:upA.x+(upB.x-upA.x)*best.t,y:upA.y+(upB.y-upA.y)*best.t,z:upA.z+(upB.z-upA.z)*best.t});
  const center={x:a.x+(b.x-a.x)*best.t,y:a.y+(b.y-a.y)*best.t,z:a.z+(b.z-a.z)*best.t};
  return{center,up};
}

export function createRenderTelemetry({THREE,renderer,camera,car,wheels,vehicle,chassis,roadSamples,jumpZone}){
  const output=document.createElement("pre");output.id="render-telemetry";output.setAttribute("aria-live","polite");
  Object.assign(output.style,{position:"fixed",right:"8px",bottom:"8px",zIndex:"50",maxWidth:"42rem",maxHeight:"45vh",overflow:"auto",margin:"0",padding:"8px",color:"#dff",background:"#071521e8",font:"11px/1.35 ui-monospace,monospace",whiteSpace:"pre-wrap",pointerEvents:"none"});
  document.body.append(output);
  const frames=[],screenPoint=new THREE.Vector3(),previous={time:null,speed:null,clearance:null,screenY:null,cameraBody:null,wheelOffsets:null};let latest=null;
  function record(now){
    const projection=roadProjection(car.position,roadSamples),delta={x:car.position.x-projection.center.x,y:car.position.y-projection.center.y,z:car.position.z-projection.center.z};
    const clearance=delta.x*projection.up.x+delta.y*projection.up.y+delta.z*projection.up.z;
    screenPoint.copy(car.position).project(camera);const screenY=screenPoint.y;
    const cameraBody=camera.position.distanceTo(car.position),wheelOffsets=wheels.map(wheel=>wheel.root.position.y-car.position.y),dt=previous.time===null?0:(now-previous.time)/1000;
    const speed=Math.abs(vehicle.currentVehicleSpeed?.()||0)*3.6,contacts=[0,1,2,3].filter(index=>vehicle.wheelIsInContact(index)).length;
    const nearest=roadSamples.reduce((best,sample,index)=>{const distance=(sample.x-car.position.x)**2+(sample.z-car.position.z)**2;return distance<best.distance?{distance,index}:best},{distance:Infinity,index:0}).index;
    const sample={time:now,frameMs:dt*1000,speed,speedRate:dt&&previous.speed!==null?(speed-previous.speed)/dt:0,contacts,jump:nearest>=jumpZone.approach-6&&nearest<=jumpZone.landing+8,clearance,screenY,cameraBody,
      clearanceVelocity:dt?(clearance-previous.clearance)/dt:0,screenVelocity:dt?(screenY-previous.screenY)/dt:0,cameraBodyVelocity:dt?(cameraBody-previous.cameraBody)/dt:0,
      wheelBodyVelocity:dt&&previous.wheelOffsets?rms(wheelOffsets.map((value,index)=>(value-previous.wheelOffsets[index])/dt)):0,verticalVelocity:chassis.linvel().y};
    latest={speed:+speed.toFixed(1),contacts};if(speed>1||sample.jump){frames.push(sample);if(frames.length>7200)frames.shift()}
    Object.assign(previous,{time:now,speed,clearance,screenY,cameraBody,wheelOffsets});
    if(frames.length&&frames.length%30===0)output.textContent=JSON.stringify(report(),null,2);
  }
  function summarize(selected){
    const supported=selected.filter(frame=>frame.contacts===4&&!frame.jump),all=selected.filter(frame=>!frame.jump);
    return{frames:selected.length,supportedFrames:supported.length,contactLossFrames:all.filter(frame=>frame.contacts<4).length,
      roadNormalClearanceVelocityRms:+rms(supported.map(frame=>frame.clearanceVelocity)).toFixed(4),
      roadNormalClearanceVelocityP95:+percentile(supported.map(frame=>Math.abs(frame.clearanceVelocity)),.95).toFixed(4),
      renderedBodyScreenVelocityRms:+rms(supported.map(frame=>frame.screenVelocity)).toFixed(4),
      actualCameraBodyDistanceVelocityRms:+rms(supported.map(frame=>frame.cameraBodyVelocity)).toFixed(4),
      renderedWheelBodyRelativeVelocityRms:+rms(supported.map(frame=>frame.wheelBodyVelocity)).toFixed(4),
      chassisWorldVerticalVelocityRms:+rms(supported.map(frame=>frame.verticalVelocity)).toFixed(4)};
  }
  function report(){const intervals=frames.map(frame=>frame.frameMs).filter(value=>value>0&&value<100);return{source:"actual requestAnimationFrame render poses; local test page only",frameCount:frames.length,frameMs:{median:+percentile(intervals,.5).toFixed(2),p95:+percentile(intervals,.95).toFixed(2),p99:+percentile(intervals,.99).toFixed(2)},renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,...renderer.info.memory},
    accelerating38to55:summarize(frames.filter(frame=>frame.speed>=38&&frame.speed<=55&&frame.speedRate>.5)),
    all38to55:summarize(frames.filter(frame=>frame.speed>=38&&frame.speed<=55)),
    speed56to100:summarize(frames.filter(frame=>frame.speed>55&&frame.speed<=100)),
    jump:summarize(frames.filter(frame=>frame.jump)),latest};}
  return{record,report,element:output};
}
