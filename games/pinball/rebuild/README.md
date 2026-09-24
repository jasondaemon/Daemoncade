# Midnight Run — 1.0.0-beta.1

Open `/games/pinball/` through the repository's HTTP server. The Pinball entry now opens Midnight Run beta. Install using `/games/pinball/app.html?install=1`; the existing game icon and immersive Home Screen wrapper are retained. This release contains one table, not the full planned multi-table collection.

## Included

- Three.js table hardware and reflective balls over original raster playfield art; reactive bumper lighting and animated 128×32 amber dot-matrix display.
- Rapier 3D fixed-step physics at 240 Hz, motorized flippers, raised ramp, shooter lane, bumpers, targets, scoop and drains.
- Three-ball games, ball save, three-lock multiball, jackpots, bonus multipliers, three missions, extra ball, nudge/tilt and unlimited practice.
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
```

The browser test needs Playwright (`PLAYWRIGHT_MODULE` can point to its entry module), Chrome, and a local server on port 4197. Its debug access is injected by the test response interceptor, not shipped by the game.

Validated five rule tests, 10,000 fast flipper-contact approaches, three ramp-entry speeds, and 30 simulated minutes of three-ball play with 21 drains and zero stuck-ball recoveries. Browser checks cover launch cancellation, simultaneous touches, focus-loss pause/audio suspension, locks/multiball, drains, results/restart and four viewport sizes. The soak is a simulation, not a real-device thermal/performance test.

## Before expanding or releasing stable

Playtest flipper feel, shot accessibility and drains on real iPhone and Android hardware. Measure sustained frame time/battery use; tune rather than assume desktop emulation represents phones. Validate accessibility and installed-app integration. Add authored music, more varied sound design and gamepad support. Build table selection and additional tables only after the first table's feel is approved. Advanced trapping/cradling/spin behavior is not yet calibrated to a real machine. No stable catalog/version/deployment change is included.

## Assets and dependencies

See [ART.md](ART.md) for the generated art prompt and source. Three.js and BufferGeometryUtils use the repository's existing MIT-licensed vendor copy. Rapier 0.17.3 is locally bundled with its Apache-2.0 notice in `vendor/RAPIER-LICENSE`. No commercial machine ROMs or third-party table artwork are included.
