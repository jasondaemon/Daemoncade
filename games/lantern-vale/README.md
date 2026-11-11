# Lantern Vale · The stolen dawn

A standalone adventure alpha: Mira lends the keeper the last lantern and asks for three heart relics to restore dawn at the northeast beacon. Explore 15 overworld areas across Mossward, Amber Fen and Glass Highlands, three four-room underground dungeons, and three optional keeper chambers: 30 areas total. This is a compact campaign, not a finished multi-day RPG.

## Play and progression

Open `games/lantern-vale/index.html` through the repository's normal static deployment.

- Arrows/WASD move; Space/J strikes; L toggles the lantern; Q drinks a five-heart tonic; E interacts; P pauses; R opens Journey. X throws the earned sun-disc; K opens the journal. Closing the journal leaves the game paused until Resume/P.
- Follow the western grove to Rootvault, the central landing to Drowned Archive, then the southeast stair to Prism Crypt. Carry light across each bridge, touch its sun plate, defeat hall sentries for a key, defeat the warden and collect its heart. Return west to save; finish at the beacon with all three hearts and the lantern raised.
- Light reveals treasure and bridges, activates puzzles and wardens, attracts enemies and briefly stuns bramblelings. Wardens telegraph a root charge, fixed ripples or a sweeping prism beam. Darkness preserves the original dormant-warden combat route.
- Optional threshold alcoves lead to a shutter/seed chamber, sluice/reflection chamber and two-prism chamber. Their rewards grant supplies, a tenth tonic slot and a longer brambleling light stun. Lantern fuel does not drain.
- Oren's orchard, Sen's three singing reeds and Ida's inscriptions offer optional rewards and recurring dialogue. The returning sun-disc damages ordinary enemies, stuns them and toggles the distant root shutter. Relics strengthen the sword and increase health. Treasure and enemy coins fund tonics.
- Hold touch directions while using action buttons. Keyboard/touch input clears on pause, focus loss and pointer cancellation. Resume requires fresh movement input.

## Checkpoints

Interact near a waystone to heal, save and buy one tonic for six coins when space permits. Save key: `daemoncade.lantern-vale.waystone.v1`. Continue restores campaign and optional progression at the saved waystone. Existing valid version-1 checkpoints without optional progress remain supported. Enemy health persists; enemies return to authored positions. Combat timers, projectiles, facing and light reset.

New journey replaces the checkpoint only at the next successful save. Invalid checkpoints and unavailable storage produce feedback while allowing a new journey without persistence. Clearing browser storage removes the checkpoint. Saves are local to the browser/device.

## Artwork and interface

Actual world rendering consumes the original local 305-frame raster atlas: six terrain sets, directional keeper animation, enemies, distinct wardens, props and effects. `ART.md` records provenance and redistribution terms; the title illustration is separate. A failed image load exposes a retry button and a basic map fallback. No dependencies, remote runtime assets, analytics, accounts or services are required. The restrictive Content Security Policy remains intact.

The custom interface fills the window, with responsive touch controls and a short-landscape layout. Those are implemented behaviors, not a claim of verified device usability. `mobile_ready` remains false pending browser/device review.

## Recorded validation

On 2026-11-10, the following local command passed all seven test files with zero failures, including the preserved prototype suite:

```sh
node --test games/lantern-vale/*.test.mjs games/lantern-vale/prototype/*.test.mjs games/lantern-vale/assets/gameplay/*.test.mjs
```

Coverage includes actual movement through the complete three-relic route to the ending and checkpoint reload; bridge/plate/key gating; optional chamber walking access and return; differentiated puzzles/combat; secondary weapon; legacy and extended saves; malformed input; fake-DOM storage, focus, pause, resize and pointer handling. Renderer tests resolve atlas names across all 30 rooms and exercise puzzle/combat states without mutating simulation state. Atlas tests inspect PNG data, frame bounds, animation references and drawing arguments. All game-local JavaScript modules passed `node --check`.

These tests do not render a real browser. No deployment browser result, gameplay screenshot, mobile pass, measured playtime or sustained performance result is claimed here. Independent deployment review must still assess visual quality, a full player-driven campaign, reload persistence, simultaneous touch, keyboard focus, pause/resume and viewport layouts, including short landscape. No browser failure report was supplied during this integration check.

Review-finding validation (2026-11-10): reran the command above: seven test files passed, zero failures or skips. All game-local `.mjs` files passed `node --check`. Inspected the gameplay contact sheet, atlas renderer integration, interface markup/styles, and input/storage lifecycle source. The supplied independent review requests trusted deployment browser evidence only; it supplies no reproduced gameplay defect. This implementation worker has no tool for invoking the separate trusted cluster QA Job and did not launch a local browser/server as a substitute. Deployment acceptance remains unverified pending that downstream assessment; no gameplay code, tests, security policy or mobile-readiness claim was changed for this finding.

See `DEVELOPMENT.md` for the retained engine evaluation and remaining expansion work.

Correction validation (2026-11-10): fixed literal escaped newlines in the journal and overworld map, and moved checkpoint feedback outside the guide hidden by compact layouts. The same seven-file test command above passed after these changes, including new adapter assertions for journal paragraphs, three map rows and independent checkpoint feedback markup. `node --check games/lantern-vale/game.mjs` also passed. These are source and fake-DOM checks; actual compact-layout readability still requires trusted deployment browser QA. The supplied review payload contained only a report-path validation error (`review.findings[0].path must be a safe relative path without globs`), with no actionable file location or browser evidence. A subsequent independent review and deployment QA remain downstream workflow steps.
