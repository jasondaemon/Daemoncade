export const GAME_ID = "blitz";
export const BASE_WIDTH = 540;
export const BASE_HEIGHT = 960;
export const LANE_COUNT = 4;
export const MAX_WORLD_Z = 260;
export const PLAYER_Z = 8;
export const HORIZON_Y = 190;
export const PLAYER_Y = 850;

export const DIFFICULTY = {
  easy: {
    key: "easy",
    label: "Easy",
    enemyHpMul: 0.85,
    enemyRateMul: 0.8,
    enemyShotMul: 0.75,
    bossHpMul: 0.8,
    coinMul: 0.9,
    scoreMul: 1,
  },
  normal: {
    key: "normal",
    label: "Normal",
    enemyHpMul: 1,
    enemyRateMul: 1,
    enemyShotMul: 1,
    bossHpMul: 1,
    coinMul: 1,
    scoreMul: 1.2,
  },
  hard: {
    key: "hard",
    label: "Hard",
    enemyHpMul: 1.25,
    enemyRateMul: 1.2,
    enemyShotMul: 1.25,
    bossHpMul: 1.4,
    coinMul: 1.25,
    scoreMul: 1.6,
  },
};

export const PERM_UPGRADE_DEFS = {
  baseDamage: {
    label: "Base Damage",
    baseCost: 45,
    growth: 1.35,
    perLevel: 0.18,
    maxLevel: 20,
  },
  fireRate: {
    label: "Fire Rate",
    baseCost: 50,
    growth: 1.4,
    perLevel: 0.08,
    maxLevel: 18,
  },
  critChance: {
    label: "Crit Chance",
    baseCost: 60,
    growth: 1.45,
    perLevel: 0.03,
    maxLevel: 12,
  },
  magnetRadius: {
    label: "Magnet Radius",
    baseCost: 35,
    growth: 1.3,
    perLevel: 12,
    maxLevel: 15,
  },
};

export const WEAPON_UPGRADES = [
  {
    id: "spread",
    label: "Spread",
    apply: (temp) => {
      temp.spread = Math.min(temp.spread + 0.06, 0.35);
    },
  },
  {
    id: "multi",
    label: "Multi Shot",
    apply: (temp) => {
      temp.shotsPerBurst = Math.min(temp.shotsPerBurst + 1, 5);
    },
  },
  {
    id: "pierce",
    label: "Pierce",
    apply: (temp) => {
      temp.pierce = Math.min(temp.pierce + 1, 3);
    },
  },
  {
    id: "rapid",
    label: "Rapid Fire",
    apply: (temp) => {
      temp.fireRateMul = Math.min(temp.fireRateMul + 0.14, 2.1);
    },
  },
  {
    id: "damage",
    label: "Damage+",
    apply: (temp) => {
      temp.damageMul = Math.min(temp.damageMul + 0.2, 3.5);
    },
  },
  {
    id: "shield",
    label: "Shield",
    apply: (temp) => {
      temp.shield = Math.min(temp.shield + 1, 3);
    },
  },
];

export const TEMP_STAT_GATES = [
  {
    id: "fr",
    label: "Temp Fire+",
    apply: (temp) => {
      temp.fireRateMul = Math.min(temp.fireRateMul + 0.22, 2.6);
    },
  },
  {
    id: "dmg",
    label: "Temp Dmg+",
    apply: (temp) => {
      temp.damageMul = Math.min(temp.damageMul + 0.24, 3.5);
    },
  },
];

export const COLORS = {
  bgTop: "#06111f",
  bgBottom: "#0e2133",
  runway: "#203649",
  laneLine: "#6eb9ff",
  leader: "#ffe58c",
  swarm: "#8cf2ff",
  enemy: "#ff9f6d",
  enemyArmor: "#9c6dff",
  boss: "#ff5f9a",
  bullet: "#bff7ff",
  enemyBullet: "#ff786a",
  coin: "#ffd64f",
  hp: "#6bff91",
  hpBack: "#19353f",
};
