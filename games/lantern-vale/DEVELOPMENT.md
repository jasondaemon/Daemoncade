# Development direction

## Engine evaluation

Reviewed official documentation on 2026-11-10. These are architectural judgments for this game's next production phase, not benchmarks.

| Option | Fit and tradeoff | Decision |
| --- | --- | --- |
| Phaser | MIT game framework with scenes and Arcade/Matter physics; repository already vendors Phaser 3.90.0. Scenes can separate overworld, dungeon and interface lifecycles. | Preferred next renderer: use the existing local build, tilemaps, sprite animation and camera/scene management, while keeping deterministic campaign rules testable outside the browser. |
| PixiJS | Scene graph of containers and sprites provides a rendering foundation. Game-specific collision, scene progression and input orchestration would remain our responsibility. | Viable rendering choice; less replacement of the bespoke game infrastructure than Phaser. |
| Godot | Full authoring/editor workflow and Web export. Web builds require WebAssembly and WebGL 2; default single-thread export avoids cross-origin isolation requirements of threaded exports. | Strong option for a dedicated editor-driven project, but adds an export pipeline and platform validation burden to this static JavaScript repository. |
| Canvas | Existing prototype rendering and deterministic rules run without a dependency or build. | Retained for the first campaign iteration; does not settle the production renderer choice. |

Sources:
- https://phaser.io/download/license
- https://www.phaser.io/oss/docs/phaser/concepts/scenes
- https://www.phaser.io/oss/docs/phaser/concepts/physics
- https://pixijs.com/8.x/guides/concepts/scene-graph
- https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- Repository `docs/ENGINES.md` for currently vendored versions.

No engine has been added or migrated in this iteration. Phaser is the recommended direction, not an implemented integration. Keep future engine work local to this game and do not modify shared/vendor files without the required scope approval.

## Staged build plan

1. **Campaign foundation — implemented alpha:** three lands, three compact dungeons, light/sword loop, relic and weapon progression, tonics, waystone persistence, story start/end, full-window custom interface, original raster illustration and core rules tests. Browser acceptance remains pending.
2. **Art and engine slice:** after palette/style review, create a local licensed atlas for keeper movement/attacks, enemy silhouettes, biome tiles, props and UI. Implement one polished Phaser region/dungeon using the tested campaign contracts. Validate browser loading, input latency, pause and save compatibility before replacing Canvas.
3. **Dungeon depth:** author distinct mirror, shutter and light-beam puzzles; enemy patrol/ranged patterns; three unique bosses; secondary weapons with contextual uses. Require complete-route tests and browser puzzle playthroughs per dungeon. Avoid multiplying the current repeated rooms to claim content depth.
4. **World and narrative expansion:** expand toward an original multi-day campaign with connected regions, settlements, optional caves, recurring NPCs, side quests and discoverable lore. Plan about eight substantial dungeons with item-driven revisits; measure actual playtime with players rather than promising a duration by room count.
5. **Production pass:** animation, local audio with settings, difficulty tuning, checkpoint migration/backup, remapping and accessibility review; real phone/desktop performance and full playthroughs. Promote release stage only on evidence.

The current 27 areas establish the full progression loop. Production art beyond the illustration, deep authored puzzles and multi-day duration remain future work. Keep a playable end-to-end route at every stage.
