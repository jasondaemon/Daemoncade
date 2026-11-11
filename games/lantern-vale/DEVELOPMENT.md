# Development direction

## Engine decision for this milestone

The prior Phaser/PixiJS/Godot evaluation is retained below as architectural context, not a new benchmark or framework integration. The existing deterministic Canvas simulation/renderer remains in use because adding dependencies and migrating engines are outside this milestone's approved scope. The runtime loads a local raster atlas; it has no newly integrated framework.

| Option | Prior evaluation | Remaining decision |
| --- | --- | --- |
| Phaser | Scenes, sprite animation, tilemaps and game physics can replace substantial bespoke infrastructure. | Candidate for a separately scoped production slice; validate campaign contracts and save compatibility before migration. |
| PixiJS | Sprite/container rendering foundation; collision, scenes and game rules still need orchestration. | Viable renderer alternative, with more game infrastructure retained. |
| Godot | Editor-driven authoring and Web export; adds an export pipeline and platform validation work. | Consider for a dedicated project with approval for tooling and delivery changes. |
| Canvas | Existing testable simulation and direct rendering without dependencies or build tooling. | Retained for this compact milestone. |

References retained from the earlier evaluation (not newly fetched during this check): [Phaser license](https://phaser.io/download/license), [scenes](https://www.phaser.io/oss/docs/phaser/concepts/scenes), [physics](https://www.phaser.io/oss/docs/phaser/concepts/physics), [PixiJS scene graph](https://pixijs.com/8.x/guides/concepts/scene-graph), [Godot Web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html). Repository `docs/ENGINES.md` provides prior vendor context; no vendor files were changed.

## Implemented milestone

The 27-area base campaign retains its room IDs, entrances, bridge/plate/key/relic progression, existing bindings and HUD terms. Three additive optional rooms provide shutter/seed, reflection and prism puzzles. Three wardens use distinct tells and attack patterns. Sword upgrades, the returning sun-disc, tonic purchases/capacity, treasure, recurring NPCs and quest rewards form the compact progression loop. Optional progression survives waystone saves; legacy version-1 saves remain accepted.

The Canvas renderer consumes original raster terrain, animated actors, props and effects. A journal, explicit pause/resume, art retry/fallback and responsive controls supplement the custom full-window interface. Local rules, content, progression, renderer, runtime adapter, atlas and original prototype test files pass. This is source-level validation, not deployed visual or device acceptance. README records the commands and evidence limits.

Integration corrections: prism compass wording now matches orientations east/west; the prism charm describes its implemented longer light stun instead of nonexistent fuel drain; seed growth requires uninterrupted light until grown. Added movement tests reach each optional chamber's objects and return without route keys. Displayed area count is 30. Versioned entry/module references were refreshed for these changes.

## Path toward a larger campaign

1. Complete independent browser/art review of this slice: all three lands and dungeons, ending, persistence, input, fallback/retry and small-screen layouts. Tune legibility and combat using real playthrough evidence; keep mobile readiness false until verified.
2. Deepen authored regions and dungeons with additional spatial puzzles, enemy encounters, side routes and narrative consequences. Retain an end-to-end route and deterministic regression coverage throughout.
3. Scope a separate engine/editor trial if needed. Compare one polished region under the retained campaign/save contracts before choosing a migration. No framework migration is completed here.
4. Expand toward a connected multi-day campaign with settlements, item-driven revisits and more substantial dungeons. Measure completion time with players; room count alone cannot establish days of content.
5. Add local audio/settings, broader animation and environmental storytelling, difficulty tuning, save migration/backup, remapping, accessibility and sustained desktop/phone performance review before claiming production readiness.

The current campaign has no measured completion duration, production performance certification or verified mobile readiness. The base dungeon route remains structurally repeated despite distinct optional chambers and wardens. More content and polish are still needed for the larger adventure.
