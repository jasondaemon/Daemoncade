# Daemoncade

Daemoncade is Jason Daemon's collection of small, self-contained browser games. The games run locally in the browser, require no account or game server, and keep scores and saved state on the player's device.

The public arcade is integrated into [www.jasondaemon.net/games](https://www.jasondaemon.net/games/), but this repository is deliberately independent of the Hugo website that presents it. Daemoncade owns each game's code, catalog metadata, and icon; the website supplies only its surrounding page shell and visual style.

## Games

See the [game catalog](docs/GAMES.md) for the complete list, icons, current versions, release stages, and a description of each game.

## Run locally

No package installation or compilation is required. From the repository root:

```sh
./scripts/serve.sh
```

Then open the arcade menu:

```text
http://127.0.0.1:4174/
```

The menu launches every game in the catalog. You can also open a game directly, such as:

```text
http://127.0.0.1:4174/games/maze-defense/
```

Opening files directly with `file://` works for some games, but a local HTTP server is the supported development path because browsers restrict JavaScript modules and shared assets on local files.

## Design boundaries

- Games must work without backend APIs.
- Multiplayer means two players sharing one device, not network play.
- Scores and resumable state use local browser storage.
- Runtime dependencies must be committed locally; production games do not load code from CDNs.
- Each game owns its HTML, styles, scripts, metadata, and assets in a named directory under `games/`.
- Each game directory also owns its `game.json` catalog record and `icon.webp` or `icon.png` card artwork.
- `catalog.json` is generated from the per-game records with `./scripts/build-catalog.py` and is consumed by both the local menu and the website's client-rendered Games page.
- Cross-game utilities live in `games/shared/` or `games/daemonos-shared/`.
- Game pages must remain safe to run inside the sandboxed iframe used by jasondaemon.net.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development conventions and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the website promotion process.
Each game is versioned independently; see [docs/VERSIONING.md](docs/VERSIONING.md) for the release-stage and version policy.
Engine choices and migration candidates are tracked in [docs/ENGINES.md](docs/ENGINES.md).

## License and provenance

Daemoncade is distributed under the GNU General Public License, version 3. Third-party components retain their original licenses and notices. See [LICENSE.md](LICENSE.md) and [NOTICE.txt](NOTICE.txt).
