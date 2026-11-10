# Lantern Vale · The stolen dawn

A standalone adventure alpha with 15 overworld areas across Mossward, Amber Fen and the Glass Highlands, plus three four-room underground dungeons. Mira gives the keeper the last lantern; recover the three wardens' heart relics and return them to the northeast beacon. Light reveals bridges, treasure and sun plates, attracts shadows, and awakens wardens. Relics strengthen the blade, increase health and open the next land.

The original five-room rules and tests remain under `prototype/` as a reference. The playable entry uses `campaign.mjs`, with a deterministic simulation independent of its Canvas renderer. No shared helpers, dependencies, catalog, launcher or other games are modified. All runtime requests are local assets. No accounts, analytics or server storage.

## Play and save

Run `./scripts/serve.sh` from the repository root and open `/games/lantern-vale/`.

- Arrows/WASD move; Space/J strikes in the facing direction. L toggles the lantern, Q drinks a five-heart tonic, E interacts, P pauses, R opens the journey menu.
- Touch: hold direction buttons and tap the named actions. Movement clears on pointer cancellation, loss of capture, pause, tab hiding and blur. Resume explicitly.
- Glowing waystones heal and save when E is pressed nearby. They sell one tonic for six coins per interaction, up to nine carried. Treasure is visible in lantern light.
- Save key: `daemoncade.lantern-vale.waystone.v1`. One checkpoint per browser/device. Continue reloads the waystone and campaign progress. A new journey replaces the checkpoint only when saving. Clearing browser storage deletes it. Storage denial is handled with a visible message; play remains possible.
- Save records have a schema version, strict bounded fields and canonical enemy arrays. Transient positions, timers, light and status are reset on continue; remaining enemies resume at their authored spawn positions with saved health. No compatibility with future save versions is promised during alpha.

## Validation

Commands run from the repository root with Node 18.20.4:

```sh
node --test games/lantern-vale/*.test.mjs games/lantern-vale/prototype/*.test.mjs games/meddle/*.test.mjs
node --check games/lantern-vale/game.mjs
node --check games/lantern-vale/campaign.mjs
```

All seven test files pass, zero failures. Campaign coverage includes normalized movement, collision, light puzzles, sentry keys, warden dormancy, directional combat, cooldown, tonics, death freeze, pause, malformed save rejection, and an entire route through all three dungeons, checkpoint serialization/reload, upgrades and ending using actual movement transitions. Adapter tests use a fake DOM to check element wiring, resize sizing, blocked storage messaging, menu navigation, blur/pause/resume and pointer cancellation event handling. They do not render a browser or establish visual correctness. The six original prototype rule scenarios remain passing. All four committed Meddle Node test files pass without changes.

`./scripts/serve.sh` failed with `PermissionError: [Errno 1] Operation not permitted` creating a socket. No browser, Playwright or Puppeteer is installed. HTTP delivery and browser visual QA were **not performed**. `mobile_ready` is false until device review.

## Browser review still required

1. Open directly over HTTP in Chrome and Firefox; inspect console, local asset loading, art loading and absence of external requests.
2. Start a new journey, read the guide, save at the first waystone. Go south then east into the western grove. Enter the stairs in the northeast of that area.
3. In each dungeon: travel east, light the bridge, touch the sun plate, defeat both sentries for their gate key, defeat the warden with the lantern raised, collect its heart and backtrack west. Save outside. Verify each gate blocks before its requirement and visibly opens afterward.
4. Proceed east to the central grove dungeon, then south/east to the southeast dungeon. Use tonics, gather caches, buy a tonic, and verify health/blade improvements. Return north to the northeast beacon, raise the lantern and interact to finish.
5. Lose all health, open Journey, Continue, and verify the last saved waystone/progress. Reload the page and continue again. Check invalid/blocked storage and confirm a new journey only replaces a save at a waystone.
6. Test each keyboard action and diagonal movement; use simultaneous touch movement/actions, release outside controls and cancel touches. Pause while moving, blur, hide the tab, resume explicitly and verify movement requires fresh input.
7. Resize desktop, portrait and landscape phones, short landscape, high DPI and zoom. Verify readable HUD, focus visibility, reachable buttons, correct aspect ratio and no document/parent scrolling. Test iframe fit separately if integration is approved.
8. Finish, open Journey, start again, and confirm all hearts, enemies, keys, caches and upgrades reset. Collect screenshots and review sustained device performance before changing mobile readiness.

## Art and limits

`assets/lantern-vale.png` is an original generated square raster illustration used on the journey screen; inspected locally for composition and palette. `ART.md` records its full prompt and provenance. `icon.webp` preserves the prototype's original generated menu artwork. In-game tiles and sprites are hand-authored pixel shapes rasterized by Canvas. The illustration is a polished art-direction sample; this alpha does not yet have a production sprite atlas, animation suite, audio, varied boss patterns or days of authored content. The 27 areas are a compact campaign with repeated dungeon structure, not a claim to the finished large RPG. See `DEVELOPMENT.md` for engine evaluation and staged expansion.

Production catalog registration, merge and deployment require separate human action.
