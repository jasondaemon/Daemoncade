# Local integration validation · 2026-11-11

The installed adventure has 264 areas: 30 preserved areas, 126 new overworld scenes and nine 12-room dungeon depths. The expansion contains 257 authored enemy spawns, 41 light/shade circuits and 86 reward definitions. All 234 added collision layouts differ. These counts describe content and do not establish quality or duration.

Command:

```sh
node --test games/lantern-vale/*.test.mjs games/lantern-vale/prototype/*.test.mjs games/lantern-vale/assets/gameplay/*.test.mjs games/lantern-vale/expansion/*.test.mjs
```

Result: 12 test files passed, zero failures, skips or cancellations. The original prototype and legacy assertion meanings remain intact. The runtime Image fixture uses the actual manifest dimensions; image dimension and decode rejection remain enforced.

`expansion/adventure.test.mjs` imports the same assembled adventure as the runtime. It starts fresh, walks the preserved three-heart campaign, earns and throws Sen’s sun-disc, reaches the original beacon, explicitly continues, completes all nine shipped dungeon depths, earns equipment/maps/rewards through interaction, solves actual control circuits, fights each boss during recovery, reloads refuge checkpoints and reaches the final resolution. It visits all 126 expanded overworld scenes and all 108 dungeon rooms through movement and public interaction. It never assigns player position, health, inventory, boss health, progression events or invulnerability. BFS chooses traversable paths using the actual player footprint; step handles collision and transitions. Test policy automatically strikes nearby ordinary enemies and drinks carried tonics when low. Separate tests retain wrong-orientation, interrupted-charge, reset/recovery, retreat, gate, encounter, migration, malformed-storage, input and asset checks.

Standalone command:

```sh
node games/lantern-vale/expansion/adventure.test.mjs
```

Recorded expanded simulation time: **2,130.4 seconds**, excluding the legacy portion. This is deterministic accelerated automation with known solutions, not a timed human play session. Human measured sessions: none. Human completion estimate: unavailable. Multi-day duration is unverified.

Syntax: all 23 game-local `.mjs` modules passed `node --check`. Source inspection covered expanded material/boss/NPC/scenery selection, shoreline masks, UI markup/styles, storage and input lifecycle. The actor asset sheet was inspected for silhouettes and poses; it is not a gameplay screenshot.

Integration corrections validated: shared story/dungeon assembly, equipment/seal vocabulary, matching regional consequences, all nine return stairs, expanded raster selection and six-seal HUD counting independent of depth memories. Expanded checkpoints preserve earned progression and boss health; existing version-1 migration and invalid/unavailable storage coverage remains active.

These are local source, rules, raster-integrity and fake-DOM adapter checks. No trusted deployment browser result for this revision was available during this integration. No real browser, screenshot, mobile, visual-quality, production-performance or multi-day playtime pass is claimed. Independent review and trusted deployment QA must assess a stable intended revision and actual gameplay. An earlier revision-gate mismatch established no gameplay result; no deployment gate or harness was changed.

## Source correction validation — 2026-11-11

Corrected both supplied major findings. The 27 regional circuits now execute nine regional rule sets: grow/bank roots, still currents before illuminating pages, aim opposing reflections, cool/reheat furnace shutters, carry a time-limited sheltered flame, thaw/freeze separate mirrors, operate ordered clock escapements and rest before winding, carry one voice per listener, and alternate an ordered color weave. Station progress, carrying reserves and clock rest survive checkpoints with bounded validation; older circuit records without these fields initialize safely and completed events remain completed. Source interaction and journal text explain the actual actions. Station labels show actions, readiness and dwell progress using existing local raster props. All legacy entrances, IDs, gates, optional chambers and ending are retained.

Expanded gameplay now calls the shared boss warning renderer. Tell previews cover the charge corridor, three projectile rays, expanding ring travel area, rotating beam sweep, full crossing lanes or hunt corridor/footprint. Strike warnings track the actual moving origin and attack timer. Warning shapes fill as a single translucent union so overlapping rays do not obscure gameplay through accumulated opacity. Game entry and changed cached module references use the alpha.6 query identity.

Validation actually run:

- Full documented `node --test games/lantern-vale/*.test.mjs games/lantern-vale/prototype/*.test.mjs games/lantern-vale/assets/gameplay/*.test.mjs games/lantern-vale/expansion/*.test.mjs`: **13 files passed**, zero failures, skips or cancellations.
- `node games/lantern-vale/expansion/adventure.test.mjs`: complete legacy route, all nine revised depths and expanded resolution passed. Measured expanded simulation: **2,226.4 seconds**. This supersedes the earlier simulation measurement above; it is accelerated known-solution automation, not human duration evidence.
- `node games/lantern-vale/runtime.test.mjs`: passed after the final import cache changes. The fake-DOM adapter additionally loads valid refuge checkpoints, walks with keyboard events into each of the nine actual arenas, and asserts tell/strike rendering for all six attack geometries. Fixtures supply gate-completion events; these arena samples are rendering checks, not independent campaign completion evidence.
- `renderer.test.mjs` samples damaging positions against warning geometry at multiple strike times, origins and directions. Regional rule tests exercise incorrect light/facing/order, expiry, reheating/melting, consumed voices, safe reset, checkpoint round trips and malformed state. Dungeon interruption tests now assert positive charge before interruption.
- `node --check` passed for all **26** game-local `.mjs` modules. Inspected changed Canvas/UI sources, regional labels, journal instructions, local asset identifiers and cache imports. No raster assets were generated or changed.

No trusted deployment browser QA was performed by this worker. Actual composition, warning readability, mobile layout and multi-day human duration remain unverified; no deployed pass or human completion estimate is claimed. All writes for this correction remain inside `games/lantern-vale/`; no dependency, service, security policy, infrastructure, launcher or publication change was made.

## Input and canvas correction — 2026-11-11

Addressed the supplied keyboard-release and blank-canvas findings in the browser adapter:

- Releasing the last keyboard or touch direction clears the walking pose immediately, including frames with no simulation step. Pause/menu/focus clearing also resets that pose. Movement still comes from the existing held-input sets and deterministic campaign step.
- The simulation initializes its clock from animation-frame timestamps, rather than mixing the initial `performance.now()` reading with the frame clock.
- Resize ignores unmeasurable stages and leaves unchanged backing dimensions alone. A real backing-size change paints immediately, and artwork decoding/retry completion also paints immediately. Canvas sizing no longer participates in the stage's intrinsic layout, avoiding resize feedback between its backing dimensions and the field.
- HTML references the corrected entry module and stylesheet with `0.3.0-alpha.7`. Campaign/content module identities and the restrictive CSP remain unchanged.

Actual validation:

- `node --test games/lantern-vale/*.test.mjs games/lantern-vale/prototype/*.test.mjs games/lantern-vale/assets/gameplay/*.test.mjs games/lantern-vale/expansion/*.test.mjs`: **13 files passed**, zero failures, skips or cancellations. Includes the complete legacy/expanded deterministic traversal, puzzles, encounters, migration and raster resolution checks.
- `node games/lantern-vale/runtime.test.mjs`: passed again after adding the final immediate-idle and artwork-completion assertions. The real adapter receives all four arrow keys and WASD through keydown/keyup, verifies movement while held and stationary rendered world positions after release, simultaneous keyboard/touch, pointer release/cancellation, focus loss, saves and all nine boss samples. Resize assertions verify no backing writes for unchanged geometry and immediate raster draw calls for changed geometry without executing an animation frame. The frame fixture starts at zero independently of the process clock.
- `node --check games/lantern-vale/game.mjs`: passed. Inspected the changed input/render/resize implementation, canvas CSS and HTML asset references. No raster assets changed.

These checks use the deterministic rules and fake DOM/Canvas adapter; they do not establish a Chromium or WebKit deployment pass or conclusively diagnose the remote screenshot failure. Trusted deployment QA must revalidate the intended correction revision. The supplied report's top-level SHA is `b08698801d080bc0b70a720d295451efc8c7987b`, while its tested commit and before/after markers are `8ba0b3d612bc5acec0b7900305c8019bb9f4f29f`; that report is not evidence for this corrected source. No harness, security policy, dependencies, services, shared files or other games were changed.
