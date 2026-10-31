# Sinkhole City 1.0.0 Stable — retained RC2 qualification record

The owner accepted the v1 scope and authorized Stable publication on 2026-10-31. Stable promotes the qualified `qualification52` gameplay, with version/entry/catalog/install updates and no physics/progression changes. The RC2/RC1 snapshots and the original qualification findings below are retained for traceability; physical-device/uncoached-user limitations remain limitations, not newly claimed tests. Current release notes: `../RELEASE-1.0.txt`.

## RC2 feature-freeze pass

No new features or reward/progression rules. Optional rim thumbnails now run only in open Collection, one missing image per frame, cancel when closed, and fall back to icons on failure; they no longer block startup or results. HUD writes are capped at 10 Hz while fixed 60 Hz physics remains unchanged. New primary-touch installs start at 30 FPS, preserving existing/manual 30/60 choices. Alien's separate raised grove patches and hard basin are replaced by one continuous blended terrain, and ground batching now retains/disposes owned material flags correctly.

175 unit/runtime/package tests pass. Thirteen native Chrome checks cover optional-preview failure/cancellation, 30/60 gameplay equivalence, UI, all character previews/growth, contacts, full Infinity/empty ending, six-world checkpoint restores, audio, wrapper and boot recovery. Tests are against an HTTP/1.1 qualification server; the earlier tiny HTTP/1.0 preview server is not used as evidence of server reliability. All eighteen actual-model diagnostic routes complete across three seeds (54/54); typical non-Infinity diagnostic times are 42–154 seconds, full Infinity 826–894 seconds. These are omniscient automated routes, not human difficulty/journey acceptance. Quotas remain unchanged. See `RELEASE-QUALIFICATION.txt` and `qualification52-pacing.json` for reproducible evidence, limits and sign-off steps.

The owner confirmed on 2026-10-31 that the soundtrack is project-owned and cleared for redistribution with the open-source game. That rights hold is closed; `ASSET-PROVENANCE.txt` and the inventory record the confirmation and hashes. Physical-device endurance, human art/pacing acceptance and actual deployed-origin install/update/rollback checks remain open.

## Earlier revision history (superseded by RC2 qualification above)

`characters49` introduced Frog/Dragon; `menagerie50` completed the ten-character rim collection plus classic Mint, with true-model collection previews. They preserve all reward IDs and thresholds and do not change the swallowing model. At that point there were 173 unit/runtime/package checks. The separately retained RC1 snapshot represents `release48`.

`sculpt51` corrects the rejected serpent anatomy and differentiates Cat/Bat/Sun Beast/Golem faces. Qualification includes 174 unit/runtime/package checks, native collection/growth/resource and mastery checks, and actual in-scene phone/larger detail art review. One native run timed out waiting for Collection; an isolated rerun passed. That timeout's cause was not established. Human visual acceptance is still required; green technical checks did not make the first silhouette successful.

## Candidate entry points

- Game: `/games/sinkhole-city/metro/`
- Install/app wrapper: `/games/sinkhole-city/app-expedition.html?install=1`
- Manifest: `/games/sinkhole-city/expedition-manifest.json` (game artwork icon, separate candidate identity; short name “Sinkhole RC”).
- Existing `/games/sinkhole-city/app.html`, its manifest and public beta version remain unchanged.
- Standalone builder: `node scripts/package-sinkhole.mjs /absolute/new-output-directory`. The root opens the candidate app wrapper; its inventory includes runtime sources, wrapper, manifest, icon, model textures, music and notices, with hashes. The package is network-served; offline support is not advertised.

## Retained RC1 foundations

- Versioned, bounded campaign/Free Roam checkpoints every ten simulation seconds and on suspension/pause. The seed, consumed IDs, elapsed time, growth, objectives, moving actors, marine schools, committed bodies and Infinity's ending are retained. Contact geometry is rebound after model loading. Arena remains an uninterrupted score match, not a resumable campaign run.
- Resume opens paused with audio stopped. Unfinished-run replacement requires confirmation; explicit End run, completion and campaign import clear the checkpoint. Career progress is independent of that checkpoint. Storage errors leave an in-session game playable and warn that the run cannot be persisted.
- Six-world exact round-trip and forward-simulation comparisons, native-model reloads, pose/contact recovery, incompatible/corrupt-state rejection and ending recovery tests.
- Intake stress coverage for 48 shape/orientation cases when the hole moves away after commitment, plus oversized/edge-graze rejection. These checks passed without changing accepted fall physics.
- Quiet final-object minimap highlights (eight or fewer remain), rather than reintroducing instructional popups.
- World-anchored, derivative-limited matte material variation, with space/Infinity excluded. Alien groves now blend into the surrounding terrain instead of ending at hard patch outlines. No new downloadable art or collectible models.
- Singularity mastery rim at 54 medals, with an authored static vortex silhouette. Previous rewards and saves retain their IDs/thresholds; no gameplay advantage.
- Installable candidate wrapper loads the actual 3D game, respects standalone/fullscreen chrome hiding, and passes parent suspension into checkpoint/pause handling. It deliberately does not overwrite the legacy beta app.
- Independent module-boot recovery prevents a broken import from stranding the title on “Loading”; stalled model loads time out after twenty seconds and retain retry/progress. Failure injection verifies both cases. The separate-package test also exposed connection resets from the tiny default local HTTP server; candidate qualification uses HTTP/1.1 with an appropriate request queue rather than treating retries as proof of reliability.

## Required human/device sign-off — still open

Current local evidence on 2026-10-31: 175 unit/runtime/package tests pass, plus the RC2 native checks listed above. These are automated desktop/phone-viewport checks (software rendering where configured), not physical iPhone/Android FPS, thermal or human-enjoyment results. Earlier RC1 packaged checks are historical evidence, not a substitute for the separately served RC2 artifact checks.

### New-player observation

Observe five people without coaching. For each, record time to first intake, when fit/controls are misunderstood, first voluntary retry/continuation, where boredom begins, and one remembered event. Review whether each world's traffic/marine/relay/orbital behavior is apparent, rather than simply another collection quota. Do not tune quotas or unlock gates from automated optimal-route times alone.

Play Infinity uninterrupted from atoms to the empty ending and once with an app termination/reload midway. Assess whether 18 ranges are readable and whether the long journey needs shorter selectable replay checkpoints. The current build preserves a run but does not add chapter skipping.

### Visual/audio acceptance

Review each world on a phone at initial, middle and maximum size. Focus on recognizable silhouettes, foreground density versus empty travel, landmarks, shadows, relative scale and rewarding intake. The matte/blending changes are a cohesion pass, not a claim that every model is final production art. Alien/Orbit/Infinity need particular human art review. Listen on phone speakers and headphones at normal hardware volume; check music/effects balance, mute persistence and interruption silence.

### Physical-device matrix

- iPhone: browser and Home Screen app; 15 minutes of play/world switching, portrait/landscape, lock/unlock, app switch, background audio interruption, forced termination and checkpoint recovery.
- Android: at least one mid-range physical device, with the same exercise. Desktop touch emulation is not Android qualification.
- Desktop: Chrome, Safari and Firefox; keyboard, resize, pause, loading failure/retry and graphics-context interruption.
- Proposed acceptance: a sustainable 30 FPS mode on the supported mid-range phone, no progressive memory/resource growth or repeated freezes, and usable touch controls/menus after interruptions. Qualify 60 FPS separately; do not infer it from desktop triangle counts.

### Distribution and final cutover

Soundtrack distribution is owner-confirmed as of 2026-10-31; confirmation and hashes are retained in `ASSET-PROVENANCE.txt`. Review the included GPL source/notices and third-party MIT/CC0 notices before publication. Back up and test Expedition progress transfer; legacy-beta saves are not silently converted or overwritten. Active-run checkpoints are local to their current storage context, not part of the portable medal/record backup.

After the above sign-offs: make a versioned release snapshot, verify the separately served package, switch the default catalog/app route deliberately, test install/update on the deployed origin, then mark 1.0 Stable. Keep a rollback artifact and preserve previous saves. No new worlds, currencies, multiplayer or additional modes are needed to clear these gates.
