export function populationOf(people, houses, faction) {
  return people.filter((person) => person.faction === faction).length
    + houses.filter((house) => house.faction === faction).reduce((sum, house) => sum + house.pop, 0);
}

export function terminalOutcome(playerPopulation, rivalPopulation, elapsed) {
  if (elapsed <= 10) return null;
  if (playerPopulation <= 0) return false;
  if (rivalPopulation <= 0) return true;
  return null;
}

export function restoreEventHistory(entries, size = 34) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(event => event && Number.isFinite(event.at) && typeof event.text === "string")
    .slice(-12)
    .map(event => {
      const restored = { at: Math.max(0, event.at), text: event.text.slice(0, 240) };
      if (Number.isFinite(event.x) && Number.isFinite(event.y)
        && event.x >= 0 && event.y >= 0 && event.x <= size && event.y <= size) {
        restored.x = event.x;
        restored.y = event.y;
      }
      return restored;
    });
}

export function casualtyVisualState(age, life, reducedMotion = false) {
  const progress = Math.max(0, Math.min(1, life > 0 ? age / life : 1));
  return {
    alpha: 1 - progress,
    ringScale: reducedMotion ? 1 : 0.65 + progress * 0.85,
    labelLift: reducedMotion ? 0 : progress * 16
  };
}

export function chooseLocalFightTarget(candidates, radius = 6, maxPathSteps = 8) {
  return candidates
    .filter(candidate => Number.isFinite(candidate.distance)
      && candidate.distance <= radius
      && (candidate.distance < 1.2 || candidate.reachable && candidate.pathLength <= maxPathSteps))
    .sort((a, b) => a.distance - b.distance || a.pathLength - b.pathLength)[0] || null;
}

export function advanceDwelling(house) {
  if (house.pop < house.cap) {
    house.pop += 1;
    return false;
  }
  house.pop -= 1;
  return true;
}

export function captureDwelling(house, faction) {
  house.faction = faction;
  house.pop = 1;
  house.hp = 20 + house.level * 10;
}

export function releaseForReckoning(houses) {
  const released = [];
  for (const house of houses) {
    for (let index = 0; index < house.pop; index += 1) {
      released.push({ faction: house.faction, x: house.x, y: house.y });
    }
    house.pop = 0;
  }
  return released;
}

export function nextWorldIndex(current, worldCount) {
  return current >= worldCount - 1 ? 0 : current + 1;
}

export const WORLD_RULES = Object.freeze([
  Object.freeze({ name: "The Green Law", summary: "Gentle relief, thick woodland, and ordinary water danger.", waterDamage: 1, quakeRocks: 4 }),
  Object.freeze({ name: "The Drowning Law", summary: "Flooded walkers weaken 50% faster; dry routes and high ground matter.", waterDamage: 1.5, quakeRocks: 4 }),
  Object.freeze({ name: "The Broken Law", summary: "Quakes attempt twice as many stone placements; rebuilding demands deliberate land work.", waterDamage: 1, quakeRocks: 8 }),
  Object.freeze({ name: "The Tidal Law", summary: "Twin ridges divide the realm. At 60 and 120 seconds, the tide rises 0.2 levels for both peoples; the central vale floods first.", waterDamage: 1, quakeRocks: 4, tideTimes: Object.freeze([60,120]), tideRise: .2 })
]);

export function worldRule(index) {
  return WORLD_RULES[index] || WORLD_RULES[0];
}

export function alertAction(activePriority, incomingPriority, locked) {
  return locked && incomingPriority<=activePriority?"queue":"replace";
}

export function windscarHeight(base, x, y, player, rival) {
  const dx=rival.x-player.x,dy=rival.y-player.y,length=Math.max(1,Math.hypot(dx,dy));
  const midX=(player.x+rival.x)/2,midY=(player.y+rival.y)/2;
  const cross=Math.abs((x-midX)*(-dy/length)+(y-midY)*(dx/length));
  const shaped=base+(cross>=4&&cross<=7?2:cross<2?-1:0);
  return Math.max(1,Math.min(6,Math.round(shaped)));
}

export function viableRouteCells(a, b, size) {
  const cells=new Set(),steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*2);
  for(let index=0;index<=steps;index+=1){const t=index/steps,x=Math.max(0,Math.min(size-1,Math.round(a.x+(b.x-a.x)*t))),y=Math.max(0,Math.min(size-1,Math.round(a.y+(b.y-a.y)*t)));for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])cells.add(`${Math.min(size-1,x+dx)},${Math.min(size-1,y+dy)}`);}
  return cells;
}

export function placeWorldLandmarks({counts,random,size,isDry,starts,reserved=new Set()}) {
  const landmarks=[],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rand=(a,b)=>a+random()*(b-a);
  for(const [type,count] of [["tree",counts[0]],["rock",counts[1]]])for(let placed=0,tries=0;placed<count&&tries<600;tries+=1){const x=Math.floor(rand(1,size-1))+.5,y=Math.floor(rand(1,size-1))+.5,tileKey=`${Math.floor(x)},${Math.floor(y)}`;if(reserved.has(tileKey)||!isDry(Math.floor(x),Math.floor(y))||distance({x,y},starts.player)<4||distance({x,y},starts.rival)<4||landmarks.some(item=>distance(item,{x,y})<.8))continue;landmarks.push({type,x,y,variant:Math.floor(rand(0,4)),scar:false});placed+=1;}
  return landmarks;
}

export function findTerrainPath({heights,landmarks=[],bogs=new Set(),water,size,start,goal,maxSlope=1.6}) {
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value)),key=(x,y)=>`${x},${y}`,height=(x,y)=>{x=clamp(x,0,size-1);y=clamp(y,0,size-1);return(heights[y][x]+heights[y][x+1]+heights[y+1][x+1]+heights[y+1][x])/4;},blocked=(x,y)=>landmarks.some(item=>Math.floor(item.x)===x&&Math.floor(item.y)===y&&landmarkBlocksPath(item)),first={x:clamp(Math.floor(start.x),0,size-1),y:clamp(Math.floor(start.y),0,size-1)},last={x:clamp(Math.floor(goal.x),0,size-1),y:clamp(Math.floor(goal.y),0,size-1)},open=[{...first,g:0,f:0}],came=new Map(),cost=new Map([[key(first.x,first.y),0]]);let found=null;
  while(open.length){open.sort((a,b)=>a.f-b.f);const current=open.shift();if(current.x===last.x&&current.y===last.y){found=current;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=current.x+dx,y=current.y+dy;if(x<0||y<0||x>=size||y>=size||height(x,y)<=water)continue;const slope=Math.abs(height(x,y)-height(current.x,current.y));if(slope>maxSlope)continue;const nextKey=key(x,y),obstacle=landmarks.find(item=>Math.floor(item.x)===x&&Math.floor(item.y)===y);if(obstacle&&landmarkBlocksPath(obstacle)&&!(x===first.x&&y===first.y))continue;if(dx&&dy&&!diagonalStepClear(blocked(current.x+dx,current.y),blocked(current.x,current.y+dy)))continue;const nextCost=current.g+(dx&&dy?1.42:1)+slope*.45+(bogs.has(nextKey)?5:0);if(nextCost>=(cost.get(nextKey)??Infinity))continue;cost.set(nextKey,nextCost);came.set(nextKey,key(current.x,current.y));open.push({x,y,g:nextCost,f:nextCost+Math.hypot(last.x-x,last.y-y)});}}
  if(!found)return[];const cells=[];let cursor=key(found.x,found.y);while(cursor!==key(first.x,first.y)){const [x,y]=cursor.split(",").map(Number);cells.push({x:x+.5,y:y+.5});cursor=came.get(cursor);if(!cursor)return[];}return cells.reverse();
}

export const MATCH_VARIANTS = Object.freeze({
  classic: Object.freeze({ name: "Classic contest", summary: "Every power is available; ordinary conquest or Reckoning can end the world.", reckoning: true }),
  mortal: Object.freeze({ name: "Mortal contest", summary: "Reckoning is sealed. Win through followers, champions, terrain, and ordinary conquest.", reckoning: false })
});

export function matchVariantRule(id) {
  return MATCH_VARIANTS[id] || MATCH_VARIANTS.classic;
}

// Physical footprint and farmland support are deliberately separate: ordinary
// stages occupy one plot, the castle reserves 3x3 plots, and the original
// growth dynamic still requires a contiguous 5x5 field.
export const SETTLEMENT_STAGES = Object.freeze([
  Object.freeze({ level: 0, name: "Ruins", minSupport: 0, cap: 0 }),
  Object.freeze({ level: 1, name: "Hut", minSupport: 1, cap: 5 }),
  // The manual specifies 1-2 fields for small huts and a complete 5x5 for a
  // castle, but not the intermediate frame cutoffs. 5 and 12 are Meddle's
  // explicitly approximate visual/gameplay thresholds.
  Object.freeze({ level: 2, name: "Hamlet", minSupport: 5, cap: 8 }),
  Object.freeze({ level: 3, name: "Town", minSupport: 12, cap: 11 }),
  Object.freeze({ level: 4, name: "Castle", minSupport: 25, cap: 14 }),
]);

export function settlementStageForSupport(support) {
  let stage = SETTLEMENT_STAGES[0];
  for (const candidate of SETTLEMENT_STAGES) {
    if (support >= candidate.minSupport) stage = candidate;
  }
  return stage;
}

export function settlementFootprint(level) {
  return level === 4 ? 3 : 1;
}

export function settlementPlotsOverlap(a, b, aLevel = a.level, bLevel = b.level) {
  const reach = (settlementFootprint(aLevel) + settlementFootprint(bLevel)) / 2;
  return Math.abs(a.x - b.x) < reach && Math.abs(a.y - b.y) < reach;
}

export function landmarkBlocksSettlementSite(site, landmark) {
  const half = settlementFootprint(site.level) / 2;
  return Math.abs(site.x - landmark.x) < half && Math.abs(site.y - landmark.y) < half;
}

// The v2.7 Amiga check_life routine samples a building-exclusion stencil spanning
// five plots. Exact 1989-platform constants are uncertain; a three-plot Chebyshev
// separation is Meddle's conservative equivalent, while crop support may overlap.
export function settlementSiteClear(site, houses, minimumDistance = 3) {
  return houses.every((house) =>
    !settlementPlotsOverlap(site, house) &&
    Math.max(Math.abs(site.x - house.x), Math.abs(site.y - house.y)) >= minimumDistance
  );
}

export function applySettlementSupport(house, support) {
  const previousLevel = house.level;
  const stage = settlementStageForSupport(support);
  house.support = support;
  house.level = stage.level;
  house.cap = stage.cap;
  const expelled = Math.max(0, house.pop - house.cap);
  house.pop -= expelled;
  return {
    previousLevel,
    level: house.level,
    expelled,
    destroyed: house.level === 0,
  };
}

export function settlementReadout(house, support, castleBlocked = false) {
  const stage = SETTLEMENT_STAGES[house.level] || SETTLEMENT_STAGES[0];
  const next = SETTLEMENT_STAGES[house.level + 1] || null;
  const income = Math.round(house.level * .11 * 100) / 100;
  const growthSeconds = dwellingGrowthInterval(house.level);
  let outlook;
  if (!next) outlook = "Maximum stage; preserve its complete 5×5 connected field.";
  else if (castleBlocked && next.level === 4) outlook = "Castle blocked: another settlement overlaps the required 3×3 building footprint.";
  else { const missing = Math.max(0, next.minSupport - support); outlook = `Needs ${missing} more connected dry level ${missing === 1 ? "plot" : "plots"} for ${next.name}.`; }
  const footprint = house.level === 4 ? " · structure 3×3" : "";
  return `${stage.name}${footprint} · residents ${house.pop}/${stage.cap} · support ${support}/25 · +${income} influence/sec · growth ${growthSeconds}s. ${outlook}`;
}

export function resolveCombatTick(attacker, defender, attackerDamage, defenderDamage) {
  defender.hp -= attackerDamage;
  attacker.hp -= defenderDamage;
  return { attackerDead: attacker.hp <= 0, defenderDead: defender.hp <= 0 };
}

export function terrainHazardDamage(order, flooded, bogged, dt) {
  if (order === "reckoning") return 0;
  if (bogged) return dt * 5;
  if (flooded) return dt * 8;
  return 0;
}

export function landmarkPathPenalty(landmark) {
  return 0;
}

export function landmarkBlocksPath(landmark) {
  return Boolean(landmark && (landmark.type === "tree" || landmark.type === "rock"));
}

export function landmarkPlacementClear(point, people = [], houses = [], personClearance = .72) {
  if (people.some(person => Math.hypot(person.x - point.x, person.y - point.y) < personClearance)) return false;
  return houses.every(house => {
    const half = house.level === 4 ? 1.65 : .65;
    return Math.abs(point.x - house.x) >= half || Math.abs(point.y - house.y) >= half;
  });
}

export function diagonalStepClear(firstOrthogonalBlocked, secondOrthogonalBlocked) {
  return !firstOrthogonalBlocked && !secondOrthogonalBlocked;
}

export function nearestSafeTile(origin, tiles, isSafe) {
  return tiles.filter(isSafe).sort((a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y))[0] || null;
}

export function operationAvailability({ paused = false, mana = 0, cost = 0, requiresTarget = false, hasTarget = true, withinInfluence = true } = {}) {
  if (paused) return { available: false, reason: "Resume the world first" };
  if (requiresTarget && !hasTarget) return { available: false, reason: "Choose a target on the world" };
  if (!withinInfluence) return { available: false, reason: "Outside your people's influence" };
  if (mana < cost) return { available: false, reason: `Need ${Math.ceil(cost - mana)} more influence` };
  return { available: true, reason: "Ready" };
}

export function powerAffectedCells(name, target, size) {
  if (!target || !Number.isInteger(size) || size < 1) return [];
  const cells = [];
  if (name === "quake") {
    for (let y = target.y - 3; y <= target.y + 3; y += 1) for (let x = target.x - 3; x <= target.x + 3; x += 1) {
      if (x >= 0 && y >= 0 && x <= size && y <= size) cells.push({ x, y });
    }
  } else if (name === "bog") {
    for (let y = target.y - 2; y <= target.y + 2; y += 1) for (let x = target.x - 2; x <= target.x + 2; x += 1) {
      if (x >= 0 && y >= 0 && x < size && y < size && Math.hypot(x - target.x, y - target.y) < 2.4) cells.push({ x, y });
    }
  } else if (name === "volcano") {
    for (let y = target.y - 3; y <= target.y + 3; y += 1) for (let x = target.x - 3; x <= target.x + 3; x += 1) {
      if (x >= 0 && y >= 0 && x <= size && y <= size && Math.hypot(x - target.x, y - target.y) < 3.5) cells.push({ x, y });
    }
  }
  return cells;
}

export function terrainShapePlan(heights, corner, delta) {
  if (!corner || !Array.isArray(heights) || !heights.length || ![-1, 1].includes(delta)) return [];
  const draft = heights.map((row) => [...row]);
  if (!draft[corner.y] || !Number.isFinite(draft[corner.y][corner.x])) return [];
  draft[corner.y][corner.x] = Math.max(0, Math.min(7, draft[corner.y][corner.x] + delta));
  for (let pass = 0; pass < 2; pass += 1) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = corner.x + dx, y = corner.y + dy;
    if (!draft[y] || !Number.isFinite(draft[y][x])) continue;
    const difference = draft[corner.y][corner.x] - draft[y][x];
    if (Math.abs(difference) > 2) draft[y][x] += Math.sign(difference);
  }
  const changes = [];
  for (let y = 0; y < draft.length; y += 1) for (let x = 0; x < draft[y].length; x += 1) {
    if (draft[y][x] !== heights[y][x]) changes.push({ x, y, from: heights[y][x], to: draft[y][x] });
  }
  return changes;
}

export function applyLandmarkShaping(landmark, delta, atSeaLevel) {
  const dark = landmark.type === "tree" || landmark.variant % 2 === 0;
  if (dark) return { cleared: atSeaLevel, landmark };
  if (delta > 0) return { cleared: false, landmark: { ...landmark, raisedForClearance: true } };
  return { cleared: delta < 0 && landmark.raisedForClearance === true, landmark };
}

export function rankRivalTargets(houses, tactic = "attack", now = 0, recentWindow = 30) {
  const targets = houses.filter(house => house.faction === "player");
  if (!targets.length) return [];
  const score = house => tactic === "quake"
    ? house.level * 30 + (house.support || 0) * 2 + house.pop
    : tactic === "bog"
      ? house.pop * 5 + house.level * 12 + (house.support || 0)
      : house.level * 18 + house.pop * 4;
  return [...targets].sort((a, b) => {
    const aRecent = now - (a.lastTargetedAt ?? -Infinity) < recentWindow;
    const bRecent = now - (b.lastTargetedAt ?? -Infinity) < recentWindow;
    return Number(aRecent) - Number(bRecent) || score(b) - score(a) || a.x - b.x || a.y - b.y;
  });
}

export function chooseRivalTarget(houses, tactic = "attack", now = 0, recentWindow = 30) {
  return rankRivalTargets(houses, tactic, now, recentWindow)[0] || null;
}

export function chooseReachableRivalTarget(houses, canReach, tactic = "attack", now = 0, recentWindow = 30) {
  return rankRivalTargets(houses, tactic, now, recentWindow).find(canReach) || null;
}

export function rivalDoctrineAt(simElapsed) {
  return Math.floor(Math.max(0, simElapsed) / 24) % 3;
}

export function clusterFollowerGroups(people, radius = 3) {
  if (!people.length) return [];
  const compactGroups = () => {
    const packed = [...people], packedGroups = [];
    while (packed.length) {
      const group = [packed.shift()];
      for (let cursor = 0; cursor < group.length; cursor += 1) for (let index = packed.length - 1; index >= 0; index -= 1) {
        if (Math.hypot(group[cursor].x - packed[index].x, group[cursor].y - packed[index].y) <= radius) group.push(packed.splice(index, 1)[0]);
      }
      packedGroups.push(group);
    }
    return packedGroups;
  };
  if (!people.every(person => Number.isFinite(person?.x) && Number.isFinite(person?.y)) || !Number.isFinite(radius) || radius <= 0) return compactGroups();
  const cell = Math.max(.001, radius), buckets = new Map(), bucketKeys = [], remaining = new Set(people.map((_,index)=>index)), groups = [];
  const cellKey = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  for (let index=0;index<people.length;index++) {
    const person=people[index];
    const key = cellKey(person.x, person.y), bucket = buckets.get(key);
    bucketKeys[index]=key;
    if (bucket) bucket.add(index); else buckets.set(key, new Set([index]));
  }
  // Packed Reckoning hosts are faster with the compact scan; dispersed late-game armies use the spatial index.
  if (buckets.size < Math.sqrt(people.length)) return compactGroups();
  for (let seed=0;seed<people.length;seed++) {
    if (!remaining.delete(seed)) continue;
    buckets.get(bucketKeys[seed])?.delete(seed);
    const group = [people[seed]];
    for (let cursor = 0; cursor < group.length; cursor += 1) {
      const person = group[cursor], bx = Math.floor(person.x / cell), by = Math.floor(person.y / cell);
      const candidates=[];
      for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) {
        for (const candidate of buckets.get(`${bx + ox},${by + oy}`) || []) if (remaining.has(candidate)) candidates.push(candidate);
      }
      candidates.sort((a,b)=>b-a);
      for(const candidate of candidates){const target=people[candidate];if(remaining.has(candidate)&&Math.hypot(person.x-target.x,person.y-target.y)<=radius){remaining.delete(candidate);buckets.get(bucketKeys[candidate])?.delete(candidate);group.push(target);}}
      }
    groups.push(group);
  }
  return groups;
}

export function followerGroupStatus(group, elapsed = 0) {
  return { count: group.length, fighting: group.some(person => (person.combatUntil || 0) > elapsed) };
}

export function followerReadout(person) {
  const maximum = person.champion ? 120 : 18;
  const strength = Math.max(0, Math.min(maximum, Math.round(person.hp || 0)));
  const ratio = strength / maximum;
  const role = person.champion ? "champion" : person.leader ? "leader" : "follower";
  const condition = ratio <= .33 ? "fading" : ratio < .55 ? "wounded" : ratio < .8 ? "steady" : "strong";
  return { role, strength, maximum, condition };
}

export function nextInspectable(candidates, previousId = null) {
  if (!candidates.length) return null;
  const index = candidates.findIndex(candidate => candidate.id === previousId);
  return candidates[index < 0 ? 0 : (index + 1) % candidates.length];
}

export function onboardingDecision({ profileRaw = null, legacyCampaignRaw = null } = {}) {
  let profile = null;
  try {
    const parsed = JSON.parse(profileRaw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) profile = parsed;
  } catch {}
  const legacyWorld = legacyCampaignRaw === null || legacyCampaignRaw === "" ? NaN : Number(legacyCampaignRaw);
  const validLegacy = Number.isInteger(legacyWorld) && legacyWorld >= 0 && legacyWorld <= 3;
  const returning = validLegacy || profile?.played === true || profile?.tutorial === "completed";
  return { showTutorial: !returning, returning, validLegacy, profile };
}

export function isValidGameSave(value, size = 34) {
  if (!value || typeof value !== "object" || value.version !== 1 || value.complete === true) return false;
  if (!Number.isInteger(value.currentWorld) || value.currentWorld < 0 || value.currentWorld > 3) return false;
  if (!Number.isInteger(value.worldSeed) || value.worldSeed < 0) return false;
  if (!Array.isArray(value.heights) || value.heights.length !== size + 1) return false;
  if (!value.heights.every(row => Array.isArray(row) && row.length === size + 1 && row.every(height => Number.isFinite(height) && height >= 0 && height <= 7))) return false;
  if (!Array.isArray(value.houses) || !Array.isArray(value.people) || !Array.isArray(value.bogs)) return false;
  if (![value.mana, value.rivalMana, value.water, value.elapsed, value.simElapsed, value.nextId].every(Number.isFinite)) return false;
  if (!value.beacon || !value.camera || !value.factionStarts) return false;
  const point = item => item && Number.isFinite(item.x) && Number.isFinite(item.y) && item.x >= 0 && item.y >= 0 && item.x <= size && item.y <= size;
  if (!point(value.beacon) || !point(value.camera) || !point(value.factionStarts.player) || !point(value.factionStarts.rival)) return false;
  if (!value.houses.every(house => point(house) && ["player", "rival"].includes(house.faction) && Number.isInteger(house.level) && house.level >= 1 && house.level <= 4 && Number.isFinite(house.pop))) return false;
  if (!value.people.every(person => point(person) && ["player", "rival"].includes(person.faction) && Number.isFinite(person.hp))) return false;
  return true;
}

export function dwellingGrowthInterval(level) {
  // The original manual is explicit that larger settlements multiply faster.
  // Exact platform constants vary/are not documented, so Meddle preserves its
  // existing 7/9/12/16-second pacing but assigns the fastest interval to the
  // most advanced settlement rather than the reverse.
  return [Infinity, 16, 12, 9, 7][Math.max(0, Math.min(4, level))];
}

export function manaIncome(houses, faction, base = .4) {
  return base + houses.filter((house) => house.faction === faction).reduce((sum, house) => sum + house.level * .11, 0);
}

export function seededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function separatedStarts(size, random, minimumDistance = size * .58) {
  const margin = Math.max(5, Math.floor(size * .17));
  let best = null;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const player = { x: margin + random() * (size - margin * 2), y: margin + random() * (size - margin * 2) };
    const rival = { x: margin + random() * (size - margin * 2), y: margin + random() * (size - margin * 2) };
    const distance = Math.hypot(player.x - rival.x, player.y - rival.y);
    if (!best || distance > best.distance) best = { player, rival, distance };
    if (distance >= minimumDistance) return { player, rival, distance };
  }
  return best;
}
