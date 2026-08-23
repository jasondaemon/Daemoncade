import { createGameSurface, startLoop } from "../daemonos-shared/gameUtils.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";
import { createRetroAudio } from "../daemonos-shared/retroAudio.js";

const SETTINGS_KEY = "chilopodophobia_settings";
const HIGH_KEY = "chilopodophobia_highscore";

export function createApp(osAPI) {
  const BASE_W = 640;
  const BASE_H = 720;
  const TILE = 16;
  const COLS = Math.floor(BASE_W / TILE);
  const ROWS = Math.floor(BASE_H / TILE);
  const PLAYER_ZONE = ROWS - 6;

  const { content, ctx, clear } = createGameSurface({
    baseWidth: BASE_W,
    baseHeight: BASE_H,
    className: "game-canvas",
    fit: "contain",
  });
  content.style.position = "relative";
  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("chilopodophobia", "classic", "normal"),
    windowDays: 7,
    limit: 5,
  });
  scoreOverlay.refresh();

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored
    ? { music: true, sfx: true, control: "keys", difficulty: "normal", ...JSON.parse(stored) }
    : { music: true, sfx: true, control: "keys", difficulty: "normal" };
  const audio = createRetroAudio({ musicOn: settings.music, sfxOn: settings.sfx, musicVolume: 0.35, sfxVolume: 0.65 });

  let score = 0;
  let highScore = Number(localStorage.getItem(HIGH_KEY)) || 0;
  let lives = 3;
  let level = 1;
  let state = "start";
  let runStart = performance.now();
  let scoreSubmitted = false;

  const mushrooms = new Map();
  const centipedes = [];
  const bullets = [];
  const enemies = { flea: null, spider: null, scorpion: null };
  let spiderCooldown = 0;
  let extraLifeAt = 10000;
  let centiTimer = 0;

  const spawnMushrooms = () => {
    mushrooms.clear();
    const count = 38 + level * 2;
    for (let i = 0; i < count; i += 1) {
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * (PLAYER_ZONE - 2)) + 1;
      mushrooms.set(`${x},${y}`, { hp: 4, poisoned: false });
    }
  };

  const spawnCentipede = (length = 12) => {
    const segments = [];
    for (let i = 0; i < length; i += 1) {
      segments.push({ x: i, y: 0, dir: 1, isHead: i === 0, poisoned: false });
    }
    centipedes.push({ segments, dir: 1, poisoned: false });
  };

  const resetLevel = () => {
    bullets.length = 0;
    centipedes.length = 0;
    enemies.flea = null;
    enemies.spider = null;
    enemies.scorpion = null;
    spiderCooldown = Math.random() * 30;
    spawnMushrooms();
    spawnCentipede(10 + Math.min(6, level));
  };

  const reset = () => {
    score = 0;
    lives = 3;
    level = 1;
    extraLifeAt = 10000;
    state = "playing";
    runStart = performance.now();
    scoreSubmitted = false;
    resetLevel();
    audio.startMusic([220, 262, 196, 247], 0.2);
  };

  const player = { x: Math.floor(COLS / 2), y: ROWS - 2 };
  const input = { left: false, right: false, up: false, down: false, fire: false };
  let moveTimer = 0;
  const moveRate = 0.08;

  const addScore = (points) => {
    score += points;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HIGH_KEY, String(highScore));
    }
    if (score >= extraLifeAt) {
      lives += 1;
      extraLifeAt += 10000;
    }
  };

  const canMove = (x, y) => x >= 0 && x < COLS && y >= PLAYER_ZONE && y < ROWS;

  const movePlayer = (dx, dy) => {
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (canMove(nx, ny)) {
      player.x = nx;
      player.y = ny;
    }
  };

  const onMouseMove = (event) => {
    if (settings.control !== "mouse" || state !== "playing") return;
    const rect = content.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) * BASE_W) / rect.width / TILE);
    const y = Math.floor(((event.clientY - rect.top) * BASE_H) / rect.height / TILE);
    if (canMove(x, y)) {
      player.x = x;
      player.y = y;
    }
  };

  const fire = () => {
    if (bullets.length > 0) return;
    bullets.push({ x: player.x, y: player.y - 1 });
    audio.playTone({ freq: 680, duration: 0.05 });
  };

  const updateBullets = () => {
    bullets.forEach((b) => {
      b.y -= 1;
    });
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      if (b.y < 0) bullets.splice(i, 1);
    }
  };

  const hitMushroom = (x, y) => {
    const key = `${x},${y}`;
    const m = mushrooms.get(key);
    if (!m) return false;
    m.hp -= 1;
    if (m.hp <= 0) mushrooms.delete(key);
    return true;
  };

  const splitCentipede = (centi, index) => {
    const removed = centi.segments.splice(index, 1)[0];
    addScore(10);
    if (removed) {
      mushrooms.set(`${removed.x},${removed.y}`, { hp: 4, poisoned: false });
    }
    if (centi.segments.length === 0) return;
    if (index < centi.segments.length) {
      const tail = centi.segments.splice(index);
      if (tail.length > 0) {
        centipedes.push({ segments: tail, dir: tail[0].dir, poisoned: false });
        tail[0].isHead = true;
      }
    }
    if (centi.segments[0]) centi.segments[0].isHead = true;
  };

  const updateCentipedes = () => {
    centipedes.forEach((centi) => {
      const head = centi.segments[0];
      let moveDown = false;
      let nextX = head.x + centi.dir;
      let nextY = head.y;
      const obstacle = mushrooms.get(`${nextX},${nextY}`);
      if (nextX < 0 || nextX >= COLS || obstacle) {
        moveDown = true;
        centi.dir *= -1;
        nextX = head.x + centi.dir;
        nextY = head.y + 1;
      }
      if (head.poisoned) {
        nextX = head.x;
        nextY = head.y + 1;
        if (nextY >= ROWS - 1) head.poisoned = false;
      }
      for (let i = centi.segments.length - 1; i >= 1; i -= 1) {
        centi.segments[i].x = centi.segments[i - 1].x;
        centi.segments[i].y = centi.segments[i - 1].y;
      }
      head.x = nextX;
      head.y = Math.min(nextY, ROWS - 1);
      if (moveDown && obstacle?.poisoned) head.poisoned = true;
    });
  };

  const updateEnemies = (dt) => {
    const fleaChance = settings.difficulty === "hard" ? 0.02 : settings.difficulty === "easy" ? 0.006 : 0.01;
    if (!enemies.flea && Math.random() < fleaChance && mushrooms.size < 30) {
      enemies.flea = { x: Math.floor(Math.random() * COLS), y: 0 };
    }
    if (enemies.flea) {
      enemies.flea.y += 1;
      if (Math.random() < 0.4) {
        mushrooms.set(`${enemies.flea.x},${enemies.flea.y}`, { hp: 4, poisoned: false });
      }
      if (enemies.flea.y > ROWS) enemies.flea = null;
    }

    if (!enemies.spider) {
      spiderCooldown = Math.max(0, spiderCooldown - dt);
      if (spiderCooldown <= 0) {
        enemies.spider = { x: Math.random() < 0.5 ? 0 : COLS - 1, y: PLAYER_ZONE + 1, dir: Math.random() < 0.5 ? 1 : -1, vy: 1 };
        spiderCooldown = Math.random() * 30;
      }
    }
    if (enemies.spider) {
      const spiderSpeed = settings.difficulty === "hard" ? 8 : settings.difficulty === "easy" ? 4.5 : 6;
      enemies.spider.x += enemies.spider.dir * spiderSpeed * dt;
      enemies.spider.y += enemies.spider.vy * spiderSpeed * dt;
      if (enemies.spider.x <= 0 || enemies.spider.x >= COLS - 1) enemies.spider.dir *= -1;
      if (enemies.spider.y <= PLAYER_ZONE || enemies.spider.y >= ROWS - 1) enemies.spider.vy *= -1;
      if (Math.random() < 0.1) {
        const key = `${Math.round(enemies.spider.x)},${Math.round(enemies.spider.y)}`;
        mushrooms.delete(key);
      }
    }

    const scorpionChance = settings.difficulty === "hard" ? 0.008 : settings.difficulty === "easy" ? 0.002 : 0.004;
    if (!enemies.scorpion && Math.random() < scorpionChance) {
      enemies.scorpion = { x: 0, y: Math.floor(Math.random() * (PLAYER_ZONE - 4)) + 2, dir: 1 };
    }
    if (enemies.scorpion) {
      const scorpionSpeed = settings.difficulty === "hard" ? 6 : settings.difficulty === "easy" ? 3.5 : 4.5;
      enemies.scorpion.x += enemies.scorpion.dir * scorpionSpeed * dt;
      const key = `${Math.round(enemies.scorpion.x)},${enemies.scorpion.y}`;
      const mush = mushrooms.get(key);
      if (mush) mush.poisoned = true;
      if (enemies.scorpion.x > COLS) enemies.scorpion = null;
    }
  };

  const handleHits = () => {
    for (let b = bullets.length - 1; b >= 0; b -= 1) {
      const bullet = bullets[b];
      let hit = false;
      if (hitMushroom(bullet.x, bullet.y)) {
        audio.playTone({ freq: 260, duration: 0.04 });
        bullets.splice(b, 1);
        continue;
      }
      for (let c = centipedes.length - 1; c >= 0; c -= 1) {
        const centi = centipedes[c];
        const idx = centi.segments.findIndex((seg) => seg.x === bullet.x && seg.y === bullet.y);
        if (idx >= 0) {
          splitCentipede(centi, idx);
          bullets.splice(b, 1);
          audio.playTone({ freq: 520, duration: 0.05 });
          hit = true;
          if (centi.segments.length === 0) centipedes.splice(c, 1);
          break;
        }
      }
      if (hit) continue;
      if (enemies.flea && enemies.flea.x === bullet.x && enemies.flea.y === bullet.y) {
        addScore(200);
        enemies.flea = null;
        bullets.splice(b, 1);
        continue;
      }
      if (enemies.spider && Math.round(enemies.spider.x) === bullet.x && Math.round(enemies.spider.y) === bullet.y) {
        addScore(300);
        enemies.spider = null;
        spiderCooldown = Math.random() * 30;
        bullets.splice(b, 1);
        continue;
      }
      if (enemies.scorpion && Math.round(enemies.scorpion.x) === bullet.x && enemies.scorpion.y === bullet.y) {
        addScore(150);
        enemies.scorpion = null;
        bullets.splice(b, 1);
      }
    }
  };

  const checkPlayerHit = () => {
    const danger = centipedes.some((centi) => centi.segments.some((seg) => seg.x === player.x && seg.y === player.y));
    if (danger) {
      lives -= 1;
      audio.playNoise({ duration: 0.2 });
      if (lives <= 0) {
        state = "gameover";
        audio.stopMusic();
        if (!scoreSubmitted) {
          submitFinalScore({
            board: getBoardIdForGame("chilopodophobia", "classic", "normal"),
            score,
            runMs: Math.floor(performance.now() - runStart),
          }).catch(() => {});
          scoreSubmitted = true;
        }
        scoreOverlay.refresh();
      } else {
        player.x = Math.floor(COLS / 2);
        player.y = ROWS - 2;
      }
    }
  };

  const step = (dt) => {
    if (state !== "playing") return;
    if (settings.control === "keys") {
      moveTimer += dt;
      while (moveTimer >= moveRate) {
        moveTimer -= moveRate;
        const dx = input.left ? -1 : input.right ? 1 : 0;
        const dy = input.up ? -1 : input.down ? 1 : 0;
        if (dx || dy) movePlayer(dx, dy);
        if (input.fire) {
          fire();
          input.fire = false;
        }
      }
    }
    updateBullets();
    centiTimer += dt;
    const baseSpeed = settings.difficulty === "easy" ? 0.22 : settings.difficulty === "hard" ? 0.12 : 0.18;
    if (centiTimer >= baseSpeed) {
      centiTimer = 0;
      updateCentipedes();
    }
    updateEnemies(dt);
    handleHits();
    checkPlayerHit();
    if (centipedes.length === 0) {
      level += 1;
      resetLevel();
    }
  };

  const draw = () => {
    clear();
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    mushrooms.forEach((m, key) => {
      const [x, y] = key.split(",").map(Number);
      ctx.fillStyle = m.poisoned ? "#b35cff" : "#5ab0ff";
      ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x * TILE + 4, y * TILE + 4, TILE - 8, TILE - 8);
    });

    centipedes.forEach((centi) => {
      centi.segments.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? "#ffd166" : "#6ef0c4";
        ctx.fillRect(seg.x * TILE + 3, seg.y * TILE + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = "#0d1117";
        ctx.fillRect(seg.x * TILE + 6, seg.y * TILE + 6, 3, 3);
      });
    });

    bullets.forEach((b) => {
      ctx.fillStyle = "#f4f6ff";
      ctx.fillRect(b.x * TILE + TILE / 2 - 1, b.y * TILE, 2, TILE);
    });

    if (enemies.flea) {
      ctx.fillStyle = "#ff6f91";
      ctx.fillRect(enemies.flea.x * TILE + 4, enemies.flea.y * TILE + 4, TILE - 8, TILE - 8);
    }
    if (enemies.spider) {
      ctx.fillStyle = "#ff9f68";
      ctx.fillRect(enemies.spider.x * TILE, enemies.spider.y * TILE, TILE, TILE);
    }
    if (enemies.scorpion) {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(enemies.scorpion.x * TILE, enemies.scorpion.y * TILE + 3, TILE, TILE - 6);
    }

    ctx.fillStyle = "#e6edf6";
    ctx.fillRect(player.x * TILE + 4, player.y * TILE + 4, TILE - 8, TILE - 8);

    ctx.fillStyle = "#e6edf6";
    ctx.font = "14px 'Avenir Next', sans-serif";
    ctx.fillText(`Score ${score}`, 12, 22);
    ctx.fillText(`High ${highScore}`, 130, 22);
    ctx.fillText(`Lives ${lives}`, 250, 22);
    ctx.fillText(`Level ${level}`, 340, 22);

    if (state === "start") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Press Enter", 240, 340);
      ctx.font = "12px 'Avenir Next', sans-serif";
      ctx.fillText("Arrows move • Space fire • Mouse optional", 210, 365);
      scoreOverlay.show("Top Scores", "Last 7 days");
    }

    if (state === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Game Over", 250, 340);
      scoreOverlay.show("Top Scores", "Last 7 days");
    }
    if (state === "playing") {
      scoreOverlay.hide();
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      if (state !== "playing") reset();
      return;
    }
    if (state !== "playing") return;
    if (settings.control !== "keys") return;
    if (event.key === "ArrowLeft") input.left = true;
    if (event.key === "ArrowRight") input.right = true;
    if (event.key === "ArrowUp") input.up = true;
    if (event.key === "ArrowDown") input.down = true;
    if (event.key === " ") input.fire = true;
  };
  const onKeyUp = (event) => {
    if (settings.control !== "keys") return;
    if (event.key === "ArrowLeft") input.left = false;
    if (event.key === "ArrowRight") input.right = false;
    if (event.key === "ArrowUp") input.up = false;
    if (event.key === "ArrowDown") input.down = false;
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  content.addEventListener("mousemove", onMouseMove);

  let stopLoop = startLoop({ step, render: draw, isActive: () => content.isConnected });

  const destroy = () => {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    content.removeEventListener("mousemove", onMouseMove);
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

  osAPI?.registerAppMenu?.("chilopodophobia", {
    appName: "Chilopodophobia",
    menus: [
      {
        title: "Chilopodophobia",
        items: [
          { label: "Reset", onClick: reset },
          {
            label: "Control: Arrow Keys",
            type: "radio",
            checked: settings.control === "keys",
            onToggle: () => {
              settings.control = "keys";
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            },
          },
          {
            label: "Control: Mouse",
            type: "radio",
            checked: settings.control === "mouse",
            onToggle: () => {
              settings.control = "mouse";
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            },
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
              if (settings.music && state === "playing") audio.startMusic([220, 262, 196, 247], 0.2);
            },
          },
        ],
      },
    ],
  });

  return {
    title: "Chilopodophobia",
    width: 720,
    height: 820,
    aspectRatio: BASE_W / BASE_H,
    content,
    onSuspend: () => {
      stopLoop?.();
      audio.stopMusic();
    },
    onResume: () => {
      stopLoop = startLoop({ step, render: draw, isActive: () => content.isConnected });
      if (settings.music && state === "playing") audio.startMusic([220, 262, 196, 247], 0.2);
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
