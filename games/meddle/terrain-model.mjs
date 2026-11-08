const NEIGHBORS_8 = Object.freeze([
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],             [1, 0],
  [-1, 1],  [0, 1],   [1, 1]
]);

// Populous-style shaping changes one height point, then recursively restores
// a maximum one-level difference to all eight surrounding points.
export function populousTerrainShapePlan(heights, corner, delta, minimum = 0, maximum = 7) {
  if (!corner || !Array.isArray(heights) || !heights.length || ![-1, 1].includes(delta)) return [];
  const draft = heights.map(row => Array.isArray(row) ? [...row] : []);
  if (!draft[corner.y] || !Number.isFinite(draft[corner.y][corner.x])) return [];
  const initial = draft[corner.y][corner.x];
  const next = Math.max(minimum, Math.min(maximum, initial + delta));
  if (next === initial) return [];
  draft[corner.y][corner.x] = next;
  const queue = [{ x: corner.x, y: corner.y }];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index], currentHeight = draft[current.y][current.x];
    for (const [dx, dy] of NEIGHBORS_8) {
      const x = current.x + dx, y = current.y + dy;
      if (!draft[y] || !Number.isFinite(draft[y][x])) continue;
      const required = delta > 0 ? currentHeight - 1 : currentHeight + 1;
      const shouldChange = delta > 0 ? draft[y][x] < required : draft[y][x] > required;
      if (!shouldChange) continue;
      const adjusted = Math.max(minimum, Math.min(maximum, required));
      if (adjusted === draft[y][x]) continue;
      draft[y][x] = adjusted;
      queue.push({ x, y });
    }
  }
  const changes = [];
  for (let y = 0; y < draft.length; y += 1) for (let x = 0; x < draft[y].length; x += 1) {
    if (draft[y][x] !== heights[y][x]) changes.push({ x, y, from: heights[y][x], to: draft[y][x] });
  }
  return changes;
}

export function applyTerrainShapePlan(heights, plan) {
  const result = heights.map(row => [...row]);
  for (const change of plan || []) if (result[change.y] && Number.isFinite(result[change.y][change.x])) result[change.y][change.x] = change.to;
  return result;
}

export function maximumNeighborDelta(heights) {
  let maximum = 0;
  for (let y = 0; y < heights.length; y += 1) for (let x = 0; x < (heights[y]?.length || 0); x += 1) for (const [dx, dy] of NEIGHBORS_8) {
    const neighbor = heights[y + dy]?.[x + dx];
    if (Number.isFinite(neighbor)) maximum = Math.max(maximum, Math.abs(heights[y][x] - neighbor));
  }
  return maximum;
}

export function normalizePopulousTerrain(heights, minimum = 0, maximum = 7) {
  const result = heights.map(row => [...row]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 0; y < result.length; y += 1) for (let x = 0; x < (result[y]?.length || 0); x += 1) for (const [dx, dy] of NEIGHBORS_8) {
      const neighbor = result[y + dy]?.[x + dx];
      if (!Number.isFinite(neighbor) || result[y][x] <= neighbor + 1) continue;
      result[y][x] = Math.max(minimum, Math.min(maximum, neighbor + 1));
      changed = true;
    }
  }
  return result;
}
