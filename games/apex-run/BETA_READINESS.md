# Apex Run development readiness

## Status

Version `0.4.0-beta.1` is a scoped desktop-keyboard beta candidate. It is an original
single-player stadium time attack inspired by the broad genre, not a Trackmania clone,
formula-equivalent simulation, or AAA-production claim.

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

Known beta limits: the finish gate remains deliberately narrow, digital steering still benefits
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
node scripts/test-apex-run-beta.mjs
```

The browser integration requires installed Google Chrome and the repository's established
Playwright runtime path. It uses `games/apex-run/test.html`, which is not linked by or enabled in
the normal production entry. The production page exposes no test controller.
