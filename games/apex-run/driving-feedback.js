const clamp01=value=>Math.max(0,Math.min(1,value));
const ramp=(value,start,end)=>clamp01((value-start)/(end-start));

export function drivingFeedback({speed=0,forward=false,reverse=false,reverseIntent=false,handbrake=false,contacts=0,slipRadians=0,surfaceBlend=1,racing=true}={}){
  if(!racing)return{engineLoad:0,brake:0,scrub:0,haze:0,fov:0};
  const moving=ramp(Math.abs(speed),3,22),grounded=clamp01(contacts/2),throttle=forward||reverse&&reverseIntent?1:0;
  const brake=reverse&&!reverseIntent?ramp(Math.abs(speed),3,18)*grounded:0;
  const slip=ramp(Math.abs(slipRadians),.075,.3)*moving*grounded;
  const scrub=clamp01(Math.max(slip,handbrake?moving*.72:0)*(.7+.3*clamp01(surfaceBlend)));
  return{engineLoad:throttle*(.45+.55*moving),brake,scrub,haze:clamp01(Math.max(scrub*.9,brake*.48)),fov:throttle*moving*.55-brake*1.05};
}

export function landingFeedback(impact=0){
  const strength=ramp(impact,2.5,12);
  return{strength,shake:.08+strength*.34,pitch:150-strength*58,gain:.075+strength*.085};
}
