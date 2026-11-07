# Renew Land prototype review notes

This is a non-production experiment inspired by the *Populous II* manual. It is not wired to Meddle's renderer, saves, UI, mana variables, or AI.

## Proven by the isolated tests

- Target must be an in-bounds integer tile.
- Preview and application share the same clipped 13-cell diamond.
- A cast requires an explicit `player` or `rival` faction, that faction's influence range, and that faction's own influence balance.
- A cast removes at most four selected catastrophe-rock array entries. Duplicate legacy rocks cannot bypass the cap.
- Natural rocks, trees, out-of-area damage, and unverified legacy scar strings remain untouched.
- Confirmed scars carry explicit provenance: `quake`, `volcano`, `rift`, or `batholith`.
- AI uses the same plan/cost/range and waits for at least three confirmed damage items.
- Planning and application do not mutate inputs.

## Unresolved integration risks

- Production currently has no `terrainScars` collection or provenance field. Inferring scars from old visuals would be unsafe; old saves should load with none unless a separately reviewed migration can prove origin.
- Production uses separate `mana` and `rivalMana`, not the prototype's normalized `manaByFaction` shape. An adapter must be tested without rewriting saves.
- Current landmarks lack guaranteed IDs. Index-based application is safe only within one atomic simulation step; production must reject a stale plan if the landmark array changes between preview and commit.
- Renderer work is absent. Exact isometric cell highlighting, greenery, four rotations, zoom, reduced motion, occlusion, and approved-art compatibility remain untested.
- Current volcano and quake do not emit scar records. Provenance must be created at catastrophe time, not guessed later.
- AI influence range and route/degraded-settlement evidence need to come from live simulation functions; this prototype only accepts callbacks.
- The 120 influence cost, four-rock cap, 13-cell area, and three-item AI threshold are Meddle design values, not facts from the manual. They require multi-seed full-match balance review.
- Renew does not change heights, bogs, population, settlement stages directly, or natural scenery. Whether that recovery feels valuable enough needs real playtesting.
- Save validation, two-tab conflict handling, interrupted autosave, malformed optional data, and forward compatibility need browser-level tests before integration.

## Required gate before any live wiring

Add an isolated renderer/fixture mode with copied state, then independently review preview accuracy, catastrophe provenance, atomic commit behavior, both factions' payment/range, AI restraint, save round trips, and complete-match pacing. Do not expose a permanent power control until those checks pass.
