# Daemoncade

Daemoncade is Jason Daemon's collection of small, self-contained browser games. The games run locally in the browser, require no account or game server, and keep scores and saved state on the player's device.

The public arcade is integrated into [www.jasondaemon.net/games](https://www.jasondaemon.net/games/), but this repository is deliberately independent of the Hugo website that presents it.

## Games

- Blockfall
- Canyon Crawler
- Casey
- Checkers
- Chess
- Chilopodophobia
- Connect Four
- Dots and Boxes
- Hangman
- Jungle Jumper
- Maze Defense
- Minesweeper
- Missiles Away
- Orbit Run
- Paddle Duel
- Pinball
- Road Hopper
- Sinkhole City
- Snake
- Space Rocks
- Tic-Tac-Toe

## Run locally

No package installation or compilation is required. From the repository root:

```sh
./scripts/serve.sh
```

Then open the game directory shown by the server, such as:

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
- Cross-game utilities live in `shared/` or `daemonos-shared/`.
- Game pages must remain safe to run inside the sandboxed iframe used by jasondaemon.net.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development conventions and [DEPLOYMENT.md](DEPLOYMENT.md) for the website promotion process.

## License and provenance

Daemoncade is distributed under the GNU General Public License, version 3. Third-party components retain their original licenses and notices. See [LICENSE.md](LICENSE.md) and [NOTICE.txt](NOTICE.txt).
