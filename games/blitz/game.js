import {
  BASE_HEIGHT,
  BASE_WIDTH,
  DIFFICULTY,
  GAME_ID,
  LANE_COUNT,
  MAX_WORLD_Z,
  PLAYER_Z,
} from "./constants.js";
import { LEVELS } from "./data/levels.js";
import {
  createPool,
  spawnBullet,
  spawnCoin,
  stepBullets,
} from "./entities/pools.js";
import { createInput } from "./systems/input.js";
import { createSpawner } from "./systems/spawner.js";
import {
  buyUpgrade,
  createTempUpgrades,
  getPermanentStats,
} from "./systems/upgrades.js";
import { loadSave, persistSave } from "./systems/save.js";
import { createRenderer } from "./renderer.js";
import { createGameSurface, startLoop } from "../daemonos-shared/gameUtils.js";
import {
  createScoreOverlay,
  getBoardIdForGame,
  submitFinalScore,
} from "../daemonos-shared/scoreSystem.js";
import { createRetroAudio } from "../daemonos-shared/retroAudio.js";
import { buildBlitzArt } from "./assets/blitzArt.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function createRng(seed = Date.now()) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function createBlitzApp(osAPI) {
  const appId = GAME_ID;
  const controller = new AbortController();
  const { signal } = controller;

  const wrapper = document.createElement("div");
  wrapper.className = "game-shell";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";

  const { content, ctx, view, clear, resizeObserver, destroy: destroySurface } =
    createGameSurface({
      baseWidth: BASE_WIDTH,
      baseHeight: BASE_HEIGHT,
      fit: "contain",
      pixelArt: true,
      scaleMode: "smart",
    });
  wrapper.appendChild(content);

  const overlayUi = document.createElement("div");
  overlayUi.style.position = "absolute";
  overlayUi.style.inset = "0";
  overlayUi.style.pointerEvents = "none";
  content.appendChild(overlayUi);

  const scoreOverlay = createScoreOverlay({
    parent: overlayUi,
    getBoard: () => getBoardIdForGame("blitz", "classic", currentDifficulty),
    windowDays: 7,
    limit: 5,
  });

  const panel = document.createElement("div");
  panel.style.position = "absolute";
  panel.style.left = "50%";
  panel.style.top = "50%";
  panel.style.transform = "translate(-50%, -50%)";
  panel.style.minWidth = "360px";
  panel.style.padding = "18px";
  panel.style.borderRadius = "14px";
  panel.style.background = "rgba(7, 14, 22, 0.92)";
  panel.style.border = "1px solid rgba(255,255,255,0.12)";
  panel.style.boxShadow = "0 20px 50px rgba(0,0,0,0.45)";
  panel.style.color = "#e7f1ff";
  panel.style.display = "none";
  panel.style.pointerEvents = "auto";
  panel.style.zIndex = "5";
  overlayUi.appendChild(panel);

  const panelTitle = document.createElement("div");
  panelTitle.style.fontSize = "24px";
  panelTitle.style.fontWeight = "700";
  panelTitle.style.marginBottom = "10px";

  const panelBody = document.createElement("div");
  panelBody.style.fontSize = "14px";
  panelBody.style.opacity = "0.92";
  panelBody.style.lineHeight = "1.5";

  const panelButtons = document.createElement("div");
  panelButtons.style.marginTop = "16px";
  panelButtons.style.display = "flex";
  panelButtons.style.gap = "10px";
  panelButtons.style.justifyContent = "flex-end";

  panel.append(panelTitle, panelBody, panelButtons);

  const save = loadSave();
  let currentDifficulty = save.unlockedDifficulties.includes("normal")
    ? "normal"
    : "easy";

  const laneCenters = Array.from(
    { length: LANE_COUNT },
    (_, idx) => idx - (LANE_COUNT - 1) / 2,
  );
  const input = createInput({
    signal,
    surface: content,
    osAPI,
    appId,
    laneCenters,
  });
  const rng = createRng();
  const spawner = createSpawner(rng, laneCenters);
  const art = buildBlitzArt();
  const renderer = createRenderer(ctx, view, laneCenters, art);
  const audio = createRetroAudio({
    musicOn: true,
    sfxOn: true,
    musicVolume: 0.22,
    sfxVolume: 0.28,
  });
  audio.startMusic([220, 196, 262, 247, 294, 247], 0.16);

  const bulletPool = createPool(460, () => ({}));
  const enemyBulletPool = createPool(280, () => ({}));
  const coinPool = createPool(420, () => ({}));

  let state = "intro";
  let runStart = 0;
  let levelIndex = 1;
  let levelTime = 0;
  let score = 0;
  let runCoins = 0;
  let submittedRun = false;
  let cameraX = 0;
  let shake = 0;
  let shootSfxCd = 0;

  const world = {
    levelIndex,
    enemies: [],
    gates: [],
    particles: [],
    floatTexts: [],
    coinsSpawnQueue: [],
    boss: null,
    activeGate: null,
  };

  const player = {
    x: 0,
    hp: 100,
    maxHp: 100,
    lives: 3,
    swarm: 25,
    invuln: 0,
    fireCd: 0,
    hitFlash: 0,
  };

  let tempUpgrades = createTempUpgrades();

  const setPanel = ({ title, html, buttons }) => {
    panelTitle.textContent = title;
    panelBody.innerHTML = html;
    panelButtons.textContent = "";
    buttons.forEach((cfg) => {
      const btn = document.createElement("button");
      btn.className = cfg.primary ? "menu-button primary" : "menu-button";
      btn.textContent = cfg.label;
      btn.addEventListener("click", cfg.onClick, { signal });
      panelButtons.appendChild(btn);
    });
    panel.style.display = "block";
  };

  const closePanel = () => {
    panel.style.display = "none";
  };

  const getDifficulty = () =>
    DIFFICULTY[currentDifficulty] || DIFFICULTY.normal;
  const getLevel = () => LEVELS[(levelIndex - 1) % LEVELS.length];
  const getPermanent = () => getPermanentStats(save.permanentUpgrades);

  const resetForNewRun = () => {
    levelIndex = 1;
    score = 0;
    runCoins = 0;
    submittedRun = false;
    world.levelIndex = levelIndex;
    tempUpgrades = createTempUpgrades();
    player.x = 0;
    player.hp = player.maxHp;
    player.lives = 3;
    player.swarm = 25;
    player.invuln = 0;
    player.fireCd = 0;
    world.enemies = [];
    world.gates = [];
    world.coinsSpawnQueue = [];
    world.boss = null;
    bulletPool.reset();
    enemyBulletPool.reset();
    coinPool.reset();
    levelTime = 0;
    runStart = performance.now();
    spawner.reset();
    cameraX = 0;
    world.particles = [];
    world.floatTexts = [];
    shake = 0;
    shootSfxCd = 0;
  };

  const startLevel = () => {
    world.levelIndex = levelIndex;
    world.enemies = [];
    world.gates = [];
    world.coinsSpawnQueue = [];
    world.boss = null;
    levelTime = 0;
    player.hp = player.maxHp;
    player.invuln = 1.8;
    player.fireCd = 0;
    spawner.reset();
    state = "playing";
    closePanel();
    scoreOverlay.hide();
  };

  const beginRun = () => {
    resetForNewRun();
    startLevel();
  };

  const getBoard = () =>
    getBoardIdForGame("blitz", "classic", currentDifficulty);

  const submitRunScore = async () => {
    if (submittedRun) return;
    submittedRun = true;
    const runMs = Math.max(1, Math.floor(performance.now() - runStart));
    try {
      await submitFinalScore({
        board: getBoard(),
        score,
        runMs,
        meta: {
          difficultyTier: currentDifficulty,
          levelReached: levelIndex,
          coinsEarned: runCoins,
        },
      });
      scoreOverlay.refresh();
    } catch {
      // keep silent in game loop
    }
  };

  const loseLife = () => {
    player.lives -= 1;
    player.hp = player.maxHp;
    player.invuln = 2.2;
    player.swarm = Math.max(1, Math.floor(player.swarm * 0.7));
    if (player.lives <= 0) {
      state = "gameover";
      submitRunScore();
      scoreOverlay.show("Top 5 Scores", "Last 7 days");
      scoreOverlay.refresh();
      setPanel({
        title: "Game Over",
        html: `Score: <b>${
          Math.floor(score)
        }</b><br/>Coins: <b>${runCoins}</b><br/>Level reached: <b>${levelIndex}</b>`,
        buttons: [
          { label: "Play Again", primary: true, onClick: beginRun },
          {
            label: "Back to Intro",
            onClick: () => {
              state = "intro";
              closePanel();
            },
          },
        ],
      });
      audio.playTone({
        freq: 120,
        duration: 0.22,
        type: "sawtooth",
        gain: 0.3,
      });
    }
  };

  const applyGate = (gate) => {
    if (gate.gateType === "swarm") {
      player.swarm = Math.max(0, player.swarm + Math.round(gate.value));
      if (gate.value > 0) score += Math.round(gate.value * 3);
      else score += Math.round(gate.value);
    } else if (gate.gateType === "weapon") {
      const label = applyWeaponUpgrade();
      world.activeGateHint = `Upgrade: ${label}`;
      world.activeGateHintTtl = 1.4;
      audio.playTone({ freq: 680, duration: 0.1, type: "square", gain: 0.2 });
      spawnFloat(`+${label}`, gate.x, gate.z, "#a9d7ff");
    } else if (gate.gateType === "tempstat" && gate.stat) {
      gate.stat.apply(tempUpgrades);
      world.activeGateHint = `${gate.stat.label} applied`;
      world.activeGateHintTtl = 1.4;
      audio.playTone({
        freq: 540,
        duration: 0.1,
        type: "triangle",
        gain: 0.22,
      });
      spawnFloat(gate.stat.label, gate.x, gate.z, "#c4a7ff");
    }
  };

  const spawnHitParticles = (x, z, color = "#bff7ff", count = 8) => {
    for (let i = 0; i < count; i += 1) {
      world.particles.push({
        x,
        z,
        vx: (rng() - 0.5) * 0.8,
        vz: 8 + rng() * 18,
        life: 0.22 + rng() * 0.25,
        maxLife: 0.22 + rng() * 0.25,
        size: 1.6 + rng() * 1.8,
        color,
      });
    }
  };

  const spawnFloat = (text, x, z, color = "#ffffff") => {
    world.floatTexts.push({
      text,
      x,
      z,
      vy: 16 + rng() * 9,
      life: 0.75,
      maxLife: 0.75,
      color,
    });
  };

  const applyWeaponUpgrade = () => {
    const idx = Math.floor(rng() * 6);
    const options = [
      () => {
        tempUpgrades.spread = clamp(tempUpgrades.spread + 0.06, 0.08, 0.35);
        return "Spread";
      },
      () => {
        tempUpgrades.shotsPerBurst = clamp(
          tempUpgrades.shotsPerBurst + 1,
          1,
          5,
        );
        return "Multi Shot";
      },
      () => {
        tempUpgrades.pierce = clamp(tempUpgrades.pierce + 1, 0, 3);
        return "Pierce";
      },
      () => {
        tempUpgrades.fireRateMul = clamp(
          tempUpgrades.fireRateMul + 0.16,
          1,
          2.4,
        );
        return "Rapid Fire";
      },
      () => {
        tempUpgrades.damageMul = clamp(tempUpgrades.damageMul + 0.24, 1, 3.6);
        return "Damage+";
      },
      () => {
        tempUpgrades.shield = clamp(tempUpgrades.shield + 1, 0, 3);
        return "Shield";
      },
    ];
    const label = options[idx]();
    tempUpgrades.labels.push(label);
    if (tempUpgrades.labels.length > 4) tempUpgrades.labels.shift();
    return label;
  };

  const stepPlayer = (dt) => {
    const moveSpeed = 2.5;
    if (input.moveLeft) input.targetX -= dt * moveSpeed;
    if (input.moveRight) input.targetX += dt * moveSpeed;
    input.targetX = clamp(
      input.targetX,
      laneCenters[0],
      laneCenters[laneCenters.length - 1],
    );
    player.x += (input.targetX - player.x) * clamp(dt * 10, 0, 1);
    player.invuln = Math.max(0, player.invuln - dt);
    player.hitFlash = Math.max(0, player.hitFlash - dt);
  };

  const spawnPlayerShots = () => {
    const permanent = getPermanent();
    const shooterCount = Math.max(
      1,
      Math.min(20, Math.round(Math.sqrt(player.swarm) * 2.4)),
    );
    const burst = Math.min(
      tempUpgrades.shotsPerBurst,
      Math.max(1, Math.ceil(shooterCount / 6)),
    );
    const shots = Math.min(24, Math.max(1, Math.floor(shooterCount * 0.45)));
    const damageBase = permanent.baseDamage * tempUpgrades.damageMul;
    for (let i = 0; i < shots; i += 1) {
      const laneSpread = (i - (shots - 1) / 2) * 0.007;
      for (let b = 0; b < burst; b += 1) {
        const spread = (rng() - 0.5) * tempUpgrades.spread + laneSpread;
        const dmg = rng() < permanent.critChance
          ? damageBase * 1.85
          : damageBase;
        spawnBullet(bulletPool, {
          x: player.x + spread,
          z: PLAYER_Z + 1.1,
          vz: 250 + b * 16,
          vx: spread * 10,
          damage: dmg,
          pierce: tempUpgrades.pierce,
          kind: "player",
          ttl: 2,
        });
      }
    }
  };

  const updateCombat = (dt) => {
    const level = getLevel();
    const diff = getDifficulty();
    const permanent = getPermanent();
    const fireBase = permanent.fireRateBase / tempUpgrades.fireRateMul;
    const swarmBoost = clamp(
      1 - Math.min(0.55, Math.log10(player.swarm + 1) * 0.13),
      0.4,
      1,
    );
    player.fireCd -= dt;
    if (player.fireCd <= 0) {
      player.fireCd = fireBase * swarmBoost;
      if (state === "playing") {
        spawnPlayerShots();
        if (shootSfxCd <= 0) {
          audio.playTone({ freq: 760, duration: 0.04, gain: 0.14 });
          shootSfxCd = 0.08;
        }
      }
    }

    stepBullets(bulletPool, dt, MAX_WORLD_Z + 10);
    stepBullets(enemyBulletPool, dt, MAX_WORLD_Z + 10);

    world.enemies.forEach((enemy) => {
      enemy.age += dt;
      const laneCenter = laneCenters[enemy.lane] ?? enemy.x;
      if (enemy.behavior === "zigzag") {
        enemy.x = laneCenter +
          Math.sin(enemy.age * 4 + enemy.phase) * enemy.amp;
      } else if (enemy.behavior === "drift") {
        enemy.x += enemy.driftDir * dt * 0.34;
        if (
          enemy.x < laneCenters[0] - 0.25 ||
          enemy.x > laneCenters[laneCenters.length - 1] + 0.25
        ) {
          enemy.driftDir *= -1;
        }
      } else if (enemy.behavior === "dash") {
        enemy.dashCharge -= dt;
        if (!enemy.dashed && enemy.dashCharge <= 0 && enemy.z < 170) {
          enemy.speed *= 1.9;
          enemy.dashed = true;
        }
      } else if (enemy.behavior === "tank") {
        enemy.x += Math.sin(enemy.age * 1.8 + enemy.phase) * dt * 0.06;
      }

      enemy.z -= dt * enemy.speed;
      enemy.shootCd -= dt;
      if (
        enemy.shootCd <= 0 && enemy.z > 25 && enemy.z < 210 &&
        rng() < enemy.shootChance * dt * 3.5
      ) {
        enemy.shootCd = (0.5 + rng() * level.enemyShootRate) *
          diff.enemyShotMul;
        const dx = player.x - enemy.x;
        spawnBullet(enemyBulletPool, {
          x: enemy.x,
          z: enemy.z - 2,
          vz: -(95 + rng() * 36),
          vx: clamp(dx * 0.22, -0.5, 0.5),
          damage: 7 + levelIndex * 1.1,
          kind: "enemy",
          radius: 3,
          ttl: 3,
        });
      }
    });

    if (world.boss) {
      world.boss.z = Math.max(
        120,
        world.boss.z - dt * level.scrollSpeed * 0.35,
      );
      world.boss.shootCd -= dt;
      if (world.boss.shootCd <= 0) {
        const phaseMul = world.boss.hp <= world.boss.maxHp * 0.5 ? 0.68 : 1;
        world.boss.shootCd = level.boss.shootRate *
          getDifficulty().enemyShotMul * phaseMul;
        for (let i = -1; i <= 1; i += 1) {
          spawnBullet(enemyBulletPool, {
            x: world.boss.x + i * 0.2,
            z: world.boss.z,
            vz: -(85 + rng() * 22),
            vx: i * 0.28,
            damage: 10 + levelIndex * 2,
            kind: "enemy",
            radius: 4,
            ttl: 3,
          });
        }
      }
    }

    for (const enemy of world.enemies) {
      if (!enemy) continue;
      if (enemy.z <= PLAYER_Z + 2 && Math.abs(enemy.x - player.x) < 0.55) {
        player.swarm -= enemy.collisionCost;
        enemy.hp = 0;
        player.hitFlash = 0.2;
        shake = Math.max(shake, 0.26);
        spawnHitParticles(enemy.x, enemy.z, "#ff9f8a", 16);
        spawnFloat(`-${enemy.collisionCost}`, enemy.x, enemy.z, "#ff8b8b");
        audio.playNoise({ duration: 0.1, gain: 0.22 });
      }
    }

    world.enemies = world.enemies.filter((enemy) =>
      enemy.hp > 0 && enemy.z > 0
    );

    bulletPool.each((bullet) => {
      let impacted = false;

      if (
        world.activeGate && Math.abs(world.activeGate.z - bullet.z) < 7 &&
        Math.abs(world.activeGate.x - bullet.x) < 0.32
      ) {
        if (
          world.activeGate.shootable && world.activeGate.gateType === "swarm"
        ) {
          const beforeVal = world.activeGate.value;
          world.activeGate.value = clamp(
            world.activeGate.value + world.activeGate.sign,
            world.activeGate.min,
            world.activeGate.max,
          );
          world.activeGate.label = `${world.activeGate.value > 0 ? "+" : ""}${
            Math.round(world.activeGate.value)
          }`;
          if (beforeVal !== world.activeGate.value) {
            spawnHitParticles(
              world.activeGate.x,
              world.activeGate.z,
              "#e9f6ff",
              6,
            );
            spawnFloat(
              `${world.activeGate.sign > 0 ? "+" : ""}${world.activeGate.sign}`,
              world.activeGate.x,
              world.activeGate.z,
              world.activeGate.sign > 0 ? "#8cffb1" : "#ff8d8d",
            );
            audio.playTone({ freq: 610, duration: 0.03, gain: 0.12 });
          }
        }
        impacted = true;
      }

      for (const enemy of world.enemies) {
        if (!enemy.hp) continue;
        if (
          Math.abs(enemy.z - bullet.z) < 6 &&
          Math.abs(enemy.x - bullet.x) < 0.33
        ) {
          let dmg = bullet.damage;
          if (enemy.armor > 0) {
            const absorb = Math.min(enemy.armor, dmg * 0.72);
            enemy.armor -= absorb;
            dmg -= absorb * 0.55;
            if (enemy.armor <= 0) {
              spawnFloat("ARMOR BREAK", enemy.x, enemy.z, "#d9c1ff");
              audio.playNoise({ duration: 0.08, gain: 0.2 });
            }
          }
          enemy.hitFlash = 0.14;
          enemy.hp -= dmg;
          spawnHitParticles(enemy.x, enemy.z, "#bff7ff", 5);
          if (enemy.hp <= 0) {
            score += Math.round(enemy.score * getDifficulty().scoreMul);
            runCoins += Math.max(1, Math.round(getDifficulty().coinMul));
            spawnHitParticles(enemy.x, enemy.z, "#ffb78b", 14);
            spawnFloat(
              `+${Math.round(enemy.score * getDifficulty().scoreMul)}`,
              enemy.x,
              enemy.z,
              "#ffd887",
            );
            audio.playTone({
              freq: 320,
              duration: 0.08,
              type: "square",
              gain: 0.18,
            });
            if (rng() < 0.35) {
              world.coinsSpawnQueue.push({
                lane: enemy.lane,
                z: enemy.z,
                value: Math.max(1, Math.round(getDifficulty().coinMul * 2.3)),
              });
            }
          }
          if (bullet.pierce > 0) bullet.pierce -= 1;
          else impacted = true;
          break;
        }
      }

      if (
        !impacted && world.boss && Math.abs(world.boss.z - bullet.z) < 8 &&
        Math.abs(world.boss.x - bullet.x) < 0.8
      ) {
        world.boss.hp -= bullet.damage;
        spawnHitParticles(world.boss.x, world.boss.z, "#ff9bb8", 7);
        if (bullet.pierce > 0) bullet.pierce -= 1;
        else impacted = true;
        if (world.boss.hp <= 0) {
          score += Math.round(world.boss.score * getDifficulty().scoreMul);
          runCoins += Math.round(80 * getDifficulty().coinMul);
          world.boss = null;
          finishLevel(true);
          shake = Math.max(shake, 0.8);
          audio.playTone({
            freq: 120,
            duration: 0.3,
            type: "sawtooth",
            gain: 0.3,
          });
        }
      }

      if (impacted) bullet.active = false;
    });

    enemyBulletPool.each((bullet) => {
      if (
        Math.abs(bullet.z - PLAYER_Z) < 4 &&
        Math.abs(bullet.x - player.x) < 0.36
      ) {
        bullet.active = false;
        if (player.invuln <= 0) {
          if (tempUpgrades.shield > 0) {
            tempUpgrades.shield -= 1;
            world.activeGateHint = "Shield absorbed hit";
            world.activeGateHintTtl = 0.9;
            audio.playTone({
              freq: 490,
              duration: 0.07,
              type: "triangle",
              gain: 0.18,
            });
          } else {
            player.hp -= bullet.damage;
            player.hitFlash = 0.2;
            shake = Math.max(shake, 0.22);
            spawnHitParticles(player.x, PLAYER_Z, "#ff8f81", 12);
            audio.playTone({
              freq: 180,
              duration: 0.09,
              type: "square",
              gain: 0.2,
            });
            if (player.hp <= 0) loseLife();
          }
        }
      }
    });

    world.gates.forEach((gate) => {
      gate.z -= dt * level.scrollSpeed;
      if (gate.z <= PLAYER_Z + 1.5 && Math.abs(gate.x - player.x) < 0.54) {
        const before = player.swarm;
        applyGate(gate);
        const delta = player.swarm - before;
        if (delta !== 0) {
          spawnFloat(
            `${delta > 0 ? "+" : ""}${delta}`,
            gate.x,
            gate.z,
            delta > 0 ? "#8cffb1" : "#ff8d8d",
          );
          audio.playTone({
            freq: delta > 0 ? 640 : 210,
            duration: 0.07,
            gain: 0.2,
          });
        }
        gate.consumed = true;
      }
    });
    world.gates = world.gates.filter((g) => !g.consumed && g.z > 0);

    world.activeGate = getActiveGate();

    while (world.coinsSpawnQueue.length) {
      const coinReq = world.coinsSpawnQueue.shift();
      spawnCoin(coinPool, {
        x: laneCenters[coinReq.lane],
        z: coinReq.z,
        vz: -level.scrollSpeed * 0.92,
        value: coinReq.value,
        ttl: 9,
      });
    }

    coinPool.each((coin) => {
      coin.ttl -= dt;
      coin.z += coin.vz * dt;
      const distX = Math.abs(coin.x - player.x);
      const distZ = Math.abs(coin.z - PLAYER_Z);
      const magnet = getPermanent().magnetRadius / 100;
      if (distX < magnet && distZ < 34) {
        coin.x += (player.x - coin.x) * dt * 8;
        coin.z += (PLAYER_Z - coin.z) * dt * 8;
      }
      if (distX < 0.2 && distZ < 4) {
        runCoins += coin.value;
        score += coin.value * 2;
        spawnFloat(`+${coin.value}`, coin.x, coin.z, "#ffd87c");
        audio.playTone({ freq: 910, duration: 0.03, gain: 0.14 });
        coin.active = false;
      }
      if (coin.ttl <= 0 || coin.z <= 0) coin.active = false;
    });

    shootSfxCd = Math.max(0, shootSfxCd - dt);

    if (player.swarm <= 0) {
      player.swarm = 0;
      state = "gameover";
      submitRunScore();
      scoreOverlay.show("Top 5 Scores", "Last 7 days");
      scoreOverlay.refresh();
      setPanel({
        title: "Swarm Collapsed",
        html: `Score: <b>${
          Math.floor(score)
        }</b><br/>Coins: <b>${runCoins}</b><br/>Level reached: <b>${levelIndex}</b>`,
        buttons: [
          { label: "Play Again", primary: true, onClick: beginRun },
          {
            label: "Back to Intro",
            onClick: () => {
              state = "intro";
              closePanel();
            },
          },
        ],
      });
      audio.playTone({ freq: 110, duration: 0.3, type: "square", gain: 0.28 });
    }

    cameraX += (player.x * 0.42 - cameraX) * clamp(dt * 8.5, 0, 1);
    shake = Math.max(0, shake - dt * 2.3);
    world.enemies.forEach((enemy) => {
      enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - dt * 4.2);
    });
    world.particles.forEach((pcl) => {
      pcl.life -= dt;
      pcl.x += pcl.vx * dt;
      pcl.z += pcl.vz * dt;
      pcl.vz -= dt * 16;
    });
    world.particles = world.particles.filter((p) => p.life > 0);
    world.floatTexts.forEach((ft) => {
      ft.life -= dt;
      ft.z += ft.vy * dt;
    });
    world.floatTexts = world.floatTexts.filter((f) => f.life > 0);
  };

  const finishLevel = (bossKilled) => {
    if (state !== "playing") return;
    state = "levelComplete";
    const timeBonus = Math.max(
      0,
      Math.round((getLevel().duration - levelTime) * 12),
    );
    const bossBonus = bossKilled ? 800 : 0;
    score += timeBonus + bossBonus;
    const earned = runCoins;
    save.coins += runCoins;
    runCoins = 0;
    save.bestLevel = Math.max(save.bestLevel || 0, levelIndex);
    if (levelIndex >= 2 && !save.unlockedDifficulties.includes("hard")) {
      save.unlockedDifficulties.push("hard");
    }
    persistSave(save);
    setPanel({
      title: `Level ${levelIndex} Complete`,
      html:
        `Time bonus: <b>${timeBonus}</b><br/>Boss bonus: <b>${bossBonus}</b><br/>Coins banked: <b>${earned}</b><br/>Total coins: <b>${save.coins}</b>`,
      buttons: [{ label: "Open Shop", primary: true, onClick: openShop }],
    });
  };

  const openShop = () => {
    state = "shop";
    const rows = Object.entries(save.permanentUpgrades).map(([id, level]) => {
      const name = id === "baseDamage"
        ? "Base Damage"
        : id === "fireRate"
        ? "Fire Rate"
        : id === "critChance"
        ? "Crit Chance"
        : "Magnet Radius";
      const nextCost = getUpgradeCost(id, level);
      return `<div data-upgrade="${id}" style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08)">
        <span>${name} Lv.${level}</span><button class="menu-button" data-buy="${id}">Buy (${
        Number.isFinite(nextCost) ? nextCost : "MAX"
      })</button>
      </div>`;
    }).join("");
    setPanel({
      title: "Shop",
      html:
        `Coins: <b>${save.coins}</b><div style="margin-top:10px">${rows}</div>`,
      buttons: [{ label: "Next Level", primary: true, onClick: nextLevel }],
    });

    panel.querySelectorAll("[data-buy]").forEach((node) => {
      node.addEventListener("click", () => {
        const id = node.getAttribute("data-buy");
        if (!id) return;
        const result = buyUpgrade(save, id);
        if (result.ok) {
          persistSave(save);
          openShop();
        }
      }, { signal });
    });
  };

  function getUpgradeCost(id, level) {
    const base = id === "baseDamage"
      ? 45
      : id === "fireRate"
      ? 50
      : id === "critChance"
      ? 60
      : 35;
    const growth = id === "baseDamage"
      ? 1.35
      : id === "fireRate"
      ? 1.4
      : id === "critChance"
      ? 1.45
      : 1.3;
    if (
      level >=
        (id === "baseDamage"
          ? 20
          : id === "fireRate"
          ? 18
          : id === "critChance"
          ? 12
          : 15)
    ) return Infinity;
    return Math.floor(base * Math.pow(growth, level));
  }

  const nextLevel = () => {
    tempUpgrades = createTempUpgrades();
    levelIndex += 1;
    world.levelIndex = levelIndex;
    startLevel();
  };

  const openPreferences = () => {
    const options = save.unlockedDifficulties.map((key) =>
      `<option value="${key}" ${key === currentDifficulty ? "selected" : ""}>${
        DIFFICULTY[key].label
      }</option>`
    ).join("");
    setPanel({
      title: "Preferences",
      html:
        `<label>Difficulty<br/><select id="blitz-diff" class="menu-select">${options}</select></label><p style="opacity:.75;margin-top:10px">Difficulty impacts score multiplier, enemy pressure, and boss HP.</p>`,
      buttons: [
        {
          label: "Close",
          onClick: () => {
            closePanel();
            if (state === "intro") {
              scoreOverlay.show("Top 5 Scores", "Last 7 days");
            }
          },
        },
      ],
    });
    const select = panel.querySelector("#blitz-diff");
    if (select) {
      select.addEventListener("change", () => {
        const value = select.value;
        if (DIFFICULTY[value]) currentDifficulty = value;
      }, { signal });
    }
  };

  const getActiveGate = () => {
    const laneTolerance = 0.36;
    const candidates = world.gates
      .filter((gate) => gate.z > 20 && gate.z < 220)
      .filter((gate) => Math.abs(gate.x - player.x) <= laneTolerance)
      .sort((a, b) => a.z - b.z);
    return candidates[0] || null;
  };

  const spawnBossIfNeeded = () => {
    if (world.boss) return;
    const level = getLevel();
    const diff = getDifficulty();
    world.boss = {
      x: 0,
      z: 245,
      hp: level.boss.hp * diff.bossHpMul,
      maxHp: level.boss.hp * diff.bossHpMul,
      shootCd: 1.2,
      score: level.boss.score,
      collisionCost: level.boss.contactCost,
    };
    world.activeGateHint = "Boss incoming";
    world.activeGateHintTtl = 1.8;
    world.enemies = [];
    world.gates = [];
  };

  const step = (dt) => {
    if (state !== "playing") return;
    levelTime += dt;
    stepPlayer(dt);

    if (levelTime < getLevel().duration) {
      spawner.step(dt, getLevel(), getDifficulty(), world);
    } else {
      spawnBossIfNeeded();
    }

    updateCombat(dt);

    if (
      world.boss && world.boss.z <= PLAYER_Z + 4 &&
      Math.abs(world.boss.x - player.x) < 0.78
    ) {
      player.swarm -= world.boss.collisionCost;
      world.boss.z = 200;
      player.hitFlash = 0.25;
    }

    if (world.activeGateHintTtl) {
      world.activeGateHintTtl -= dt;
      if (world.activeGateHintTtl <= 0) {
        world.activeGateHintTtl = 0;
        world.activeGateHint = "";
      }
    }
  };

  const draw = () => {
    clear();
    const jitterX = shake > 0 ? (rng() - 0.5) * 2.2 * shake : 0;
    const jitterY = shake > 0 ? (rng() - 0.5) * 1.6 * shake : 0;
    ctx.save();
    ctx.translate(jitterX, jitterY);
    renderer.drawRunway(cameraX, performance.now());

    const drawables = [];
    world.gates.forEach((gate) =>
      drawables.push({ z: gate.z, type: "gate", ref: gate })
    );
    world.enemies.forEach((enemy) =>
      drawables.push({ z: enemy.z, type: "enemy", ref: enemy })
    );
    if (world.boss) {
      drawables.push({ z: world.boss.z, type: "boss", ref: world.boss });
    }
    bulletPool.each((bullet) =>
      drawables.push({ z: bullet.z, type: "pb", ref: bullet })
    );
    enemyBulletPool.each((bullet) =>
      drawables.push({ z: bullet.z, type: "eb", ref: bullet })
    );
    coinPool.each((coin) =>
      drawables.push({ z: coin.z, type: "coin", ref: coin })
    );

    drawables.sort((a, b) => b.z - a.z);
    for (const d of drawables) {
      if (d.type === "gate") {
        renderer.drawGate(d.ref, cameraX, world.activeGate);
      } else if (d.type === "enemy") renderer.drawEnemy(d.ref, cameraX);
      else if (d.type === "boss") renderer.drawBoss(d.ref, cameraX);
      else if (d.type === "coin") {
        renderer.drawCoin(d.ref, cameraX, performance.now());
      } else if (d.type === "pb") renderer.drawBullet(d.ref, cameraX, false);
      else if (d.type === "eb") renderer.drawBullet(d.ref, cameraX, true);
    }

    renderer.drawParticles(world.particles, cameraX);
    renderer.drawFloats(world.floatTexts, cameraX);
    renderer.drawPlayer(player, cameraX, PLAYER_Z, performance.now());
    renderer.drawHud({
      player,
      levelTime,
      levelDuration: getLevel().duration,
      score,
      runCoins,
      levelIndex,
      activeGateHint: world.activeGate?.shootable
        ? `Active gate ${world.activeGate.value > 0 ? "+" : ""}${
          Math.round(world.activeGate.value)
        } (shoot to change)`
        : world.activeGateHint,
      difficultyLabel: DIFFICULTY[currentDifficulty].label,
    });
    ctx.restore();

    if (state === "intro") {
      renderer.drawOverlay("Blitz!", "Press Space or Enter to Start");
      scoreOverlay.show("Top 5 Scores", "Last 7 days");
    }
    if (state === "paused") {
      renderer.drawOverlay("Paused", "Click Resume in menu");
    }
    if (state === "gameover") {
      renderer.drawOverlay("Run Over", "Use panel to restart");
    }
  };

  const startRunFromInput = () => {
    if (state === "intro") beginRun();
  };

  document.addEventListener("keydown", (event) => {
    if (osAPI?.getActiveAppId && osAPI.getActiveAppId() !== appId) return;
    const key = event.key.toLowerCase();
    if ([" ", "enter", "p", "r"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
    if ((key === " " || key === "enter") && state === "intro") {
      startRunFromInput();
    }
    if (key === "p") {
      if (state === "playing") state = "paused";
      else if (state === "paused") state = "playing";
    }
    if (key === "r") beginRun();
  }, { signal, capture: true });

  osAPI?.registerAppMenu?.(appId, {
    appName: "Blitz!",
    menus: [
      {
        title: "Blitz!",
        items: [
          { label: "New Run", onClick: beginRun },
          { label: "Preferences", onClick: openPreferences },
        ],
      },
      { title: "Edit", items: [{ label: "Undo", disabled: true }] },
      { title: "View", items: [{ label: "Zoom In", disabled: true }] },
      { title: "Window", items: [{ label: "Minimize All", disabled: true }] },
      {
        title: "Help",
        items: [{ label: "Controls: Drag/Arrows to move", disabled: true }],
      },
    ],
  });

  const stopLoop = startLoop({
    step,
    render: draw,
    isActive: () => content.isConnected,
  });

  const onProfileChange = () => scoreOverlay.refresh();
  window.addEventListener("daemonos-profile-change", onProfileChange, {
    signal,
  });

  const cleanup = () => {
    controller.abort();
    resizeObserver.disconnect();
    destroySurface?.();
    stopLoop();
    scoreOverlay.hide();
    audio.destroy();
  };

  const observer = new MutationObserver(() => {
    if (!content.isConnected) {
      observer.disconnect();
      cleanup();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  scoreOverlay.refresh();

  return {
    title: "Blitz!",
    width: 720,
    height: 980,
    aspectRatio: BASE_WIDTH / BASE_HEIGHT,
    content: wrapper,
    onSuspend: () => {
      if (state === "playing") state = "paused";
    },
    onResume: () => {
      if (state === "paused") state = "playing";
    },
    freeOptionalCaches: () => {
      world.particles = [];
    },
  };
}
