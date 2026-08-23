import { COLS, ROWS } from "./constants.js";
import { isPassable } from "./maze.js";

const DIRS = [
  { x: 0, y: -1, name: "up" },
  { x: 0, y: 1, name: "down" },
  { x: -1, y: 0, name: "left" },
  { x: 1, y: 0, name: "right" },
];

export function getOpposite(dir) {
  return { x: -dir.x, y: -dir.y };
}

export function directionEquals(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

export function pickDirection({ grid, tile, currentDir, target, allowGate, forbidReverse }) {
  const options = [];
  for (const dir of DIRS) {
    if (forbidReverse && directionEquals(dir, getOpposite(currentDir))) continue;
    const nc = tile.c + dir.x;
    const nr = tile.r + dir.y;
    if (isPassable(grid, nc, nr, allowGate)) options.push(dir);
  }
  if (!options.length) {
    for (const dir of DIRS) {
      const nc = tile.c + dir.x;
      const nr = tile.r + dir.y;
      if (isPassable(grid, nc, nr, allowGate)) options.push(dir);
    }
  }
  if (!options.length) return currentDir;
  let best = options[0];
  let bestDist = Infinity;
  for (const dir of options) {
    const nc = tile.c + dir.x;
    const nr = tile.r + dir.y;
    const dist = Math.abs(nc - target.c) + Math.abs(nr - target.r);
    if (dist < bestDist) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

export function pickRandomDirection({ grid, tile, currentDir, allowGate }) {
  const options = [];
  for (const dir of DIRS) {
    if (directionEquals(dir, getOpposite(currentDir))) continue;
    const nc = tile.c + dir.x;
    const nr = tile.r + dir.y;
    if (isPassable(grid, nc, nr, allowGate)) options.push(dir);
  }
  if (!options.length) {
    for (const dir of DIRS) {
      const nc = tile.c + dir.x;
      const nr = tile.r + dir.y;
      if (isPassable(grid, nc, nr, allowGate)) options.push(dir);
    }
  }
  if (!options.length) return currentDir;
  return options[Math.floor(Math.random() * options.length)];
}

export function pickReturnDirection({ grid, tile, currentDir, target, allowGate }) {
  const options = [];
  for (const dir of DIRS) {
    const nc = tile.c + dir.x;
    const nr = tile.r + dir.y;
    if (isPassable(grid, nc, nr, allowGate)) options.push(dir);
  }
  if (!options.length) return currentDir;
  let bestDist = Infinity;
  let best = [];
  for (const dir of options) {
    const nc = tile.c + dir.x;
    const nr = tile.r + dir.y;
    const dist = Math.abs(nc - target.c) + Math.abs(nr - target.r);
    if (dist < bestDist) {
      bestDist = dist;
      best = [dir];
    } else if (dist === bestDist) {
      best.push(dir);
    }
  }
  if (best.length === 1) return best[0];
  const straight = best.find((dir) => directionEquals(dir, currentDir));
  if (straight) return straight;
  const left = { x: -currentDir.y, y: currentDir.x };
  const right = { x: currentDir.y, y: -currentDir.x };
  const leftPick = best.find((dir) => directionEquals(dir, left));
  if (leftPick) return leftPick;
  const rightPick = best.find((dir) => directionEquals(dir, right));
  if (rightPick) return rightPick;
  return best[0];
}

export function getTarget(enemy, player, enemies, mode) {
  if (enemy.type === "wanderer") {
    if (mode === "scatter") return enemy.corner;
    return enemy.patrol || enemy.corner;
  }
  if (enemy.type === "ambusher") {
    return {
      c: clamp(player.tile.c + player.dir.x * 4, 0, COLS - 1),
      r: clamp(player.tile.r + player.dir.y * 4, 0, ROWS - 1),
    };
  }
  if (enemy.type === "trickster") {
    const chaser = enemies.find((e) => e.type === "chaser") || enemy;
    const ahead = {
      c: player.tile.c + player.dir.x * 2,
      r: player.tile.r + player.dir.y * 2,
    };
    const vecC = ahead.c - chaser.tile.c;
    const vecR = ahead.r - chaser.tile.r;
    return {
      c: clamp(chaser.tile.c + vecC * 2, 0, COLS - 1),
      r: clamp(chaser.tile.r + vecR * 2, 0, ROWS - 1),
    };
  }
  if (enemy.type === "chaser") {
    return { ...player.tile };
  }
  return { ...player.tile };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
