# Apex Run implementation plan

Original single-player stadium time attack inspired by the short-form, restart-heavy
structure of Trackmania. No Trackmania code, names, art, audio, or track layouts are used.

## Research decision

Trackmania's useful design target is not a checklist of stunts: Ubisoft describes short,
pick-up-and-play tracks as driving puzzles where momentum, angle, surface, jumps, and instant
restart matter. Its private tire and steering formulas are not available, so this project
targets the same readable time-attack loop with independently tuned physics rather than
claiming exact simulation parity.

| Candidate | License/status | Decision |
| --- | --- | --- |
| Three.js r185 | MIT; already vendored here | Use for WebGL rendering, cameras, lighting, and procedural geometry. |
| Rapier 3D | Apache-2.0; already vendored here | Use its supported ray-cast vehicle controller; it gives a physical chassis, suspension, contact, and tunable grip without fragile rigid wheel joints. |
| JoltPhysics.js | MIT | Strong fallback if Rapier cannot support future wall contact or loops; larger WASM/API integration is unnecessary for the first proof. |
| Trigger Rally | GPLv3 code with separately restricted content | Do not fork. Its assets/content are not a clean reusable foundation and its existing game architecture is broader than this slice. |
| Sketchbook / community vehicle demos | MIT or project-specific | Reference only. They illustrate controller patterns but are archived demos, not a maintained game foundation. |

Primary references:

- Ubisoft overview: https://news.ubisoft.com/en-us/article/31ZNGwlldXOtDzLdapSG3k/trackmania-defy-gravity-at-high-speeds-on-july-1
- Rapier vehicle controller: https://rapier.rs/docs/user_guides/javascript/vehicle_controller/
- Three.js Rapier vehicle example: https://threejs.org/examples/physics_rapier_vehicle_controller.html
- Three.js license: https://github.com/mrdoob/three.js/blob/dev/LICENSE
- Rapier license: https://github.com/dimforge/rapier/blob/master/LICENSE

## Milestone 1: physics proof

- Fixed 120 Hz simulation independent of render rate.
- Rapier ray-cast suspension on a dynamic chassis, with tunable engine, brake, steering,
  lateral grip, and aerodynamic downforce.
- One 35–60 second stadium course with a fast straight, technical bend, bank, jump,
  three ordered checkpoints, and a finish gate.
- Chase camera, timer, speedometer, instant full restart, checkpoint recovery, and local PB.
- Procedural geometry only; laptop-friendly WebGL rendering and quality scaling.

## Acceptance gates

1. Start, complete, restart, and checkpoint-recover loops work repeatedly without reload.
2. Checkpoints cannot be skipped and the finish does not count out of order.
3. Equivalent recorded input at 30/60/144 render FPS stays within 0.1 seconds and 0.5 m.
4. Car can jump under gravity, land on suspension, slide under excess lateral load, and
   lose speed off the racing surface.
5. Personal best persists locally; stored values are validated before use.
6. No runtime network requests; all engine and physics files are vendored in Daemoncade.

## Alpha 2 playable milestone

- Reworked the chassis ray origins, suspension travel, collision envelope, and braking split so the
  car can restart from rest, rotate through the technical corner, and recover cleanly.
- Removed a discontinuous elevated-road seam, retained a shallow physical bank, and rebuilt
  the jump as a continuous ramp with a suspension landing.
- Added four medal targets tuned to the current 12-second clean reference run and a
  non-colliding 30 Hz PB transform ghost. Replay JSON is versioned, bounds checked, length
  limited, and ignored when malformed. A newer scalar PB wins over an older replay, and
  storage denial cannot interrupt the finish screen.
- Added a real Rapier trajectory test that completes the ordered course at 30, 60, and 144
  render schedules without recovery, including airborne/landing and sub-0.1-second,
  sub-0.5-metre equivalence assertions. The reactive driver executes only on fixed ticks.
- Grass now cuts engine output, reduces wheel grip, and applies velocity-proportional drag so
  leaving the road has an immediate, measurable cost.

## Later milestones

- Gamepad/touch controls, audio, particles, and two more tracks.
- Loops or wall rides only after a dedicated contact/adhesion prototype proves predictable.

## Alpha 3 stadium rebuild

- Expanded the sprint into a six-gate, roughly 31-second reference route with a braking
  corner, technical hairpin, physical ramp and landing, north climb, long stadium straight,
  and final braking run. Medal targets now match the longer layout.
- Added continuous curbs and lane rhythm, corner instruction boards, start-grid markings,
  layered grandstands and roof lighting, plus distinct cyan checkpoint and gold finish arches.
- Rebuilt the car silhouette with side pods, floor, splitter, rear deck, diffuser, fin,
  illuminated lamps, alloy hubs, visible steering and wheel rotation.
- Added velocity-aware camera look, landing shake, handbrake smoke, and procedural engine and
  wind audio. Audio starts only after a driving input to respect browser autoplay policy.
- Versioned PB/replay storage again so ghosts from the shorter course cannot appear on the
  rebuilt layout. Fixed the vendored Rapier initialization wrapper's deprecation warning.
- Alpha 3.2 moved chassis creation, suspension, engine, braking, handbrake, grip, digital
  steering response, speed limiting, and grounded stability into `vehicle-model.js`, shared
  verbatim by runtime and trajectory tests. The reference lap now uses recorded keyboard-like
  on/off throttle, reverse/brake and tapped steering rather than easier harness-only forces.
- Lowered the physical center of mass, softened high-speed steering, added mild grounded roll
  damping and forgiving physical shoulders, and removed raised slab seams. The exact QA probe
  (2.1 seconds throttle, release, 0.9 seconds full right) remains upright and on the shoulder.
- The 60 FPS clean reference records every fixed-tick input and replays that identical tape at
  30, 60, and 144 FPS, so render-rate checks no longer use separate reactive driving runs.

## Beta 1 acceptance

- Track collider dimensions, checkpoint order, recovery transforms, and road classification
  now come from `track-model.js` in both the browser and trajectory tests.
- Focus loss and tab hiding pause the timer, stop the car, and clear held keys. P/Escape and
  visible Pause/Resume controls use the same path, while rapid restart resets the fixed stepper.
- Sound can be muted with M or the HUD button. The preference is storage-safe and applies to
  an already-running audio graph without recreating oscillators.
- Drift smoke remains capped and now disposes geometry/material resources as particles expire.
- Shared-vehicle tests measure the 58% off-road engine penalty, reduced grass grip, service
  braking, and rear handbrake grip/brake behavior.
- Road-to-grass power and grip now blend over a quarter-second instead of switching the whole
  car instantly at an axis-aligned boundary. A boundary regression caps the per-tick force step.
- Any recovery marks the attempt as a practice run, so a teleport can never create a PB or a
  desynchronized ghost. The finish dialog states this explicitly.
- Replay validation now requires normalized quaternions, tick zero, and a final tick matching
  the stored time. Finish persistence is exercised through save/read/reload and denied storage.
- Long animation-frame gaps pause and invalidate the competitive attempt instead of silently
  undercounting elapsed time. Five- and thirty-second gap classification is covered by tests.
- HUD writes occur at render cadence only when displayed values change. Camera smoothing,
  shake, and smoke use render delta; smoke is a fixed 28-mesh pool with no per-puff allocation.

Known beta limitations: keyboard is the supported control mode; no touch/gamepad UI is shown.
The finish remains narrow and digital steering still benefits from frequent correction. The
course and car are original procedural geometry, not production photoreal assets. Lower-end
laptop, software-renderer, and Windows performance remain uncharacterized.

## Visual alpha 14: spline, recovery and rail hardening

This milestone intentionally returns the release label to alpha while the new course earns
fresh player validation. It replaces the slab course rather than claiming the previous beta
evidence automatically applies to different geometry.

- One C1 Hermite route definition produces the centerline, variable road width, elevation,
  banking, minimap, route guidance and recovery tangents. `buildRoadMesh()` emits the indexed
  positions consumed by both Three.js and Rapier; there is no hidden flat road collider.
- The course has six visual beats: opening sweeper, banked climb, elevated technical section,
  west-straight crest jump, high return, and downhill finish. The current 243-sample mesh has
  1,936 triangles and approximately 19 metres of vertical range. A C2 crest profile and
  tangent-continuity regression replace the sharp Gaussian join in the first spline version.
- Alternating inset curbs, luminous rails, structural columns and footings make elevation and
  road edges readable. Continuous elliptical stadium tiers, banners, light masts and low-poly
  hills replace the previous horizon of repeated cuboids.
- The vehicle shell now uses a rounded capsule fuselage, tapered nose, rounded side pods and
  rear haunches while retaining the verified steering/rolling wheel hierarchy.
- At a 34 m/s approach, the crest regression records zero wheel contacts, then a sustained multi-wheel
  suspension landing on the same spline road. Recovery height and heading are sampled from the
  authored road, including pitch and bank, rather than copied from the former flat layout.
- Guidance arrows, minimap, ordered route projection, road occupancy and recovery poses all use
  the same sampled ribbon as rendering and collision. Altitude checks prevent the grass beneath
  an elevated section from inheriting road traction or satisfying an elevated checkpoint.
- A chase-camera obstruction ray shortens the camera boom before it enters the road or a support;
  road pitch contributes gently to look-ahead while the horizon remains mostly world-up.
- The center stripe is a welded ribbon sampled from the same cross-sections, not a second curve
  interpolation. Continuous rail collision follows both visible edges. The steepest crest grade
  is 17.5 degrees rather than 22.4, and drivetrain force rises from 3.6 to 4.8 kN so a recovery
  launch can climb from rest instead of stalling below the crest.
- Falling beneath an elevated deck while no wheel has valid road contact starts a 0.55-second
  recovery grace. Legitimate jumps and supported lower surfaces do not trigger it.
- Rail collision uses one continuous, chassis-height inner wall per side with no internal endcaps,
  horizontal top, or coplanar reverse faces. A stopped car therefore has no rail shelf on which
  its floor or suspension can settle, while the visible wall still exposes the full collider.
- Rapier collision groups keep those rails solid for the chassis but exclude them from suspension
  rays, so a wheel cannot reinterpret a rail top as paved ground. Both inner surfaces have
  consistent track-facing winding, explicit minimum-friction combination, and a rendered wall
  that exposes the collider's full profile instead of leaving an invisible wedge.
- The chassis collider keeps its original mass and outer envelope but now has rounded corners,
  so a glancing nose contact presents a separating normal instead of a square edge that can lock
  against the rail. Below 22 km/h, grounded throttle-plus-steer also applies local-axis tire scrub
  and yaw impulses; this models parking-speed steering that Rapier's rolling-only wheel rays do
  not generate, without reading track coordinates or changing the car pose.
- The rendered road keeps visible thickness, while Rapier suspension and chassis contact use its
  top ribbon only; vertical shoulder triangles can no longer masquerade as ground. Low-speed
  assistance requires wheel support or a measured upward road/terrain manifold, so it cannot fire
  at an unsupported jump apex. Reverse uses actual chassis speed for gear selection and a capped
  10 m/s gear with enough low-speed torque to retreat from the final rail.
Current visual-alpha evidence includes a 43.95-second no-recovery source fixture and screen-driven
no-recovery production-page laps. Alpha 16 adds a `2:22.725` PB-eligible run after a separate
recovery/practice finish; both disclose observation pauses and are not uninterrupted performance
claims. Incidence-aware probes show that genuinely shallow rail contact preserves tangential speed,
while direct impacts still require a physical stop/release/reverse escape. The environment remains
original procedural art rather than authored photogrammetry, and lower-end GPU performance remains
unmeasured.

### Alpha 24 road-surface repair

- The shared rendered/physical spline now uses 88 samples per control segment instead of 22.
  Measured adjacent surface-tangent change falls from a 12.39-degree maximum to 3.12 degrees,
  removing the coarse piecewise-planar wheel-normal transitions that made the car look as if it
  were traversing a rocky road. This changes geometry resolution, not suspension softness.
- The signature crest remains intentionally shaped: 30 and 34 m/s approaches across the center
  and both four-metre offsets become airborne and establish a stable landing; a 26 m/s approach
  remains grounded. Recovery-to-crest and rail-contact coverage use the same denser collider.
- Rendered top, underside, and edge-wall strips have separate vertices and normals. The former
  shared-vertex smoothing exposed every curved sidewall triangle as a sawtooth even though the
  physical collider was already top-only. Elevated piers now terminate at the deck underside and
  begin at terrain height instead of visibly floating below the road.
- The player-supplied replacement is salasilma13's CC-BY 4.0 Low Poly-F1 model from Sketchfab.
  Embedded GLB metadata, size, title, creator, license, source URL and four named tire nodes are
  regression-checked. The static source tires are removed from the body and repivoted copies use
  the established runtime steering, suspension and axle-roll hierarchy. Independent width, height
  and length scaling maps the authored axle centers/radius to the unchanged 3.00 m wheelbase,
  2.04 m track and 0.43 m tire radius without changing the collider or vehicle forces. Source
  materials are replaced by an original Apex cyan/gold/white/carbon livery; the ghost clones the
  same body and wheel geometry. Attribution and modification notes live beside the GLB.
- Asset fetch is restricted to the game's own origin. After explicit user approval the CSP changed
  only from `connect-src 'none'` to `connect-src 'self'`; wildcard and external destinations remain
  blocked, as do object embedding and external scripts.
- A non-production matched-input telemetry harness compares 22/44/88/176-step colliders at 120 Hz.
  It projects chassis motion into the interpolated road-normal frame, counts contact-loss ticks
  instead of filtering them out, excludes only the intentional crest, and compares common 20-metre
  arclength / 5 m/s bins only when both runs contribute at least 0.25 seconds. In seven covered bins,
  heave RMS falls from 0.080 to 0.059 m/s and mean pitch motion from 0.094 to 0.090; whole-probe
  chassis pitch RMS falls from 0.115 to 0.054
  rad/s and suspension-length velocity RMS from 0.448 to 0.366 m/s.
- The harness's `desiredCameraRoadVelocityRms` is only an unsmoothed geometric boom-point proxy. It
  is not the rendered chase camera and omits runtime interpolation, pitch comfort, shake and
  obstruction shortening. After explicit user approval, `test.html?renderTelemetry=1` can dynamically
  load a local-only recorder and run the real animation loop; normal production neither imports nor
  exposes it, and the recorder contains no transmission path. In an actual straight acceleration at
  38-55 km/h it recorded only fully supported render frames: road-normal body-clearance velocity was
  about 0.0002 m/s RMS, wheel-to-body render velocity about 0.001 m/s RMS, and normalized on-screen
  body velocity about 0.02/s RMS. The actual camera-to-body distance changed while accelerating because
  the authored boom length grows with speed; that is smooth camera coupling, not evidence of chassis
  heave. A second imperfect stop/restart sample preserved four contacts but includes control-transition
  spikes and is not used as the acceptance result.
- These render measurements show that the reported 38-55 km/h repeated body bounce is no longer
  reproduced after the 88-step road repair. No suspension, camera, or physics constants were changed
  to improve a metric. A normal-keyboard crest traversal was not completed in this bounded IAB run,
  so actual rendered jump telemetry remains unmeasured; the dedicated physical crest fixture still
  supplies the genuine airborne-and-landing regression rather than being relabeled as player proof.
- Isolated controls make the causal boundary explicit. A planar ribbon stays effectively motionless
  at every resolution. On the same smooth vertical curve, heave velocity falls 0.122 -> 0.033 ->
  0.010 -> 0.004 m/s for 22/44/88/176 samples. On the authored course, raw world-Y acceleration and
  facet-normal change rates remain mixed because they include banking/steering and more frequent
  small facet transitions; `FIX_INTERNAL_EDGES` produces byte-for-byte identical wheel-ray results.
  The repair is therefore a demonstrated reduction in road-relative heave, pitch and suspension
  chatter, not a claim that every acceleration statistic decreases.
- Physical rail collision stays at the full shared resolution, but decorative round rail tubes use
  490 longitudinal segments instead of 1,958. That reduces each tube from roughly 27,400 to 6,860
  triangles while preserving a denser visual curve than the pre-repair road.

## Beta browser integration

- `RaceController` is the single countdown, timer, ordered-checkpoint, pause, recovery-eligibility,
  and finish state machine used by the production game and tests.
- `test.html` is a separate, unlinked test entry. It enables a fixed-tick input provider only by
  setting `data-apex-test`; the production page has no query-string win or teleport shortcut.
- Playwright drives the exact browser Rapier world with the shared low-frequency keyboard-like
  lifecycle fixture, checks a clean finish, PB storage, tick-zero replay, reload-visible ghost, velocity-safe
  pause/resume, visibility-handler pause, and a real checkpoint-five recovery followed by normal
  steering/throttle to the finish. The practice result cannot replace the clean PB.
- The same Chrome test runs 600 simulated seconds of repeated full-throttle handbrake drift and
  restart cycles, asserts stable renderer resource counts after warm-up, keeps smoke at or below
  the 28-object pool, and rejects JavaScript, WebGL, console, or non-favicon HTTP errors. The
  fixture is lifecycle regression evidence, not player proof.
- These are accelerated simulated-time metrics, not a claim of 60 FPS over ten real minutes. The
  result is hardware/driver-specific; software-renderer performance remains unmeasured.
- A separate 240-frame normal-time production-page sample records median/p95/p99 rAF intervals.
  These are presentation intervals, not isolated GPU render-call timings or a portable laptop
  FPS guarantee. Current exact values are emitted by the integration run.

## Production vertical slice 1: competitive run feedback

- A fresh production load now waits in an explicit ready state instead of spending the countdown
  before the player has read the objective. The start card teaches the core controls, the unusual
  stop/release/repress reverse lifecycle, and the fact that recovery makes a run practice-only.
  Rapid restart and Race Again still go directly to the countdown.
- The existing validated PB replay is also the source of six checkpoint reference splits. Gate
  crossings show accessible ahead/behind feedback and the finish dialog lists every split plus the
  largest gain and loss. No second timing model or hand-authored sector data is introduced.
- Recovery changes the always-visible eligibility badge immediately. A persisted ghost toggle is
  available in the race UI; a scalar PB whose matching replay failed to save now suppresses the
  stale older ghost on reload.
- Checkpoint and finish cues are short-lived oscillators routed through the existing mute-safe
  WebAudio graph. They add event feedback without network audio, decoded assets, or a second audio
  lifecycle.

This is a production-direction milestone, not release certification. The authored start/finish
presentation, signature jump readability, impact/tire/landing audio, quality fallback, WebGL/WASM
failure state, broader input support and non-M1 performance coverage remain subsequent work.

## Production vertical slice 2: authored start and signature crest

- The authoritative road sample list now includes a straight 30-metre approach behind the timed
  start. Rendering, collision, center stripe, curbs and rails consume the same expanded list, while
  race timing, ordered route stages and PB semantics retain the original first racing sample.
- An always-visible start gantry and grid apron replace the abrupt grass-backed road edge seen in
  the prior chase view. This is a topology fix rather than disconnected decorative pavement.
- The crest is authored as a readable race beat with road-frame-aligned takeoff stripes, a commit
  board and landing markers. These visual cues use the same sampled surface pose as the physical
  road rather than an independently placed flat overlay.
- Physical jump coverage now spans three ordinary approach speeds and three lateral offsets. The
  matrix records the real threshold: 30 and 34 m/s launch and land; 26 m/s remains grounded but
  stable and on-road. The existing centered 34 m/s probe remains the dedicated airborne proof.
- A bounded landing cue reuses the existing mute-safe audio graph and fires only after a measured
  airborne phase followed by grounded contact with meaningful downward speed.

This milestone improves authored presentation and jump readability without changing the proven
vehicle tuning or timed racing line. Finish-area art, richer impact/tire audio, graceful renderer
failure, quality selection, broader input support and additional hardware coverage remain open.

## Production vertical slice 3: presentation and resilience

- The ready state now suppresses race HUD, navigation, quick actions and the persistent control
  strip, giving the objective and Start action a single visual hierarchy. Race telemetry returns
  for the countdown/run; the sector table stays confined to the result dialog.
- Persistent High/Low graphics modes affect real renderer work: Low caps pixel ratio at 1.0 and
  disables shadow maps, while High restores capped device resolution and shadows. This is a
  bounded fallback, not an automatic device benchmark or minimum-spec claim.
- Continuous seating bands and varied infield materials strengthen the stadium bowl; rounded
  distant masses replace the most obvious pyramid skyline. The finish gains a checkered identity,
  crest/landing markings fill more of the road width, and the ghost reuses the curved main body,
  nose and rear-deck geometry instead of rectangular proxy boxes.
- A separate CSP-compatible load guard converts module, WebGL and WASM startup failures into a
  readable retry state instead of leaving an indefinite `Building the stadium` overlay.

The exact physics, spline/collider, checkpoint and PB/replay semantics are unchanged. Audio mix
quality is still unverified by ear, and procedural art remains short of a fully authored asset
pipeline. Windows, lower-end GPU, touch and gamepad coverage remain future work.

## Production vertical slice 4: reliability and settings

- Result staging now removes all live race telemetry and controls behind the finish dialog.
- Pause is the safe in-session settings surface for quality, sound, ghost and a concise controls
  reminder. Focus stays in the modal, held driving keys are cleared and Escape resumes normally.
- The CSP-safe load guard listens for non-bubbling resource errors during capture and offers both
  a normal retry and a persisted Low-quality retry with concise diagnostics.
- WebGL context loss pauses and invalidates the active attempt. Restoration never silently resumes
  timing: the player must explicitly restart a clean run. Integration uses the browser's real
  `WEBGL_lose_context` extension and an actually aborted module request rather than synthetic calls.
- Failure and restoration overlays are modal, isolate the background with `inert`, focus their
  primary action and return keyboard focus to the race canvas after an explicit clean restart.
- Successful initialization fully hides the loading status from rendering and accessibility;
  failure handlers explicitly restore the same surface before applying dialog semantics.

This bounded patch does not alter course geometry, handling or art composition. The next visual
milestone must replace the generic ring/field/repeated-support language with a coherent authored
venue rather than accumulating more procedural primitives.

## Production vertical slice 5: Alpine motorsport pavilion

- Three distinct stepped grandstands with broad seat bands, recessed concourses, cantilever roofs
  and landscape gaps replace the continuous black/cyan stadium ring.
- An asymmetric sage terrain basin and slate rock/berm masses give the circuit a grounded venue;
  charcoal asphalt, warm concrete and restrained cyan timing accents establish clear hierarchy.
- Elevated road support changes from a forest of thin posts to fewer tapered octagonal piers with
  substantial caps. The start/sweeper view gains a recognizable pavilion landmark and open exit.
- The car adds a gold side livery and roll hoop visible from chase view. Finish checkers and the
  matching curved ghost remain, while the crest sign is reduced to a compact roadside marker.
- This pass removes scene repetition rather than adding a downloaded asset pack. It uses original
  procedural geometry only; no network runtime assets or additional libraries are introduced.

The shared spline, collision, guidance, handling and timing models are unchanged. Actual visual
inspection covers start and opening sweeper; climb, crest, return and finish still need independent
hero-view review. Audible mix and non-M1 hardware remain unverified.

## Production vertical slice 6: grounded pavilion template

- Each grandstand now has a continuous foundation plinth and service apron meeting the terrain,
  substantial end walls, recessed access, aligned columns and diagonal canopy braces.
- Seating retains a raked stepped profile but adds pale stair aisles, restrained crowd-color bands
  and a deep fascia that visually connects the cantilever roof to its structural frame.
- The same template is reused at three scales/orientations, avoiding unrelated ornament while
  preserving distinct venue landmarks. Physics and road collision remain untouched.
- The ghost adds side pods, rear wing and roll hoop so its chase-view silhouette now follows the
  most recognizable player-car additions without duplicating opaque detail.

The richer architecture increases warmed renderer geometries from 266 to 340 while staying stable
through the accelerated soak; frame intervals remain unchanged on the sole measured M1 Max. Finish,
climb, crest and return hero views still require independent pixel review before visual acceptance.

## Production vertical slice 7: Formula car and spline-width sectors

- Vehicle visuals are isolated in `formula-car.js` and preserve the established +X-forward,
  +Y-up, +Z-axle coordinate convention. The procedural model is fitted to the verified 3.0 m
  wheelbase / 2.04 m track without altering Rapier chassis, wheel or handling parameters.
- Four authored landmarks replace six frequent legacy checkpoints. Detection, gate art, HUD,
  minimap, guidance, recovery, replay splits and finish semantics share the same layout.
- Gate posts are offset beyond the sampled road half-width. Crossbeams and triggers use the road's
  full tangent/lateral/up frame, including pitch and bank, rather than yaw-only world rectangles.
- PB and replay storage keys are versioned forward because the sector split model changed.

## Production vertical slice 8: driving data and support clearance

- The focused Settings surface now owns graphics, sound, ghost and an optional persistent Driving
  Data panel. Opening it clears held input and pauses an active run; the race HUD stays compact.
- Driving Data is off by default and reports smoothed occupant-frame longitudinal/lateral specific
  force in standard Earth G, slip angle and suspension contact count. Derivative history resets on
  pause, restart and recovery so those lifecycle transitions cannot manufacture a displayed spike.
- Every elevated-road cap now derives its top from the lowest nearby sampled deck underside, with
  an explicit clearance margin. The fix is visual-only: supports remain outside vehicle collision.
- Rollover probes cover both candidate third-turn sectors, both steering directions and 60/80/100
  km/h. They distinguish tire cornering before guardrail contact from collision response and retain
  the established grip, suspension, mass and free-flight behavior because the current shared model
  does not reproduce a pre-contact traction rollover.

This pass does not claim that every player collision is rollover-proof. A repeatable production
input trace that overturns the car remains the required evidence for a broader handling retune;
the genuine crest jump, rail glancing/escape behavior and recovery lifecycle stay protected.

## Track platform 1: catalog and fully 3D frames

- `track-catalog.js` establishes stable track IDs, display metadata and per-track PB/replay storage
  contracts. Alpine Sprint deliberately keeps its existing v9/v10 keys, so the architecture change
  does not discard current player history; future layouts receive isolated namespaced keys.
- Result persistence accepts an explicit track key pair. A regression saves a second hypothetical
  track and proves it cannot overwrite Alpine Sprint's PB or ghost.
- `track-frame.js` provides rotation-minimizing 3D frames and cross-sections. Unlike the current
  XZ/world-up construction, it remains defined through vertical and inverted tangents and applies
  authored roll without accumulating twist.
- The isolated geometry proof transports 129 samples around a complete vertical circle, reaches an
  inverted local up vector at the apex, retains an orthonormal right-handed basis and closes without
  a lateral-frame flip.

This is foundation only. Alpine Sprint rendering and physics remain unchanged. A loop is not a
playable feature until a separate Rapier proof demonstrates genuine world gravity, wheel contact,
an attainable entry-speed window, an unsupported slow-entry fall, camera behavior and safe recovery.

### Loop feasibility result

An isolated teardrop-loop lab used the production 120 Hz Rapier chassis, world gravity, drivetrain,
suspension and transported road frames. The chassis did become genuinely inverted and one 34 m/s
run retained three apex contacts, while slow entries detached or rolled back without assistance.
However, adjacent 30–38 m/s runs were not robust: several lost all apex contact or fell from the
descending branch, and none produced a repeatable clean exit. That experiment is intentionally not
shipped as a passing test or production stunt. The next loop milestone must solve authored entry /
exit separation and supported descent across a speed window without magnetic forces, pose clamps or
teleporting; otherwise loops remain out of the playable catalog.

## Alpha 31 — Summit Circuit

- The catalog now registers two real runtime courses. Alpine Sprint keeps its original geometry and
  `v9` / `v10` PB and replay keys; Summit Circuit uses isolated per-track storage so records and
  sector splits cannot be compared across layouts.
- The ready screen selects a course through the URL-backed catalog. Track construction, gates,
  minimap bounds, route stages, recoveries, render mesh, Rapier surface and rails all consume the
  same selected definition.
- Summit Circuit is a 3,308 m advanced route across its own 1,040 × 900 m landscape, with six
  landmark sectors, linked banked sweepers, an elevated crest and a technical return. The venue and
  three grandstands derive from the selected track rather than the compact Alpine bowl. Automated
  swept-clearance checks reserve the full road, rail and chase-camera corridor around every stand;
  nonadjacent road approaches require more than 13.5 m vertical clearance. The shared fixed-input
  physics fixture completes it in 131.88 seconds at 30, 60 and 144 render Hz without recovery. This is deterministic drivability
  evidence, not a human-play claim.
- A separated-entry loop lab measured repeated suspension-force saturation and contact loss around
  24–32% of the ascent even after an isolated higher-force comparison. Removing the lateral
  separation was rejected because it would reintroduce overlapping entry/exit geometry. No loop or
  physics retune ships in Alpha 31; the next lab needs a non-overlapping transition whose chassis
  attitude follows the transported road frame across a real speed/offset window.

## Alpha 33 — Summit flow, stable shadows and long replays

- Summit Circuit now spans 3,529 m. Its opening sectors add linked bank and elevation changes,
  while the gate-five-to-finish sector replaces the hidden 24.6 m-radius trap with a readable
  sequence whose minimum sampled radius is 56.5 m. The shared-physics driver completes all six
  gates at 30, 60 and 144 render Hz in 144.608 seconds without recovery and remains above 23.7 m/s
  after gate five. This is deterministic drivability evidence, not an uninterrupted human lap.
- Summit PB records advance to isolated v2 keys because its route and split timing changed. Replay
  storage advances independently to v3 and records at 15 Hz for up to 15 minutes, so an eligible
  long player lap cannot save a PB while silently losing its ghost. Its
  provisional medal targets are 1:45 / 2:10 / 2:35 / 3:00 / 3:30; these deliberately generous
  baselines still need calibration from ordinary uninterrupted player sessions.
- High, Medium and Low now control real render cost: pixel ratio, shadow-map resolution, local
  shadow extent, rail tessellation and scenery density. All tiers retain shadows. A fixed-direction
  sun follows the car in a light-space, texel-snapped window, avoiding the previous route boundary
  where road and contact shadows abruptly vanished. Route-wide tests keep the car and nearby road
  inside that local volume at every quality level.
- Crossing validation compares the complete banked upper-deck underside against the lower route's
  rail-top envelope; the closest authored crossing retains 14.4 m clearance. Venue stands remain
  outside the swept road, rail and chase-camera corridor.
- The start gantry sits on the straight apron behind the timed spawn and uses the same road frame.
  Summit's 40 m beam no longer fills the chase view or visually cuts the first bend; road, collider,
  lane stripe and rails remain one continuous spline.

No loop is shipped in Alpha 33. A branch/merge and intentional obstacle complex are the next
content milestone; the loop remains gated on repeatable physical entry, descent and exit without
magnetic adhesion or pose correction.

## Alpha 34 — Summit route choice and obstacle line

- Summit's fourth sector now has a declared split/merge graph. The 488.4 m cyan outside road is
  wide and unobstructed; the 463.2 m gold inside road trades 25.2 m of distance for three offset
  physical columns. Both roads use the same render, top-surface collision, rail, occupancy and
  road-frame recovery construction, then cross the same ordered gate at the common merge.
- The branch is shown on the minimap and receives a compact direction cue only within 110 m of the
  real split. No general-purpose breadcrumbs or instructional boards were restored. A cross-country
  chord between entry and merge cannot advance the shared gate.
- The user-supplied Kenney Racing Kit 1.2 archive contributes a covered stand, pit office and
  red/white obstacle barriers. Only the selected glTF/BIN pairs ship; their CC0 license, source,
  archive hash and modification notes live beside the assets.
- Summit records advance to PB v3 / replay v4 so older results are not compared to a materially
  different route graph. Direct production-control probes traversed both branches with four wheel
  contacts and advanced the common gate; this is branch playability evidence, not a full human lap.

No loop is shipped in Alpha 34. The separate physics lab has demonstrated genuine inverted
suspension contact on a small loop, but entry/exit topology still needs a continuous,
non-overlapping proof before it can become production course geometry.
