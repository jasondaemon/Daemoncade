// Independent image-strip scrolling, not rotating objects in the world.
export const BACKDROP_RATES = [0.25, 0.5, 1];
export function unwrapHeading(previous, current) {
  return (
    previous +
    Math.atan2(Math.sin(current - previous), Math.cos(current - previous))
  );
}
export function backdropOffset(heading, rate) {
  return heading * rate * 4 / (2 * Math.PI);
}
export function horizonHeight(vertical, horizontal, fov) {
  return 0.5 - vertical / horizontal / (2 * Math.tan(fov * Math.PI / 360));
}
