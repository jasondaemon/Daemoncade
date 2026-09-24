# Midnight Run — 1.0.0-beta.3.1

Open `/games/pinball/` through the repository's HTTP server. The Pinball entry now opens Midnight Run beta. Install using `/games/pinball/app.html?install=1`; the existing game icon and immersive Home Screen wrapper are retained. This release contains one table, not the full planned multi-table collection.

## Included

Beta 3.1 removes full-side touch illumination and replaces the basic oscillator effects with layered procedural cabinet knocks, filtered noise impacts, inharmonic metallic chimes, spring/ramp rattles and speed-dependent rolling. A shared compressor, per-event cooldowns and a 48-layer ceiling bound multiball audio. No external audio files are used; phone-speaker balance still needs listening validation.

Beta 3 replaces the single loop with two shorter ramps, relocates the garage/target bank, adds a spinner, upper rollovers, four pop bumpers and a selectable challenge scoop. The LED display appears only during safe ball-held sequences. See [layout research and rationale](LAYOUT-NOTES.md).

- Three.js table hardware and reflective balls over original raster playfield art; reactive bumper lighting and animated 128×32 amber dot-matrix display.
- Rapier 3D fixed-step physics at 240 Hz, rounded kinematic flippers with contact-position-dependent arcade strokes, two raised ramps, shooter lane, bumpers, targets, scoops and drains. A physically successful ramp entrance transitions into a guided rail return, then releases the ball back into dynamic physics at the inlane; this is intentionally arcade-style, not a calibrated real-machine simulator.
- Three-ball games, ball save, three-lock multiball, jackpots, bonus multipliers, three missions, extra ball, nudge/tilt and unlimited practice.
- Three pit-stop challenges (ordered checkpoints, spinner hits, alternating ramps), a two-ball rollover award, opening garage targets, and illuminated shot arrows.
- Playfield-first phone framing, display transitions only without live balls, compact live awards, a fixed-view toggle and reduced-motion support.
- Independent multi-touch flippers, charge/release launch, upward flick nudge; explicit pause/resume and background audio suspension.
- Separate versioned score identity, responsive portrait/landscape UI, reduced-motion support and local dependencies.

## Controls

Left/right arrows or Z/M operate flippers. Hold/release Space to launch. Q/E nudge; Escape pauses. On touch screens, hold either half of the playfield independently for flippers, flick upward to nudge, and hold/release Launch. Fingers remain captured to their initial flipper even when crossing the center. Cancellation, lost capture, pause, orientation change and app suspension clear held controls. Gameplay surfaces suppress selection, callouts, context menus and pinch gestures; the rules dialog can still scroll.

## Validation, 2026-09-24

Run from the repository root:

```sh
node --test games/pinball/rebuild/rules.test.mjs
node scripts/test-pinball-physics.mjs
node scripts/test-pinball-preview.mjs
node scripts/test-pinball-app.mjs
node scripts/test-pinball-shots.mjs
node scripts/test-pinball-features.mjs
```

The browser test needs Playwright (`PLAYWRIGHT_MODULE` can point to its entry module), Chrome, and a local server on port 4197. Its debug access is injected by the test response interceptor, not shipped by the game.

Seven rule tests cover scoring, locks, missions, timed challenges, tilt and two-ball qualification. Shot tests sweep 38 flip timings from each inlane at three feed speeds (228 trials), requiring both sides to have usable timing windows, no surviving heel traps, and coverage of both ramps plus the spinner, garage, targets, bumper pocket, orbit and mode scoop. Physics tests also check 10,000 contacts, both ramp returns, and a 30-minute three-ball simulation with an explicit stuck-recovery limit. Browser checks cover controls, lifecycle, layouts, pit-stop selection and safe display choreography. Simulation and desktop mobile emulation do not replace real-device feel, thermal or battery testing.

## Before expanding or releasing stable

Playtest flipper feel, shot accessibility and drains on real iPhone and Android hardware. Measure sustained frame time/battery use; tune rather than assume desktop emulation represents phones. Validate accessibility and installed-app integration. Add authored music, more varied sound design and gamepad support. Build table selection and additional tables only after the first table's feel is approved. Advanced trapping/cradling/spin behavior is not yet calibrated to a real machine. No stable catalog/version/deployment change is included.

## Assets and dependencies

See [ART.md](ART.md) for the generated art prompt and source. Three.js and BufferGeometryUtils use the repository's existing MIT-licensed vendor copy. Rapier 0.17.3 is locally bundled with its Apache-2.0 notice in `vendor/RAPIER-LICENSE`. No commercial machine ROMs or third-party table artwork are included.
