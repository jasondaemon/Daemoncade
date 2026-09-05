import { createGameSurface } from "../daemonos-shared/gameUtils.js?v=1.0.0";
import { createAppLoop } from "../daemonos-shared/appPerformance.js?v=1.0.0";
import { resourceTracker } from "../daemonos-shared/resourceTracker.js?v=1.0.0";
import { audioRegistry } from "../daemonos-shared/audioRegistry.js?v=1.0.0";
import { getBoardIdForGame, submitFinalScore, fetchHighScores, getActivePlayerName } from "../daemonos-shared/scoreSystem.js?v=1.0.0";
import { createVoxelRenderer } from "../daemonos-shared/voxelRenderer.js?v=1.0.0";

const SETTINGS_KEY = "space-defender_settings";
const HIGH_KEY = "space-defender_highscore";

const BASE_WIDTH = 600;
const BASE_HEIGHT = 520;
const HUD_HEIGHT = 28;
const INVADER_SPACING_X = 46;
const INVADER_SPACING_Y = 32;

const DIFFICULTY = {
  easy: { fireRate: 0.48, speed: 9, lives: 4, playerShots: 4 },
  normal: { fireRate: 0.7, speed: 12, lives: 3, playerShots: 3 },
  hard: { fireRate: 0.95, speed: 16, lives: 2, playerShots: 3 },
};

const UFO_SCORE = 200;

const shadeHex = (hex, amount) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
};

const spriteDefs = {
  invaderA: [
    "001000100",
    "000101000",
    "001111100",
    "011010110",
    "111111111",
    "101111101",
    "101000101",
  ],
  invaderAAlt: [
    "001000100",
    "000101000",
    "001111100",
    "011010110",
    "111111111",
    "101111101",
    "010000010",
  ],
  invaderB: [
    "000101000",
    "001111100",
    "011111110",
    "110101011",
    "111111111",
    "001010100",
    "010000010",
  ],
  invaderBAlt: [
    "000101000",
    "001111100",
    "011111110",
    "110101011",
    "111111111",
    "010101010",
    "100000001",
  ],
  invaderC: [
    "001111100",
    "011111110",
    "111010111",
    "111111111",
    "001101100",
    "010010010",
    "100000001",
  ],
  invaderCAlt: [
    "001111100",
    "011111110",
    "111010111",
    "111111111",
    "001101100",
    "100010001",
    "010000010",
  ],
  ship: [
    "00000100000",
    "00001110000",
    "00011111000",
    "00111111100",
    "01111111110",
    "11101110111",
    "11001110011",
  ],
  ufo: [
    "00011111000",
    "00111111100",
    "01101010110",
    "11111111111",
    "01111111110",
    "00101010100",
  ],
};

const rowConfig = [
  { sprite: "invaderA", color: "#e85d5d", score: 50 },
  { sprite: "invaderB", color: "#f0a44a", score: 40 },
  { sprite: "invaderC", color: "#f1d25a", score: 30 },
  { sprite: "invaderB", color: "#6fe0a1", score: 20 },
  { sprite: "invaderA", color: "#5fb6ff", score: 10 },
];

const makeSprite = (pattern, color) => {
  const h = pattern.length;
  const w = pattern[0].length;
  const block = 3;
  const canvas = document.createElement("canvas");
  canvas.width = w * block;
  canvas.height = h * block;
  const sctx = canvas.getContext("2d");
  sctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (pattern[y][x] !== "1") continue;
      const px = x * block;
      const py = y * block;
      sctx.fillStyle = color;
      sctx.fillRect(px, py, block, block);
      if (y === 0 || pattern[y - 1][x] !== "1") {
        sctx.fillStyle = shadeHex(color, 62);
        sctx.fillRect(px, py, block, 1);
      }
      if (x === 0 || pattern[y][x - 1] !== "1") {
        sctx.fillStyle = shadeHex(color, 34);
        sctx.fillRect(px, py + 1, 1, block - 1);
      }
      if (y === h - 1 || pattern[y + 1][x] !== "1") {
        sctx.fillStyle = shadeHex(color, -54);
        sctx.fillRect(px, py + block - 1, block, 1);
      }
      if (x === w - 1 || pattern[y][x + 1] !== "1") {
        sctx.fillStyle = shadeHex(color, -34);
        sctx.fillRect(px + block - 1, py + 1, 1, block - 1);
      }
    }
  }
  return { canvas, w, h };
};

const spriteCache = {
  ship: makeSprite(spriteDefs.ship, "#7bd5ff"),
  ufo: makeSprite(spriteDefs.ufo, "#ff6f91"),
  invaders: rowConfig.map((row) => ({
    primary: makeSprite(spriteDefs[row.sprite], row.color),
    alternate: makeSprite(spriteDefs[`${row.sprite}Alt`], row.color),
  })),
};

const drawSprite = (ctx, sprite, x, y, scale) => {
  const width = sprite.w * scale;
  const height = sprite.h * scale;
  const transform = ctx.getTransform();
  const sx = transform.a || 1;
  const sy = transform.d || 1;
  const drawX = Math.round((x - width / 2) * sx) / sx;
  const drawY = Math.round((y - height / 2) * sy) / sy;
  const drawWidth = Math.round(width * sx) / sx;
  const drawHeight = Math.round(height * sy) / sy;
  ctx.drawImage(sprite.canvas, drawX, drawY, drawWidth, drawHeight);
};

const drawVoxelBlock = (ctx, x, y, size, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = shadeHex(color, 58);
  ctx.fillRect(x, y, size, 1);
  ctx.fillRect(x, y + 1, 1, size - 1);
  ctx.fillStyle = shadeHex(color, -48);
  ctx.fillRect(x, y + size - 1, size, 1);
  ctx.fillRect(x + size - 1, y + 1, 1, size - 1);
};

const voxelGlyphs = {
  "0":["111","101","101","101","111"],"1":["010","110","010","010","111"],"2":["111","001","111","100","111"],
  "3":["111","001","111","001","111"],"4":["101","101","111","001","001"],"5":["111","100","111","001","111"],
  "6":["111","100","111","101","111"],"7":["111","001","010","010","010"],"8":["111","101","111","101","111"],
  "9":["111","101","111","001","111"],A:["010","101","111","101","101"],C:["111","100","100","100","111"],
  E:["111","100","110","100","111"],H:["101","101","111","101","101"],I:["111","010","010","010","111"],
  O:["111","101","101","101","111"],P:["110","101","110","100","100"],R:["110","101","110","101","101"],
  S:["111","100","111","001","111"],V:["101","101","101","101","010"],W:["101","101","111","111","101"],
  "-":["000","000","111","000","000"],"<":["001","010","100","010","001"],">":["100","010","001","010","100"],
  " ":["0","0","0","0","0"],
};

export function createApp(osAPI) {
  const appId = "space-defender";
  const controller = new AbortController();
  const { signal } = controller;

  const wrapper = document.createElement("div");
  wrapper.className = "space-defender-app";

  const toolbar = document.createElement("header");
  toolbar.className = "defender-toolbar";
  toolbar.innerHTML = '<div class="defender-brand"><i>⌃</i><span><small>Daemoncade defense grid</small><strong>Space Defender</strong></span></div><div class="defender-status"><span><small>Score&lt;1&gt;</small><b data-stat="score">000000</b></span><span><small>Hi-Score</small><b data-stat="high">000000</b></span><span><small>Wave</small><b data-stat="level">01</b></span><span><small>Ships</small><b data-stat="lives">⌃ ⌃ ⌃</b></span></div><div class="defender-actions"><button class="menu-button" data-new-game type="button">New game</button><button class="icon-button" data-settings type="button" aria-label="Settings">⚙</button><button class="icon-button" data-fullscreen type="button" aria-label="Fullscreen">⛶</button></div>';

  const { content, canvas, ctx, view, resizeObserver, clear } = createGameSurface({
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    fit: "contain",
  });
  wrapper.appendChild(content);
  content.style.flex = "1";
  content.style.minHeight = "0";
  content.style.position = "relative";
  canvas.parentElement.appendChild(toolbar);
  let voxelLayer = null;
  try {
    voxelLayer = createVoxelRenderer({ surface: canvas.parentElement, width: BASE_WIDTH, height: BASE_HEIGHT });
  } catch (error) {
    console.error("Space Defender voxel renderer unavailable; using canvas fallback.", error);
  }

  const scoreOverlay = document.createElement("div");
  scoreOverlay.className = "defender-overlay";
  scoreOverlay.style.position = "absolute";
  scoreOverlay.style.left = "50%";
  scoreOverlay.style.top = "50%";
  scoreOverlay.style.transform = "translate(-50%, -50%)";
  scoreOverlay.style.minWidth = "240px";
  scoreOverlay.style.padding = "14px 16px";
  scoreOverlay.style.borderRadius = "14px";
  scoreOverlay.style.background = "rgba(10, 14, 20, 0.85)";
  scoreOverlay.style.border = "1px solid rgba(255,255,255,0.08)";
  scoreOverlay.style.boxShadow = "0 18px 40px rgba(0,0,0,0.45)";
  scoreOverlay.style.color = "#E6EDF6";
  scoreOverlay.style.fontSize = "12px";
  scoreOverlay.style.letterSpacing = "0.2px";
  scoreOverlay.style.textAlign = "center";
  scoreOverlay.style.display = "none";
  scoreOverlay.style.pointerEvents = "auto";

  const overlayTitle = document.createElement("div");
  overlayTitle.style.fontSize = "14px";
  overlayTitle.style.fontWeight = "600";
  overlayTitle.style.marginBottom = "6px";
  const overlaySubtitle = document.createElement("div");
  overlaySubtitle.style.opacity = "0.7";
  overlaySubtitle.style.marginBottom = "10px";
  const overlayList = document.createElement("div");
  overlayList.className = "defender-score-list";
  overlayList.style.display = "grid";
  overlayList.style.gap = "4px";
  overlayList.style.fontSize = "12px";
  overlayList.style.textAlign = "left";
  const overlayAction = document.createElement("button");
  overlayAction.className = "primary";
  overlayAction.type = "button";
  overlayAction.textContent = "Defend Earth";
  const overlayControls = document.createElement("small");
  overlayControls.textContent = "Move: A/D or ←/→ · Fire: Space · Pause: P";
  scoreOverlay.append(overlayTitle, overlaySubtitle, overlayList, overlayAction, overlayControls);
  content.appendChild(scoreOverlay);

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored
    ? { difficulty: "normal", controls: "keyboard", sfx: true, music: true, ...JSON.parse(stored) }
    : { difficulty: "normal", controls: "keyboard", sfx: true, music: true };
  canvas.classList.toggle("mouse-controls", settings.controls === "mouse");

  let highScore = Number(localStorage.getItem(HIGH_KEY)) || 0;
  const statScore = toolbar.querySelector('[data-stat="score"]');
  const statHigh = toolbar.querySelector('[data-stat="high"]');
  const statLevel = toolbar.querySelector('[data-stat="level"]');
  const statLives = toolbar.querySelector('[data-stat="lives"]');

  const prefsModal = document.createElement("div");
  prefsModal.className = "defender-settings";
  prefsModal.style.position = "absolute";
  prefsModal.style.inset = "0";
  prefsModal.style.display = "none";
  prefsModal.style.alignItems = "center";
  prefsModal.style.justifyContent = "center";
  prefsModal.style.background = "rgba(0,0,0,0.45)";
  prefsModal.style.zIndex = "5";

  const prefsCard = document.createElement("div");
  prefsCard.className = "defender-settings-card";
  prefsCard.style.minWidth = "280px";
  prefsCard.style.maxWidth = "360px";
  prefsCard.style.padding = "16px 18px";
  prefsCard.style.borderRadius = "14px";
  prefsCard.style.background = "rgba(16, 22, 30, 0.96)";
  prefsCard.style.border = "1px solid rgba(255,255,255,0.08)";
  prefsCard.style.boxShadow = "0 18px 40px rgba(0,0,0,0.55)";
  prefsCard.style.color = "#E6EDF6";
  prefsCard.style.display = "grid";
  prefsCard.style.gap = "12px";

  const prefsTitle = document.createElement("div");
  prefsTitle.textContent = "Preferences";
  prefsTitle.className = "defender-settings-title";
  prefsTitle.style.fontSize = "14px";
  prefsTitle.style.fontWeight = "600";

  const difficultyRow = document.createElement("div");
  difficultyRow.className = "defender-setting-row defender-setting-select";
  difficultyRow.style.display = "grid";
  difficultyRow.style.gap = "6px";
  const difficultyLabel = document.createElement("div");
  difficultyLabel.textContent = "Difficulty";
  const difficultySelect = document.createElement("select");
  difficultySelect.className = "menu-select";
  ["Easy", "Normal", "Hard"].forEach((label) => {
    const opt = document.createElement("option");
    opt.value = label.toLowerCase();
    opt.textContent = label;
    difficultySelect.appendChild(opt);
  });
  difficultyRow.append(difficultyLabel, difficultySelect);

  const controlsRow = document.createElement("div");
  controlsRow.className = "defender-setting-row defender-setting-select";
  const controlsLabel = document.createElement("div");
  controlsLabel.textContent = "Controls";
  const controlsSelect = document.createElement("select");
  controlsSelect.className = "menu-select";
  [{ value: "keyboard", label: "Keyboard" }, { value: "mouse", label: "Mouse" }].forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    controlsSelect.appendChild(opt);
  });
  controlsRow.append(controlsLabel, controlsSelect);

  const audioRow = document.createElement("div");
  audioRow.className = "defender-setting-row";
  audioRow.style.display = "grid";
  audioRow.style.gap = "8px";
  const sfxToggle = document.createElement("label");
  sfxToggle.style.display = "inline-flex";
  sfxToggle.style.alignItems = "center";
  sfxToggle.style.gap = "8px";
  const sfxInput = document.createElement("input");
  sfxInput.type = "checkbox";
  const sfxText = document.createElement("span");
  sfxText.textContent = "Sound Effects";
  sfxToggle.append(sfxInput, sfxText);

  const musicToggle = document.createElement("label");
  musicToggle.style.display = "inline-flex";
  musicToggle.style.alignItems = "center";
  musicToggle.style.gap = "8px";
  const musicInput = document.createElement("input");
  musicInput.type = "checkbox";
  const musicText = document.createElement("span");
  musicText.textContent = "Music";
  musicToggle.append(musicInput, musicText);
  audioRow.append(sfxToggle, musicToggle);

  const controlsNote = document.createElement("div");
  controlsNote.style.fontSize = "11px";
  controlsNote.style.opacity = "0.7";
  controlsNote.textContent = "Keyboard: A/D or arrows and Space. Mouse: move to steer and click to fire. P pauses.";

  const prefsActions = document.createElement("div");
  prefsActions.style.display = "flex";
  prefsActions.style.justifyContent = "flex-end";
  const closePrefs = document.createElement("button");
  closePrefs.className = "defender-settings-close";
  closePrefs.textContent = "×";
  closePrefs.setAttribute("aria-label", "Close settings");
  prefsActions.append(closePrefs);

  prefsCard.append(prefsTitle, difficultyRow, controlsRow, audioRow, controlsNote, prefsActions);
  prefsModal.appendChild(prefsCard);
  content.appendChild(prefsModal);

  const openPreferences = () => {
    difficultySelect.value = settings.difficulty;
    controlsSelect.value = settings.controls;
    sfxInput.checked = settings.sfx;
    musicInput.checked = settings.music;
    prefsModal.style.display = "flex";
  };

  const closePreferences = () => {
    prefsModal.style.display = "none";
  };

  prefsModal.addEventListener("click", (event) => {
    if (event.target === prefsModal) closePreferences();
  });
  closePrefs.addEventListener("click", closePreferences);

  difficultySelect.addEventListener("change", () => {
    settings.difficulty = difficultySelect.value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    refreshLeaderboard();
  });
  controlsSelect.addEventListener("change", () => {
    settings.controls = controlsSelect.value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    canvas.classList.toggle("mouse-controls", settings.controls === "mouse");
  });
  sfxInput.addEventListener("change", () => {
    settings.sfx = sfxInput.checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  });
  musicInput.addEventListener("change", () => {
    settings.music = musicInput.checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (!settings.music) {
      stopMarch();
    } else if (state === "playing") {
      startMarch(lastTempo || 0.35);
    }
  });

  const shipScale = 4;
  const invaderScale = 4;
  const ufoScale = 4;

  let player = { x: view.baseWidth / 2, y: view.baseHeight - 48, width: spriteCache.ship.w * shipScale, height: spriteCache.ship.h * shipScale };
  let bullets = [];
  let enemyBullets = [];
  let invaders = [];
  let shields = [];
  let formationX = 60;
  let formationY = HUD_HEIGHT + 40;
  let direction = 1;
  let formationFrame = 0;
  let marchDistance = 0;
  let impactFreeze = 0;
  let screenShake = 0;
  let speed = 32;
  let drop = 15;
  let level = 1;
  let score = 0;
  let lives = 3;
  let respawnTimer = 0;
  let alive = true;
  let state = "intro"; // intro | playing | paused | gameover
  let moveLeft = false;
  let moveRight = false;
  let fireCooldown = 0;
  let runStart = 0;
  let starSeed = 0x51ace;
  const starRandom = () => {
    starSeed |= 0;
    starSeed = (starSeed + 0x6d2b79f5) | 0;
    let value = Math.imul(starSeed ^ (starSeed >>> 15), 1 | starSeed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const stars = Array.from({ length: 125 }, () => ({
    x: starRandom() * view.baseWidth,
    y: starRandom() * view.baseHeight,
    size: starRandom() > 0.88 ? 2 : 1,
    phase: starRandom() * Math.PI * 2,
    speed: 0.35 + starRandom() * 1.15,
    tint: starRandom(),
    depth: 0.2 + starRandom() * 0.8,
  }));

  const resolveBoardId = () => getBoardIdForGame("space-defender", "arcade", settings.difficulty);

  const renderLeaderboard = (payload) => {
    overlayList.textContent = "";
    if (!payload?.entries?.length) {
      const empty = document.createElement("div");
      empty.textContent = "No scores yet.";
      empty.style.opacity = "0.7";
      overlayList.appendChild(empty);
      return;
    }
    payload.entries.forEach((entry) => {
      const row = document.createElement("div");
      row.textContent = `${entry.rank}. ${entry.name} — ${entry.score}`;
      overlayList.appendChild(row);
    });
  };

  const refreshLeaderboard = async () => {
    try {
      const payload = await fetchHighScores({ board: resolveBoardId(), windowDays: 7, limit: 5 });
      const topFive = (payload.entries || []).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      renderLeaderboard({ ...payload, entries: topFive });
    } catch (err) {
      overlayList.textContent = "Leaderboard unavailable.";
    }
  };

  const maybeSubmitScore = async () => {
    const name = getActivePlayerName();
    if (!name) {
      overlayList.textContent = "Select a profile to submit scores.";
      return;
    }
    await submitFinalScore({
      board: resolveBoardId(),
      score,
      runMs: Math.floor(performance.now() - runStart),
    });
    refreshLeaderboard();
  };
  let invaderFireTimer = 0;
  let ufo = null;
  let ufoCooldown = 12 + Math.random() * 12;
  let particles = [];
  let scorePopups = [];

  const pewAudio = new Audio("./sfx/pew.mp3");
  const explosionAudio = new Audio("./sfx/explosion.mp3");
  const enemyHitAudio = new Audio("./sfx/enemy-hit.mp3");
  const ufoAudio = new Audio("./sfx/gameover2.mp3");
  [pewAudio, explosionAudio, enemyHitAudio, ufoAudio].forEach((audio) => {
    audio.preload = "auto";
    audioRegistry.registerMediaElement(appId, audio);
  });

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioRegistry.registerContext(appId, audioCtx);
  let marchTimer = null;
  let marchStep = 0;
  const marchNotes = [196, 185, 175, 165];
  let lastTempo = 0;

  const markAudioActive = (durationMs) => {
    audioRegistry.setAudioActive(appId, true);
    window.clearTimeout(markAudioActive.timer);
    markAudioActive.timer = window.setTimeout(() => audioRegistry.setAudioActive(appId, false), durationMs);
  };

  const playSfx = (audio) => {
    if (!settings.sfx) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    markAudioActive(300);
  };

  const playEnemyHit = () => {
    playSfx(enemyHitAudio);
  };

  const startMarch = (tempo) => {
    if (!settings.music) return;
    if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
    if (marchTimer && Math.abs(tempo - lastTempo) < 0.03) return;
    if (marchTimer) clearInterval(marchTimer);
    lastTempo = tempo;
    marchStep = 0;
    marchTimer = setInterval(() => {
      if (!settings.music || state !== "playing") return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.value = marchNotes[marchStep % marchNotes.length];
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + tempo * 0.8);
      marchStep += 1;
    }, tempo * 1000);
  };

  const stopMarch = () => {
    if (marchTimer) clearInterval(marchTimer);
    marchTimer = null;
  };

  const diffSettings = () => DIFFICULTY[settings.difficulty] || DIFFICULTY.normal;

  const updateHud = () => {
    statScore.textContent = String(score).padStart(6, "0");
    statHigh.textContent = String(Math.max(score, highScore)).padStart(6, "0");
    statLevel.textContent = String(level).padStart(2, "0");
    statLives.textContent = Array.from({ length: Math.max(0, lives) }, () => "⌃").join(" ") || "—";
  };

  const createInvaders = () => {
    invaders = [];
    const rows = 5;
    const cols = 11;
    const spacingX = INVADER_SPACING_X;
    const spacingY = INVADER_SPACING_Y;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        invaders.push({ row: r, col: c, alive: true });
      }
    }
    formationX = 70;
    formationY = HUD_HEIGHT + 36;
  };

  const createShields = () => {
    shields = [];
    const baseY = view.baseHeight - 130;
    const positions = [82, 202, 322, 442];
    const bunker = [
      "01111110",
      "11111111",
      "11111111",
      "11100111",
      "11000011",
    ];
    positions.forEach((x) => {
      for (let row = 0; row < bunker.length; row += 1) {
        for (let col = 0; col < bunker[row].length; col += 1) {
          if (bunker[row][col] === "1") shields.push({ x: x + col * 8, y: baseY + row * 8, hp: 3 });
        }
      }
    });
  };

  const spawnImpact = (x, y, color = "#71dcff", count = 9, force = 55) => {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * force;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.18 + Math.random() * 0.3,
        maxLife: 0.48,
        size: Math.random() > 0.65 ? 3 : 2,
        color,
        drag: 0.9,
      });
    }
  };

  const spawnExplosion = (x, y, sourceColor = "#ffd166") => {
    const colors = [shadeHex(sourceColor, 70), sourceColor, shadeHex(sourceColor, -55), "#fff0a8", "#ff8b54"];
    for (let i = 0; i < 42; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 145;
      const life = 0.45 + Math.random() * 0.7;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: Math.random() > 0.78 ? 4 : Math.random() > 0.42 ? 3 : 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        drag: 0.975,
      });
    }
    impactFreeze = 0.04;
    screenShake = 0.16;
  };

  const spawnEnemyBurst = (x, y, sourceColor) => {
    const colors = [shadeHex(sourceColor, 55), sourceColor, shadeHex(sourceColor, -40), "#fff0a8"];
    for (let i = 0; i < 16; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 72;
      const life = 0.22 + Math.random() * 0.3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: Math.random() > 0.7 ? 3 : 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        drag: 0.95,
      });
    }
  };

  const reset = () => {
    score = 0;
    level = 1;
    lives = diffSettings().lives;
    bullets = [];
    enemyBullets = [];
    particles = [];
    scorePopups = [];
    ufo = null;
    ufoCooldown = 12 + Math.random() * 12;
    speed = diffSettings().speed;
    direction = 1;
    formationFrame = 0;
    marchDistance = 0;
    impactFreeze = 0;
    screenShake = 0;
    respawnTimer = 0;
    alive = true;
    player.x = view.baseWidth / 2;
    createInvaders();
    createShields();
    state = "intro";
  };

  const startGame = () => {
    score = 0;
    level = 1;
    lives = diffSettings().lives;
    bullets = [];
    enemyBullets = [];
    particles = [];
    scorePopups = [];
    ufo = null;
    ufoCooldown = 12 + Math.random() * 12;
    speed = diffSettings().speed;
    direction = 1;
    formationFrame = 0;
    marchDistance = 0;
    impactFreeze = 0;
    screenShake = 0;
    respawnTimer = 0;
    alive = true;
    player.x = view.baseWidth / 2;
    createInvaders();
    createShields();
    state = "playing";
    runStart = performance.now();
    scoreOverlay.style.display = "none";
    refreshLeaderboard();
  };

  const firePlayer = () => {
    if (!alive || state !== "playing") return;
    const limit = diffSettings().playerShots;
    if (bullets.length >= limit) return;
    if (fireCooldown > 0) return;
    bullets.push({ x: player.x, y: player.y - 12, vy: -280, trailTimer: 0 });
    spawnImpact(player.x, player.y - 14, "#fff0a8", 6, 35);
    fireCooldown = 0.35;
    playSfx(pewAudio);
  };

  canvas.addEventListener("pointermove", (event) => {
    if (settings.controls !== "mouse" || state !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    player.x = Math.max(20, Math.min(view.baseWidth - 20, ((event.clientX - rect.left) / rect.width) * view.baseWidth));
  }, { signal });

  canvas.addEventListener("pointerdown", (event) => {
    if (settings.controls !== "mouse" || state !== "playing") return;
    event.preventDefault();
    firePlayer();
  }, { signal });

  const step = (dt) => {
    if (state !== "playing") {
      stopMarch();
      return;
    }

    screenShake = Math.max(0, screenShake - dt);
    if (impactFreeze > 0) {
      impactFreeze = Math.max(0, impactFreeze - dt);
      return;
    }

    if (moveLeft) player.x = Math.max(20, player.x - 220 * dt);
    if (moveRight) player.x = Math.min(view.baseWidth - 20, player.x + 220 * dt);
    fireCooldown = Math.max(0, fireCooldown - dt);
    respawnTimer = Math.max(0, respawnTimer - dt);

    const aliveInvaders = invaders.filter((i) => i.alive);
    const totalInvaders = invaders.length;
    const aliveCount = aliveInvaders.length || 1;
    const speedBoost = 1 + (1 - aliveCount / totalInvaders) * 1.6;
    const moveSpeed = speed * speedBoost * (1 + (level - 1) * 0.04);

    if (aliveInvaders.length) {
      const minCol = Math.min(...aliveInvaders.map((i) => i.col));
      const maxCol = Math.max(...aliveInvaders.map((i) => i.col));
      const leftEdge = formationX + minCol * INVADER_SPACING_X;
      const rightEdge = formationX + maxCol * INVADER_SPACING_X;
      const leftBound = 30;
      const rightBound = view.baseWidth - 30;
      if (leftEdge <= leftBound || rightEdge >= rightBound) {
        direction *= -1;
        formationFrame = formationFrame ? 0 : 1;
        formationY += drop;
        // Nudge back inside bounds to avoid repeated edge-trigger drops.
        formationX = Math.min(Math.max(formationX, leftBound - minCol * INVADER_SPACING_X), rightBound - maxCol * INVADER_SPACING_X);
        formationX += direction * 4;
      } else {
        const movement = direction * moveSpeed * dt;
        formationX += movement;
        marchDistance += Math.abs(movement);
        if (marchDistance >= 8) {
          formationFrame = formationFrame ? 0 : 1;
          marchDistance %= 8;
        }
      }
      if (formationY + 4 * INVADER_SPACING_Y > player.y - 30) {
        alive = false;
        state = "gameover";
        overlayTitle.textContent = "Game Over";
        overlaySubtitle.textContent = "Top Scores (7 days)";
        scoreOverlay.style.display = "block";
        if (score > highScore) {
          highScore = score;
          localStorage.setItem(HIGH_KEY, String(highScore));
        }
        maybeSubmitScore();
      }
    }

    const beatTempo = Math.max(0.12, 0.4 - speedBoost * 0.08);
    startMarch(beatTempo);

    bullets.forEach((b) => {
      b.y += b.vy * dt;
      b.trailTimer = (b.trailTimer || 0) + dt;
      if (b.trailTimer >= 0.035) {
        b.trailTimer = 0;
        particles.push({ x: b.x - 1, y: b.y + 7, vx: (Math.random() - 0.5) * 10, vy: 28, life: 0.18, maxLife: 0.18, size: 2, color: "#ffd166", drag: 0.92 });
      }
    });
    bullets = bullets.filter((b) => b.y > -20);

    enemyBullets.forEach((b) => {
      b.y += b.vy * dt;
      b.trailTimer = (b.trailTimer || 0) + dt;
      if (b.trailTimer >= 0.045) {
        b.trailTimer = 0;
        particles.push({ x: b.x - 1, y: b.y - 5, vx: (Math.random() - 0.5) * 8, vy: -20, life: 0.2, maxLife: 0.2, size: 2, color: "#ff6f91", drag: 0.92 });
      }
    });
    enemyBullets = enemyBullets.filter((b) => b.y < view.baseHeight + 20);

    particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag || 0.98;
      p.vy *= p.drag || 0.98;
      p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0).slice(-520);

    scorePopups.forEach((p) => {
      p.y -= 14 * dt;
      p.life -= dt;
    });
    scorePopups = scorePopups.filter((p) => p.life > 0);

    if (ufo) {
      ufo.x += ufo.vx * dt;
      if (ufo.x < -40 || ufo.x > view.baseWidth + 40) {
        ufo = null;
        ufoCooldown = 12 + Math.random() * 12;
      }
    } else {
      ufoCooldown = Math.max(0, ufoCooldown - dt);
      if (ufoCooldown <= 0) {
        const fromLeft = Math.random() > 0.5;
        ufo = { x: fromLeft ? -30 : view.baseWidth + 30, y: HUD_HEIGHT + 12, vx: fromLeft ? 120 : -120 };
        playSfx(ufoAudio);
      }
    }

    bullets.forEach((b) => {
      invaders.forEach((i) => {
        if (!i.alive) return;
        const x = formationX + i.col * INVADER_SPACING_X;
        const y = formationY + i.row * INVADER_SPACING_Y;
        const sprite = spriteCache.invaders[i.row].primary;
        const hitW = sprite.w * invaderScale * 0.6;
        const hitH = sprite.h * invaderScale * 0.6;
        if (Math.abs(b.x - x) < hitW / 2 && Math.abs(b.y - y) < hitH / 2) {
          i.alive = false;
          b.hit = true;
          score += rowConfig[i.row].score;
          scorePopups.push({ x, y, text: `+${rowConfig[i.row].score}`, life: 1 });
          playEnemyHit();
          spawnEnemyBurst(x, y, rowConfig[i.row].color);
        }
      });
      if (ufo && !b.hit) {
        const ufoSprite = spriteCache.ufo;
        const ufoW = ufoSprite.w * ufoScale * 0.6;
        const ufoH = ufoSprite.h * ufoScale * 0.5;
        if (Math.abs(b.x - ufo.x) < ufoW / 2 && Math.abs(b.y - ufo.y) < ufoH / 2) {
          b.hit = true;
          score += UFO_SCORE;
          scorePopups.push({ x: ufo.x, y: ufo.y, text: `+${UFO_SCORE}`, life: 1.4 });
          spawnExplosion(ufo.x, ufo.y, "#ff6f91");
          ufo = null;
          ufoCooldown = 12 + Math.random() * 12;
        }
      }
    });
    bullets = bullets.filter((b) => !b.hit);

    bullets.forEach((b) => {
      shields.forEach((s) => {
        if (s.hp <= 0) return;
        if (b.x > s.x && b.x < s.x + 7 && b.y > s.y && b.y < s.y + 7) {
          s.hp -= 1;
          b.hit = true;
          spawnImpact(b.x, b.y, "#71dcff");
        }
      });
    });
    bullets = bullets.filter((b) => !b.hit);

    enemyBullets.forEach((b) => {
      shields.forEach((s) => {
        if (s.hp <= 0) return;
        if (b.x > s.x && b.x < s.x + 7 && b.y > s.y && b.y < s.y + 7) {
          s.hp -= 1;
          b.hit = true;
          spawnImpact(b.x, b.y, "#ff6f91");
        }
      });
    });
    enemyBullets = enemyBullets.filter((b) => !b.hit);

    enemyBullets.forEach((b) => {
      if (
        respawnTimer <= 0 &&
        b.x > player.x - player.width / 2 &&
        b.x < player.x + player.width / 2 &&
        b.y > player.y - player.height / 2 &&
        b.y < player.y + player.height / 2
      ) {
        b.hit = true;
        respawnTimer = 3;
        lives -= 1;
        spawnExplosion(player.x, player.y, "#71dcff");
        playSfx(explosionAudio);
        if (lives <= 0) {
          alive = false;
          state = "gameover";
          overlayTitle.textContent = "Game Over";
          overlaySubtitle.textContent = "Top Scores (7 days)";
          scoreOverlay.style.display = "block";
          stopMarch();
          maybeSubmitScore();
          if (score > highScore) {
            highScore = score;
            localStorage.setItem(HIGH_KEY, String(highScore));
          }
        } else {
          player.x = view.baseWidth / 2;
        }
      }
    });
    enemyBullets = enemyBullets.filter((b) => !b.hit);

    if (invaders.every((i) => !i.alive)) {
      level += 1;
      speed += 6;
      direction = 1;
      createInvaders();
    }

    const fireChance = diffSettings().fireRate * (1 + level * 0.06) * dt;
    invaderFireTimer += fireChance;
    if (invaderFireTimer > 0.6) {
      invaderFireTimer = 0;
      const shooters = invaders.filter((i) => i.alive);
      if (shooters.length) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        enemyBullets.push({ x: formationX + shooter.col * INVADER_SPACING_X, y: formationY + shooter.row * INVADER_SPACING_Y, vy: 200 + level * 6, trailTimer: 0 });
      }
    }

    resourceTracker.setAppTotal(
      appId,
      "entities",
      (bullets.length + enemyBullets.length + invaders.length + shields.length + particles.length + scorePopups.length + (ufo ? 1 : 0)) * 52,
      "Entity buffers",
    );
  };

  const addPatternVoxels = (target, pattern, centerX, centerY, color, size = 4, depth = 4) => {
    const patternWidth = pattern[0].length * size;
    const patternHeight = pattern.length * size;
    pattern.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col += 1) {
        if (row[col] !== "1") continue;
        target.push({
          x: centerX - patternWidth / 2 + col * size + size / 2,
          y: centerY - patternHeight / 2 + rowIndex * size + size / 2,
          z: depth / 2,
          size: size * 0.92,
          depth,
          color,
        });
      }
    });
  };

  const addVoxelText = (target, text, centerX, topY, color, size = 2, depth = 3) => {
    const glyphs = [...text].map((character) => voxelGlyphs[character] || voxelGlyphs[" "]);
    const widths = glyphs.map((glyph) => glyph[0].length);
    const totalWidth = (widths.reduce((sum, width) => sum + width, 0) + Math.max(0, glyphs.length - 1)) * size;
    let cursorX = centerX - totalWidth / 2;
    glyphs.forEach((glyph, glyphIndex) => {
      glyph.forEach((row, rowIndex) => {
        for (let column = 0; column < row.length; column += 1) {
          if (row[column] !== "1") continue;
          target.push({
            x: cursorX + column * size + size / 2,
            y: topY + rowIndex * size + size / 2,
            z: depth / 2,
            size: size * 0.9,
            depth,
            color,
          });
        }
      });
      cursorX += (widths[glyphIndex] + 1) * size;
    });
  };

  const draw = () => {
    clear();
    updateHud();
    overlayControls.textContent = settings.controls === "mouse"
      ? "Move the mouse to steer · Click to fire · P to pause"
      : "Move: A/D or ←/→ · Fire: Space · Pause: P";
    ctx.imageSmoothingEnabled = false;
    const backdrop = ctx.createLinearGradient(0, 0, 0, view.baseHeight);
    backdrop.addColorStop(0, "#07101a");
    backdrop.addColorStop(0.55, "#080d16");
    backdrop.addColorStop(1, "#03070d");
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, view.baseWidth, view.baseHeight);

    const starTime = performance.now() / 1000;
    stars.forEach((star) => {
      const alpha = 0.14 + star.depth * 0.18 + (Math.sin(starTime * star.speed + star.phase) + 1) * 0.1;
      const rgb = star.tint > 0.9 ? "255,220,151" : star.tint > 0.68 ? "113,220,255" : "198,224,242";
      const starX = (star.x + starTime * star.depth * 0.7) % view.baseWidth;
      const starY = (star.y + starTime * star.depth * 1.8) % view.baseHeight;
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.fillRect(Math.round(starX), Math.round(starY), star.size, star.size);
      if (star.depth > 0.82 && star.tint > 0.94) ctx.fillRect(Math.round(starX), Math.round(starY - 3), 1, 3);
    });

    const voxelScene = [];
    if (voxelLayer) {
      [
        { x: 150, label: "SCORE<1>", value: String(score).padStart(6, "0"), color: "#71dcff" },
        { x: 285, label: "HI-SCORE", value: String(Math.max(score, highScore)).padStart(6, "0"), color: "#7068ff" },
        { x: 410, label: "WAVE", value: String(level).padStart(2, "0"), color: "#ffd166" },
        { x: 515, label: "SHIPS", value: String(Math.max(0, lives)), color: "#76ec9f" },
      ].forEach((readout) => {
        addVoxelText(voxelScene, readout.label, readout.x, 10, readout.color, 1.75, 3);
        addVoxelText(voxelScene, readout.value, readout.x, 23, "#f7f7f2", 2.25, 4);
      });
    }
    let shakeX = 0;
    let shakeY = 0;
    if (screenShake > 0) {
      const strength = Math.min(2, screenShake * 12);
      shakeX = Math.round((Math.random() - 0.5) * strength);
      shakeY = Math.round((Math.random() - 0.5) * strength);
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (ufo) {
      if (voxelLayer) addPatternVoxels(voxelScene, spriteDefs.ufo, ufo.x + shakeX, ufo.y + shakeY, "#ff6f91", 4.2, 5.5);
      else drawSprite(ctx, spriteCache.ufo, ufo.x, ufo.y, ufoScale);
    }

    invaders.forEach((i) => {
      if (!i.alive) return;
      const pattern = formationFrame ? spriteDefs[`${rowConfig[i.row].sprite}Alt`] : spriteDefs[rowConfig[i.row].sprite];
      if (voxelLayer) {
        addPatternVoxels(
          voxelScene,
          pattern,
          formationX + i.col * INVADER_SPACING_X + shakeX,
          formationY + i.row * INVADER_SPACING_Y + shakeY,
          rowConfig[i.row].color,
          4,
          5,
        );
      } else {
        const sprite = formationFrame ? spriteCache.invaders[i.row].alternate : spriteCache.invaders[i.row].primary;
        drawSprite(ctx, sprite, formationX + i.col * INVADER_SPACING_X, formationY + i.row * INVADER_SPACING_Y, invaderScale);
      }
    });

    if (alive) {
      const shipColor = respawnTimer > 0 && Math.floor(starTime * 10) % 2 ? "#356276" : "#71dcff";
      if (voxelLayer) {
        addPatternVoxels(voxelScene, spriteDefs.ship, player.x + shakeX, player.y + shakeY, shipColor, 4, 6);
        voxelScene.push({ x: player.x + shakeX, y: player.y - 5 + shakeY, z: 5, size: 5, depth: 7, color: "#16384a" });
      } else {
        drawSprite(ctx, spriteCache.ship, player.x, player.y, shipScale);
      }
      const flameLength = Math.floor(starTime * 12) % 2 ? 5 : 3;
      ctx.fillStyle = "#fff0a8";
      ctx.fillRect(Math.round(player.x - 5), Math.round(player.y + 13), 3, flameLength);
      ctx.fillRect(Math.round(player.x + 3), Math.round(player.y + 13), 3, flameLength);
      ctx.fillStyle = "#ff8b54";
      ctx.fillRect(Math.round(player.x - 4), Math.round(player.y + 13 + flameLength), 2, 2);
      ctx.fillRect(Math.round(player.x + 4), Math.round(player.y + 13 + flameLength), 2, 2);
    }

    shields.forEach((s) => {
      if (s.hp <= 0) return;
      const shieldColor = s.hp === 3 ? "#72c8e8" : s.hp === 2 ? "#5798b2" : "#3b687d";
      if (voxelLayer) voxelScene.push({ x: s.x + 3.5 + shakeX, y: s.y + 3.5 + shakeY, z: 3.5, size: 7, depth: 7, color: shieldColor });
      else drawVoxelBlock(ctx, s.x, s.y, 7, shieldColor);
    });

    bullets.forEach((b) => {
      ctx.fillStyle = "#fff0a8";
      ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 6), 3, 9);
      ctx.fillStyle = "#ff9f43";
      ctx.fillRect(Math.round(b.x), Math.round(b.y + 3), 2, 3);
    });
    enemyBullets.forEach((b) => {
      ctx.fillStyle = "#ffabc0";
      ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 4), 3, 7);
      ctx.fillStyle = "#c43f65";
      ctx.fillRect(Math.round(b.x), Math.round(b.y + 3), 2, 3);
    });

    particles.forEach((p) => {
      const size = p.size || 2;
      const lifeRatio = Math.min(1, Math.max(0, p.life / (p.maxLife || 0.7)));
      if (voxelLayer) {
        voxelScene.push({
          x: p.x + shakeX,
          y: p.y + shakeY,
          z: size * lifeRatio * 1.8,
          size: Math.max(1.3, size * lifeRatio),
          depth: Math.max(1.5, size * 1.5 * lifeRatio),
          color: p.color || "#ffd166",
        });
      } else {
        ctx.globalAlpha = lifeRatio;
        drawVoxelBlock(ctx, Math.round(p.x), Math.round(p.y), Math.max(2, Math.round(size * lifeRatio)), p.color || "#ffd166");
      }
    });
    ctx.restore();
    ctx.globalAlpha = 1;
    voxelLayer?.render(voxelScene);

    scorePopups.forEach((p) => {
      ctx.fillStyle = "rgba(255, 214, 102, 0.95)";
      ctx.font = "12px 'Avenir Next', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
    });

    if (state === "intro") {
      overlayTitle.textContent = "Space Defender";
      overlaySubtitle.textContent = `${settings.difficulty[0].toUpperCase()}${settings.difficulty.slice(1)} formation · Top scores`;
      overlayAction.textContent = "Defend Earth";
      scoreOverlay.style.display = "grid";
    }

    if (state === "gameover") {
      overlayTitle.textContent = "Game Over";
      overlaySubtitle.textContent = `Final score · ${String(score).padStart(6, "0")}`;
      overlayAction.textContent = "Defend again";
      scoreOverlay.style.display = "grid";
    }

    if (state === "paused") {
      overlayTitle.textContent = "Paused";
      overlaySubtitle.textContent = `Wave ${level} · ${String(score).padStart(6, "0")} points`;
      overlayAction.textContent = "Resume defense";
      scoreOverlay.style.display = "grid";
    }
  };

  overlayAction.addEventListener("click", () => {
    if (state === "paused") {
      state = "playing";
      scoreOverlay.style.display = "none";
    } else {
      startGame();
    }
  }, { signal });

  toolbar.querySelector("[data-new-game]").addEventListener("click", startGame, { signal });
  toolbar.querySelector("[data-settings]").addEventListener("click", openPreferences, { signal });
  toolbar.querySelector("[data-fullscreen]").addEventListener("click", () => {
    window.parent.postMessage({ type: "daemoncade:request-fullscreen" }, window.location.origin);
  }, { signal });

  document.addEventListener("keydown", (event) => {
    if (osAPI?.getActiveAppId && osAPI.getActiveAppId() !== appId) return;
    if (prefsModal.style.display === "flex" && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      prefsModal.style.display = "none";
      return;
    }
    if (state === "gameover" && event.key.toLowerCase() === "r") startGame();
    if (settings.controls === "keyboard" && (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      moveLeft = true;
    }
    if (settings.controls === "keyboard" && (event.key === "ArrowRight" || event.key.toLowerCase() === "d")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      moveRight = true;
    }
    if (settings.controls === "keyboard" && event.key === " " && fireCooldown <= 0 && alive && state === "playing") {
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      firePlayer();
    }
    if (event.key.toLowerCase() === "p" && (state === "playing" || state === "paused")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      state = state === "paused" ? "playing" : "paused";
      scoreOverlay.style.display = state === "playing" ? "none" : "grid";
      if (state !== "playing") stopMarch();
    }
    if (event.key === "Enter") startGame();
    if (event.key.toLowerCase() === "r") startGame();
  }, { signal });

  document.addEventListener("keyup", (event) => {
    if (osAPI?.getActiveAppId && osAPI.getActiveAppId() !== appId) return;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      moveLeft = false;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      moveRight = false;
    }
  }, { signal });

  window.addEventListener("daemonos-profile-change", refreshLeaderboard, { signal });

  const canvasToken = resourceTracker.claim(appId, "canvas", view.baseWidth * view.baseHeight * 4, "Game canvas");

  const loop = createAppLoop(appId, {
    step,
    render: draw,
    isActive: () => content.isConnected,
  });
  loop.start();

  const observer = new MutationObserver(() => {
    if (!content.isConnected) {
      observer.disconnect();
      controller.abort();
      resizeObserver.disconnect();
      loop.stop();
      stopMarch();
      resourceTracker.release(canvasToken);
      audioRegistry.clear(appId);
      if (markAudioActive.timer) clearTimeout(markAudioActive.timer);
      [pewAudio, explosionAudio, enemyHitAudio, ufoAudio].forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      audioCtx.close().catch(() => {});
      voxelLayer?.destroy();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  osAPI?.registerAppMenu?.("space-defender", {
    appName: "Space Defender",
    menus: [
      {
        title: "Space Defender",
        items: [
          { label: "Start New Game", onClick: startGame },
          { label: "Preferences", onClick: openPreferences },
        ],
      },
      { title: "Edit", items: [{ label: "Undo", disabled: true }] },
      { title: "View", items: [{ label: "Zoom In", disabled: true }] },
      { title: "Window", items: [{ label: "Minimize All", disabled: true }] },
      { title: "Help", items: [{ label: "Space Defender Help", disabled: true }] },
    ],
  });

  reset();
  refreshLeaderboard();

  return {
    title: "Space Defender",
    width: 620,
    height: 520,
    aspectRatio: view.baseWidth / view.baseHeight,
    content: wrapper,
    onSuspend: () => {
      loop.suspend();
      stopMarch();
      audioRegistry.setAudioActive(appId, false);
    },
    onResume: () => {
      loop.resume();
    },
    freeOptionalCaches: () => {
      particles = [];
      scorePopups = [];
      resourceTracker.setAppTotal(appId, "entities", 0, "Entity buffers");
    },
  };
}
