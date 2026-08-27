import { ENEMY_ARCHETYPES } from "../data/levels.js";
import { LANE_COUNT, TEMP_STAT_GATES } from "../constants.js";

export function createSpawner(rng, laneCenters) {
  let enemyTimer = 0;
  let gateTimer = 0;
  let coinTimer = 0;

  const laneAt = () => Math.floor(rng() * LANE_COUNT);

  const spawnEnemy = (level, difficulty, world) => {
    const lane = laneAt();
    const archetype =
      ENEMY_ARCHETYPES[Math.floor(rng() * ENEMY_ARCHETYPES.length)];
    world.enemies.push({
      id: `${performance.now()}_${Math.random()}`,
      type: archetype.id,
      lane,
      x: laneCenters[lane],
      z: 230 + rng() * 40,
      speed: level.scrollSpeed * archetype.speedMul,
      hp: archetype.hp * difficulty.enemyHpMul *
        (1 + (world.levelIndex - 1) * 0.14),
      maxHp: archetype.hp * difficulty.enemyHpMul *
        (1 + (world.levelIndex - 1) * 0.14),
      armor: archetype.armor * difficulty.enemyHpMul,
      shootCd: 0.4 + rng() * 1.6,
      shootChance: archetype.shootChance * difficulty.enemyShotMul,
      collisionCost: archetype.collisionCost,
      score: archetype.score,
      behavior: archetype.behavior || "basic",
      tint: archetype.tint,
      age: 0,
      phase: rng() * Math.PI * 2,
      amp: 0.08 + rng() * 0.15,
      driftDir: rng() < 0.5 ? -1 : 1,
      dashCharge: 0.7 + rng() * 1.1,
      dashed: false,
    });
  };

  const spawnEnemyCluster = (level, difficulty, world) => {
    const count = world.levelIndex >= 2
      ? 1 + (rng() > 0.45 ? 1 : 0) + (rng() > 0.82 ? 1 : 0)
      : 1 + (rng() > 0.68 ? 1 : 0);
    for (let i = 0; i < count; i += 1) spawnEnemy(level, difficulty, world);
  };

  const spawnCoinLine = (level, difficulty, world) => {
    const lane = laneAt();
    const total = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < total; i += 1) {
      world.coinsSpawnQueue.push({
        lane,
        z: 185 + i * 14,
        value: Math.max(
          1,
          Math.round(difficulty.coinMul * (1 + world.levelIndex * 0.12)),
        ),
      });
    }
  };

  const randomGate = (levelIndex) => {
    const pick = rng();
    if (pick < 0.56) {
      const sign = rng() < 0.58 ? 1 : -1;
      const base = sign > 0 ? 10 + levelIndex * 2 : -(8 + levelIndex * 2);
      return {
        gateType: "swarm",
        sign,
        shootable: rng() < 0.72,
        value: base,
        min: sign > 0 ? 4 : -50,
        max: sign > 0 ? 200 : -4,
        label: `${base > 0 ? "+" : ""}${base}`,
      };
    }
    if (pick < 0.8) {
      return {
        gateType: "weapon",
        shootable: false,
        value: 0,
        label: "Weapon",
      };
    }
    const stat = TEMP_STAT_GATES[Math.floor(rng() * TEMP_STAT_GATES.length)];
    return {
      gateType: "tempstat",
      shootable: false,
      stat,
      value: 0,
      label: stat.label,
    };
  };

  const spawnGateGroup = (level, world) => {
    const baseZ = 200 + rng() * 35;
    const lanes = [laneAt()];
    if (rng() > 0.45) lanes.push(laneAt());
    const uniqueLanes = [...new Set(lanes)].slice(0, 2);
    uniqueLanes.forEach((lane, idx) => {
      const gateDef = randomGate(world.levelIndex);
      world.gates.push({
        id: `${performance.now()}_${lane}_${Math.random()}`,
        lane,
        x: laneCenters[lane],
        z: baseZ + idx * 8,
        width: 40,
        gateType: gateDef.gateType,
        sign: gateDef.sign || 0,
        shootable: gateDef.shootable,
        value: gateDef.value,
        min: gateDef.min,
        max: gateDef.max,
        label: gateDef.label,
        stat: gateDef.stat || null,
      });
      if (rng() > 0.65) {
        world.gates.push({
          id: `${performance.now()}_${lane}_${Math.random()}_stack`,
          lane,
          x: laneCenters[lane],
          z: baseZ + 22 + rng() * 15,
          width: 40,
          gateType: gateDef.gateType,
          sign: gateDef.sign || 0,
          shootable: gateDef.shootable,
          value: gateDef.value,
          min: gateDef.min,
          max: gateDef.max,
          label: gateDef.label,
          stat: gateDef.stat || null,
        });
      }
    });
  };

  return {
    reset() {
      enemyTimer = 0;
      gateTimer = 0;
      coinTimer = 0;
    },
    step(dt, level, difficulty, world) {
      enemyTimer -= dt;
      gateTimer -= dt;
      coinTimer -= dt;

      const enemyCooldown = Math.max(
        0.14,
        1 / (level.enemySpawnRate * difficulty.enemyRateMul),
      );
      if (enemyTimer <= 0) {
        enemyTimer = enemyCooldown * (0.62 + rng() * 0.5);
        spawnEnemyCluster(level, difficulty, world);
      }

      if (gateTimer <= 0) {
        gateTimer = Math.max(0.8, 1 / level.gateSpawnRate) *
          (0.9 + rng() * 0.5);
        spawnGateGroup(level, world);
      }

      if (coinTimer <= 0) {
        coinTimer = Math.max(0.45, 1 / level.coinSpawnRate) *
          (0.8 + rng() * 0.6);
        spawnCoinLine(level, difficulty, world);
      }
    },
  };
}
