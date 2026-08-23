import { TILE_SIZE } from "./constants.js";

export function createPlayer(start) {
  return {
    x: start.c * TILE_SIZE + TILE_SIZE / 2,
    y: start.r * TILE_SIZE + TILE_SIZE / 2,
    tile: { ...start },
    dir: { x: 0, y: 0 },
    nextDir: { x: 0, y: 0 },
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
  };
}

export function tileCenter(c, r, offsetY) {
  return {
    x: c * TILE_SIZE + TILE_SIZE / 2,
    y: r * TILE_SIZE + TILE_SIZE / 2,
  };
}
