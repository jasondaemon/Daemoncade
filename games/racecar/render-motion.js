// Rendering lags physics by at most one fixed step; collision state is untouched.
export function captureMotion(run) {
  return { source:run, time:run.time, player:{...run.player},
    rivals:run.rivals.map(a=>({...a})), traffic:run.traffic.map(a=>({...a})) };
}
export function interpolateMotion(run, previous, alpha) {
  if (!previous || previous.source!==run || run.phase!=='playing') return run;
  const t=Math.max(0,Math.min(1,alpha));
  const actor=(now,before)=>{
    if(!before) return now;
    const result={...now};
    for(const key of ['x','z','speed','headingError','steering','lateralSpeed'])
      if(Number.isFinite(before[key]) && Number.isFinite(now[key]))
        result[key]=before[key]+(now[key]-before[key])*t;
    return result;
  };
  const list=(now,before)=>{
    const byId=new Map(before.map(a=>[a.id,a]));
    return now.map(a=>actor(a,byId.get(a.id)));
  };
  return Object.assign(Object.create(run), {
    time:previous.time+(run.time-previous.time)*t,
    player:actor(run.player,previous.player),
    rivals:list(run.rivals,previous.rivals), traffic:list(run.traffic,previous.traffic),
  });
}
