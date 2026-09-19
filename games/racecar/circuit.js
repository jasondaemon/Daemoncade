// One closed, distance-indexed centerline drives the map, corners and backdrop.
const TAU = Math.PI * 2;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export function makeCircuit(route, stage) {
  const knots = route.knots || [
    [-1, -0.65],
    [-0.5, -0.65],
    [0, -0.65],
    [0.5, -0.65],
    [1, -0.65],
    [1.3, 0],
    [0.85, 0.65],
    [0, 0.65 - stage * 0.06],
    [-1, 0.65],
    [-1.3, 0],
  ];
  const points = [];
  let length = 0;
  for (let n = 0; n <= 512; n++) {
    const u = 2 + (n / 512) * knots.length,
      i = Math.floor(u) % knots.length,
      t = u % 1;
    const p = [-1, 0, 1, 2].map(
      (k) => knots[(i + k + knots.length) % knots.length],
    );
    const axis = (j) =>
      0.5 *
      (2 * p[1][j] +
        (-p[0][j] + p[2][j]) * t +
        (2 * p[0][j] - 5 * p[1][j] + 4 * p[2][j] - p[3][j]) * t * t +
        (-p[0][j] + 3 * p[1][j] - 3 * p[2][j] + p[3][j]) * t * t * t);
    const x = axis(0),
      y = axis(1) * (1 + stage * 0.06);
    if (n) length += Math.hypot(x - points[n - 1].x, y - points[n - 1].y);
    points.push({ x, y, z: length });
  }
  const scale = route.length / length;
  points.forEach((p) => {
    p.x *= scale;
    p.y *= scale;
    p.z *= scale;
  });
  let heading = 0;
  for (let i = 0; i < 512; i++) {
    const a = points[(i + 511) % 512],
      b = points[(i + 1) % 512];
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    heading = i ? heading + wrap(angle - heading) : angle;
    points[i].heading = heading;
  }
  points[512].heading = points[0].heading + TAU;
  return { ...route, circuit: points };
}
export function circuitPoint(route, distance) {
  const z = ((distance % route.length) + route.length) % route.length,
    points = route.circuit;
  let lo = 0,
    hi = 512;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (points[m].z <= z) lo = m;
    else hi = m;
  }
  const a = points[lo],
    b = points[hi],
    t = (z - a.z) / (b.z - a.z);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    heading:
      a.heading +
      (b.heading - a.heading) * t +
      Math.floor(distance / route.length) * TAU,
  };
}
export function circuitCurve(route, distance) {
  return (
    (circuitPoint(route, distance + 3).heading -
      circuitPoint(route, distance - 3).heading) /
    6 /
    0.012
  );
}
