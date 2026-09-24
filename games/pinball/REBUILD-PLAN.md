# Pinball: multi-table arcade rebuild

Status: first-table beta 1.0.0-beta.1 prepared on 2026-09-24 in `rebuild/`, with the main Pinball entry routed to it at the user's request. See its README for validation and remaining gates. The original implementation remains in Git and unused legacy files. The beta uses native JavaScript modules; TypeScript/build tooling remains a follow-up decision before expanding the table library.

## Decision

Rebuild gameplay, presentation, controls, and table definitions. Retain the game identity, installed-app wrapper, and the shared score-storage integration behind a new table-aware adapter. Build an original, mobile-first arcade pinball collection, not a player for copyrighted commercial machine ROMs.

Proposed stack: TypeScript, Three.js with WebGL2, Rapier 3D physics through its JavaScript/WASM bindings, Web Audio, and a lightweight DOM menu/HUD. Build into self-hosted static files compatible with the existing publisher. No new runtime server, Flutter runtime, Unity export, or mandatory WebGPU.

The engine selection is a recommendation, not a claim that pinball feel comes out of the box. A short physics validation milestone precedes commitment to table art. If Rapier cannot meet the flipper/collision/mobile acceptance tests after bounded tuning, evaluate modern Planck with a layered 2.5D table before expanding content. Do not maintain two shipping physics engines.

## Audit of the existing game

Reviewed the entire 600-line game.js, launch/bootstrap/CSS, score adapter, and metadata; launched and exercised keyboard controls in an isolated Chrome session.

- Existing metadata is 0.1.0-alpha.1. Its description promises multiball, but implementation has a single ball reference and no multiball state.
- Uses vendored Planck 0.3.0. The underlying engine approach is reasonable; this implementation does not demonstrate its limits.
- Launch test: the ball travels within the shooter lane, returns to its base, and settles without reaching the playfield or scoring. The shooter/table collision layout needs replacement.
- In begin-contact, `other` is selected as the non-ball fixture; the subsequent sensor branch requires `other === ballFixture`. Therefore lane and drain logic cannot execute for normal ball/sensor contacts (game.js around lines 262–283).
- No touch controls, audio system, nudge/tilt, authored missions, target banks, ramps, locks, or table catalog.
- Shared createScoreOverlay is currently a no-op. The game has no actual results/leaderboard presentation through that adapter. Existing score retrieval also needs table/mode filtering before reuse.
- No app-background pause handling or input-release safety. Renderer redraws shadow-heavy Canvas art at uncapped device pixel ratio. Fixed-step physics is a good concept worth retaining, not this whole loop.

Keep: app identity/wrapper, catalog plumbing, score-recording interface. Replace: table geometry, rules, ball lifecycle, rendering, UI, input, audio. Preserve the old implementation in Git history rather than building a second legacy runtime.

## Open-source evaluation

| Project | Findings | Intended use |
| --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | MIT; web 3D rendering library | Recommended renderer; pin a tested version and retain notices. |
| [Rapier](https://github.com/dimforge/rapier) | Apache-2.0; 2D/3D physics, JS/WASM bindings | Recommended 3D physics candidate, subject to the test gate below. |
| [Planck](https://github.com/piqnt/planck.js) | Current repository uses MIT and includes a [pinball example](https://github.com/piqnt/planck.js/blob/master/example/Pinball.ts) | Credible lower-complexity fallback; not rejected because our old game is broken. |
| [Flutter I/O Pinball](https://github.com/flutter-team-archive/pinball) | MIT; mobile/desktop web showcase, now archived; Flutter/Firebase stack | Reference for polish and component design. Do not migrate the arcade to Flutter or reuse branded assets without separate review. |
| [Mission Pinball Framework](https://github.com/missionpinball/mpf) | MIT; controls real machines rather than supplying browser physics | Reference for modes, devices, ball management and [multiball behavior](https://missionpinball.org/latest/game_logic/multiballs/). Implement a small browser-native rule system rather than porting MPF. |
| [VPX-JS](https://github.com/vpdb/vpx-js) | README calls it a library, not a ready-to-use game; limited scripting and GPLv2 licensing declaration | Not the proposed foundation. Any copying would require checking exact file licenses and compatibility. |
| [vpinball-web](https://github.com/kalexis1994/vpinball-web) | Rust/WASM port aimed at VPX/ROM playback; project ships no tables or ROMs; published missing-work document | Interesting reference, but adoption would turn this into an emulator integration and content-rights project. Not independently benchmarked here. |
| [Visual Pinball](https://github.com/vpinball/vpinball) | Mature simulator/editor; [license file](https://github.com/vpinball/vpinball/blob/master/LICENSE) describes GPLv3+ migration with remaining legacy restrictions | Reference for pinball behavior; not blanket permission to import its code, tables, or assets. |
| [SpaceCadetPinball](https://github.com/k4zmu2a/SpaceCadetPinball) | Reverse-engineered game; original resources explicitly not included | Not a clean source of original redistributable tables. |
| [Pinball Schminball](https://github.com/igorski/pinball-schminball) | Useful browser table/actor definitions; no clear project license found in inspected root/README/package metadata | Architectural reference only unless reuse permission is established. |

Engine code licenses do not grant rights to third-party table art, music, branding, or ROMs. Track every adopted component and asset with source, license, attribution, modification, and redistribution terms. Prefer original models/art plus clearly licensed CC0/CC-BY assets. Keep editable source assets in the OSS project.

## Technical architecture

- Physics: tilted physical playfield, convex moving flippers, motor torque/return/hold tuning, ball CCD, simple collision proxies separate from decorative meshes. Ramps and upper playfields have actual height and collision geometry.
- Start with a fixed 240 Hz simulation and interpolated rendering; validate cost and feel before freezing the rate. Quality settings change rendering, not ranked physics. Bound catch-up and pause safely after prolonged suspension rather than simulating a backlog.
- [Rapier CCD](https://rapier.rs/docs/user_guides/javascript/rigid_body_ccd/) includes rotational motion; it is a tool, not proof against tunneling. Stress-test fast balls against moving flippers and thin rails. [Motorized joints](https://rapier.rs/docs/user_guides/javascript/joints/) need pinball-specific tuning.
- Author tables as separate typed definitions: geometry, devices, shots, rules, lamp sequences, audio cues, and assets. Stable IDs connect scoring sensors, lamps, and visible art. Validate missing references and contradictory modes at build time.
- Rules use simulation-time events and explicit states. Queue body creation/removal after physics steps. Separate active balls, locked balls, trough inventory, balls remaining, and multiball saves. A drain during multiball is not automatically the end of a turn.
- Table tools: collider overlays, place-ball/shot fixtures, slow motion, switch/event log, lamp test, stuck-ball detection, and replayable input fixtures. These are developer tools, not a public editor in v1.
- Local score boards keyed by table, rules version, mode, and assistance. Never combine unlike scoring systems. Defer public competitive rankings until score validation exists.
- Audit deployment CSP/MIME support for local WASM, assets, and audio; keep dependencies self-hosted and versioned. Preserve installed-app entry URLs. Add pause/audio suspension, explicit resume, context-loss recovery, save schema versioning, and backup/export.

## Pinball essentials for v1

Three balls per game; variable-strength plunger and skill shot; accurate left/right flippers; rollovers with lane changing; pop bumpers and slingshots; stand-up/drop targets; spinners; inlanes/outlanes; loops and ramps; scoops/kickers; ball save; bonus and multiplier; extra ball; nudge with tilt warnings/penalty; staged objectives; lock qualification; three-ball multiball; jackpots/super jackpot; ball search/recovery; end-of-ball tally and proper results.

Every table gets an approachable scoring loop, three understandable missions, one signature toy, and a final wizard mode (the reward for completing its main objectives). Light the next useful shots and display one concise current objective. The collection supports these devices; individual tables use the subset that fits their layout.

Physics should feel weighty and learnable, with catches, aimed shots and flipper transfers, but we should not promise competition-grade simulation of every real-world technique. Practice mode can include ball return/slow motion and must use separate scores.

## Three-table launch proposal

1. **Midnight Run:** accessible street-racing table. Flowing outer orbits, crossed highway ramps, gear-shift target bank, garage lock and three-ball pursuit multiball. Completing laps raises jackpot value. A physically animated junction changes which ramp feeds the garage, with clear advance indication.
2. **Cosmic Salvage:** medium difficulty. Upper mini-playfield, docking scoop, orbit spinner, magnetic capture toy, reactor target banks. Rescue three probes to launch multiball. A clearly marked portal sends the ball to an alternate upper-playfield exit; a brief low-gravity mode affects only that chamber.
3. **Midnight Carnival:** technical layout. Third flipper, target-driven midway games, ferris-wheel ball lock, moving haunted-house entrance, three-ball midnight finale. Completing attractions transforms a contained upper section, not the player's flipper area.

Names/themes are working proposals. These must differ in shot geometry, tempo, objectives and sounds—not only background art. Build Midnight Run first; create the other two only after the first proves fun on a phone.

Distinctive features should be earned and readable, not random punishment. Portals, a magnet toy, transforming upper playfield and persistent table-specific missions are strong candidates. Later additions could include cooperative alternating-player objectives, a linked-table expedition, or daily challenges. Avoid ball-obscuring particles, camera cuts during live play, permanent stat upgrades, and gameplay purchases.

## Presentation and mobile interaction

Look like a crafted machine: illustrated playfield, beveled rails, layered plastics, translucent ramps, rubber rings, animated mechanisms, readable inserts and reflective steel balls. Use 3D for geometry/motion and raster textures for illustration, labels and baked lighting. Start art only after shot paths settle.

User-confirmed visual priorities: substantial improvement over the current bare-line prototype; combine raster imagery with vector-style graphics, responsive bumper lighting and a retro animated LED/dot-matrix display. Treat these as core acceptance criteria, not stretch polish.

### Hybrid art pipeline

- Raster: original high-quality table illustration, backglass art, themed character/toy textures, subtle wear and baked illumination. Keep collision regions clear and text separate so the illustration cannot obscure aiming.
- Vector/geometry: precise outlines, arrows, lane markings, target labels, lamp inserts and UI. Reuse SVG/design paths to generate meshes or texture atlases at build time; do not animate hundreds of DOM/SVG nodes during play.
- Moving elements: physically aligned 3D ball, flippers, gates, ramps and toys. The art direction is hybrid; the purpose of 3D is coherent depth, ball height and moving mechanisms, not a requirement to model every painted detail.
- Bumper contact: quick cap/ring motion, a roughly 100–180 ms local light pulse, a restrained halo and a synchronized impact sound. Different devices get different responses: slingshot rubber snap, target depression, rollover insert blink, scoop/lock light chase. Visual animation never changes collision geometry accidentally.
- Author a shared table coordinate system and preview art with the collider overlay so painted lanes, physical rails and scoring switches line up. Produce one small finished art section before committing to a whole table.

### Retro LED / dot-matrix display

Use a real low-resolution animated display rendered into a reusable texture: initially 128×32 logical dots, with an optional larger logical format if text/readability testing warrants it. Draw pixel sprites, bitmap lettering and deliberate dark gaps between amber/orange dots; use a subtle emissive surround rather than blurred ordinary text or a prerecorded background video.

Build event-driven sequences for attract mode, ball number, skill shot, target-bank completion, mission progress, lock 1/2/3, MULTIBALL, JACKPOT, SUPER JACKPOT, extra ball, tilt warning and bonus count-up. Include themed animations: a racing car crossing the finish, a salvage ship collecting a probe, a carnival wheel awarding a prize. Brief bumper scoring can tick the score; every routine hit must not restart a celebration.

Use a priority queue and coalescing: tilt/ball-save warnings outrank celebrations, repeated scoring aggregates, and expired queued events are dropped. The score and current objective remain accessible in a small secondary HUD when an animation occupies the main display. Gameplay never pauses for a display sequence. A reduced-motion mode uses still frames and short transitions.

On desktop, put the display in a modeled backbox or a side panel when that preserves table size. On portrait phones, dock a compact display above the table in the safe area; do not shrink the ball/flippers to make room for a decorative full cabinet. Animate display content at 15–30 fps, independently from 60 fps rendering and fixed-rate physics, and upload only when content changes. Test legibility at actual phone size.

The first finished-table review must demonstrate both visual quality and live responsiveness: a moving ball, flipper contact, several bumper hits, an earned multiball launch, and an animated jackpot sequence. A static beauty render alone does not pass.

Use stable cabinet/overhead cameras with the lower playfield always visible. Three simultaneous balls must remain readable. Prefer baked shadows/environment reflections with restrained live lights; do not add a real-time shadow light for every lamp. Cap pixel ratio, pool effects/audio, instance repeated parts, lazily load one table, dispose resources when switching, and disable heavy postprocessing on mobile.

Touch: independent left/right thumb zones with simultaneous multitouch and pointer capture, outside the critical ball path. Plunger pull/release in the shooter area before launch. Prototype an upward thumb flick for nudge, with a compact optional dedicated control if it conflicts with flipper holding. Keyboard and gamepad mappings are also first-class. Prevent page gestures only within the play surface; release controls on cancel, blur, pause and app suspension.

Audio is part of game feel: separate flipper/return knocks, rolling/material sounds, bumper impacts, scoop/lock sounds, escalating multiball music and short callouts. Pool voices, limit concurrency and stop all audio when backgrounded. Reduced-flash mode changes presentation without changing physics.

## Delivery gates

1. **Physics proof:** neutral test table, chargeable plunger, both flippers, one ramp, a scoop, drain, touch controls and three balls. Test consistent aimed shots, cradling, transfers, collision containment, simultaneous drains, and pause/resume. Exit only when it feels good without effects.
2. **One complete table:** finished Midnight Run layout, full ball lifecycle, missions, multiball/jackpots, results, sound and final-quality art. User playtest here before multiplying tables.
3. **Collection:** add the two distinct layouts, table carousel, tutorials/rule cards, mastery badges and per-table records. Unlock optional cosmetics/challenges through mastery; ordinary access must not require repetitive currency grinding. Exact table-unlock policy is a product choice, not a hidden implementation assumption.
4. **Release hardening:** real iPhone installed-app test, Safari/Chrome/Firefox desktop, Android test via available device service/tester, GPU context recovery, background music checks, restore/restart, score isolation, license inventory and long-run profiling. Keep current alpha deployed until the replacement passes; no automatic stable promotion.

Proposed measurable gates: target sustained 60 fps on the chosen mobile baseline with three balls; inspect 95th-percentile frame time and input response, not just average fps. Run at least 10,000 high-speed collision fixtures, a 30-minute multiball soak, 100 table switches without continuing memory growth, ball-save/lock/extra-ball accounting tests, and low/high-refresh-rate shot comparisons. Record actual device results. CPU throttling or desktop touch emulation does not substitute for real iOS/Android validation.

**First deliverable:** one trustworthy, touch-playable pinball mechanism and one convincing finished table—not three attractive prototypes with unreliable flippers.
