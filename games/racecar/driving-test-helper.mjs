import {curveAt,safeSpeed,clamp} from './rules.js';
export function driver(run,target=0,cornerSpeed=.8) {
  const p=run.player,k=curveAt(run.route,p.z)*.012;
  const desired=k*p.speed-(p.headingError||0)*2-(p.x-target)*.32-(p.lateralSpeed||0)*.02;
  const steer=clamp(desired/(.85*Math.max(p.speed,1)/(p.speed+8)),-1,1);
  return {steer,throttle:true,brake:p.speed>safeSpeed(run.route,p.z)*cornerSpeed,targetX:run.mode==='race'?undefined:target};
}
