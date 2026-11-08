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
| Grid projection | 32×16 diamond; a same-axis diagonal advances one full 16 px tile height | Meddle uses a `tileHeight` diamond | comparable |
| One height level | 8 px | `.55 × tileHeight` | Meddle is slightly steeper |
| Relative relief | `8 / 16 = 0.5` tile heights | `.55` tile heights | close, but not identical |
| Source-matched Meddle value | — | `.5 × tileHeight` | corrected local study value |

The first study incorrectly used the half-row advance as its denominator. That
was wrong: the original comparison is the 8 px height step against the full
16 px diamond height. The source-derived setting is `view.hs = view.th * .5`.
With the one-level neighbor invariant, `.55` still leaves `.45` tile heights of
screen separation; a two-level discontinuity in the default terrain can reverse
that ordering and create genuine ambiguity.

## Empirical accessibility fixture

The original hidden-count fixture was based on the same denominator error and is
superseded. The corrected fixtures project both a peak/pit lattice and normalized
generated 34×34, 54×54, and 74×74 maps at `.5`. They sample every map edge, all
four corners, and deterministic interior points at 90%, 180%, and 220% zoom through
all four rotations. Every sampled joint resolves to its own world coordinate. Exact
screen ties resolve deterministically toward the visually deeper joint; clicks
outside the zoom-scaled tolerance return no target.

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

1. **Projection and unrestricted terrain differ together.** The visible-only picker
   is a safety stopgap: it prevents edits through foreground geometry, but also makes
   a covered joint unavailable. The corrected prototype combines `.5` relief with
   the one-level invariant and addresses the joint lattice directly.
2. **Picker and original sculpting differ.** Normal Meddle finds the frontmost
   polygon and its nearest visible corner; the isolated prototype finds the nearest
   projected joint. `_sculpt` maps horizontal strips and scans height-adjusted
   candidate rows. The prototype is predictable but not algorithmically identical.
3. **Target tolerance was too broad.** The corrected prototype clamps a
   zoom-relative radius to 12–30 px rather than using a fixed 30 px floor.
4. **Pointer identity must remain stable.** The corrected prototype stores the joint
   at pointerdown and commits that
   exact identity; an explicit `null` cannot fall through to a release-time target.
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

Touch uses a deliberate two-tap edit in the prototype: the first tap selects the
joint and exposes its cascade/cost preview, while a second tap on the same joint
commits. A pan or rotation clears that pending intent. This avoids spending influence
before a touch player can see the target.

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
- A developed 74×74 browser run after 240 simulated seconds measured 16.8 ms mean,
  18.3 ms p95, 18.6 ms p99, 33.9 ms max, 1.4 ms update, and 5.7 ms draw with
  89 walkers and 38 dwellings. A developed 54×54 run measured 16.7 ms mean,
  18.3 ms p95, 18.7 ms p99/max, 0.3 ms update, and 5.0 ms draw with 28 walkers
  and 17 dwellings. The pure 5,625-joint selection scan measured about 0.104 ms
  per pick in Node. Late-game disasters and Reckoning remain separate regressions.
- The clipped mixed shore keeps water coplanar and meets land at interpolated sea
  points. Its current earth/water boundary can still look stair-stepped at high zoom;
  that is a rendering-quality issue to address after geometry acceptance.

## Recommended sequence

1. **Adopt the corrected source-derived `.5` relief in the opt-in terrain prototype
   only.** Keep normal Meddle unchanged until the full interaction fixture passes.
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

