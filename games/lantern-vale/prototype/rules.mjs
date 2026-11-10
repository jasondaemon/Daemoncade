export const W = 16, H = 10;
export const names = ['Fern Landing', 'Root Gallery', 'Whisper Hollow', 'Stone Watch', 'Beacon Chamber'];
// Each chamber has a central east/west threshold. The hollow's rune bridge
// requires light; the watch gate consumes the hollow's key.
export function tile(room, x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return '#';
  if (y === 0 || y === H - 1) return '#';
  if (x === 0) return room > 0 && y === 5 ? '.' : '#';
  if (x === W - 1) return room < 4 && y === 5 ? (room === 3 ? 'D' : '.') : '#';
  if (room === 2 && x === 8) return y === 5 ? '~' : '#';
  if ((room === 1 || room === 3) && (x === 6 || x === 10) && (y === 3 || y === 7)) return '#';
  return '.';
}
export function fresh() {
  return { room: 0, x: 3.5, y: 5.5, facing: [1, 0], hp: 6, light: false, key: false, door: false, rune: false, status: 'playing', inv: 0, cooldown: 0, swing: 0,
    enemies: [[], [{x:11.5,y:4.5,hp:2}], [{x:12.5,y:3.5,hp:2}], [{x:9.5,y:5.5,hp:2},{x:12.5,y:6.5,hp:2}], []] };
}
export function solid(s, x, y) {
  const t = tile(s.room, Math.floor(x), Math.floor(y));
  return t === '#' || (t === '~' && !s.light) || (t === 'D' && !s.door);
}
export function canStand(s,x,y) {
  return [-.23,.23].every(a=>[-.23,.23].every(b=>!solid(s,x+a,y+b)));
}
function move(s, actor, dx, dy) {
  if (canStand(s,actor.x+dx,actor.y)) actor.x+=dx;
  if (canStand(s,actor.x,actor.y+dy)) actor.y+=dy;
}
export function toggle(s) { if(s.status === 'playing') s.light = !s.light; }
export function pause(s) { if(s.status === 'playing') s.status='paused'; else if(s.status==='paused') s.status='playing'; }
export function attack(s) {
  if(s.status !== 'playing' || s.cooldown>0) return;
  s.cooldown=.32; s.swing=.16;
  for(const e of s.enemies[s.room]) {
    const dx=e.x-s.x, dy=e.y-s.y;
    if(e.hp>0 && Math.hypot(dx,dy)<1.65 && dx*s.facing[0]+dy*s.facing[1]>-.15) e.hp--;
  }
}
export function step(s, input, dt) {
  if(s.status!=='playing') return;
  dt=Math.max(0,Math.min(dt,.04));
  s.inv=Math.max(0,s.inv-dt); s.cooldown=Math.max(0,s.cooldown-dt); s.swing=Math.max(0,s.swing-dt);
  let dx=input.x||0,dy=input.y||0; const n=Math.hypot(dx,dy);
  if(n) { dx/=n;dy/=n;s.facing=[dx,dy];move(s,s,dx*3.5*dt,dy*3.5*dt); }
  if(s.room===3 && s.key && s.x>13 && Math.abs(s.y-5.5)<1) s.door=true;
  if(s.x>15.5 && s.room<4) {s.room++;s.x=.55;}
  else if(s.x<.5 && s.room>0) {s.room--;s.x=15.45;}
  if(s.room===2 && s.light && Math.hypot(s.x-12.5,s.y-5.5)<.7) {s.key=true;s.rune=true;}
  for(const e of s.enemies[s.room]) {
    if(e.hp<=0) continue;
    const ex=s.x-e.x,ey=s.y-e.y,d=Math.hypot(ex,ey);
    if(d<(s.light?9:2.4) && d>.05) move(s,e,ex/d*dt*(s.light?1.35:.8),ey/d*dt*(s.light?1.35:.8));
    if(d<.65 && !s.inv) {s.hp--;s.inv=1.1;if(s.hp<=0)s.status='dead';}
  }
  if(s.room===4 && s.light && s.rune && Math.hypot(s.x-12.5,s.y-5.5)<1) s.status='won';
}
export function objective(s) {
  if(s.status==='dead') return 'The shadows prevailed. Restart to try again.';
  if(s.status==='won') return 'The beacon blooms. Lantern Vale is awake!';
  if(!s.key) return 'Go east to Whisper Hollow. Light reveals a bridge and a rune key.';
  if(!s.door) return 'Carry the rune key east to the Stone Watch gate.';
  return 'Reach the eastern beacon and raise your lantern.';
}
