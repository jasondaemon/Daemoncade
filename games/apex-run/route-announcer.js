export function routeAnnouncement(state={key:""},{checkpoint=0,cue=null}={}){
  if(!cue?.label)return{state,text:null};
  const key=`${checkpoint}|${cue.label}`;
  if(state.key===key)return{state,text:null};
  const distance=Number.isFinite(cue.distance)?` in ${Math.max(0,Math.round(cue.distance/10)*10)} metres`:"";
  return{state:{key},text:`${cue.label}${distance}`};
}
