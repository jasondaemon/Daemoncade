(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const W = 540, H = 960, PADDLE_Y = H - 54;
  const palette = [0x68e8ff, 0x8a6cff, 0xff4fd8, 0xff626d, 0xffca55, 0x44edbd];
  const sectorNames = ["First Light", "Skyline", "Prism Gate", "Split Circuit", "Signal Maze", "Diamond Core", "Pulse Line", "Crossfire", "Star Relay", "Last Array"];
  const bestKey = "jasondaemon.neon-breaker.best.v1";
  const runKey = "jasondaemon.neon-breaker.run.v1";
  const progressKey = "jasondaemon.neon-breaker.progress.v1";
  const settingsKey = "jasondaemon.neon-breaker.settings.v1";
  const rankKey = "jasondaemon.neon-breaker.ranks.v1";
  const musicFiles = {
    neon: "assets/music/neon-sector-1.1.0.mp3",
    armored: "assets/music/armored-sector-1.1.0.mp3",
    hypergrid: "assets/music/hypergrid-1.1.0.mp3",
    guardian: "assets/music/guardian-core-1.1.0.mp3",
  };
  const MUSIC_MASTER_GAIN = .14;
  let scene;

  class NeonBreaker extends Phaser.Scene {
    constructor() { super("NeonBreaker"); }

    preload() {
      this.load.image("arena-art", "assets/arena-alpha32.png");
      this.load.image("arena-overlay", "assets/arena-alpha32-overlay.png");
      this.load.image("paddle-art", "assets/paddle-alpha32.png");
      this.load.image("pulse-ball", "assets/pulse-ball-alpha32.png");
      this.load.image("drone", "assets/interceptor-alpha32.png");
      this.load.image("brick-art", "assets/brick-base-1.1.0.png");
      this.load.image("brick-damage", "assets/brick-damage-1.1.0.png");
      this.load.image("power-W", "assets/power-wide-1.1.0.png");
      this.load.image("power-M", "assets/power-multi-1.1.0.png");
      this.load.image("power-S", "assets/power-slow-1.1.0.png");
      this.load.image("power-L", "assets/power-laser-1.1.0.png");
      this.load.image("power-B", "assets/power-super-1.1.0.png");
      this.load.image("boss-core", "assets/guardian-1.1.0.png");
    }

    create() {
      scene = this;
      this.runState = "title";
      this.score = 0;
      this.level = 1;
      this.lives = 3;
      this.combo = 1;
      this.sectorLivesLost = 0;
      this.sectorElapsedMs = 0;
      this.sectorPeakCombo = 1;
      this.nextLifeScore = 100000;
      this.best = Number(localStorage.getItem(bestKey) || 0);
      this.highestSector = Math.max(1, Number(localStorage.getItem(progressKey) || 1));
      try { this.settings = { pace: "arcade", volume: .7, musicVolume: .45, reducedMotion: false, haptics: true, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") }; }
      catch { this.settings = { pace: "arcade", volume: .7, musicVolume: .45, reducedMotion: false, haptics: true }; }
      try { this.sectorRanks = JSON.parse(localStorage.getItem(rankKey) || "{}"); }
      catch { this.sectorRanks = {}; }
      this.speedFactor = { comfortable: .84, arcade: 1, quick: 1.14 }[this.settings.pace] || 1;
      this.targetX = W / 2;
      this.paddleVelocityX = 0;
      this.wideUntil = 0;
      this.slowUntil = 0;
      this.laserUntil = 0;
      this.superUntil = 0;
      this.lastShot = 0;
      this.lastTrail = 0;
      this.soundOn = true;
      const requestedTestLevel = Number(new URLSearchParams(location.search).get("testLevel"));
      this.testLevel = Number.isInteger(requestedTestLevel) && requestedTestLevel > 0 ? Phaser.Math.Clamp(requestedTestLevel, 1, 99) : 0;
      this.testMode = this.testLevel > 0;
      this.syncSettingsForm();

      this.drawBackdrop();
      this.createPowerTextures();
      this.createEnemyTextures();
      this.createHud();
      this.physics.world.setBounds(16, 16, W - 32, H + 60);
      this.physics.world.setBoundsCollision(true, true, true, false);
      this.physics.world.on("worldbounds", (body) => {
        if (body?.gameObject && this.balls?.contains(body.gameObject)) this.tone(220, .025, "triangle", .007);
      });

      this.bricks = this.physics.add.staticGroup();
      this.balls = this.physics.add.group({ allowGravity: false });
      this.drops = this.physics.add.group({ allowGravity: false });
      this.shots = this.physics.add.group({ allowGravity: false });
      this.enemies = this.physics.add.group({ allowGravity: false });
      this.paddleGlow = this.add.rectangle(W / 2, PADDLE_Y, 124, 24, 0x68e8ff, .14).setBlendMode(Phaser.BlendModes.ADD);
      this.paddle = this.add.rectangle(W / 2, PADDLE_Y, 112, 16, 0xffffff, 0);
      this.paddle.setData("baseWidth", 112);
      this.physics.add.existing(this.paddle);
      this.paddle.body.setImmovable(true).setAllowGravity(false);
      this.paddleArt = this.add.image(W / 2, PADDLE_Y, "paddle-art").setDisplaySize(142, 52).setDepth(2);
      this.aimGuide = this.add.graphics().setDepth(2);
      this.servePrompt = this.add.text(W / 2, PADDLE_Y - 52, "MOVE TO AIM  ·  TAP TO LAUNCH", { fontFamily: "system-ui", fontSize: "8px", fontStyle: "900", color: "#91a5bd", letterSpacing: 1.2 }).setOrigin(.5).setDepth(3);

      this.physics.add.collider(this.balls, this.bricks, this.hitBrick, this.shouldBounceBrick, this);
      this.physics.add.overlap(this.balls, this.bricks, this.superHitBrick, null, this);
      this.physics.add.overlap(this.paddle, this.drops, this.collectPower, null, this);
      this.physics.add.overlap(this.shots, this.bricks, this.shotBrick, null, this);
      this.physics.add.collider(this.balls, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.shots, this.enemies, this.shotEnemy, null, this);

      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("A,D,P,O,ESC");
      this.input.keyboard.on("keydown", () => this.primeAudio());
      this.input.keyboard.on("keydown-SPACE", async () => { await this.primeAudio(); this.launchOrFire(); });
      this.input.keyboard.on("keydown-P", () => this.togglePause());
      this.input.keyboard.on("keydown-ESC", () => this.togglePause());
      this.input.keyboard.on("keydown-O", () => this.runState === "settings" ? this.closeSettings() : this.openSettings());
      this.input.on("pointermove", (pointer) => { this.targetX = pointer.worldX; });
      this.input.on("pointerdown", async (pointer) => {
        if (pointer.worldY < 112) return;
        await this.primeAudio();
        this.targetX = pointer.worldX; this.launchOrFire();
      });

      this.makeLevel();
      this.resetPaddle(true);
      this.physics.pause();
      this.updateHud();
      if (this.testMode) this.startRun(this.testLevel);
      else if (!this.restoreRun()) {
        const previewSector = Number(new URLSearchParams(location.search).get("sector"));
        if ((location.hostname === "127.0.0.1" || location.hostname === "localhost") && previewSector > 0) this.startRun(previewSector);
        else this.configureCampaignStart();
      }
      this.events.on(Phaser.Scenes.Events.WAKE, () => { if (this.runState === "playing") this.physics.resume(); });
    }

    drawBackdrop() {
      this.add.image(W / 2, H / 2, "arena-art").setDisplaySize(W, H).setDepth(-20);
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x081d35, 0x081426, 0x030713, 0x08051b, .48);
      graphics.fillRect(0, 0, W, H);
      graphics.fillStyle(0x68e8ff, .035);
      for (let y = 110; y < H; y += 120) graphics.fillRect(22, y, W - 44, 1);
      graphics.lineStyle(2, 0x68e8ff, .22);
      graphics.strokeRoundedRect(9, 9, W - 18, H - 18, 18);
      graphics.lineStyle(1, 0xff4fd8, .18);
      graphics.strokeRoundedRect(15, 15, W - 30, H - 30, 15);
      for (let y = 82; y < H - 100; y += 84) {
        graphics.fillStyle((y / 84) % 2 ? 0x68e8ff : 0xff4fd8, .2);
        graphics.fillRoundedRect(7, y, 5, 42, 3);
        graphics.fillRoundedRect(W - 12, y, 5, 42, 3);
      }
      graphics.lineStyle(1, 0x68e8ff, .07);
      for (let y = 125; y < H - 120; y += 96) {
        graphics.lineBetween(34, y, 82, y); graphics.lineBetween(W - 82, y + 34, W - 34, y + 34);
        graphics.strokeCircle(86, y, 3); graphics.strokeCircle(W - 86, y + 34, 3);
      }
      graphics.setDepth(-19);
      this.sectorWash = this.add.rectangle(W / 2, H / 2, W, H, palette[0], .025).setDepth(-18);
      this.sectorPattern = this.add.graphics().setDepth(-17);
      this.musicVisual = this.add.graphics().setDepth(-12);
      this.add.image(W / 2, H / 2, "arena-overlay").setDisplaySize(W, H).setDepth(-8);
    }

    updateBackdrop(level = this.level) {
      const g = this.sectorPattern;
      if (!g) return;
      g.clear();
      const variant = (level - 1) % 4;
      const accent = palette[(level - 1) % palette.length];
      if (variant === 0) {
        g.fillStyle(accent, .16);
        for (let i = 0; i < 42; i++) g.fillCircle(32 + (i * 83) % 478, 120 + (i * 137) % 720, i % 7 === 0 ? 2 : 1);
      } else if (variant === 1) {
        g.lineStyle(1, accent, .1);
        for (let y = 145; y < 850; y += 82) {
          g.lineBetween(38, y, 122, y); g.lineBetween(122, y, 170, y + 42);
          g.lineBetween(W - 38, y + 28, W - 122, y + 28); g.lineBetween(W - 122, y + 28, W - 170, y + 70);
        }
      } else if (variant === 2) {
        g.lineStyle(2, accent, .08);
        for (let radius = 70; radius < 370; radius += 58) g.strokeCircle(W / 2, 520, radius);
        g.lineStyle(1, 0xffffff, .035);
        for (let x = 70; x < W; x += 80) g.lineBetween(W / 2, 520, x, 120);
      } else {
        for (let y = 150; y < 870; y += 72) {
          g.fillGradientStyle(accent, accent, 0x000000, 0x000000, .09, .09, 0, 0);
          g.fillRect(34, y, W - 68, 20);
        }
        g.lineStyle(1, accent, .12);
        for (let x = 54; x < W - 40; x += 54) g.lineBetween(x, 130, W / 2 + (x - W / 2) * .35, 860);
      }
    }

    updateMusicVisual() {
      const g = this.musicVisual;
      if (!g || this.settings.reducedMotion) { g?.clear(); return; }
      const now = this.time.now;
      const interval = this.sys.game.device.input.touch ? 70 : 48;
      if (now - (this.lastMusicVisual || 0) < interval) return;
      this.lastMusicVisual = now;
      const bins = this.musicFrequency || new Uint8Array(64);
      if (this.musicAnalyser && this.currentMusic && !this.currentMusic.paused) this.musicAnalyser.getByteFrequencyData(bins);
      else for (let i = 0; i < bins.length; i++) bins[i] = 18 + Math.sin(now * .0014 + i * .42) * 10;
      this.musicFrequency = bins;
      g.clear();
      const accent = palette[(this.level - 1) % palette.length];
      const secondary = palette[(this.level + 1) % palette.length];
      const left = 8, right = W - 8, top = 8, bottom = H - 8;
      const count = this.sys.game.device.input.touch ? 20 : 28;
      const step = (right - left) / count;
      const peak = Math.max(24, ...bins.slice(0, 48));
      for (let i = 0; i < count; i++) {
        const sourceIndex = Math.floor(i / count * Math.min(48, bins.length));
        const value = Phaser.Math.Clamp(bins[sourceIndex] / peak, 0, 1);
        const neighboring = Phaser.Math.Clamp(bins[Math.min(bins.length - 1, sourceIndex + 2)] / peak, 0, 1);
        const height = 34 + Math.max(value, neighboring * .7) * (bottom - top - 28);
        g.fillStyle(i % 4 === 0 ? secondary : accent, .025 + value * .085);
        g.fillRoundedRect(left + i * step + 2, bottom - height, Math.max(3, step - 4), height, 4);
        g.fillStyle(0xffffff, .008 + value * .02);
        g.fillRect(left + i * step + 4, bottom - height + 3, Math.max(1, step - 8), Math.max(2, height * .08));
      }
    }

    createPowerTextures() {
      const specs = {
        W: { color: 0xff4fd8, draw: (g) => {
          g.lineBetween(11, 24, 37, 24); g.lineBetween(11, 24, 17, 18); g.lineBetween(11, 24, 17, 30);
          g.lineBetween(37, 24, 31, 18); g.lineBetween(37, 24, 31, 30);
        } },
        M: { color: 0xffca55, draw: (g) => {
          g.fillCircle(17, 27, 5); g.fillCircle(31, 27, 5); g.fillCircle(24, 17, 5);
        } },
        S: { color: 0x68e8ff, draw: (g) => {
          g.strokeCircle(24, 24, 11); g.lineBetween(24, 24, 24, 16); g.lineBetween(24, 24, 31, 27);
        } },
        L: { color: 0xff626d, draw: (g) => {
          g.fillRoundedRect(14, 15, 6, 19, 3); g.fillRoundedRect(28, 15, 6, 19, 3);
          g.lineBetween(17, 13, 17, 7); g.lineBetween(31, 13, 31, 7);
        } },
        B: { color: 0x8dff67, draw: (g) => {
          g.fillCircle(24, 24, 10); g.lineStyle(2, 0xffffff, .8); g.strokeCircle(24, 24, 14);
          g.lineBetween(24, 5, 24, 10); g.lineBetween(24, 38, 24, 43);
          g.lineBetween(5, 24, 10, 24); g.lineBetween(38, 24, 43, 24);
        } },
      };
      Object.entries(specs).forEach(([type, spec]) => {
        const key = `power-${type}`;
        if (this.textures.exists(key)) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x07101e, .96); g.fillRoundedRect(2, 2, 44, 44, 12);
        g.lineStyle(3, spec.color, 1); g.strokeRoundedRect(3, 3, 42, 42, 11);
        g.fillStyle(spec.color, 1); g.lineStyle(3, spec.color, 1); spec.draw(g);
        g.lineStyle(1, 0xffffff, .45); g.strokeRoundedRect(7, 7, 34, 34, 8);
        g.generateTexture(key, 48, 48); g.destroy();
      });
    }

    createEnemyTextures() {
      if (!this.textures.exists("drone")) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x081528, 1); g.fillRoundedRect(2, 8, 44, 28, 10);
        g.lineStyle(3, 0xff4fd8, 1); g.strokeRoundedRect(3, 9, 42, 26, 9);
        g.fillStyle(0x68e8ff, 1); g.fillTriangle(10, 22, 19, 15, 19, 29); g.fillTriangle(38, 22, 29, 15, 29, 29);
        g.fillStyle(0xffca55, 1); g.fillCircle(24, 22, 4); g.generateTexture("drone", 48, 44); g.destroy();
      }
      if (!this.textures.exists("boss-core")) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x07101e, 1); g.fillCircle(40, 40, 36);
        g.lineStyle(4, 0xff626d, 1); g.strokeCircle(40, 40, 34); g.strokeCircle(40, 40, 23);
        g.fillStyle(0xffca55, 1); g.fillCircle(40, 40, 11);
        g.lineStyle(3, 0x68e8ff, .85);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.lineBetween(40 + Math.cos(a) * 25, 40 + Math.sin(a) * 25, 40 + Math.cos(a) * 37, 40 + Math.sin(a) * 37); }
        g.generateTexture("boss-core", 80, 80); g.destroy();
      }
    }

    configureCampaignStart() {
      const campaign = $("campaign");
      campaign.hidden = this.highestSector <= 1;
      campaign.textContent = `Start sector ${String(this.highestSector).padStart(2, "0")}`;
    }

    syncSettingsForm() {
      $("pace").value = this.settings.pace;
      $("volume").value = String(Math.round(this.settings.volume * 100));
      $("music-volume").value = String(Math.round(this.settings.musicVolume * 100));
      $("reduced-motion").checked = Boolean(this.settings.reducedMotion);
      $("haptics").checked = Boolean(this.settings.haptics);
    }

    openSettings() {
      if (this.runState === "settings") return;
      this.saveRun();
      this.settingsReturnState = this.runState;
      if (this.runState === "playing") this.physics.pause();
      this.runState = "settings"; this.syncSettingsForm(); $("settings-panel").hidden = false;
    }

    closeSettings() {
      const previousFactor = this.speedFactor;
      this.settings = { pace: $("pace").value, volume: Number($("volume").value) / 100, musicVolume: Number($("music-volume").value) / 100, reducedMotion: $("reduced-motion").checked, haptics: $("haptics").checked };
      this.speedFactor = { comfortable: .84, arcade: 1, quick: 1.14 }[this.settings.pace] || 1;
      const ratio = this.speedFactor / previousFactor;
      this.balls?.children.iterate((ball) => { if (ball && !ball.getData("stuck")) ball.body.velocity.scale(ratio); });
      localStorage.setItem(settingsKey, JSON.stringify(this.settings)); $("settings-panel").hidden = true;
      if (this.currentMusic) this.currentMusic.volume = this.soundOn ? this.musicOutputVolume() : 0;
      if (this.soundOn && this.settings.musicVolume > 0) this.startMusicForLevel();
      if (this.settings.reducedMotion) this.musicVisual?.clear();
      this.runState = this.settingsReturnState;
      if (this.runState === "playing") this.physics.resume();
    }

    impactShake(duration, intensity) { if (!this.settings.reducedMotion) this.cameras.main.shake(duration, intensity); }
    haptic(pattern) { if (this.settings.haptics && navigator.vibrate) navigator.vibrate(pattern); }

    drawServeGuide(ball) {
      const aim = Phaser.Math.Clamp((this.targetX - W / 2) * 1.35, -430, 430) || 300;
      const rise = 125, run = (aim * .82 / 510) * rise;
      const endX = Phaser.Math.Clamp(ball.x + run, 24, W - 24), endY = ball.y - rise;
      this.aimGuide.lineStyle(2, 0x68e8ff, .42);
      const segments = 9;
      for (let i = 0; i < segments; i += 2) {
        const from = i / segments, to = Math.min(1, (i + 1) / segments);
        this.aimGuide.lineBetween(Phaser.Math.Linear(ball.x, endX, from), Phaser.Math.Linear(ball.y, endY, from), Phaser.Math.Linear(ball.x, endX, to), Phaser.Math.Linear(ball.y, endY, to));
      }
    }

    floatScore(x, y, points) {
      const label = this.add.text(x, y, `+${points}`, { fontFamily: "system-ui", fontSize: "10px", fontStyle: "900", color: "#f4f8ff", stroke: "#061326", strokeThickness: 3 }).setOrigin(.5).setDepth(7);
      if (this.settings.reducedMotion) this.time.delayedCall(350, () => label.destroy());
      else this.tweens.add({ targets: label, y: y - 24, alpha: 0, duration: 520, ease: "Quad.out", onComplete: () => label.destroy() });
    }

    showComboPulse(combo) {
      const label = this.add.text(W / 2, 430, `COMBO ×${combo}`, { fontFamily: "system-ui", fontSize: "24px", fontStyle: "900", color: combo >= 7 ? "#ffca55" : "#ff4fd8", stroke: "#061326", strokeThickness: 5, letterSpacing: 2 }).setOrigin(.5).setDepth(7);
      this.haptic(combo >= 7 ? [12, 18, 12] : 10);
      if (this.settings.reducedMotion) this.time.delayedCall(450, () => label.destroy());
      else { label.setScale(.72); this.tweens.add({ targets: label, scale: 1.08, alpha: 0, duration: 650, ease: "Back.out", onComplete: () => label.destroy() }); }
    }

    sectorBrief() {
      if (this.level % 10 === 0) return "GUARDIAN SECTOR · BREAK THE CORE";
      const briefs = [
        "OPEN CHANNELS · BUILD YOUR COMBO", "STAGGERED FORMATION · FIND THE ANGLE",
        "PRISM WALLS · CONTROL THE RETURN", "SPLIT LANES · WATCH BOTH FLANKS",
        "VOLATILE CELLS · CHAIN THE BLAST", "CLOAKED CELLS · REVEAL THE GRID",
        "ARMORED GATES · STRIKE THE SWITCH", "SPLIT CELLS · CONTAIN MULTIBALL",
        "MOVING CELLS · LEAD THE TARGET", "GUARDIAN SECTOR · BREAK THE CORE",
      ];
      return briefs[(this.level - 1) % briefs.length];
    }

    showSectorIntro() {
      this.sectorIntroTimer?.remove(false);
      if (this.sectorIntro?.active) { this.tweens.killTweensOf(this.sectorIntro); this.sectorIntro.destroy(true); }
      const panel = this.add.container(W / 2, 500).setDepth(8).setAlpha(this.settings.reducedMotion ? 1 : 0);
      const plate = this.add.rectangle(0, 0, 390, 92, 0x061326, .94).setStrokeStyle(1, palette[(this.level - 1) % palette.length], .8);
      const bestRank = this.sectorRanks[this.level] ? `  ·  BEST ${this.sectorRanks[this.level]}` : "";
      const eyebrow = this.add.text(0, -24, `SECTOR ${String(this.level).padStart(2, "0")}${bestRank}`, { fontFamily: "system-ui", fontSize: "9px", fontStyle: "900", color: "#68e8ff", letterSpacing: 2 }).setOrigin(.5);
      const title = this.add.text(0, -3, sectorNames[(this.level - 1) % sectorNames.length].toUpperCase(), { fontFamily: "system-ui", fontSize: "23px", fontStyle: "900", color: "#f4f8ff", letterSpacing: 2 }).setOrigin(.5);
      const brief = this.add.text(0, 25, this.sectorBrief(), { fontFamily: "system-ui", fontSize: "8px", fontStyle: "800", color: "#91a5bd", letterSpacing: 1 }).setOrigin(.5);
      panel.add([plate, eyebrow, title, brief]); this.sectorIntro = panel;
      if (!this.settings.reducedMotion) this.tweens.add({ targets: panel, alpha: 1, y: 475, duration: 220, ease: "Quad.out" });
      this.sectorIntroTimer = this.time.delayedCall(1450, () => {
        if (!panel.active) return;
        if (this.settings.reducedMotion) panel.destroy(true);
        else this.tweens.add({ targets: panel, alpha: 0, y: 460, duration: 180, ease: "Quad.in", onComplete: () => panel.destroy(true) });
      });
    }

    createHud() {
      const labelStyle = { fontFamily: "system-ui", fontSize: "8px", fontStyle: "900", color: "#68e8ff", letterSpacing: 1.5 };
      const valueStyle = { fontFamily: "system-ui", fontSize: "17px", fontStyle: "900", color: "#f4f8ff", letterSpacing: 1.5 };
      this.add.text(25, 20, "DAEMONCADE PRESENTS", labelStyle);
      this.add.text(25, 36, "NEON\nBREAKER", { fontFamily: "system-ui", fontSize: "23px", fontStyle: "900", color: "#f4f8ff", lineSpacing: -5 });
      [[180, "SCORE"], [290, "LEVEL"], [375, "LIVES"]].forEach(([x, label]) => this.add.text(x, 31, label, labelStyle));
      this.hudScore = this.add.text(180, 49, "000000", valueStyle);
      this.hudLevel = this.add.text(290, 49, "01", valueStyle);
      this.hudLives = this.add.text(375, 49, "● ● ●", valueStyle);
      this.hudSector = this.add.text(290, 73, sectorNames[0].toUpperCase(), { ...labelStyle, color: "#91a5bd", fontSize: "7px" });
      this.hudPowers = this.add.text(180, 91, "", { ...labelStyle, color: "#ffca55", fontSize: "7px" });
      this.hudTest = this.add.text(W - 20, 90, "TEST MODE", { ...labelStyle, color: "#ffca55", fontSize: "7px", backgroundColor: "#3a2108", padding: { x: 5, y: 3 } }).setOrigin(1, 0).setVisible(this.testMode);

      this.soundButton = this.add.text(443, 30, "Sound on", { fontFamily: "system-ui", fontSize: "9px", fontStyle: "800", color: "#f4f8ff", backgroundColor: "#14243a", padding: { x: 7, y: 7 } }).setOrigin(.5, 0).setInteractive({ useHandCursor: true });
      this.pauseButton = this.add.text(490, 30, "Ⅱ", { fontFamily: "system-ui", fontSize: "11px", fontStyle: "900", color: "#f4f8ff", backgroundColor: "#14243a", padding: { x: 8, y: 6 } }).setOrigin(.5, 0).setInteractive({ useHandCursor: true });
      this.settingsButton = this.add.text(522, 30, "⚙", { fontFamily: "system-ui", fontSize: "11px", color: "#f4f8ff", backgroundColor: "#14243a", padding: { x: 7, y: 6 } }).setOrigin(.5, 0).setInteractive({ useHandCursor: true });
      this.soundButton.on("pointerdown", async () => {
        this.soundOn = !this.soundOn;
        if (this.soundOn) await this.primeAudio();
        else if (this.currentMusic) this.currentMusic.pause();
        this.soundButton.setText(this.soundOn ? "Sound on" : "Sound off");
      });
      this.pauseButton.on("pointerdown", () => this.togglePause());
      this.settingsButton.on("pointerdown", () => this.openSettings());

      this.hudCombo = this.add.text(20, 934, "COMBO ×1", { ...labelStyle, color: "#ff4fd8" });
      this.hudBest = this.add.text(W - 20, 934, "BEST 000000", { ...labelStyle, color: "#91a5bd" }).setOrigin(1, 0);
      this.add.text(145, 934, "CATCH", { ...labelStyle, color: "#91a5bd" });
      const legend = [["W", 188], ["M", 242], ["S", 296], ["L", 350], ["B", 404]];
      legend.forEach(([type, x]) => {
        this.add.image(x, 939, `power-${type}`).setDisplaySize(type === "W" ? 22 : 17, type === "W" ? 10 : 17);
        this.add.text(x + 12, 934, { W: "WIDE", M: "MULTI", S: "SLOW", L: "LASER", B: "SUPER" }[type], { fontFamily: "system-ui", fontSize: "7px", color: "#91a5bd" });
      });
    }

    patternAllows(pattern, row, col, cols, rows) {
      const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
      if (pattern === 0) return row < 7;
      if (pattern === 1) return row < 12 && col <= Math.max(1, cols - row - 1);
      if (pattern === 2) return row < 13 && Math.abs(col - cx) <= Math.min(row, rows - row - 1) * .68 + .3;
      if (pattern === 3) return row < 12 && (row < 2 || row > 9 || col < 2 || col > cols - 3 || (row > 4 && row < 8 && col > 3 && col < cols - 4));
      if (pattern === 4) return row < 13 && !((col % 4 === 1 || col % 4 === 2) && row % 3 === 1);
      if (pattern === 5) return row < 13 && (Math.abs(col - cx) + Math.abs(row - cy) < 6.8) && !(Math.abs(col - cx) < 1.2 && Math.abs(row - cy) < 1.2);
      if (pattern === 6) return row < 12 && ((col + Math.floor(row / 2)) % 3 !== 1 || row < 2);
      if (pattern === 7) return row < 13 && (row % 3 === 0 || col % 4 === 0);
      if (pattern === 8) return row < 13 && (Math.abs(col - cx) < 1.5 || Math.abs(row - cy) < 1.5 || Math.abs(Math.abs(col - cx) - Math.abs(row - cy) * .7) < 1);
      return row < 13 && ((row + col) % 2 === 0 || row < 2 || row > 10);
    }

    isBarrier(pattern, row, col, cols) {
      if (this.level < 4) return false;
      const center = Math.floor(cols / 2);
      if (pattern === 3) return (col === 2 || col === cols - 3) && row >= 3 && row <= 8 && row !== 5;
      if (pattern === 4) return row === 6 && col >= center - 3 && col <= center + 3 && col !== center;
      if (pattern === 5) return (row === 4 || row === 8) && (col === center - 3 || col === center + 3);
      if (pattern === 6) return row >= 3 && row <= 9 && col === center && row !== 6;
      if (pattern === 7) return row === 5 && col >= 2 && col <= cols - 3 && col % 3 !== 0;
      if (pattern === 8) return (row === 3 || row === 9) && Math.abs(col - center) <= 2 && col !== center;
      if (pattern === 9) return (col === 3 || col === cols - 4) && (row === 4 || row === 7);
      return false;
    }

    brickType(row, col, cols, barrier) {
      if (barrier) return this.level === 7 ? "gate" : "armor";
      if (this.level === 5 && (row * cols + col) % 10 === 4) return "explosive";
      if (this.level === 6 && (row * 3 + col) % 9 === 2) return "hidden";
      if (this.level === 7 && row === 2 && col === Math.floor(cols / 2)) return "switch";
      if (this.level === 8 && (row + col) % 11 === 3) return "split";
      if (this.level >= 9 && row >= 3 && row <= 7 && (row + col) % 7 === 0) return "moving";
      if (this.level > 10 && (row * cols + col + this.level) % 17 === 0) return "explosive";
      if (this.level > 10 && (row + col + this.level) % 19 === 0) return "split";
      return "normal";
    }

    makeLevel() {
      this.bricks.children.iterate((brick) => {
        brick?.getData("label")?.destroy();
        brick?.getData("shadow")?.destroy();
        brick?.getData("shine")?.destroy();
        brick?.getData("art")?.destroy();
        brick?.getData("damageArt")?.destroy();
      });
      this.bricks.clear(true, true);
      this.enemies?.children.iterate((enemy) => enemy?.getData("label")?.destroy());
      this.enemies?.clear(true, true);
      this.drops.clear(true, true);
      this.shots.clear(true, true);
      this.remainingBricks = 0;
      this.splitsGranted = 0;
      const pattern = (this.level - 1) % 10;
      this.sectorWash?.setFillStyle(palette[(this.level - 1) % palette.length], .035);
      this.updateBackdrop(this.level);
      this.musicKey = this.musicForLevel(this.level);
      if (this.audioReady && this.runState !== "paused") this.startMusicForLevel();
      const cols = pattern === 4 || pattern === 7 ? 13 : 11;
      const rows = 13;
      const gap = cols >= 13 ? 4 : 5;
      const sideChannel = 52;
      const width = (W - sideChannel * 2 - gap * (cols - 1)) / cols;
      const height = cols >= 13 ? 19 : 22;

      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const barrier = this.isBarrier(pattern, row, col, cols);
        if (!barrier && !this.patternAllows(pattern, row, col, cols, rows)) continue;
        const reinforced = Math.max(0, Math.floor((this.level - 1) / 2));
        const hp = Math.min(4, 1 + (reinforced > 0 && row < reinforced ? 1 : 0) + (this.level >= 5 && (row + col) % 7 === 0 ? 1 : 0) + (this.level >= 9 && (row * cols + col) % 11 === 0 ? 1 : 0));
        const type = this.brickType(row, col, cols, barrier);
        const brick = this.createBrick(sideChannel + col * (width + gap) + width / 2, 142 + row * (height + gap) + height / 2, width, height, hp, palette[(row * 2 + col + this.level) % palette.length], barrier, type);
        brick.setData({ gridRow: row, gridCol: col });
        if (!barrier) this.remainingBricks++;
      }
      this.openClosedArmorPockets();
      this.nextDroneAt = this.time.now + 8000;
      if (this.level % 10 === 0) this.spawnEnemy(true);
    }

    createBrick(x, y, width, height, hp, color, indestructible = false, type = "normal") {
      if (indestructible) color = 0x9aa8ba;
      if (type === "explosive") color = 0xff734d;
      if (type === "switch") color = 0x8dff67;
      if (type === "split") color = 0xffca55;
      if (type === "moving") color = 0x68e8ff;
      const shadow = this.add.rectangle(x, y + 3, width + 2, height + 2, 0x000000, .42);
      const brick = this.add.rectangle(x, y, width, height, color, 0);
      const art = this.add.image(x, y, "brick-art").setDisplaySize(width + 4, height + 5).setTint(color).setDepth(1);
      const damageArt = this.add.image(x, y, "brick-damage").setDisplaySize(width + 3, height + 4).setDepth(2).setVisible(false);
      const shine = this.add.rectangle(x, y - height * .27, width - 7, Math.max(1, height * .12), 0xffffff, .16).setDepth(2);
      const hidden = type === "hidden";
      brick.setData({ hp, maxHp: hp, color, shadow, shine, art, damageArt, artScaleX: art.scaleX, artScaleY: art.scaleY, damageScaleX: damageArt.scaleX, damageScaleY: damageArt.scaleY, indestructible, type, baseX: x, movePhase: (x + y) * .03, revealed: !hidden, switchControlled: type === "gate" });
      const symbol = { armor: "◆", gate: "◇", explosive: "✹", switch: "⌁", split: "●●", moving: "↔" }[type];
      if (hp > 1 || indestructible || symbol) {
        const label = this.add.text(x, y + 1, symbol || String(hp), { fontFamily: "system-ui", fontSize: type === "split" ? "7px" : indestructible ? "8px" : "10px", fontStyle: "900", color: "#ffffff" }).setOrigin(.5).setDepth(3);
        brick.setData("label", label);
      }
      if (hidden) { art.setAlpha(.1); shine.setAlpha(.03); shadow.setAlpha(.08); brick.getData("label")?.setAlpha(.1); }
      this.bricks.add(brick);
      brick.body.updateFromGameObject();
      return brick;
    }

    destroyBrickDisplay(brick) {
      ["label", "shadow", "shine", "art", "damageArt"].forEach((key) => brick.getData(key)?.destroy());
      brick.destroy();
    }

    openClosedArmorPockets() {
      // Four armor blocks at the corners of a rectangle can capture a ball on
      // a repeating orbit even when the gaps look generous. Remove one corner
      // from every such pocket while preserving the barrier challenge.
      let changed = true;
      while (changed) {
        changed = false;
        const armor = this.bricks.getChildren().filter((brick) => brick.active && brick.getData("indestructible") && Number.isInteger(brick.getData("gridRow")));
        const at = new Map(armor.map((brick) => [`${brick.getData("gridRow")}:${brick.getData("gridCol")}`, brick]));
        outer: for (const topLeft of armor) {
          const row = topLeft.getData("gridRow"), col = topLeft.getData("gridCol");
          for (const topRight of armor) {
            const rightCol = topRight.getData("gridCol");
            if (topRight.getData("gridRow") !== row || rightCol <= col) continue;
            for (const bottomLeft of armor) {
              const bottomRow = bottomLeft.getData("gridRow");
              if (bottomLeft.getData("gridCol") !== col || bottomRow <= row) continue;
              const bottomRight = at.get(`${bottomRow}:${rightCol}`);
              if (!bottomRight) continue;
              this.destroyBrickDisplay(bottomRight);
              changed = true;
              break outer;
            }
          }
        }
      }
    }

    resetPaddle(serve = true) {
      this.serveTimer?.remove(false);
      this.paddle.setPosition(W / 2, PADDLE_Y).setSize(112, 16);
      this.paddle.body.setSize(112, 16).reset(W / 2, PADDLE_Y);
      this.paddleGlow.setPosition(W / 2, PADDLE_Y).setSize(124, 24);
      this.paddleArt.setPosition(W / 2, PADDLE_Y).setDisplaySize(142, 52);
      this.targetX = W / 2;
      this.paddleVelocityX = 0;
      this.balls.clear(true, true);
      this.createBall(W / 2, H - 78, 215 * this.speedFactor, -510 * this.speedFactor, serve);
    }

    queueServe(delay = 1800) {
      this.serveTimer?.remove(false);
      this.serveTimer = this.time.delayedCall(delay, () => {
        if (this.runState !== "playing") return;
        const docked = this.balls.getChildren().some((ball) => ball.active && ball.getData("stuck"));
        if (docked) this.launchOrFire();
      });
    }

    createBall(x, y, vx, vy, stuck = false) {
      const ball = this.add.circle(x, y, 7, 0xffffff, 0);
      const art = this.add.image(x, y, "pulse-ball").setDisplaySize(this.time.now < this.superUntil ? 36 : 18, this.time.now < this.superUntil ? 36 : 18).setDepth(3);
      ball.setData("art", art);
      ball.once("destroy", () => art.destroy());
      ball.setData("stuck", stuck);
      ball.setData("previousX", x);
      ball.setData("previousY", y);
      ball.setData("armorHits", []);
      ball.setData("lastPaddleAt", this.time.now);
      ball.setData("lastProgressAt", this.time.now);
      ball.setData("phaseUntil", 0);
      this.balls.add(ball);
      ball.body.setCircle(7).setBounce(1).setCollideWorldBounds(true).setVelocity(vx, vy);
      ball.body.onWorldBounds = true;
      return ball;
    }

    startRun(startLevel = 1) {
      if (!this.testMode) localStorage.removeItem(runKey);
      this.score = 0; this.level = Math.max(1, startLevel); this.lives = 3; this.combo = 1;
      this.sectorLivesLost = 0; this.sectorElapsedMs = 0; this.sectorPeakCombo = 1; this.nextLifeScore = 100000;
      this.wideUntil = this.slowUntil = this.laserUntil = this.superUntil = 0;
      this.slowTimer?.remove(false); this.slowActive = false;
      this.makeLevel(); this.resetPaddle(true);
      this.runState = "playing"; this.physics.resume(); this.hideOverlay(); this.updateHud(); this.updatePowerHud();
      this.time.delayedCall(0, () => { if (this.runState === "playing") this.physics.resume(); });
      this.showSectorIntro();
      this.queueServe();
      $("campaign").hidden = true;
    }

    nextLevel() {
      this.level++; this.combo = 1; this.sectorLivesLost = 0; this.sectorElapsedMs = 0; this.sectorPeakCombo = 1;
      this.wideUntil = this.slowUntil = this.laserUntil = this.superUntil = 0;
      this.slowTimer?.remove(false); this.slowActive = false;
      this.makeLevel(); this.resetPaddle(true);
      this.runState = "playing"; this.physics.resume(); this.hideOverlay(); this.updateHud(); this.updatePowerHud();
      this.time.delayedCall(0, () => { if (this.runState === "playing") this.physics.resume(); });
      this.showSectorIntro();
      this.queueServe();
      this.scheduleSave();
    }

    launchOrFire() {
      if (this.runState !== "playing") return;
      let launched = false;
      this.balls.children.iterate((ball) => {
        if (ball?.getData("stuck")) {
          launched = true;
          ball.setData("stuck", false);
          const aim = Phaser.Math.Clamp((this.targetX - W / 2) * 1.35, -430, 430) || 300;
          ball.body.setVelocity(aim * .82 * this.speedFactor, -510 * this.speedFactor);
          this.tone(520, .08);
        }
      });
      if (!launched) this.fire();
    }

    fire() {
      const now = this.time.now;
      if (now >= this.laserUntil || now - this.lastShot < 170) return;
      this.lastShot = now;
      for (const x of [this.paddle.x - this.paddle.displayWidth / 2 + 11, this.paddle.x + this.paddle.displayWidth / 2 - 11]) {
        const shot = this.add.rectangle(x, this.paddle.y - 14, 4, 15, 0xffffff).setStrokeStyle(2, 0xff626d);
        this.shots.add(shot);
        shot.body.setVelocityY(-820);
      }
      this.tone(930, .04, "square", .012);
    }

    hitPaddle(ball, paddleX = this.paddle.x) {
      if (ball.body.velocity.y <= 0) return;
      ball.setData("armorHits", []);
      ball.setData("lastPaddleAt", this.time.now);
      ball.setData("lastProgressAt", this.time.now);
      const usableHalfWidth = Math.max(24, this.paddle.displayWidth / 2 - 7);
      const contact = Phaser.Math.Clamp((ball.x - paddleX) / usableHalfWidth, -1, 1);
      const windage = Phaser.Math.Clamp(this.paddleVelocityX / 900, -1, 1);
      const expandedContact = Math.sign(contact) * Math.pow(Math.abs(contact), .62);
      let reboundDegrees = expandedContact * 68 + windage * 20;

      // A centered return keeps its prior lateral intent instead of falling
      // into a vertical rail. Moving the paddle overrides that intent.
      if (Math.abs(reboundDegrees) < 14) {
        const incomingSide = Math.sign(ball.body.velocity.x) || Math.sign(windage) || (Math.random() < .5 ? -1 : 1);
        reboundDegrees = incomingSide * 14;
      }
      reboundDegrees = Phaser.Math.Clamp(reboundDegrees, -74, 74);

      const speed = Phaser.Math.Clamp(ball.body.speed + 7 * this.speedFactor, 530 * this.speedFactor, 710 * this.speedFactor);
      const angle = Phaser.Math.DegToRad(reboundDegrees);
      const vx = Math.sin(angle) * speed;
      const vy = -Math.cos(angle) * speed;
      ball.setY(this.paddle.y - this.paddle.displayHeight / 2 - 8);
      ball.body.reset(ball.x, ball.y);
      ball.body.setVelocity(vx, vy);
      this.paddleGlow.setAlpha(.5).setScale(1.08, 1.35);
      this.tweens.add({ targets: this.paddleGlow, alpha: .14, scaleX: 1, scaleY: 1, duration: 130, ease: "Quad.out" });
      this.combo = 1;
      this.tone(340 + Math.abs(reboundDegrees) * 2, .05, "triangle");
      this.haptic(8);
      this.updateHud();
    }

    crossedPaddle(ball) {
      if (ball.getData("stuck") || ball.body.velocity.y <= 0) return false;
      const previousX = ball.getData("previousX") ?? ball.x;
      const previousY = ball.getData("previousY") ?? ball.y;
      const paddleTop = PADDLE_Y - this.paddle.displayHeight / 2;
      const paddleBottom = PADDLE_Y + this.paddle.displayHeight / 2;
      const previousBottom = previousY + 7;
      const currentBottom = ball.y + 7;
      const travel = currentBottom - previousBottom;
      const crossedTop = previousBottom <= paddleTop && currentBottom >= paddleTop;
      const currentOverlap = currentBottom >= paddleTop && ball.y - 7 <= paddleBottom;
      if (!crossedTop && !currentOverlap) return false;

      const crossing = crossedTop && travel > 0 ? Phaser.Math.Clamp((paddleTop - previousBottom) / travel, 0, 1) : 1;
      const crossingX = Phaser.Math.Linear(previousX, ball.x, crossing);
      const previousPaddleX = this.previousPaddleFrameX ?? this.paddle.x;
      const paddleAtImpact = Phaser.Math.Linear(previousPaddleX, this.paddle.x, crossing);
      const reach = this.paddle.displayWidth / 2 + 7;
      if (Math.abs(crossingX - paddleAtImpact) > reach && Math.abs(ball.x - this.paddle.x) > reach) return false;

      ball.setX(crossingX);
      this.hitPaddle(ball, paddleAtImpact);
      return true;
    }

    hitBrick(ball, brick) {
      if (brick.getData("indestructible")) this.recordArmorImpact(ball);
      else {
        ball.setData("armorHits", []);
        ball.setData("lastProgressAt", this.time.now);
      }
      this.damageBrick(brick, ball.x, ball.y, false);
    }

    recordArmorImpact(ball) {
      const now = this.time.now;
      const recent = (ball.getData("armorHits") || []).filter((hitAt) => now - hitAt < 7000);
      recent.push(now);
      ball.setData("armorHits", recent);
      const stalled = now - (ball.getData("lastProgressAt") || now) > 4500;
      const awayFromPaddle = now - (ball.getData("lastPaddleAt") || now) > 4500;
      const cooledDown = now - (ball.getData("lastArmorReleaseAt") || -10000) > 7000;
      if (recent.length >= 8 && stalled && awayFromPaddle && cooledDown) this.releaseTrappedBall(ball);
    }

    releaseTrappedBall(ball) {
      const now = this.time.now;
      ball.setData("phaseUntil", now + 1100);
      ball.setData("lastArmorReleaseAt", now);
      ball.setData("lastProgressAt", now);
      ball.setData("armorHits", []);
      const art = ball.getData("art");
      art?.setTint(0x8dffde);
      this.time.delayedCall(1150, () => {
        if (ball.active && this.time.now >= (ball.getData("phaseUntil") || 0)) art?.clearTint();
      });
      this.showToast("PHASE RELEASE");
      this.tone(760, .08, "sine", .018);
    }

    shouldBounceBrick(ball, brick) {
      if (!ball.active) return false;
      if (brick?.getData("indestructible") && this.time.now < (ball.getData("phaseUntil") || 0)) return false;
      return brick?.getData("indestructible") || this.time.now >= this.superUntil;
    }

    superHitBrick(ball, brick) {
      if (this.time.now >= this.superUntil || !ball.active || !brick.active || brick.getData("indestructible")) return;
      brick.setData("hp", 1);
      this.damageBrick(brick, ball.x, ball.y, false);
    }

    shotBrick(shot, brick) {
      if (!shot.active || !brick.active) return;
      shot.destroy();
      this.damageBrick(brick, shot.x, shot.y, true);
    }

    damageBrick(brick, x, y, shot) {
      if (!brick.active) return;
      if (brick.getData("indestructible")) {
        this.burst(x, y, 0xdce7f5, 4);
        this.impactShake(35, .0012);
        this.pulseBrickArt(brick, .93, .9);
        this.tone(190, .055, "square", .012);
        return;
      }
      if (brick.getData("type") === "hidden" && !brick.getData("revealed")) {
        brick.setData("revealed", true); brick.getData("art")?.setAlpha(1);
        brick.getData("shine")?.setAlpha(.28); brick.getData("shadow")?.setAlpha(.42); brick.getData("label")?.setAlpha(1);
        this.burst(x, y, brick.getData("color"), 7); this.tone(610, .09, "triangle", .014);
        this.scheduleSave(); return;
      }
      const hp = brick.getData("hp") - 1;
      const maxHp = brick.getData("maxHp");
      brick.setData("hp", hp);
      const points = (shot ? 45 : 80) * this.combo * maxHp;
      this.score += points;
      const previousCombo = this.combo;
      this.combo = Math.min(9, this.combo + 1);
      if (this.combo > previousCombo && [3, 5, 7, 9].includes(this.combo)) this.showComboPulse(this.combo);
      this.burst(x, y, brick.getData("color"), shot ? 6 : 10);
      this.tone((shot ? 520 : 360) + this.combo * 45, .045, "square", .016);
      const label = brick.getData("label");
      if (hp <= 0) {
        this.floatScore(x, y, points);
        const type = brick.getData("type");
        const brickWidth = brick.width;
        brick.getData("shadow")?.destroy();
        brick.getData("shine")?.destroy();
        brick.getData("art")?.destroy();
        brick.getData("damageArt")?.destroy();
        if (label) label.destroy();
        this.maybeDrop(brick.x, brick.y);
        brick.destroy();
        this.remainingBricks = Math.max(0, (this.remainingBricks || 0) - 1);
        if (type === "explosive") this.detonate(x, y, brickWidth);
        if (type === "switch") this.disableGates();
        if (type === "split" && !shot && this.splitsGranted < 2 && this.balls.countActive(true) < 3) {
          this.splitsGranted++;
          this.createBall(x, y + 10, Phaser.Math.RND.pick([-290, 290]), 410);
        }
        if (maxHp > 1 || this.time.now < this.superUntil) this.impactShake(45, .0016);
      } else {
        const damage = 1 - hp / maxHp;
        brick.getData("art")?.setAlpha(1 - damage * .18);
        brick.getData("damageArt")?.setVisible(true).setAlpha(.38 + damage * .55);
        brick.getData("shine")?.setAlpha(Math.max(.06, .28 - damage * .18));
        if (label && (brick.getData("type") === "normal" || brick.getData("type") === "hidden")) label.setText(String(hp));
        this.pulseBrickArt(brick, .94, .86);
      }
      this.updateHud();
      this.scheduleSave();
      this.checkLevelComplete();
    }

    pulseBrickArt(brick, squashX, squashY) {
      const targets = [
        [brick.getData("art"), brick.getData("artScaleX"), brick.getData("artScaleY")],
        [brick.getData("damageArt"), brick.getData("damageScaleX"), brick.getData("damageScaleY")],
        [brick.getData("shine"), 1, 1],
      ];
      targets.forEach(([target, baseX, baseY]) => {
        if (!target?.active) return;
        this.tweens.killTweensOf(target);
        target.setScale(baseX, baseY);
        this.tweens.add({ targets: target, scaleX: baseX * squashX, scaleY: baseY * squashY, yoyo: true, duration: 55, onComplete: () => target.active && target.setScale(baseX, baseY) });
      });
    }

    detonate(x, y, width) {
      this.impactShake(85, .003);
      this.burst(x, y, 0xff734d, 24); this.tone(105, .16, "sawtooth", .026);
      const nearby = this.bricks.getChildren().filter((brick) => brick.active && !brick.getData("indestructible") && Phaser.Math.Distance.Between(x, y, brick.x, brick.y) < width * 1.75);
      nearby.forEach((brick) => this.damageBrick(brick, brick.x, brick.y, false));
    }

    disableGates() {
      this.bricks.getChildren().filter((brick) => brick.active && brick.getData("switchControlled")).forEach((brick) => {
        brick.getData("label")?.destroy(); brick.getData("shadow")?.destroy(); brick.getData("shine")?.destroy(); brick.getData("art")?.destroy(); brick.getData("damageArt")?.destroy();
        this.burst(brick.x, brick.y, 0x8dff67, 6); brick.destroy();
      });
      this.showToast("Armor offline"); this.tone(740, .18, "square", .018);
    }

    spawnEnemy(boss = false, saved = null) {
      const x = saved?.x ?? (boss ? W / 2 : Phaser.Math.Between(80, W - 80));
      const y = saved?.y ?? (boss ? 520 : Phaser.Math.Between(500, 680));
      const enemy = this.add.image(x, y, boss ? "boss-core" : "drone").setDisplaySize(boss ? 72 : 42, boss ? 72 : 38);
      this.enemies.add(enemy);
      const hp = saved?.hp ?? (boss ? 14 + Math.floor(this.level / 10) * 4 : 2);
      enemy.setData({ boss, hp, maxHp: saved?.maxHp ?? hp, baseScaleX: enemy.scaleX, baseScaleY: enemy.scaleY, baseY: y, phase: saved?.phase ?? Math.random() * Math.PI * 2 });
      enemy.body.setAllowGravity(false).setImmovable(true).setVelocityX(saved?.vx ?? (boss ? 75 : Phaser.Math.RND.pick([-95, 95]))).setBounce(1).setCollideWorldBounds(true);
      if (boss) {
        const label = this.add.text(x, y, String(hp), { fontFamily: "system-ui", fontSize: "13px", fontStyle: "900", color: "#ffffff" }).setOrigin(.5);
        enemy.setData("label", label);
        this.showToast("Core guardian");
      }
      return enemy;
    }

    hitEnemy(ball, enemy) { this.damageEnemy(enemy, ball.x, ball.y, false); }
    shotEnemy(shot, enemy) { if (!shot.active || !enemy.active) return; shot.destroy(); this.damageEnemy(enemy, shot.x, shot.y, true); }

    damageEnemy(enemy, x, y, shot) {
      if (!enemy.active) return;
      const hp = enemy.getData("hp") - 1;
      enemy.setData("hp", hp); enemy.getData("label")?.setText(String(Math.max(0, hp)));
      this.score += enemy.getData("boss") ? 250 : shot ? 120 : 180;
      this.burst(x, y, enemy.getData("boss") ? 0xff626d : 0xff4fd8, enemy.getData("boss") ? 12 : 7);
      const baseScaleX = enemy.getData("baseScaleX"), baseScaleY = enemy.getData("baseScaleY");
      this.tweens.killTweensOf(enemy);
      enemy.setScale(baseScaleX, baseScaleY);
      this.tweens.add({ targets: enemy, scaleX: baseScaleX * .82, scaleY: baseScaleY * .82, yoyo: true, duration: 65, onComplete: () => enemy.active && enemy.setScale(baseScaleX, baseScaleY) });
      this.tone(enemy.getData("boss") ? 145 : 480, .06, "square", .015);
      if (hp <= 0) {
        const boss = enemy.getData("boss"); enemy.getData("label")?.destroy(); enemy.destroy();
        this.impactShake(boss ? 180 : 65, boss ? .006 : .002);
        if (boss) { this.score += 2500; this.showToast("Guardian down"); }
        else if (Math.random() < .18) this.maybeDrop(x, y);
        this.checkLevelComplete();
      }
      this.updateHud(); this.scheduleSave();
    }

    checkLevelComplete() {
      if (this.runState !== "playing") return;
      const bossRemains = this.enemies.getChildren().some((enemy) => enemy.active && enemy.getData("boss"));
      const destructibleRemaining = this.bricks.getChildren().filter((brick) => brick.active && !brick.getData("indestructible")).length;
      this.remainingBricks = destructibleRemaining;
      if (destructibleRemaining === 0 && !bossRemains) this.finishLevel();
    }

    burst(x, y, color, amount) {
      for (let i = 0; i < amount; i++) {
        const spark = this.add.rectangle(x, y, 3, 3, color);
        this.tweens.add({ targets: spark, x: x + Phaser.Math.Between(-90, 90), y: y + Phaser.Math.Between(-55, 75), alpha: 0, duration: Phaser.Math.Between(260, 520), ease: "Quad.out", onComplete: () => spark.destroy() });
      }
    }

    maybeDrop(x, y) {
      if (Math.random() > .1) return;
      const type = Phaser.Utils.Array.GetRandom(["W", "M", "S", "L", "B"]);
      const drop = this.add.image(x, y, `power-${type}`).setDisplaySize(type === "W" ? 46 : 38, type === "W" ? 22 : 38);
      drop.setData({ type });
      this.drops.add(drop);
      drop.body.setCircle(17).setVelocityY(165);
    }

    collectPower(_paddle, drop) {
      if (!drop.active) return;
      const type = drop.getData("type"), now = this.time.now;
      drop.destroy();
      this.haptic([14, 20, 14]);
      if (type === "W") { this.wideUntil = now + 12000; this.showToast("Wide beam"); this.tone(620, .16, "triangle"); }
      if (type === "S") {
        this.slowUntil = now + 9000;
        if (!this.slowActive) this.balls.children.iterate((ball) => { if (ball) ball.body.velocity.scale(.72); });
        this.slowActive = true;
        this.slowTimer?.remove(false);
        this.slowTimer = this.time.delayedCall(9000, () => { this.balls.children.iterate((ball) => { if (ball && !ball.getData("stuck")) ball.body.velocity.scale(1 / .72); }); this.slowActive = false; });
        this.showToast("Time warp"); this.tone(420, .2);
      }
      if (type === "L") { this.laserUntil = now + 15000; this.showToast("Pulse cannon"); this.tone(880, .18, "sawtooth", .018); }
      if (type === "B") {
        this.superUntil = now + 10000;
        this.balls.children.iterate((ball) => { if (ball) ball.getData("art")?.setDisplaySize(36, 36); });
        this.showToast("Super ball"); this.tone(1080, .22, "square", .02);
      }
      if (type === "M") {
        const source = this.balls.getFirstAlive();
        if (source) for (const direction of [-1, 1]) this.createBall(source.x, source.y, Math.abs(source.body.velocity.x || 290) * direction, -Math.abs(source.body.velocity.y || 450));
        this.showToast("Multiball"); this.tone(760, .18, "square", .02);
      }
      this.scheduleSave();
    }

    loseBall(ball) {
      ball.destroy();
      if (this.balls.countActive(true) > 0) return;
      this.lives--; this.sectorLivesLost++; this.combo = 1; this.updateHud();
      if (this.lives <= 0) { this.finishRun(); return; }
      this.resetPaddle(true); this.showToast("Pulse lost"); this.tone(120, .35, "sawtooth", .025);
      this.queueServe(1600);
      this.scheduleSave();
    }

    finishLevel() {
      const flawlessBonus = this.sectorLivesLost === 0 ? 2500 : 0;
      const clearSeconds = Math.max(1, Math.round(this.sectorElapsedMs / 1000));
      const timeBonus = Math.max(0, (150 - clearSeconds) * 40);
      let rank = "C";
      if (this.sectorLivesLost === 0 && this.sectorPeakCombo >= 7 && clearSeconds <= 120) rank = "S";
      else if ((this.sectorLivesLost === 0 && this.sectorPeakCombo >= 4) || this.sectorPeakCombo >= 7) rank = "A";
      else if (this.sectorLivesLost <= 1 || this.sectorPeakCombo >= 4) rank = "B";
      const sectorBonus = this.level * 750 + this.lives * 400 + flawlessBonus + timeBonus;
      this.score += sectorBonus;
      this.lastSectorRank = rank;
      const rankValue = { C: 1, B: 2, A: 3, S: 4 };
      if (!this.testMode && (!rankValue[this.sectorRanks[this.level]] || rankValue[rank] > rankValue[this.sectorRanks[this.level]])) {
        this.sectorRanks[this.level] = rank; localStorage.setItem(rankKey, JSON.stringify(this.sectorRanks));
      }
      this.runState = "level"; this.physics.pause();
      if (!this.testMode) {
        this.highestSector = Math.max(this.highestSector, this.level + 1);
        localStorage.setItem(progressKey, this.highestSector);
      }
      this.updateHud(); this.haptic([30, 35, 60]);
      const flawless = flawlessBonus ? " · Flawless +2,500" : "";
      this.setOverlay(`Sector cleared · Rank ${rank}`, `${sectorNames[(this.level - 1) % sectorNames.length]}`, `${clearSeconds}s · Peak combo ×${this.sectorPeakCombo} · Bonus +${sectorBonus.toLocaleString()}${flawless}.`, "Next level");
      this.saveRun();
    }

    finishRun() {
      this.runState = "over"; this.physics.pause();
      if (!this.testMode) {
        localStorage.removeItem(runKey);
        this.best = Math.max(this.best, this.score);
        localStorage.setItem(bestKey, this.best);
        window.GameScores?.record({ game: "neon-breaker", mode: "solo", difficulty: `level-${this.level}`, value: this.score, meta: { level: this.level } });
      }
      this.setOverlay("Run complete", "Pulse expired", `Final score ${String(this.score).padStart(6, "0")}. Best ${String(this.best).padStart(6, "0")}.`, "Run it again");
      this.configureCampaignStart();
    }

    togglePause() {
      if (this.runState === "playing") {
        this.powerPauseStarted = this.time.now;
        if (this.slowTimer) this.slowTimer.paused = true;
        this.runState = "paused"; this.physics.pause(); this.currentMusic?.pause();
        this.setOverlay("Run suspended", "Paused", "The pulse is holding in place.", "Resume");
        this.saveRun();
      } else if (this.runState === "paused") {
        const pausedFor = Math.max(0, this.time.now - (this.powerPauseStarted || this.time.now));
        for (const key of ["wideUntil", "slowUntil", "laserUntil", "superUntil"]) if (this[key] > 0) this[key] += pausedFor;
        if (this.slowTimer) this.slowTimer.paused = false;
        this.runState = "playing"; this.physics.resume(); this.hideOverlay(); this.startMusicForLevel();
        if (this.balls.getChildren().some((ball) => ball.active && ball.getData("stuck"))) this.queueServe(1200);
      }
    }

    setOverlay(eyebrow, title, copy, button) {
      $("eyebrow").textContent = eyebrow; $("overlay-title").textContent = title; $("overlay-copy").textContent = copy; $("start").textContent = button; $("overlay").hidden = false;
    }
    hideOverlay() { $("overlay").hidden = true; }
    showToast(text) { const node = $("toast"); node.textContent = text; node.classList.remove("show"); void node.offsetWidth; node.classList.add("show"); }

    updateHud() {
      this.sectorPeakCombo = Math.max(this.sectorPeakCombo || 1, this.combo);
      while (this.score >= this.nextLifeScore) {
        this.nextLifeScore += 100000;
        if (this.lives < 5) { this.lives++; this.showToast("Reserve pulse awarded"); this.haptic([20, 30, 20]); }
      }
      this.hudScore.setText(String(this.score).padStart(6, "0"));
      this.hudLevel.setText(String(this.level).padStart(2, "0"));
      this.hudLives.setText(this.lives > 0 ? "● ".repeat(this.lives).trim() : "—");
      this.hudSector.setText(sectorNames[(this.level - 1) % sectorNames.length].toUpperCase());
      this.hudTest?.setText(`TEST MODE · LEVEL ${String(this.testLevel).padStart(2, "0")}`);
      this.sectorWash?.setFillStyle(palette[(this.level - 1) % palette.length], .035);
      this.hudCombo.setText(`COMBO ×${this.combo}`);
      this.hudBest.setText(`BEST ${String(Math.max(this.best, this.score)).padStart(6, "0")}`);
    }

    updatePowerHud() {
      const now = this.time.now;
      const active = [
        ["WIDE", this.wideUntil], ["SLOW", this.slowUntil], ["LASER", this.laserUntil], ["SUPER", this.superUntil],
      ].filter(([, until]) => until > now).map(([name, until]) => `${name} ${Math.ceil((until - now) / 1000)}s`);
      this.hudPowers.setText(active.join("  ·  "));
    }

    scheduleSave() {
      if (this.testMode) return;
      if (this.runState !== "playing" && this.runState !== "paused" && this.runState !== "level") return;
      this.saveTimer?.remove(false);
      this.saveTimer = this.time.delayedCall(180, () => this.saveRun());
    }

    saveRun() {
      if (this.testMode) return;
      if (this.runState !== "playing" && this.runState !== "paused" && this.runState !== "level") return;
      const now = this.time.now;
      const snapshot = {
        schema: 3,
        savedAt: Date.now(),
        state: this.runState,
        score: this.score,
        level: this.level,
        lives: this.lives,
        combo: this.combo,
        sectorLivesLost: this.sectorLivesLost,
        sectorElapsedMs: this.sectorElapsedMs,
        sectorPeakCombo: this.sectorPeakCombo,
        lastSectorRank: this.lastSectorRank,
        remainingBricks: this.remainingBricks,
        splitsGranted: this.splitsGranted,
        paddleX: this.paddle.x,
        powers: {
          wide: Math.max(0, this.wideUntil - now),
          slow: Math.max(0, this.slowUntil - now),
          laser: Math.max(0, this.laserUntil - now),
          super: Math.max(0, this.superUntil - now),
        },
        bricks: this.bricks.getChildren().filter((brick) => brick.active).map((brick) => ({
          x: brick.x, y: brick.y, width: brick.width, height: brick.height,
          hp: brick.getData("hp"), maxHp: brick.getData("maxHp"), color: brick.getData("color"),
          indestructible: Boolean(brick.getData("indestructible")),
          type: brick.getData("type"), revealed: Boolean(brick.getData("revealed")),
        })),
        balls: this.balls.getChildren().filter((ball) => ball.active).map((ball) => ({
          x: ball.x, y: ball.y, vx: ball.body.velocity.x, vy: ball.body.velocity.y,
          stuck: Boolean(ball.getData("stuck")),
        })),
        enemies: this.enemies.getChildren().filter((enemy) => enemy.active).map((enemy) => ({
          x: enemy.x, y: enemy.y, vx: enemy.body.velocity.x, hp: enemy.getData("hp"), maxHp: enemy.getData("maxHp"),
          boss: Boolean(enemy.getData("boss")), phase: enemy.getData("phase"),
        })),
      };
      localStorage.setItem(runKey, JSON.stringify(snapshot));
    }

    restoreRun() {
      let snapshot;
      try { snapshot = JSON.parse(localStorage.getItem(runKey) || "null"); } catch { return false; }
      if (snapshot?.schema !== 3 && Number(snapshot?.level) > this.highestSector) {
        this.highestSector = Number(snapshot.level);
        localStorage.setItem(progressKey, this.highestSector);
      }
      if (!snapshot || snapshot.schema !== 3 || !Array.isArray(snapshot.bricks) || !Array.isArray(snapshot.balls) || snapshot.lives < 1) return false;

      this.bricks.children.iterate((brick) => {
        brick?.getData("label")?.destroy(); brick?.getData("shadow")?.destroy(); brick?.getData("shine")?.destroy(); brick?.getData("art")?.destroy(); brick?.getData("damageArt")?.destroy();
      });
      this.bricks.clear(true, true); this.balls.clear(true, true); this.drops.clear(true, true); this.shots.clear(true, true);
      this.enemies.children.iterate((enemy) => enemy?.getData("label")?.destroy()); this.enemies.clear(true, true);
      this.score = Number(snapshot.score) || 0;
      this.level = Math.max(1, Number(snapshot.level) || 1);
      this.updateBackdrop(this.level);
      this.musicKey = this.musicForLevel(this.level);
      this.lives = Math.max(1, Number(snapshot.lives) || 3);
      this.combo = Phaser.Math.Clamp(Number(snapshot.combo) || 1, 1, 9);
      this.sectorLivesLost = Math.max(0, Number(snapshot.sectorLivesLost) || 0);
      this.sectorElapsedMs = Math.max(0, Number(snapshot.sectorElapsedMs) || 0);
      this.sectorPeakCombo = Math.max(this.combo, Number(snapshot.sectorPeakCombo) || 1);
      this.lastSectorRank = snapshot.lastSectorRank || null;
      this.nextLifeScore = (Math.floor(this.score / 100000) + 1) * 100000;
      snapshot.bricks.forEach((brick) => {
        this.createBrick(brick.x, brick.y, brick.width, brick.height, brick.maxHp || brick.hp || 1, brick.color || palette[0], Boolean(brick.indestructible), brick.type || "normal");
        const restored = this.bricks.getChildren().at(-1);
        restored.setData("hp", brick.hp || 1);
        if (brick.type === "hidden" && brick.revealed) { restored.setData("revealed", true); restored.getData("art")?.setAlpha(1); restored.getData("shine")?.setAlpha(.28); restored.getData("shadow")?.setAlpha(.42); restored.getData("label")?.setAlpha(1); }
        if ((brick.type === "normal" || brick.type === "hidden") && !brick.indestructible) restored.getData("label")?.setText(String(brick.hp || 1));
      });
      this.remainingBricks = snapshot.bricks.filter((brick) => !brick.indestructible).length;
      this.splitsGranted = Phaser.Math.Clamp(Number(snapshot.splitsGranted) || 0, 0, 2);
      snapshot.balls.forEach((ball) => this.createBall(ball.x, ball.y, ball.vx, ball.vy, Boolean(ball.stuck)));
      (snapshot.enemies || []).forEach((enemy) => this.spawnEnemy(Boolean(enemy.boss), enemy));
      if (!this.balls.countActive(true)) this.createBall(W / 2, H - 78, 215, -510, true);
      this.paddle.setX(Phaser.Math.Clamp(Number(snapshot.paddleX) || W / 2, 70, W - 70));
      this.targetX = this.paddle.x;
      const now = this.time.now, powers = snapshot.powers || {};
      this.wideUntil = now + Math.max(0, Number(powers.wide) || 0);
      this.slowUntil = now + Math.max(0, Number(powers.slow) || 0);
      this.laserUntil = now + Math.max(0, Number(powers.laser) || 0);
      this.superUntil = now + Math.max(0, Number(powers.super) || 0);
      if (this.slowUntil > now) {
        this.slowActive = true;
        this.slowTimer?.remove(false);
        this.slowTimer = this.time.delayedCall(this.slowUntil - now, () => {
          this.balls.children.iterate((ball) => { if (ball && !ball.getData("stuck")) ball.body.velocity.scale(1 / .72); });
          this.slowActive = false;
        });
      }
      this.runState = snapshot.state === "level" ? "level" : "paused";
      this.physics.pause(); this.updateHud(); this.updatePowerHud();
      if (this.runState === "level") this.setOverlay(`Sector cleared${this.lastSectorRank ? ` · Rank ${this.lastSectorRank}` : ""}`, sectorNames[(this.level - 1) % sectorNames.length], "Your cleared sector is ready to continue.", "Next level");
      else this.setOverlay("Run recovered", "Continue run", `Level ${this.level} · ${this.lives} ${this.lives === 1 ? "life" : "lives"} remaining`, "Resume");
      return true;
    }

    async primeAudio() {
      if (!this.soundOn || (this.settings.volume <= 0 && this.settings.musicVolume <= 0)) return false;
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return false;
      if (!this.audio) this.audio = new AudioEngine({ latencyHint: "interactive" });
      const musicStarted = this.startMusicForLevel();
      if (this.audio.state === "suspended") {
        try { await this.audio.resume(); } catch (_error) { return false; }
      }
      if (musicStarted) await musicStarted.catch(() => false);
      this.audioReady = this.audio.state === "running";
      return this.audioReady;
    }

    musicForLevel(level) {
      const sector = ((level - 1) % 10) + 1;
      if (sector === 10) return "guardian";
      return ["neon", "armored", "hypergrid"][(level - 1) % 3];
    }

    musicOutputVolume() {
      return Phaser.Math.Clamp(this.settings.musicVolume * MUSIC_MASTER_GAIN, 0, 1);
    }

    connectMusicAnalyser(audioElement) {
      if (!this.audio || !audioElement || audioElement.dataset.analyserConnected) return;
      if (!this.musicAnalyser) {
        this.musicAnalyser = this.audio.createAnalyser();
        this.musicAnalyser.fftSize = 128;
        this.musicAnalyser.smoothingTimeConstant = .84;
        this.musicAnalyser.connect(this.audio.destination);
        this.musicFrequency = new Uint8Array(this.musicAnalyser.frequencyBinCount);
      }
      const source = this.audio.createMediaElementSource(audioElement);
      source.connect(this.musicAnalyser);
      audioElement.dataset.analyserConnected = "true";
    }

    startMusicForLevel() {
      if (!this.soundOn || this.settings.musicVolume <= 0 || this.runState === "paused") return null;
      const key = this.musicKey || this.musicForLevel(this.level);
      if (this.currentMusicKey === key && this.currentMusic) {
        this.currentMusic.volume = this.musicOutputVolume();
        return this.currentMusic.paused ? this.currentMusic.play() : Promise.resolve();
      }
      const next = new Audio(musicFiles[key]);
      next.loop = true; next.preload = "auto"; next.volume = 0;
      this.connectMusicAnalyser(next);
      const previous = this.currentMusic;
      const previousKey = this.currentMusicKey;
      this.currentMusic = next; this.currentMusicKey = key;
      const play = next.play();
      play.then(() => {
        this.musicFade?.stop(); this.previousMusicFade?.stop();
        const incoming = { volume: 0 };
        this.musicFade = this.tweens.add({ targets: incoming, volume: this.musicOutputVolume(), duration: previous ? 1100 : 650, onUpdate: () => { if (next === this.currentMusic) next.volume = Phaser.Math.Clamp(incoming.volume, 0, 1); } });
        if (previous) {
          const outgoing = { volume: previous.volume };
          this.previousMusicFade = this.tweens.add({ targets: outgoing, volume: 0, duration: 700, onUpdate: () => { previous.volume = Phaser.Math.Clamp(outgoing.volume, 0, 1); }, onComplete: () => { previous.pause(); previous.src = ""; } });
        }
      }).catch(() => {
        if (this.currentMusic === next) { this.currentMusic = previous; this.currentMusicKey = previousKey || null; }
      });
      return play;
    }

    tone(freq, duration = .05, type = "sine", volume = .035) {
      if (!this.soundOn || this.settings.volume <= 0) return;
      if (!this.audio || this.audio.state !== "running") { this.primeAudio(); return; }
      const osc = this.audio.createOscillator(), gain = this.audio.createGain(), now = this.audio.currentTime;
      const outputVolume = Math.max(.0001, volume * this.settings.volume);
      osc.type = type; osc.frequency.setValueAtTime(freq, now); gain.gain.setValueAtTime(outputVolume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      osc.connect(gain).connect(this.audio.destination); osc.start(now); osc.stop(now + duration);
    }

    update(_time, delta) {
      if (this.runState !== "playing") return;
      if (this.physics.world.isPaused) this.physics.resume();
      this.sectorElapsedMs += Math.min(delta, 100);
      if (!this.lastAutosave || this.time.now - this.lastAutosave > 2000) { this.lastAutosave = this.time.now; this.saveRun(); }
      if (!this.lastCompletionAudit || this.time.now - this.lastCompletionAudit > 500) {
        this.lastCompletionAudit = this.time.now; this.checkLevelComplete();
        if (this.runState !== "playing") return;
      }
      this.updatePowerHud();
      this.updateMusicVisual();
      const dt = Math.min(delta, 34) / 1000;
      if (this.level >= 4 && this.level % 10 !== 0 && this.time.now >= this.nextDroneAt) {
        const drones = this.enemies.getChildren().filter((enemy) => enemy.active && !enemy.getData("boss")).length;
        if (drones < 2) this.spawnEnemy(false);
        this.nextDroneAt = this.time.now + Phaser.Math.Between(10500, 14500);
      }
      const direction = (this.cursors.right.isDown || this.keys.D.isDown ? 1 : 0) - (this.cursors.left.isDown || this.keys.A.isDown ? 1 : 0);
      if (direction) this.targetX += direction * 880 * dt;
      const desiredWidth = this.time.now < this.wideUntil ? 168 : 112;
      this.paddle.displayWidth = Phaser.Math.Linear(this.paddle.displayWidth, desiredWidth, Math.min(1, dt * 12));
      this.paddle.body.setSize(this.paddle.displayWidth, 16);
      this.targetX = Phaser.Math.Clamp(this.targetX, 18 + this.paddle.displayWidth / 2, W - 18 - this.paddle.displayWidth / 2);
      const previousPaddleX = this.paddle.x;
      this.paddle.x = Phaser.Math.Linear(this.paddle.x, this.targetX, Math.min(1, dt * 48));
      this.previousPaddleFrameX = previousPaddleX;
      this.paddle.y = PADDLE_Y;
      const instantaneousVelocity = (this.paddle.x - previousPaddleX) / Math.max(dt, .001);
      this.paddleVelocityX = Phaser.Math.Linear(this.paddleVelocityX, instantaneousVelocity, Math.min(1, dt * 18));
      this.paddle.body.reset(this.paddle.x, PADDLE_Y);
      this.paddleGlow.setPosition(this.paddle.x, PADDLE_Y).setDisplaySize(this.paddle.displayWidth + 14, 25);
      this.paddleArt.setPosition(this.paddle.x, PADDLE_Y).setDisplaySize(this.paddle.displayWidth + 30, 52);
      if (this.time.now < this.laserUntil) this.paddleArt.setTint(0xff9aa2);
      else if (this.time.now < this.superUntil) this.paddleArt.setTint(0xa8ff8f);
      else if (this.time.now < this.slowUntil) this.paddleArt.setTint(0xa7f5ff);
      else if (this.time.now < this.wideUntil) this.paddleArt.setTint(0xffa2ea);
      else this.paddleArt.clearTint();

      this.aimGuide.clear();
      let serving = false;
      this.balls.children.iterate((ball) => {
        if (!ball) return;
        const ballArt = ball.getData("art");
        ballArt?.setPosition(ball.x, ball.y).setDisplaySize(this.time.now < this.superUntil ? 36 : 18, this.time.now < this.superUntil ? 36 : 18);
        if (ball.getData("stuck")) {
          serving = true;
          ball.setPosition(this.paddle.x, this.paddle.y - 22);
          ball.body.reset(ball.x, ball.y);
          this.drawServeGuide(ball);
        } else {
          this.crossedPaddle(ball);
          ball.body.moves = true;
          if (ball.body.speed < 40) ball.body.setVelocity(230 * this.speedFactor * (ball.x < W / 2 ? 1 : -1), -500 * this.speedFactor);
          const maximumSpeed = 690 * this.speedFactor;
          ball.body.velocity.x = Phaser.Math.Clamp(ball.body.velocity.x, -maximumSpeed, maximumSpeed);
          ball.body.velocity.y = Phaser.Math.Clamp(ball.body.velocity.y, -maximumSpeed, maximumSpeed);
          const minimumVerticalSpeed = 175 * this.speedFactor;
          if (Math.abs(ball.body.velocity.y) < minimumVerticalSpeed) ball.body.setVelocityY((ball.body.velocity.y < 0 ? -1 : 1) * minimumVerticalSpeed);
          if (ball.y > H + 30) this.loseBall(ball);
          if (!this.settings.reducedMotion && ball.active && this.time.now - (ball.getData("lastTrail") || 0) > 45) {
            ball.setData("lastTrail", this.time.now);
            const trail = this.add.circle(ball.x, ball.y, this.time.now < this.superUntil ? 7 : 3, this.time.now < this.superUntil ? 0x8dff67 : 0x68e8ff, .28).setDepth(-1);
            this.tweens.add({ targets: trail, alpha: 0, scale: .25, duration: 180, onComplete: () => trail.destroy() });
          }
        }
        if (ball?.active) {
          ball.getData("art")?.setPosition(ball.x, ball.y);
          ball.setData("previousX", ball.x);
          ball.setData("previousY", ball.y);
        }
      });
      this.servePrompt.setVisible(serving);
      this.drops.children.iterate((drop) => {
        if (!drop) return;
        if (drop.y > H + 30) drop.destroy();
      });
      this.shots.children.iterate((shot) => { if (shot?.y < -20) shot.destroy(); });
      this.bricks.children.iterate((brick) => {
        if (!brick?.active || brick.getData("type") !== "moving") return;
        const nextX = brick.getData("baseX") + Math.sin(this.time.now * .0016 + brick.getData("movePhase")) * 22;
        brick.x = nextX;
        if (typeof brick.body.refreshBody === "function") brick.body.refreshBody();
        else brick.body.updateFromGameObject();
        brick.getData("label")?.setX(nextX); brick.getData("shadow")?.setX(nextX); brick.getData("shine")?.setX(nextX); brick.getData("art")?.setX(nextX); brick.getData("damageArt")?.setX(nextX);
      });
      this.enemies.children.iterate((enemy) => {
        if (!enemy?.active) return;
        enemy.getData("label")?.setPosition(enemy.x, enemy.y);
        if (enemy.x < 42) enemy.body.setVelocityX(Math.abs(enemy.body.velocity.x));
        if (enemy.x > W - 42) enemy.body.setVelocityX(-Math.abs(enemy.body.velocity.x));
      });
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-host",
    width: W,
    height: H,
    backgroundColor: "#040916",
    physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false, fps: 60 } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    render: { antialias: true, roundPixels: true, powerPreference: "high-performance" },
    fps: { target: 60, forceSetTimeOut: false, smoothStep: true },
    scene: NeonBreaker,
  });

  $("start").onclick = async () => {
    if (!scene) return;
    await scene.primeAudio();
    if (scene.runState === "title" || scene.runState === "over") scene.startRun();
    else if (scene.runState === "level") scene.nextLevel();
    else if (scene.runState === "paused") scene.togglePause();
  };
  $("campaign").onclick = async () => { if (scene) { await scene.primeAudio(); scene.startRun(scene.highestSector); } };
  $("close-settings").onclick = () => scene?.closeSettings();
  $("fullscreen").onclick = async () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "daemoncade:request-fullscreen" }, location.origin);
      return;
    }
    try {
      const active = document.fullscreenElement || document.webkitFullscreenElement;
      if (active) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await exit.call(document);
      } else {
        const request = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
        if (request) await request.call(document.documentElement, { navigationUI: "hide" });
        else throw new Error("Fullscreen unavailable");
      }
    } catch (_error) { scene?.showToast("Fullscreen unavailable"); }
  };
  document.addEventListener("visibilitychange", () => { if (document.hidden && scene?.runState === "playing") scene.togglePause(); });
  window.addEventListener("pagehide", () => scene?.saveRun());
})();
