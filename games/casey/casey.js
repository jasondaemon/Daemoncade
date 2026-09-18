import { createAppLoop } from "../daemonos-shared/appPerformance.js";
import { resourceTracker } from "../daemonos-shared/resourceTracker.js";
import { audioRegistry } from "../daemonos-shared/audioRegistry.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";
import {
  BASE_WIDTH,
  BASE_HEIGHT,
  COLS,
  ROWS,
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
  FLOW_WINDOW,
  MAX_FLOW_MULTIPLIER,
  RAMP_AIR_TIME,
  BOOST_DURATION,
  BOOST_SPEED_MULTIPLIER,
  BOOST_MIN_CHARGE,
  SCATTER_CHASE_SCHEDULE,
  SETTINGS_KEY,
  HIGHSCORE_KEY,
  HIGHSCORES_KEY,
  DIFFICULTY_HIGHSCORES_KEY,
  DIFFICULTY_KEY,
  DIFFICULTIES,
  OFFROAD_PARTS,
} from "./constants.js?v=18";
import { MAZES, validateMazes } from "./mazes.js?v=4";
import { parseMaze, isPassable, isWall, isGate, isGarage } from "./maze.js?v=4";
import { createPlayer, createEnemy, shouldProcessIntersection, markIntersectionProcessed } from "./entities.js?v=16";
import { createCaseyView } from "./view3d.js?v=16";
import { SoundEngine } from "./sound.js?v=17";
import { createTrailFeatures, surfaceSpeed, terrainGrade, gradeSpeedFactor } from "./trailSystems.js?v=13";
import { createInput } from "./input.js?v=16";
import { getTarget, pickDirection, pickRandomDirection, pickDifficultyDirection, findPathDirection, getOpposite } from "./ai.js?v=17";

const ENEMY_COLORS = ["#ff6f91", "#7bd5ff", "#6ef0c4", "#ffd166"];
const ROUTE_NAMES = ["Mojave Run", "Red Rock", "Pine Ridge", "Moon Pass", "Badlands"];

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

  const gameView = createCaseyView();
  const { content, resizeObserver } = gameView;
  content.style.height = "100%";
  content.style.width = "100%";
  content.style.flex = "1";
  content.style.minWidth = "0";
  content.style.minHeight = "0";
  wrapper.appendChild(content);

  const hud = document.createElement("header");
  hud.className = "casey-hud";
  hud.innerHTML = `
    <div><span>SCORE</span><strong data-hud="score">000000</strong></div>
    <div><span data-hud="high-label">BEST · TRAIL RATED</span><strong data-hud="high">000000</strong></div>
    <div class="casey-hud-title"><span>CASEY</span><strong data-hud="route">TRAIL 1</strong></div>
    <div><span>GAS LEFT</span><strong data-hud="gas">0</strong></div>
    <div><span>RECOVERIES</span><strong data-hud="lives">● ● ●</strong></div>
    <div class="casey-hunt" data-hud="hunt" aria-live="polite">
      <span>JEEP HUNT</span><div class="casey-hunt-track"><i data-hud="hunt-fill"></i></div><strong data-hud="hunt-time">0.0</strong>
    </div>
    <div class="casey-flow" data-hud="flow"><span>TRAIL FLOW</span><strong data-hud="flow-value">x1</strong></div>
    <div class="casey-surface" data-hud="surface"></div>
    <div class="casey-boost" data-hud="boost"><span>4×4 BOOST</span><div class="casey-boost-track"><i data-hud="boost-fill"></i></div><strong data-hud="boost-value">0%</strong></div>
    <div class="casey-rating" data-hud="rating" aria-label="Trail rating">☆ ☆ ☆</div>`;
  wrapper.appendChild(hud);
  const hudScore = hud.querySelector('[data-hud="score"]');
  const hudHigh = hud.querySelector('[data-hud="high"]');
  const hudHighLabel = hud.querySelector('[data-hud="high-label"]');
  const hudRoute = hud.querySelector('[data-hud="route"]');
  const hudGas = hud.querySelector('[data-hud="gas"]');
  const hudLives = hud.querySelector('[data-hud="lives"]');
  const hudHunt = hud.querySelector('[data-hud="hunt"]');
  const hudHuntFill = hud.querySelector('[data-hud="hunt-fill"]');
  const hudHuntTime = hud.querySelector('[data-hud="hunt-time"]');
  const hudFlow = hud.querySelector('[data-hud="flow"]');
  const hudFlowValue = hud.querySelector('[data-hud="flow-value"]');
  const hudRating = hud.querySelector('[data-hud="rating"]');
  const hudSurface = hud.querySelector('[data-hud="surface"]');
  const hudBoost = hud.querySelector('[data-hud="boost"]');
  const hudBoostFill = hud.querySelector('[data-hud="boost-fill"]');
  const hudBoostValue = hud.querySelector('[data-hud="boost-value"]');

  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("casey", "classic", activeDifficulty),
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
  let settings = { ...defaultSettings };
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) settings = { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    localStorage.removeItem(SETTINGS_KEY);
  }

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

  let mazeIndex = 0;
  let level = 1;
  let score = 0;
  let selectedDifficulty = DIFFICULTIES[localStorage.getItem(DIFFICULTY_KEY)] ? localStorage.getItem(DIFFICULTY_KEY) : "normal";
  let activeDifficulty = selectedDifficulty;
  let difficultyHighScores = loadDifficultyHighScores();
  let highScore = difficultyHighScores[activeDifficulty] || 0;
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
  let invulnerableTimer = 0;
  let levelTimer = 0;
  let flowTimer = 0;
  let flowCount = 0;
  let flowMultiplier = 1;
  let airborneTimer = 0;
  let lastSurface = null;
  let levelStartedAt = performance.now();
  let trailStars = 0;
  let currentGrade = 0;
  let boostCharge = 0;
  let boostTimer = 0;

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
      if (settings.music && mode === "playing") music.play().catch(() => {});
      else music.pause();
      saveSettings();
    },
    onBoost: activateBoost,
  });

  function addBoost(amount) {
    if (boostTimer > 0) return;
    boostCharge = Math.min(100, boostCharge + amount);
  }

  function activateBoost() {
    if (mode !== "playing" || boostTimer > 0 || boostCharge < BOOST_MIN_CHARGE) return;
    boostTimer = BOOST_DURATION * (boostCharge / 100);
    boostCharge = 0;
    flowTimer = Math.max(flowTimer, boostTimer);
    sound.resume();
    sound.playSfx("boost");
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function saveHighScore() {
    if (score > highScore) {
      highScore = score;
      difficultyHighScores[activeDifficulty] = highScore;
      localStorage.setItem(DIFFICULTY_HIGHSCORES_KEY, JSON.stringify(difficultyHighScores));
      if (activeDifficulty === "normal") localStorage.setItem(HIGHSCORE_KEY, String(highScore));
    }
  }

  function loadDifficultyHighScores() {
    const fallback = { easy: 0, normal: Number(localStorage.getItem(HIGHSCORE_KEY)) || 0, hard: 0 };
    try {
      const parsed = JSON.parse(localStorage.getItem(DIFFICULTY_HIGHSCORES_KEY) || "{}");
      return Object.fromEntries(Object.keys(DIFFICULTIES).map((key) => [key, Math.max(0, Number(parsed[key]) || fallback[key])]));
    } catch {
      return fallback;
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
    topScores.push({ score: Math.floor(value), date: new Date().toISOString(), difficulty: activeDifficulty });
    topScores = Object.keys(DIFFICULTIES).flatMap((difficulty) => topScores
      .filter((entry) => (entry.difficulty || "normal") === difficulty)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5));
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(topScores));
  }

  function renderTopScores() {
    const scores = topScores.filter((entry) => (entry.difficulty || "normal") === selectedDifficulty);
    if (!scores.length) {
      return `<div class="casey-overlay-body">No top scores yet.</div>`;
    }
    const items = scores
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

  function renderDifficultyPicker() {
    return `
      <div class="casey-difficulty-heading">Choose your trail</div>
      <div class="casey-difficulty-picker" role="group" aria-label="Difficulty">
        ${Object.values(DIFFICULTIES).map((difficulty) => `
          <button class="casey-difficulty-option${selectedDifficulty === difficulty.id ? " is-selected" : ""}" data-difficulty="${difficulty.id}" aria-pressed="${selectedDifficulty === difficulty.id}">
            <span>${difficulty.rating}</span>
            <strong>${difficulty.label}</strong>
            <small>${difficulty.description}</small>
          </button>
        `).join("")}
      </div>
    `;
  }

  function bindDifficultyPicker() {
    overlayCard.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedDifficulty = button.dataset.difficulty;
        localStorage.setItem(DIFFICULTY_KEY, selectedDifficulty);
        highScore = difficultyHighScores[selectedDifficulty] || 0;
        updateOverlay();
      });
    });
  }

  function startGame() {
    window.clearTimeout(levelTimer);
    levelTimer = 0;
    sound.resume();
    activeDifficulty = selectedDifficulty;
    localStorage.setItem(DIFFICULTY_KEY, activeDifficulty);
    highScore = difficultyHighScores[activeDifficulty] || 0;
    score = 0;
    lives = 3;
    level = 1;
    mazeIndex = 0;
    trailStars = 0;
    resetLevel();
    mode = "playing";
    runStart = performance.now();
    scoreSubmitted = false;
    updateOverlay();
    if (settings.music) music.play().catch(() => {});
  }

  function resetLevel() {
    const route = MAZES[mazeIndex % MAZES.length];
    maze = parseMaze(route.layout);
    maze.routeId = mazeIndex % MAZES.length;
    maze.routeName = ROUTE_NAMES[mazeIndex % ROUTE_NAMES.length];
    maze.terrain = createTrailFeatures(maze, maze.routeId);
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
    invulnerableTimer = 2.5;
    flowTimer = 0;
    flowCount = 0;
    flowMultiplier = 1;
    airborneTimer = 0;
    boostCharge = 0;
    boostTimer = 0;
    lastSurface = null;
    levelStartedAt = performance.now();
  }

  function createEnemies() {
    const types = ["chaser", "ambusher", "wanderer", "trickster"];
    return types.map((type, idx) => {
      const enemy = createEnemy(
        type,
        maze.garageTiles[idx % maze.garageTiles.length] || maze.garage,
        ENEMY_COLORS[idx],
        CORNERS[idx],
      );
      enemy.patrol = CORNERS[(idx + 2) % CORNERS.length];
      enemy.state = idx === 0 ? "exiting" : "in-garage";
      enemy.respawn = (1.4 + idx * 1.35) * DIFFICULTIES[activeDifficulty].releaseDelay;
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
    invulnerableTimer = Math.max(0, invulnerableTimer - dt);
    airborneTimer = Math.max(0, airborneTimer - dt);
    boostTimer = Math.max(0, boostTimer - dt);
    flowTimer = Math.max(0, flowTimer - dt);
    if (flowTimer === 0 && flowCount > 0) {
      flowCount = 0;
      flowMultiplier = 1;
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

    const substeps = Math.max(1, Math.ceil(dt / (1 / 90)));
    const slice = dt / substeps;
    for (let i = 0; i < substeps; i += 1) {
      updatePlayer(slice, speedBoost);
      updateEnemies(slice, speedBoost);
      handleCollisions();
      if (respawnTimer > 0 || mode !== "playing") break;
    }

    if (pelletsRemaining <= 0) {
      mode = "levelcomplete";
      const clearSeconds = (performance.now() - levelStartedAt) / 1000;
      trailStars = Math.max(1, Math.min(3, 1 + Number(lives >= 2) + Number(lives === 3 && clearSeconds < 260)));
      sound.playSfx("level");
      saveHighScore();
      updateOverlay();
      levelTimer = window.setTimeout(() => {
        level += 1;
        mazeIndex += 1;
        resetLevel();
        mode = "playing";
        levelTimer = 0;
        updateOverlay();
      }, 1600);
    }
  }

  function updatePlayer(dt, speedBoost) {
    const surface = maze.terrain?.surfaces.get(`${player.tile.c},${player.tile.r}`) || null;
    currentGrade = terrainGrade(maze.terrain, player.x / TILE_SIZE, player.y / TILE_SIZE, player.dir);
    const boostFactor = boostTimer > 0 ? BOOST_SPEED_MULTIPLIER : 1;
    const speed = (PLAYER_SPEED + speedBoost) * surfaceSpeed(surface, "player") * gradeSpeedFactor(currentGrade, "player") * boostFactor;
    const center = getTileCenter(player.tile.c, player.tile.r);
    const dx = player.x - center.x;
    const dy = player.y - center.y;
    const centerTolerance = Math.max(CENTER_EPS, speed * dt + 0.08);
    const nearCenter = shouldProcessIntersection(player, center, centerTolerance);
    const buffered = input.state.bufferedDir || player.nextDir || { x: 0, y: 0 };
    const perpendicular = (buffered.x !== 0 && player.dir.y !== 0) || (buffered.y !== 0 && player.dir.x !== 0) || (player.dir.x === 0 && player.dir.y === 0);

    if (perpendicular && (Math.abs(dx) <= TURN_WINDOW && Math.abs(dy) <= TURN_WINDOW) && canMove(player.tile.c, player.tile.r, buffered)) {
      if (buffered.x !== 0) player.y = center.y;
      if (buffered.y !== 0) player.x = center.x;
      player.dir = { ...buffered };
      player.nextDir = { ...buffered };
      markIntersectionProcessed(player);
      input.state.bufferedDir = null;
    }
    if (nearCenter) {
      player.x = center.x;
      player.y = center.y;
      markIntersectionProcessed(player);
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

    const currentSurface = maze.terrain?.surfaces.get(`${player.tile.c},${player.tile.r}`) || null;
    if (currentSurface === "ramp" && lastSurface !== "ramp" && airborneTimer === 0) {
      airborneTimer = RAMP_AIR_TIME;
      flowTimer = FLOW_WINDOW;
      flowCount += 3;
      flowMultiplier = Math.min(MAX_FLOW_MULTIPLIER, 1 + Math.floor(flowCount / 10));
      score += 100 * flowMultiplier;
      addBoost(10);
      sound.playSfx("jump");
    }
    lastSurface = currentSurface;

    const pelletKey = `${player.tile.c},${player.tile.r}`;
    if (maze.pellets.has(pelletKey)) {
      maze.pellets.delete(pelletKey);
      pelletsRemaining -= 1;
      flowTimer = FLOW_WINDOW;
      flowCount += 1;
      flowMultiplier = Math.min(MAX_FLOW_MULTIPLIER, 1 + Math.floor(flowCount / 10));
      score += PELLET_SCORE * flowMultiplier;
      addBoost(1.35);
      sound.playSfx("pellet");
    }
    if (maze.powers.has(pelletKey)) {
      maze.powers.delete(pelletKey);
      pelletsRemaining -= 1;
      frightenedUntil = POWER_DURATION;
      frightenedCombo = 0;
      flowTimer = FLOW_WINDOW * 2;
      flowCount += 5;
      flowMultiplier = Math.min(MAX_FLOW_MULTIPLIER, 1 + Math.floor(flowCount / 10));
      addBoost(18);
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
      const surface = maze.terrain?.surfaces.get(`${enemy.tile.c},${enemy.tile.r}`) || null;
      const grade = terrainGrade(maze.terrain, enemy.x / TILE_SIZE, enemy.y / TILE_SIZE, enemy.dir);
      const difficulty = DIFFICULTIES[activeDifficulty];
      const speed = (speedBase + (enemy.state === "normal" ? speedBoost * 0.6 : 0)) * difficulty.speed * surfaceSpeed(surface, "enemy") * gradeSpeedFactor(grade, "enemy");
      const center = getTileCenter(enemy.tile.c, enemy.tile.r);
      const centerTolerance = Math.max(CENTER_EPS, speed * dt + 0.08);
      const nearCenter = shouldProcessIntersection(enemy, center, centerTolerance);

      if (nearCenter) {
        enemy.x = center.x;
        enemy.y = center.y;
        markIntersectionProcessed(enemy);
        const allowGate = enemy.state === "returning" || enemy.state === "exiting" || enemy.state === "in-garage";
        const available = getAvailableDirs(enemy.tile.c, enemy.tile.r, allowGate);
        const allowReverse = available.length <= 1;
        if (enemy.state === "returning") {
          if (isGarage(maze.grid, enemy.tile.c, enemy.tile.r)) {
            enemy.state = "in-garage";
            enemy.respawn = 0.9;
            enemy.dir = { x: 0, y: 0 };
            enemy.lastDecisionKey = null;
            return;
          }
          enemy.dir = findPathDirection({
            grid: maze.grid,
            tile: enemy.tile,
            targets: maze.garageTiles,
            allowGate: true,
            currentDir: enemy.dir,
          }) || available[0] || getOpposite(enemy.dir);
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
          enemy.dir = pickDifficultyDirection({
            grid: maze.grid,
            tile: enemy.tile,
            currentDir: enemy.dir,
            target,
            allowGate: false,
            forbidReverse: !allowReverse,
            intelligence: difficulty.intelligence,
            mistakeRate: difficulty.mistakeRate,
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
    if (invulnerableTimer > 0 || airborneTimer > 0) return;
    enemies.forEach((enemy) => {
      if (respawnTimer > 0 || mode !== "playing") return;
      if (enemy.state === "respawn" || enemy.state === "in-garage") return;
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist > TILE_SIZE * 0.6) return;
      if (boostTimer > 0 && enemy.state !== "returning") {
        score += 300 * flowMultiplier;
        flowTimer = FLOW_WINDOW * 2;
        flowCount += 5;
        sound.playSfx("smash");
        enemy.state = "returning";
        enemy.dir = getOpposite(enemy.dir);
      } else if (enemy.state === "frightened") {
        const scoreValue = EAT_SCORES[Math.min(frightenedCombo, EAT_SCORES.length - 1)];
        frightenedCombo += 1;
        flowTimer = FLOW_WINDOW * 2;
        flowCount += 6;
        flowMultiplier = Math.min(MAX_FLOW_MULTIPLIER, 1 + Math.floor(flowCount / 10));
        score += scoreValue * flowMultiplier;
        addBoost(22);
        sound.playSfx("eat");
        enemy.state = "returning";
        enemy.dir = getOpposite(enemy.dir);
      } else if (enemy.state !== "returning" && enemy.state !== "in-garage") {
        lives -= 1;
        flowCount = 0;
        flowMultiplier = 1;
        flowTimer = 0;
        if (lives <= 0) {
          sound.playSfx("gameover");
          mode = "gameover";
          saveHighScore();
          if (!scoreSubmitted) {
            recordScore(score);
            submitFinalScore({
              board: getBoardIdForGame("casey", "classic", activeDifficulty),
              score,
              runMs: Math.floor(performance.now() - runStart),
              meta: { difficulty: activeDifficulty },
            }).catch(() => {});
            scoreSubmitted = true;
          }
          updateOverlay();
          scoreOverlay.refresh();
          music.pause();
        } else {
          sound.playSfx("death");
          respawnTimer = 2.2;
          invulnerableTimer = 4.5;
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
    overlay.style.display = ["paused", "gameover", "title", "levelcomplete"].includes(mode) ? "flex" : "none";
    if (mode !== "paused") settingsPanel.style.display = "none";
    if (mode !== "playing") {
      music.pause();
    } else if (settings.music) {
      music.play().catch(() => {});
    }
    if (mode === "levelcomplete") {
      overlayCard.innerHTML = `
        <div class="casey-overlay-kicker">${maze?.routeName || `Trail ${level}`}</div>
        <div class="casey-overlay-title">Trail Clear</div>
        <div class="casey-route-stars">${"★".repeat(trailStars)}${"☆".repeat(3 - trailStars)}</div>
        <div class="casey-overlay-body">${trailStars === 3 ? "Legendary run" : trailStars === 2 ? "Trail conquered" : "Made it through"} · Next route loading…</div>
      `;
      scoreOverlay.hide();
    } else if (mode === "paused") {
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
      const completedDifficulty = DIFFICULTIES[activeDifficulty];
      overlayCard.innerHTML = `
        <div class="casey-overlay-kicker">${completedDifficulty.rating} ${completedDifficulty.label}</div>
        <div class="casey-overlay-title">Game Over</div>
        <div class="casey-overlay-body">Score ${score}</div>
        ${renderDifficultyPicker()}
        <button class="menu-button" id="casey-start">Play Again</button>
        ${renderTopScores()}
      `;
      scoreOverlay.hide();
      bindDifficultyPicker();
      overlayCard.querySelector("#casey-start").addEventListener("click", () => startGame());
    } else if (mode === "title") {
      overlayCard.innerHTML = `
        <div class="casey-overlay-title">Casey</div>
        <div class="casey-overlay-body">Chain gas cans to build Trail Flow and charge 4×4 Boost. Press Space or Shift to launch a turbo run and smash rival Jeeps.</div>
        ${renderDifficultyPicker()}
        <button class="menu-button" id="casey-start">Play</button>
        ${renderTopScores()}
      `;
      scoreOverlay.hide();
      bindDifficultyPicker();
      overlayCard.querySelector("#casey-start").addEventListener("click", () => startGame());
    } else {
      scoreOverlay.hide();
    }
  }

  function render() {
    gameView.render({ maze, player, enemies, bonus, frightenedUntil, lives, mode, airborneTimer, boostTimer, currentSurface: lastSurface, time: performance.now() });
    hudScore.textContent = String(score).padStart(6, "0");
    hudHigh.textContent = String(Math.max(score, highScore)).padStart(6, "0");
    hudHighLabel.textContent = `BEST · ${DIFFICULTIES[activeDifficulty].label.toUpperCase()}`;
    hudRoute.textContent = `${level} · ${maze?.routeName || "TRAIL"}`;
    hudGas.textContent = String(pelletsRemaining);
    hudLives.textContent = Array.from({ length: lives }, () => "●").join(" ") || "—";
    const hunting = frightenedUntil > 0 && mode === "playing";
    hudHunt.classList.toggle("is-active", hunting);
    hudHuntFill.style.transform = `scaleX(${Math.max(0, Math.min(1, frightenedUntil / POWER_DURATION))})`;
    hudHuntTime.textContent = frightenedUntil.toFixed(1);
    hudFlow.classList.toggle("is-active", flowMultiplier > 1);
    hudFlowValue.textContent = `x${flowMultiplier}`;
    hudRating.textContent = `${"★".repeat(trailStars)}${"☆".repeat(3 - trailStars)}`;
    const surfaceLabel = airborneTimer > 0 ? "AIRBORNE" : lastSurface === "mud" ? "MUD · LOW GRIP" : lastSurface === "water" ? "WATER CROSSING" : lastSurface === "sand" ? "DEEP SAND" : currentGrade > .17 ? "CLIMBING" : currentGrade < -.17 ? "DOWNHILL BOOST" : "";
    hudSurface.textContent = surfaceLabel;
    hudSurface.classList.toggle("is-active", Boolean(surfaceLabel));
    const boosting = boostTimer > 0;
    hudBoost.classList.toggle("is-ready", boostCharge >= BOOST_MIN_CHARGE);
    hudBoost.classList.toggle("is-active", boosting);
    hudBoostFill.style.transform = `scaleX(${boosting ? boostTimer / BOOST_DURATION : boostCharge / 100})`;
    hudBoostValue.textContent = boosting ? "TURBO" : boostCharge >= BOOST_MIN_CHARGE ? `${Math.floor(boostCharge)}% · SPACE` : `${Math.floor(boostCharge)}%`;
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
      window.clearTimeout(levelTimer);
      controller.abort();
      resizeObserver.disconnect();
      gameView.destroy();
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
