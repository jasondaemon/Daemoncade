# Original raster artwork

## Journey-screen sample

File: `assets/lantern-vale.png` (1254 × 1254 PNG). Generated once on 2026-11-10 with Codex's built-in image-generation tool using the existing authenticated session. No external API credentials or paid service configuration was added. Original output copied into this game directory; inspected with the local image viewer. No corrective retry or editing. The generated illustration is original game art; redistribute with this repository under its existing license. No commercial game assets or characters are included.

Prompt:

> Original square menu art and title-screen illustration for Lantern Vale, a woodland adventure RPG. A small rust-orange cloaked lantern keeper with a simple iron sword stands on a moss-covered stone bridge over an ink-blue ravine, facing a towering ruined beacon. Three distant lands: emerald forest, amber marsh and pale mountain ruins; tiny underground doorways lit by runes. Painterly pixel-art-inspired raster illustration, polished storybook atmosphere, warm golden lantern glow against deep midnight teal and violet, strong clear silhouette readable at thumbnail size. No text, no logos, no watermark, no existing franchise characters. Square composition.

Inspection: clear orange keeper silhouette, amber lantern, three distinct landscapes, readable beacon and underground doorways. The illustration establishes the palette and atmosphere. It is not a gameplay screenshot or a sprite sheet. The original PNG is retained without introducing an image-processing dependency; production atlas and image size optimization remain part of the next art pass.

## Preserved menu icon

`icon.webp` is the existing 512 × 512 generated prototype icon. Its original provenance, recorded with the prototype: generated using the built-in image-generation tool on 2026-11-09, then resized to WebP. Brief: an original hooded woodland keeper carrying an amber lantern along a mossy forest path, with a ruined beacon and hidden bridge; pixel-art-inspired storybook style, deep teal and amber, readable as a square thumbnail, no text or existing franchise characters.

The existing icon remains the metadata icon. New journey-screen art is also available locally as an alternate menu-art candidate for human review. No catalog regeneration or deployment is part of this change.

## Gameplay atlas — original pixel artwork, 2026-11-10

The gameplay art is separate from the preserved illustration and icon above. It was authored directly as pixel geometry and a restricted palette in `assets/gameplay/build_atlas.py`. No source images, third-party assets, image-generation calls, downloaded packs, fonts, or dependencies were used for this atlas. Python's standard library writes the distributable RGBA PNG. The generator is retained as editable art source; Python is not required by the game.

Files:

- `assets/gameplay/lantern-gameplay-v1.png`: 1024 × 1232 RGBA, 305 frames, approximately 55 KiB.
- `assets/gameplay/atlas.json`: frame rectangles, logical dimensions, pivots, nearest-neighbor sampling, 66 animation sequences with per-frame millisecond durations and loop flags, terrain/enemy/warden mappings.
- `assets/gameplay/atlas.mjs`: local-only Canvas loader, animation selection and pivot-aware drawing helper.
- `assets/gameplay/contact-sheet.png`: actual raster-frame review sheet, **not a gameplay screenshot**. Six terrain columns in manifest order; four keeper walk directions at left; enemies and wardens at center (idle, windup, attack, dissolve); props and effects at right.
- `assets/gameplay/atlas.test.mjs`: source-asset and adapter validation.

Visual direction: rust-orange keeper, amber lanterns and relic highlights, deep blue-green outlines, quiet ground texture. Mossward uses fern greens, foliage and mossed masonry; Amber Fen uses ochre earth, reeds and wet blue water; Glass Highlands uses pale angular stone and crystal. Rootvault uses dark moss/root floors, Drowned Archive has submerged teal masonry, and Prism Crypt uses violet stone with cyan crystal inlays. Floor variants have matching solid perimeter pixels for seamless placement. Transparent foliage overlays provide trees, reeds and crystal outcrops. Wardens are 80-pixel antlered root, crowned winged tide, and floating faceted prism silhouettes; regular enemies use their 40-pixel families. Telegraph highlights and attack marks remain visibly distinct from idle poses.

Keeper animations: four directions, two idle, four walk and four strike frames per direction. Enemy/warden animations: four frames each for idle, walk, windup, attack, hurt and defeat. Defeat deliberately ends fully transparent. Props include Mira, waystones, stairs in both directions, beacon, closed/open chests, bridge, gate, unlit/lit plates, three relics, tonic, coin, key, returning secondary weapon and three blades. Effects include a translucent lantern halo, right-facing sword arc, expanding light burst, projectile, spark, shadow and danger ring. Rotate the sword arc around its center to follow the keeper's facing.

### Redistribution terms

To the extent copyright applies, all newly authored files in `assets/gameplay/` are dedicated to the public domain under **CC0 1.0 Universal**. They may be copied, modified, redistributed and used commercially without attribution. Where a public-domain dedication is ineffective, permission is granted to use these files for any purpose without restriction or fee. No warranty is provided. These terms cover only this newly authored gameplay set; the preserved title illustration and icon retain the provenance and repository redistribution terms above.

### Renderer handoff

Import `loadAtlas` from `./assets/gameplay/atlas.mjs` and load once before starting rendering. Its result provides `draw(context, name, x, y, elapsedMs, scale)`. All asset URLs resolve relative to that module and stay local. Draw floor or wall frames at tile top-left (`x * 40`, `y * 40`); their pivots are `[0, 0]`. Draw keeper, enemies, props and effects at their existing world center (`entity.x * 40`, `entity.y * 40`); pivots are the frame center. Warden frames are naturally twice tile size. Do not scale the entire sheet before selecting a frame. Use nearest-neighbor drawing. `frameAt` also exposes frame selection independently for renderers that manage image loading themselves.

For terrain, `terrainSets[land].floor` and `.wall` contain static frame IDs; `.water` names an animation. Land IDs: `mossward`, `amber-fen`, `glass-highlands`, `rootvault`, `drowned-archive`, `prism-crypt`. Typical actor sequence: `keeper.right.walk`; enemy sequence: `enemy.root-warden.windup`; static prop: `prop.chest.0`; animated prop: `prop.waystone`; effect: `effect.lantern-glow`. Animated names and static frame names are both accepted by the adapter. Missing names return false without drawing. Keep movement/collision, light rules, animation clocks, attack facing, room IDs and gameplay states owned by the game renderer/rules.

The artwork worker's allowed writes exclude `game.mjs`; therefore this change supplies finished raster assets and an adapter but does **not** replace that file's current primitive drawing. Runtime consumption must be connected by the renderer owner. Artwork existence alone does not establish the acceptance criterion that actual gameplay uses it.

### Actual validation

Ran `python3 games/lantern-vale/assets/gameplay/build_atlas.py`, then `node --test games/lantern-vale/assets/gameplay/atlas.test.mjs`: passed. Checks decode PNG scanlines; verify image dimensions, bounds, disjoint rectangles, two-pixel transparent gutters, opaque terrain, nonempty intended frames, matching floor edges, translucent radial light, complete required sets, animation references/timing/loop/one-shot boundaries, and actual Canvas draw arguments including pivots and sampling. Rebuilt twice with identical atlas SHA-256 `c963ffbcd50ae50d8c99b11330e5da325d8d174700fc8bb4fbcff8ef5a3a6474`.

Inspected the generated atlas and contact sheet with the local raster viewer. Floors repeat without edge lines; separated gutters show no adjacent-frame bleed; keeper facing, lantern, props and the three warden silhouettes are readable at native size. The contact sheet composites translucent light onto a dark background; the raw atlas viewer may display uncomposited RGB as solid gold. No deployed-browser, gameplay integration, campaign-completion, or trusted cluster QA result is claimed by this artwork pass.

Final regression run: `node --test games/lantern-vale/campaign.test.mjs games/lantern-vale/runtime.test.mjs games/lantern-vale/assets/gameplay/atlas.test.mjs` passed all three test files (0 failures). `node --check games/lantern-vale/assets/gameplay/atlas.mjs` passed. The final atlas is 56,023 bytes. All writes for this artwork pass are confined to `assets/gameplay/` and this `ART.md`.

## Renderer integration correction

The live `game.mjs` now loads the atlas once and delegates world drawing to `renderer.mjs`. Six terrain sets, animated directional keeper poses, land-specific enemies and wardens, props and effects replace primitive world drawings. Animation advances with simulation time, so pause freezes it. Existing campaign state, room coordinates, collision, controls, labels and saves are preserved. Loading failures are reported in the existing status area.

`manifest.mjs` is generated alongside `atlas.json` and loaded as a local script module. This avoids a fetch blocked by the preserved `connect-src 'none'` policy. The PNG remains a local image. The contact sheet was inspected again; it is an asset review sheet, not evidence of deployed gameplay.

Validation: all six local test files passed, including renderer coverage of all 27 rooms, light states, gates, bridges, plates, chests, attacks and terrain mappings. Runtime adapter coverage verifies successful decoded-atlas drawing as well as existing input/storage behavior. Trusted deployment browser QA is still pending; no browser screenshot or visual gameplay pass is claimed.
