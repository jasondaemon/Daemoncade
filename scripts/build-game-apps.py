#!/usr/bin/env python3
"""Generate independent Home Screen launchers; game sources stay unchanged.

Run on macOS (sips converts the existing artwork to Apple's PNG touch icon).
No service worker: never cache stale game code or claim offline support.
"""
import html
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
for metadata in sorted((ROOT / 'games').glob('*/game.json')):
    game = json.loads(metadata.read_text())
    folder = metadata.parent
    title = html.escape(game['title'], quote=True)
    manifest = {
        'id': f'/games/{game["slug"]}/app.html', 'name': game['title'], 'short_name': game['title'],
        'start_url': './app.html', 'scope': './', 'display': 'standalone',
        'background_color': '#081522', 'theme_color': '#081522',
        'icons': [{'src': 'app-icon.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'}],
    }
    (folder / 'app-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    subprocess.run(['sips', '-s', 'format', 'png', '-z', '512', '512',
                    str(folder / game['icon']), '--out', str(folder / 'app-icon.png')],
                   check=True, stdout=subprocess.DEVNULL)
    (folder / 'app.html').write_text(f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#081522">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{title}">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'">
<title>{title}</title>
<link rel="manifest" href="app-manifest.json">
<link rel="apple-touch-icon" href="app-icon.png">
<link rel="icon" href="app-icon.png">
<link rel="stylesheet" href="../shared/game-app.css?v=2">
<script src="../shared/game-app.js?v=3" defer></script>
</head><body>
<header class="app-bar"><a href="/games/" aria-label="Back to arcade">‹ Arcade</a><strong>{title}</strong><button id="app-help">App help</button><button id="app-fullscreen" hidden>Fullscreen</button></header>
<main><iframe id="app-game" title="{title}" allow="autoplay; fullscreen" sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" src="index.html"></iframe></main>
<dialog id="app-guide" aria-labelledby="guide-title">
<h1 id="guide-title">{title} on your Home Screen</h1>
<p id="install-help">Use your browser’s <b>Share → Add to Home Screen</b>. If offered, leave <b>Open as Web App</b> enabled. Then launch the game from its new icon to play without browser toolbars.</p>
<p>The icon uses this game’s artwork. Internet access is required. Nothing is uploaded and no account is needed.</p>
<section id="racecar-transfer" hidden><h2>Keep your careers</h2><p>Before switching, save a backup from Chrome. In the installed app, open the game’s <b>Settings &amp; controls → Restore backup</b> on the start screen and choose that file. Restore replaces the careers in that app only; your Chrome save stays untouched.</p><button id="app-backup">Save Racecar backup</button><p id="backup-status" role="status"></p></section>
<p id="other-transfer">Browser and Home Screen saves may be separate. If your game provides backup/restore, export before switching. Otherwise your progress may start fresh in the app; your browser save remains available in the browser.</p>
<button id="guide-close" autofocus>Continue playing</button>
</dialog>
</body></html>
''')
print('Generated Home Screen launchers and icons.')
