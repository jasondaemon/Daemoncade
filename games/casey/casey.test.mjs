import test from "node:test";
import assert from "node:assert/strict";
import { MAZES, validateMazes } from "./mazes.js";
import { parseMaze, isPassable } from "./maze.js";
import { findPathDirection, pickDirection, pickDifficultyDirection } from "./ai.js";
import { CENTER_EPS, ENEMY_FRIGHT_SPEED, DIFFICULTIES } from "./constants.js";
import { createEnemy, createPlayer, shouldProcessIntersection, markIntersectionProcessed } from "./entities.js";
import { createTrailFeatures, surfaceSpeed, gradeSpeedFactor, terrainGrade } from "./trailSystems.js";

function reachableTiles(maze) {
  const seen = new Set([`${maze.playerStart.c},${maze.playerStart.r}`]);
  const queue = [maze.playerStart];
  while (queue.length) {
    const { c, r } = queue.shift();
    for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nc = c + dc, nr = r + dr, key = `${nc},${nr}`;
      if (seen.has(key) || !isPassable(maze.grid, nc, nr, false)) continue;
      seen.add(key); queue.push({ c: nc, r: nr });
    }
  }
  return seen;
}

test("all Casey routes have valid dimensions and reachable collectibles", () => {
  assert.doesNotThrow(validateMazes);
  for (const route of MAZES) {
    const maze = parseMaze(route.layout);
    const reachable = reachableTiles(maze);
    for (const key of [...maze.pellets, ...maze.powers]) {
      assert.ok(reachable.has(key), `${route.id} collectible ${key} is unreachable`);
    }
    assert.ok(maze.garageTiles.length >= 4, `${route.id} needs four garage spawn tiles`);
  }
});

test("sealed wall cells are never treated as passable", () => {
  for (const route of MAZES) {
    const maze = parseMaze(route.layout);
    maze.grid.forEach((row, r) => row.forEach((cell, c) => {
      if (cell.wall) assert.equal(isPassable(maze.grid, c, r, false), false, `${route.id} wall ${c},${r}`);
    }));
  }
});

test("every route can path rivals from Casey's start back to the garage", () => {
  for (const route of MAZES) {
    const maze = parseMaze(route.layout);
    let tile = { ...maze.playerStart };
    const visited = new Set();
    for (let step = 0; step < 1000 && !isGarageTile(maze, tile); step += 1) {
      const key = `${tile.c},${tile.r}`;
      assert.ok(!visited.has(key), `${route.id} garage route entered a loop at ${key}`);
      visited.add(key);
      const dir = findPathDirection({ grid: maze.grid, tile, targets: maze.garageTiles, allowGate: true });
      assert.ok(dir, `${route.id} has no route back to its garage`);
      tile = { c: tile.c + dir.x, r: tile.r + dir.y };
    }
    assert.ok(isGarageTile(maze, tile), `${route.id} failed to reach its garage`);
  }
});

function isGarageTile(maze, tile) {
  return maze.garageTiles.some((garage) => garage.c === tile.c && garage.r === tile.r);
}

test("frightened rivals advance beyond the center snap window", () => {
  assert.ok(ENEMY_FRIGHT_SPEED / 90 > CENTER_EPS);
});

test("every route generates safe off-road surfaces, elevation, and ramps", () => {
  MAZES.forEach((route, index) => {
    const maze = parseMaze(route.layout);
    const terrain = createTrailFeatures(maze, index);
    assert.equal(terrain.heights.length, 31);
    assert.ok(terrain.surfaces.size > 0, `${route.id} needs off-road terrain`);
    assert.ok([...terrain.surfaces.values()].includes("ramp"), `${route.id} needs a jump ramp`);
    terrain.surfaces.forEach((surface, key) => {
      const [c, r] = key.split(",").map(Number);
      assert.ok(isPassable(maze.grid, c, r, false), `${route.id} ${surface} must be on a drivable tile`);
    });
  });
});

test("rough surfaces slow Casey more than rival Jeeps", () => {
  for (const surface of ["mud", "water", "sand"]) {
    assert.ok(surfaceSpeed(surface, "player") < surfaceSpeed(surface, "enemy"));
    assert.ok(surfaceSpeed(surface, "enemy") <= 1);
  }
  assert.equal(surfaceSpeed("ramp", "player"), 1);
});

test("hills affect driving speed in both directions", () => {
  const maze = parseMaze(MAZES[3].layout);
  const terrain = createTrailFeatures(maze, 3);
  let foundGrade = 0;
  for (let r = 1; r < 30 && !foundGrade; r += 1) {
    for (let c = 1; c < 27; c += 1) {
      if (!isPassable(maze.grid, c, r, false)) continue;
      const grade = terrainGrade(terrain, c + .5, r + .5, { x: 1, y: 0 });
      if (Math.abs(grade) > .1) { foundGrade = grade; break; }
    }
  }
  assert.notEqual(foundGrade, 0);
  assert.ok(gradeSpeedFactor(Math.abs(foundGrade), "player") < 1, "uphill should slow Casey");
  assert.ok(gradeSpeedFactor(-Math.abs(foundGrade), "player") > 1, "downhill should accelerate Casey");
});

test("rivals keep their heading when two routes are equally good", () => {
  const grid = Array.from({ length: 31 }, () => Array.from({ length: 28 }, () => ({ wall: false, gate: false })));
  const currentDir = { x: 1, y: 0 };
  const chaseDir = pickDirection({ grid, tile: { c: 10, r: 10 }, currentDir, target: { c: 12, r: 8 }, allowGate: false, forbidReverse: true });
  const returnDir = findPathDirection({ grid, tile: { c: 10, r: 10 }, currentDir, targets: [{ c: 8, r: 10 }, { c: 12, r: 10 }] });
  assert.deepEqual({ x: chaseDir.x, y: chaseDir.y }, currentDir);
  assert.deepEqual({ x: returnDir.x, y: returnDir.y }, currentDir);
});

test("expert rivals avoid a tempting dead end by measuring the full route", () => {
  const grid = Array.from({ length: 31 }, (_, r) => Array.from({ length: 28 }, (_, c) => ({
    wall: r === 0 || r === 30 || c === 0 || c === 27,
    gate: false,
  })));
  grid[1][3].wall = true;
  grid[2][4].wall = true;
  grid[3][3].wall = true;
  const direction = pickDifficultyDirection({
    grid,
    tile: { c: 2, r: 2 },
    currentDir: { x: 1, y: 0 },
    target: { c: 5, r: 2 },
    intelligence: "path",
    mistakeRate: 0,
  });
  assert.notDeepEqual({ x: direction.x, y: direction.y }, { x: 1, y: 0 });
});

test("difficulty profiles alter both judgment and pressure", () => {
  assert.ok(DIFFICULTIES.easy.mistakeRate > DIFFICULTIES.normal.mistakeRate);
  assert.equal(DIFFICULTIES.hard.intelligence, "path");
  assert.ok(DIFFICULTIES.easy.speed < DIFFICULTIES.hard.speed);
  assert.ok(DIFFICULTIES.easy.releaseDelay > DIFFICULTIES.hard.releaseDelay);
});

test("a rival processes each intersection only once while leaving its center", () => {
  const enemy = createEnemy("chaser", { c: 5, r: 5 }, "#fff", { c: 1, r: 1 });
  const center = { x: enemy.x, y: enemy.y };
  const downhillTolerance = 2.1;
  assert.equal(shouldProcessIntersection(enemy, center, downhillTolerance), true);
  markIntersectionProcessed(enemy);
  enemy.x += 1.8;
  assert.equal(shouldProcessIntersection(enemy, center, downhillTolerance), false, "must not snap back to the same center");
  enemy.tile.c += 1;
  const nextCenter = { x: center.x + 36, y: center.y };
  enemy.x = nextCenter.x - 1.8;
  assert.equal(shouldProcessIntersection(enemy, nextCenter, downhillTolerance), true, "must process the next tile center");
});

test("turbo-speed Casey cannot repeatedly snap to one intersection", () => {
  const player = createPlayer({ c: 6, r: 8 });
  const center = { x: player.x, y: player.y };
  assert.equal(shouldProcessIntersection(player, center, 3.1), true);
  markIntersectionProcessed(player);
  player.x += 2.8;
  assert.equal(shouldProcessIntersection(player, center, 3.1), false);
});
