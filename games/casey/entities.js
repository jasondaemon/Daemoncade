import { TILE_SIZE } from "./constants.js";

export function createPlayer(start) {
  return {
    x: start.c * TILE_SIZE + TILE_SIZE / 2,
    y: start.r * TILE_SIZE + TILE_SIZE / 2,
    tile: { ...start },
    dir: { x: 0, y: 0 },
    nextDir: { x: 0, y: 0 },
    lastDecisionKey: null,
  };
}

export function createEnemy(type, start, color, corner) {
  return {
    type,
    x: start.c * TILE_SIZE + TILE_SIZE / 2,
    y: start.r * TILE_SIZE + TILE_SIZE / 2,
    tile: { ...start },
    dir: { x: 0, y: -1 },
    nextDir: { x: 0, y: -1 },
    color,
    corner,
    state: "normal",
    respawn: 0,
    lastDecisionKey: null,
  };
}

export function shouldProcessIntersection(entity, center, tolerance) {
  const key = `${entity.tile.c},${entity.tile.r}`;
  if (entity.lastDecisionKey === key) return false;
  return Math.abs(entity.x - center.x) <= tolerance && Math.abs(entity.y - center.y) <= tolerance;
}

export function markIntersectionProcessed(entity) {
  entity.lastDecisionKey = `${entity.tile.c},${entity.tile.r}`;
}

export function tileCenter(c, r, offsetY) {
  return {
    x: c * TILE_SIZE + TILE_SIZE / 2,
    y: r * TILE_SIZE + TILE_SIZE / 2,
  };
}
