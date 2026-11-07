# Meddle: Populous II-inspired power proposal

Status: research/design only. No production power, save field, UI control, or balance value is changed by this document.

## Primary evidence

The *Populous II* PC manual describes:

- Earthquake as an aimed effect: an orbiting pointer chooses a general direction, then a rift splits territory and swallows population.
- Renew Land as greenery and flowers that make volcano-damaged land livable again; clustered greenery can spread.
- Batholith as rising land that forces boulders through the surface and destroys farmland; holding the input makes it larger.
- Grow Forest as planting trees around settlements for popularity, not as a timber economy.
- Roads as faster movement and a barrier to fungus spread.

These are sequel mechanics. They should inspire an opt-in Meddle ruleset, not silently redefine Classic Contest.

## Existing Meddle baseline

| Mechanic | Current behavior | Relevant cost |
|---|---|---:|
| Quake | 22 random height strikes inside a 7x7 envelope; may drown exposed walkers and leaves 4/8 rubble attempts | 140 |
| Volcano | Raises a circular peak, destroys/evacuates settlements, clears scenery and leaves up to 15 rocks | 520 |
| Bog | Creates a fixed 21-cell lethal/attritional hazard | 210 |
| Terrain shaping | One joint plus slope smoothing; scenery uses existing dark/light clearance rules | 8 |
| Trees and rocks | Block paths and new settlement footprints; the AI does not receive free clearance | — |

## Recommended order

### 1. Directed Rift — prototype first

Purpose: replace randomness with a legible tactical line attack in an explicit **Mythic** ruleset. Classic retains current Quake.

- Proposed cost: **180 influence**.
- Targeting: choose a start tile, then choose one of eight directions. Preview the exact 7-tile centerline and the one-tile possible shoulder cells.
- Effect: travel one tile every 0.18 seconds. Each centerline tile receives one deterministic height displacement; alternating shoulder tiles receive a smaller displacement. Walkers standing on the open centerline take heavy damage, not an unexplained global kill.
- Persistence: cracked tiles remain visibly scarred until their joint is successfully raised or lowered once. Scars do not independently block paths.
- Counterplay: the direction telegraph remains for 1.2 seconds before movement; move/focus followers away, repair individual joints for the ordinary shaping cost, or use Renew Land to remove only the residual scar after heights are safe.
- Readability: bright directional ground arrow before commitment, sequential dark fissure with dust and falling fragments, then a restrained crack decal. Reduced-motion mode shows stepped highlights without camera shake.
- AI: Veyra may cast only when at least three hostile population/settlement targets lie near the projected line and the line does not cross comparable friendly value. She pays 180 and uses the identical geometry function.

Why first: it materially improves tactical choice and spectacle while reusing Meddle's height, preview, evacuation, event-history and camera systems. It is also independently testable.

### 2. Renew Land — necessary counter and recovery tool

Purpose: make persistent catastrophe aftermath strategic without making cleanup tedious.

- Proposed cost: **120 influence**.
- Area: exact 13-cell diamond (Manhattan radius two).
- Effect: remove catastrophe `scar` state and up to four catastrophe-created rocks inside the area. It does **not** flatten terrain, restore drowned people, clear bogs, remove natural rocks/trees, or instantly rebuild settlements.
- Spread: none in initial implementation. The manual's spreading greenery is attractive, but autonomous spread would complicate saves, performance and predictability.
- Counterplay: an enemy can re-damage renewed land; the caster still pays ordinary shaping costs to restore useful contours.
- Readability: preview separately outlines scarred cells and removable rubble. On cast, a short green sweep reveals small flowers/grass tufts, then fades into the existing world texture so approved building art stays dominant.
- AI: Veyra may cast only when the area contains at least three scars/removable rocks and either a degraded friendly settlement or a blocked strategic route. She pays the same 120.

Why second: Directed Rift and the existing Volcano become fairer when recovery is comprehensible and bounded. This also gives catastrophe scars an explicit lifecycle.

### 3. Batholith — optional terrain obstacle/counter pair

Purpose: provide a mid-tier territorial denial power between Bog and Volcano.

- Proposed cost: **260 influence**.
- Area: exact 3x3. Raise the center by two, orthogonal neighbors by one, then place at most six catastrophe rocks using existing walker/building-safe placement.
- No hold-to-scale in the first version. Variable-size casting complicates pointer/touch parity and cost previews.
- Counterplay: ordinary shaping repairs height; Renew Land can clear a bounded number of catastrophe rocks; natural obstacle-clearance rules remain unchanged.
- Readability: preview shows height deltas and candidate rock cells as separate layers. Cast animation lifts visible slabs before boulders surface; no opaque particle cloud over units.
- AI: use only against enemy farmland/support or to disrupt a reachable route, never on occupied friendly building footprints. Pay full cost and require the same influence range.

Why third: it reuses proven landmark safeguards, but it will amplify pathfinding pressure. It should wait until Rift and Renew demonstrate that Veyra can recover routes without cheats.

## Not recommended for the first Mythic increment

- **Grow Forest:** in Meddle, trees are hard path/site obstacles. Direct planting would become a cheap wall and could trap either faction. Popularity has no current simulation analogue.
- **Basalt:** useful for a much larger RTS-style map, but Classic already guarantees viable cross-water routes and Reckoning constructs emergency paths. It would undermine those assumptions.
- **Autonomous spreading greenery/fungus:** requires persistent cellular simulation, new AI containment behavior and extensive save migration.
- **City walls/roads:** both need a new edge-network representation and collision rules; they are systems, not isolated powers.

## Ruleset and save compatibility

1. Add powers only behind a new-game-only `ruleset: "mythic"`. Existing and absent values resolve to `"classic"`.
2. Resume always uses the saved ruleset. Never offer Mythic powers inside a legacy active match.
3. Add optional `terrainScars: []` and `scarVersion: 1`; missing arrays load as empty without rewriting the save.
4. Store Rift direction and scar cells, not animation state. An interrupted cast resolves atomically before autosave.
5. Use stable named fields and validate bounds/types. Invalid optional data is ignored while the underlying classic save remains recoverable.
6. Add a separate Mythic test fixture before exposing the mode on the launch screen.

## UI constraints

- Do not add prose to the persistent HUD.
- Put Mythic powers in the existing powers panel under one compact category control.
- Hover/focus shows cost, exact footprint and counter in the existing tool hint; Help contains the longer explanation.
- Armed powers must toggle off, respect pause, block R/F shaping shortcuts, clamp labels to the safe viewport, and use the same pointer/keyboard/touch geometry.

## Acceptance gates

- Shared pure geometry drives preview, simulation and AI targeting.
- Deterministic tests cover all eight Rift directions, edges, rotations, pause, friendly-fire valuation, repair, Renew limits and Batholith safe placement.
- Multi-seed comparisons measure population loss, settlement downgrades, route reachability, mana timing and AI self-harm against Classic.
- Real browser play verifies compact layout, reduced motion, four camera rotations and save/resume midway through aftermath.
- Mythic remains opt-in until complete matches show that counterplay works for both factions.
