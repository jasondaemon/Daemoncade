# Deployment

Daemoncade and jasondaemon.net have separate responsibilities.

- This repository owns the playable game directories, shared runtime files, game metadata, icons, and portable local arcade menu.
- The website repository owns the Games page shell, navigation, launcher behavior, and surrounding site design. It loads the catalog and icons from the independent Daemoncade service.
- Kubernetes serves the exact `/games/` page from the website and routes its catalog, shared assets, and `/games/<slug>/` paths to Daemoncade behind the same public origin.

## Promotion to jasondaemon.net

The production publisher checks this repository's `main` branch every five minutes.

1. Finish and test the Daemoncade commit.
2. Push Daemoncade `main` to GitHub.
3. Wait for `CronJob/daemoncade-publish`, or create an immediate job from it.
4. Confirm the publish job reports the expected commit and check the affected public game URLs from outside the network.

Website and game releases are independent. Roll back a game release by reverting Daemoncade `main`; the next publisher run atomically synchronizes that revision.

## Adding a game to the catalog

Add `game.json` and its referenced icon under `games/<slug>/`, then rebuild the checked-in catalog and game-list documentation:

```sh
./scripts/build-catalog.py
```

Test the root arcade menu and the game itself with `./scripts/serve.sh`. Once published, the website fetches `catalog.json` dynamically and creates the public card without a Hugo rebuild.

## Cache verification

The game HTML should load the same version of every changed script and stylesheet. After publishing, compare the public asset content with the promoted Daemoncade commit and verify that versioned requests return the current files.
