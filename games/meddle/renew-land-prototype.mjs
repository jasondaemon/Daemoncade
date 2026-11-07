// Standalone Populous II-inspired recovery experiment.
// Production game code does not import this module.

export const RENEW_LAND_COST = 120;
export const RENEW_LAND_MAX_ROCKS = 4;
export const RENEW_LAND_AI_MIN_DAMAGE = 3;
const SCAR_ORIGINS = new Set(["quake", "volcano", "rift", "batholith"]);
const key = (x, y) => `${x},${y}`;
const clone = value => JSON.parse(JSON.stringify(value));

export function renewLandCells(target, size) {
  if (!target || !Number.isInteger(target.x) || !Number.isInteger(target.y) || !Number.isInteger(size) || size < 1 || target.x < 0 || target.y < 0 || target.x >= size || target.y >= size) return [];
  const cells = [];
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
    const x = target.x + dx, y = target.y + dy;
    if (Math.abs(dx) + Math.abs(dy) <= 2 && x >= 0 && y >= 0 && x < size && y < size) cells.push({ x, y });
  }
  return cells;
}

function normalizeScar(value) {
  if (typeof value === "string" && /^\d+,\d+$/.test(value)) return { cell: value, origin: "legacy-unknown" };
  if (!value || typeof value !== "object" || typeof value.cell !== "string" || !/^\d+,\d+$/.test(value.cell)) return null;
  return { cell: value.cell, origin: SCAR_ORIGINS.has(value.origin) ? value.origin : "legacy-unknown", version: Number.isInteger(value.version) ? value.version : 1 };
}

export function normalizeRenewSave(snapshot) {
  const copy = clone(snapshot || {}), seen = new Set();
  copy.terrainScars = (Array.isArray(copy.terrainScars) ? copy.terrainScars : []).map(normalizeScar).filter(scar => scar && !seen.has(`${scar.cell}:${scar.origin}`) && seen.add(`${scar.cell}:${scar.origin}`));
  return copy;
}

export function planRenewLand(state, target, options = {}) {
  const faction = options.faction, cost = options.cost ?? RENEW_LAND_COST, maxRocks = options.maxRocks ?? RENEW_LAND_MAX_ROCKS;
  const cells = renewLandCells(target, state.size), cellKeys = new Set(cells.map(cell => key(cell.x, cell.y)));
  const scarEntries = (state.terrainScars || []).map((value, index) => ({ scar: normalizeScar(value), index })).filter(entry => entry.scar && cellKeys.has(entry.scar.cell));
  const confirmedScarEntries = scarEntries.filter(entry => SCAR_ORIGINS.has(entry.scar.origin));
  const legacyScarEntries = scarEntries.filter(entry => entry.scar.origin === "legacy-unknown");
  const removableScarEntries = options.allowLegacyScars ? scarEntries : confirmedScarEntries;
  const catastropheRocks = (state.landmarks || []).map((item, index) => ({ item, index })).filter(entry => entry.item.type === "rock" && entry.item.scar === true && cellKeys.has(key(Math.floor(entry.item.x), Math.floor(entry.item.y))));
  const removableRockEntries = catastropheRocks.sort((a, b) => Math.hypot(a.item.x - target.x, a.item.y - target.y) - Math.hypot(b.item.x - target.x, b.item.y - target.y) || a.index - b.index).slice(0, maxRocks);
  const affected = removableScarEntries.length + removableRockEntries.length;
  const availableMana = state.manaByFaction?.[faction] ?? (faction === "player" ? state.mana : undefined);
  let reason = "Ready";
  if (!['player', 'rival'].includes(faction)) reason = "Choose a valid faction";
  else if (state.paused) reason = "Resume the world first";
  else if (!cells.length) reason = "Choose an in-bounds whole-tile target";
  else if (options.withinInfluence !== true) reason = "Outside this faction's influence";
  else if (!Number.isFinite(availableMana) || availableMana < cost) reason = `Need ${Math.ceil(cost - (availableMana || 0))} more influence`;
  else if (!affected) reason = legacyScarEntries.length ? "Only unverified legacy scars are present" : "No confirmed catastrophe damage in this area";
  return { available: reason === "Ready", reason, faction, cost, availableMana, cells, confirmedScarEntries, legacyScarEntries, removableScarEntries, removableRockEntries, affected };
}

export function applyRenewLand(state, target, options = {}) {
  const plan = planRenewLand(state, target, options);
  if (!plan.available) return { state: clone(state), plan, changed: false };
  const next = clone(state), scarIndices = new Set(plan.removableScarEntries.map(entry => entry.index)), rockIndices = new Set(plan.removableRockEntries.map(entry => entry.index));
  if (next.manaByFaction) next.manaByFaction[plan.faction] -= plan.cost;
  else next.mana -= plan.cost;
  next.terrainScars = (next.terrainScars || []).filter((_, index) => !scarIndices.has(index));
  next.landmarks = (next.landmarks || []).filter((_, index) => !rockIndices.has(index));
  return { state: next, plan, changed: true };
}

// AI policy experiment only. The threshold is intentionally stricter than a
// human cast: Veyra waits for at least three confirmed damage items.
export function chooseRenewLandTarget(state, candidates, context = {}, options = {}) {
  const faction = options.faction, minimumDamage = options.minimumDamage ?? RENEW_LAND_AI_MIN_DAMAGE;
  return candidates.map(target => {
    const plan = planRenewLand(state, target, { ...options, faction, withinInfluence: context.withinInfluence?.(faction, target) === true });
    const degraded = (context.degradedSettlements || []).filter(home => home.faction === faction && Math.hypot(home.x - target.x, home.y - target.y) <= 2).length;
    const routes = (context.blockedRoutes || []).filter(route => route.faction === faction && Math.hypot(route.x - target.x, route.y - target.y) <= 2).length;
    return { target, plan, score: plan.available && plan.affected >= minimumDamage ? plan.removableScarEntries.length + plan.removableRockEntries.length * 2 + degraded * 3 + routes * 2 : -Infinity };
  }).filter(item => Number.isFinite(item.score)).sort((a, b) => b.score - a.score || a.target.y - b.target.y || a.target.x - b.target.x)[0] || null;
}
