# Contributing to Daemoncade

## A game is a deployable directory

Every game should have a stable, lowercase slug and an `index.html` entry point:

```text
games/game-slug/
├── index.html
├── game.css
├── game.js
└── assets/
```

Existing games may use additional modules or shared libraries. Keep paths relative so the same directory works locally and at `/games/<slug>/` on jasondaemon.net.

## Browser and security rules

- Do not add server calls, accounts, remote score submission, advertising, analytics, or network multiplayer.
- Do not load runtime JavaScript, styles, fonts, audio, or images from third-party hosts.
- Use local storage only for game preferences, saves, and local high scores.
- Treat stored values as untrusted input and validate them before use.
- Avoid `eval`, dynamically injected third-party scripts, and unsanitized HTML.
- Keep the game's Content Security Policy restrictive.
- Test keyboard, pointer, touch, pause/resume, and resize behavior.
- A game opened from the jasondaemon.net launcher must fit the browser window without forcing the parent page to scroll.

## Shared behavior

- Use `games/shared/scores.js` for website-compatible local score records.
- Use `games/daemonos-shared/` only for the compatibility helpers used by games adapted from DaemonOS.
- New shared code should have a focused purpose and must not introduce a framework requirement across unrelated games.

## Assets and attribution

- Commit only assets that may legally be redistributed.
- Record imported libraries and assets in `NOTICE.txt`.
- Preserve third-party copyright and license headers.
- Do not add copyrighted commercial game music, artwork, characters, or branding.
- Optimize large raster and audio files before committing them.

## Cache-safe releases

The public edge may cache static JavaScript, CSS, images, and audio for a long time. When an asset changes without changing its filename, update the version query in the HTML that loads it. New code should prefer content-versioned asset references so a release never combines old JavaScript or CSS with new HTML.

## Before committing

1. Serve the repository over local HTTP.
2. Open the changed game directly.
3. Test a complete game loop and its restart behavior.
4. Test it inside the jasondaemon.net Games launcher when integration behavior changes.
5. Search for broken relative references and missing files.
6. Confirm no unrelated generated or local files were added.

### Neon Breaker level testing

Open `/games/neon-breaker/?testLevel=8` to start directly at any positive level. Test mode is visibly labeled and does not overwrite the campaign save, unlock progress, ranks, best score, or local score records.
