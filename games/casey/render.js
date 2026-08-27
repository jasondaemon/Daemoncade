import { TILE_SIZE, HUD_HEIGHT, BASE_WIDTH, BASE_HEIGHT, FRIGHT_BLINK_TIME } from "./constants.js";

const spritePatterns = {
  casey48: [
    "................................................",
    "..................OOOOOOOOOOOO..................",
    "..............OOOOObbbbbbbbbbbOOOO...............",
    "............OOObbbbbbbbbbbbbbbbbbbOO.............",
    "..........OOObbbbbbbbbbbbbbbbbbbbbbbOO...........",
    ".........OObbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    "........OObbbbbbbbbwwwwwwwwbbbbbbbbbbbO..........",
    "........ObbbbbbbbbwwwwwwwwwwbbbbbbbbbbO..........",
    "........ObbbbbbbbbwwwwwwwwwwbbbbbbbbbbO..........",
    "........ObbbbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    "........ObbbbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    "........ObbbbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    ".........ObbbbbbbbbbbbbbbbbbbbbbbbbbbO...........",
    "..........OObbbbbbbbbbbbbbbbbbbbbbbOO............",
    "............OOOrrrrrrrrrrrrrrrrrOOO..............",
    "...............OrrrrrrrrrrrrrrrO.................",
    "...............ObbbbbbbbbbbbbbbO.................",
    "...............ObbbbbbbbbbbbbbbO.................",
    "...............Oaa...........aaO.................",
    ".............OOOtttt.......ttttOOO...............",
    "............Ottttttt.....ttttttttO...............",
    "............Ottttttt.....ttttttttO...............",
    ".............OOOtttt.....ttttOOO................",
    "................OOOO.....OOOO....................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
  ],
  casey48_bounce: [
    "................................................",
    "..................OOOOOOOOOOOO..................",
    "..............OOOOObbbbbbbbbbbOOOO...............",
    "............OOObbbbbbbbbbbbbbbbbbbOO.............",
    "..........OOObbbbbbbbbbbbbbbbbbbbbbbOO...........",
    ".........OObbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    "........OObbbbbbbbbwwwwwwwwbbbbbbbbbbbO..........",
    "........ObbbbbbbbbwwwwwwwwwwbbbbbbbbbbO..........",
    "........ObbbbbbbbbwwwwwwwwwwbbbbbbbbbbO..........",
    "........ObbbbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    "........ObbbbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    "........ObbbbbbbbbbbbbbbbbbbbbbbbbbbbbO..........",
    ".........ObbbbbbbbbbbbbbbbbbbbbbbbbbbO...........",
    "..........OObbbbbbbbbbbbbbbbbbbbbbbOO............",
    "............OOOrrrrrrrrrrrrrrrrrOOO..............",
    "...............OrrrrrrrrrrrrrrrO.................",
    "...............ObbbbbbbbbbbbbbbO.................",
    "...............ObbbbbbbbbbbbbbbO.................",
    "...............Oaa...........aaO.................",
    ".............OOOtttt.......ttttOOO...............",
    "............Ottttttt.....ttttttttO...............",
    "............Ottttttt.....ttttttttO...............",
    ".............OOOtttt.....ttttOOO................",
    "................OOOO.....OOOO....................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
  ],
  jeep48: [
    "................................................",
    "..................OOOOOOOOOO....................",
    "..............OOOOObbbbbbbbbOOOO................",
    "............OOObbbbbbbbbbbbbbbbOO...............",
    "..........OOObbbbbbbbbbbbbbbbbbbbOO.............",
    ".........OObbbbbbbbbbbbbbbbbbbbbbbbO............",
    "........OObbbbbbbbbwwwwwwbbbbbbbbbbbO...........",
    "........ObbbbbbbbbwwwwwwwwbbbbbbbbbbO...........",
    "........ObbbbbbbbbwwwwwwwwbbbbbbbbbbO...........",
    "........ObbbbbbbbbbbbbbbbbbbbbbbbbbbO...........",
    ".........ObbbbbbbbbbbbbbbbbbbbbbbbO.............",
    "..........OObbbbbbbbbbbbbbbbbbbbOO..............",
    "............OOOOhhhhhhhhhhhhOOO................",
    "...............OhhhhhhhhhhhhhO..................",
    "...............ObbbbbbbbbbbbbO..................",
    "...............ObbbbbbbbbbbbbO..................",
    "...............Oaa.........aaO..................",
    ".............OOOtttt.....ttttOOO................",
    "............Ottttttt...ttttttttO................",
    "............Ottttttt...ttttttttO................",
    ".............OOOtttt...ttttOOO..................",
    "................OOOO...OOOO.....................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
  ],
  gas32: [
    "................................",
    ".............OOOOOOOO...........",
    "...........OOrrrrrrrrOO.........",
    "..........OrhhhhhhhhrrO.........",
    "..........OrhrrrrrrhrrO.........",
    "..........OrhrrrrrrhrrO.........",
    "..........OrhrrrrrrhrrO.........",
    "..........OrhhhhhhhhrrO.........",
    "..........OrrrrrrrrrrrO.........",
    "..........OrrssrrrrssrO.........",
    "..........OrrsOrrrrOsrO.........",
    "..........OrrssrrrrssrO.........",
    "..........OrrrrrrrrrrrO.........",
    "..........OrrrrrrrrrrrO.........",
    "..........OrrssrrrrssrO.........",
    "..........OrrsrrrrrrsrO.........",
    "..........OrrsrrrrrrsrO.........",
    "..........OrrsrrrrrrsrO.........",
    "..........OrrssrrrrssrO.........",
    "..........OrrrrrrrrrrrO.........",
    "..........OrrrrrrrrrrrO.........",
    "..........OrrrrrrrrrrrO.........",
    "..........OOO....OOOOOO.........",
    "...........OO....OO.............",
    "...........OO....OO.............",
    "...........OO....OO.............",
    ".............OyykO..............",
    "..............yyk...............",
    "...............yk...............",
    "................................",
    "................................",
    "................................",
  ],
  tire32: [
    "................................",
    "............OOOOOOOO............",
    ".........OOOttttttttOO..........",
    "........OttttttttttttO..........",
    "......OOtttOOttttOOtttOO........",
    ".....OtttOOOttttOOOttttO........",
    "....OtttOmmOttttOmmOttttO.......",
    "...OtttOmmmOttttOmmmOttttO......",
    "...OtttOmmmOttttOmmmOttttO......",
    "..OttttOmmOttttttOmmOtttttO.....",
    "..OtttttOOttttttttOOtttttO.....",
    "..OtttttttttlllltttttttttO.....",
    "..OttttttttllllllllttttttO.....",
    "..OttttttttllllllllttttttO.....",
    "..OtttttttttlllllltttttttO.....",
    "..OtttttOOttttttttOOtttttO.....",
    "..OttttOmmOttttttOmmOttttO.....",
    "...OtttOmmmOttttOmmmOttttO......",
    "...OtttOmmmOttttOmmmOttttO......",
    "....OtttOmmOttttOmmOttttO.......",
    ".....OtttOOOttttOOOttttO........",
    "......OOtttOOttttOOtttOO........",
    "........OttttttttttttO..........",
    ".........OOOttttttOOO...........",
    "............OOOOOOOO............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ],
  bumper: [
    "...111111...",
    "..12222221..",
    ".1222333221.",
    ".1222333221.",
    ".1222333221.",
    ".1222333221.",
    ".1222222221.",
    "..12222221..",
    "...111111...",
    "..44..44....",
    "..44..44....",
    "............",
  ],
  shocks: [
    "..11..11..11.",
    ".1222222221.",
    "111111111111",
    "222222222222",
    "111111111111",
    ".1222222221.",
    "..11..11..11.",
    "..44..44....",
    "..44..44....",
    "............",
    "............",
    "............",
  ],
  lights: [
    "...111111...",
    "..12222221..",
    ".1222333221.",
    ".1222333221.",
    "...111111...",
    "..44..44....",
    "..44..44....",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  winch: [
    "...111111...",
    "..12222221..",
    ".1222333221.",
    ".1222333221.",
    "...111111...",
    "..44..44....",
    "..44444444..",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  snorkel: [
    "...111111...",
    "..12222221..",
    ".1222333221.",
    ".1222333221.",
    "...111111...",
    ".....44.....",
    ".....44.....",
    ".....44.....",
    "............",
    "............",
    "............",
    "............",
  ],
  roofrack: [
    "111111111111",
    "122222222221",
    "122233332221",
    "122233332221",
    "111111111111",
    "..44..44....",
    "..44..44....",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  boards: [
    "111111111111",
    "122222222221",
    "133333333331",
    "133333333331",
    "122222222221",
    "111111111111",
    "..44..44....",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
};

export function createSprites(palette) {
  const cache = {};
  Object.entries(spritePatterns).forEach(([key, pattern]) => {
    const h = pattern.length;
    const w = pattern[0].length;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const ch = pattern[y][x];
        if (ch === ".") continue;
        const color = palette[ch] || palette["1"];
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    cache[key] = { canvas, w, h };
  });
  return cache;
}

export function drawMaze(ctx, maze, offsetY, theme) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  ctx.fillStyle = theme.wall;
  for (let r = 0; r < maze.grid.length; r += 1) {
    for (let c = 0; c < maze.grid[r].length; c += 1) {
      if (maze.grid[r][c].wall) {
        ctx.fillRect(c * TILE_SIZE, offsetY + r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  ctx.fillStyle = theme.gate;
  maze.grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.gate) {
        ctx.fillRect(c * TILE_SIZE + 2, offsetY + r * TILE_SIZE + TILE_SIZE / 2 - 1, TILE_SIZE - 4, 2);
      }
    });
  });
}

export function drawHud(ctx, score, highScore, lives, level, miniSprite) {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, BASE_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = "#e6f0ff";
  ctx.font = "14px 'Avenir Next', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE ${String(score).padStart(6, "0")}`, 10, 20);
  ctx.fillText(`HI ${String(highScore).padStart(6, "0")}`, 150, 20);
  ctx.textAlign = "center";
  ctx.fillText(`LEVEL ${level}`, BASE_WIDTH / 2, 20);

  ctx.textAlign = "right";
  ctx.fillText("LIVES", BASE_WIDTH - 90, 20);
  ctx.textAlign = "left";
  const startX = BASE_WIDTH - 90;
  for (let i = 0; i < lives; i += 1) {
    if (miniSprite) {
      drawSprite(ctx, miniSprite, startX + i * 20, 16, 14);
    } else {
      ctx.fillStyle = "#e6f0ff";
      ctx.fillRect(startX + i * 16, 12, 10, 6);
      ctx.fillRect(startX + i * 16 + 2, 8, 6, 4);
    }
  }
}

export function drawPellets(ctx, pellets, offsetY, sprite) {
  pellets.forEach((key) => {
    const [c, r] = key.split(",").map(Number);
    drawSprite(ctx, sprite, c * TILE_SIZE + TILE_SIZE / 2, offsetY + r * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.7, TILE_SIZE * 0.7);
  });
}

export function drawPowers(ctx, powers, offsetY, sprite) {
  powers.forEach((key) => {
    const [c, r] = key.split(",").map(Number);
    drawSprite(ctx, sprite, c * TILE_SIZE + TILE_SIZE / 2, offsetY + r * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.9, TILE_SIZE * 0.9);
  });
}

export function drawSprite(ctx, sprite, x, y, width, height, flipX = false) {
  const w = width ?? sprite.w;
  const h = height ?? sprite.h;
  const scaleX = w / sprite.w;
  const scaleY = h / sprite.h;
  ctx.save();
  ctx.translate(x, y);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(
    sprite.canvas,
    -(sprite.w * scaleX) / 2,
    -(sprite.h * scaleY) / 2,
    sprite.w * scaleX,
    sprite.h * scaleY,
  );
  ctx.restore();
}

export function drawPlayer(ctx, player, offsetY, sprites, timeMs) {
  if (!player) return;
  const dir = player.dir;
  const width = TILE_SIZE * 1.35;
  const height = TILE_SIZE * 0.9;
  const frame = Math.floor(timeMs / 200) % 2;
  let sprite = frame === 0 ? sprites.casey48 : sprites.casey48_bounce;
  let flip = false;
  if (dir.x > 0) flip = true;
  if (dir.y < 0) sprite = sprites.casey48;
  if (dir.y > 0) sprite = sprites.casey48;
  drawSprite(ctx, sprite, player.x, offsetY + player.y, width, height, flip);
}

export function drawEnemies(ctx, enemies, offsetY, sprites, frightened, frightenedTime, timeMs) {
  enemies.forEach((enemy) => {
    if (enemy.state === "respawn" || enemy.state === "in-garage") return;
    const frame = Math.floor(timeMs / 200) % 2;
    let sprite = frame === 0 ? sprites.colors[enemy.color].left : sprites.colors[enemy.color].leftBounce;
    let flip = false;
    if (enemy.state === "returning") {
      sprite = sprites.eaten;
    } else if (frightened && enemy.state === "frightened") {
      const blink = frightenedTime < FRIGHT_BLINK_TIME && Math.floor(frightenedTime * 6) % 2 === 0;
      sprite = blink ? sprites.frightAlt : sprites.fright;
    }
    const dir = enemy.dir;
    if (dir.x > 0) flip = true;
    if (dir.y < 0) {
      if (enemy.state === "returning") sprite = sprites.eatenUp || sprites.eaten;
      else if (frightened && enemy.state === "frightened") {
        const blink = frightenedTime < FRIGHT_BLINK_TIME && Math.floor(frightenedTime * 6) % 2 === 0;
        sprite = blink ? sprites.frightAltUp || sprites.frightAlt : sprites.frightUp || sprites.fright;
      } else {
        sprite = sprites.colors[enemy.color].up;
      }
    }
    if (dir.y > 0) {
      if (enemy.state === "returning") sprite = sprites.eatenDown || sprites.eaten;
      else if (frightened && enemy.state === "frightened") {
        const blink = frightenedTime < FRIGHT_BLINK_TIME && Math.floor(frightenedTime * 6) % 2 === 0;
        sprite = blink ? sprites.frightAltDown || sprites.frightAlt : sprites.frightDown || sprites.fright;
      } else {
        sprite = sprites.colors[enemy.color].down;
      }
    }
    drawSprite(ctx, sprite || sprites.colors[enemy.color].left, enemy.x, offsetY + enemy.y, TILE_SIZE * 1.3, TILE_SIZE * 0.9, flip);
  });
}
