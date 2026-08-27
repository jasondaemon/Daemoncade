import { createGameSurface, startLoop } from "../daemonos-shared/gameUtils.js";
import { createScoreOverlay, getBoardIdForGame, submitFinalScore } from "../daemonos-shared/scoreSystem.js";
import { audioRegistry } from "../daemonos-shared/audioRegistry.js";

export function createApp(osAPI) {
  const appId = "roadhopper";
  const BASE_W = 520;
  const BASE_H = 320;

  const { content, ctx, clear, resizeObserver } = createGameSurface({
    baseWidth: BASE_W,
    baseHeight: BASE_H,
    className: "game-canvas",
    fit: "contain",
  });
  content.style.position = "relative";
  const scoreOverlay = createScoreOverlay({
    parent: content,
    getBoard: () => getBoardIdForGame("roadhopper", "classic", "normal"),
    windowDays: 7,
    limit: 5,
  });

  const controller = new AbortController();
  const { signal } = controller;

  const modalOverlay = document.createElement("div");
  modalOverlay.style.position = "absolute";
  modalOverlay.style.inset = "0";
  modalOverlay.style.display = "none";
  modalOverlay.style.alignItems = "center";
  modalOverlay.style.justifyContent = "center";
  modalOverlay.style.background = "rgba(9, 14, 20, 0.55)";
  modalOverlay.style.color = "#e6edf6";
  modalOverlay.style.fontFamily = "'Avenir Next', sans-serif";
  modalOverlay.style.zIndex = "2";
  modalOverlay.style.textAlign = "center";
  modalOverlay.style.pointerEvents = "auto";

  const modalCard = document.createElement("div");
  modalCard.style.background = "rgba(18, 26, 36, 0.95)";
  modalCard.style.border = "1px solid rgba(255,255,255,0.15)";
  modalCard.style.borderRadius = "12px";
  modalCard.style.padding = "18px 22px";
  modalCard.style.minWidth = "200px";
  modalCard.style.boxShadow = "0 18px 40px rgba(0,0,0,0.45)";

  const modalTitle = document.createElement("div");
  modalTitle.style.fontSize = "18px";
  modalTitle.style.fontWeight = "600";
  modalTitle.style.marginBottom = "6px";

  const modalBody = document.createElement("div");
  modalBody.style.fontSize = "14px";
  modalBody.style.opacity = "0.8";
  modalBody.style.marginBottom = "12px";

  const modalButton = document.createElement("button");
  modalButton.type = "button";
  modalButton.textContent = "Start Over";
  modalButton.style.display = "none";
  modalButton.style.border = "none";
  modalButton.style.borderRadius = "8px";
  modalButton.style.padding = "8px 14px";
  modalButton.style.background = "linear-gradient(180deg,#5ab0ff,#2c78d4)";
  modalButton.style.color = "#f5faff";
  modalButton.style.cursor = "pointer";

  modalCard.appendChild(modalTitle);
  modalCard.appendChild(modalBody);
  modalCard.appendChild(modalButton);
  modalOverlay.appendChild(modalCard);
  content.appendChild(modalOverlay);

  const baseLanes = [
    { y: 80, speed: 1.2, width: 70, count: 3 },
    { y: 140, speed: -1.5, width: 60, count: 4 },
    { y: 200, speed: 1.1, width: 80, count: 3 },
  ];
  const baseSpeeds = baseLanes.map((lane) => lane.speed);

  let level = 1;
  let score = 0;
  let runStart = performance.now();
  let scoreSubmitted = false;
  let levelComplete = false;
  let advancing = false;
  let lives = 3;
  let paused = false;
  let modalTimeout = null;
  let modalOnClose = null;
  let soundEnabled = true;
  const colors = ["#f2c358", "#ff7aa2", "#7bd5ff", "#9be58a", "#ffd27a"];
  let audioActiveTimeout = null;
  const ribbitAudio = new Audio("./sfx/ribbit.mp3");
  const hitAudio = new Audio("./sfx/gothit.mp3");
  const winAudio = new Audio("./sfx/win.mp3");
  const gameOverAudio = new Audio("./sfx/gameover.mp3");
  [ribbitAudio, hitAudio, winAudio, gameOverAudio].forEach((audio) => {
    audio.preload = "auto";
    audioRegistry.registerMediaElement(appId, audio);
  });

  const markAudioActive = (durationMs) => {
    audioRegistry.setAudioActive(appId, true);
    if (audioActiveTimeout) clearTimeout(audioActiveTimeout);
    audioActiveTimeout = setTimeout(() => audioRegistry.setAudioActive(appId, false), durationMs);
  };

  const playRibbit = () => {
    if (!soundEnabled) return;
    ribbitAudio.currentTime = 0;
    ribbitAudio.play().catch(() => {});
    markAudioActive(300);
  };

  const playHit = () => {
    if (!soundEnabled) return;
    hitAudio.currentTime = 0;
    hitAudio.play().catch(() => {});
    markAudioActive(500);
  };

  const playWin = () => {
    if (!soundEnabled) return;
    winAudio.currentTime = 0;
    winAudio.play().catch(() => {});
    markAudioActive(700);
  };

  const playGameOver = () => {
    if (!soundEnabled) return;
    gameOverAudio.currentTime = 0;
    gameOverAudio.play().catch(() => {});
    markAudioActive(900);
  };

  const buildCars = () => {
    return baseLanes.flatMap((lane, laneIndex) => {
      return Array.from({ length: lane.count }).map((_, index) => {
        const length = lane.width + (index % 2 === 0 ? 20 : -10);
        return {
          x: index * 180,
          y: lane.y,
          width: length,
          height: 22,
          speed: lane.speed,
          color: colors[(laneIndex + index) % colors.length],
        };
      });
    });
  };

  let cars = buildCars();

  const player = { x: 240, y: 280, size: 16 };
  let alive = true;
  let victory = false;

  function reset() {
    player.x = 240;
    player.y = 280;
    alive = true;
    victory = false;
    levelComplete = false;
    advancing = false;
    paused = false;
  }

  function resetGame() {
    level = 1;
    score = 0;
    lives = 3;
    runStart = performance.now();
    scoreSubmitted = false;
    baseLanes.forEach((lane, idx) => {
      lane.speed = baseSpeeds[idx];
    });
    cars = buildCars();
    reset();
  }

  function nextLevel() {
    level += 1;
    baseLanes.forEach((lane, idx) => {
      const direction = Math.sign(baseSpeeds[idx]) || 1;
      const speed = Math.min(4.2, Math.abs(baseSpeeds[idx]) * (1 + (level - 1) * 0.12));
      lane.speed = speed * direction;
    });
    cars = buildCars();
    reset();
  }

  const playSound = (type) => {
    if (type === "ribbit") playRibbit();
    if (type === "hit") playHit();
    if (type === "win") playWin();
    if (type === "gameover") playGameOver();
  };

  document.addEventListener(
    "keydown",
    (event) => {
      if (!alive || victory || paused) return;
      const step = 20;
      if (event.key === "ArrowUp") {
        player.y -= step;
        playRibbit();
      }
      if (event.key === "ArrowDown") {
        player.y += step;
        playRibbit();
      }
      if (event.key === "ArrowLeft") {
        player.x -= step;
        playRibbit();
      }
      if (event.key === "ArrowRight") {
        player.x += step;
        playRibbit();
      }
      player.x = Math.max(10, Math.min(BASE_W - 10, player.x));
      player.y = Math.max(20, Math.min(BASE_H - 10, player.y));
      score += 1;
    },
    { signal }
  );

  function updateCars() {
    cars.forEach((car) => {
      car.x += car.speed;
      if (car.speed > 0 && car.x > BASE_W + car.width) car.x = -car.width;
      if (car.speed < 0 && car.x < -car.width) car.x = BASE_W + car.width;
    });
  }

  function checkCollision() {
    cars.forEach((car) => {
      if (
        player.x + player.size > car.x &&
        player.x - player.size < car.x + car.width &&
        player.y + player.size > car.y &&
        player.y - player.size < car.y + car.height
      ) {
        alive = false;
      }
    });
  }

  function hideModal() {
    modalOverlay.style.display = "none";
    paused = false;
  }

  function showModal({
    title,
    body = "",
    duration = 1000,
    buttonLabel = "",
    onButton = null,
    onClose = null,
  }) {
    if (modalTimeout) clearTimeout(modalTimeout);
    modalOnClose = onClose;
    modalTitle.textContent = title;
    modalBody.textContent = body;
    modalButton.style.display = buttonLabel ? "inline-flex" : "none";
    modalButton.textContent = buttonLabel || "Start Over";
    modalButton.onclick = onButton;
    modalOverlay.style.display = "flex";
    paused = true;
    if (duration > 0) {
      modalTimeout = setTimeout(() => {
        const onClose = modalOnClose;
        hideModal();
        modalOnClose = null;
        if (onClose) onClose();
      }, duration);
    }
  }

  function draw() {
    clear();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#0f1720";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    ctx.fillStyle = "#1a2532";
    ctx.fillRect(0, 60, BASE_W, 180);

    cars.forEach((car) => {
      ctx.fillStyle = car.color;
      ctx.fillRect(car.x, car.y, car.width, car.height);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(car.x + 6, car.y + 4, car.width * 0.35, 6);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(car.x + car.width - 12, car.y + 6, 8, 8);
    });

    const frogBase = victory ? "#9be58a" : alive ? "#6ef0c4" : "#f05f57";
    ctx.fillStyle = frogBase;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = frogBase;
    ctx.beginPath();
    ctx.arc(player.x - 9, player.y - 10, 5, 0, Math.PI * 2);
    ctx.arc(player.x + 9, player.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b2a40";
    ctx.beginPath();
    ctx.arc(player.x - 9, player.y - 10, 2, 0, Math.PI * 2);
    ctx.arc(player.x + 9, player.y - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1b2a40";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y + 2, 7, 0, Math.PI);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "14px 'Avenir Next', sans-serif";
    ctx.fillText(`Level ${level}`, 14, 24);
    ctx.fillText(`Score ${score}`, 14, 44);

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`Lives ${lives}`, 14, 64);
  }

  const step = () => {
    if (alive && !victory && !paused) {
      updateCars();
      checkCollision();
      if (player.y < 40 && !levelComplete) {
        victory = true;
        levelComplete = true;
        score += 100;
        playSound("win");
        showModal({
          title: "Next Level",
          duration: 1000,
          onClose: () => {
            victory = false;
            nextLevel();
          },
        });
      }
    }
    if (!alive && !advancing) {
      advancing = true;
      lives -= 1;
      if (lives > 0) {
        playSound("hit");
        showModal({
          title: "Oops",
          duration: 1000,
          onClose: () => {
            reset();
          },
        });
      } else {
        playSound("gameover");
        if (!scoreSubmitted) {
          scoreSubmitted = true;
          submitFinalScore({
            board: getBoardIdForGame("roadhopper", "classic", "normal"),
            score,
            runMs: Math.floor(performance.now() - runStart),
          }).catch(() => {});
          scoreOverlay.refresh();
          scoreOverlay.show("Road Hopper", "Top Scores (7 days)");
        }
        showModal({
          title: "Game Over",
          body: `Score ${score}`,
          duration: 0,
          buttonLabel: "Start Over",
          onButton: () => {
            hideModal();
            resetGame();
          },
        });
      }
    }
  };

  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay && modalButton.style.display === "none") {
      hideModal();
    }
  });

  const observer = new MutationObserver(() => {
    if (!content.isConnected) {
      observer.disconnect();
      controller.abort();
      resizeObserver.disconnect();
      if (modalTimeout) clearTimeout(modalTimeout);
      if (audioActiveTimeout) clearTimeout(audioActiveTimeout);
      audioRegistry.clear(appId);
      [ribbitAudio, hitAudio, winAudio, gameOverAudio].forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  osAPI?.registerAppMenu?.("roadhopper", {
    appName: "Road Hopper",
    menus: [
      {
        title: "Road Hopper",
        items: [
          { label: "About Road Hopper" },
          {
            label: "Sound",
            type: "checkbox",
            checked: soundEnabled,
            onToggle: (value) => {
              soundEnabled = value;
            },
          },
        ],
      },
      { title: "Edit", items: [{ label: "Undo", disabled: true }] },
      { title: "View", items: [{ label: "Zoom In", disabled: true }] },
      { title: "Window", items: [{ label: "Minimize", disabled: true }] },
      { title: "Help", items: [{ label: "Road Hopper Help", disabled: true }] },
    ],
  });

  let stopLoop = startLoop({
    step,
    render: draw,
    isActive: () => content.isConnected,
  });

  return {
    title: "Road Hopper",
    width: 560,
    height: 360,
    aspectRatio: BASE_W / BASE_H,
    content,
    onSuspend: () => {
      stopLoop?.();
    },
    onResume: () => {
      stopLoop = startLoop({ step, render: draw, isActive: () => content.isConnected });
    },
  };
}
