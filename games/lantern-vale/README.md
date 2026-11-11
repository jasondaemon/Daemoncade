# Lantern Vale · The shared dawn

A full-window Canvas adventure alpha about a keeper carrying Mira’s last lantern. Restore three heart relics and dawn at the northern beacon, then choose **Follow the distant lights** to reach six distant lands and the Far Lantern resolution. The original route remains playable unchanged.

The installed world contains 264 areas: 141 overworld scenes, the original dungeon halls and optional chambers, and nine additional 12-room dungeon depths. Lantern Confluence links Riverreach, Cinderstep, Windscar, Frostmere, Nightbloom and Dawncoast. Explore settlements, shops, hazards, keeper caches, regional circuits and equipment shortcuts. Each depth contains a map, three light/shade circuits, earned equipment, refuge, secret reward, boss and return lift. The first three depths are reached from Confluence after the original beacon ending.

## Play

Open `games/lantern-vale/index.html` through the normal static deployment.

- Arrows/WASD move; Space/J strikes; L toggles the lantern; E interacts; Q drinks a five-heart tonic; X throws the earned returning sun-disc; K opens the journal; P pauses; R opens Journey.
- Begin in the western grove. Cross each dungeon bridge in light, touch its sun plate, defeat sentries for a key, defeat its warden and collect the heart. Return west to save. Raise the lantern at the northern beacon with three hearts.
- After the beacon, speak to regional witnesses and follow marked stairs. Set circuit controls to their displayed targets, then hold light or shade at their source. Dependent circuits protect the arena entrances; retreat remains available. Read each boss warning and strike during recovery.
- Relics strengthen the sword. Sen’s singing-reed quest earns the sun-disc. Keeper equipment opens marked roads and caches and protects matching hazards. Tonics, treasure and shops support exploration; purchases are optional and waystone healing is free.
- Journal pages show objectives, regional roads, dungeon exploration and equipment. Hold touch directions while using action buttons. Focus loss pauses and clears input; resuming requires fresh movement input.

## Checkpoints

Interact near a waystone to heal and save. The original save key remains `daemoncade.lantern-vale.waystone.v1`. Version-1 checkpoints migrate; expanded checkpoints preserve visited areas, equipment, quests, puzzle controls, enemy health and completion. Reload returns to the saved waystone with transient combat and input reset. Saves stay on this browser/device.

New journey replaces a checkpoint only when saving succeeds. Invalid saves and unavailable storage show feedback while allowing play. Clearing browser storage removes checkpoints.

## Artwork and validation

Gameplay uses original distributable local pixel-art raster terrain, directional keeper animation, enemies, named NPCs, landmarks, shoreline transitions, props, effects and nine boss families. See ART.md for provenance. Failed artwork loading offers retry and a basic map fallback. No dependencies, services, accounts or remote assets are required; the restrictive security policy remains intact.

The responsive full-window interface and short-landscape rules are implemented. `mobile_ready` remains false. Local deterministic traversal reaches the original ending, nine dungeon completions, all new overworld scenes, checkpoint reloads and final resolution without assigning player positions, health or inventory. See VALIDATION.md for commands and evidence limits. No human play duration, multi-day completion time, deployed visual approval, device usability or production readiness is claimed. DEVELOPMENT.md retains the earlier engine comparison and explains the scoped Canvas choice; no fresh framework research or migration is claimed.
