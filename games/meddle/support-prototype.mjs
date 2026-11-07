// Isolated settlement-field experiment. Nothing in game.js imports this file.
//
// SOURCE-BACKED FACTS represented here:
// - Amiga v2.7 check_life reads the first 17 entries of _offset_vector.
// - castles have a 3x3 physical footprint inside a 5x5 support area;
// - neutral flat land and same-faction farmland contribute to check_life;
// - set_town paints 17 cells normally and 25 for a castle, only replacing
//   neutral flat terrain; the encoding is faction-level, not settlement-level.
//
// EXPERIMENTAL POLICY (not established by the source): crop arbitration between
// factions, stronger-settlement priority, neutral ties, and contiguous-field
// counting. These exist only to expose design consequences in fixtures.

export const SOURCE_CHECK_LIFE_OFFSETS = Object.freeze([
  [0, 0], [0, -1], [1, 0], [0, 1], [-1, 0],
  [1, -1], [1, 1], [-1, 1], [-1, -1],
  [0, -2], [2, 0], [0, 2], [-2, 0],
  [2, -2], [2, 2], [-2, 2], [-2, -2],
]);

const key = (x, y) => `${x},${y}`;
const footprint = level => level === 4 ? 3 : 1;

export function fieldCells(settlement) {
  const cells = [];
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) cells.push({ x: settlement.x + dx, y: settlement.y + dy });
  return cells;
}

export function buildingCells(settlement) {
  const radius = (footprint(settlement.level) - 1) / 2, cells = [];
  for (let dy = -radius; dy <= radius; dy += 1) for (let dx = -radius; dx <= radius; dx += 1) cells.push({ x: settlement.x + dx, y: settlement.y + dy });
  return cells;
}

export function sourceStencilSiteClear(site, settlements) {
  const occupied = new Set(settlements.flatMap(buildingCells).map(cell => key(cell.x, cell.y)));
  return SOURCE_CHECK_LIFE_OFFSETS.every(([dx, dy]) => !occupied.has(key(site.x + dx, site.y + dy)));
}

// SOURCE-LIKE TRANSLATION: this preserves the observable faction-level,
// first-painted farmland behavior. It deliberately does not translate the
// original routine's weighted food value into Meddle stages.
export function sourceLikePaintFarmland(map, settlements) {
  const farmland = new Map();
  for (const settlement of settlements) {
    const offsets = settlement.level === 4 ? fieldCells(settlement).map(cell => [cell.x - settlement.x, cell.y - settlement.y]) : SOURCE_CHECK_LIFE_OFFSETS;
    for (const [dx, dy] of offsets) {
      const cell = { x: settlement.x + dx, y: settlement.y + dy }, cellKey = key(cell.x, cell.y);
      if (cell.x < 0 || cell.y < 0 || cell.x >= map.width || cell.y >= map.height || !map.flat.has(cellKey) || farmland.has(cellKey)) continue;
      farmland.set(cellKey, settlement.faction);
    }
  }
  return farmland;
}

export function sourceLikeStencilCount(map, settlement, farmland = sourceLikePaintFarmland(map, [settlement])) {
  return SOURCE_CHECK_LIFE_OFFSETS.filter(([dx, dy]) => {
    const x = settlement.x + dx, y = settlement.y + dy, cellKey = key(x, y), owner = farmland.get(cellKey);
    // check_life consults terrain/farmland state, not the overlay map used for
    // trees. Obstacles therefore do not reduce this source-like count.
    return x >= 0 && y >= 0 && x < map.width && y < map.height && map.flat.has(cellKey) && (!owner || owner === settlement.faction);
  }).length;
}

// Focused translation of the terrain portion of the 1993 check_life routine.
// It intentionally omits map_bk2 building-overlay rejection, which needs a
// separate sprite/overlay fixture. Rock means map block 47; tree overlays do
// not participate in this calculation.
export function sourceLikeLifeScore(map, settlement, farmland = sourceLikePaintFarmland(map, [settlement])) {
  let score = 0;
  for (let index = 0; index < SOURCE_CHECK_LIFE_OFFSETS.length; index += 1) {
    const [dx, dy] = SOURCE_CHECK_LIFE_OFFSETS[index], x = settlement.x + dx, y = settlement.y + dy, cellKey = key(x, y);
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
    if (map.rocks?.has(cellKey)) { score -= 15; continue; }
    const owner = farmland.get(cellKey), accepted = map.flat.has(cellKey) && (!owner || owner === settlement.faction);
    if (accepted) {
      if (score === 0) score = 50;
      score += 15;
    } else if (index === 0) return 0;
  }
  if (score < 35) return 0;
  return score === 305 ? 3050 : score;
}

function usable(cell, map) {
  return cell.x >= 0 && cell.y >= 0 && cell.x < map.width && cell.y < map.height
    && map.flat.has(key(cell.x, cell.y)) && !map.obstacles.has(key(cell.x, cell.y));
}

// EXPERIMENTAL: ownership exists in the source, but this arbitration does not.
// Exact hostile ties are neutral so IDs and insertion order cannot add bias.
export function experimentalCropOwnership(map, settlements) {
  const candidates = new Map();
  for (const settlement of settlements) for (const cell of fieldCells(settlement)) {
    if (!usable(cell, map)) continue;
    const candidate = { faction: settlement.faction, level: settlement.level, distance: Math.max(Math.abs(cell.x - settlement.x), Math.abs(cell.y - settlement.y)) };
    const list = candidates.get(key(cell.x, cell.y)) || [];
    list.push(candidate); candidates.set(key(cell.x, cell.y), list);
  }
  const owners = new Map();
  for (const [cellKey, list] of candidates) {
    list.sort((a, b) => b.level - a.level || a.distance - b.distance || a.faction.localeCompare(b.faction));
    const best = list[0], tied = list.filter(item => item.level === best.level && item.distance === best.distance);
    owners.set(cellKey, tied.some(item => item.faction !== best.faction) ? null : best.faction);
  }
  return owners;
}

function connectedCells(origin, eligible) {
  const originKey = key(origin.x, origin.y);
  if (!eligible.has(originKey)) return new Set();
  const seen = new Set([originKey]), queue = [{ x: origin.x, y: origin.y }];
  while (queue.length) {
    const cell = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nextKey = key(cell.x + dx, cell.y + dy);
      if (eligible.has(nextKey) && !seen.has(nextKey)) { seen.add(nextKey); queue.push({ x: cell.x + dx, y: cell.y + dy }); }
    }
  }
  return seen;
}

// EXPERIMENTAL: foundation and crop support are separate in the result.
export function experimentalSupport(map, settlement, settlements, crops = experimentalCropOwnership(map, settlements)) {
  const ownFoundation = new Set(buildingCells(settlement).map(cell => key(cell.x, cell.y)));
  const otherBuildings = new Set(settlements.filter(item => item !== settlement).flatMap(buildingCells).map(cell => key(cell.x, cell.y)));
  const eligible = new Set(fieldCells(settlement).filter(cell => {
    const cellKey = key(cell.x, cell.y), cropOwner = crops.get(cellKey);
    return usable(cell, map) && !otherBuildings.has(cellKey) && (ownFoundation.has(cellKey) || cropOwner === undefined || cropOwner === settlement.faction);
  }).map(cell => key(cell.x, cell.y)));
  const connected = connectedCells(settlement, eligible);
  const foundationCells = [...connected].filter(cellKey => ownFoundation.has(cellKey)).length;
  return { foundationCells, cropCells: connected.size - foundationCells, total: connected.size };
}

export function currentApproximationSupport(map, settlement) {
  return fieldCells(settlement).filter(cell => cell.x >= 0 && cell.y >= 0 && cell.x < map.width && cell.y < map.height && map.flat.has(key(cell.x, cell.y))).length;
}

export function fixtureMap(width = 15, height = 15) {
  const flat = new Set();
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) flat.add(key(x, y));
  return { width, height, flat, obstacles: new Set() };
}
