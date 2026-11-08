// Clip a terrain face to its upper half by interpolating world heights. The
// returned shape is camera-independent, so surface cover survives rotations.
export function upperTerrainPolygon(vertices) {
  if (!Array.isArray(vertices) || vertices.length < 3) return [];
  const clean = vertices.map(vertex => ({ x: Number(vertex.x), y: Number(vertex.y), h: Number(vertex.h) }));
  if (clean.some(vertex => !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || !Number.isFinite(vertex.h))) return [];
  const heights = clean.map(vertex => vertex.h), low = Math.min(...heights), high = Math.max(...heights);
  if (high - low < 1e-6) return clean;
  const threshold = (low + high) / 2, output = [];
  for (let index = 0; index < clean.length; index++) {
    const current = clean[index], next = clean[(index + 1) % clean.length];
    const currentInside = current.h >= threshold, nextInside = next.h >= threshold;
    if (currentInside) output.push(current);
    if (currentInside !== nextInside) {
      const ratio = (threshold - current.h) / (next.h - current.h);
      output.push({ x: current.x + (next.x - current.x) * ratio, y: current.y + (next.y - current.y) * ratio, h: threshold });
    }
  }
  return output;
}
