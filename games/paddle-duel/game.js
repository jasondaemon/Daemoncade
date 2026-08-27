import { createGameSurface, startLoop } from "../daemonos-shared/gameUtils.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";

const SETTINGS_KEY = "paddleduel_settings";
const STATS_KEY = "paddleduel_stats";
const SOLO_HIGH_KEY = "paddleduel_solo_high";

const DIFFICULTY = {
  easy: { reaction: 0.18, error: 22, maxSpeed: 220 },
  normal: { reaction: 0.12, error: 14, maxSpeed: 280 },
  hard: { reaction: 0.08, error: 8, maxSpeed: 340 },
};

export function createApp() {
  const controller = new AbortController();
  const { signal } = controller;

  const BASE_W = 560;
  const BASE_H = 340;

  const wrapper = document.createElement("div");
  wrapper.style.display = "grid";
  wrapper.style.gridTemplateRows = "auto 1fr";
  wrapper.style.gap = "10px";
  wrapper.style.height = "100%";

  const toolbar = document.createElement("div");
  toolbar.className = "game-toolbar";
  toolbar.classList.add("paddleduel-toolbar");

  const modeSelect = document.createElement("select");
  modeSelect.className = "menu-select";
  ["Wall Ball", "Vs CPU", "2 Player"].forEach((label) => {
    const option = document.createElement("option");
    option.value = label === "Wall Ball" ? "solo" : label === "Vs CPU" ? "cpu" : "2p";
    option.textContent = label;
    modeSelect.appendChild(option);
  });

  const difficultySelect = document.createElement("select");
  difficultySelect.className = "menu-select";
  ["Easy", "Normal", "Hard"].forEach((label) => {
    const option = document.createElement("option");
    option.value = label.toLowerCase();
    option.textContent = label;
    difficultySelect.appendChild(option);
  });

  const pointsSelect = document.createElement("select");
  pointsSelect.className = "menu-select";
  [5, 9, 11].forEach((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `${value} pts`;
    pointsSelect.appendChild(option);
  });

  const rampToggle = document.createElement("label");
  rampToggle.style.display = "inline-flex";
  rampToggle.style.alignItems = "center";
  rampToggle.style.gap = "6px";
  const rampInput = document.createElement("input");
  rampInput.type = "checkbox";
  const rampText = document.createElement("span");
  rampText.textContent = "Speed Ramp";
  rampToggle.append(rampInput, rampText);

  const soundToggle = document.createElement("label");
  soundToggle.style.display = "inline-flex";
  soundToggle.style.alignItems = "center";
  soundToggle.style.gap = "6px";
  const soundInput = document.createElement("input");
  soundInput.type = "checkbox";
  const soundText = document.createElement("span");
  soundText.textContent = "Sound";
  soundToggle.append(soundInput, soundText);

  const resetButton = document.createElement("button");
  resetButton.className = "menu-button";
  resetButton.textContent = "New Game";

  const status = document.createElement("div");
  status.className = "game-status";

  toolbar.append(modeSelect, difficultySelect, pointsSelect, rampToggle, soundToggle, resetButton, status);
  wrapper.appendChild(toolbar);

  const { content, canvas, ctx, clear, resizeObserver } = createGameSurface({
    baseWidth: BASE_W,
    baseHeight: BASE_H,
    className: "game-canvas",
    fit: "contain",
  });
  wrapper.appendChild(content);
  content.style.position = "relative";
  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("paddleduel", "classic", "normal"),
    windowDays: 7,
    limit: 5,
  });
  scoreOverlay.refresh();

  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored
    ? { mode: "cpu", difficulty: "normal", points: 5, ramp: true, sound: true, ...JSON.parse(stored) }
    : { mode: "cpu", difficulty: "normal", points: 5, ramp: true, sound: true };

  modeSelect.value = settings.mode;
  difficultySelect.value = settings.difficulty;
  pointsSelect.value = String(settings.points);
  rampInput.checked = settings.ramp;
  soundInput.checked = settings.sound;

  const statsStored = localStorage.getItem(STATS_KEY);
  const stats = statsStored ? { p1: 0, p2: 0, games: 0, ...JSON.parse(statsStored) } : { p1: 0, p2: 0, games: 0 };
  let soloHigh = Number(localStorage.getItem(SOLO_HIGH_KEY)) || 0;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.08, type = "square", gain = 0.2) => {
    if (!settings.sound) return;
    if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  const paddleLeft = { x: 18, y: 120, w: 12, h: 80, vy: 0, prevY: 120 };
  const paddleRight = { x: BASE_W - 30, y: 120, w: 12, h: 80, vy: 0, prevY: 120 };
  const ball = { x: BASE_W / 2, y: BASE_H / 2, vx: 220, vy: 140, r: 8 };

  let state = "start"; // start | playing | paused | gameover
  let runStart = performance.now();
  let scoreSubmitted = false;
  let playerScore = 0;
  let cpuScore = 0;
  let soloScore = 0;
  let selectedCol = 0;
  let hits = 0;
  let serveTimer = 0;
  let aiTimer = 0;
  let aiTarget = BASE_H / 2;

  const saveSettings = () => {
    settings.mode = modeSelect.value;
    settings.difficulty = difficultySelect.value;
    settings.points = Number(pointsSelect.value);
    settings.ramp = rampInput.checked;
    settings.sound = soundInput.checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  };

  const saveStats = () => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  };

  const resetBall = () => {
    ball.x = BASE_W / 2;
    ball.y = BASE_H / 2;
    const dir = Math.random() > 0.5 ? 1 : -1;
    ball.vx = dir * 220;
    const vy = (Math.random() * 2 - 1) * 140;
    ball.vy = Math.abs(vy) < 60 ? Math.sign(vy || 1) * 80 : vy;
    hits = 0;
    serveTimer = 0.5;
  };

  const resetMatch = () => {
    playerScore = 0;
    cpuScore = 0;
    soloScore = 0;
    paddleLeft.y = BASE_H / 2 - paddleLeft.h / 2;
    paddleRight.y = BASE_H / 2 - paddleRight.h / 2;
    paddleLeft.prevY = paddleLeft.y;
    paddleRight.prevY = paddleRight.y;
    resetBall();
  };

  const startGame = () => {
    resetMatch();
    state = "playing";
    runStart = performance.now();
    scoreSubmitted = false;
    scoreOverlay.hide();
    updateStatus();
  };

  const updateStatus = () => {
    if (state === "gameover") {
      status.textContent = settings.mode === "solo" ? `Game Over • Score ${soloScore}` : `Game Over ${playerScore}:${cpuScore}`;
    } else if (state === "paused") {
      status.textContent = "Paused";
    } else if (state === "start") {
      status.textContent = "Press Space to Start";
    } else {
      status.textContent = settings.mode === "solo" ? `Score ${soloScore} • High ${soloHigh}` : `Score ${playerScore}:${cpuScore}`;
    }
  };

  const applySpin = (paddle, isLeft) => {
    const rel = (ball.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2);
    const capped = Math.max(-1, Math.min(1, rel));
    const paddleVelocity = paddle.y - paddle.prevY;
    ball.vy = capped * 220 + paddleVelocity * 5;
    ball.vx = (isLeft ? 1 : -1) * Math.max(200, Math.abs(ball.vx));
    if (settings.ramp) {
      ball.vx *= 1.03;
      ball.vy *= 1.03;
    }
  };

  const update = (dt) => {
    if (state !== "playing") return;

    if (serveTimer > 0) {
      serveTimer = Math.max(0, serveTimer - dt);
      return;
    }

    // update paddles
    paddleLeft.vy = paddleLeft.y - paddleLeft.prevY;
    paddleRight.vy = paddleRight.y - paddleRight.prevY;
    paddleLeft.prevY = paddleLeft.y;
    paddleRight.prevY = paddleRight.y;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.y - ball.r < 0 || ball.y + ball.r > BASE_H) {
      ball.vy = Math.sign(ball.vy || 1) * Math.max(80, Math.abs(ball.vy));
      ball.vy *= -1;
      ball.y = Math.max(ball.r, Math.min(BASE_H - ball.r, ball.y));
      playTone(320, 0.05);
    }

    // paddle collisions
    const hitLeft =
      ball.x - ball.r < paddleLeft.x + paddleLeft.w &&
      ball.y > paddleLeft.y &&
      ball.y < paddleLeft.y + paddleLeft.h;

    if (hitLeft) {
      ball.x = paddleLeft.x + paddleLeft.w + ball.r;
      applySpin(paddleLeft, true);
      hits += 1;
      playTone(420, 0.06);
    }

    const hitRight =
      ball.x + ball.r > paddleRight.x &&
      ball.y > paddleRight.y &&
      ball.y < paddleRight.y + paddleRight.h;

    if (hitRight) {
      ball.x = paddleRight.x - ball.r;
      applySpin(paddleRight, false);
      hits += 1;
      playTone(420, 0.06);
    }

    if (ball.x - ball.r < 0) {
      if (settings.mode === "solo") {
        state = "gameover";
        playTone(180, 0.2, "triangle");
        if (soloScore > soloHigh) {
          soloHigh = soloScore;
          localStorage.setItem(SOLO_HIGH_KEY, String(soloHigh));
        }
        if (!scoreSubmitted) {
          submitFinalScore({
            board: getBoardIdForGame("paddleduel", "classic", "normal"),
            score: soloScore,
            runMs: Math.floor(performance.now() - runStart),
          }).catch(() => {});
          scoreSubmitted = true;
        }
        scoreOverlay.refresh();
        updateStatus();
      } else {
        cpuScore += 1;
        playTone(180, 0.2, "triangle");
        resetBall();
      }
    }

    if (ball.x + ball.r > BASE_W) {
      if (settings.mode === "solo") {
        ball.vx = -Math.abs(ball.vx);
        ball.x = BASE_W - ball.r - 1;
        soloScore += 1;
        playTone(520, 0.08, "triangle", 0.18);
      } else {
        playerScore += 1;
        playTone(520, 0.2, "triangle");
        resetBall();
      }
    }

    if (settings.mode !== "solo" && (playerScore >= settings.points || cpuScore >= settings.points)) {
      state = "gameover";
      stats.games += 1;
      if (playerScore > cpuScore) stats.p1 += 1;
      else stats.p2 += 1;
      saveStats();
      if (settings.mode === "cpu" && !scoreSubmitted) {
        submitFinalScore({
          board: getBoardIdForGame("paddleduel", "classic", "normal"),
          score: playerScore,
          runMs: Math.floor(performance.now() - runStart),
        }).catch(() => {});
        scoreSubmitted = true;
      }
      scoreOverlay.refresh();
      updateStatus();
    }

    // CPU paddle
    if (settings.mode === "cpu") {
      const ai = DIFFICULTY[settings.difficulty];
      aiTimer += dt;
      if (aiTimer >= ai.reaction) {
        aiTimer = 0;
        aiTarget = ball.y + (Math.random() * 2 - 1) * ai.error;
      }
      const diff = aiTarget - (paddleRight.y + paddleRight.h / 2);
      const move = Math.max(-ai.maxSpeed, Math.min(ai.maxSpeed, diff * 6));
      paddleRight.y += move * dt;
    }

    paddleLeft.y = Math.max(0, Math.min(BASE_H - paddleLeft.h, paddleLeft.y));
    paddleRight.y = Math.max(0, Math.min(BASE_H - paddleRight.h, paddleRight.y));
  };

  const draw = () => {
    clear();
    ctx.fillStyle = "#0c1117";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(BASE_W / 2, 0);
    ctx.lineTo(BASE_W / 2, BASE_H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f2c358";
    ctx.fillRect(paddleLeft.x, paddleLeft.y, paddleLeft.w, paddleLeft.h);
    if (settings.mode !== "solo") {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(paddleRight.x, paddleRight.y, paddleRight.w, paddleRight.h);
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "14px 'Avenir Next', sans-serif";
    ctx.textAlign = "center";
    if (settings.mode === "solo") {
      ctx.fillText(`Score ${soloScore}`, BASE_W / 2, 24);
    } else {
      ctx.fillText(`${playerScore} : ${cpuScore}`, BASE_W / 2, 24);
    }

    if (state === "start") {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Paddle Duel", BASE_W / 2, 110);
      ctx.font = "14px 'Avenir Next', sans-serif";
      ctx.fillText("Press Space to Start", BASE_W / 2, 150);
      ctx.fillText("P: Pause • R: Restart", BASE_W / 2, 175);
      ctx.fillText("Wall Ball = wall practice", BASE_W / 2, 198);
      ctx.fillText(`Wall Ball High: ${soloHigh}`, BASE_W / 2, 218);
      ctx.fillText(`Wins: ${stats.p1}  Losses: ${stats.p2}`, BASE_W / 2, 238);
      if (settings.mode !== "2p") {
        scoreOverlay.show("Top Scores", "Last 7 days");
      }
    }

    if (state === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px 'Avenir Next', sans-serif";
      ctx.fillText("Paused", BASE_W / 2, BASE_H / 2);
    }

    if (state === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px 'Avenir Next', sans-serif";
      ctx.fillText("Game Over", BASE_W / 2, BASE_H / 2 - 10);
      ctx.font = "14px 'Avenir Next', sans-serif";
      const line = settings.mode === "solo" ? `Score ${soloScore}  High ${soloHigh}` : `${playerScore} : ${cpuScore}`;
      ctx.fillText(line, BASE_W / 2, BASE_H / 2 + 10);
      ctx.fillText("Press Space to Play Again", BASE_W / 2, BASE_H / 2 + 30);
      if (settings.mode !== "2p") {
        scoreOverlay.show("Top Scores", "Last 7 days");
      }
    }
    if (state === "playing") {
      scoreOverlay.hide();
    }
  };

  canvas.addEventListener("mousemove", (event) => {
    if (settings.mode === "2p") return;
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) * (BASE_H / rect.height);
    paddleLeft.y = Math.max(0, Math.min(BASE_H - paddleLeft.h, y - paddleLeft.h / 2));
  }, { signal });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "p") {
      state = state === "paused" ? "playing" : "paused";
      updateStatus();
      return;
    }
    if (key === "r") {
      resetMatch();
      state = "playing";
      updateStatus();
      return;
    }
    if (event.key === " " && (state === "start" || state === "gameover")) {
      startGame();
      return;
    }

    if (settings.mode === "2p") {
      if (key === "w") paddleLeft.y -= 16;
      if (key === "s") paddleLeft.y += 16;
      if (key === "arrowup") paddleRight.y -= 16;
      if (key === "arrowdown") paddleRight.y += 16;
      paddleLeft.y = Math.max(0, Math.min(BASE_H - paddleLeft.h, paddleLeft.y));
      paddleRight.y = Math.max(0, Math.min(BASE_H - paddleRight.h, paddleRight.y));
    }
  }, { signal });

  resetButton.addEventListener("click", () => {
    resetMatch();
    state = "playing";
    updateStatus();
  }, { signal });

  modeSelect.addEventListener("change", () => {
    saveSettings();
    resetMatch();
    state = "start";
    updateStatus();
  }, { signal });

  difficultySelect.addEventListener("change", () => {
    saveSettings();
  }, { signal });

  pointsSelect.addEventListener("change", () => {
    saveSettings();
  }, { signal });

  rampInput.addEventListener("change", () => {
    saveSettings();
  }, { signal });

  soundInput.addEventListener("change", () => {
    saveSettings();
  }, { signal });

  const stopLoop = startLoop({
    step: (dt) => update(dt),
    render: draw,
    isActive: () => content.isConnected,
  });

  const observer = new MutationObserver(() => {
    if (!content.isConnected) {
      observer.disconnect();
      controller.abort();
      resizeObserver.disconnect();
      stopLoop();
      audioCtx.close().catch(() => {});
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  updateStatus();

  return {
    title: "Paddle Duel",
    width: 600,
    height: 420,
    aspectRatio: BASE_W / BASE_H,
    content: wrapper,
  };
}
