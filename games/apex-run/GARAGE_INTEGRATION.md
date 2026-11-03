# Garage and cosmetic progression integration

Isolated branch: `codex/apex-garage`, based on `ed4d5718747a8d17ea32a4e1ad01537ea2fded1a`.

## Modules

- `car-catalog.js` owns car, livery and achievement metadata. `formula-apex`
  and the prepared `car-concept` exterior are ready; both use identical race
  physics.
- `garage-progression.js` owns schema-v1 storage, selection fallback,
  achievement calculation, deduplication and outcome validation.
- `race-outcome.js` is the narrow bridge from a real `RaceController` finish.
- `garage-preview-contract.js` provides cancellation-safe asynchronous preview
  switching. `garage-three-preview.js` is the Three.js showroom implementation.
- `car-visual-adapter.js` prepares the same selected scene for showroom or race
  use, derives wheel pivots from loaded bounds and exposes chassis/wheel pose
  methods without touching `vehicle-model.js`.
- `garage.html`, `garage.css`, `garage.js` provide the standalone accessible
  garage. Arrow keys move between car/livery cards; native buttons, status
  announcements and a modal reset confirmation cover keyboard operation.

## Minimal race integration

1. Import `createRunId` and `raceOutcomeFromFinish`. Create one `runId` during
   each `restart`, before countdown. Never create a new ID inside `finish`.
2. In `finish`, after the race controller reaches `finished`, build the outcome:

   ```js
   const outcome=raceOutcomeFromFinish({
     race,
     trackId:activeTrack().id,
     splits:runSplits,
     runId,
     testMode,
   });
   ```

3. If `outcome` exists, call `recordRaceOutcome(readGarage(localStorage),
   outcome)` and save the returned state. Route every eligibility loss through
   `recordRaceEligibilityTransition(state,{eligible:false,reason})`; supported
   reasons are recovery, frame-gap, visibility, debug and practice. This one
   transition prevents a clean streak from crossing any invalid run.
4. Surface `unlocked` IDs on the result panel, then link to `garage.html`.
5. At vehicle asset creation, call `resolveSelection(readGarage(localStorage))`.
   Keep the existing authored Formula adapter for `formula-apex`. For
   `car-concept`, load its asset and pass the loaded scene and selected palette
   to `createRaceCarVisual`. Add `visual.root` to the scene, call
   `setChassisPose` once per render and call `setWheelState` from the same four
   Rapier wheel states already used by the F1. Do not alter `vehicle-model`.

Do not award from replay import, test hooks, query parameters or raw PB values.
Only the outcome produced from the live production `RaceController` is valid.

## Prepared CarConcept asset

Official source: Khronos glTF Sample Assets, CarConcept. License: CC BY 4.0,
Eric Chadwick / Darmstadt Graphics Group. The license explicitly excludes logos
and associated trademarks. `tools/prepare-car-concept.mjs` deterministically
creates a logo-clean showroom asset plus a reduced-detail `assets/car-concept-race.glb` from the official 11.78 MB source. It
removes the license plate, steering emblem, detailed interior, engine, wipers
and hidden hood pieces; unused binary buffers and logo textures are not copied.
The showroom is 8,318,184 bytes, 143,802 triangles and 58 primitives. The race LOD is 5,775,428 bytes, 73,531 triangles and 33 primitives; it removes high-cost rims, pads and minor trim while retaining tire, brake-disc and body silhouettes. The three source paint
variants become original Apex Cyan, Summit Gold and Midnight Grid liveries of
one car. See `assets/CAR-CONCEPT-NOTICE.md` for attribution and modifications.

At race load, `createRaceCarVisual` welds compatible static body geometry by
material and reduces each wheel to independently animated tire and hub batches.
The prepared GLB constructs as 16 visible race meshes (eight body, eight wheel)
instead of 37 fragmented meshes. This is a source-verified draw-object budget;
GPU frame timing still requires browser profiling on each quality tier.

Automated checks enforce the transfer/triangle/primitive budgets, excluded
trademark data, exact four authored wheel groups, valid accessor references and
variant names. The isolated IAB showroom regression loaded the actual GT with no
console warnings/errors, verified concentric wheel roll and front steering over
multiple rotations, exercised rapid car/livery switching, and measured 120
render frames at 16.7 ms median, 18.6 ms p95 and 18.7 ms p99 on the available
M1 Max browser context. This is a showroom sample, not a full-race or low-end GPU
budget. `garage-browser-test.html?car=gt` retains the visible regression.

Embedded GLB textures are decoded through browser blob URLs. The garage page
therefore adds `blob:` only to its own `img-src` and `connect-src`; the game CSP
and every other policy remain unchanged.

## Storage behavior

Garage state uses only `apex-run:garage:v1`. Existing PB, replay and settings
keys are never changed. Corrupt/denied storage falls back to the default F1 and
factory livery. A future schema is preserved and all writes/reset are blocked
with compatibility UI. Legacy selection keys are read once, never deleted and
marked migrated. Reset clears only garage state and reports storage failure
without pretending success.
