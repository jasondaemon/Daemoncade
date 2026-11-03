# Garage and cosmetic progression integration

Isolated branch: `codex/apex-garage`, based on `ed4d5718747a8d17ea32a4e1ad01537ea2fded1a`.

## Modules

- `car-catalog.js` owns car, livery and achievement metadata. Only
  `formula-apex` has a ready race asset. CarConcept is license-verified but
  deliberately `pending-preparation`, so it cannot be selected yet.
- `garage-progression.js` owns schema-v1 storage, selection fallback,
  achievement calculation, deduplication and outcome validation.
- `race-outcome.js` is the narrow bridge from a real `RaceController` finish.
- `garage-preview-contract.js` defines the reusable 3D adapter boundary. The
  current garage uses a CSS fallback, allowing the race renderer to supply a
  Three.js adapter later without coupling progression to rendering.
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
   outcome)` and save the returned state. If the run becomes ineligible, call
   `recordInvalidatedRun` once so a clean streak cannot cross a practice run.
4. Surface `unlocked` IDs on the result panel, then link to `garage.html`.
5. At vehicle asset creation, call `resolveSelection(readGarage(localStorage))`.
   The current result always resolves to the existing F1 model; cosmetic
   palette application is renderer-specific and must not alter `vehicle-model`.

Do not award from replay import, test hooks, query parameters or raw PB values.
Only the outcome produced from the live production `RaceController` is valid.

## CarConcept asset checkpoint

Official source: Khronos glTF Sample Assets, CarConcept. License: CC BY 4.0,
Eric Chadwick / Darmstadt Graphics Group. The license explicitly excludes logos
and associated trademarks. The downloaded source is 11.78 MB, approximately
213k triangles, 97 meshes and 29 materials. It contains a license plate and
steering emblem plus a detailed interior. It is not committed or marked ready.

Before integration:

- remove Khronos/3D Commerce logo geometry and textures, not merely hide nodes;
- preserve the four wheel hierarchies and derive pivots from their bounds;
- create one optimized exterior race GLB and optionally retain a full showroom
  GLB; remove unseen interior/wipers from the race version;
- retain Carmine, Pearl and Graphite as material variants of one car;
- credit the original and describe Apex modifications alongside CC BY 4.0;
- inspect the modified pixels and measure triangles, draw calls and download
  size before changing `asset.status` to `ready`.

## Storage behavior

Garage state uses only `apex-run:garage:v1`. Existing PB, replay and settings
keys are never changed. Corrupt/denied storage falls back to the default F1 and
factory livery. Legacy selection keys are read but never deleted. Reset clears
only garage state.
