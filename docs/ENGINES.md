# Game engines and migration candidates

Daemoncade vendors runtime dependencies locally. An engine should be adopted when it replaces meaningful rendering, physics, input, timing, or scene-management code—not merely to standardize every game.

## Available engines

- **Phaser 3.90 (Arcade Physics build):** WebGL-first game framework used by Neon Breaker. Best for action games with many moving bodies, collision rules, effects, multiple levels, or combined keyboard/pointer/touch input.
- **PixiJS 7.4:** GPU renderer used by Canyon Crawler and Orbit Run. Best when a game needs accelerated presentation but already has suitable game logic and collision handling.
- **Planck.js:** rigid-body physics used by Pinball. Retain it there; pinball behavior benefits from its dedicated Box2D-style simulation.
- **Native DOM or Canvas:** still appropriate for board games, word games, fixed-grid puzzles, and very small deterministic loops.

## Phaser migration priority

### Strong candidates

| Game | Why Phaser fits |
| --- | --- |
| Paddle Duel | Paddle/ball collision, multiple modes, responsive pointer input, and fixed-aspect scaling closely match Arcade Physics. |
| Jungle Jumper | Platform collision, moving hazards, collectibles, and level structure are native Phaser territory. |
| Road Hopper | Lane hazards, timed movement, collision groups, and progressive stages would become simpler and more reliable. |
| Chilopodophobia | Many moving segments, projectiles, obstacles, and collision callbacks benefit from pooled Arcade Physics groups. |
| Missiles Away | Projectile paths, blast areas, targets, particles, and waves would benefit from Phaser timing and object pools. |
| Racecar | Scrolling world objects, collision groups, speed progression, and touch controls are a clean Phaser migration. |
| Spacefighter | Dense projectiles, enemy waves, pickups, bosses, and effects suit Phaser groups, timers, and pooling. |

### Evaluate when actively refining

| Game | Recommendation |
| --- | --- |
| Space Defender | Phaser would help, but the game is already beta; migrate only if performance or planned wave/effect work justifies regression testing. |
| Space Rocks! | Phaser is suitable for wraparound bodies and projectiles, but the beta implementation should not be rewritten without a concrete gameplay benefit. |
| Sinkhole City | Phaser could accelerate rendering and collision queries, but this is a large beta rewrite. Profile first and migrate only around a planned major enhancement. |
| Casey | Complex custom systems make this a potentially valuable but high-risk migration. Treat it as a dedicated project. |
| Blitz! | Phaser may help the combat loop, but its existing art and progression architecture should be assessed before replacing the renderer. |

### Keep the current approach

| Game | Reason |
| --- | --- |
| Canyon Crawler | Already uses the vendored PixiJS renderer. Improve its existing implementation rather than migrate by default. |
| Orbit Run | Already uses PixiJS and has a suitable custom circular movement model. |
| Pinball | Already uses Planck.js, which is a better fit for physical pinball behavior than Arcade Physics. |
| Blockfall | Fixed-grid puzzle logic and small canvases do not justify a 1 MB engine. |
| Snake | A tiny fixed-step grid simulation is clearer without an engine. |
| Mines, Dots and Boxes, and Hangman | DOM/grid interaction is the right abstraction. |

## Migration order

After Neon Breaker is accepted, migrate only while refining a named game. The recommended order is Paddle Duel, Jungle Jumper, Road Hopper, Chilopodophobia, Missiles Away, Racecar, then Spacefighter. Each migration should retain the existing playable version until the engine-based replacement passes control, gameplay, storage, mobile, and performance checks.
