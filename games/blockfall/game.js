(() => {
  const COLS = 10;
  const ROWS = 20;
  const HIDDEN = 2;
  const TOTAL_ROWS = ROWS + HIDDEN;
  const localStorageKey = "iiab-overland-blockfall";
  const musicStorageKey = "iiab-overland-blockfall-music";
  const soundStorageKey = "iiab-overland-blockfall-sound";
  const themeStorageKey = "iiab-overland-blockfall-theme";
  const audioBase = "./audio/";
  const musicTracks = {
    grid: { label: "The Grid", src: `${audioBase}thegrid.mp3` },
    korobeiniki: { label: "Korobeiniki", src: `${audioBase}korobeiniki.mp3` },
    korobeinikiGb: { label: "Korobeiniki GB", src: `${audioBase}korobeiniki-gb.mp3` },
    adventure: { label: "Adventure", src: `${audioBase}adventure.mp3` },
    casey: { label: "Casey", src: `${audioBase}casey.mp3` },
    midnight: { label: "Midnight Run", src: `${audioBase}midnightrun.mp3` },
  };
  const themeMusicDefaults = {
    modern: "grid",
    eightbit: "korobeiniki",
    gameboy: "korobeinikiGb",
  };
  const soundEffects = {
    rotate: `${audioBase}rotate_piece.mp3`,
    clear: `${audioBase}clear_line.mp3`,
    lose: `${audioBase}lose.mp3`,
    move: `${audioBase}move_piece.mp3`,
    four: `${audioBase}4_lines.mp3`,
    garbage: `${audioBase}garbage.mp3`,
    land: `${audioBase}land.mp3`,
  };
  const palettes = {
    modern: { I: "#39d9ff", O: "#ffd33d", T: "#bd63ff", S: "#48e267", Z: "#ff4052", J: "#477cff", L: "#ff7b2f", G: "#66717c" },
    eightbit: { I: "#f1f1e8", O: "#c73d31", T: "#777b7b", S: "#f1f1e8", Z: "#c73d31", J: "#777b7b", L: "#c73d31", G: "#5f6464" },
    gameboy: { I: "#365e2d", O: "#577a35", T: "#294b2a", S: "#416b32", Z: "#244426", J: "#4e7334", L: "#31552b", G: "#52683d" },
  };
  const levelSchemes = {
    eightbit: [
      { colors: palettes.eightbit, accent: "#d84b48", accent2: "#9de8e7", gold: "#f1f1e8" },
      { colors: { I: "#58c8d8", O: "#334fc2", T: "#f1f1e8", S: "#58c8d8", Z: "#334fc2", J: "#f1f1e8", L: "#334fc2", G: "#626767" }, accent: "#334fc2", accent2: "#58c8d8", gold: "#f1f1e8" },
      { colors: { I: "#f0c83f", O: "#3aa85d", T: "#f1f1e8", S: "#f0c83f", Z: "#3aa85d", J: "#f1f1e8", L: "#3aa85d", G: "#626767" }, accent: "#3aa85d", accent2: "#f0c83f", gold: "#f1f1e8" },
      { colors: { I: "#df7135", O: "#6d45bb", T: "#f1f1e8", S: "#df7135", Z: "#6d45bb", J: "#f1f1e8", L: "#6d45bb", G: "#626767" }, accent: "#6d45bb", accent2: "#df7135", gold: "#f1f1e8" },
      { colors: { I: "#e45b87", O: "#39aebc", T: "#f1f1e8", S: "#e45b87", Z: "#39aebc", J: "#f1f1e8", L: "#39aebc", G: "#626767" }, accent: "#e45b87", accent2: "#39aebc", gold: "#f1f1e8" },
    ],
    modern: [
      { colors: palettes.modern, accent: "#b88cff", accent2: "#65dfff", gold: "#ffd166" },
      { colors: { I: "#5af2d0", O: "#ffe66d", T: "#4ca5ff", S: "#70ef84", Z: "#ff637d", J: "#3478e5", L: "#ff9a47", G: "#66717c" }, accent: "#33e1bd", accent2: "#4ca5ff", gold: "#ffe66d" },
      { colors: { I: "#ff77c8", O: "#ffcb56", T: "#9d6cff", S: "#54e0a0", Z: "#ff5364", J: "#6878ff", L: "#ff8d55", G: "#66717c" }, accent: "#ff5fbd", accent2: "#9d6cff", gold: "#ffcb56" },
      { colors: { I: "#7ce8ff", O: "#f7ff69", T: "#ff756d", S: "#79ef68", Z: "#ff3d58", J: "#3f94ff", L: "#ffb23f", G: "#66717c" }, accent: "#ff6b55", accent2: "#7ce8ff", gold: "#f7ff69" },
      { colors: { I: "#b9f35a", O: "#ffda57", T: "#50dbff", S: "#5effa8", Z: "#ff648b", J: "#5e7dff", L: "#ff954b", G: "#66717c" }, accent: "#9ee84c", accent2: "#50dbff", gold: "#ffda57" },
    ],
  };
  let colors = palettes.modern;
  const shapeData = {
    I: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]], [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]]],
    O: [[[1, 0], [2, 0], [1, 1], [2, 1]]],
    T: [[[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]]],
    S: [[[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]]],
    Z: [[[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]]],
    J: [[[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]]],
    L: [[[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]], [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]]],
  };
  const lineScores = [0, 100, 300, 500, 800];
  const state = {
    profile: { id: "", name: "Player" },
    selectedMode: "endless",
    duration: 120,
    gameId: "",
    playerMark: "",
    remoteGame: null,
    battlePoll: null,
    publishTimer: null,
    running: false,
    paused: false,
    over: false,
    mode: "endless",
    board: [],
    piece: null,
    nextShape: "I",
    holdShape: "",
    holdUsed: false,
    bag: [],
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    maxCombo: 0,
    pendingGarbage: 0,
    garbageSentSinceSync: 0,
    garbageAppliedSinceSync: 0,
    startTime: 0,
    timeLimit: 0,
    lastTick: 0,
    dropAccumulator: 0,
    raf: 0,
    lastPublish: 0,
    matchId: "",
    scoreRecorded: false,
    musicChoice: "",
    musicAudio: null,
    clearAnimation: null,
    sound: localStorage.getItem(soundStorageKey) !== "off",
    pauseStarted: 0,
    theme: "modern",
  };
  const $ = (id) => document.getElementById(id);
  const boardCanvas = $("boardCanvas");
  const boardCtx = boardCanvas.getContext("2d");
  const nextCtx = $("nextCanvas").getContext("2d");
  const holdCtx = $("holdCanvas").getContext("2d");
  const attractCanvas = $("attractCanvas");
  const attractCtx = attractCanvas.getContext("2d");
  const effectsApp = new PIXI.Application({ width: 300, height: 600, backgroundAlpha: 0, antialias: false, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
  const effectsRoot = new PIXI.Container();
  const particles = [];
  $("effectsLayer").appendChild(effectsApp.view);
  effectsApp.stage.addChild(effectsRoot);

  function cleanName(value) {
    return String(value || "").replace(/[\x00-\x1f]+/g, "").trim().slice(0, 24);
  }

  function loadProfile() {
    state.profile = { id: "local", name: "Player" };
    $("playerNameLabel").textContent = state.profile.name;
  }

  function message(text, error = false) {
    $("message").textContent = text || "";
    $("message").style.color = error ? "var(--red)" : "var(--gold)";
  }

  function initAudio() {
    state.musicChoice = localStorage.getItem(musicStorageKey) || themeMusicDefaults[state.theme];
    if (!musicTracks[state.musicChoice]) state.musicChoice = themeMusicDefaults[state.theme];
    $("musicSelect").value = state.musicChoice;
    $("gameMusicSelect").value = state.musicChoice;
    state.musicAudio = new Audio();
    state.musicAudio.preload = "auto";
    state.musicAudio.loop = true;
    state.musicAudio.volume = 0.45;
    state.musicAudio.defaultPlaybackRate = 1;
    state.musicAudio.playbackRate = 1;
    state.musicAudio.preservesPitch = true;
    const beginMusic = () => {
      if (!state.running && state.musicChoice && state.musicAudio.paused) setMusic(state.musicChoice, true);
    };
    document.addEventListener("pointerdown", beginMusic, { once: true, capture: true });
    document.addEventListener("keydown", beginMusic, { once: true, capture: true });
  }

  function applyTheme(choice, selectThemeMusic = false) {
    state.theme = palettes[choice] ? choice : "modern";
    document.body.dataset.theme = state.theme;
    localStorage.setItem(themeStorageKey, state.theme);
    document.querySelectorAll("[data-theme-choice]").forEach(button => button.classList.toggle("active", button.dataset.themeChoice === state.theme));
    syncLevelTheme(false);
    if (selectThemeMusic && state.musicAudio) setMusic(themeMusicDefaults[state.theme], true);
    draw();
    drawAttract(performance.now());
  }

  function syncLevelTheme(animate = true) {
    const schemes = levelSchemes[state.theme];
    if (!schemes) {
      colors = palettes.gameboy;
      ["--accent", "--accent2", "--gold", "--line"].forEach(name => document.body.style.removeProperty(name));
      return;
    }
    const scheme = schemes[(Math.max(1, state.level) - 1) % schemes.length];
    colors = scheme.colors;
    document.body.style.setProperty("--accent", scheme.accent);
    document.body.style.setProperty("--accent2", scheme.accent2);
    document.body.style.setProperty("--gold", scheme.gold);
    document.body.style.setProperty("--line", `${scheme.accent}66`);
    if (animate && state.running) {
      const panel = $("gamePanel"); panel.classList.remove("level-palette-shift"); void panel.offsetWidth; panel.classList.add("level-palette-shift");
      window.setTimeout(() => panel.classList.remove("level-palette-shift"), 720);
    }
  }

  function playEffect(name, volume = 0.72) {
    if (!state.sound) return;
    const src = soundEffects[name];
    if (!src) return;
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
    audio.preservesPitch = true;
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  function updateSoundButton() {
    $("soundToggle").textContent = state.sound ? "🔊" : "🔇";
    $("soundToggle").setAttribute("aria-pressed", String(state.sound));
    $("soundToggle").setAttribute("aria-label", state.sound ? "Mute sound effects" : "Enable sound effects");
    $("soundToggle").title = state.sound ? "Mute sound effects" : "Enable sound effects";
  }

  function effectMetrics() {
    const width = effectsApp.screen.width, height = effectsApp.screen.height, cell = Math.min(width / COLS, height / ROWS);
    return { cell, ox: (width - cell * COLS) / 2, oy: (height - cell * ROWS) / 2 };
  }

  function burstAt(x, y, color, count = 8, force = 1) {
    const resolvedColor = typeof color === "string" ? Number.parseInt(color.replace("#", ""), 16) : color;
    for (let i = 0; i < count; i += 1) {
      const graphic = new PIXI.Graphics(), size = 1.5 + Math.random() * 3.5, angle = -Math.PI + Math.random() * Math.PI, speed = (35 + Math.random() * 105) * force;
      graphic.beginFill(resolvedColor, .95);graphic.drawRect(-size / 2, -size / 2, size, size);graphic.endFill();graphic.position.set(x, y);effectsRoot.addChild(graphic);
      particles.push({ graphic, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 25 * force, gravity: 190, age: 0, life: .28 + Math.random() * .42, spin: (Math.random() - .5) * 9 });
    }
  }

  function landEffect(cells, color, sealed = false) {
    const { cell, ox, oy } = effectMetrics();
    cells.filter(([, y]) => y >= HIDDEN).forEach(([x, y]) => burstAt(ox + (x + .5) * cell, oy + (y - HIDDEN + .88) * cell, sealed ? 0xffd166 : color, sealed ? 7 : 3, sealed ? 1.15 : .55));
    const wrap = boardCanvas.closest(".board-wrap");wrap.classList.remove("impact", "seal-impact");void wrap.offsetWidth;wrap.classList.add(sealed ? "seal-impact" : "impact");
  }

  function dropTrail(fromPiece, toPiece) {
    if (!fromPiece || !toPiece || toPiece.y - fromPiece.y < 3) return;
    const { cell, ox, oy } = effectMetrics(), x = ox + (toPiece.x + 1.5) * cell, start = Math.max(HIDDEN, fromPiece.y + 1), end = Math.max(start, toPiece.y);
    for (let y = start; y <= end; y += Math.max(2, Math.floor((end - start) / 5))) burstAt(x + (Math.random() - .5) * cell * 1.4, oy + (y - HIDDEN + .5) * cell, colors.T, 2, .35);
  }

  function lineEffect(lines, tetris = false) {
    const { cell, ox, oy } = effectMetrics();
    lines.forEach(y => { if (y < HIDDEN) return; for (let x = 0; x < COLS; x += 1) burstAt(ox + (x + .5) * cell, oy + (y - HIDDEN + .5) * cell, tetris ? 0xffd166 : colors[state.board[y]?.[x]] || 0xf5fbef, tetris ? 4 : 2, tetris ? 1.2 : .8); });
    if (tetris) cabinetTetrisEffect();
  }

  function cabinetTetrisEffect() {
    const panel = $("gamePanel"), boardRect = boardCanvas.getBoundingClientRect(), panelRect = panel.getBoundingClientRect(), controlsRect = document.querySelector(".touch-controls").getBoundingClientRect();
    panel.classList.remove("tetris-cabinet-flash"); void panel.offsetWidth; panel.classList.add("tetris-cabinet-flash");
    const palette = Object.values(colors).slice(0, 7), reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches, count = reduced ? 18 : 72;
    for (let i = 0; i < count; i += 1) {
      const bit = document.createElement("i"), size = state.theme === "eightbit" ? 7 + Math.floor(Math.random() * 5) : 5 + Math.random() * 7;
      bit.className = "cabinet-particle"; bit.style.width = `${size}px`; bit.style.height = `${size}px`; bit.style.background = palette[i % palette.length]; panel.appendChild(bit);
      let x = boardRect.left - panelRect.left + boardRect.width * (.12 + Math.random() * .76), y = boardRect.bottom - panelRect.top - 8;
      let vx = (Math.random() - .5) * 520, vy = -260 - Math.random() * 530, rotation = Math.random() * 180;
      const floor = Math.min(panelRect.height - 18, controlsRect.top - panelRect.top + Math.random() * Math.max(16, controlsRect.height * .7));
      const frames = [], steps = 26, dt = .055;
      for (let step = 0; step <= steps; step += 1) {
        frames.push({ transform: `translate(${x}px,${y}px) rotate(${rotation}deg)`, opacity: step < steps - 4 ? 1 : (steps - step) / 4 });
        vy += 980 * dt; x += vx * dt; y += vy * dt; rotation += (vx > 0 ? 1 : -1) * 22;
        if (x < 5) { x = 5; vx = Math.abs(vx) * .72; } else if (x > panelRect.width - size - 5) { x = panelRect.width - size - 5; vx = -Math.abs(vx) * .72; }
        if (y > floor) { y = floor; vy = -Math.abs(vy) * (.38 + Math.random() * .24); vx *= .8; }
      }
      bit.animate(frames, { duration: 1500 + Math.random() * 450, easing: "linear", fill: "forwards" }).finished.finally(() => bit.remove());
    }
    window.setTimeout(() => panel.classList.remove("tetris-cabinet-flash"), 760);
  }

  function countHoles(board = state.board) {
    let holes = 0;
    for (let x = 0; x < COLS; x += 1) { let covered = false; for (let y = 0; y < TOTAL_ROWS; y += 1) { if (board[y][x]) covered = true; else if (covered) holes += 1; } }
    return holes;
  }

  effectsApp.ticker.add(delta => {
    const dt = Math.min(.035, effectsApp.ticker.deltaMS / 1000);
    for (let i = particles.length - 1; i >= 0; i -= 1) { const p = particles[i];p.age += dt;p.vy += p.gravity * dt;p.graphic.x += p.vx * dt;p.graphic.y += p.vy * dt;p.graphic.rotation += p.spin * dt;p.graphic.alpha = Math.max(0, 1 - p.age / p.life);if (p.age >= p.life) { effectsRoot.removeChild(p.graphic);p.graphic.destroy();particles.splice(i, 1); } }
  });

  function musicSourceMatches(src) {
    if (!state.musicAudio?.currentSrc) return false;
    return state.musicAudio.currentSrc === new URL(src, window.location.href).href;
  }

  function setMusic(choice, preview = false) {
    state.musicChoice = musicTracks[choice] ? choice : "";
    localStorage.setItem(musicStorageKey, state.musicChoice);
    $("musicSelect").value = state.musicChoice;
    $("gameMusicSelect").value = state.musicChoice;
    if (!state.musicAudio) return;
    state.musicAudio.pause();
    state.musicAudio.currentTime = 0;
    if (!state.musicChoice) return;
    const src = musicTracks[state.musicChoice].src;
    if (!musicSourceMatches(src)) state.musicAudio.src = src;
    state.musicAudio.playbackRate = 1;
    state.musicAudio.volume = preview ? 0.55 : 0.28;
    state.musicAudio.play().catch(() => {});
  }

  function startGameplayMusic() {
    if (!state.musicAudio || !state.musicChoice) return;
    const src = musicTracks[state.musicChoice].src;
    if (!musicSourceMatches(src)) {
      state.musicAudio.src = src;
      state.musicAudio.currentTime = 0;
    }
    state.musicAudio.playbackRate = 1;
    state.musicAudio.volume = 0.28;
    if (state.musicAudio.paused) state.musicAudio.play().catch(() => {});
  }

  function stopMusic() {
    if (!state.musicAudio) return;
    state.musicAudio.pause();
    state.musicAudio.currentTime = 0;
  }

  function emptyBoard() {
    return Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(""));
  }

  function shuffle(values) {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function nextFromBag() {
    if (!state.bag.length) state.bag = shuffle(Object.keys(shapeData));
    return state.bag.pop();
  }

  function newPiece(shape = nextFromBag()) {
    return { shape, rot: 0, x: shape === "I" ? 3 : 3, y: 0 };
  }

  function pieceCells(piece = state.piece) {
    if (!piece) return [];
    const rotations = shapeData[piece.shape];
    return rotations[piece.rot % rotations.length].map(([x, y]) => [piece.x + x, piece.y + y]);
  }

  function collides(piece = state.piece, board = state.board) {
    return pieceCells(piece).some(([x, y]) => x < 0 || x >= COLS || y >= TOTAL_ROWS || (y >= 0 && board[y]?.[x]));
  }

  function spawn() {
    state.holdUsed = false;
    state.piece = newPiece(state.nextShape);
    state.nextShape = nextFromBag();
    if (collides(state.piece)) {
      endGame("Top out");
      return false;
    }
    return true;
  }

  function resetEngine(mode, duration = 0) {
    state.mode = mode;
    state.board = emptyBoard();
    state.bag = [];
    state.nextShape = nextFromBag();
    state.holdShape = "";
    state.holdUsed = false;
    state.score = 0;
    state.lines = 0;
    state.level = 1;
    syncLevelTheme(false);
    state.combo = -1;
    state.maxCombo = 0;
    state.pendingGarbage = 0;
    state.garbageSentSinceSync = 0;
    state.garbageAppliedSinceSync = 0;
    state.running = true;
    state.paused = false;
    state.over = false;
    state.startTime = performance.now();
    state.timeLimit = duration ? Number(duration) * 1000 : 0;
    state.lastTick = performance.now();
    state.dropAccumulator = 0;
    state.matchId = `blockfall-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.scoreRecorded = false;
    state.clearAnimation = null;
    state.pauseStarted = 0;
    spawn();
    startGameplayMusic();
    document.body.classList.add("playing");
    $("lobby").hidden = true;
    $("gamePanel").hidden = false;
    $("overlay").hidden = true;
    $("resumeGame").hidden = false;
    updateStatus();
    resizeCanvases();
    saveLocal();
    requestAnimationFrame(loop);
  }

  function visiblePreview() {
    return state.board.slice(HIDDEN).map((row) => row.map(Boolean));
  }

  function move(dx, dy, scoreDrop = false) {
    if (!canAct()) return false;
    const next = { ...state.piece, x: state.piece.x + dx, y: state.piece.y + dy };
    if (collides(next)) return false;
    state.piece = next;
    if (scoreDrop && dy > 0) state.score += 1;
    if (dx || scoreDrop) playEffect("move", 0.48);
    updateStatus();
    return true;
  }

  function rotate(dir = 1) {
    if (!canAct()) return;
    const rotations = shapeData[state.piece.shape].length;
    const base = { ...state.piece, rot: (state.piece.rot + dir + rotations) % rotations };
    const kicks = [[0, 0], [1, 0], [-1, 0], [2, 0], [-2, 0], [0, -1], [1, -1], [-1, -1]];
    for (const [kx, ky] of kicks) {
      const kicked = { ...base, x: base.x + kx, y: base.y + ky };
      if (!collides(kicked)) {
        state.piece = kicked;
        playEffect("rotate", 0.58);
        updateStatus();
        return;
      }
    }
  }

  function hardDrop() {
    if (!canAct()) return;
    const origin = { ...state.piece };
    let rows = 0;
    while (move(0, 1, false)) rows += 1;
    dropTrail(origin, state.piece);
    state.score += rows * 2;
    lockPiece();
  }

  function holdPiece() {
    if (!canAct() || state.holdUsed) return;
    const current = state.piece.shape;
    if (state.holdShape) {
      state.piece = newPiece(state.holdShape);
      state.holdShape = current;
    } else {
      state.holdShape = current;
      state.piece = newPiece(state.nextShape);
      state.nextShape = nextFromBag();
    }
    state.holdUsed = true;
    if (collides(state.piece)) endGame("Top out");
    updateStatus();
  }

  function lockPiece() {
    if (!state.piece || state.over) return;
    const lockedCells = pieceCells(), lockedColor = colors[state.piece.shape] || colors.G, holesBefore = countHoles();
    lockedCells.forEach(([x, y]) => {
      if (y >= 0 && y < TOTAL_ROWS && x >= 0 && x < COLS) state.board[y][x] = state.piece.shape;
    });
    const sealed = countHoles() < holesBefore;
    landEffect(lockedCells, lockedColor, sealed);
    const fullLines = findFullLines();
    state.piece = null;
    if (fullLines.length) {
      state.clearAnimation = {
        lines: fullLines,
        start: performance.now(),
        duration: fullLines.length >= 4 ? 620 : 420,
        tetris: fullLines.length >= 4,
      };
      const garbage = garbageForClear(fullLines.length);
      if (garbage) state.garbageSentSinceSync += garbage;
      lineEffect(fullLines, fullLines.length >= 4);
      playEffect(fullLines.length >= 4 ? "four" : "clear", fullLines.length >= 4 ? 0.84 : 0.68);
    } else {
      playEffect("land", 0.54);
      applyQueuedGarbage();
      spawn();
      saveLocal();
    }
    updateStatus();
  }

  function findFullLines() {
    const lines = [];
    for (let y = 0; y < state.board.length; y += 1) {
      if (state.board[y].every(Boolean)) lines.push(y);
    }
    return lines;
  }

  function finishLineClear() {
    if (!state.clearAnimation) return;
    const lines = [...state.clearAnimation.lines].sort((a, b) => b - a);
    const cleared = lines.length;
    lines.forEach((y) => state.board.splice(y, 1));
    for (let i = 0; i < cleared; i += 1) state.board.unshift(Array(COLS).fill(""));
    if (cleared) {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.lines += cleared;
      const previousLevel = state.level;
      state.level = 1 + Math.floor(state.lines / 10);
      if (state.level !== previousLevel) syncLevelTheme(true);
      state.score += lineScores[cleared] || 0;
      if (state.combo > 0) state.score += 50 * state.combo;
    } else {
      state.combo = -1;
    }
    state.clearAnimation = null;
    spawn();
    updateStatus();
    saveLocal();
  }

  function garbageForClear(lines) {
    let amount = lines === 2 ? 1 : lines === 3 ? 2 : lines >= 4 ? 4 : 0;
    if (amount && state.combo >= 2) amount += 1;
    return amount;
  }

  function applyQueuedGarbage() {
    if (!state.pendingGarbage) return;
    const amount = Math.min(8, state.pendingGarbage);
    state.pendingGarbage -= amount;
    state.garbageAppliedSinceSync += amount;
    for (let i = 0; i < amount; i += 1) {
      const hole = Math.floor(Math.random() * COLS);
      state.board.shift();
      state.board.push(Array.from({ length: COLS }, (_, x) => (x === hole ? "" : "G")));
    }
    playEffect("garbage", 0.76);
    if (state.board.slice(0, HIDDEN).some((row) => row.some(Boolean))) endGame("Garbage top out");
  }

  function canAct() {
    return state.running && !state.paused && !state.over && !state.clearAnimation && state.piece;
  }

  function dropInterval() {
    return Math.max(120, 850 - (state.level - 1) * 55);
  }

  function loop(now) {
    if (!state.running) return;
    const dt = now - state.lastTick;
    state.lastTick = now;
    if (!state.paused && !state.over) {
      if (state.clearAnimation && now - state.clearAnimation.start >= state.clearAnimation.duration) {
        finishLineClear();
      } else if (state.timeLimit && now - state.startTime >= state.timeLimit) {
        endGame("Timer complete");
      } else {
        state.dropAccumulator += dt;
        if (state.dropAccumulator >= dropInterval()) {
          state.dropAccumulator = 0;
          if (!move(0, 1)) lockPiece();
        }
      }
    }
    draw();
    state.raf = requestAnimationFrame(loop);
  }

  function elapsedSeconds() {
    return Math.max(0, Math.floor(((state.paused ? state.pauseStarted : performance.now()) - state.startTime) / 1000));
  }

  function timeText() {
    if (state.timeLimit) {
      const remaining = Math.max(0, Math.ceil((state.timeLimit - ((state.paused ? state.pauseStarted : performance.now()) - state.startTime)) / 1000));
      return formatTime(remaining);
    }
    return formatTime(elapsedSeconds());
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function pauseGame(show = true) {
    if (!state.running || state.over) return;
    if (show && !state.paused) state.pauseStarted = performance.now();
    if (!show && state.paused) {
      const pausedFor = Math.max(0, performance.now() - state.pauseStarted);
      state.startTime += pausedFor;
      if (state.clearAnimation) state.clearAnimation.start += pausedFor;
      state.lastTick = performance.now();
      state.pauseStarted = 0;
    }
    state.paused = show;
    if (show) showOverlay("Paused", "Resume when ready.", true);
    else $("overlay").hidden = true;
    updateStatus();
  }

  function endGame(reason = "Game over") {
    if (state.over) return;
    state.over = true;
    state.running = false;
    playEffect("lose", 0.82);
    stopMusic();
    document.body.classList.remove("playing");
    updateStatus(reason);
    showOverlay(state.mode.includes("battle") ? "Battle Over" : "Game Over", `${reason}. Score ${state.score}.`, false);
    if (state.mode === "endless" || state.mode === "timed") recordSoloScore();
    if (state.mode.includes("battle")) publishBattleUpdate(true);
    saveLocal();
  }

  function showOverlay(title, text, resumable) {
    $("overlayTitle").textContent = title;
    $("overlayText").textContent = text || "";
    $("resumeGame").hidden = !resumable;
    $("overlay").hidden = false;
  }

  function recordSoloScore() {
    if (state.scoreRecorded) return;
    state.scoreRecorded = true;
    window.GameScores?.record({ game: "blockfall", mode: state.mode, difficulty: state.mode, metric: "score", value: state.score, meta: { lines: state.lines, level: state.level, maxCombo: state.maxCombo, survival: elapsedSeconds() } });
    updateLobbyRecords();
    message("Score saved on this device.");
  }

  function updateStatus(extra = "") {
    $("score").textContent = String(state.score);
    $("lines").textContent = String(state.lines);
    $("level").textContent = String(state.level);
    $("timeLeft").textContent = timeText();
    $("garbageCount").textContent = String(state.pendingGarbage);
    $("garbagePanel").hidden = !state.mode.includes("battle");
    const modeLabel = state.mode === "timed" ? "Timed Solo" : state.mode === "endless" ? "Solo Endless" : state.mode === "timed-battle" ? "Timed Battle" : "Battle";
    $("gameState").textContent = state.paused ? "Paused" : state.over ? "Complete" : modeLabel;
    $("gameStatus").textContent = extra || (state.mode.includes("battle") && state.remoteGame?.status === "waiting" ? "Waiting for another player." : "");
    const pauseButton = document.querySelector('[data-control="pause"]');
    pauseButton.textContent = state.paused ? "▶" : "Ⅱ";
    pauseButton.setAttribute("aria-label", state.paused ? "Resume game" : "Pause game");
    pauseButton.title = state.paused ? "Resume" : "Pause";
    renderOpponents();
  }

  function saveLocal() {
    if (state.mode.includes("battle")) return;
    localStorage.setItem(localStorageKey, JSON.stringify({
      mode: state.mode,
      score: state.score,
      lines: state.lines,
      level: state.level,
      maxCombo: state.maxCombo,
      over: state.over,
      recorded: state.scoreRecorded,
    }));
  }

  function resizeCanvases() {
    const rect = boardCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    boardCanvas.width = Math.max(220, Math.floor(rect.width * ratio));
    boardCanvas.height = Math.max(440, Math.floor(rect.height * ratio));
    const effectsLayer = $("effectsLayer");
    effectsLayer.style.left = `${boardCanvas.offsetLeft}px`;
    effectsLayer.style.top = `${boardCanvas.offsetTop}px`;
    effectsLayer.style.width = `${rect.width}px`;
    effectsLayer.style.height = `${rect.height}px`;
    effectsApp.renderer.resize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
    [nextCtx, holdCtx].forEach((ctx) => {
      const canvas = ctx.canvas;
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.max(80, Math.floor(box.width * ratio));
      canvas.height = Math.max(80, Math.floor(box.height * ratio));
    });
    draw();
  }

  function drawCell(ctx, x, y, size, fill, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const gap = Math.max(1, Math.round(size * .055));
    const px = Math.max(1, Math.round(size * .1));
    if (state.theme === "gameboy") {
      ctx.fillStyle = fill; ctx.fillRect(x + gap, y + gap, size - gap * 2, size - gap * 2);
      ctx.strokeStyle = "#18361f"; ctx.lineWidth = Math.max(1, Math.round(size * .07)); ctx.strokeRect(x + gap, y + gap, size - gap * 2, size - gap * 2);
      ctx.fillStyle = "rgba(190,213,105,.24)"; ctx.fillRect(x + gap + px, y + gap + px, size - gap * 2 - px * 2, size - gap * 2 - px * 2);
      ctx.fillStyle = "rgba(17,48,25,.28)"; ctx.fillRect(x + gap + px, y + size - gap - px * 1.4, size - gap * 2 - px * 2, px * .55);
      const dot = Math.max(1, Math.round(size * .055)), step = dot * 4, variant = (Math.round(x / size) + Math.round(y / size)) & 3;
      ctx.fillStyle = variant === 1 ? "rgba(216,228,165,.2)" : "rgba(20,53,28,.24)";
      for (let py = y + gap + px; py < y + size - gap - px; py += step) {
        for (let px2 = x + gap + px + (((py - y) / step + variant) & 1) * dot * 2; px2 < x + size - gap - px; px2 += step) ctx.fillRect(Math.round(px2), Math.round(py), dot, dot);
      }
      if (variant === 2) {
        ctx.fillStyle = "rgba(19,51,27,.3)";
        for (let p = x + gap + px; p < x + size - gap - px; p += dot * 3) ctx.fillRect(Math.round(p), Math.round(y + size - gap - px), dot, dot);
      }
    } else if (state.theme === "eightbit") {
      const edge = Math.max(1, Math.round(size * .035));
      ctx.fillStyle = "#050505"; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = fill; ctx.fillRect(x + edge, y + edge, size - edge, size - edge);
      ctx.fillStyle = "rgba(255,255,255,.38)"; ctx.fillRect(x + edge, y + edge, size - edge, edge); ctx.fillRect(x + edge, y + edge, edge, size - edge);
      ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.fillRect(x + size - edge, y + edge, edge, size - edge); ctx.fillRect(x + edge, y + size - edge, size - edge, edge);
    } else {
      const gradient = ctx.createLinearGradient(x, y, x, y + size);
      gradient.addColorStop(0, "rgba(255,255,255,.78)"); gradient.addColorStop(.12, fill); gradient.addColorStop(.78, fill); gradient.addColorStop(1, "rgba(0,0,0,.52)");
      ctx.shadowColor = fill; ctx.shadowBlur = Math.max(3, size * .14); ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.roundRect(x + gap, y + gap, size - gap * 2, size - gap * 2, Math.max(2, size * .11)); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,.82)"; ctx.lineWidth = Math.max(1, size * .055); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(x + gap + px, y + gap + px, size - gap * 2 - px * 2, Math.max(1, px * .55));
    }
    ctx.restore();
  }

  function draw() {
    const w = boardCanvas.width;
    const h = boardCanvas.height;
    const cell = Math.floor(Math.min(w / COLS, h / ROWS));
    const ox = Math.floor((w - cell * COLS) / 2);
    const oy = Math.floor((h - cell * ROWS) / 2);
    boardCtx.clearRect(0, 0, w, h);
    boardCtx.fillStyle = state.theme === "gameboy" ? "#91ad50" : "rgba(0,0,0,.38)";
    boardCtx.fillRect(ox, oy, cell * COLS, cell * ROWS);
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const value = state.board[r + HIDDEN]?.[c];
        boardCtx.strokeStyle = state.theme === "gameboy" ? "rgba(25,54,31,.2)" : "rgba(255,255,255,.065)";
        boardCtx.strokeRect(ox + c * cell, oy + r * cell, cell, cell);
        if (value) drawCell(boardCtx, ox + c * cell, oy + r * cell, cell, colors[value] || colors.G);
      }
    }
    if (state.piece && !state.over) {
      const ghost = ghostPiece();
      pieceCells(ghost).forEach(([x, y]) => {
        if (y >= HIDDEN) drawCell(boardCtx, ox + x * cell, oy + (y - HIDDEN) * cell, cell, "#f5fbef", 0.18);
      });
      pieceCells().forEach(([x, y]) => {
        if (y >= HIDDEN) drawCell(boardCtx, ox + x * cell, oy + (y - HIDDEN) * cell, cell, colors[state.piece.shape] || colors.G);
      });
    }
    drawLineClearAnimation(ox, oy, cell);
    drawMini(nextCtx, state.nextShape);
    drawMini(holdCtx, state.holdShape);
  }

  const attractStack = [
    "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........",
    "..........", "..........", "..........", "..........", ".....T....", "...JTT....", ".OOJJT.SS.", ".OOJ..SSZ.", "IIILLL.ZZ.", "IILLOOZZZ.",
  ];

  function drawAttract(now = 0) {
    if (!attractCanvas || !attractCtx) return;
    const w = attractCanvas.width, h = attractCanvas.height, cell = Math.floor(Math.min(w / 14, h / 22));
    const ox = Math.floor((w - cell * COLS) / 2), oy = Math.floor((h - cell * ROWS) / 2);
    attractCtx.clearRect(0, 0, w, h);
    attractCtx.fillStyle = state.theme === "gameboy" ? "#8fae4f" : state.theme === "eightbit" ? "#080719" : "#030711";
    attractCtx.fillRect(0, 0, w, h);
    for (let y = 0; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) {
      attractCtx.strokeStyle = state.theme === "gameboy" ? "rgba(24,54,31,.2)" : "rgba(255,255,255,.055)";
      attractCtx.strokeRect(ox + x * cell, oy + y * cell, cell, cell);
      const shape = attractStack[y][x]; if (shape !== ".") drawCell(attractCtx, ox + x * cell, oy + y * cell, cell, colors[shape]);
    }
    const fallingY = 2 + Math.floor((now / 520) % 9);
    shapeData.L[0].forEach(([x, y]) => drawCell(attractCtx, ox + (3 + x) * cell, oy + (fallingY + y) * cell, cell, colors.L));
  }

  function attractLoop(now) {
    if (!$("lobby").hidden) drawAttract(now);
    requestAnimationFrame(attractLoop);
  }

  function drawLineClearAnimation(ox, oy, cell) {
    const animation = state.clearAnimation;
    if (!animation) return;
    const elapsed = performance.now() - animation.start;
    const progress = Math.min(1, elapsed / animation.duration);
    const pulse = Math.sin(progress * Math.PI * (animation.tetris ? 8 : 6)) * 0.5 + 0.5;
    const wipeColumns = Math.ceil((COLS / 2) * progress);
    boardCtx.save();
    animation.lines.forEach((boardY, index) => {
      const visibleY = boardY - HIDDEN;
      if (visibleY < 0 || visibleY >= ROWS) return;
      const y = oy + visibleY * cell;
      const fill = animation.tetris
        ? `rgba(255, 211, 78, ${0.42 + pulse * 0.42})`
        : `rgba(245, 251, 239, ${0.38 + pulse * 0.34})`;
      boardCtx.fillStyle = fill;
      boardCtx.fillRect(ox, y, cell * COLS, cell);
      boardCtx.strokeStyle = animation.tetris ? "rgba(255, 211, 78, .96)" : "rgba(255,255,255,.88)";
      boardCtx.lineWidth = Math.max(2, cell * 0.08);
      boardCtx.strokeRect(ox + 1, y + 1, cell * COLS - 2, cell - 2);
      boardCtx.fillStyle = "rgba(4,12,8,.82)";
      for (let step = 0; step < wipeColumns; step += 1) {
        const left = Math.floor(COLS / 2) - 1 - step;
        const right = Math.ceil(COLS / 2) + step;
        if (left >= 0) boardCtx.fillRect(ox + left * cell, y, cell, cell);
        if (right < COLS) boardCtx.fillRect(ox + right * cell, y, cell, cell);
      }
      if (animation.tetris) {
        const sparkX = ox + ((index % 2 ? 0.78 : 0.22) + progress * 0.08) * cell * COLS;
        boardCtx.fillStyle = `rgba(255, 255, 255, ${0.35 + pulse * 0.35})`;
        boardCtx.beginPath();
        boardCtx.arc(sparkX, y + cell / 2, Math.max(3, cell * 0.16), 0, Math.PI * 2);
        boardCtx.fill();
      }
    });
    if (animation.tetris) {
      boardCtx.globalAlpha = 0.65 + pulse * 0.25;
      boardCtx.fillStyle = "#ffd34e";
      boardCtx.font = `900 ${Math.max(18, cell * 0.74)}px "Avenir Next", sans-serif`;
      boardCtx.textAlign = "center";
      boardCtx.textBaseline = "middle";
      boardCtx.shadowColor = "rgba(255,211,78,.9)";
      boardCtx.shadowBlur = 18;
      boardCtx.fillText("4 LINE CLEAR", ox + (cell * COLS) / 2, oy + cell * ROWS * 0.44);
    }
    boardCtx.restore();
  }

  function drawMini(ctx, shape) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!shape) return;
    const cells = shapeData[shape][0];
    const size = Math.floor(Math.min(canvas.width, canvas.height) / 5);
    const ox = Math.floor((canvas.width - size * 4) / 2);
    const oy = Math.floor((canvas.height - size * 4) / 2);
    cells.forEach(([x, y]) => drawCell(ctx, ox + x * size, oy + y * size, size, colors[shape]));
  }

  function ghostPiece() {
    const ghost = { ...state.piece };
    while (!collides({ ...ghost, y: ghost.y + 1 })) ghost.y += 1;
    return ghost;
  }

  function renderOpponents() {
    const box = $("opponents");
    if (!state.mode.includes("battle") || !state.remoteGame?.payload) {
      box.replaceChildren();
      return;
    }
    const players = Array.isArray(state.remoteGame.players) ? state.remoteGame.players : [];
    const states = state.remoteGame.payload.states || {};
    const cards = players.filter((player) => player.mark !== state.playerMark).map((player) => {
      const card = document.createElement("div");
      const info = states[player.mark] || {};
      card.className = `opponent-card ${info.alive === false ? "dead" : ""}`;
      const label = document.createElement("span");
      label.textContent = player.mark || "";
      const name = document.createElement("strong");
      name.textContent = player.name || player.mark;
      const score = document.createElement("small");
      score.textContent = `${info.score || 0} pts`;
      const canvas = document.createElement("canvas");
      canvas.width = 60;
      canvas.height = 120;
      card.append(label, name, canvas, score);
      drawPreview(canvas.getContext("2d"), info.preview || []);
      return card;
    });
    box.replaceChildren(...cards);
  }

  function drawPreview(ctx, preview) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cell = Math.floor(Math.min(canvas.width / COLS, canvas.height / ROWS));
    const ox = Math.floor((canvas.width - cell * COLS) / 2);
    const oy = Math.floor((canvas.height - cell * ROWS) / 2);
    ctx.fillStyle = "rgba(0,0,0,.26)";
    ctx.fillRect(ox, oy, cell * COLS, cell * ROWS);
    preview.slice(0, ROWS).forEach((row, r) => {
      row.slice(0, COLS).forEach((filled, c) => {
        if (filled) drawCell(ctx, ox + c * cell, oy + r * cell, cell, "rgba(128,240,138,.78)");
      });
    });
  }

  function startSolo(mode) {
    stopBattleTimers();
    state.gameId = "";
    state.playerMark = "";
    const duration = mode === "timed" ? Number($("duration").value || 120) : 0;
    resetEngine(mode, duration);
  }

  async function createBattle(mode) {
    stopBattleTimers();
    const duration = mode === "timed-battle" ? Number($("duration").value || 120) : 0;
    const form = new URLSearchParams({
      action: "create",
      game: "blockfall",
      mode,
      duration: String(duration),
      playerId: state.profile.id,
      playerName: state.profile.name,
    });
    const data = await postMobileGame(form);
    adoptRemoteGame(data);
    resetEngine(mode, duration);
    state.running = false;
    showOverlay("Waiting", "Battle starts when another player joins.", false);
    startBattleTimers();
  }

  async function joinBattle(gameId) {
    stopBattleTimers();
    const form = new URLSearchParams({
      action: "join",
      gameId,
      playerId: state.profile.id,
      playerName: state.profile.name,
    });
    const data = await postMobileGame(form);
    adoptRemoteGame(data);
    const mode = data.game.mode === "timed-battle" ? "timed-battle" : "battle";
    const duration = Number(data.game.payload?.duration || 0);
    resetEngine(mode, duration);
    startBattleTimers();
  }

  function adoptRemoteGame(data) {
    state.remoteGame = data.game || null;
    state.gameId = state.remoteGame?.id || "";
    state.playerMark = data.mark || findMyMark(state.remoteGame) || "";
  }

  function findMyMark(game) {
    return (game?.players || []).find((player) => player.id === state.profile.id)?.mark || "";
  }

  function startBattleTimers() {
    stopBattleTimers();
    state.battlePoll = window.setInterval(pollBattleState, 1000);
    state.publishTimer = window.setInterval(() => publishBattleUpdate(false), 1200);
    pollBattleState();
  }

  function stopBattleTimers() {
    if (state.battlePoll) window.clearInterval(state.battlePoll);
    if (state.publishTimer) window.clearInterval(state.publishTimer);
    state.battlePoll = null;
    state.publishTimer = null;
  }

  async function pollBattleState() {
    if (!state.gameId) return;
    try {
      const form = new URLSearchParams({ action: "state", gameId: state.gameId, playerId: state.profile.id });
      const data = await postMobileGame(form);
      state.remoteGame = data.game || state.remoteGame;
      const payload = state.remoteGame?.payload || {};
      const queued = Number(payload.yourGarbage || 0);
      if (queued > state.pendingGarbage) state.pendingGarbage = queued;
      if (state.remoteGame?.status === "active") {
        const startedAt = Number(payload.startedAt || 0) * 1000;
        if (!state.running && startedAt && Date.now() >= startedAt) {
          $("overlay").hidden = true;
          state.running = true;
          state.startTime = performance.now();
          state.lastTick = performance.now();
          requestAnimationFrame(loop);
        } else if (!state.running && startedAt) {
          showOverlay("Get Ready", `Starting in ${Math.max(1, Math.ceil((startedAt - Date.now()) / 1000))}...`, false);
        }
      }
      if (state.remoteGame?.status === "complete" && !state.over) {
        const winner = state.remoteGame.winner || "";
        endGame(winner === state.playerMark ? "You win" : winner === "draw" ? "Draw" : "You are out");
      }
      updateStatus();
    } catch (error) {
      message(error.message || "Battle sync failed.", true);
    }
  }

  async function publishBattleUpdate(final = false) {
    if (!state.gameId || !state.playerMark || !state.remoteGame || state.remoteGame.status === "complete") return;
    const form = new URLSearchParams({
      action: "move",
      gameId: state.gameId,
      playerId: state.profile.id,
      score: String(state.score),
      lines: String(state.lines),
      level: String(state.level),
      alive: final || state.over ? "0" : "1",
      preview: JSON.stringify(visiblePreview()),
      garbageSent: String(state.garbageSentSinceSync),
      garbageApplied: String(state.garbageAppliedSinceSync),
    });
    state.garbageSentSinceSync = 0;
    state.garbageAppliedSinceSync = 0;
    try {
      const data = await postMobileGame(form);
      state.remoteGame = data.game || state.remoteGame;
    } catch (error) {
      message(error.message || "Battle update failed.", true);
    }
  }

  async function postMobileGame(form) {
    void form;
    throw new Error("Network play is not available in this standalone edition.");
  }

  function loadOpenGames() {
    $("openGames").replaceChildren();
  }

  function openGameCard(game) {
    const row = document.createElement("div");
    row.className = "open-game";
    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = game.title || "Blockfall Battle";
    const detail = document.createElement("span");
    detail.textContent = `${game.mode || "battle"} - ${(game.players || []).map((player) => player.name).join(" vs ") || "Waiting"}`;
    text.append(title, detail);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary";
    button.textContent = "Join";
    button.addEventListener("click", () => joinBattle(game.id));
    row.append(text, button);
    return row;
  }

  function selectMode(mode) {
    state.selectedMode = mode;
    document.querySelectorAll("[data-mode]").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
    const timed = mode === "timed" || mode === "timed-battle";
    $("durationWrap").hidden = !timed;
    $("startMode").textContent = mode === "endless" ? "Start Endless" : mode === "timed" ? "Start Timed Run" : mode === "battle" ? "Create Battle" : "Create Timed Battle";
  }

  function updateLobbyRecords() {
    const records = window.GameScores?.game("blockfall") || { best: {}, recent: [] };
    $("endlessBest").textContent = Number(records.best?.["endless:endless:score"]?.value || 0).toLocaleString();
    $("timedBest").textContent = Number(records.best?.["timed:timed:score"]?.value || 0).toLocaleString();
    $("gamesPlayed").textContent = String(records.recent?.length || 0);
  }

  function handleControl(control) {
    if (control === "left") move(-1, 0);
    if (control === "right") move(1, 0);
    if (control === "rotate") rotate(1);
    if (control === "soft") move(0, 1, true);
    if (control === "hard") hardDrop();
    if (control === "hold") holdPiece();
    if (control === "pause") pauseGame(!state.paused);
  }

  function attachControls() {
    document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.mode)));
    document.querySelectorAll("[data-theme-choice]").forEach(button => button.addEventListener("click", () => applyTheme(button.dataset.themeChoice, true)));
    $("musicSelect").addEventListener("change", () => setMusic($("musicSelect").value, true));
    $("gameMusicSelect").addEventListener("change", () => setMusic($("gameMusicSelect").value, false));
    $("soundToggle").addEventListener("click", () => { state.sound = !state.sound; localStorage.setItem(soundStorageKey, state.sound ? "on" : "off"); updateSoundButton(); if (state.sound) playEffect("move", .42); });
    $("startMode").addEventListener("click", () => {
      if (state.selectedMode === "endless" || state.selectedMode === "timed") startSolo(state.selectedMode);
      else createBattle(state.selectedMode).catch((error) => message(error.message || "Could not create battle.", true));
    });
    $("refreshGame").addEventListener("click", loadOpenGames);
    $("leaveGame").addEventListener("click", backToLobby);
    $("closeGame").addEventListener("click", backToLobby);
    $("resumeGame").addEventListener("click", () => pauseGame(false));
    $("playAgain").addEventListener("click", () => {
      if (state.mode.includes("battle") && state.gameId) resetBattle();
      else startSolo(state.mode === "timed" ? "timed" : "endless");
    });
    document.querySelectorAll("[data-control]").forEach((button) => {
      const fire = () => handleControl(button.dataset.control);
      let repeatDelay = 0, repeatTimer = 0;
      const stopRepeat = () => { window.clearTimeout(repeatDelay); window.clearInterval(repeatTimer); repeatDelay = 0; repeatTimer = 0; };
      button.addEventListener("click", () => { if (button.dataset.touchHandled === "true") return; fire(); });
      button.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;
        event.preventDefault();button.dataset.touchHandled = "true";fire();
        if (["left", "right", "soft"].includes(button.dataset.control)) repeatDelay = window.setTimeout(() => { repeatTimer = window.setInterval(fire, 75); }, 230);
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(type => button.addEventListener(type, () => { stopRepeat();window.setTimeout(() => { delete button.dataset.touchHandled; }, 350); }));
    });
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (event.target.closest?.("button, select, input") && key !== "escape") return;
      if (["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "x", "z", "c", "shift", "p", "escape"].includes(key)) event.preventDefault();
      if (key === "arrowleft") move(-1, 0);
      if (key === "arrowright") move(1, 0);
      if (key === "arrowdown") move(0, 1, true);
      if (key === "arrowup" || key === "x") rotate(1);
      if (key === "z") rotate(-1);
      if (key === " ") hardDrop();
      if (key === "c" || key === "shift") holdPiece();
      if (key === "p" || key === "escape") pauseGame(!state.paused);
    });
    window.addEventListener("resize", resizeCanvases);
    document.addEventListener("visibilitychange", () => { if (document.hidden && state.running && !state.paused && !state.over) pauseGame(true); });
  }

  async function resetBattle() {
    if (!state.gameId) return;
    try {
      const data = await postMobileGame(new URLSearchParams({ action: "reset", gameId: state.gameId, playerId: state.profile.id }));
      adoptRemoteGame(data);
      const duration = Number(data.game?.payload?.duration || 0);
      resetEngine(data.game?.mode || "battle", duration);
      if (data.game?.status === "waiting") {
        state.running = false;
        showOverlay("Waiting", "Battle starts when another player joins.", false);
      }
      startBattleTimers();
    } catch (error) {
      message(error.message || "Reset failed.", true);
    }
  }

  function backToLobby() {
    if (state.running && !state.over && !window.confirm("Leave this run and return to mode selection?")) return;
    stopBattleTimers();
    state.running = false;
    state.paused = false;
    state.gameId = "";
    state.remoteGame = null;
    stopMusic();
    document.body.classList.remove("playing");
    $("gamePanel").hidden = true;
    $("lobby").hidden = false;
    $("overlay").hidden = true;
    updateLobbyRecords();
  }

  function restoreFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");
    if (gameId) joinBattle(gameId).catch((error) => message(error.message || "Could not join battle.", true));
  }

  function main() {
    loadProfile();
    applyTheme(localStorage.getItem(themeStorageKey) || "modern");
    initAudio();
    selectMode("endless");
    attachControls();
    updateSoundButton();
    updateLobbyRecords();
    resizeCanvases();
    window.setInterval(() => {
      if (state.running && !state.over) updateStatus();
    }, 250);
    $("backToLobby").addEventListener("click", backToLobby);
    requestAnimationFrame(attractLoop);
  }

  main();
})();
