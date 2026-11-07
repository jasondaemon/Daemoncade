# LAN development builds

Project hub: https://dev.jasondaemon.net/

Daemoncade's complete repository and game menu:
https://dev.jasondaemon.net/Daemoncade/

`codex/dev` is the LAN deployment branch. Its publisher checks for new
commits every minute and atomically activates complete snapshots. The hub
shows the current branch/commit; `/Daemoncade/_dev-build.json` has details.
Only committed and pushed changes appear there. This is not production,
does not publish `main`, and has separate browser storage from the public
site. Dev responses are not cached. Legacy `/games/` links stay in the dev
project through compatibility redirects.

## Publish a feature for testing

Develop and commit on your normal `codex/<feature>` branch. Then:

```sh
git fetch origin
git switch codex/dev  # first time: git switch --track origin/codex/dev
git merge codex/my-feature
git push origin codex/dev
```

Wait for the hub's commit label to update, usually within a minute plus
clone/publish time. A failed publish leaves the previous build live.
Do not force-push to get around an unmerged deployment branch.

## Promote tested work to production

```sh
git switch main
git pull --ff-only
git merge codex/dev
git push origin main
```

The existing production publisher follows `main` independently and serves
https://www.jasondaemon.net/games/. Update game versions/catalog and run
the appropriate checks before promotion. Roll back by reverting the relevant
commit on the appropriate branch and pushing, not by erasing player saves.

The dev hub is LAN-only. Its ingress is `192.168.62.61`; `.1` is the UniFi
router/admin UI. A client manually pointing this hostname at `.1` must
correct its DNS override. SonusTemper and future apps will have their own
subdirectories, services/data and deployment branches, not share this repo's
root. Infrastructure: k8s-platform/apps/dev-platforms/.
