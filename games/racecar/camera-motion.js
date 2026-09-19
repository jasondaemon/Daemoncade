// Exact damped follow for a linearly moving target during this render interval.
// Unlike lerping toward the end target, it does not change its steady-state
// trailing distance with refresh rate or individual frame duration.
export function followMovingTarget(position, previous, current, dt, rate=9) {
  if(dt<=0) return position;
  const decay=Math.exp(-rate*dt),velocity=(current-previous)/dt;
  return current-velocity/rate+(position-previous+velocity/rate)*decay;
}
