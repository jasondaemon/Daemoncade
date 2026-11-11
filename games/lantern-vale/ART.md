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

The legacy renderer and expanded runtime both consume these local raster assets. Asset integrity tests establish frame validity; deployed play review is needed to assess visual quality.

### Actual validation

Ran `python3 games/lantern-vale/assets/gameplay/build_atlas.py`, then `node --test games/lantern-vale/assets/gameplay/atlas.test.mjs`: passed. Checks decode PNG scanlines; verify image dimensions, bounds, disjoint rectangles, two-pixel transparent gutters, opaque terrain, nonempty intended frames, matching floor edges, translucent radial light, complete required sets, animation references/timing/loop/one-shot boundaries, and actual Canvas draw arguments including pivots and sampling. Rebuilt twice with identical atlas SHA-256 `c963ffbcd50ae50d8c99b11330e5da325d8d174700fc8bb4fbcff8ef5a3a6474`.

Inspected the generated atlas and contact sheet with the local raster viewer. Floors repeat without edge lines; separated gutters show no adjacent-frame bleed; keeper facing, lantern, props and the three warden silhouettes are readable at native size. The contact sheet composites translucent light onto a dark background; the raw atlas viewer may display uncomposited RGB as solid gold. No deployed-browser, gameplay integration, campaign-completion, or trusted cluster QA result is claimed by this artwork pass.

Final regression run: `node --test games/lantern-vale/campaign.test.mjs games/lantern-vale/runtime.test.mjs games/lantern-vale/assets/gameplay/atlas.test.mjs` passed all three test files (0 failures). `node --check games/lantern-vale/assets/gameplay/atlas.mjs` passed. The final atlas is 56,023 bytes. All writes for this artwork pass are confined to `assets/gameplay/` and this `ART.md`.

## Renderer integration correction

The live `game.mjs` now loads the atlas once and delegates world drawing to `renderer.mjs`. Six terrain sets, animated directional keeper poses, land-specific enemies and wardens, props and effects replace primitive world drawings. Animation advances with simulation time, so pause freezes it. Existing campaign state, room coordinates, collision, controls, labels and saves are preserved. Loading failures are reported in the existing status area.

`manifest.mjs` is generated alongside `atlas.json` and loaded as a local script module. This avoids a fetch blocked by the preserved `connect-src 'none'` policy. The PNG remains a local image. The contact sheet was inspected again; it is an asset review sheet, not evidence of deployed gameplay.

Validation: all six local test files passed, including renderer coverage of all 27 rooms, light states, gates, bridges, plates, chests, attacks and terrain mappings. Runtime adapter coverage verifies successful decoded-atlas drawing as well as existing input/storage behavior. Trusted deployment browser QA is still pending; no browser screenshot or visual gameplay pass is claimed.

## Expanded gameplay artwork — 2026-11-11

This section supersedes the v1 atlas dimensions and counts above. The active manifest now points to **`lantern-gameplay-v2.png`**, 1024 × 5040 RGBA, 1,281 frames and 217 animation sequences. The v1 PNG is retained as historical art. All legacy frame IDs, pivots, animation names, `terrainSets`, `enemySets`, `wardenSets` and the `loadAtlas`/`frameAt`/`drawFrame` APIs remain compatible. The image filename changes to avoid an old cached PNG being used with new rectangles. The local module manifest still avoids fetch, and nearest-neighbor sampling remains enforced by the adapter.

### Editable source and provenance

`build_atlas.py` plus `expanded_art.py` are the complete editable pixel-geometry sources. Rebuild with `python3 -B games/lantern-vale/assets/gameplay/build_atlas.py`; only Python standard-library modules are used. The extension contains individually authored silhouettes, palettes, shading, architecture, props and poses. No downloaded art, external fonts, generated-image calls, authentication, paid APIs, third-party textures or new dependencies were used in this pass. All newly authored source, PNG and manifest additions inherit the **CC0 1.0 Universal** dedication and fallback permission in the gameplay redistribution section above. Title artwork provenance is unchanged.

### Delivered artwork

- Eighteen terrain families: the six legacy regions plus Cinder Coast, Moonwood, Sunken Garden, Storm Peaks, Starfall Desert, Eclipse Reach, Ember Forge, Lunar Observatory, Verdant Cistern, Tempest Spire, Solar Tomb and Eclipse Citadel. Each has floors, masonry, animated water, three environmental details, a landmark and sixteen transparent shoreline masks. Legacy floors and walls also receive material detailing.
- Root/tree arches, stilted tide houses and docks, broken crystal observatories, stepped solar tombs, a smoking forge and eclipse spires provide different landmark silhouettes. They use grounded shadows, inset doorways and warm entrance markers. Interior materials include oak boards, woven floors and marble; props include beds, shelves, counters, hearths, signs, barrels, market awnings and doors.
- The keeper retains directional idle, walk and strike animations and gains four-frame cast, use, dash and hurt actions in every direction. Existing lantern, blade and equipment identity stays readable at 40px world scale.
- Fourteen NPC appearances include distinct Mira, Sen, Oren and Ida poses matched to the actual story; two-frame breathing loops retain fixed world pivots. Other appearances support merchants, ferrymen and settlement inhabitants.
- Six new regular enemy families (cinder crab, moon spider, thorn stalker, storm wisp, dune scarab and eclipse shade) have idle/walk/windup/attack/hurt/defeat sequences. Existing regular enemies remain available.
- Nine campaign boss mappings cover Rootvault, Drowned Archive, Prism Crypt, Bell Cistern, Ember Foundry, Gale Observatory, Winter Reservoir, Moon Conservatory and Horizon Engine. The six new silhouettes are a bronze diving-bell leviathan, fissured forge colossus, winged storm roc, low ice-armored leviathan, patterned lunar weaver and mechanical horizon iris. Windups, attacks, hurt highlights and terminal dissolves remain distinct from idle. Three additional optional silhouettes (thorn matriarch, sun scarab and eclipse sovereign) are also available by frame name.
- Inventory art includes all six exact earned equipment IDs in `expansion/story.mjs`, additional equipment candidates, three colored potion bottles, and new ember, mist, leaf, moonbeam, storm and eclipse effects. Existing swords, relics, tonic, key, coin and sun-disc-compatible boomerang remain intact.

### Runtime integration

`manifest.regionSets` combines eighteen materials; `terrainSets` retains its original six keys for legacy consumers. Each expanded set provides floor, wall, animated water, shoreline masks, details and a landmark. Shoreline overlays use N=1, E=2, S=4, W=8 to mark adjacent dry banks. Native pivots and dimensions are retained for actors and 80-pixel landmarks.

The expanded runtime selects materials through `contentBindings.lands` and `contentBindings.dungeons`, authored scenery through `scenerySets`, named story NPCs through `contentBindings.characters`, and nine distinct boss families through `bossSets`. The shared adventure adapter reconciles authoring IDs with story rewards and rendering IDs. This selection is implemented in gameplay; deployed visual quality remains unverified.

### Inspection and validation

`regions-asset-sheet.png`, `actors-asset-sheet.png`, `props-asset-sheet.png` and `contact-sheet.png` are asset sheets, not gameplay screenshots. The actor sheet was inspected during integration for boss silhouettes, tells, attack poses and NPC differentiation. The images have a coherent restrained palette and readable silhouettes; animation subtlety, environmental repetition, scale and composition require actual deployed play assessment.

Local atlas tests decode PNG data, validate rectangles, gutters, animations, opaque/seamless terrain, shoreline alpha, distinct boss silhouettes and NPC pixels, equipment resolution and actual scene/scenery bindings. Loader tests preserve decode and dimension rejection. The runtime mock now uses the shipped manifest dimensions, so it exercises the real v2 loader contract. No gameplay screenshot or deployed art approval is claimed. See VALIDATION.md for the final command results.
