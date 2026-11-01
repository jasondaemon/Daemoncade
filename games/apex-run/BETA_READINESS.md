# Apex Run development readiness

## Status

Version `0.5.0-alpha.15` is a visual-course alpha candidate. The previously verified flat-course
beta remains available in Git history at `16a26e5`; its player-lap result must not be treated as
validation of this materially different spline layout. The game is an original single-player
stadium time attack inspired by the broad genre, not a Trackmania clone, formula-equivalent
simulation, or AAA-production claim.

Start a local preview from the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/games/apex-run/`.

## Controls and rules

- W/Up: throttle; S/Down: service brake. Release and press S/Down again after stopping to select reverse. A/D or Left/Right: steer.
- Space: drift/handbrake; Backspace: recover; R: restart; P/Escape: pause; M: mute.
- Checkpoints must be crossed in order. Recovery adds 1.5 seconds and makes the attempt a
  practice run: it can finish, but cannot earn a medal, PB, or ghost.
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
- A reactive keyboard-like source fixture completes all six ordered gates in 44.07 seconds
  without recovery at 30/60/144 render schedules. This is collision/determinism coverage, not a
  substitute for a screen-driven player lap. A separate held-input crest probe, rather than this
  route fixture, proves the airborne and landing phases.
- Production-page keyboard QA completed a no-recovery `1:42.583` Rookie-medal lap after a separate
  `1:57.500` recovery/practice lap. Restart, recovery eligibility, checkpoint order, finish and PB
  save all behaved correctly. The clean lap needed several deliberate reverse-and-steer escapes;
  direct rail contact still removes too much momentum even though it no longer traps the car.

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
multiplayer, editor, loops, and wall rides are future work, not beta commitments. Lower-end
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
node games/apex-run/route-guidance.test.mjs
node games/apex-run/play-area.test.mjs
node games/apex-run/handling-response.test.mjs
node games/apex-run/human-control.test.mjs
node games/apex-run/trajectory.test.mjs
node games/apex-run/track-geometry.test.mjs
node games/apex-run/rail-contact.test.mjs
```

The older browser integration requires installed Google Chrome and the repository's established
Playwright runtime path. It uses `games/apex-run/test.html`, which is not linked by or enabled in
the normal production entry. Its fixed route tape has not yet been promoted as visual-alpha
acceptance evidence. The production page exposes no test controller.
