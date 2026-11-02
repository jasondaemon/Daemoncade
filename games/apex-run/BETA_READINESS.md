# Apex Run development readiness

## Status

Version `0.5.0-alpha.43` is a desktop-keyboard production-slice candidate, not a release candidate. The previously verified flat-course
beta remains available in Git history at `16a26e5`; its player-lap result must not be treated as
validation of this materially different spline layout. The game is an original single-player
stadium time attack inspired by the broad genre, not a Trackmania clone, formula-equivalent
simulation, or AAA-production claim.

Start a local preview from the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/games/apex-run/?build=alpha44`. Add `&track=summit-circuit` to open the longer advanced course directly.

Alpha 24 repairs the measured coarse road-normal transitions and visible triangular sidewall
artifacts while retaining the authored crest jump. Alpha 25 replaces the rejected procedural car
with the user-supplied, attributed CC-BY 4.0 Low Poly-F1 asset, fitted to the unchanged physical
wheelbase/track and animated through the existing steering, suspension and wheel-roll transforms.
Alpha 26 removes the source model's baked opposite wheel camber before establishing those
runtime pivots, so every tire now rolls concentrically around the physical hub axis instead of
visibly coning. Full-revolution invariants cover all four authored wheel meshes at three steering
angles; physics, suspension and wheel locations remain unchanged.
Alpha 27 removes the early-development ground chevrons, world-space breadcrumb rings, transverse
jump paint and instructional crest/finish boards from this single-path course. The permanent white
road stripe, physical ramp, landmark gates, minimap and internal recovery guidance remain.
Alpha 40 integrates the physical stunt loop into Summit Circuit on one welded, non-overlapping
3D ribbon. It uses the unchanged Rapier vehicle, world gravity and suspension: correctly aligned
entries remain in contact through inversion, while an under-speed attempt falls naturally and
recovers as a practice run. Summit PB/replay keys advance to v5/v6 because the timed layout changed.
Alpha 44 reshapes most of Summit from a uniform forty-metre ribbon into 10–16 metre technical
sections (the split junction keeps the wider welded transition it physically requires), adds a
two-island paddock slalom, and replaces the continuous crest with a real reservoir air gap:
rendered deck, Rapier collider, lane stripe and both rails are all absent over the same span. A
12-degree takeoff, broad descending landing, visible water hazard and close-view CC0 Racing Kit
paddock buildings give the stunt a readable identity. A physical 20/26/32/38 m/s by -3/0/+3 m
matrix lands all powered approaches; a 12 m/s coast falls into the reservoir and recovery correctly
marks the attempt practice-only without awarding a checkpoint. The deterministic production
controller completes the changed seven-sector route without recovery; this remains regression
evidence, not a human-play claim. Summit PB/replay keys advance to v8/v9.

## Controls and rules

- W/Up: throttle; S/Down: service brake. Release and press S/Down again after stopping to select reverse. A/D or Left/Right: steer.
- Space: drift/handbrake; Backspace: recover; R: restart; P/Escape: pause; M: mute.
- Checkpoints must be crossed in order. Recovery adds 1.5 seconds and makes the attempt a
  practice run: it can finish, but cannot earn a medal, PB, or ghost.

## Alpha 25: authored Formula car and landmark sectors

- The player car now uses salasilma13's authored Low Poly-F1 body and tires under CC BY 4.0, with
  source and modification credits beside the asset. Static source tires are removed and repivoted
  copies animate at the unchanged physical wheel locations. The original Apex livery contains no
  team logos, and the replay ghost clones the complete fitted silhouette. Physics, suspension,
  wheel locations and collider remain unchanged.
- Six inherited doorway checkpoints are replaced by four landmark sectors: opening sweeper,
  crest/landing, elevated return and finish. Every gate is built from the exact spline sample's
  width and full surface frame, so its crossbeam spans rail-to-rail and its supports sit outside
  the drivable lane on banked/elevated road.
- Trigger detection uses the same local forward/lateral/up basis as the visible gate. Ordered
  altitude-aware checks prevent a lower overlapping route from falsely crossing an elevated gate.
  The incompatible PB/replay schema is explicitly advanced to PB v9 / replay v10; older sector
  splits and ghosts are not silently compared with this layout.
- Focus loss or a hidden tab pauses without changing velocity. A long unexplained render gap
  invalidates the attempt rather than silently undercounting competitive time.
- If scalar PB storage succeeds but replay storage is unavailable, the result explicitly says
  `PB saved; ghost unavailable`; an older ghost is not presented as the new PB ghost.

## Verified scope

- The visual alpha uses one shared indexed spline mesh for rendering and collision. Automated
  geometry checks cover non-degenerate triangles, non-crossing edges, bounded tangent changes,
  banking, altitude-aware road occupancy/checkpoints, full surface-frame recovery poses, and
  approximately 19 metres of elevation.
- A 34 m/s west-straight crest test becomes fully airborne and establishes sustained landing
  contact on the spline collider;
  the opening curve remains on the modeled road across a 0.6-second launch-timing window.
- Browser inspection at 1280x720 confirms the curved ribbon, curbs, elevated supports,
  continuous stadium tiers, hills, reshaped vehicle, smoother joins and obstruction-aware camera.
  A startup integration fault found during this inspection was corrected before the alpha 15 lap;
  alpha 15 completed with no warning or error attributed to its module graph.
- A recovery-to-crest probe starts from rest on the sloped CP2 recovery pose, uses held throttle
  plus one 0.5-second steering correction, reaches 20.2 metres elevation and 82.8 km/h, crosses
  the crest and remains on the road. Visible rails now have continuous collision geometry.
- Ten four-second chassis-and-wheel scrape probes cover both rails at 43-79 km/h across straight
  and curved joins. Suspension query groups exclude the physical rail while retaining road contact;
  every probe records zero rail-as-ground ticks, no sustained perch, continued route progress,
  and more than 5 m/s during the two-second throttle/countersteer phase. A sufficiently direct
  chassis impact can still stop the car and requires the documented brake/reverse lifecycle.
- Ten pinned-contact probes force the rounded chassis into both rails on flat, elevated and final
  curve samples, record real chassis/rail manifolds while confirming zero rail wheel contacts,
  then brake to a measured stop, release, reverse at least 0.5 metres and steer forward away.
  All regain more than 5 m/s and remain upright; this directly covers the prior 0-4 km/h asphalt
  immobilization without relying on a fixed-timing gear-change assumption.
- A reactive keyboard-like source fixture completes all six ordered gates in 43.95 seconds
  without recovery at 30/60/144 render schedules. This is collision/determinism coverage, not a
  substitute for a screen-driven player lap. A separate held-input crest probe, rather than this
  route fixture, proves the airborne and landing phases.
- Production-page keyboard QA completed a no-recovery `1:42.583` Rookie-medal lap after a separate
  `1:57.500` recovery/practice lap. Restart, recovery eligibility, checkpoint order, finish and PB
  save all behaved correctly. The clean lap needed several deliberate reverse-and-steer escapes;
  direct rail contact still removes too much momentum even though it no longer traps the car.
- Low-speed launch torque now tapers from 1550 to the original 1200 per wheel by 90 km/h:
  flat-road speed at five seconds improves from 65.9 to 75.7 km/h while the unchanged 35-unit
  service brake stops from 80 km/h in 1.34 seconds / 14.68 metres. Under throttle, nine shallow
  3–15 degree contacts retain 97–111% of tangential speed after 0.35 seconds; this is gameplay
  response, not a pure collision-energy claim. With neutral throttle, five both-side 5–13 degree
  glances retain 90–96%. Neutral 35-degree impacts retain 69–75%, 60-degree impacts retain
  37–41%, and near-frontal 83-degree impacts retain 1–3%, establishing a monotonic physical
  response from a momentum-preserving scrape to a credible stop.
- Production-page alpha 16 keyboard QA completed a `2:54.167` recovery/practice lap that correctly
  left the PB unchanged, then a no-recovery `2:22.725` run that remained PB-eligible. Both used
  visible chase-view feedback with disclosed observation pauses, so neither is represented as an
  uninterrupted performance lap. The clean run physically reversed away from several hard rail
  contacts and finished with no browser warnings or errors; the existing `00:48.700` PB persisted.
- Independent production-page keyboard QA on the same alpha 16 graph completed a clean
  `00:46.000` lap without recovery or reverse. Observation pauses were disclosed, so this is
  player-control and finish evidence rather than an uninterrupted performance benchmark. A
  production shallow scrape retained 71 km/h from a 73 km/h approach.
- Chrome lifecycle integration on the exact alpha 16 graph completes a clean 45.325-second
  fixture, saves 1,360 replay frames, reloads a visible ghost that moves 115.6 metres and changes
  orientation, and proves that a recovered practice finish cannot replace the clean PB/ghost.
  It also covers denied-storage messaging, direct entry, the app shell, pause/visibility handling,
  and verifies that the normal entry exposes no test controller. The reactive fixture exercises
  the real runtime race loop and storage path, but is not represented as player-driving evidence.
- On one 2021 MacBook Pro (Apple M1 Max, 24-core GPU, 32 GB) using Chrome's ANGLE Metal renderer,
  a 240-frame alpha 17 production sample measured 16.7 ms median, 16.7 ms p95 and 16.8 ms p99 intervals.
  A 600-second accelerated drift/reset soak took 85.8 wall-clock seconds and remained at 262
  geometries / 11 textures after full-cycle warm-up. This is one-machine evidence; lower-end Mac,
  Windows and software-renderer performance remain uncharacterized.
- Alpha 17 adds an explicit ready/start state, concise keyboard and recovery onboarding, an
  immediate PB-eligibility badge, a persistent ghost toggle, replay-derived checkpoint deltas,
  a six-split finish analysis, and bounded checkpoint/finish audio cues. Split extraction and
  presentation logic are pure and separately tested; the browser lifecycle asserts all six split
  rows through the real finish path.
- Scalar PB/replay reconciliation now suppresses an older ghost after a newer scalar PB saved but
  replay storage failed. Unit and browser reload regressions cover this partial-storage case.
- Alpha 18 extends the same rendered/collision ribbon approximately 30 metres behind the timed
  start, so the car now sits on an authored grid apron with continuous road, stripe, curbs and
  rails instead of at a cut road edge. The original timed route and checkpoint coordinates remain
  unchanged, preserving PB and replay semantics while adding a persistent start gantry.
- The west-straight crest now has surface-aligned takeoff stripes, a `COMMIT · CREST` board and
  landing-zone markers derived from the shared road samples. A nine-case physical approach matrix
  covers 26/30/34 m/s and lateral offsets of -4/0/+4 metres: all cases remain upright and on-road;
  30 and 34 m/s cases become fully airborne and establish sustained landing contact. The 26 m/s
  cases remain grounded, documenting the actual speed threshold instead of presenting every crest
  traversal as a jump. Landing audio is triggered only by a measured airborne-to-grounded impact.
- Exact-graph Chrome integration completes the alpha 18 lifecycle fixture in 43.042 seconds with
  1,292 replay frames. The accelerated 600-second soak took 93.0 wall-clock seconds and stabilized
  at 274 geometries / 13 textures; a normal 240-frame production sample measured 16.7 ms median,
  16.7 ms p95 and 16.8 ms p99 on the same M1 Max/ANGLE Metal machine. These remain single-machine
  measurements, not lower-end hardware certification.
- Alpha 19 stages the interface so the ready screen presents only the objective, essential
  controls and graphics choice; race telemetry appears after Start, while detailed sector analysis
  remains a finish-only surface. High, Medium and Low vary capped pixel ratio, shadow resolution,
  local shadow extent, rail detail and scenery density while retaining contact shadows. Chrome integration asserts the persisted
  choice and the 1280-pixel Low-mode race canvas.
- Presentation geometry adds continuous seating bands, varied infield surfaces, rounded distant
  landforms, a checkered finish identity, larger full-width jump markings and a curved ghost shell
  matching the player car's main silhouette. These are original procedural additions and do not
  modify the shared road collider or vehicle tuning.
- A CSP-safe load guard keeps the loading surface available when module, WebGL or WASM startup
  rejects, explains that graphics failed and offers an explicit retry. Audible mix quality remains
  unverified because the automation surface cannot listen to WebAudio output.
- Exact alpha 19 Chrome lifecycle still finishes in 43.042 seconds with 1,292 frames. Its
  600-second accelerated soak took 101.4 wall-clock seconds and stabilized at 300 geometries /
  13 textures; the M1 Max/ANGLE Metal 240-frame sample measured 16.7 ms median and 16.8 ms p95/p99.
- Alpha 20 completes state staging: the finished result hides race HUD, eligibility, navigation,
  quick actions and bottom controls. Pause exposes accessible graphics, sound and ghost controls;
  held inputs remain cleared, Escape resumes, and R retains instant clean-restart semantics.
- The load guard listens in capture phase, so a real aborted module-resource request reaches the
  failure surface. Browser integration aborts `game.js`, verifies actionable Retry and Retry in Low
  choices, and confirms the normal entry never exposes the test controller.
- Real `WEBGL_lose_context` coverage starts a production run, loses the context, verifies immediate
  pause and PB ineligibility, restores the context, and requires an explicit clean restart. A
  context interruption can therefore never silently save a competitive time.
- Graphics failure and restoration surfaces use alert-dialog semantics, make background game
  controls inert, and focus the primary visible action. Browser coverage activates Restart with
  the keyboard and verifies that the canvas becomes interactive again only after the clean reset.
- After successful initialization the loading surface is now both `hidden` and visually removed,
  so its stale `BUILDING THE STADIUM` status is absent from the accessibility tree. Real module or
  WebGL failures explicitly unhide it and restore alert-dialog semantics, isolation and focus.
- Alpha 20's exact lifecycle remains 43.042 seconds / 1,292 frames. The accelerated 600-second
  soak took 88.5 wall-clock seconds with 300 geometries / 13 textures; M1 Max/ANGLE Metal frame
  intervals remained 16.7 ms median and 16.8 ms p95/p99. Audio mix remains unverified by ear.
- Alpha 21 replaces the generic continuous stadium ring with three separated roofed stepped
  grandstands, recessed concourses and landscape gaps. A continuous sage terrain basin, slate
  rock/berm masses, warm concrete, charcoal asphalt and fewer substantial tapered bridge piers
  establish an Alpine pavilion material language while cyan is limited to timing/edge accents.
- Actual 1280x720 start and opening-sweeper chase views confirm an open landscape exit, a distinct
  roofed pavilion landmark, heavier support scale, darker road hierarchy and visible car livery /
  roll hoop. The oversized crest billboard is replaced by a compact integrated marker; takeoff and
  landing road markings remain surface-aligned and physically non-colliding.
- Scene simplification reduces the warmed-up renderer count from 300 to 266 geometries while
  retaining 13 textures. Exact lifecycle time remains 43.042 seconds; the 600-second accelerated
  soak took 81.6 wall-clock seconds, and M1 Max/ANGLE Metal intervals remain 16.7 ms median/p95 and
  16.8 ms p99. The first two headless launches exceeded the old 30-second initialization wait;
  after the exact entry was verified in IAB, a 60-second harness allowance completed cleanly.
- Alpha 22 grounds each pavilion on a continuous warm-concrete plinth and localized service apron,
  adds end walls, aligned substantial columns/braces, canopy fascia, access opening, stair aisles
  and restrained crowd-color bands. The stepped profile now reads as one architectural template
  with controlled variation instead of floating shelves and detached thin roofs.
- The replay ghost now shares the player car's major side pods, rear wing and roll hoop in addition
  to body, nose and rear deck. Its material remains transparent and non-colliding.
- Exact alpha 22 lifecycle remains 43.042 seconds / 1,292 frames. The richer pavilion template
  stabilizes at 340 geometries / 13 textures; the final accelerated 600-second soak took 107.9 wall-clock
  seconds, and M1 Max/ANGLE Metal timing remained 16.7 ms median, 16.8 ms p95/p99.

The following evidence describes the prior `0.4.0-beta.1` geometry and is retained as history,
not as a readiness claim for visual alpha 5:

- Independent production-page player QA completed a clean `1:54.342` Rookie-medal lap using
  ordinary keyboard controls and screen-visible navigation. It used no reset, Backspace,
  recovery, hidden coordinates, or scripted controller. Observation pauses were used and are
  disclosed, so this is not represented as one uninterrupted real-time lap.
- The same player QA confirmed the original blocking concerns are corrected: the car remains
  controllable on track, wheel hubs remain correctly aligned while tires roll and steer, grass
  mistakes can re-enter, recovery headings work, unsupported world edges recover, and ordered
  breadcrumb navigation no longer points to passed invisible helpers.
- Chrome/Playwright lifecycle verification exercises the exact runtime physics with a shared
  low-frequency keyboard-like fixture: ordered finish, PB save, tick-zero replay,
  reload-visible moving/rotating ghost, pause/visibility handling, recovery-protected PB,
  denied storage messaging, direct entry, app-shell startup, and bounded drift/reset soak.
- Recovery-to-finish practice flow preserves the prior clean PB and ghost.
- Recorded identical inputs remain trajectory-equivalent under 30/60/144 FPS render schedules.
- A 600-second simulated drift/reset soak is accelerated test time, not ten real-time minutes.
  See the latest integration-test output for measured wall time and renderer counts.

Known prior-beta limits: the finish gate remains deliberately narrow, digital steering still benefits
from frequent correction, and only desktop keyboard control is supported. Touch, gamepad,
multiplayer, editor, and wall rides are future work, not beta commitments. Alpha 40 adds one
physical Summit inversion with automated production-physics coverage; an ordinary uninterrupted
player completion of that new layout is still outstanding. Lower-end
laptop, software-renderer, and Windows performance remain uncharacterized.

## Code and licenses

- Game code, procedural course, vehicle geometry, signs, interface, and audio synthesis are
  original Daemoncade work covered by the repository license.
- Three.js is vendored under its MIT license in `games/vendor/three/`.
- Rapier is vendored with `games/apex-run/vendor/RAPIER-LICENSE` and its JavaScript/WASM wrapper.
- No proprietary Trackmania assets, branding, track data, or source code are included.

## Verification

```sh
node games/apex-run/simulation.test.mjs
node games/apex-run/vehicle-model.test.mjs
node games/apex-run/wheel-visual.test.mjs
node games/apex-run/formula-car.test.mjs
node games/apex-run/race-feedback.test.mjs
node games/apex-run/route-guidance.test.mjs
node games/apex-run/play-area.test.mjs
node games/apex-run/handling-response.test.mjs
node games/apex-run/human-control.test.mjs
node games/apex-run/trajectory.test.mjs
node games/apex-run/track-geometry.test.mjs
node games/apex-run/rail-contact.test.mjs
node games/apex-run/telemetry.test.mjs
node games/apex-run/rollover.test.mjs
node games/apex-run/split-route.test.mjs
node games/apex-run/split-junction.test.mjs
node games/apex-run/test-lifecycle-ui.test.mjs
```

The browser integration requires installed Google Chrome and the repository's established
Playwright runtime path. It uses `games/apex-run/test.html`, which is not linked by or enabled in
the normal production entry. Its reactive route driver is lifecycle/regression evidence, not
visual or player acceptance evidence. The production page exposes no test controller.
