import { COLS, ROWS } from "./constants.js?v=12";

export const ROUTE_PROFILES = [
  { name: "Mojave Run", amplitude: 1.7, frequency: .14, rough: "sand" },
  { name: "Red Rock", amplitude: 2.8, frequency: .12, rough: "mud" },
  { name: "Pine Ridge", amplitude: 2.25, frequency: .145, rough: "mud" },
  { name: "Moon Pass", amplitude: 3.2, frequency: .105, rough: "water" },
  { name: "Badlands", amplitude: 2.55, frequency: .16, rough: "sand" },
];

function hash(c, r, seed) {
  let value = Math.imul(c + 17, 374761393) + Math.imul(r + 31, 668265263) + Math.imul(seed + 7, 982451653);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function isOpen(grid, c, r) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && !grid[r][c].wall && !grid[r][c].gate && !grid[r][c].garage;
}

function isStraightCorridor(grid, c, r) {
  const vertical = isOpen(grid, c, r - 1) && isOpen(grid, c, r + 1);
  const horizontal = isOpen(grid, c - 1, r) && isOpen(grid, c + 1, r);
  return vertical !== horizontal;
}

export function createTrailFeatures(maze, routeIndex = 0) {
  const profile = ROUTE_PROFILES[routeIndex % ROUTE_PROFILES.length];
  const heights = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const surfaces = new Map();
  const rampCandidates = [];

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const broad = Math.sin((c + routeIndex * 3.1) * profile.frequency) * .52
        + Math.cos((r - routeIndex * 2.3) * profile.frequency * .91) * .36
        + Math.sin((c + r) * profile.frequency * .47) * .22;
      heights[r][c] = broad * profile.amplitude;
      if (!isOpen(maze.grid, c, r)) continue;
      const key = `${c},${r}`;
      if (key === `${maze.playerStart.c},${maze.playerStart.r}` || maze.powers.has(key)) continue;
      const value = hash(c, r, routeIndex);
      if (value < .075) surfaces.set(key, profile.rough);
      if (isStraightCorridor(maze.grid, c, r) && value > .965) rampCandidates.push({ key, value });
    }
  }

  rampCandidates.sort((a, b) => b.value - a.value).slice(0, 4).forEach(({ key }) => surfaces.set(key, "ramp"));
  return { profile, heights, surfaces };
}

export function terrainHeightAt(terrain, tileX, tileY) {
  if (!terrain) return 0;
  const x = Math.max(0, Math.min(COLS - 1, tileX - .5));
  const y = Math.max(0, Math.min(ROWS - 1, tileY - .5));
  const c0 = Math.floor(x), r0 = Math.floor(y), c1 = Math.min(COLS - 1, c0 + 1), r1 = Math.min(ROWS - 1, r0 + 1);
  const tx = x - c0, ty = y - r0;
  const top = terrain.heights[r0][c0] * (1 - tx) + terrain.heights[r0][c1] * tx;
  const bottom = terrain.heights[r1][c0] * (1 - tx) + terrain.heights[r1][c1] * tx;
  return top * (1 - ty) + bottom * ty;
}

export function terrainGrade(terrain, tileX, tileY, dir) {
  if (!terrain || (!dir.x && !dir.y)) return 0;
  const ahead = terrainHeightAt(terrain, tileX + dir.x * .55, tileY + dir.y * .55);
  const behind = terrainHeightAt(terrain, tileX - dir.x * .55, tileY - dir.y * .55);
  return ahead - behind;
}

export function gradeSpeedFactor(grade, actor = "player") {
  const strength = actor === "player" ? .28 : .16;
  return Math.max(.62, Math.min(1.32, 1 - grade * strength));
}

export function surfaceSpeed(surface, actor = "player") {
  if (surface === "mud") return actor === "player" ? .64 : .78;
  if (surface === "water") return actor === "player" ? .72 : .84;
  if (surface === "sand") return actor === "player" ? .82 : .9;
  return 1;
}
