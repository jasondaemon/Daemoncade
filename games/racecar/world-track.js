import { circuitPoint } from "./circuit.js?v=39";
import { curveAt } from "./rules.js?v=39";
export const ROAD_HALF = 7;
export function chasePose(track, distance, lateral) {
  const p = trackPoint(track, distance, lateral * ROAD_HALF),
    c = trackPoint(track, distance),
    dx = Math.cos(c.heading),
    dz = Math.sin(c.heading),
    x = c.x + (p.x - c.x) * 0.65,
    z = c.y + (p.y - c.y) * 0.65;
  return {
    position: { x: x - dx * 30, y: 13, z: z - dz * 30 },
    look: { x: x + dx * 28, y: 1, z: z + dz * 28 },
  };
}
// These coordinates are built once, never re-bent relative to the camera.
export function buildTrack(route) {
  const closed = !!route.circuit,
    points = [];
  if (closed) {
    for (let s = 0; s <= route.length; s += 2)
      points.push({ ...circuitPoint(route, s), s });
    points.push({ ...circuitPoint(route, route.length), s: route.length });
  } else {
    let x = 0,
      y = 0,
      heading = 0;
    for (let s = -80; s <= route.length + 450; s += 2) {
      points.push({ x, y, heading, s });
      heading += curveAt(route, Math.max(0, s)) * 2 * 0.004;
      x += Math.cos(heading) * 2;
      y += Math.sin(heading) * 2;
    }
  }
  return { route, closed, points };
}
export function trackPoint(track, distance, lateral = 0) {
  const points = track.points,
    s = track.closed
      ? ((distance % track.route.length) + track.route.length) %
        track.route.length
      : Math.max(points[0].s, Math.min(points.at(-1).s, distance));
  let lo = 0,
    hi = points.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (points[m].s <= s) lo = m;
    else hi = m;
  }
  const a = points[lo],
    b = points[hi],
    t = (s - a.s) / Math.max(0.00001, b.s - a.s),
    heading = a.heading + (b.heading - a.heading) * t;
  return {
    x: a.x + (b.x - a.x) * t - Math.sin(heading) * lateral,
    y: a.y + (b.y - a.y) * t + Math.cos(heading) * lateral,
    heading,
  };
}
export function trackStrip(track, from, to, left, right, height = 0.025) {
  const a = trackPoint(track, from, left),
    b = trackPoint(track, from, right),
    c = trackPoint(track, to, left),
    d = trackPoint(track, to, right);
  return [a, b, c, b, d, c].flatMap((p) => [p.x, height, p.y]);
}
