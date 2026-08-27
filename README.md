# Daemoncade

Daemoncade is Jason Daemon's collection of small, self-contained browser games. The games run locally in the browser, require no account or game server, and keep scores and saved state on the player's device.

The public arcade is integrated into [www.jasondaemon.net/games](https://www.jasondaemon.net/games/), but this repository is deliberately independent of the Hugo website that presents it. Daemoncade owns each game's code, catalog metadata, and icon; the website supplies only its surrounding page shell and visual style.

## Games

Each game is versioned independently. The icon, metadata, and playable files travel together in the game's directory.

| Icon | Game | Version | Stage |
| --- | --- | --- | --- |
| <img src="maze-defense/icon.png" width="48" height="48" alt=""> | Maze Defense | `1.0.0` | Stable |
| <img src="mines/icon.webp" width="48" height="48" alt=""> | Mines | `1.0.0-beta.1` | Beta |
| <img src="sinkhole-city/icon.webp" width="48" height="48" alt=""> | Sinkhole City | `1.0.0-beta.1` | Beta |
| <img src="chess/icon.webp" width="48" height="48" alt=""> | Chess | `1.0.0-beta.1` | Beta |
| <img src="checkers/icon.webp" width="48" height="48" alt=""> | Checkers | `1.0.0-beta.1` | Beta |
| <img src="blockfall/icon.webp" width="48" height="48" alt=""> | Blockfall | `1.0.0-beta.1` | Beta |
| <img src="dots-and-boxes/icon.webp" width="48" height="48" alt=""> | Dots and Boxes | `1.0.0-beta.1` | Beta |
| <img src="space-rocks/icon.webp" width="48" height="48" alt=""> | Space Rocks! | `1.0.0-beta.1` | Beta |
| <img src="canyon-crawler/icon.webp" width="48" height="48" alt=""> | Canyon Crawler | `0.1.0-alpha.1` | Alpha |
| <img src="orbit-run/icon.webp" width="48" height="48" alt=""> | Orbit Run | `0.1.0-alpha.1` | Alpha |
| <img src="connect-four/icon.webp" width="48" height="48" alt=""> | Connect Four | `0.1.0-alpha.1` | Alpha |
| <img src="tic-tac-toe/icon.webp" width="48" height="48" alt=""> | Tic-Tac-Toe | `0.1.0-alpha.1` | Alpha |
| <img src="snake/icon.webp" width="48" height="48" alt=""> | Snake | `0.1.0-alpha.1` | Alpha |
| <img src="hangman/icon.webp" width="48" height="48" alt=""> | Hangman | `0.1.0-alpha.1` | Alpha |
| <img src="paddle-duel/icon.webp" width="48" height="48" alt=""> | Paddle Duel | `0.1.0-alpha.1` | Alpha |
| <img src="pinball/icon.webp" width="48" height="48" alt=""> | Pinball | `0.1.0-alpha.1` | Alpha |
| <img src="casey/icon.webp" width="48" height="48" alt=""> | Casey | `0.1.0-alpha.1` | Alpha |
| <img src="missiles-away/icon.webp" width="48" height="48" alt=""> | Missiles Away | `0.1.0-alpha.1` | Alpha |
| <img src="chilopodophobia/icon.webp" width="48" height="48" alt=""> | Chilopodophobia | `0.1.0-alpha.1` | Alpha |
| <img src="road-hopper/icon.webp" width="48" height="48" alt=""> | Road Hopper | `0.1.0-alpha.1` | Alpha |
| <img src="jungle-jumper/icon.webp" width="48" height="48" alt=""> | Jungle Jumper | `0.1.0-alpha.1` | Alpha |

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
http://127.0.0.1:4174/maze-defense/
```

Opening files directly with `file://` works for some games, but a local HTTP server is the supported development path because browsers restrict JavaScript modules and shared assets on local files.

## Design boundaries

- Games must work without backend APIs.
- Multiplayer means two players sharing one device, not network play.
- Scores and resumable state use local browser storage.
- Runtime dependencies must be committed locally; production games do not load code from CDNs.
- Each game owns its HTML, styles, scripts, and assets in a named directory.
- Each game directory also owns its `game.json` catalog record and `icon.webp` or `icon.png` card artwork.
- `catalog.json` is generated from the per-game records with `./scripts/build-catalog.py` and is consumed by both the local menu and the Hugo website.
- Cross-game utilities live in `shared/` or `daemonos-shared/`.
- Game pages must remain safe to run inside the sandboxed iframe used by jasondaemon.net.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development conventions and [DEPLOYMENT.md](DEPLOYMENT.md) for the website promotion process.
Each game is versioned independently; see [VERSIONING.md](VERSIONING.md) for the release-stage and version policy.

## License and provenance

Daemoncade is distributed under the GNU General Public License, version 3. Third-party components retain their original licenses and notices. See [LICENSE.md](LICENSE.md) and [NOTICE.txt](NOTICE.txt).
