import { createGameSurface } from "../daemonos-shared/gameUtils.js";
import { createRetroAudio } from "../daemonos-shared/retroAudio.js";
import { createAppLoop } from "../daemonos-shared/appPerformance.js";
import { resourceTracker } from "../daemonos-shared/resourceTracker.js";
import { audioRegistry } from "../daemonos-shared/audioRegistry.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";

const SETTINGS_KEY = "spacefighter_settings";
const HIGH_KEY = "spacefighter_highscore";

const BASE_WIDTH = 640;
const BASE_HEIGHT = 560;

const DIFFICULTY = {
  easy: { enemyHp: 0.9, bulletSpeed: 110, fireRate: 0.7, density: 0.75, powerup: 0.6, enemySpeed: 0.85 },
  normal: { enemyHp: 1, bulletSpeed: 140, fireRate: 1, density: 1, powerup: 0.4, enemySpeed: 1 },
  hard: { enemyHp: 1.2, bulletSpeed: 170, fireRate: 1.2, density: 1.2, powerup: 0.25, enemySpeed: 1.1 },
};

const ENEMY_TYPES = ["scout", "bomber", "drone", "carrier", "elite"];

export function createApp(osAPI) {
  const appId = "spacefighter";
  const controller = new AbortController();
  const { signal } = controller;

  const wrapper = document.createElement("div");
  wrapper.style.display = "grid";
  wrapper.style.gridTemplateRows = "auto 1fr";
  wrapper.style.gap = "10px";
  wrapper.style.height = "100%";

  const toolbar = document.createElement("div");
  toolbar.className = "game-toolbar";
  const difficultySelect = document.createElement("select");
  difficultySelect.className = "menu-select";
  ["Easy", "Normal", "Hard"].forEach((label) => {
    const opt = document.createElement("option");
    opt.value = label.toLowerCase();
    opt.textContent = label;
    difficultySelect.appendChild(opt);
  });
  const startButton = document.createElement("button");
  startButton.className = "menu-button";
  startButton.textContent = "Start";
  const status = document.createElement("div");
  status.className = "game-status";
  toolbar.append(difficultySelect, startButton, status);
  wrapper.appendChild(toolbar);

  const { content, ctx, view, clear } = createGameSurface({
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    className: "game-canvas",
    fit: "contain",
  });
  wrapper.appendChild(content);
  content.style.position = "relative";
  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("spacefighter", "classic", "normal"),
    windowDays: 7,
    limit: 5,
  });
  scoreOverlay.refresh();

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored
    ? { music: true, sfx: true, difficulty: "normal", ...JSON.parse(stored) }
    : { music: true, sfx: true, difficulty: "normal" };

  difficultySelect.value = settings.difficulty;

  const audio = createRetroAudio({
    musicOn: settings.music,
    sfxOn: settings.sfx,
    musicVolume: 0.35,
    sfxVolume: 0.6,
  });
  audioRegistry.registerContext(appId, audio.ctx);

  const player = {
    x: view.baseWidth / 2,
    y: view.baseHeight - 70,
    speed: 260,
    hitbox: 4,
    invuln: 0,
    lives: 3,
    shield: 0,
    weaponLevel: 1,
    missiles: 3,
    bombs: 1,
  };

  const keys = new Set();
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let powerups = [];
  let score = 0;
  let highScore = Number(localStorage.getItem(HIGH_KEY)) || 0;
  let wave = 1;
  let mode = "intro"; // intro | playing | paused | gameover
  let runStart = performance.now();
  let scoreSubmitted = false;
  let shootCooldown = 0;
  let grazeScore = 0;
  let boss = null;
  let levelTimer = 0;
  let level = 1;
  let scrollSpeed = 40;
  let background = { stars: [], midStars: [], planets: [] };
  let timers = new Set();

  const currentDifficulty = () => DIFFICULTY[difficultySelect.value] || DIFFICULTY.normal;

  const updateStatus = () => {
    if (mode === "playing") {
      status.textContent = `Lives ${player.lives} • Score ${score} • Level ${level}`;
    } else if (mode === "paused") {
      status.textContent = "Paused";
    } else if (mode === "gameover") {
      status.textContent = `Game Over • Score ${score}`;
    } else {
      status.textContent = "Ready";
    }
  };

  const resetState = () => {
    player.x = view.baseWidth / 2;
    player.y = view.baseHeight - 70;
    player.invuln = 0;
    player.lives = 3;
    player.shield = 0;
    player.weaponLevel = 1;
    player.missiles = 3;
    player.bombs = 1;
    score = 0;
    grazeScore = 0;
    wave = 1;
    level = 1;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerups = [];
    boss = null;
    shootCooldown = 0;
    levelTimer = 0;
    scrollSpeed = 40;
    mode = "intro";
    updateStatus();
  };

  const initBackground = () => {
    background.stars = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * BASE_WIDTH,
      y: Math.random() * BASE_HEIGHT,
      speed: 20 + Math.random() * 20,
      size: 1,
    }));
    background.midStars = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * BASE_WIDTH,
      y: Math.random() * BASE_HEIGHT,
      speed: 40 + Math.random() * 30,
      size: 2,
    }));
    background.planets = [];
  };

  const spawnPlanet = () => {
    background.planets.push({
      x: Math.random() * BASE_WIDTH,
      y: -80,
      r: 30 + Math.random() * 40,
      speed: 10 + Math.random() * 10,
      color: "rgba(120,180,255,0.3)",
    });
  };

  const updateBackground = (dt) => {
    background.stars.forEach((s) => {
      s.y += (s.speed + scrollSpeed * 0.4) * dt;
      if (s.y > BASE_HEIGHT) s.y = 0;
    });
    background.midStars.forEach((s) => {
      s.y += (s.speed + scrollSpeed * 0.6) * dt;
      if (s.y > BASE_HEIGHT) s.y = 0;
    });
    background.planets.forEach((p) => {
      p.y += (p.speed + scrollSpeed * 0.4) * dt;
    });
    background.planets = background.planets.filter((p) => p.y < BASE_HEIGHT + 100);
    if (Math.random() < 0.002) spawnPlanet();
  };

  const spawnEnemy = (type, x, y) => {
    const diff = currentDifficulty();
    const levelScale = 1 + Math.min(0.6, (level - 1) * 0.12);
    const base = level === 1 ? 1 : type === "elite" ? 2 : type === "carrier" ? 2 : 1;
    const hp = Math.max(1, Math.min(5, Math.round(base * diff.enemyHp * levelScale)));
    enemies.push({
      type,
      x,
      y,
      hp,
      fireTimer: Math.random(),
      angle: Math.random() * Math.PI * 2,
      dir: Math.random() > 0.5 ? 1 : -1,
      phase: 0,
    });
  };

  const spawnWave = () => {
    const density = currentDifficulty().density;
    const cols = Math.floor(5 + density * 2);
    for (let i = 0; i < cols; i += 1) {
      const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
      spawnEnemy(type, 80 + i * 80, -40 - i * 20);
    }
  };

  const spawnBoss = () => {
    const diff = currentDifficulty();
    boss = {
      x: view.baseWidth / 2,
      y: 90,
      hp: 90 + level * 20 * diff.enemyHp,
      maxHp: 90 + level * 20 * diff.enemyHp,
      phase: 1,
      timer: 0,
      dir: 1,
    };
    enemies = [];
  };

  const maybeSpawnPowerup = (x, y) => {
    const diff = currentDifficulty();
    if (Math.random() > diff.powerup) return;
    const types = ["weapon", "shield", "missile", "bomb", "slow"];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({ x, y, type, vy: 40 });
  };

  const sfxShoot = () => audio.playTone({ freq: 640, duration: 0.05, gain: 0.5 });
  const sfxHit = () => audio.playTone({ freq: 420, duration: 0.08, gain: 0.5 });
  const sfxExplode = () => audio.playNoise({ duration: 0.12, gain: 0.45 });
  const sfxPower = () => audio.playTone({ freq: 760, duration: 0.1, gain: 0.6, type: "triangle" });

  const firePlayer = () => {
    if (shootCooldown > 0) return;
    const base = player.weaponLevel;
    const spread = base > 2 ? 0.16 : 0.08;
    const count = Math.min(1 + Math.floor(base / 2), 5);
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      bullets.push({ x: player.x, y: player.y - 8, vx: Math.sin(offset) * 50, vy: -360 });
    }
    shootCooldown = Math.max(0.12, 0.3 - base * 0.03);
    sfxShoot();
  };

  const fireMissile = () => {
    if (player.missiles <= 0) return;
    player.missiles -= 1;
    const target = enemies[0];
    bullets.push({ x: player.x, y: player.y - 8, vx: 0, vy: -260, missile: true, target });
    sfxShoot();
  };

  const updateBullets = (dt) => {
    bullets.forEach((b) => {
      if (b.missile && b.target) {
        const dx = b.target.x - b.x;
        const dy = b.target.y - b.y;
        const dist = Math.hypot(dx, dy) || 1;
        b.vx += (dx / dist) * 120 * dt;
        b.vy += (dy / dist) * 120 * dt;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    bullets = bullets.filter((b) => b.y > -30 && b.y < BASE_HEIGHT + 30 && b.x > -30 && b.x < BASE_WIDTH + 30);
  };

  const updateEnemyBullets = (dt) => {
    enemyBullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    enemyBullets = enemyBullets.filter((b) => b.y > -40 && b.y < BASE_HEIGHT + 40);
  };

  const updateEnemies = (dt) => {
    const diff = currentDifficulty();
    enemies.forEach((e) => {
      e.y += scrollSpeed * dt * diff.enemySpeed;
      if (e.type === "scout") {
        e.x += Math.sin(e.phase) * 60 * dt;
      } else if (e.type === "bomber") {
        e.x += e.dir * 40 * dt;
      } else if (e.type === "drone") {
        e.x += Math.sin(e.phase * 2) * 80 * dt;
      } else if (e.type === "carrier") {
        e.x += e.dir * 30 * dt;
      } else if (e.type === "elite") {
        e.x += Math.sin(e.phase) * 50 * dt;
      }
      e.phase += dt;
      if (e.x < 40 || e.x > BASE_WIDTH - 40) e.dir *= -1;
      e.fireTimer -= dt * diff.fireRate;
      if (e.fireTimer <= 0) {
        e.fireTimer = 1.2 + Math.random() * 1.4;
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = diff.bulletSpeed;
        enemyBullets.push({ x: e.x, y: e.y + 8, vx: (dx / dist) * speed, vy: (dy / dist) * speed, type: e.type });
      }
    });
    enemies = enemies.filter((e) => e.y < BASE_HEIGHT + 60);
  };

  const updateBoss = (dt) => {
    if (!boss) return;
    boss.timer += dt;
    boss.x += boss.dir * 40 * dt;
    if (boss.x < 120 || boss.x > BASE_WIDTH - 120) boss.dir *= -1;
    if (boss.timer > 1) {
      boss.timer = 0;
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 120 });
      }
    }
  };

  const handleCollisions = () => {
    bullets.forEach((b) => {
      for (const e of enemies) {
        if (Math.hypot(b.x - e.x, b.y - e.y) < 16) {
          e.hp -= 1;
          b.y = -999;
          sfxHit();
          if (e.hp <= 0) {
            score += 80;
            maybeSpawnPowerup(e.x, e.y);
            sfxExplode();
            e.y = BASE_HEIGHT + 999;
          }
        }
      }
      if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < 30) {
        boss.hp -= 1;
        b.y = -999;
        sfxHit();
      if (boss.hp <= 0) {
        score += 800;
        boss = null;
        level += 1;
        player.weaponLevel = Math.min(5, player.weaponLevel + 1);
        levelTimer = 0;
        spawnWave();
      }
    }
  });

    enemyBullets.forEach((b) => {
      const hit = Math.hypot(b.x - player.x, b.y - player.y) < player.hitbox + 4;
      if (hit) {
        if (player.shield > 0) {
          player.shield = 0;
        } else if (player.invuln <= 0) {
          player.lives -= 1;
          player.invuln = 1.5;
          sfxExplode();
        }
        b.y = BASE_HEIGHT + 999;
      }
      const graze = Math.hypot(b.x - player.x, b.y - player.y) < 12;
      if (graze) grazeScore += 1;
    });
  };

  const updatePowerups = (dt) => {
    powerups.forEach((p) => {
      p.y += p.vy * dt;
    });
    powerups = powerups.filter((p) => p.y < BASE_HEIGHT + 30);

    powerups.forEach((p) => {
      if (Math.hypot(p.x - player.x, p.y - player.y) < 20) {
        sfxPower();
        if (p.type === "weapon") player.weaponLevel = Math.min(5, player.weaponLevel + 1);
        if (p.type === "shield") player.shield = 1;
        if (p.type === "missile") player.missiles += 2;
        if (p.type === "bomb") player.bombs = Math.min(3, player.bombs + 1);
        if (p.type === "slow") scrollSpeed = Math.max(20, scrollSpeed - 15);
        p.y = BASE_HEIGHT + 999;
      }
    });
  };

  const update = (dt) => {
    if (mode !== "playing") return;
    const diff = currentDifficulty();
    levelTimer += dt;
    scrollSpeed = 40 + level * 5;

    updateBackground(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateBullets(dt);
    updateEnemyBullets(dt);
    updatePowerups(dt);
    handleCollisions();

    player.invuln = Math.max(0, player.invuln - dt);
    shootCooldown = Math.max(0, shootCooldown - dt);

    if (keys.has("ArrowLeft") || keys.has("a")) player.x -= player.speed * dt;
    if (keys.has("ArrowRight") || keys.has("d")) player.x += player.speed * dt;
    if (keys.has("ArrowUp") || keys.has("w")) player.y -= player.speed * dt;
    if (keys.has("ArrowDown") || keys.has("s")) player.y += player.speed * dt;

    player.x = Math.max(20, Math.min(view.baseWidth - 20, player.x));
    player.y = Math.max(60, Math.min(view.baseHeight - 40, player.y));

    if (levelTimer > 24 && !boss) {
      spawnBoss();
      levelTimer = 0;
    }
    if (levelTimer > 6 && enemies.length < 3 && !boss) {
      spawnWave();
      levelTimer = 0;
      wave += 1;
    }

    if (player.lives <= 0) {
      mode = "gameover";
      audio.stopMusic();
      if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_KEY, String(highScore));
      }
      if (!scoreSubmitted) {
        submitFinalScore({
          board: getBoardIdForGame("spacefighter", "classic", "normal"),
          score,
          runMs: Math.floor(performance.now() - runStart),
        }).catch(() => {});
        scoreSubmitted = true;
      }
      scoreOverlay.refresh();
    }
  };

  const drawBackground = () => {
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    background.stars.forEach((s) => {
      ctx.fillStyle = "#243040";
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    background.midStars.forEach((s) => {
      ctx.fillStyle = "#2f4660";
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    background.planets.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawPlayer = () => {
    ctx.fillStyle = player.invuln > 0 ? "rgba(255,255,255,0.6)" : "#6ef0c4";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 12);
    ctx.lineTo(player.x - 10, player.y + 12);
    ctx.lineTo(player.x + 10, player.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#111318";
    ctx.beginPath();
    ctx.arc(player.x, player.y + 4, player.hitbox, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = () => {
    clear();
    drawBackground();

    enemies.forEach((e) => {
      ctx.fillStyle = e.type === "scout" ? "#ff6f91" : e.type === "bomber" ? "#ffd166" : e.type === "carrier" ? "#8ad1ff" : e.type === "elite" ? "#ff9f1c" : "#6ef0c4";
      ctx.fillRect(e.x - 10, e.y - 8, 20, 16);
    });

    if (boss) {
      ctx.fillStyle = "#ff6f91";
      ctx.fillRect(boss.x - 40, boss.y - 18, 80, 36);
      ctx.fillStyle = "#111318";
      ctx.fillRect(60, 40, 200, 6);
      ctx.fillStyle = "#ff6f91";
      ctx.fillRect(60, 40, (boss.hp / boss.maxHp) * 200, 6);
    }

    bullets.forEach((b) => {
      ctx.fillStyle = b.missile ? "#ffd166" : "#6ef0c4";
      ctx.fillRect(b.x - 2, b.y - 6, 4, 10);
    });
    enemyBullets.forEach((b) => {
      ctx.fillStyle = "#ff6f91";
      ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    });
    powerups.forEach((p) => {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
    });

    drawPlayer();

    ctx.fillStyle = "#e6edf6";
    ctx.font = "14px 'Avenir Next', sans-serif";
    ctx.fillText(`Score ${score}`, 12, 24);
    ctx.fillText(`High ${highScore}`, 140, 24);
    ctx.fillText(`Level ${level}`, 280, 24);
    ctx.fillText(`Lives ${player.lives}`, 380, 24);
    ctx.fillText(`Weapon ${player.weaponLevel}`, 470, 24);
    ctx.fillText(`Missiles ${player.missiles}`, 560, 24);

    if (mode === "intro") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Press Start", 260, 280);
      scoreOverlay.show("Top Scores", "Last 7 days");
    }

    if (mode === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Paused", 280, 280);
    }

    if (mode === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Game Over", 250, 260);
      ctx.font = "14px 'Avenir Next', sans-serif";
      ctx.fillText(`Score ${score}`, 280, 290);
      ctx.fillText("Press Start", 270, 320);
      scoreOverlay.show("Top Scores", "Last 7 days");
    }
    if (mode === "playing") {
      scoreOverlay.hide();
    }
  };

  const loop = createAppLoop(appId, {
    step: (dt) => update(dt),
    render: () => draw(),
    isActive: () => content.isConnected,
  });

  const startGame = () => {
    mode = "playing";
    runStart = performance.now();
    scoreSubmitted = false;
    scoreOverlay.hide();
    initBackground();
    spawnWave();
    audio.startMusic([262, 294, 330, 392], 0.18);
    updateStatus();
  };

  startButton.addEventListener(
    "click",
    () => {
      if (mode === "playing") return;
      resetState();
      startGame();
    },
    { signal }
  );

  const onKeyDown = (event) => {
    if (event.key === "p" || event.key === "P") {
      if (mode === "playing") mode = "paused";
      else if (mode === "paused") mode = "playing";
      return;
    }
    if (event.key === "r" || event.key === "R") {
      resetState();
      startGame();
      return;
    }
    if (event.key === " ") {
      firePlayer();
    }
    if (event.key === "m" || event.key === "M") {
      fireMissile();
    }
    keys.add(event.key.toLowerCase());
  };

  const onKeyUp = (event) => {
    keys.delete(event.key.toLowerCase());
  };

  document.addEventListener("keydown", onKeyDown, { signal });
  document.addEventListener("keyup", onKeyUp, { signal });

  loop.start();

  const destroy = () => {
    controller.abort();
    loop.stop();
    audio.stopMusic();
    audio.destroy();
  };

  osAPI?.registerAppMenu?.("spacefighter", {
    appName: "Spacefighter",
    menus: [
      {
        title: "Spacefighter",
        items: [
          { label: "Start", onClick: () => { if (mode !== "playing") { resetState(); startGame(); } } },
          { label: "Pause", onClick: () => { if (mode === "playing") mode = "paused"; } },
          { label: "Resume", onClick: () => { if (mode === "paused") mode = "playing"; } },
          { label: "Restart", onClick: () => { resetState(); startGame(); } },
          { label: "SFX", type: "checkbox", checked: settings.sfx, onToggle: (value) => { settings.sfx = value; audio.setSfxEnabled(value); localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } },
          { label: "Music", type: "checkbox", checked: settings.music, onToggle: (value) => { settings.music = value; audio.setMusicEnabled(value); localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } },
        ],
      },
    ],
  });

  const observer = new MutationObserver(() => {
    if (!wrapper.isConnected) {
      observer.disconnect();
      destroy();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const surface = {
    title: "Spacefighter",
    width: 720,
    height: 640,
    aspectRatio: BASE_WIDTH / BASE_HEIGHT,
    content: wrapper,
    onSuspend: () => {
      loop.suspend();
      audio.stopMusic();
    },
    onResume: () => {
      loop.resume();
      if (settings.music && mode === "playing") audio.startMusic([262, 294, 330, 392], 0.18);
    },
    reset: () => { resetState(); startGame(); },
    destroy,
  };

  return surface;
}

let instance;
export function init(container, appContext) {
  instance = createApp(appContext);
  container.appendChild(instance.content);
  return instance;
}
export function start() {
  instance?.onResume?.();
}
export function pause() {
  instance?.onSuspend?.();
}
export function resume() {
  instance?.onResume?.();
}
export function reset() {
  instance?.reset?.();
}
export function destroy() {
  instance?.destroy?.();
  instance = null;
}
