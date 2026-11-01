# Apex Run development readiness

## Status

Version `0.4.0-alpha.7` is an early desktop-keyboard alpha under active handling revision. It
is an original single-player stadium time attack inspired by the broad genre, not a Trackmania
clone or formula-equivalent simulation. Earlier automated beta gates are retained below as
regression receipts; they did not establish human playability and no longer justify a beta label.

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

- Chrome/Playwright on Apple M1 Max using `ANGLE Metal Renderer: Apple M1 Max`.
- Exact runtime clean lap: 34.825 seconds, six ordered checkpoints, physical jump/landing,
  PB save, tick-zero replay, reload-visible moving/rotating ghost.
- Recovery-to-finish practice flow preserves the prior clean PB and ghost.
- Recorded identical inputs finish at 34.833/34.833/34.825 seconds under 30/60/144 FPS render
  schedules with zero recovery.
- A 600-second simulated drift/reset soak is accelerated test time, not ten real-time minutes.
  See the latest integration-test output for measured wall time and renderer counts.

No automated result is represented as a human-driven lap. Human keyboard feel remains the main
subjective beta feedback item. Touch, gamepad, multiplayer, editor, loops, and wall rides are
future work, not beta commitments. Software-renderer and low-end Windows laptop performance are
not yet characterized.

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
node games/apex-run/trajectory.test.mjs
node scripts/test-apex-run-beta.mjs
```

The browser integration requires installed Google Chrome and the repository's established
Playwright runtime path. It uses `games/apex-run/test.html`, which is not linked by or enabled in
the normal production entry. The production page exposes no test controller.
