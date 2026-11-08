# Meddle terrain geometry and editing audit

Status: local study only. No geometry change in the normal dev game.

## Scope and evidence

This audit separates three things that had become conflated:

1. the height-field simulation and its shaping cascade;
2. the screen projection and the amount of vertical exaggeration;
3. cursor-to-world selection and edit feedback.

Primary evidence is the reconstructed Amiga 2.7 source. It is strong evidence for
that release, but is not proof that every 1989 platform used identical constants.
The relevant routines are `_raise_point`, `_lower_point`, `_make_map`, `_draw_map`,
and `_sculpt` in `populous_prg.asm`.

The browser-hosted DOS copy reached copy protection and was not used as behavioral
evidence. Screenshots and contemporary video are useful visual corroboration only.

## Geometry comparison

| Property | Amiga 2.7 evidence | Current Meddle | Result |
| --- | --- | --- | --- |
| Height data | shared point grid | shared `(N+1)×(N+1)` point grid | same model |
| Shaping cascade | recursively keeps all 8 neighbors within one level | optional Populous terrain model does the same | source-backed prototype |
| Tile surface | selected from four corner heights | rendered from four corner heights | same basis |
| Grid projection | diamond; one candidate row advances 16 px | adjacent point advances `tileHeight / 2` | comparable |
| One height level | 8 px | `.55 × tileHeight` | Meddle relief is about 2.2× too strong |
| Relative relief | `8 / 16 = 0.5` row steps | `.55 / .5 = 1.1` row steps | principal occlusion cause |
| Source-matched Meddle value | — | `.25 × tileHeight` gives `.25 / .5 = .5` | local study value |

Meddle's current `view.hs = view.th * .55` does not mean 55% of a grid-row
step: a grid-row step is only `view.th / 2`. Consequently a one-level rise is
taller than the projected separation between adjacent points. The source-derived
setting is `view.hs = view.th * .25`.

## Empirical visibility fixture

The deterministic broad-basin fixture was projected in all four rotations and a
point was counted as hidden when a later-painted terrain surface covered its
projected screen location.

| Relief (`hs / tileHeight`) | North | East | South | West |
| --- | ---: | ---: | ---: | ---: |
| current `.55` | 13 / 1089 | 13 / 1089 | 19 / 1089 | 19 / 1089 |
| compromise `.40` | 0 / 1089 | 0 / 1089 | 0 / 1089 | 0 / 1089 |
| source-derived `.25` | 0 / 1089 | 0 / 1089 | 0 / 1089 | 0 / 1089 |

Browser inspection of the same fixture corroborated the numeric result. At `.55`,
the foreground bank visibly masks joints behind it. At `.25`, the full basin rim
remains readable in North, East, South, and West views. A winter ordinary-play run
also kept walkers, trees, the beacon, and their foot anchors grounded.

## Shaping and functional behavior

### What is already correct in the opt-in terrain model

- One joint is raised or lowered, then an eight-neighbor recursive cascade restores
  a maximum one-level difference.
- The complete cascade is computed before charging influence.
- A height-limit no-op does not charge influence.
- The preview enumerates every joint in the computed cascade.
- Player influence range is checked before charging.
- Paused shaping and shaping while a power is armed are blocked.
- A click/drag threshold prevents a camera drag from also editing terrain.

### Current interaction defects

1. **Projection creates the hidden-point problem.** The visible-only picker is a
   safety stopgap: it prevents edits through foreground geometry, but also makes a
   covered joint unavailable. It should not be mistaken for an original-like fix.
2. **Picker and original sculpting differ.** Meddle finds the frontmost polygon and
   then its nearest visible corner. `_sculpt` maps horizontal strips and scans the
   height-adjusted candidate rows. With source-like relief these approaches should
   converge visually more often, but they are not algorithmically identical.
3. **Target tolerance scales broadly.** Meddle accepts a corner within
   `max(30 px, 0.32 × tileWidth)`. At low zoom adjacent candidates can compete; at
   high zoom the fixed 30 px floor is generous.
4. **Pointerdown uses the point selected at pointerup.** This is sensible for drag
   cancellation, but a moving simulation can alter the hovered surface during a
   long press. The edit should use a stable preview/commit identity.
5. **Edges need explicit coverage.** The cascade correctly clips to the array, but
   cursor availability, feedback labels, and power targeting need deterministic
   corner/edge fixtures in every rotation.
6. **Water is presentation, not a height constraint.** Fully submerged tiles draw a
   flat water polygon, while their seabed points remain editable. The shore changes
   when those points cross water level. That is appropriate, but shoreline picks
   must make clear whether land or the flat water surface owns the cursor.
7. **Normal and prototype saves are intentionally separated.** The terrain prototype
   nulls the resumable save. A future geometry migration needs an explicit policy;
   changing projection alone is save-compatible, changing height normalization is not.

## Gameplay impact

- Lower relief makes every needed joint available without selecting through land.
- It reduces dramatic cliff height, but the original derives relief readability from
  shape/material banks and earth faces rather than extreme vertical displacement.
- Building and follower anchors remain mathematically correct because they share the
  same `iso()` function. Raster buildings still require a visual regression pass at
  all stages because a flatter terrain changes their apparent relative height.
- Screen panning, depth ordering, labels, power previews, and offscreen markers all
  use `iso()` and therefore remain coherent, but must be browser-checked.
- Simulation, pathfinding, settlement support, and combat use world heights rather
  than screen height and are not changed by projection relief.

## Recommended sequence

1. **Adopt the source-derived `.25` relief in the opt-in terrain prototype only.**
   Keep `.40` as a comparison control, not the target: it fixes the fixture but lacks
   the primary-source basis.
2. **Replace the visible-only limitation with predictable surface/joint targeting.**
   With occlusion removed geometrically, choose the nearest projected joint within a
   zoom-relative Voronoi region, show its coordinate and complete cascade, and commit
   exactly that previewed identity.
3. **Add deterministic interaction fixtures.** Cover peak, pit, saddle, shoreline,
   map corner, camera edge, every rotation, minimum/maximum zoom, no-op, insufficient
   influence, and click-versus-drag.
4. **Audit terrain rendering after geometry is accepted.** Only then tune the shape
   bank, earth faces, grass/snow coverage, shallow water, and lighting. Texture work
   before projection acceptance obscures the underlying problem.
5. **Run full gameplay regression before promotion.** Include settlement
   downgrade/recovery, building anchors and footprints, scenery, walkers, power
   targeting, disasters, save/resume, 34/54/74 maps, and frame-time comparison.

## Go/no-go criteria

Do not promote the geometry unless all of these are true:

- no required editable joint is visually hidden in the deterministic fixtures;
- pointer preview and committed joint always match;
- invalid and no-op edits never spend influence;
- all four rotations provide the same world-coordinate result;
- water remains a single flat plane and shoreline edits are predictable;
- buildings, followers, scenery, and labels remain grounded at normal play zoom;
- Classic simulation and saves remain unchanged when the prototype flag is absent.

