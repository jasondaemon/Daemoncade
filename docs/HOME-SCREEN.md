# Home Screen games

Each game has `app.html`, `app-manifest.json`, and `app-icon.png`. The PNG is
converted from that game's existing icon. Generate launchers after adding a game:

```sh
python3 scripts/build-game-apps.py
```

The shared host at `games/shared/game-app.*` reserves a control row outside the
iframe. A per-game manifest identity and scope keep installed games distinct.
Launch URLs omit the one-time `?install=1` instructions parameter. No service
worker is installed: internet access is required and game updates use normal
HTTP loading, avoiding a second offline cache/version lifecycle.

On iPhone, open the app page in the browser, then Share → Add to Home Screen.
Leave Open as Web App enabled if offered. The Home Screen icon is the game's
artwork, not the website icon. Browser toolbars disappear in standalone mode;
system status areas are controlled by iOS. Physical installation must still be
checked on a phone; browser automation only emulates standalone launch.

Racecar provides a downloadable career backup in App help. It uses the existing
version-1 career export format. Restore inside the installed game's start-screen
Settings, which validates and confirms replacement. Nothing is uploaded or
passed in URLs; the original browser's save remains intact. Other games receive
a separate-storage warning; automatic save migration is not claimed.

The website owns its Games dialog and links to these app pages. It must allow
iframe downloads and confirmation dialogs for game backup/restore. Native
fullscreen should target the whole host, never just the game iframe.
