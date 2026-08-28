# Game versions and release stages

Daemoncade versions each game independently. The repository itself does not need to share a game version.

Each `game.json` contains:

- `version`: a Semantic Versioning value such as `1.0.0`, `1.0.0-beta.1`, or `0.1.0-alpha.1`
- `release_stage`: `alpha`, `beta`, or `stable`
- `mobile_ready`: optional boolean capability tag. Set it to `true` only after the current build has touch-friendly controls and has been visually checked at a phone-sized viewport. Missing or `false` means mobile support is not yet claimed.

## Meaning of the stages

- **Alpha**: playable development build; mechanics, presentation, storage, or controls may still change substantially.
- **Beta**: reliably playable and ready for feedback; planned enhancement or polish remains before the stable release.
- **Stable**: the current release meets its intended scope and is suitable for general play.

## Incrementing versions

- Alpha iteration: `0.1.0-alpha.1` → `0.1.0-alpha.2`
- Beta iteration: `1.0.0-beta.1` → `1.0.0-beta.2`
- Beta promotion: `1.0.0-beta.2` → `1.0.0`
- Backward-compatible fix: `1.0.0` → `1.0.1`
- Backward-compatible feature: `1.0.1` → `1.1.0`
- Incompatible redesign or storage change: increment the major version

Version changes should describe changes players can observe. Small repository-only maintenance does not require every game to receive a new version.
