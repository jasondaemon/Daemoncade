import { PERM_UPGRADE_DEFS } from "../constants.js";

const SAVE_KEY = "daemonos_blitz_save_v1";

const DEFAULT_SAVE = {
  coins: 0,
  unlockedDifficulties: ["easy", "normal"],
  permanentUpgrades: {
    baseDamage: 0,
    fireRate: 0,
    critChance: 0,
    magnetRadius: 0,
  },
  bestLevel: 0,
};

export function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SAVE };
    const save = { ...DEFAULT_SAVE, ...parsed };
    save.permanentUpgrades = {
      ...DEFAULT_SAVE.permanentUpgrades,
      ...(parsed.permanentUpgrades || {}),
    };
    for (const [id, def] of Object.entries(PERM_UPGRADE_DEFS)) {
      save.permanentUpgrades[id] = clampInt(
        save.permanentUpgrades[id],
        0,
        def.maxLevel,
      );
    }
    save.coins = Math.max(0, Math.floor(save.coins || 0));
    if (
      !Array.isArray(save.unlockedDifficulties) ||
      !save.unlockedDifficulties.length
    ) {
      save.unlockedDifficulties = [...DEFAULT_SAVE.unlockedDifficulties];
    }
    return save;
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function persistSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function clampInt(value, min, max) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(min, Math.min(max, n));
}
