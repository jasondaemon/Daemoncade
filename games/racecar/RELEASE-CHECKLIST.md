# Racecar 1.0.0-beta.2 — build 39

## Verified for beta

- 102 automated tests: career saves/economy/admission, handling, geometry,
  vehicle models, gesture cancellation, audio cleanup and hover collectibles.
- Complete isolated browser flow: purchases, upgrades, paint, difficulty
  isolation, admission, reload, full driven race, championship payout, garage.
- Renderer stress: 30 scene rebuilds and 150 previews, stable at 390 geometries
  and 7 textures across six cycles. Not a substitute for a physical-device soak.
- Separate browser suites cover four viewport sizes, five environments,
  gestures and pause, hover code/purchase/persistence, and infinite-nitro HUD.
- Third-party car/nature CC0 licenses retained; Three.js license retained.
  Shared Circuit Rush music assets are already tracked in this repository.
- Runtime modules and stylesheet use build-39 cache queries.
- Model and economy saves remain compatible with `racecar_careers_v1`.

## Stable acceptance still required

- Physical iPhone Safari and Android Chrome: gestures, audio unlock, rotation,
  interruption/resume and comfortable steering sensitivity.
- Sustained frame pacing/thermal behavior on a modest phone.
- Human progression sessions: advanced players, all difficulty profiles,
  endgame pricing and full championship competitiveness.
- Final visual and sound approval from the owner.

## Promotion / rollback

Publishing follows docs/DEPLOYMENT.md. Prior main was
`a3222a3` (Release Casey 1.0 stable). Revert only the Racecar beta release
commit to roll back; do not reset main or discard subsequent unrelated work.
Keep the release marked beta until the Stable acceptance checks are signed off.
