import { createGameSurface, startLoop } from "../daemonos-shared/gameUtils.js?v=1.0.0";
import { audioRegistry } from "../daemonos-shared/audioRegistry.js?v=1.0.0";
import { getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js?v=1.0.0";

const SETTINGS_KEY = "spacerocks_settings";
const HIGH_KEY = "spacerocks_highscore";

const BASE_WIDTH = 640;
const BASE_HEIGHT = 480;

const ASTEROID_SIZES = {
  3: { radius: 40, speed: 40, score: 20 },
  2: { radius: 24, speed: 65, score: 50 },
  1: { radius: 14, speed: 95, score: 100 },
};

const randomBetween = (min, max) => min + Math.random() * (max - min);

export function createApp() {
  const appId = "spacerocks";
  const controller = new AbortController();
  const { signal } = controller;

  const wrapper = document.createElement("div");
  wrapper.className = "spacerocks-app";

  const toolbar = document.createElement("div");
  toolbar.className = "game-toolbar";
  toolbar.classList.add("spacerocks-toolbar");
  const brand = document.createElement("div");
  brand.className = "spacerocks-brand";
  brand.innerHTML = "<i>△</i><span><small>Daemoncade classic</small><strong>Space Rocks!</strong></span>";
  const resetButton = document.createElement("button");
  resetButton.className = "menu-button";
  resetButton.textContent = "New game";

  const hyperspaceToggle = document.createElement("label");
  hyperspaceToggle.style.display = "inline-flex";
  hyperspaceToggle.style.alignItems = "center";
  hyperspaceToggle.style.gap = "6px";
  hyperspaceToggle.style.marginLeft = "8px";
  const hyperspaceInput = document.createElement("input");
  hyperspaceInput.type = "checkbox";
  const hyperspaceText = document.createElement("span");
  hyperspaceText.textContent = "Hyperspace";
  hyperspaceToggle.append(hyperspaceInput, hyperspaceText);

  const sfxToggle = document.createElement("label");
  sfxToggle.style.display = "inline-flex";
  sfxToggle.style.alignItems = "center";
  sfxToggle.style.gap = "6px";
  sfxToggle.style.marginLeft = "8px";
  const sfxInput = document.createElement("input");
  sfxInput.type = "checkbox";
  const sfxText = document.createElement("span");
  sfxText.textContent = "SFX";
  sfxToggle.append(sfxInput, sfxText);

  const status = document.createElement("div");
  status.className = "spacerocks-status";
  status.innerHTML = '<span><small>Score</small><b data-stat="score">000000</b></span><span><small>High</small><b data-stat="high">000000</b></span><span><small>Wave</small><b data-stat="level">01</b></span><span><small>Ships</small><b data-stat="lives">△ △ △</b></span>';
  const toolbarActions = document.createElement("div");
  toolbarActions.className = "spacerocks-actions";
  const settingsButton = document.createElement("button");
  settingsButton.className = "icon-button";
  settingsButton.type = "button";
  settingsButton.textContent = "⚙";
  settingsButton.setAttribute("aria-label", "Settings");
  const fullscreenButton = document.createElement("button");
  fullscreenButton.className = "icon-button";
  fullscreenButton.type = "button";
  fullscreenButton.textContent = "⛶";
  fullscreenButton.setAttribute("aria-label", "Fullscreen");
  toolbarActions.append(resetButton, settingsButton, fullscreenButton);
  toolbar.append(brand, status, toolbarActions);
  wrapper.appendChild(toolbar);

  const { content, ctx, view, resizeObserver, clear } = createGameSurface({
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    fit: "contain",
  });
  wrapper.appendChild(content);
  content.style.position = "relative";
  const screenOverlay = document.createElement("div");
  screenOverlay.className = "spacerocks-overlay";
  screenOverlay.innerHTML = '<section><p>Daemoncade vector division</p><h1>Space Rocks!</h1><div class="spacerocks-record" data-overlay-record></div><p class="spacerocks-overlay-copy" data-overlay-copy></p><button class="primary" type="button" data-overlay-action>Launch ship</button><small>Turn: A/D or ←/→ · Thrust: W or ↑ · Fire: Space · Hyperspace: H · Pause: P</small></section>';
  content.querySelector(".game-surface").appendChild(screenOverlay);
  const overlayTitle = screenOverlay.querySelector("h1");
  const overlayCopy = screenOverlay.querySelector("[data-overlay-copy]");
  const overlayRecord = screenOverlay.querySelector("[data-overlay-record]");
  const overlayAction = screenOverlay.querySelector("[data-overlay-action]");

  const settingsPanel = document.createElement("div");
  settingsPanel.className = "spacerocks-settings";
  settingsPanel.hidden = true;
  settingsPanel.innerHTML = '<section><button class="settings-close" type="button" aria-label="Close settings">×</button><p>Ship systems</p><h2>Settings</h2><div data-settings-controls></div><small>Hyperspace is powerful, unstable, and entirely optional.</small></section>';
  settingsPanel.querySelector("[data-settings-controls]").append(hyperspaceToggle, sfxToggle);
  content.appendChild(settingsPanel);

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored ? { hyperspace: true, sfx: true, ...JSON.parse(stored) } : { hyperspace: true, sfx: true };
  hyperspaceInput.checked = settings.hyperspace;
  sfxInput.checked = settings.sfx;

  const highKey = localStorage.getItem(HIGH_KEY);
  let highScore = highKey ? Number(highKey) : 0;
  const statScore = status.querySelector('[data-stat="score"]');
  const statHigh = status.querySelector('[data-stat="high"]');
  const statLevel = status.querySelector('[data-stat="level"]');
  const statLives = status.querySelector('[data-stat="lives"]');

  const ship = {
    x: view.baseWidth / 2,
    y: view.baseHeight / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    alive: false,
    invuln: 0,
    respawn: 0,
  };

  let lives = 3;
  let score = 0;
  let level = 1;
  let bullets = [];
  let asteroids = [];
  let particles = [];
  let ufo = null;
  let ufoCooldown = randomBetween(12, 20);
  let thrusting = false;
  let reverse = false;
  let turnLeft = false;
  let turnRight = false;
  let lastShot = 0;
  let state = "ready"; // ready | playing | paused | gameover
  let runStart = performance.now();
  let scoreSubmitted = false;

  const pewAudio = new Audio("./sfx/pew.mp3");
  const crashAudio = new Audio("./sfx/crash.mp3");
  const dieAudio = new Audio("./sfx/die.mp3");
  const levelAudio = new Audio("./sfx/levelup.mp3");
  const gameOverAudio = new Audio("./sfx/gameover.mp3");
  [pewAudio, crashAudio, dieAudio, levelAudio, gameOverAudio].forEach((audio) => {
    audio.preload = "auto";
    audioRegistry.registerMediaElement(appId, audio);
  });

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioRegistry.registerContext(appId, audioCtx);
  let thrustOsc = null;
  let thrustGain = null;

  const markAudioActive = (durationMs) => {
    audioRegistry.setAudioActive(appId, true);
    window.clearTimeout(markAudioActive.timer);
    markAudioActive.timer = window.setTimeout(() => audioRegistry.setAudioActive(appId, false), durationMs);
  };

  const playSfx = (audio) => {
    if (!settings.sfx) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    markAudioActive(400);
  };

  const startThrustSound = () => {
    if (!settings.sfx) return;
    if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustGain = audioCtx.createGain();
    thrustOsc.type = "sawtooth";
    thrustOsc.frequency.value = 140;
    thrustGain.gain.value = 0.05;
    thrustOsc.connect(thrustGain);
    thrustGain.connect(audioCtx.destination);
    thrustOsc.start();
  };

  const stopThrustSound = () => {
    if (!thrustOsc) return;
    try {
      thrustOsc.stop();
    } catch {
      // ignore
    }
    thrustOsc.disconnect();
    thrustGain.disconnect();
    thrustOsc = null;
    thrustGain = null;
  };

  const wrap = (obj) => {
    if (obj.x < 0) obj.x += view.baseWidth;
    if (obj.x > view.baseWidth) obj.x -= view.baseWidth;
    if (obj.y < 0) obj.y += view.baseHeight;
    if (obj.y > view.baseHeight) obj.y -= view.baseHeight;
  };

  const spawnAsteroid = (size = 3, x, y, dirVec) => {
    const data = ASTEROID_SIZES[size];
    const angle = dirVec ? Math.atan2(dirVec.y, dirVec.x) : Math.random() * Math.PI * 2;
    const speed = data.speed + Math.random() * 30;
    const points = Array.from({ length: 10 }, () => 0.7 + Math.random() * 0.4);
    asteroids.push({
      x: x ?? Math.random() * view.baseWidth,
      y: y ?? Math.random() * view.baseHeight,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      radius: data.radius,
      spin: (Math.random() - 0.5) * 1.4,
      rotation: Math.random() * Math.PI * 2,
      points,
    });
  };

  const safeSpawnPoint = () => {
    for (let i = 0; i < 50; i += 1) {
      const x = randomBetween(80, view.baseWidth - 80);
      const y = randomBetween(80, view.baseHeight - 80);
      const safe = asteroids.every((a) => {
        const dx = x - a.x;
        const dy = y - a.y;
        return dx * dx + dy * dy > (a.radius + 80) ** 2;
      });
      if (safe) return { x, y };
    }
    return { x: view.baseWidth / 2, y: view.baseHeight / 2 };
  };

  const spawnWave = () => {
    asteroids = [];
    const count = 3 + level;
    for (let i = 0; i < count; i += 1) {
      const pos = safeSpawnPoint();
      spawnAsteroid(3, pos.x, pos.y);
    }
  };

  const spawnUfo = () => {
    const fromLeft = Math.random() > 0.5;
    ufo = {
      x: fromLeft ? -40 : view.baseWidth + 40,
      y: 50,
      vx: fromLeft ? 70 : -70,
      fireTimer: 0,
    };
  };

  const spawnExplosion = (x, y, color = "#7bd5ff") => {
    for (let i = 0; i < 18; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(40, 140);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomBetween(0.4, 0.9),
        color,
      });
    }
  };

  const updateStatus = () => {
    statScore.textContent = String(score).padStart(6, "0");
    statHigh.textContent = String(Math.max(score, highScore)).padStart(6, "0");
    statLevel.textContent = String(level).padStart(2, "0");
    statLives.textContent = Array.from({ length: Math.max(0, lives) }, () => "△").join(" ") || "—";
  };

  const syncOverlay = () => {
    screenOverlay.hidden = state === "playing";
    if (state === "ready") {
      overlayTitle.textContent = "Space Rocks!";
      overlayCopy.textContent = "Clear each field, split the rocks, and survive the next wave.";
      overlayRecord.textContent = highScore ? `Local high score · ${String(highScore).padStart(6, "0")}` : "No local high score yet";
      overlayAction.textContent = "Launch ship";
    } else if (state === "paused") {
      overlayTitle.textContent = "Paused";
      overlayCopy.textContent = `Wave ${level} · ${String(score).padStart(6, "0")} points`;
      overlayRecord.textContent = "Ship systems holding";
      overlayAction.textContent = "Resume";
    } else if (state === "gameover") {
      overlayTitle.textContent = "Game over";
      overlayCopy.textContent = `Final score · ${String(score).padStart(6, "0")}`;
      overlayRecord.textContent = score >= highScore && score > 0 ? "New local high score" : `Local best · ${String(highScore).padStart(6, "0")}`;
      overlayAction.textContent = "Fly again";
    }
  };

  const reset = () => {
    lives = 3;
    score = 0;
    level = 1;
    bullets = [];
    asteroids = [];
    particles = [];
    ufo = null;
    ufoCooldown = randomBetween(12, 20);
    lastShot = 0;
    thrusting = false;
    reverse = false;
    turnLeft = false;
    turnRight = false;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    ship.invuln = 0;
    ship.respawn = 0;
    ship.alive = false;
    state = "ready";
    updateStatus();
    syncOverlay();
  };

  const startGame = () => {
    if (state === "playing") return;
    state = "playing";
    runStart = performance.now();
    scoreSubmitted = false;
    screenOverlay.hidden = true;
    lives = 3;
    score = 0;
    level = 1;
    bullets = [];
    particles = [];
    ship.alive = true;
    ship.invuln = 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    const spawn = safeSpawnPoint();
    ship.x = spawn.x;
    ship.y = spawn.y;
    spawnWave();
    updateStatus();
  };

  const fireBullet = (time) => {
    if (!ship.alive || state !== "playing") return;
    if (time - lastShot < 220) return;
    lastShot = time;
    const speed = 320;
    bullets.push({
      x: ship.x + Math.cos(ship.angle) * 16,
      y: ship.y + Math.sin(ship.angle) * 16,
      vx: Math.cos(ship.angle) * speed + ship.vx,
      vy: Math.sin(ship.angle) * speed + ship.vy,
      life: 1.2,
    });
    playSfx(pewAudio);
  };

  const hyperspace = () => {
    if (!settings.hyperspace || !ship.alive || state !== "playing") return;
    const risk = Math.random();
    if (risk < 0.15) {
      lives -= 1;
      spawnExplosion(ship.x, ship.y, "#ff6f91");
      playSfx(dieAudio);
      if (lives <= 0) {
        ship.alive = false;
        state = "gameover";
        playSfx(gameOverAudio);
        if (score > highScore) {
          highScore = score;
          localStorage.setItem(HIGH_KEY, String(highScore));
        }
        syncOverlay();
      }
    } else {
      const spawn = safeSpawnPoint();
      ship.x = spawn.x;
      ship.y = spawn.y;
      ship.vx = 0;
      ship.vy = 0;
      ship.invuln = 1.2;
    }
  };

  const step = (dt) => {
    if (state !== "playing") {
      stopThrustSound();
      if (state === "gameover" && !scoreSubmitted) {
        submitFinalScore({
          board: getBoardIdForGame("spacerocks", "classic", "normal"),
          score,
          runMs: Math.floor(performance.now() - runStart),
        }).catch(() => {});
        scoreSubmitted = true;
        syncOverlay();
      }
      return;
    }
    const levelSpeed = 1 + (level - 1) * 0.08;

    if (thrusting && ship.alive) startThrustSound();
    else stopThrustSound();

    if (ship.alive) {
      if (turnLeft) ship.angle -= 3 * dt;
      if (turnRight) ship.angle += 3 * dt;
      if (thrusting) {
        ship.vx += Math.cos(ship.angle) * 140 * dt;
        ship.vy += Math.sin(ship.angle) * 140 * dt;
      }
      if (reverse) {
        ship.vx -= Math.cos(ship.angle) * 80 * dt;
        ship.vy -= Math.sin(ship.angle) * 80 * dt;
      }
      ship.vx *= 0.992;
      ship.vy *= 0.992;
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      wrap(ship);
      if (ship.invuln > 0) ship.invuln = Math.max(0, ship.invuln - dt);
    } else if (ship.respawn > 0) {
      ship.respawn = Math.max(0, ship.respawn - dt);
      if (ship.respawn === 0 && lives > 0) {
        const spawn = safeSpawnPoint();
        ship.x = spawn.x;
        ship.y = spawn.y;
        ship.vx = 0;
        ship.vy = 0;
        ship.alive = true;
        ship.invuln = 2;
      }
    }

    bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      wrap(b);
    });
    bullets = bullets.filter((b) => b.life > 0);

    asteroids.forEach((a) => {
      a.x += a.vx * dt * levelSpeed;
      a.y += a.vy * dt * levelSpeed;
      a.rotation += a.spin * dt;
      wrap(a);
    });

    particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0);

    ufoCooldown -= dt;
    if (!ufo && ufoCooldown <= 0) {
      spawnUfo();
      ufoCooldown = randomBetween(12, 25);
    }
    if (ufo) {
      ufo.x += ufo.vx * dt * levelSpeed;
      ufo.fireTimer += dt;
      if (ufo.fireTimer > 1.6) {
        ufo.fireTimer = 0;
        const dx = ship.x - ufo.x;
        const dy = ship.y - ufo.y;
        const len = Math.hypot(dx, dy) || 1;
        bullets.push({
          x: ufo.x,
          y: ufo.y,
          vx: (dx / len) * 160,
          vy: (dy / len) * 160,
          life: 1.4,
          enemy: true,
        });
      }
      if (ufo.x < -60 || ufo.x > view.baseWidth + 60) ufo = null;
    }

    bullets.forEach((b) => {
      if (b.enemy) return;
      asteroids.forEach((a) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy < a.radius * a.radius) {
          b.life = 0;
          a.hit = true;
          a.hitVector = { x: b.vx, y: b.vy };
          score += ASTEROID_SIZES[a.size].score;
          playSfx(crashAudio);
          spawnExplosion(a.x, a.y, "#7bd5ff");
        }
      });
      if (ufo) {
        const dx = b.x - ufo.x;
        const dy = b.y - ufo.y;
        if (dx * dx + dy * dy < 18 ** 2) {
          b.life = 0;
          score += 200;
          spawnExplosion(ufo.x, ufo.y, "#ffd166");
          playSfx(crashAudio);
          ufo = null;
        }
      }
    });

    asteroids = asteroids.flatMap((a) => {
      if (!a.hit) return [a];
      if (a.size > 1) {
        const newSize = a.size - 1;
        const newRadius = ASTEROID_SIZES[newSize].radius;
        const vec = a.hitVector || { x: a.vx, y: a.vy };
        const len = Math.hypot(vec.x, vec.y) || 1;
        const dir = { x: vec.x / len, y: vec.y / len };
        const perp = { x: -dir.y, y: dir.x };
        const speed = ASTEROID_SIZES[newSize].speed + 40;
        const offset = newRadius * 0.6;
        return [
          {
            x: a.x + perp.x * offset,
            y: a.y + perp.y * offset,
            vx: dir.x * speed + perp.x * 50,
            vy: dir.y * speed + perp.y * 50,
            size: newSize,
            radius: newRadius,
            spin: (Math.random() - 0.5) * 1.4,
            rotation: Math.random() * Math.PI * 2,
            points: Array.from({ length: 10 }, () => 0.7 + Math.random() * 0.4),
          },
          {
            x: a.x - perp.x * offset,
            y: a.y - perp.y * offset,
            vx: dir.x * speed - perp.x * 50,
            vy: dir.y * speed - perp.y * 50,
            size: newSize,
            radius: newRadius,
            spin: (Math.random() - 0.5) * 1.4,
            rotation: Math.random() * Math.PI * 2,
            points: Array.from({ length: 10 }, () => 0.7 + Math.random() * 0.4),
          },
        ];
      }
      return [];
    });

    if (ship.alive && ship.invuln <= 0) {
      asteroids.forEach((a) => {
        const dx = ship.x - a.x;
        const dy = ship.y - a.y;
        if (dx * dx + dy * dy < (a.radius + 10) ** 2) {
          lives -= 1;
          ship.alive = false;
          ship.respawn = 1.4;
          ship.invuln = 0;
          spawnExplosion(ship.x, ship.y, "#ff6f91");
          playSfx(dieAudio);
          if (lives <= 0) {
            state = "gameover";
            playSfx(gameOverAudio);
            if (score > highScore) {
              highScore = score;
              localStorage.setItem(HIGH_KEY, String(highScore));
            }
            syncOverlay();
          }
        }
      });
    }

    bullets.forEach((b) => {
      if (!b.enemy || !ship.alive || ship.invuln > 0) return;
      const dx = b.x - ship.x;
      const dy = b.y - ship.y;
      if (dx * dx + dy * dy < 12 ** 2) {
        b.life = 0;
        lives -= 1;
        ship.alive = false;
        ship.respawn = 1.4;
        spawnExplosion(ship.x, ship.y, "#ff6f91");
        playSfx(dieAudio);
        if (lives <= 0) {
          state = "gameover";
          playSfx(gameOverAudio);
          if (score > highScore) {
            highScore = score;
            localStorage.setItem(HIGH_KEY, String(highScore));
          }
          syncOverlay();
        }
      }
    });

    if (asteroids.length === 0 && state === "playing") {
      level += 1;
      spawnWave();
      playSfx(levelAudio);
    }

    updateStatus();
  };

  const drawShip = () => {
    if (!ship.alive) return;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = ship.invuln > 0 ? "rgba(123,213,255,0.6)" : "#e6edf6";
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  const draw = () => {
    clear();
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, view.baseWidth, view.baseHeight);
    ctx.strokeStyle = "#7bd5ff";
    ctx.lineWidth = 1.5;

    asteroids.forEach((a) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI * 2 * i) / 10;
        const r = a.radius * (a.points?.[i] ?? 0.85);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });

    if (ufo) {
      ctx.strokeStyle = "#ffd166";
      ctx.beginPath();
      ctx.moveTo(ufo.x - 16, ufo.y);
      ctx.lineTo(ufo.x + 16, ufo.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ufo.x, ufo.y, 10, Math.PI, 0);
      ctx.stroke();
    }

    bullets.forEach((b) => {
      ctx.fillStyle = b.enemy ? "#ff6f91" : "#ffd166";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    drawShip();

    particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / 0.9);
      ctx.fillRect(p.x, p.y, 2, 2);
      ctx.globalAlpha = 1;
    });

  };

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "arrowup" || key === "w") thrusting = true;
    if (key === "arrowdown" || key === "s") reverse = true;
    if (key === "arrowleft" || key === "a") turnLeft = true;
    if (key === "arrowright" || key === "d") turnRight = true;
    if (event.key === " " && ship.alive) fireBullet(performance.now());
    if (key === "r") reset();
    if (key === "h") hyperspace();
    if (key === "enter") startGame();
    if (key === "p" && (state === "playing" || state === "paused")) {
      state = state === "playing" ? "paused" : "playing";
      syncOverlay();
    }
  }, { signal });

  document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (key === "arrowup" || key === "w") thrusting = false;
    if (key === "arrowdown" || key === "s") reverse = false;
    if (key === "arrowleft" || key === "a") turnLeft = false;
    if (key === "arrowright" || key === "d") turnRight = false;
  }, { signal });

  resetButton.addEventListener("click", () => {
    reset();
    startGame();
  }, { signal });

  overlayAction.addEventListener("click", () => {
    if (state === "paused") {
      state = "playing";
      syncOverlay();
    } else {
      startGame();
    }
  }, { signal });

  settingsButton.addEventListener("click", () => {
    settingsPanel.hidden = false;
  }, { signal });

  settingsPanel.querySelector(".settings-close").addEventListener("click", () => {
    settingsPanel.hidden = true;
  }, { signal });

  settingsPanel.addEventListener("click", (event) => {
    if (event.target === settingsPanel) settingsPanel.hidden = true;
  }, { signal });

  fullscreenButton.addEventListener("click", () => {
    window.parent.postMessage({ type: "daemoncade:request-fullscreen" }, window.location.origin);
  }, { signal });

  hyperspaceInput.addEventListener("change", () => {
    settings.hyperspace = hyperspaceInput.checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, { signal });

  sfxInput.addEventListener("change", () => {
    settings.sfx = sfxInput.checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (!settings.sfx) stopThrustSound();
  }, { signal });

  const stopLoop = startLoop({
    step,
    render: draw,
    isActive: () => content.isConnected,
  });

  const observer = new MutationObserver(() => {
    if (!content.isConnected) {
      observer.disconnect();
      controller.abort();
      resizeObserver.disconnect();
      stopLoop();
      stopThrustSound();
      if (markAudioActive.timer) clearTimeout(markAudioActive.timer);
      audioRegistry.clear(appId);
      [pewAudio, crashAudio, dieAudio, levelAudio, gameOverAudio].forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      audioCtx.close().catch(() => {});
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  reset();

  return {
    title: "Space Rocks!",
    width: 640,
    height: 520,
    aspectRatio: view.baseWidth / view.baseHeight,
    content: wrapper,
    onSuspend: () => {
      stopThrustSound();
    },
    onResume: () => {
      // no-op
    },
    freeOptionalCaches: () => {
      particles = [];
      bullets = [];
    },
  };
}
