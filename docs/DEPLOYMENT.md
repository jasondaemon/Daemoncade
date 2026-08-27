# Deployment

Daemoncade and jasondaemon.net have separate responsibilities.

- This repository owns the playable game directories, shared runtime files, game metadata, icons, and portable local arcade menu.
- The website repository owns the Games page shell, cards, navigation, launcher behavior, and surrounding site design. It reads the catalog and icons from this repository.
- The website includes a pinned Daemoncade commit as the `vendor/daemoncade` Git submodule and mounts this repository's `games/` directory at the public `/games/` path.

## Promotion to jasondaemon.net

Publishing a commit here does not change production by itself.

1. Finish and test the Daemoncade commit.
2. In the `www.jasondaemon.net` repository, update the `vendor/daemoncade` submodule to that exact commit.
3. Test the Hugo site locally.
4. Commit the submodule-pointer change in the website repository.
5. Push the website `main` branch to its Forgejo origin.
6. The existing Hugo publisher webhook builds that exact website commit and recursively initializes the pinned games submodule.
7. Confirm the Kubernetes publish job completes and check the affected public game URLs from outside the network.

This deliberate promotion gate keeps unfinished game work out of production and makes rollback a normal website commit revert.

## Adding a game to the catalog

Add `game.json` and its referenced icon under `games/<slug>/`, then rebuild the checked-in catalog and game-list documentation:

```sh
./scripts/build-catalog.py
```

Test the root arcade menu and the game itself with `./scripts/serve.sh`. Once the website promotes that Daemoncade commit, Hugo reads `catalog.json` from the pinned submodule and creates the public card automatically.

## Cache verification

The game HTML should load the same version of every changed script and stylesheet. After publishing, compare the public asset content with the promoted Daemoncade commit and verify that versioned requests return the current files.
