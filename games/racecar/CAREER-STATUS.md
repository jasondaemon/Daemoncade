# Career candidate status

## Delivered

- Separate fixed-difficulty careers; legacy save untouched.
- Five purchasable circuits, four sequential layouts each; saved standings.
- Strict ordered admission: preceding podium, all earlier circuits, and payment.
- Placement, clean-finish, pickup and championship rewards; idempotent settlement.
- Twenty-three cars with full previews, free paint and five upgrade categories.
- Future-circuit cars appear gray; available but unaffordable cars remain inspectable.
- Sixteen new CC0 vehicles include Formula, Vector, hot hatch, character kart,
  fire engine, refuse truck, tractors, haulers and van. Novelty vehicles are side-grades.
- Circuit map, track previews, mobile Circuit/Garage navigation, contextual
  purchase messages, instant results, reward breakdown and career-complete screen.
- Daytime beach/desert/coast/mountain and night city; licensed instanced nature
  models, water, distant terrain and track-clearance checks.
- Backup/restore, malformed-save validation, cross-tab protection, reduced effects.
- Bounded model draw groups and thumbnail cache; idle menus stop redrawing the world.

## Evidence

### Hover collectibles (revision 38)

- Manta: original magenta/gold sci-fi hover racer, $240,000, final-circuit access.
- Visitor: original saucer, $2,500,000, fastest base profile, perfect lateral
  response (steering and collisions still apply), built-in unlimited nitro.
- Both procedural models float above grounded shadows, bank and glow under
  boost; reduced motion keeps a steady hover. No tire particles or tire squeal.
- Difficulty-screen Konami code permanently stores a $1 Visitor discount in
  the selected career, bypassing its circuit lock but not granting money.
- Discount careers and UFO races skip shared score submissions; career economy
  and progression remain available. Existing saves restore without migration.
- 102 unit tests and an isolated browser code/reload/purchase/driving/preview
  test passed. Real-device and human balance/visual acceptance remain open.

### Gesture driving (revision 37)

- One captured touch steers relative to its starting position and accelerates;
  releasing it brakes. Buttons are hidden, with a touch-only playfield hint.
- Second touch held for 220ms drifts; a short stationary second-finger tap gives
  a one-second nitro request, subject to existing upgrade/reserve limits.
- Primary release, cancellation, pause and backgrounding clear transient input.
  Mouse/keyboard controls remain available. No changes to save data.
- Unit coverage includes pointer ownership, tap/hold distinction, expiry,
  release braking, cancellation and reset. Physical iOS/Android QA remains open.

### Tire audio and touch hardening (revision 36)

- Tire-slip audio combines filtered noise and a modulated squeal, responds to
  speed/steering, fades on release and disposes sources on pause/mute/stop.
- Captured drag steering ignores additional pointers; unrelated pointer-up
  events cannot cancel steering. Playfield selection/callouts are disabled.
- Gesture-only acceleration/brake/drift/nitro mapping is proposed, not shipped;
  existing touch buttons remain. Physical mobile testing is still required.

### Model definition pass (revision 35)

- Authored tapered/flared boat hulls, billowed mainsails and jibs, cockpit wells,
  glazing, gunwales, fenders, liferings and boom details replace primitive boats.
- Piers add plank joints, capped pilings and rails. Building assemblies add
  closed gables, ridge caps, siding, shutters, mullions, roof seams and steps.
- Regional details include striped café awnings, stools, tank bands/ladders,
  retro pumps, log trim, masonry chimneys, porch balusters and planter boxes.
- City blocks add cornices, side glazing, fire escapes and rooftop equipment.
- Materials/geometries remain instanced and disposed with scene changes.

### Circuit scenery (revision 34)

- Sunshore: shore-connected piers, moored sailboats, kiosks and small beach stops.
- Red Sands: service stations, roadside buildings and water tanks; canyon kept clear.
- Pacific Coast: cafes/rest areas complement the existing umbrellas and houses.
- Alpine Pass: lodges, chimneys, railings and layered pine clusters.
- Midnight City: secondary blocks, lit storefronts and parked cars.
- Added access paths and batched district details. All twenty layouts have
  deterministic, bounded placement checks; islands validate dry pier anchors
  and offshore moorings. Five scene rebuilds rendered without browser errors.
- 92 automated tests pass. Physical-device performance remains a release gate.

### Mainland coastline (revision 32)

- Pacific Coast now has one fixed western shoreline and an inland landmass,
  rather than an island outline offset from every bend of the circuit.
- Water position does not depend on car/track heading; coastline clearance is
  checked on all four layouts. Sunshore retains its original island setting.

### Corner-pace correction (revision 31)

- Verified the reported win occurred in a page loading revision 30, not an old
  preview. The previous conservative test driver overstated progression balance.
- Rival corner pace now progresses by circuit: .74, .82, .91, .94, .97.
  First-circuit behavior and player handling are unchanged.
- Added Normal Metro/engine-1 comparisons at .9 and 1.0 corner-speed multipliers
  and with no braking. No wins across four Pacific Coast tracks in each case.
  An aggressively driven Sprint/engine-1 can podium on all four layouts.
- 88 automated tests pass. Human balance feedback remains the acceptance gate.

### Career competition follow-up (revision 30)

- Career rivals now use the actual engine, acceleration, grip and brakes of
  their displayed car, with circuit-specific upgrades and difficulty pace.
  Removed the generic reduced career pace; opponents never scale to the player.
- Normal clean-driver comparison over all four Pacific Coast tracks: Metro
  with engine level 1 finishes fourth; Sprint with engine level 1 podiums.
  Stock Metro still podiums on all four opening tracks with the same driver.
- These are repeatable balance checks, not proof against exceptional human
  driving. Existing money, cars, admission and career progress are unchanged.

### Grip and drift follow-up (revision 29)

- Increased normal lateral grip from 15 to 28 handling units and tightened
  lateral response; neutral steering still does not follow the road.
- Hold Shift + steer for controlled drift: increased rotation, retained lateral
  momentum and speed scrub. Release blends back to normal grip.
- Drift is available without purchases or nitro reserve. Space remains nitro;
  touch controls include a separate Drift button.
- Added regressions for tight-bend grip, drift rotation/recovery and independent
  availability with an empty reserve and no nitro upgrade.

### Physics / surface pass (revision 28)

- Independent car heading and lateral momentum replace race lane-following.
  Neutral steering runs wide on bends; steering is grip-limited at speed.
- Drag input commands steering, not a target lane. Highway controls are unchanged.
- Shoulder slowdown, reduced off-road grip, barrier contact, wheel steering,
  body heading and camera look respond to the updated motion.
- World-space asphalt/terrain detail, gravel shoulders, supported guardrails,
  bounded dust/skid effects; reduced effects disables particles and skid marks.
- Corner-speed estimates set fixed track lap counts (independent of owned car),
  with rival corner pace and long-race timeout adjusted for braking.
- 81 automated tests pass, including actively driven career layouts, no-input
  corner departure, grip upgrades, brakes, wall penalties and no lane assist.
- Isolated Chromium: five environments and shaders, mobile simultaneous input,
  pause, and three garage views at four viewport sizes pass without errors.
- An isolated simulation/render integration completed a 50.6-second actively
  steered/braked lap without collisions; dust, skids and reduced effects passed.
  This is not a human handling evaluation or a full-UI results-flow test.
- The older full-UI race harness assumes lane-target steering and needs a new
  driving strategy before its end-to-end finish evidence can be renewed.

### Prior career evidence (before handling changes)

- 64 automated regression tests pass, including all 23 cars' grounded animated
  wheels, admission guards, economy target and twenty closed layouts.
- Isolated Chromium completed preview/purchase/upgrade/paint/difficulty/reload
  checks, followed by a 2:35 race, championship payout and garage continuation.
  Legacy sentinel preserved; no browser errors in the passing run.
- All five environments rendered; emulated mobile garage, simultaneous touch
  throttle/steering and pause passed without browser errors.
- Typical second-place rewards reach the first car in 5–8 races in a deterministic
  economy test. This is not a substitute for representative human sessions.

## Remaining Stable gates

- Physical iOS/Android audio, multitouch, orientation/fullscreen checks.
- Sustained frame-time and memory testing on midrange mobile hardware.
- Human handling, full-career economy and visual acceptance.
- Optional additional collectible sourcing: school bus, Beetle, dump truck and
  clown car are not claimed as delivered. Current models are generic and CC0.
- No production deployment has been performed.
