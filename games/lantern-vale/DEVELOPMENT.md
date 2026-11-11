# Development direction

## Engine decision for this milestone

The prior Phaser/PixiJS/Godot evaluation is retained below as architectural context, not a new benchmark or framework integration. The existing deterministic Canvas simulation/renderer remains in use because adding dependencies and migrating engines are outside this milestone's approved scope. The runtime loads a local raster atlas; it has no newly integrated framework.

| Option | Prior evaluation | Remaining decision |
| --- | --- | --- |
| Phaser | Scenes, sprite animation, tilemaps and game physics can replace substantial bespoke infrastructure. | Candidate for a separately scoped production slice; validate campaign contracts and save compatibility before migration. |
| PixiJS | Sprite/container rendering foundation; collision, scenes and game rules still need orchestration. | Viable renderer alternative, with more game infrastructure retained. |
| Godot | Editor-driven authoring and Web export; adds an export pipeline and platform validation work. | Consider for a dedicated project with approval for tooling and delivery changes. |
| Canvas | Existing testable simulation and direct rendering without dependencies or build tooling. | Retained within this milestone’s dependency and engine boundary. |

References retained from the earlier evaluation (not newly fetched during this check): [Phaser license](https://phaser.io/download/license), [scenes](https://www.phaser.io/oss/docs/phaser/concepts/scenes), [physics](https://www.phaser.io/oss/docs/phaser/concepts/physics), [PixiJS scene graph](https://pixijs.com/8.x/guides/concepts/scene-graph), [Godot Web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html). Repository `docs/ENGINES.md` provides prior vendor context; no vendor files were changed.

## Implemented adventure

The original 30 areas retain their IDs, entrances, bridge/plate/key/relic progression, bindings and HUD terms. The original three-heart beacon ending offers an explicit continuation to Lantern Confluence. Seven new regional networks add 126 overworld scenes. Nine 12-room dungeon depths add 108 rooms, including deeper expeditions for the original three dungeons. The full installation has 264 areas, including 141 overworld scenes and the retained optional chambers.

The expansion uses branching roads, settlements, free healing checkpoints, tonic shops, light/shade circuits, equipment gates, hazards, keeper shortcuts, supplies and regional witness/aftermath dialogue. Each dungeon includes a map, three dependent circuits, equipment workshop, refuge, reward branch, boss and return lift. Dungeon layouts and boss timing profiles differ, while the underlying ladder topology and control-alignment puzzle vocabulary recur. These are substantive mechanics, with repetition that still needs player assessment.

The Canvas renderer selects local regional raster materials, shoreline overlays, authored scenery, named NPCs and nine boss families. A shared assembly module connects story reward IDs and return destinations atomically. Expanded saves validate and persist exploration, equipment, quests, circuits, bosses and endings; original version-1 checkpoints migrate.

## Evidence and design limits

The original direction is an exploration adventure built around a lantern that changes traversal, enemy attention and puzzle conditions. The expanded campaign is implemented in this milestone. It has no timed human completion session or defensible multi-day completion estimate. An automated traversal is evidence of reachability and progression, not entertainment value, pacing or duration. Production artwork quality, deployed scene composition, mobile usability and sustained performance remain unverified. See VALIDATION.md for actual checks.
