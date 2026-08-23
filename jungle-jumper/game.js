import { createGameSurface, startLoop } from "../daemonos-shared/gameUtils.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";
import { createRetroAudio } from "../daemonos-shared/retroAudio.js";

const SETTINGS_KEY = "junglejumper_settings";
const HIGH_KEY = "junglejumper_highscore";

export function createApp(osAPI) {
  const BASE_W = 640;
  const BASE_H = 360;
  const GROUND_Y = 280;

  const { content, ctx, clear } = createGameSurface({
    baseWidth: BASE_W,
    baseHeight: BASE_H,
    className: "game-canvas",
    fit: "contain",
  });
  content.style.position = "relative";
  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("junglejumper", "classic", "normal"),
    windowDays: 7,
    limit: 5,
  });
  scoreOverlay.refresh();

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored
    ? { music: true, sfx: true, difficulty: "normal", ...JSON.parse(stored) }
    : { music: true, sfx: true, difficulty: "normal" };

  const audio = createRetroAudio({
    musicOn: settings.music,
    sfxOn: settings.sfx,
    musicVolume: 0.3,
    sfxVolume: 0.6,
  });

  const TREASURE_VALUES = [100, 200, 300, 400];
  const WORLD_LENGTH = 48;
  const world = [];

  const makeScreen = (type, idx) => {
    const screen = {
      type,
      idx,
      pits: [],
      hazards: [],
      treasures: [],
      vine: null,
      ladder: null,
    };

    if (type === "pit" || type === "pit_vine") {
      screen.pits.push({ x: 180, w: 180 });
    }

    if (type === "log") {
      screen.pits.push({ x: 140, w: 240 });
      screen.hazards.push({ type: "log", x: 140, w: 240, dir: idx % 2 ? 1 : -1, speed: 40 });
    }

    if (type === "croc") {
      screen.pits.push({ x: 120, w: 280 });
      screen.hazards.push({ type: "croc", x: 120, w: 280, phase: 0 });
    }

    if (type === "snake") {
      screen.hazards.push({ type: "snake", x: 220, dir: idx % 2 ? 1 : -1, speed: 40 });
    }

    if (type === "pit_vine") {
      screen.vine = { x: 260, length: 120, anchorY: 40, angle: Math.PI / 4, angVel: 0 };
    }

    if (type === "treasure") {
      screen.treasures.push({ x: 260, taken: false, value: TREASURE_VALUES[idx % TREASURE_VALUES.length] });
    }

    if (type === "ladder") {
      screen.ladder = { x: 80 + (idx % 4) * 120 };
    }

    return screen;
  };

  const pattern = [
    "pit",
    "pit_vine",
    "treasure",
    "log",
    "snake",
    "croc",
    "treasure",
    "ladder",
  ];

  for (let i = 0; i < WORLD_LENGTH; i += 1) {
    world.push(makeScreen(pattern[i % pattern.length], i));
  }

  const underground = {
    active: false,
    screen: 0,
    exits: [4, 9, 14],
  };

  let screenIndex = 0;
  let score = 0;
  let highScore = Number(localStorage.getItem(HIGH_KEY)) || 0;
  let lives = 3;
  let timeLeft = 300;
  let state = "start";
  let runStart = performance.now();
  let scoreSubmitted = false;
  let treasuresRemaining = world.reduce((sum, s) => sum + s.treasures.length, 0);

  const player = {
    x: 80,
    y: GROUND_Y - 24,
    vx: 0,
    vy: 0,
    w: 20,
    h: 24,
    onGround: true,
    swing: null,
    invuln: 0,
  };

  const input = { left: false, right: false, up: false, down: false };

  const reset = () => {
    const baseTime = settings.difficulty === "easy" ? 360 : settings.difficulty === "hard" ? 240 : 300;
    screenIndex = 0;
    underground.active = false;
    underground.screen = 0;
    score = 0;
    lives = 3;
    timeLeft = baseTime;
    runStart = performance.now();
    scoreSubmitted = false;
    player.x = 80;
    player.y = GROUND_Y - 24;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.swing = null;
    player.invuln = 0;
    world.forEach((s) => s.treasures.forEach((t) => (t.taken = false)));
    treasuresRemaining = world.reduce((sum, s) => sum + s.treasures.length, 0);
    state = "playing";
    audio.startMusic([220, 196, 174, 196], 0.3);
  };

  const loseLife = () => {
    if (player.invuln > 0) return;
    lives -= 1;
    player.invuln = 1.4;
    audio.playNoise({ duration: 0.2 });
    if (lives <= 0) {
      state = "gameover";
      if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_KEY, String(highScore));
      }
      if (!scoreSubmitted) {
        submitFinalScore({
          board: getBoardIdForGame("junglejumper", "classic", "normal"),
          score,
          runMs: Math.floor(performance.now() - runStart),
        }).catch(() => {});
        scoreSubmitted = true;
      }
      scoreOverlay.refresh();
      audio.stopMusic();
    } else {
      player.x = 80;
      player.y = GROUND_Y - 24;
      player.vx = 0;
      player.vy = 0;
      player.onGround = true;
      player.swing = null;
    }
  };

  const currentScreen = () => (underground.active ? null : world[screenIndex % world.length]);

  const updateUnderground = (dt) => {
    player.vy = 0;
    player.onGround = true;
    const speed = 120;
    player.vx = input.left ? -speed : input.right ? speed : 0;
    player.x += player.vx * dt;
    if (player.x < 0) {
      underground.screen = (underground.screen + 1) % underground.exits.length;
      player.x = BASE_W - 20;
    }
    if (player.x > BASE_W) {
      underground.screen = (underground.screen + 1) % underground.exits.length;
      player.x = 20;
    }
    if (input.up) {
      const exitX = 80 + underground.exits[underground.screen] * 30;
      if (Math.abs(player.x - exitX) < 16) {
        underground.active = false;
        screenIndex = (screenIndex + 4 + underground.screen) % world.length;
        player.x = exitX;
        player.y = GROUND_Y - 24;
      }
    }
  };

  const update = (dt) => {
    if (state !== "playing") return;
    timeLeft -= dt;
    if (timeLeft <= 0) {
      state = "gameover";
      if (!scoreSubmitted) {
        submitFinalScore({
          board: getBoardIdForGame("junglejumper", "classic", "normal"),
          score,
          runMs: Math.floor(performance.now() - runStart),
        }).catch(() => {});
        scoreSubmitted = true;
      }
      scoreOverlay.refresh();
      audio.stopMusic();
    }

    if (treasuresRemaining <= 0) {
      state = "gameover";
      if (!scoreSubmitted) {
        submitFinalScore({
          board: getBoardIdForGame("junglejumper", "classic", "normal"),
          score,
          runMs: Math.floor(performance.now() - runStart),
        }).catch(() => {});
        scoreSubmitted = true;
      }
      scoreOverlay.refresh();
      audio.stopMusic();
    }

    player.invuln = Math.max(0, player.invuln - dt);

    if (underground.active) {
      updateUnderground(dt);
      return;
    }

    const screen = currentScreen();

    if (player.swing) {
      player.swing.angVel += -0.9 * Math.sin(player.swing.angle) * dt;
      player.swing.angle += player.swing.angVel;
      player.x = player.swing.anchorX + Math.sin(player.swing.angle) * player.swing.length;
      player.y = player.swing.anchorY + Math.cos(player.swing.angle) * player.swing.length;
      if (!input.up) {
        player.swing = null;
        player.vx = Math.cos(player.swing?.angle || 0) * 160;
        player.vy = -220;
      }
      return;
    }

    const moveSpeed = 140;
    if (input.left) player.vx = -moveSpeed;
    else if (input.right) player.vx = moveSpeed;
    else player.vx = 0;

    if (input.up && player.onGround) {
      player.vy = -220;
      player.onGround = false;
      audio.playTone({ freq: 420, duration: 0.05 });
    }

    player.vy += 540 * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    if (player.x < 0) {
      screenIndex = (screenIndex - 1 + world.length) % world.length;
      player.x = BASE_W - 20;
    }
    if (player.x > BASE_W) {
      screenIndex = (screenIndex + 1) % world.length;
      player.x = 20;
    }

    screen.treasures.forEach((t) => {
      if (!t.taken && Math.abs(player.x - t.x) < 16 && Math.abs(player.y - (GROUND_Y - 24)) < 10) {
        t.taken = true;
        treasuresRemaining -= 1;
        score += t.value;
        audio.playTone({ freq: 520, duration: 0.1 });
      }
    });

    if (screen.ladder && input.down && Math.abs(player.x - screen.ladder.x) < 16) {
      underground.active = true;
      underground.screen = 0;
      player.x = screen.ladder.x;
      player.y = 220;
      player.vy = 0;
    }

    screen.pits.forEach((pit) => {
      if (player.x > pit.x && player.x < pit.x + pit.w && player.y >= GROUND_Y - player.h - 2) {
        loseLife();
      }
    });

    screen.hazards.forEach((h) => {
      if (h.type === "snake") {
        h.x += h.dir * h.speed * dt;
        if (h.x < 80 || h.x > BASE_W - 80) h.dir *= -1;
        if (Math.abs(player.x - h.x) < 14 && player.onGround) loseLife();
      }
      if (h.type === "log") {
        h.x += h.dir * h.speed * dt;
        if (h.x < 80 || h.x > BASE_W - 80) h.dir *= -1;
        if (player.x > h.x && player.x < h.x + h.w && player.y >= GROUND_Y - player.h - 2) {
          loseLife();
        }
      }
      if (h.type === "croc") {
        h.phase += dt;
        if (player.x > h.x && player.x < h.x + h.w && player.y >= GROUND_Y - player.h - 2) {
          const safeHead = Math.abs((player.x - h.x) % 60) < 20 && Math.sin(h.phase * 2) > -0.2;
          if (!safeHead) loseLife();
        }
      }
    });

    if (screen.vine && input.up && Math.abs(player.x - screen.vine.x) < 18 && player.y < 120) {
      player.swing = {
        anchorX: screen.vine.x,
        anchorY: screen.vine.anchorY,
        length: screen.vine.length,
        angle: Math.PI / 4,
        angVel: 0,
      };
    }
  };

  const drawPlayer = () => {
    ctx.fillStyle = player.invuln > 0 ? "rgba(255,255,255,0.6)" : "#f2f6ff";
    ctx.fillRect(player.x - player.w / 2, player.y, player.w, player.h);
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(player.x - 6, player.y + 6, 12, 6);
  };

  const draw = () => {
    clear();
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    ctx.fillStyle = "#15304a";
    ctx.fillRect(0, GROUND_Y, BASE_W, BASE_H - GROUND_Y);

    if (underground.active) {
      ctx.fillStyle = "#101820";
      ctx.fillRect(0, 200, BASE_W, 120);
      const exitX = 80 + underground.exits[underground.screen] * 30;
      ctx.fillStyle = "#6ef0c4";
      ctx.fillRect(exitX - 6, 200, 12, 60);
      drawPlayer();
    } else {
      const screen = currentScreen();
      screen.pits.forEach((pit) => {
        ctx.fillStyle = "#0c0f14";
        ctx.fillRect(pit.x, GROUND_Y, pit.w, 60);
      });

      screen.hazards.forEach((h) => {
        if (h.type === "log") {
          ctx.fillStyle = "#c98d4a";
          ctx.fillRect(h.x, GROUND_Y + 10, h.w, 12);
          ctx.fillStyle = "#7c4e20";
          ctx.fillRect(h.x + 6, GROUND_Y + 14, h.w - 12, 4);
        }
        if (h.type === "croc") {
          ctx.fillStyle = "#5ab0ff";
          ctx.fillRect(h.x, GROUND_Y + 8, h.w, 14);
          ctx.fillStyle = "#0b1118";
          ctx.fillRect(h.x + 6, GROUND_Y + 12, h.w - 12, 6);
        }
        if (h.type === "snake") {
          ctx.fillStyle = "#ff6f91";
          ctx.fillRect(h.x - 10, GROUND_Y - 10, 20, 8);
        }
      });

      screen.treasures.forEach((t) => {
        if (!t.taken) {
          ctx.fillStyle = "#ffd166";
          ctx.fillRect(t.x - 8, GROUND_Y - 26, 16, 16);
        }
      });

      if (screen.vine) {
        ctx.strokeStyle = "#6ef0c4";
        ctx.beginPath();
        ctx.moveTo(screen.vine.x, screen.vine.anchorY);
        ctx.lineTo(screen.vine.x, screen.vine.anchorY + screen.vine.length);
        ctx.stroke();
      }

      if (screen.ladder) {
        ctx.fillStyle = "#6ef0c4";
        ctx.fillRect(screen.ladder.x - 6, GROUND_Y - 50, 12, 50);
      }

      drawPlayer();
    }

    ctx.fillStyle = "#e6edf6";
    ctx.font = "14px 'Avenir Next', sans-serif";
    ctx.fillText(`Score ${score}`, 12, 22);
    ctx.fillText(`High ${highScore}`, 130, 22);
    ctx.fillText(`Lives ${lives}`, 260, 22);
    ctx.fillText(`Time ${Math.ceil(timeLeft)}`, 360, 22);
    ctx.fillText(`Treasures ${treasuresRemaining}`, 460, 22);

    if (state === "start") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Press Enter", 260, 200);
      ctx.font = "12px 'Avenir Next', sans-serif";
      ctx.fillText("Arrows move • Up jump • Down enter ladder", 200, 225);
      scoreOverlay.show("Top Scores", "Last 7 days");
    }

    if (state === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#f2f6ff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Game Over", 260, 200);
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
    if (event.key === "ArrowLeft") input.left = true;
    if (event.key === "ArrowRight") input.right = true;
    if (event.key === "ArrowUp") input.up = true;
    if (event.key === "ArrowDown") input.down = true;
  };

  const onKeyUp = (event) => {
    if (event.key === "ArrowLeft") input.left = false;
    if (event.key === "ArrowRight") input.right = false;
    if (event.key === "ArrowUp") input.up = false;
    if (event.key === "ArrowDown") input.down = false;
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  let stopLoop = startLoop({ step: update, render: draw, isActive: () => content.isConnected });

  const destroy = () => {
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

  osAPI?.registerAppMenu?.("junglejumper", {
    appName: "Jungle Jumper",
    menus: [
      {
        title: "Jungle Jumper",
        items: [
          { label: "Reset", onClick: reset },
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
              if (settings.music && state === "playing") audio.startMusic([220, 196, 174, 196], 0.3);
            },
          },
        ],
      },
    ],
  });

  return {
    title: "Jungle Jumper",
    width: 700,
    height: 420,
    aspectRatio: BASE_W / BASE_H,
    content,
    onSuspend: () => {
      stopLoop?.();
      audio.stopMusic();
    },
    onResume: () => {
      stopLoop = startLoop({ step: update, render: draw, isActive: () => content.isConnected });
      if (settings.music && state === "playing") audio.startMusic([220, 196, 174, 196], 0.3);
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
