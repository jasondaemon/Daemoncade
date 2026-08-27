import { COLS, ROWS } from "./constants.js";

export function parseMaze(layout) {
  const grid = [];
  const pellets = new Set();
  const powers = new Set();
  let playerStart = null;
  const enemyStarts = [];
  let garage = null;
  let gateTiles = [];
  let bonusTile = null;

  for (let r = 0; r < ROWS; r += 1) {
    const row = layout[r];
    grid[r] = [];
    for (let c = 0; c < COLS; c += 1) {
      const ch = row[c];
      const wall = ch === "#";
      grid[r][c] = {
        wall,
        gate: ch === "=",
        garage: ch === "G",
      };
      if (ch === ".") pellets.add(`${c},${r}`);
      if (ch === "o") powers.add(`${c},${r}`);
      if (ch === "P") playerStart = { c, r };
      if (ch === "E") enemyStarts.push({ c, r });
      if (ch === "G") garage = { c, r };
      if (ch === "=") gateTiles.push({ c, r });
      if (ch === "B") bonusTile = { c, r };
    }
  }

  const fallbackPlayer = playerStart || { c: 14, r: 23 };
  const safeStart = ensureOpenStart(grid, fallbackPlayer);

  return {
    grid,
    pellets,
    powers,
    playerStart: safeStart,
    enemyStarts: enemyStarts.length ? enemyStarts : [
      { c: 13, r: 15 },
      { c: 14, r: 15 },
      { c: 12, r: 16 },
      { c: 15, r: 16 },
    ],
    garage: garage || { c: 13, r: 15 },
    gateTiles,
    bonusTile: bonusTile || { c: 14, r: 19 },
  };
}

function ensureOpenStart(grid, start) {
  const passable = (c, r) => r >= 0 && r < grid.length && c >= 0 && c < grid[0].length && !grid[r][c].wall && !grid[r][c].gate;
  const hasMoves = (c, r) => {
    let count = 0;
    if (passable(c + 1, r)) count += 1;
    if (passable(c - 1, r)) count += 1;
    if (passable(c, r + 1)) count += 1;
    if (passable(c, r - 1)) count += 1;
    return count > 1;
  };
  if (passable(start.c, start.r) && hasMoves(start.c, start.r)) return start;
  for (let r = grid.length - 2; r > 1; r -= 1) {
    for (let c = 1; c < grid[0].length - 1; c += 1) {
      if (passable(c, r) && hasMoves(c, r)) return { c, r };
    }
  }
  return start;
}

export function isWall(grid, c, r) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  return grid[r][c].wall;
}

export function isGate(grid, c, r) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return grid[r][c].gate;
}

export function isGarage(grid, c, r) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return grid[r][c].garage;
}

export function isPassable(grid, c, r, allowGate = false) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  if (grid[r][c].wall) return false;
  if (grid[r][c].gate && !allowGate) return false;
  return true;
}
