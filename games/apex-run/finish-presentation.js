export const FINISH_RUNOFF_LENGTH=82;
export const FINISH_RESULT_DELAY=1.25;
export const FINISH_COAST_SECONDS=4.25;

function normalized(vector,fallback={x:1,y:0,z:0}){
  const length=Math.hypot(vector?.x||0,vector?.y||0,vector?.z||0);
  return length>.0001?{x:vector.x/length,y:vector.y/length,z:vector.z/length}:{...fallback};
}

export function buildFinishRunoffSamples(finish,{length=FINISH_RUNOFF_LENGTH,step=4}={}){
  const forward=normalized(finish.forward),flatForward=normalized({x:forward.x,y:0,z:forward.z}),lateral=normalized(finish.lateral,{x:0,y:0,z:1}),width=finish.width,grade=forward.y/Math.max(.001,Math.hypot(forward.x,forward.z)),taper=20;
  return Array.from({length:Math.ceil(length/step)+1},(_,index)=>{
    const distance=Math.min(length,index*step),verticalDistance=distance<taper?grade*(distance-distance*distance/(2*taper)):grade*taper/2,x=finish.x+flatForward.x*distance,y=finish.y+verticalDistance,z=finish.z+flatForward.z*distance,half=width/2;
    return{x,y,z,width,bank:0,heading:Math.atan2(forward.z,forward.x),
      left:{x:x+lateral.x*half,y:y+lateral.y*half,z:z+lateral.z*half},
      right:{x:x-lateral.x*half,y:y-lateral.y*half,z:z-lateral.z*half}};
  });
}

export function finishCameraPose(finish){
  const forward=normalized(finish.forward),lateral=normalized(finish.lateral,{x:0,y:0,z:1}),up=normalized(finish.up,{x:0,y:1,z:0});
  return{
    position:{x:finish.x-forward.x*3+lateral.x*18+up.x*5.4,y:finish.y-forward.y*3+lateral.y*18+up.y*5.4,z:finish.z-forward.z*3+lateral.z*18+up.z*5.4},
    look:{x:finish.x+forward.x*12+up.x*1.2,y:finish.y+forward.y*12+up.y*1.2,z:finish.z+forward.z*12+up.z*1.2},
    up,
  };
}

export function advanceFinishPresentation(state,dt){
  if(!state.active)return state;
  const elapsed=state.elapsed+Math.max(0,dt);
  return{...state,elapsed,showResult:elapsed>=FINISH_RESULT_DELAY,active:elapsed<FINISH_COAST_SECONDS};
}
