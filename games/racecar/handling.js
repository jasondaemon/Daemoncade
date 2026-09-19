const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ROAD_GRIP=28;
export function cornerLimit(curvature,grip=1) {return Math.sqrt(ROAD_GRIP*grip/Math.max(.0001,Math.abs(curvature)));}
export function integrateHandling(p,dt,steer,curvature,grip=1,drift=false,perfect=false) {
  // Drift is a held handling mode, not an upgrade or a consumable.
  const drifting=!perfect&&drift&&p.speed>5;
  p.drifting=drifting;
  p.driftAmount=(p.driftAmount||0)+((drifting?1:0)-(p.driftAmount||0))*(1-Math.exp(-dt*7));
  const slide=p.driftAmount;
  p.steering=(p.steering||0)+(clamp(steer,-1,1)-(p.steering||0))*(1-Math.exp(-dt*10));
  const desired=p.steering*.85*(1+slide*.45)*p.speed/(p.speed+8);
  const maxYaw=perfect?Infinity:ROAD_GRIP*grip*(1+slide*.35)/Math.max(8,p.speed);
  const yaw=clamp(desired,-maxYaw,maxYaw);
  p.slipping=Math.abs(desired)>maxYaw||(slide>.15&&Math.abs(p.steering)>.15);
  // Controlled speed scrub trades some exit speed for a tighter turn.
  p.speed=Math.max(0,p.speed-dt*slide*Math.abs(p.steering)*7);
  p.headingError=clamp((p.headingError||0)+yaw*dt,-1.15,1.15);
  const forward=p.speed*Math.max(.25,Math.cos(p.headingError))/clamp(1-curvature*p.x*7,.65,1.35);
  p.headingError-=curvature*forward*dt;
  const sideways=p.speed*Math.sin(p.headingError);
  if(perfect)p.lateralSpeed=sideways;
  p.lateralSpeed=(p.lateralSpeed||0)+(sideways-(p.lateralSpeed||0))*(1-Math.exp(-dt*(10-7*slide)*grip));
  p.x+=p.lateralSpeed*dt/7;
  p.z+=forward*dt;
  const wall=Math.abs(p.x)>1.3;
  if(wall){const side=Math.sign(p.x);p.x=side*1.3;p.headingError=-side*.08;p.lateralSpeed=-side*Math.min(2,Math.abs(p.lateralSpeed)*.2);}
  return wall;
}
