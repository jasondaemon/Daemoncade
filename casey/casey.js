import { createGameSurface } from "../daemonos-shared/gameUtils.js";
import { createAppLoop } from "../daemonos-shared/appPerformance.js";
import { resourceTracker } from "../daemonos-shared/resourceTracker.js";
import { audioRegistry } from "../daemonos-shared/audioRegistry.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";
import {
  BASE_WIDTH,
  BASE_HEIGHT,
  COLS,
  ROWS,
  HUD_HEIGHT,
  TILE_SIZE,
  TURN_WINDOW,
  CENTER_EPS,
  PLAYER_SPEED,
  ENEMY_SPEED,
  ENEMY_FRIGHT_SPEED,
  ENEMY_EATEN_SPEED,
  POWER_DURATION,
  BONUS_SCORE,
  BONUS_INTERVAL_MIN,
  BONUS_INTERVAL_MAX,
  BONUS_DURATION,
  PELLET_SCORE,
  EAT_SCORES,
  LEVEL_SPEED_STEP,
  SCATTER_CHASE_SCHEDULE,
  SETTINGS_KEY,
  HIGHSCORE_KEY,
  HIGHSCORES_KEY,
  OFFROAD_PARTS,
} from "./constants.js";
import { MAZES, validateMazes } from "./mazes.js";
import { parseMaze, isPassable, isWall, isGate, isGarage } from "./maze.js";
import { createPlayer, createEnemy } from "./entities.js";
import { createSprites, drawMaze, drawHud, drawPellets, drawPowers, drawSprite, drawPlayer, drawEnemies } from "./render.js";
import { SoundEngine } from "./sound.js";
import { createInput } from "./input.js";
import { getTarget, pickDirection, pickRandomDirection, getOpposite, directionEquals } from "./ai.js";

const THEME = {
  background: "#0c1016",
  wall: "#28384a",
  pellet: "#f4c95d",
  gate: "#6ad2ff",
};

const PLAYER_PALETTE = {
  O: "#111318",
  b: "#20b6a6",
  w: "#b7f3ff",
  r: "#e9edf2",
  t: "#0d1117",
  a: "#ffd24a",
  h: "#1b7f75",
};

const BONUS_PALETTE = {
  "1": "#aaf2ff",
  "2": "#4ea1ff",
  "3": "#ffdf5d",
  "4": "#2d2f34",
};

const ENEMY_COLORS = ["#ff6f91", "#7bd5ff", "#6ef0c4", "#ffd166"];

const CORNERS = [
  { c: 1, r: 1 },
  { c: COLS - 2, r: 1 },
  { c: 1, r: ROWS - 2 },
  { c: COLS - 2, r: ROWS - 2 },
];

export function createApp() {
  validateMazes();
  const appId = "casey";
  const controller = new AbortController();
  const { signal } = controller;

  const wrapper = document.createElement("div");
  wrapper.className = "casey-app";
  wrapper.style.height = "100%";
  wrapper.style.width = "100%";
  wrapper.style.position = "relative";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.minWidth = "0";
  wrapper.style.minHeight = "0";

  const { content, ctx, view, resizeObserver, clear } = createGameSurface({
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    className: "casey-canvas",
    fit: "contain",
  });
  content.style.height = "100%";
  content.style.width = "100%";
  content.style.flex = "1";
  content.style.minWidth = "0";
  content.style.minHeight = "0";
  wrapper.appendChild(content);

  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("casey", "classic", "normal"),
    windowDays: 7,
    limit: 5,
  });

  const overlay = document.createElement("div");
  overlay.className = "casey-overlay";
  overlay.style.display = "none";
  wrapper.appendChild(overlay);

  const overlayCard = document.createElement("div");
  overlayCard.className = "casey-overlay-card";
  overlay.appendChild(overlayCard);

  const settingsPanel = document.createElement("div");
  settingsPanel.className = "casey-settings";
  settingsPanel.style.display = "none";
  wrapper.appendChild(settingsPanel);

  const defaultSettings = {
    music: true,
    sfx: true,
    musicVolume: 1,
    sfxVolume: 0.7,
  };
  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };

  const sound = new SoundEngine();
  audioRegistry.registerContext(appId, sound.ctx);
  sound.setMutedMusic(!settings.music);
  sound.setMutedSfx(!settings.sfx);
  sound.setVolumeMusic(settings.musicVolume);
  sound.setVolumeSfx(settings.sfxVolume);

  const music = new Audio("./casey.mp3");
  music.preload = "auto";
  music.loop = true;
  const baseMusicVolume = 0.5;
  music.volume = baseMusicVolume * settings.musicVolume;
  audioRegistry.registerMediaElement(appId, music);

  const playerSprites = createSprites(PLAYER_PALETTE);
  const jeepSprites = { colors: {} };
  ENEMY_COLORS.forEach((color) => {
    const set = createSprites({
      O: "#111318",
      b: color,
      w: "#b7f3ff",
      h: "#c9d0da",
      t: "#0d1117",
      a: "#ffd24a",
    });
    jeepSprites.colors[color] = {
      left: set.jeep48,
      leftBounce: set.jeep48,
      up: set.jeep48,
      down: set.jeep48,
    };
  });

  const frightSet = createSprites({
    O: "#111318",
    b: "#2d7cff",
    w: "#b7f3ff",
    h: "#c9d0da",
    t: "#0d1117",
    a: "#8fb7ff",
  });
  jeepSprites.fright = frightSet.jeep48;
  jeepSprites.frightUp = frightSet.jeep48;
  jeepSprites.frightDown = frightSet.jeep48;

  const frightAltSet = createSprites({
    O: "#111318",
    b: "#6ea3ff",
    w: "#e6f0ff",
    h: "#c9d0da",
    t: "#0d1117",
    a: "#ffffff",
  });
  jeepSprites.frightAlt = frightAltSet.jeep48;
  jeepSprites.frightAltUp = frightAltSet.jeep48;
  jeepSprites.frightAltDown = frightAltSet.jeep48;

  const eatenSet = createSprites({
    O: "#111318",
    b: "#f4f6fa",
    w: "#f4f6fa",
    h: "#c9d0da",
    t: "#1e242b",
    a: "#c9d0da",
  });
  jeepSprites.eaten = eatenSet.jeep48;
  jeepSprites.eatenUp = eatenSet.jeep48;
  jeepSprites.eatenDown = eatenSet.jeep48;

  const gasSprite = createSprites({
    O: "#111318",
    r: "#d62b2b",
    s: "#7a0e0e",
    h: "#f06b6b",
    p: "#ffb0b0",
    y: "#ffd24a",
    k: "#c89a16",
  }).gas32;
  const tireSprite = createSprites({
    O: "#111318",
    t: "#2b2f36",
    m: "#6d7685",
    l: "#c9d0da",
  }).tire32;
  const bonusSprites = {};
  OFFROAD_PARTS.forEach((name) => {
    bonusSprites[name] = createSprites(BONUS_PALETTE)[name];
  });

  let mazeIndex = 0;
  let level = 1;
  let score = 0;
  let highScore = Number(localStorage.getItem(HIGHSCORE_KEY)) || 0;
  let topScores = loadTopScores();
  let lives = 3;
  let pelletsRemaining = 0;
  let player = null;
  let enemies = [];
  let maze = null;
  let garageExit = null;
  let mode = "title";
  let frightenedUntil = 0;
  let frightenedCombo = 0;
  let runStart = performance.now();
  let scoreSubmitted = false;
  let modeCycle = { index: 0, timer: SCATTER_CHASE_SCHEDULE[0].duration, mode: SCATTER_CHASE_SCHEDULE[0].mode };
  let bonus = { active: false, timer: 0, next: randomRange(BONUS_INTERVAL_MIN, BONUS_INTERVAL_MAX), type: OFFROAD_PARTS[0] };
  let respawnTimer = 0;

  const loop = createAppLoop(appId, {
    step,
    render,
    isActive: () => content.isConnected,
  });

  const input = createInput({
    root: wrapper,
    onDirection: (dir) => {
      if (mode === "title") return;
      player.nextDir = dir;
      sound.resume();
    },
    onPause: () => {
      if (mode === "playing") {
        mode = "paused";
      } else if (mode === "paused") {
        mode = "playing";
      }
      updateOverlay();
    },
    onStart: () => {
      if (mode === "title") startGame();
      if (mode === "gameover") startGame();
    },
    onToggleMute: () => {
      const next = !(settings.music || settings.sfx);
      settings.music = next;
      settings.sfx = next;
      sound.setMutedMusic(!settings.music);
      sound.setMutedSfx(!settings.sfx);
      if (settings.music) sound.startMusic();
      else sound.stopMusic();
      saveSettings();
    },
  });

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function saveHighScore() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HIGHSCORE_KEY, String(highScore));
    }
  }

  function loadTopScores() {
    try {
      const raw = localStorage.getItem(HIGHSCORES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function recordScore(value) {
    if (!Number.isFinite(value) || value <= 0) return;
    topScores = loadTopScores();
    topScores.push({ score: Math.floor(value), date: new Date().toISOString() });
    topScores.sort((a, b) => b.score - a.score);
    topScores = topScores.slice(0, 5);
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(topScores));
  }

  function renderTopScores() {
    if (!topScores.length) {
      return `<div class="casey-overlay-body">No top scores yet.</div>`;
    }
    const items = topScores
      .map((entry) => `<li><span>${entry.score}</span><span>${formatScoreDate(entry.date)}</span></li>`)
      .join("");
    return `
      <div class="casey-overlay-subtitle">Top Scores</div>
      <ol class="casey-overlay-scores">${items}</ol>
    `;
  }

  function formatScoreDate(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function startGame() {
    sound.resume();
    score = 0;
    lives = 3;
    level = 1;
    mazeIndex = 0;
    resetLevel();
    mode = "playing";
    runStart = performance.now();
    scoreSubmitted = false;
    updateOverlay();
    if (settings.music) music.play().catch(() => {});
  }

  function resetLevel() {
    maze = parseMaze(MAZES[mazeIndex % MAZES.length].layout);
    garageExit = findGarageExit(maze);
    player = createPlayer(maze.playerStart);
    player.dir = { x: 0, y: 0 };
    player.nextDir = { x: 0, y: 0 };
    enemies = createEnemies();
    pelletsRemaining = maze.pellets.size + maze.powers.size;
    frightenedUntil = 0;
    frightenedCombo = 0;
    modeCycle = { index: 0, timer: SCATTER_CHASE_SCHEDULE[0].duration, mode: SCATTER_CHASE_SCHEDULE[0].mode };
    bonus = { active: false, timer: 0, next: randomRange(BONUS_INTERVAL_MIN, BONUS_INTERVAL_MAX), type: OFFROAD_PARTS[Math.floor(Math.random() * OFFROAD_PARTS.length)] };
    respawnTimer = 0;
  }

  function createEnemies() {
    const types = ["chaser", "ambusher", "wanderer", "trickster"];
    return types.map((type, idx) => {
      const enemy = createEnemy(
        type,
        maze.enemyStarts[idx] || maze.enemyStarts[0],
        ENEMY_COLORS[idx],
        CORNERS[idx],
      );
      enemy.patrol = CORNERS[(idx + 2) % CORNERS.length];
      enemy.state = "exiting";
      return enemy;
    });
  }

  function step(dt) {
    if (mode !== "playing") return;
    dt = Math.min(dt, 1 / 30);
    const speedBoost = LEVEL_SPEED_STEP * (level - 1);
    if (respawnTimer > 0) {
      respawnTimer = Math.max(0, respawnTimer - dt);
      if (respawnTimer === 0) {
        player = createPlayer(maze.playerStart);
        player.dir = { x: 0, y: 0 };
        player.nextDir = { x: 0, y: 0 };
        enemies = createEnemies();
      }
      return;
    }

    if (frightenedUntil > 0) {
      frightenedUntil = Math.max(0, frightenedUntil - dt);
      if (frightenedUntil === 0) {
        enemies.forEach((enemy) => {
          if (enemy.state === "frightened") enemy.state = "normal";
        });
      }
    }

    if (frightenedUntil === 0) {
      modeCycle.timer -= dt;
      if (modeCycle.timer <= 0) {
        modeCycle.index = Math.min(modeCycle.index + 1, SCATTER_CHASE_SCHEDULE.length - 1);
        const next = SCATTER_CHASE_SCHEDULE[modeCycle.index];
        modeCycle.mode = next.mode;
        modeCycle.timer = next.duration;
        enemies.forEach((enemy) => {
          if (enemy.state === "normal") enemy.dir = getOpposite(enemy.dir);
        });
      }
    }

    bonus.next -= dt;
    if (!bonus.active && bonus.next <= 0) {
      bonus.active = true;
      bonus.timer = BONUS_DURATION;
      bonus.type = OFFROAD_PARTS[Math.floor(Math.random() * OFFROAD_PARTS.length)];
    }
    if (bonus.active) {
      bonus.timer -= dt;
      if (bonus.timer <= 0) {
        bonus.active = false;
        bonus.next = randomRange(BONUS_INTERVAL_MIN, BONUS_INTERVAL_MAX);
      }
    }

    updatePlayer(dt, speedBoost);
    updateEnemies(dt, speedBoost);
    handleCollisions();

    if (pelletsRemaining <= 0) {
      mode = "levelcomplete";
      sound.playSfx("level");
      saveHighScore();
      setTimeout(() => {
        level += 1;
        mazeIndex += 1;
        resetLevel();
        mode = "playing";
      }, 1600);
    }
  }

  function updatePlayer(dt, speedBoost) {
    const speed = PLAYER_SPEED + speedBoost;
    const center = getTileCenter(player.tile.c, player.tile.r);
    const dx = player.x - center.x;
    const dy = player.y - center.y;
    const nearCenter = Math.abs(dx) <= CENTER_EPS && Math.abs(dy) <= CENTER_EPS;
    const buffered = input.state.bufferedDir || player.nextDir || { x: 0, y: 0 };
    const perpendicular = (buffered.x !== 0 && player.dir.y !== 0) || (buffered.y !== 0 && player.dir.x !== 0) || (player.dir.x === 0 && player.dir.y === 0);

    if (perpendicular && (Math.abs(dx) <= TURN_WINDOW && Math.abs(dy) <= TURN_WINDOW) && canMove(player.tile.c, player.tile.r, buffered)) {
      if (buffered.x !== 0) player.y = center.y;
      if (buffered.y !== 0) player.x = center.x;
      player.dir = { ...buffered };
      player.nextDir = { ...buffered };
      input.state.bufferedDir = null;
    }
    if (nearCenter) {
      player.x = center.x;
      player.y = center.y;
      if (buffered.x === 0 && buffered.y === 0) {
        player.dir = { x: 0, y: 0 };
        player.nextDir = { x: 0, y: 0 };
        input.state.bufferedDir = null;
      } else if (canMove(player.tile.c, player.tile.r, buffered)) {
        player.dir = { ...buffered };
        player.nextDir = { ...buffered };
        input.state.bufferedDir = null;
      } else if (!canMove(player.tile.c, player.tile.r, player.dir)) {
        player.dir = { x: 0, y: 0 };
      }
    }

    player.x += player.dir.x * speed * dt;
    player.y += player.dir.y * speed * dt;

    wrapEntity(player);
    updateTile(player);

    const pelletKey = `${player.tile.c},${player.tile.r}`;
    if (maze.pellets.has(pelletKey)) {
      maze.pellets.delete(pelletKey);
      pelletsRemaining -= 1;
      score += PELLET_SCORE;
      sound.playSfx("pellet");
    }
    if (maze.powers.has(pelletKey)) {
      maze.powers.delete(pelletKey);
      pelletsRemaining -= 1;
      frightenedUntil = POWER_DURATION;
      frightenedCombo = 0;
      enemies.forEach((enemy) => {
        if (enemy.state === "normal") {
          enemy.state = "frightened";
          enemy.dir = getOpposite(enemy.dir);
        }
      });
      sound.playSfx("power");
    }

    if (bonus.active && player.tile.c === maze.bonusTile.c && player.tile.r === maze.bonusTile.r) {
      bonus.active = false;
      bonus.next = randomRange(BONUS_INTERVAL_MIN, BONUS_INTERVAL_MAX);
      score += BONUS_SCORE;
      sound.playSfx("bonus");
    }
  }

  function updateEnemies(dt, speedBoost) {
    enemies.forEach((enemy) => {
      if (enemy.state === "in-garage") {
        enemy.respawn -= dt;
        if (enemy.respawn <= 0) {
          enemy.state = "exiting";
          enemy.dir = { x: 0, y: -1 };
        }
        return;
      }
      if (enemy.state === "respawn") {
        enemy.respawn -= dt;
        if (enemy.respawn <= 0) {
          enemy.state = "exiting";
          enemy.dir = { x: 0, y: -1 };
        }
        return;
      }

      const speedBase =
        enemy.state === "returning"
          ? ENEMY_EATEN_SPEED
          : enemy.state === "frightened"
            ? ENEMY_FRIGHT_SPEED
            : ENEMY_SPEED;
      const speed = speedBase + (enemy.state === "normal" ? speedBoost * 0.6 : 0);
      const center = getTileCenter(enemy.tile.c, enemy.tile.r);
      const nearCenter = Math.abs(enemy.x - center.x) <= CENTER_EPS && Math.abs(enemy.y - center.y) <= CENTER_EPS;

      if (nearCenter) {
        enemy.x = center.x;
        enemy.y = center.y;
        const allowGate = enemy.state === "returning" || enemy.state === "exiting" || enemy.state === "in-garage";
        const available = getAvailableDirs(enemy.tile.c, enemy.tile.r, allowGate);
        const allowReverse = available.length <= 1;
        if (enemy.state === "returning") {
          enemy.dir = pickReturnDirectionLocal(enemy.tile, enemy.dir);
          if (enemy.tile.c === maze.garage.c && enemy.tile.r === maze.garage.r) {
            enemy.state = "in-garage";
            enemy.respawn = 0.9;
            enemy.dir = { x: 0, y: 0 };
            return;
          }
        } else if (enemy.state === "frightened") {
          enemy.dir = pickRandomDirection({ grid: maze.grid, tile: enemy.tile, currentDir: enemy.dir, allowGate });
        } else if (enemy.state === "exiting") {
          const target = garageExit || maze.garage;
          enemy.dir = pickDirection({
            grid: maze.grid,
            tile: enemy.tile,
            currentDir: enemy.dir,
            target,
            allowGate: true,
            forbidReverse: !allowReverse,
          });
          if (garageExit && enemy.tile.c === garageExit.c && enemy.tile.r === garageExit.r) {
            enemy.state = "normal";
          } else if (!isGarage(maze.grid, enemy.tile.c, enemy.tile.r) && !isGate(maze.grid, enemy.tile.c, enemy.tile.r)) {
            enemy.state = "normal";
          }
        } else {
          const target = modeCycle.mode === "scatter" ? enemy.corner : getTarget(enemy, player, enemies, modeCycle.mode);
          enemy.dir = pickDirection({
            grid: maze.grid,
            tile: enemy.tile,
            currentDir: enemy.dir,
            target,
            allowGate: false,
            forbidReverse: !allowReverse,
          });
        }

        if (!isDirPassable(enemy.tile.c, enemy.tile.r, enemy.dir, allowGate)) {
          enemy.dir = available[0] || getOpposite(enemy.dir);
          if (!isDirPassable(enemy.tile.c, enemy.tile.r, enemy.dir, allowGate)) {
            enemy.dir = { x: 0, y: 0 };
          }
        }
      }

      enemy.x += enemy.dir.x * speed * dt;
      enemy.y += enemy.dir.y * speed * dt;
      wrapEntity(enemy);
      updateTile(enemy);
    });
  }

  function handleCollisions() {
    enemies.forEach((enemy) => {
      if (enemy.state === "respawn" || enemy.state === "in-garage") return;
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist > TILE_SIZE * 0.6) return;
      if (enemy.state === "frightened") {
        const scoreValue = EAT_SCORES[Math.min(frightenedCombo, EAT_SCORES.length - 1)];
        frightenedCombo += 1;
        score += scoreValue;
        sound.playSfx("eat");
        enemy.state = "returning";
        enemy.dir = getOpposite(enemy.dir);
      } else if (enemy.state !== "returning" && enemy.state !== "in-garage") {
        lives -= 1;
        sound.playSfx("death");
        if (lives <= 0) {
          mode = "gameover";
          saveHighScore();
          if (!scoreSubmitted) {
            submitFinalScore({
              board: getBoardIdForGame("casey", "classic", "normal"),
              score,
              runMs: Math.floor(performance.now() - runStart),
            }).catch(() => {});
            scoreSubmitted = true;
          }
          updateOverlay();
          scoreOverlay.refresh();
          music.pause();
        } else {
          respawnTimer = 2.2;
        }
      }
    });
  }

  function updateTile(entity) {
    entity.tile.c = Math.max(0, Math.min(COLS - 1, Math.floor(entity.x / TILE_SIZE)));
    entity.tile.r = Math.max(0, Math.min(ROWS - 1, Math.floor(entity.y / TILE_SIZE)));
  }

  function canMove(c, r, dir) {
    if (dir.x === 0 && dir.y === 0) return false;
    const nc = c + dir.x;
    const nr = r + dir.y;
    if (isGate(maze.grid, nc, nr)) return false;
    return isPassable(maze.grid, nc, nr, false);
  }

  function isDirPassable(c, r, dir, allowGate) {
    if (dir.x === 0 && dir.y === 0) return false;
    return isPassable(maze.grid, c + dir.x, r + dir.y, allowGate);
  }

  function getAvailableDirs(c, r, allowGate) {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    return dirs.filter((dir) => isDirPassable(c, r, dir, allowGate));
  }

  function pickReturnDirectionLocal(tile, currentDir) {
    const options = getAvailableDirs(tile.c, tile.r, true);
    if (!options.length) return currentDir;
    let bestDist = Infinity;
    let best = [];
    for (const dir of options) {
      const nc = tile.c + dir.x;
      const nr = tile.r + dir.y;
      const dist = Math.abs(nc - maze.garage.c) + Math.abs(nr - maze.garage.r);
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

  function findGarageExit(currentMaze) {
    if (!currentMaze || !currentMaze.gateTiles.length) return null;
    for (const gate of currentMaze.gateTiles) {
      const dirs = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];
      for (const dir of dirs) {
        const nc = gate.c + dir.x;
        const nr = gate.r + dir.y;
        if (!isPassable(currentMaze.grid, nc, nr, true)) continue;
        if (!isGarage(currentMaze.grid, nc, nr) && !isGate(currentMaze.grid, nc, nr)) {
          return { c: nc, r: nr };
        }
      }
    }
    return { c: currentMaze.garage.c, r: currentMaze.garage.r - 1 };
  }

  function isDirPassable(c, r, dir, allowGate) {
    if (dir.x === 0 && dir.y === 0) return false;
    return isPassable(maze.grid, c + dir.x, r + dir.y, allowGate);
  }

  function getAvailableDirs(c, r, allowGate) {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    return dirs.filter((dir) => isDirPassable(c, r, dir, allowGate));
  }

  function wrapEntity(entity) {
    if (entity.tile.r < 0 || entity.tile.r >= ROWS) return;
    const leftOpen = !isWall(maze.grid, 0, entity.tile.r);
    const rightOpen = !isWall(maze.grid, COLS - 1, entity.tile.r);
    if (!leftOpen || !rightOpen) return;
    const minX = -TILE_SIZE / 2;
    const maxX = COLS * TILE_SIZE + TILE_SIZE / 2;
    if (entity.x < minX) entity.x = maxX;
    if (entity.x > maxX) entity.x = minX;
  }

  function getTileCenter(c, r) {
    return {
      x: c * TILE_SIZE + TILE_SIZE / 2,
      y: r * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  function updateOverlay() {
    overlay.style.display = ["paused", "gameover", "title"].includes(mode) ? "flex" : "none";
    if (mode !== "paused") settingsPanel.style.display = "none";
    if (mode !== "playing") {
      music.pause();
    } else if (settings.music) {
      music.play().catch(() => {});
    }
    if (mode === "paused") {
      overlayCard.innerHTML = `
        <div class="casey-overlay-title">Paused</div>
        <button class="menu-button" id="casey-resume">Resume</button>
        <button class="menu-button" id="casey-settings">Settings</button>
        <button class="menu-button" id="casey-restart">Restart</button>
      `;
      overlayCard.querySelector("#casey-resume").addEventListener("click", () => {
        mode = "playing";
        updateOverlay();
      });
      overlayCard.querySelector("#casey-settings").addEventListener("click", () => {
        settingsPanel.style.display = "block";
      });
      overlayCard.querySelector("#casey-restart").addEventListener("click", () => {
        startGame();
      });
    } else if (mode === "gameover") {
      overlayCard.innerHTML = `
        <div class="casey-overlay-title">Game Over</div>
        <div class="casey-overlay-body">Score ${score}</div>
        <button class="menu-button" id="casey-start">Play Again</button>
      `;
      scoreOverlay.show("Top Scores", "Last 7 days");
      scoreOverlay.refresh();
      overlayCard.querySelector("#casey-start").addEventListener("click", () => startGame());
    } else if (mode === "title") {
      overlayCard.innerHTML = `
        <div class="casey-overlay-title">Casey</div>
        <div class="casey-overlay-body">Ready for an offroad run?</div>
        <button class="menu-button" id="casey-start">Play</button>
      `;
      scoreOverlay.show("Top Scores", "Last 7 days");
      scoreOverlay.refresh();
      overlayCard.querySelector("#casey-start").addEventListener("click", () => startGame());
    } else {
      scoreOverlay.hide();
    }
  }

  function render() {
    clear();
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(0, HUD_HEIGHT);
    drawMaze(ctx, maze, 0, THEME);
    drawPellets(ctx, maze.pellets, 0, gasSprite);
    drawPowers(ctx, maze.powers, 0, tireSprite);

    if (bonus.active) {
      const sprite = bonusSprites[bonus.type] || bonusSprites.bumper;
      drawSprite(ctx, sprite, maze.bonusTile.c * TILE_SIZE + TILE_SIZE / 2, maze.bonusTile.r * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.9);
    }
    const showActors = mode === "playing" || mode === "paused" || mode === "levelcomplete";
    if (showActors) {
      const now = performance.now();
      if (player) {
        drawPlayer(ctx, player, 0, playerSprites, now);
      }
      const frightenedTime = frightenedUntil;
      drawEnemies(ctx, enemies, 0, jeepSprites, frightenedUntil > 0, frightenedTime, now);
    }
    ctx.restore();

    drawHud(ctx, score, highScore, lives, level, playerSprites.player_left);

    if (mode === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    }
    if (mode === "levelcomplete") {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      ctx.fillStyle = "#e6f0ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Trail Clear!", BASE_WIDTH / 2, BASE_HEIGHT / 2 - 6);
      ctx.font = "13px 'Avenir Next', sans-serif";
      ctx.fillText("Next route loading...", BASE_WIDTH / 2, BASE_HEIGHT / 2 + 14);
    }
  }

  function buildSettingsPanel() {
    settingsPanel.innerHTML = `
      <div class="casey-settings-card">
        <div class="casey-settings-title">Audio</div>
        <label><input type="checkbox" id="casey-music"> Music</label>
        <input type="range" id="casey-music-volume" min="0" max="1" step="0.05" />
        <label><input type="checkbox" id="casey-sfx"> SFX</label>
        <input type="range" id="casey-sfx-volume" min="0" max="1" step="0.05" />
        <button class="menu-button" id="casey-settings-close">Close</button>
      </div>
    `;
    const musicToggle = settingsPanel.querySelector("#casey-music");
    const sfxToggle = settingsPanel.querySelector("#casey-sfx");
    const musicVol = settingsPanel.querySelector("#casey-music-volume");
    const sfxVol = settingsPanel.querySelector("#casey-sfx-volume");
    musicToggle.checked = settings.music;
    sfxToggle.checked = settings.sfx;
    musicVol.value = settings.musicVolume;
    sfxVol.value = settings.sfxVolume;

    musicToggle.addEventListener("change", () => {
      settings.music = musicToggle.checked;
      sound.setMutedMusic(!settings.music);
      if (settings.music) music.play().catch(() => {});
      else music.pause();
      saveSettings();
    });
    sfxToggle.addEventListener("change", () => {
      settings.sfx = sfxToggle.checked;
      sound.setMutedSfx(!settings.sfx);
      saveSettings();
    });
    musicVol.addEventListener("input", () => {
      settings.musicVolume = Number(musicVol.value);
      sound.setVolumeMusic(settings.musicVolume);
      music.volume = baseMusicVolume * settings.musicVolume;
      saveSettings();
    });
    sfxVol.addEventListener("input", () => {
      settings.sfxVolume = Number(sfxVol.value);
      sound.setVolumeSfx(settings.sfxVolume);
      saveSettings();
    });
    settingsPanel.querySelector("#casey-settings-close").addEventListener("click", () => {
      settingsPanel.style.display = "none";
    });
  }

  buildSettingsPanel();
  updateOverlay();
  resetLevel();
  loop.start();

  const canvasToken = resourceTracker.claim(appId, "canvas", BASE_WIDTH * BASE_HEIGHT * 4, "Casey canvas");

  const observer = new MutationObserver(() => {
    if (!content.isConnected) {
      observer.disconnect();
      controller.abort();
      resizeObserver.disconnect();
      loop.stop();
      input.destroy();
      resourceTracker.release(canvasToken);
      audioRegistry.clear(appId);
      music.pause();
      music.currentTime = 0;
      sound.stopMusic();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return {
    title: "Casey",
    width: 640,
    height: 620,
    aspectRatio: BASE_WIDTH / BASE_HEIGHT,
    content: wrapper,
    onSuspend: () => {
      loop.suspend();
      music.pause();
      sound.stopMusic();
    },
    onResume: () => {
      loop.resume();
      if (settings.music) music.play().catch(() => {});
    },
    freeOptionalCaches: () => {
      // no caches
    },
  };
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
