import { PERM_UPGRADE_DEFS, WEAPON_UPGRADES } from "../constants.js";

export function createTempUpgrades() {
  return {
    damageMul: 1,
    fireRateMul: 1,
    spread: 0.08,
    pierce: 0,
    shotsPerBurst: 1,
    shield: 0,
    labels: [],
  };
}

export function applyRandomWeaponUpgrade(temp, rng) {
  const idx = Math.floor(rng() * WEAPON_UPGRADES.length);
  const upgrade = WEAPON_UPGRADES[idx];
  upgrade.apply(temp);
  temp.labels.push(upgrade.label);
  if (temp.labels.length > 4) temp.labels.shift();
  return upgrade.label;
}

export function getPermanentStats(permanentUpgrades) {
  const baseDamageLevel = permanentUpgrades.baseDamage || 0;
  const fireRateLevel = permanentUpgrades.fireRate || 0;
  const critLevel = permanentUpgrades.critChance || 0;
  const magnetLevel = permanentUpgrades.magnetRadius || 0;
  return {
    baseDamage: 7 *
      (1 + baseDamageLevel * PERM_UPGRADE_DEFS.baseDamage.perLevel),
    fireRateBase: 0.26 *
      Math.max(0.35, 1 - fireRateLevel * PERM_UPGRADE_DEFS.fireRate.perLevel),
    critChance: Math.min(
      0.4,
      critLevel * PERM_UPGRADE_DEFS.critChance.perLevel,
    ),
    magnetRadius: 54 + magnetLevel * PERM_UPGRADE_DEFS.magnetRadius.perLevel,
  };
}

export function getUpgradeCost(id, level) {
  const def = PERM_UPGRADE_DEFS[id];
  if (!def) return Number.POSITIVE_INFINITY;
  return Math.floor(def.baseCost * Math.pow(def.growth, level));
}

export function buyUpgrade(save, id) {
  const def = PERM_UPGRADE_DEFS[id];
  if (!def) return { ok: false, reason: "unknown" };
  const level = save.permanentUpgrades[id] || 0;
  if (level >= def.maxLevel) return { ok: false, reason: "max" };
  const cost = getUpgradeCost(id, level);
  if (save.coins < cost) return { ok: false, reason: "coins", cost };
  save.coins -= cost;
  save.permanentUpgrades[id] = level + 1;
  return { ok: true, cost, level: save.permanentUpgrades[id] };
}
