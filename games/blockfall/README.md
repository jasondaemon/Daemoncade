# Blockfall 1.0.2

Mobile performance pass: one capped 2D effects canvas replaces Pixi/WebGL and
per-particle DOM animations. No full-cabinet white flash or shake/filter pass.
Cached block sprites and dirty board rendering avoid repainting gradients,
shadows and LCD textures every display frame. Rendering density is capped at 2×;
effects run at up to 30fps on coarse-pointer devices, independent of input.
Hard-drop batches its HUD work. Four-line clears release the next piece after
240ms (other clears 180ms); confetti continues without blocking controls.
Restart cancels the previous game loop, and paused/background effects are cleared.

`scripts/test-blockfall-performance.mjs` stress-tests 36 four-line clears across
all themes with 4× CPU throttling, bounded caches/particles, pause/restart cleanup,
and no white overlay. This is not a physical iPhone performance measurement.

On touch devices, swipe across the playfield to move by columns, tap to rotate,
and swipe down then release to hard-drop. Hold and soft-down remain buttons;
holding soft-down repeats. Desktop buttons and keyboard controls remain.

Gestures capture one pointer, lock their first clear axis, ignore tap jitter,
and never commit a drop on cancellation. Locking/replacing a piece, pausing,
resizing or returning to the lobby cancels the active gesture.

Background, blur and pagehide events stop music/effects and pause a running
game. The Home Screen host also sends a same-origin suspension message. Return
does not restart music automatically; Resume explicitly restores gameplay music.
Physical iPhone suspension behavior should be confirmed after deployment.

Checks: `node --test games/blockfall/gestures.test.mjs` and
`scripts/test-blockfall-mobile.mjs` (set PLAYWRIGHT_MODULE to the local package).
The browser test injects read-only state inspection into an isolated response;
no test hook is shipped in the game.
