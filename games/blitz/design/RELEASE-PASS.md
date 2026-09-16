# Blitz: Harbor Strike — 1.0.0 Stable

Promoted to 1.0.0 Stable at the user's request on September 16, 2026, following
campaign, difficulty, road recycling and scenery revisions. All 25 automated
tests pass. Release scope: three sequential stages, three difficulties, four
weapons, animated characters and industrial scenery. Historical beta notes and
remaining cross-device follow-ups below are retained for context.

Local release-candidate pass, September 10, 2026. Not a production deployment or
a claim of parity with a large commercial game's content budget.

### Roadside completion — September 16

Expanded the industrial pavement and underlying ground beyond the visible field,
replacing the exposed blue water plane. Forty scenery placements draw from all
eight locally licensed Kenney industrial models, shuffled independently on both
sides with varied quarter-turns, sizes and spacing. Two depth rows add larger
buildings behind the roadside props. Normalized footprints remain outside the
road; scenery recycling now happens behind the camera. The seeded arrangement
is reproducible and independent of gameplay randomness. All 25 tests pass,
including model variety, road clearance, and scenery recycling checks.

### Sequential campaign UI follow-up

Removed selectable operation cards, promotional copy, visible site branding,
and side panels. The title screen shows the current stage with Play/Continue;
settings and controls are collapsed. Wins persist the next stage immediately,
including before returning to the menu or reloading. Defeat retries the current
stage. Completing all three offers a new campaign while retaining best scores.
Migration keeps consecutive earned stages, not the former selected-board value.
Four additional campaign tests bring the regression suite to 18 passing tests.

### Difficulty spread follow-up

| Rule | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Forward speed | 4.1 | 4.8 | 5.6 |
| Enemy / crate / boss health | 70% | 100% | 140% |
| Troops lost per bullet | 1 | 2 | 4 |
| Positive recruitment / multiplier bonus | 120% | 100% | 75% |
| Damage needed per gate improvement | 10 | 14 | 24 |
| Warning duration | 1.2 s | 0.9 s | 0.65 s |
| Enemy firing cooldown, plus warning | 2.8 s | 2.0 s | 1.35 s |
| Boss firing cooldown, plus warning | 1.6 s | 1.25 s | 0.9 s |
| Bullet speed (boss adds 2) | 9 | 11 | 15 |
| Collision damage multiplier | 0.75 | 1 | 1.5 |

Recruitment is rounded before display; displayed gate values and supply rewards
are the actual awarded amounts. Negative gates are unchanged. Gate charge bars
and warning intensity use the difficulty-specific thresholds. Recovery remains
0.32 seconds to avoid instantly losing a squad to overlapping projectiles.

21 tests pass. All three unattended center-lane Hard runs lose; the route-and-
upgrade controller, using overdrive and boss movement, wins all nine combinations.
This is an automated balance check, not a substitute for human playtesting.

## Direction and reference

The useful reference is the short, readable frontline encounter: steer a squad,
make a gate decision, break a weapon crate, dodge return fire, and finish a boss.
Not a base-building economy or a replica of another game's art.

- [Last War official App Store description](https://apps.apple.com/ba/app/last-war-survival/id6448786147)
- [Mob Control official Steam listing](https://store.steampowered.com/app/2736490/Mob_Control/)

Keep the locally vendored Three.js renderer. An engine replacement would not
fix the prior simulation, incomplete weapon progression, or content pacing.
Use the existing CC0 Quaternius animated characters and Kenney industrial props;
their provenance is recorded in NOTICE.txt and the model directory README.
No new runtime library or remote CDN is required.

## Rebuilt

- Three authored operations with persistent unlocks, stars, best scores, three
  difficulties, distinct district palettes, and command-tank finales.
- Four available weapons with different fire rate, range, damage, and splash;
  gate charging, recruitment, supply crates, and earned overdrive.
- Renderer-independent fixed-step simulation; swept projectile collisions choose
  the nearest target. Enemy bullets test the actual squad, not an invisible box.
- Exact surviving enemy counts, animated casualties, aimed and warned return fire,
  recovery time after hits, zero-force defeat, protected boss entry, timed finales.
- Camera and formation sizing keep troops inside the roadway while steering.
  Road and roadside scenery scroll; scenery footprints remain outside the road.
- In-field deployment, pause, results and operation selection; keyboard and relative
  pointer steering, automatic focus-loss pause, reduced effects and performance mode.
- Separate simulation, rendering, sound, and orchestration modules. The original
  character assets remain intact; only their runtime presentation is prepared.

## Important defects removed

The character models included fourteen weapon attachments, all rendered together.
Only the equipped weapon is now visible. Compatible material primitives are
batched, duplicate skeletons within a character are shared, and retired character
skeletons and dynamic label textures are disposed. Repeated road geometry is
batched and effects use a bounded reusable particle pool.

## Verification

Run `node --test games/blitz/simulation.test.mjs` from the repository root.

Fourteen passing tests cover swept collisions, nearest-target ordering, formation
bounds, zero-force defeat, recovery, exact enemy counts, phantom hits, overdrive,
weapon availability, boss entry, all nine mission/difficulty combinations, passive
failure on the final operation, and identical fixed-step outcomes at 30/60/120 Hz.

Local browser checks: asset loading, deployment, a completed first operation and
unlock/result flow, pause/resume, replay cleanup, responsive viewport layout, and
live render diagnostics. Observed 60 fps on this desktop, including a 33-person
squad with enemies and effects; this is not a mobile hardware benchmark. Returning
to the operation menu restored the texture count to 19 after a live run.

## Before calling this 1.0 stable

- User playtest and acceptance of this visual/gameplay direction.
- Physical iOS and Android touch/audio/context-loss checks, plus Safari/Firefox.
- Longer play sessions and balance testing by players, not just a route bot.
- Verify performance mode on low-end mobile hardware and deployment caching.

No production push is included in this pass. Existing unrelated assets and work
in the repository are preserved.
