import { createGameSurface } from "../daemonos-shared/gameUtils.js?v=1.0.0-beta.2";
import { createAppLoop } from "../daemonos-shared/appPerformance.js?v=1.0.0-beta.2";
import { resourceTracker } from "../daemonos-shared/resourceTracker.js?v=1.0.0-beta.2";
import { audioRegistry } from "../daemonos-shared/audioRegistry.js?v=1.0.0-beta.2";
import { getBoardIdForGame, submitFinalScore, fetchHighScores, getActivePlayerName } from "../daemonos-shared/scoreSystem.js?v=1.0.0-beta.2";

const SETTINGS_KEY = "space-defender_settings";
const HIGH_KEY = "space-defender_highscore";

const BASE_WIDTH = 600;
const BASE_HEIGHT = 520;
const HUD_HEIGHT = 28;

const DIFFICULTY = {
  easy: { fireRate: 0.55, speed: 13, lives: 4, playerShots: 4 },
  normal: { fireRate: 0.8, speed: 17, lives: 3, playerShots: 3 },
  hard: { fireRate: 1.05, speed: 21, lives: 2, playerShots: 3 },
};

const UFO_SCORE = 200;

const spriteDefs = {
  invaderA: [
    "0011111000111100",
    "0111111111111110",
    "1110111111101111",
    "1111111111111111",
    "0011011111101100",
    "0111100110011110",
    "1100011001100011",
    "0011100000011100",
  ],
  invaderB: [
    "0001111101111000",
    "0111111111111110",
    "1110111111101111",
    "1111111111111111",
    "0011110110111100",
    "0110011111100110",
    "1101100000011011",
    "0011000000001100",
  ],
  invaderC: [
    "0001110011001110",
    "0011111111111100",
    "0110111111101100",
    "1111111111111111",
    "1111011111101111",
    "0011110110111100",
    "0110001111000110",
    "1100000000000011",
  ],
  ship: [
    "0000011111110000",
    "0001111111111000",
    "0011111111111100",
    "0111111111111110",
    "1111111111111111",
    "1110011111100111",
    "0111110000111110",
    "0011000000001100",
  ],
  ufo: [
    "0000111111110000",
    "0011111111111100",
    "0110111111110110",
    "1111111111111111",
    "1110011111100111",
    "0111110000111110",
    "0011000000001100",
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
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const sctx = canvas.getContext("2d");
  sctx.imageSmoothingEnabled = false;
  sctx.fillStyle = color;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (pattern[y][x] === "1") sctx.fillRect(x, y, 1, 1);
    }
  }
  return { canvas, w, h };
};

const spriteCache = {
  ship: makeSprite(spriteDefs.ship, "#7bd5ff"),
  ufo: makeSprite(spriteDefs.ufo, "#ff6f91"),
};
rowConfig.forEach((row) => {
  if (!spriteCache[row.sprite]) spriteCache[row.sprite] = makeSprite(spriteDefs[row.sprite], row.color);
});

const drawSprite = (ctx, sprite, x, y, scale) => {
  ctx.drawImage(sprite.canvas, x - (sprite.w * scale) / 2, y - (sprite.h * scale) / 2, sprite.w * scale, sprite.h * scale);
};

export function createApp(osAPI) {
  const appId = "space-defender";
  const controller = new AbortController();
  const { signal } = controller;

  const wrapper = document.createElement("div");
  wrapper.classList.add("game-shell");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "10px";
  wrapper.style.height = "100%";
  wrapper.style.minHeight = "0";
  wrapper.style.flex = "1";
  wrapper.style.width = "100%";

  // Arcade games should not show UI controls above the playfield.

  const { content, ctx, view, resizeObserver, clear } = createGameSurface({
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    fit: "contain",
  });
  wrapper.appendChild(content);
  content.style.flex = "1";
  content.style.minHeight = "0";
  content.style.position = "relative";

  const scoreOverlay = document.createElement("div");
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
  scoreOverlay.style.pointerEvents = "none";

  const overlayTitle = document.createElement("div");
  overlayTitle.style.fontSize = "14px";
  overlayTitle.style.fontWeight = "600";
  overlayTitle.style.marginBottom = "6px";
  const overlaySubtitle = document.createElement("div");
  overlaySubtitle.style.opacity = "0.7";
  overlaySubtitle.style.marginBottom = "10px";
  const overlayList = document.createElement("div");
  overlayList.style.display = "grid";
  overlayList.style.gap = "4px";
  overlayList.style.fontSize = "12px";
  overlayList.style.textAlign = "left";
  scoreOverlay.append(overlayTitle, overlaySubtitle, overlayList);
  content.appendChild(scoreOverlay);

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored
    ? { difficulty: "normal", sfx: true, music: true, ...JSON.parse(stored) }
    : { difficulty: "normal", sfx: true, music: true };

  let highScore = Number(localStorage.getItem(HIGH_KEY)) || 0;

  const prefsModal = document.createElement("div");
  prefsModal.style.position = "absolute";
  prefsModal.style.inset = "0";
  prefsModal.style.display = "none";
  prefsModal.style.alignItems = "center";
  prefsModal.style.justifyContent = "center";
  prefsModal.style.background = "rgba(0,0,0,0.45)";
  prefsModal.style.zIndex = "5";

  const prefsCard = document.createElement("div");
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
  prefsTitle.style.fontSize = "14px";
  prefsTitle.style.fontWeight = "600";

  const difficultyRow = document.createElement("div");
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

  const audioRow = document.createElement("div");
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
  controlsNote.textContent = "Controls: Arrow keys to move, Space to fire. P pauses.";

  const prefsActions = document.createElement("div");
  prefsActions.style.display = "flex";
  prefsActions.style.justifyContent = "flex-end";
  const closePrefs = document.createElement("button");
  closePrefs.className = "menu-button";
  closePrefs.textContent = "Close";
  prefsActions.append(closePrefs);

  prefsCard.append(prefsTitle, difficultyRow, audioRow, controlsNote, prefsActions);
  prefsModal.appendChild(prefsCard);
  content.appendChild(prefsModal);

  const openPreferences = () => {
    difficultySelect.value = settings.difficulty;
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

  const shipScale = 2;
  const invaderScale = 2;
  const ufoScale = 1.6;

  let player = { x: view.baseWidth / 2, y: view.baseHeight - 48, width: spriteCache.ship.w * shipScale, height: spriteCache.ship.h * shipScale };
  let bullets = [];
  let enemyBullets = [];
  let invaders = [];
  let shields = [];
  let formationX = 60;
  let formationY = HUD_HEIGHT + 40;
  let direction = 1;
  let speed = 32;
  let drop = 18;
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
  const ufoAudio = new Audio("./sfx/gameover2.mp3");
  [pewAudio, explosionAudio, ufoAudio].forEach((audio) => {
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

  const createInvaders = () => {
    invaders = [];
    const rows = 5;
    const cols = 11;
    const spacingX = 34;
    const spacingY = 26;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        invaders.push({ row: r, col: c, alive: true });
      }
    }
    formationX = 60;
    formationY = HUD_HEIGHT + 36;
  };

  const createShields = () => {
    shields = [];
    const baseY = view.baseHeight - 130;
    const positions = [90, 210, 330, 450];
    positions.forEach((x) => {
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 6; col += 1) {
          shields.push({ x: x + col * 12, y: baseY + row * 10, hp: 3 });
        }
      }
    });
  };

  const spawnExplosion = (x, y) => {
    for (let i = 0; i < 18; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 100;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.6 + Math.random() * 0.4 });
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
    bullets.push({ x: player.x, y: player.y - 12, vy: -280 });
    fireCooldown = 0.35;
    playSfx(pewAudio);
  };

  const step = (dt) => {
    if (state !== "playing") {
      stopMarch();
      return;
    }

    if (moveLeft) player.x = Math.max(20, player.x - 220 * dt);
    if (moveRight) player.x = Math.min(view.baseWidth - 20, player.x + 220 * dt);
    fireCooldown = Math.max(0, fireCooldown - dt);

    const aliveInvaders = invaders.filter((i) => i.alive);
    const totalInvaders = invaders.length;
    const aliveCount = aliveInvaders.length || 1;
    const speedBoost = 1 + (1 - aliveCount / totalInvaders) * 1.6;
    const moveSpeed = speed * speedBoost * (1 + (level - 1) * 0.04);

    if (aliveInvaders.length) {
      const minCol = Math.min(...aliveInvaders.map((i) => i.col));
      const maxCol = Math.max(...aliveInvaders.map((i) => i.col));
      const leftEdge = formationX + minCol * 34;
      const rightEdge = formationX + maxCol * 34;
      const leftBound = 30;
      const rightBound = view.baseWidth - 30;
      if (leftEdge <= leftBound || rightEdge >= rightBound) {
        direction *= -1;
        formationY += drop;
        // Nudge back inside bounds to avoid repeated edge-trigger drops.
        formationX = Math.min(Math.max(formationX, leftBound - minCol * 34), rightBound - maxCol * 34);
        formationX += direction * 4;
      } else {
        formationX += direction * moveSpeed * dt;
      }
      if (formationY + 4 * 26 > player.y - 30) {
        alive = false;
        state = "gameover";
        overlayTitle.textContent = "Game Over";
        overlaySubtitle.textContent = "Top Scores (7 days)";
        scoreOverlay.style.display = "block";
        maybeSubmitScore();
      }
    }

    const beatTempo = Math.max(0.12, 0.4 - speedBoost * 0.08);
    startMarch(beatTempo);

    bullets.forEach((b) => {
      b.y += b.vy * dt;
    });
    bullets = bullets.filter((b) => b.y > -20);

    enemyBullets.forEach((b) => {
      b.y += b.vy * dt;
    });
    enemyBullets = enemyBullets.filter((b) => b.y < view.baseHeight + 20);

    particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0);

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
        const x = formationX + i.col * 34;
        const y = formationY + i.row * 26;
        const sprite = spriteCache[rowConfig[i.row].sprite];
        const hitW = sprite.w * invaderScale * 0.6;
        const hitH = sprite.h * invaderScale * 0.6;
        if (Math.abs(b.x - x) < hitW / 2 && Math.abs(b.y - y) < hitH / 2) {
          i.alive = false;
          b.hit = true;
          score += rowConfig[i.row].score;
          scorePopups.push({ x, y, text: `+${rowConfig[i.row].score}`, life: 1 });
          playSfx(explosionAudio);
          spawnExplosion(x, y);
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
          spawnExplosion(ufo.x, ufo.y);
          ufo = null;
          ufoCooldown = 12 + Math.random() * 12;
        }
      }
    });
    bullets = bullets.filter((b) => !b.hit);

    bullets.forEach((b) => {
      shields.forEach((s) => {
        if (s.hp <= 0) return;
        if (b.x > s.x && b.x < s.x + 10 && b.y > s.y && b.y < s.y + 8) {
          s.hp -= 1;
          b.hit = true;
        }
      });
    });
    bullets = bullets.filter((b) => !b.hit);

    enemyBullets.forEach((b) => {
      shields.forEach((s) => {
        if (s.hp <= 0) return;
        if (b.x > s.x && b.x < s.x + 10 && b.y > s.y && b.y < s.y + 8) {
          s.hp -= 1;
          b.hit = true;
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
        respawnTimer = 1.1;
        lives -= 1;
        spawnExplosion(player.x, player.y);
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

    if (invaders.every((i) => !i.alive)) {
      level += 1;
      speed += 6;
      direction = 1;
      createInvaders();
      createShields();
    }

    const fireChance = diffSettings().fireRate * (1 + level * 0.06) * dt;
    invaderFireTimer += fireChance;
    if (invaderFireTimer > 0.6) {
      invaderFireTimer = 0;
      const shooters = invaders.filter((i) => i.alive);
      if (shooters.length) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        enemyBullets.push({ x: formationX + shooter.col * 34, y: formationY + shooter.row * 26, vy: 200 + level * 6 });
      }
    }

    resourceTracker.setAppTotal(
      appId,
      "entities",
      (bullets.length + enemyBullets.length + invaders.length + shields.length + particles.length + scorePopups.length + (ufo ? 1 : 0)) * 52,
      "Entity buffers",
    );
  };

  const draw = () => {
    clear();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, view.baseWidth, view.baseHeight);

    ctx.fillStyle = "rgba(10, 14, 20, 0.95)";
    ctx.fillRect(0, 0, view.baseWidth, HUD_HEIGHT);
    ctx.fillStyle = "#bcd0e6";
    ctx.font = "12px 'Avenir Next', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${String(score).padStart(5, "0")}`, 12, 18);
    ctx.fillText(`HI ${String(highScore).padStart(5, "0")}`, 120, 18);
    ctx.fillText(`LEVEL ${level}`, 230, 18);

    const livesIconCount = Math.max(0, lives - 1);
    const shipSprite = spriteCache.ship;
    for (let i = 0; i < livesIconCount; i += 1) {
      drawSprite(ctx, shipSprite, view.baseWidth - 20 - i * 18, 14, 1.1);
    }

    if (ufo) drawSprite(ctx, spriteCache.ufo, ufo.x, ufo.y, ufoScale);

    invaders.forEach((i) => {
      if (!i.alive) return;
      const sprite = spriteCache[rowConfig[i.row].sprite];
      drawSprite(ctx, sprite, formationX + i.col * 34, formationY + i.row * 26, invaderScale);
    });

    if (alive) {
      ctx.globalAlpha = respawnTimer > 0 ? 0.4 : 1;
      drawSprite(ctx, spriteCache.ship, player.x, player.y, shipScale);
      ctx.globalAlpha = 1;
    }

    shields.forEach((s) => {
      if (s.hp <= 0) return;
      ctx.fillStyle = s.hp === 3 ? "rgba(123,213,255,0.8)" : s.hp === 2 ? "rgba(123,213,255,0.55)" : "rgba(123,213,255,0.3)";
      ctx.fillRect(s.x, s.y, 10, 8);
    });

    ctx.fillStyle = "#ffd166";
    bullets.forEach((b) => ctx.fillRect(b.x - 1.5, b.y - 6, 3, 12));
    ctx.fillStyle = "#ff6f91";
    enemyBullets.forEach((b) => ctx.fillRect(b.x - 1.5, b.y - 4, 3, 8));

    particles.forEach((p) => {
      ctx.fillStyle = "rgba(255, 214, 102, 0.85)";
      ctx.fillRect(p.x, p.y, 2, 2);
    });

    scorePopups.forEach((p) => {
      ctx.fillStyle = "rgba(255, 214, 102, 0.95)";
      ctx.font = "12px 'Avenir Next', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
    });

    if (state === "intro") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, view.baseWidth, view.baseHeight);
      ctx.fillStyle = "#e6edf6";
      ctx.font = "22px 'Avenir Next', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Space Defender", view.baseWidth / 2, view.baseHeight / 2 - 20);
      ctx.font = "14px 'Avenir Next', sans-serif";
      ctx.fillText("Press Start or Enter", view.baseWidth / 2, view.baseHeight / 2 + 6);
      ctx.fillText("Arrows to move, Space to fire", view.baseWidth / 2, view.baseHeight / 2 + 26);
      overlayTitle.textContent = "Space Defender";
      overlaySubtitle.textContent = "Top Scores (7 days)";
      scoreOverlay.style.display = "block";
    }

    if (state === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, view.baseWidth, view.baseHeight);
      ctx.fillStyle = "#e6edf6";
      ctx.font = "22px 'Avenir Next', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", view.baseWidth / 2, view.baseHeight / 2 - 20);
      ctx.font = "14px 'Avenir Next', sans-serif";
      ctx.fillText(`Score ${score}  High ${highScore}`, view.baseWidth / 2, view.baseHeight / 2 + 6);
      ctx.fillText("Press Start", view.baseWidth / 2, view.baseHeight / 2 + 26);
      overlayTitle.textContent = "Game Over";
      overlaySubtitle.textContent = "Top Scores (7 days)";
      scoreOverlay.style.display = "block";
    }

    if (state === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, view.baseWidth, view.baseHeight);
      ctx.fillStyle = "#e6edf6";
      ctx.font = "18px 'Avenir Next', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Paused", view.baseWidth / 2, view.baseHeight / 2);
    }
  };

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
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      moveLeft = true;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      moveRight = true;
    }
    if (event.key === " " && fireCooldown <= 0 && alive && state === "playing") {
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      firePlayer();
    }
    if (event.key.toLowerCase() === "p") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      state = state === "paused" ? "playing" : "paused";
      if (state !== "playing") stopMarch();
    }
    if (event.key === "Enter") startGame();
    if (event.key.toLowerCase() === "r") startGame();
  }, { signal });

  document.addEventListener("keyup", (event) => {
    if (osAPI?.getActiveAppId && osAPI.getActiveAppId() !== appId) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      moveLeft = false;
    }
    if (event.key === "ArrowRight") {
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
      [pewAudio, explosionAudio, ufoAudio].forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      audioCtx.close().catch(() => {});
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
