# Racecar — Career release candidate

1.0.0-beta.2, build 41. Physical-device and human approval remain Stable release gates.

Build 41 adds a floating touch-steering ring: fixed touch-down center, 6px neutral
zone and 56–80px horizontal travel. Vertical movement is ignored. Amber indicates
the drift gesture; a purple pulse indicates active nitro. Releasing or cancelling
the touch clears the visual, as do pause/background transitions. The overlay never
intercepts input. Reduced effects disables its pulse animation.

Build 40 enlarges mobile showroom previews and thumbnails. The preview camera
fits actual vehicle geometry over a complete rotation, excluding fallback
exhaust/shadow geometry. Driving scale, handling and career saves are unchanged.

## Career

Five circuits, four sequential races per circuit, and 25 vehicles. Each difficulty
has an independent wallet and garage. Race placement, clean finishes, cash
pickups and championship prizes fund purchases and upgrades.

All twenty tracks have individually authored layouts. Sunshore keeps gentle
sweepers; Red Sands adds chicanes and hairpins; Pacific Coast adds headland
esses; Alpine Pass adds switchbacks; Midnight City adds technical block courses.
Geometry tests check closure, nonintersection, road clearance, and increasing
aggregate corner complexity. Career balances, ownership and progress are unchanged.

The title screen shows each difficulty's saved career progress. Start enters
the garage; difficulty can only be selected by returning to the title screen.
Select purchased circuits directly on the map. A single admission button shows
the next locked circuit, its price, and its qualification requirement.
Paint uses nine free swatches (including the car's factory finish), not an RGB picker.

Results render the actual cars on a gold/silver/bronze 3D podium. Championship
podiums use overall points; regular podiums use the race finishing order.
Payout details are expandable below the earnings summary. Music reuses the
existing Circuit Rush audio assets: Harbor Loop for Sunshore/Pacific Coast,
Sunscar for Red Sands, Alpine Crown for Alpine Pass, and Midnight Crown for
Midnight City, plus lobby and win/lose tracks. These shared files must remain
available under games/circuit-rush/assets when packaging Racecar.

Admission requires a podium in the preceding championship, all prior circuit
admissions, and a one-time payment. Earlier circuits remain replayable.
Available cars can be inspected without sufficient funds; future-circuit cars
are shown in grayscale. Paint is free. Engine, transmission, tires, brakes and
nitrous have three upgrade tiers.

Keyboard: W/Up accelerates, S/Down brakes, A/D or Left/Right steers, Space uses
installed nitrous, Shift drifts, P/Escape pauses. Dragging steers; on touch,
hold one finger to accelerate and steer, lift to brake, hold a second finger
to drift or tap it for a nitro burst. Losing focus pauses the game.

Manta ($240,000) and Visitor ($2,500,000) are original procedural hover models.
Visitor has perfect grip and unlimited nitro. At difficulty selection, the
Konami sequence permanently unlocks its $1 price in that career. UFO races
and code-enabled careers do not contribute to shared local high scores.

## Saves

racecar_careers_v1 stores independent careers. Settings use
racecar_career_preferences_v1. Legacy racecar_progress_v2 is never overwritten
or imported into the economy. Settings include backup export and restore.
Another tab updating the career during a race requires reload.

## Structure

- career.js: economy, ownership, upgrades, validation, championship settlement.
- career-ui.js: circuit map, car inspection, purchases, performance graphs.
- career-tracks.js and circuit.js: twenty closed layouts.
- rules.js: fixed-step driving simulation and swept collisions.
- world-track.js: immutable road geometry and chase-camera poses.
- view.js: locally vendored Three.js, previews, minimap and lighting.
- imported-vehicles.js and vehicle.js: mesh loading and wheel/body animation.
- environments.js: licensed nature props, terrain, water and layered skies.
- collectibles.js: additional cars and novelty side-grade specifications.
- game.js: input, results, persistence and the simulation driver.
- progress.js and championships.js: retained legacy helpers/regression tests.

## Assets

Seven Quaternius cars and sixteen Kenney vehicles, plus Kenney Nature Kit
props, are bundled with original CC0 licenses and source models. Originals
are not runtime downloads. No external CDN or runtime service is required.
See repository NOTICE.txt and the asset-folder READMEs.

Rebuild Quaternius: node scripts/build-racecar-models.mjs
Rebuild Kenney: python3 scripts/build-racecar-kenney.py SOURCE_DIRECTORY
Add the argument nature for Nature Kit models. Pillow is build-time only.
Conversion preserves independent wheels, grounds/orients models and bakes
palette gradients into a bounded set of draw groups.

## Verification

Run: node --test games/racecar/*.test.mjs

Two Playwright harnesses use an isolated Chromium context, not the user's
browser or saved careers:

- scripts/test-racecar-browser.mjs: previews, purchases, saves, full race and results.
- scripts/test-racecar-scenes.mjs: all environments, mobile UI and multitouch.

Set PLAYWRIGHT_MODULE to an installed Playwright index.mjs and CHROME_PATH
to Chrome/Chromium. Optional RACECAR_URL and QA_OUTPUT override defaults.
Default URL: http://127.0.0.1:4197/games/racecar/
Clock acceleration tests functionality, not performance.

Add ?profile=1 for live frame timing, long-frame counts, draw calls and triangles.
See CAREER-STATUS.md for current verification evidence and remaining gates.
