# Blockfall 1.0.1

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
