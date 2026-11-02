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
