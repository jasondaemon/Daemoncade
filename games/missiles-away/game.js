import { createGameSurface, startLoop } from "../daemonos-shared/gameUtils.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";
import { createRetroAudio } from "../daemonos-shared/retroAudio.js";

const SETTINGS_KEY = "missilesaway_settings";
const HIGH_KEY = "missilesaway_highscore";

export function createApp(osAPI) {
  const BASE_W = 720;
  const BASE_H = 520;
  const { content, ctx, clear } = createGameSurface({
    baseWidth: BASE_W,
    baseHeight: BASE_H,
    className: "game-canvas",
    fit: "contain",
  });
  content.style.position = "relative";
  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("missilesaway", "classic", "normal"),
    windowDays: 7,
    limit: 5,
  });
  scoreOverlay.refresh();

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored
    ? {
        music: true,
        sfx: true,
        control: "mouse",
        difficulty: "normal",
        ...JSON.parse(stored),
      }
    : { music: true, sfx: true, control: "mouse", difficulty: "normal" };

  const audio = createRetroAudio({
    musicOn: settings.music,
    sfxOn: settings.sfx,
    musicVolume: 0.35,
    sfxVolume: 0.6,
  });

  const silos = [
    { x: 120, ammo: 10, alive: true },
    { x: 360, ammo: 10, alive: true },
    { x: 600, ammo: 10, alive: true },
  ];
  const cities = [
    { x: 80, alive: true },
    { x: 180, alive: true },
    { x: 280, alive: true },
    { x: 440, alive: true },
    { x: 540, alive: true },
    { x: 640, alive: true },
  ];

  let missiles = [];
  let bombers = [];
  let playerMissiles = [];
  let explosions = [];
  let score = 0;
  let highScore = Number(localStorage.getItem(HIGH_KEY)) || 0;
  let wave = 1;
  let state = "start";
  let waveState = "intro";
  let waveBudget = 0;
  let runStart = performance.now();
  let scoreSubmitted = false;
  let spawnTimer = 0;
  let intermission = 0;
  let cursor = { x: BASE_W / 2, y: BASE_H / 2 };
  let cursorVel = { x: 0, y: 0 };

  const diffParams = () => {
    if (settings.difficulty === "easy") {
      return { spawnRate: 0.95, speed: 0.85, smartChance: 0.04, mirvChance: 0.1 };
    }
    if (settings.difficulty === "hard") {
      return { spawnRate: 0.65, speed: 1.15, smartChance: 0.12, mirvChance: 0.25 };
    }
    return { spawnRate: 0.8, speed: 1, smartChance: 0.08, mirvChance: 0.16 };
  };

  const missileSpeedScale = () => 0.25 * Math.pow(1.1, Math.max(0, wave - 1));

  const resetWave = () => {
    missiles = [];
    bombers = [];
    playerMissiles = [];
    explosions = [];
    silos.forEach((s) => {
      s.ammo = 10;
      s.alive = true;
    });
    spawnTimer = 0;
    waveState = "intro";
    intermission = 1.2;
    waveBudget = Math.floor(14 + wave * 4);
  };

  const reset = () => {
    wave = 1;
    score = 0;
    cities.forEach((c) => (c.alive = true));
    resetWave();
    state = "playing";
    runStart = performance.now();
    scoreSubmitted = false;
    scoreOverlay.hide();
    audio.startMusic([196, 247, 220, 262], 0.25);
  };

  const aliveCities = () => cities.filter((c) => c.alive);

  const launchPlayer = (targetX, targetY) => {
    const aliveSilos = silos.filter((s) => s.ammo > 0 && s.alive);
    if (!aliveSilos.length) return;
    const silo = aliveSilos.reduce((best, s) =>
      Math.abs(s.x - targetX) < Math.abs(best.x - targetX) ? s : best
    );
    silo.ammo -= 1;
    playerMissiles.push({
      sx: silo.x,
      sy: BASE_H - 28,
      tx: targetX,
      ty: targetY,
      t: 0,
      travel: 0.45,
    });
    audio.playTone({ freq: 540, duration: 0.05 });
  };

  const spawnMissile = (type = "normal") => {
    const targets = aliveCities();
    if (!targets.length) return;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const startX = Math.random() * BASE_W;
    const baseTravel = 2.4 - Math.min(1.1, wave * 0.06);
    const { speed } = diffParams();
    const scale = missileSpeedScale();
    missiles.push({
      sx: startX,
      sy: -10,
      x: startX,
      y: -10,
      tx: target.x,
      ty: BASE_H - 42,
      t: 0,
      travel: Math.max(1.1, baseTravel) / (speed * scale),
      type,
      split: false,
    });
  };

  const spawnBomber = () => {
    const dir = Math.random() < 0.5 ? 1 : -1;
    bombers.push({
      x: dir > 0 ? -30 : BASE_W + 30,
      y: 70 + Math.random() * 80,
      dir,
      speed: 40 + wave * 4,
      dropTimer: 0,
    });
  };

  const updateEnemyMissiles = (dt) => {
    missiles.forEach((m) => {
      m.t += dt / m.travel;
      if (m.t > 1) m.t = 1;
      m.x = m.sx + (m.tx - m.sx) * m.t;
      m.y = m.sy + (m.ty - m.sy) * m.t;
      if (m.type === "mirv" && !m.split && m.t > 0.55) {
        m.split = true;
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i += 1) {
          const targets = aliveCities();
          if (!targets.length) break;
          const target = targets[Math.floor(Math.random() * targets.length)];
          missiles.push({
            sx: m.x,
            sy: m.y,
            x: m.x,
            y: m.y,
            tx: target.x + (Math.random() * 40 - 20),
            ty: BASE_H - 42,
            t: 0,
            travel: Math.max(0.8, m.travel * 0.65),
            type: "normal",
            split: true,
          });
        }
        m.t = 1;
      }
    });

    for (let i = missiles.length - 1; i >= 0; i -= 1) {
      const m = missiles[i];
      if (m.t >= 1) {
        missiles.splice(i, 1);
        const hitCity = cities.find((c) => c.alive && Math.abs(c.x - m.tx) < 26);
        if (hitCity) hitCity.alive = false;
        const hitSilo = silos.find((s) => s.alive && Math.abs(s.x - m.tx) < 26);
        if (hitSilo) {
          hitSilo.alive = false;
          hitSilo.ammo = 0;
        }
      }
    }
  };

  const updateBombers = (dt) => {
    const { mirvChance } = diffParams();
    bombers.forEach((b) => {
      b.x += b.dir * b.speed * dt;
      b.dropTimer += dt;
      if (b.dropTimer > 1.2) {
        b.dropTimer = 0;
        if (Math.random() < mirvChance) {
          spawnMissile("mirv");
        } else {
          spawnMissile("normal");
        }
      }
    });
    bombers = bombers.filter((b) => b.x > -80 && b.x < BASE_W + 80);
  };

  const updatePlayerMissiles = (dt) => {
    playerMissiles.forEach((m) => {
      m.t += dt / m.travel;
      if (m.t > 1) m.t = 1;
      m.x = m.sx + (m.tx - m.sx) * m.t;
      m.y = m.sy + (m.ty - m.sy) * m.t;
      if (m.t >= 1) {
        explosions.push({ x: m.tx, y: m.ty, t: 0, duration: 0.7, max: 60 });
      }
    });
    playerMissiles = playerMissiles.filter((m) => m.t < 1);
  };

  const updateExplosions = (dt) => {
    explosions.forEach((e) => {
      e.t += dt;
    });
    explosions = explosions.filter((e) => e.t < e.duration);
  };

  const explosionRadius = (e) => {
    const half = e.duration * 0.45;
    if (e.t <= half) return (e.t / half) * e.max;
    return e.max * (1 - (e.t - half) / (e.duration - half));
  };

  const handleExplosions = () => {
    for (let i = missiles.length - 1; i >= 0; i -= 1) {
      const m = missiles[i];
      const hit = explosions.some((e) => {
        const r = explosionRadius(e) * (m.type === "smart" ? 0.75 : 1);
        return Math.hypot(m.x - e.x, m.y - e.y) < r;
      });
      if (hit) {
        missiles.splice(i, 1);
        score += m.type === "smart" ? 75 : 25;
        audio.playNoise({ duration: 0.05 });
      }
    }
  };

  const updateWave = (dt) => {
    if (waveState === "intro") {
      intermission -= dt;
      if (intermission <= 0) waveState = "active";
      return;
    }
    if (waveState === "active") {
      const { spawnRate, mirvChance, smartChance } = diffParams();
      spawnTimer += dt;
      const spawnInterval = Math.max(0.25, (0.95 - wave * 0.03) * spawnRate);
      if (spawnTimer >= spawnInterval && waveBudget > 0) {
        spawnTimer = 0;
        const roll = Math.random();
        const type = roll < smartChance ? "smart" : roll < smartChance + mirvChance ? "mirv" : "normal";
        spawnMissile(type);
        waveBudget -= 1;
      }
      if (wave > 2 && Math.random() < 0.015 && bombers.length < 1) {
        spawnBomber();
      }
      if (waveBudget === 0 && missiles.length === 0 && bombers.length === 0 && explosions.length === 0 && playerMissiles.length === 0) {
        waveState = "bonus";
        intermission = 2.2;
        const citiesAlive = aliveCities().length;
        const ammoLeft = silos.reduce((sum, s) => sum + s.ammo, 0);
        score += citiesAlive * 100 + ammoLeft * 5;
        audio.playTone({ freq: 720, duration: 0.12, gain: 0.5 });
      }
      return;
    }
    if (waveState === "bonus") {
      intermission -= dt;
      if (intermission <= 0) {
        wave += 1;
        resetWave();
      }
    }
  };

  const step = (dt) => {
    if (state !== "playing") return;
    updateWave(dt);
    updateEnemyMissiles(dt);
    updateBombers(dt);
    updatePlayerMissiles(dt);
    updateExplosions(dt);
    handleExplosions();

    if (!aliveCities().length) {
      state = "gameover";
      audio.stopMusic();
      if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_KEY, String(highScore));
      }
      if (!scoreSubmitted) {
        submitFinalScore({
          board: getBoardIdForGame("missilesaway", "classic", "normal"),
          score,
          runMs: Math.floor(performance.now() - runStart),
        }).catch(() => {});
        scoreSubmitted = true;
      }
      scoreOverlay.refresh();
    }

    cursor.x += cursorVel.x * dt;
    cursor.y += cursorVel.y * dt;
    cursor.x = Math.max(20, Math.min(BASE_W - 20, cursor.x));
    cursor.y = Math.max(40, Math.min(BASE_H - 80, cursor.y));
  };

  const drawCrosshair = () => {
    ctx.strokeStyle = "#8fd7ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cursor.x - 8, cursor.y);
    ctx.lineTo(cursor.x + 8, cursor.y);
    ctx.moveTo(cursor.x, cursor.y - 8);
    ctx.lineTo(cursor.x, cursor.y + 8);
    ctx.stroke();
  };

  const draw = () => {
    clear();
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    ctx.fillStyle = "#1d2a38";
    ctx.fillRect(0, BASE_H - 62, BASE_W, 62);

    cities.forEach((c) => {
      ctx.fillStyle = c.alive ? "#6ef0c4" : "#3b4656";
      ctx.fillRect(c.x - 18, BASE_H - 40, 36, 20);
    });

    silos.forEach((s) => {
      ctx.fillStyle = s.alive ? "#ffd166" : "#5c3b2c";
      ctx.fillRect(s.x - 20, BASE_H - 30, 40, 12);
      ctx.fillStyle = "#e6edf6";
      ctx.font = "12px 'Avenir Next', sans-serif";
      ctx.fillText(`${s.ammo}`, s.x - 6, BASE_H - 36);
    });

    missiles.forEach((m) => {
      ctx.strokeStyle = m.type === "smart" ? "#ff9f1c" : m.type === "mirv" ? "#ff6f91" : "#f2f6ff";
      ctx.beginPath();
      ctx.moveTo(m.sx, m.sy);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(m.x - 2, m.y - 2, 4, 4);
    });

    bombers.forEach((b) => {
      ctx.fillStyle = "#8ad1ff";
      ctx.fillRect(b.x - 14, b.y - 6, 28, 12);
    });

    playerMissiles.forEach((m) => {
      ctx.strokeStyle = "#6ad2ff";
      ctx.beginPath();
      ctx.moveTo(m.sx, m.sy);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
    });

    explosions.forEach((e) => {
      const r = explosionRadius(e);
      ctx.strokeStyle = "rgba(255,214,102,0.9)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    drawCrosshair();

    ctx.fillStyle = "#e6edf6";
    ctx.font = "14px 'Avenir Next', sans-serif";
    ctx.fillText(`Score ${score}`, 12, 24);
    ctx.fillText(`High ${highScore}`, 140, 24);
    ctx.fillText(`Wave ${wave}`, 280, 24);

    if (waveState === "bonus") {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "18px 'Avenir Next', sans-serif";
      ctx.fillText("Wave Complete", 275, 240);
    }

    if (state === "start") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Press Enter", 280, 260);
      ctx.font = "12px 'Avenir Next', sans-serif";
      ctx.fillText("Mouse aim + click or arrows + space", 230, 285);
      scoreOverlay.show("Top Scores", "Last 7 days");
    }

    if (state === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Game Over", 280, 250);
      ctx.font = "14px 'Avenir Next', sans-serif";
      ctx.fillText(`Score ${score}`, 300, 280);
      scoreOverlay.show("Top Scores", "Last 7 days");
    }
    if (state === "playing") {
      scoreOverlay.hide();
    }
  };

  const onMouseMove = (event) => {
    if (settings.control !== "mouse") return;
    const rect = ctx.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    cursor = {
      x: (localX / rect.width) * BASE_W,
      y: (localY / rect.height) * BASE_H,
    };
  };

  const onClick = (event) => {
    if (state !== "playing") return;
    if (settings.control !== "mouse") return;
    const rect = ctx.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const x = (localX / rect.width) * BASE_W;
    const y = (localY / rect.height) * BASE_H;
    launchPlayer(x, y);
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      if (state !== "playing") reset();
      return;
    }
    if (settings.control !== "keys" || state !== "playing") return;
    if (event.key === "ArrowLeft") cursorVel.x = -180;
    if (event.key === "ArrowRight") cursorVel.x = 180;
    if (event.key === "ArrowUp") cursorVel.y = -180;
    if (event.key === "ArrowDown") cursorVel.y = 180;
    if (event.key === " ") launchPlayer(cursor.x, cursor.y);
  };

  const onKeyUp = (event) => {
    if (settings.control !== "keys" || state !== "playing") return;
    if (event.key === "ArrowLeft" && cursorVel.x < 0) cursorVel.x = 0;
    if (event.key === "ArrowRight" && cursorVel.x > 0) cursorVel.x = 0;
    if (event.key === "ArrowUp" && cursorVel.y < 0) cursorVel.y = 0;
    if (event.key === "ArrowDown" && cursorVel.y > 0) cursorVel.y = 0;
  };

  content.addEventListener("mousemove", onMouseMove);
  content.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  let stopLoop = startLoop({ step, render: draw, isActive: () => content.isConnected });

  const destroy = () => {
    content.removeEventListener("mousemove", onMouseMove);
    content.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    stopLoop?.();
    audio.destroy();
  };

  const observer = new MutationObserver(() => {
    if (!content.isConnected) {
      observer.disconnect();
      destroy();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  osAPI?.registerAppMenu?.("missilesaway", {
    appName: "Missiles Away",
    menus: [
      {
        title: "Missiles Away",
        items: [
          { label: "Reset", onClick: reset },
          {
            label: "Control Mode",
            type: "submenu",
            items: [
              {
                label: "Mouse",
                type: "radio",
                checked: settings.control === "mouse",
                onToggle: () => {
                  settings.control = "mouse";
                  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
                },
              },
              {
                label: "Keyboard",
                type: "radio",
                checked: settings.control === "keys",
                onToggle: () => {
                  settings.control = "keys";
                  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
                },
              },
            ],
          },
          {
            label: "Difficulty: Easy",
            type: "radio",
            checked: settings.difficulty === "easy",
            onToggle: () => {
              settings.difficulty = "easy";
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            },
          },
          {
            label: "Difficulty: Normal",
            type: "radio",
            checked: settings.difficulty === "normal",
            onToggle: () => {
              settings.difficulty = "normal";
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            },
          },
          {
            label: "Difficulty: Hard",
            type: "radio",
            checked: settings.difficulty === "hard",
            onToggle: () => {
              settings.difficulty = "hard";
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            },
          },
          {
            label: "SFX",
            type: "checkbox",
            checked: settings.sfx,
            onToggle: (value) => {
              settings.sfx = value;
              audio.setSfxEnabled(value);
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            },
          },
          {
            label: "Music",
            type: "checkbox",
            checked: settings.music,
            onToggle: (value) => {
              settings.music = value;
              audio.setMusicEnabled(value);
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
              if (settings.music && state === "playing") audio.startMusic([196, 247, 220, 262], 0.25);
            },
          },
        ],
      },
    ],
  });

  return {
    title: "Missiles Away",
    width: 760,
    height: 560,
    aspectRatio: BASE_W / BASE_H,
    content,
    onSuspend: () => {
      stopLoop?.();
      audio.stopMusic();
    },
    onResume: () => {
      stopLoop = startLoop({ step, render: draw, isActive: () => content.isConnected });
      if (settings.music && state === "playing") audio.startMusic([196, 247, 220, 262], 0.25);
    },
    reset,
    destroy,
  };
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
