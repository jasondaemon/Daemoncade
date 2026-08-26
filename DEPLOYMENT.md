# Deployment

Daemoncade and jasondaemon.net have separate responsibilities.

- This repository owns the playable game directories and their shared runtime files.
- The website repository owns the Games catalog, cards, navigation, launcher, and surrounding site design.
- The website includes a pinned Daemoncade commit as the `static/games` Git submodule.

## Promotion to jasondaemon.net

Publishing a commit here does not change production by itself.

1. Finish and test the Daemoncade commit.
2. In the `www.jasondaemon.net` repository, update the `static/games` submodule to that exact commit.
3. Test the Hugo site locally.
4. Commit the submodule-pointer change in the website repository.
5. Push the website `main` branch to its Forgejo origin.
6. The existing Hugo publisher webhook builds that exact website commit and recursively initializes the pinned games submodule.
7. Confirm the Kubernetes publish job completes and check the affected public game URLs from outside the network.

This deliberate promotion gate keeps unfinished game work out of production and makes rollback a normal website commit revert.

## Adding a game to the public catalog

Adding a directory here makes its files deployable, but it does not create a website card. Add the game's title, slug, summary, category, controls, icon, and availability to the website's Games data, then test it through the launcher.

## Cache verification

The game HTML should load the same version of every changed script and stylesheet. After publishing, compare the public asset content with the promoted Daemoncade commit and verify that versioned requests return the current files.
