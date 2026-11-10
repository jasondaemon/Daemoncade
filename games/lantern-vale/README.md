# Lantern Vale — 0.1.0-alpha.1

A standalone five-room woodland adventure. Guide the keeper east, reveal the
Whisper Hollow bridge and rune key with the lantern, unlock Stone Watch, and
raise the lantern beside the beacon. Light attracts shadows at longer range;
turn it off to slip away or face them with short-range strikes. Six health
points and a brief flashing invulnerability window allow recovery after damage.

All artwork is original geometric Canvas drawing. No imported assets, fonts,
audio, dependencies, network calls, or persistent data. Repository GPL-3.0
licensing applies. The development branch includes `game.json` and an original
local generated WebP artwork for its dev-menu entry. Production catalog promotion remains
subject to separate review.

Menu artwork was generated with the built-in image-generation tool on
2026-11-09, then resized to 512x512 WebP. Art brief: an original hooded woodland
keeper carrying an amber lantern along a mossy forest path, with a ruined beacon
and hidden bridge; pixel-art-inspired storybook style, deep teal and amber,
readable as a square thumbnail, no text or existing franchise characters.

## Run and test

From the repository root:

```sh
./scripts/serve.sh
# Open http://127.0.0.1:4174/games/lantern-vale/
node --test games/lantern-vale/rules.test.mjs
node --test games/lantern-vale/rules.test.mjs games/meddle/rules.test.mjs games/meddle/support-shadow.test.mjs games/meddle/support-prototype.test.mjs games/meddle/renew-land-prototype.test.mjs
node --check games/lantern-vale/game.mjs
node --check games/lantern-vale/rules.mjs
```

Recorded validation: all five test files passed (zero failures), including the
six adventure rule scenarios and complete simulated route; both syntax checks
passed. No Meddle files were changed. Running `./scripts/serve.sh` was
blocked by the execution sandbox: socket creation returned PermissionError
(Operation not permitted), so HTTP delivery was not verified here. Browser QA was **not performed**: no browser
or browser automation tool was available. Rule tests do not establish visual QA.

## Controls

- Arrows / WASD: move; diagonal speed matches straight movement.
- Space / J: directional strike (tap again after cooldown).
- L: lantern; P: pause/resume; R: restart immediately.
- Touch: hold direction buttons and tap Strike or Lantern. Buttons also support
  keyboard focus and activation. Restart resets every room and enemy.
- Blur or hidden tab pauses automatically; explicitly resume to continue.

## Browser review checklist (pending)

- Open directly over HTTP. Verify no console errors or external requests.
- Follow the objective east through all five rooms. In the hollow, verify the
  center bridge blocks passage without light and reveals with light. Collect
  the key on the east side. Open the watch gate and light the final beacon.
- Approach shadows with lantern on/off; verify different pursuit ranges. Face
  and strike an enemy twice; verify cooldown, health loss and flashing immunity.
- Complete the ending, restart, lose all health, and restart again. Verify all
  enemies, key, gate, lantern and health reset.
- Test every keyboard mapping, diagonal movement, wall collision and backtracking.
- On a touch device, hold movement while tapping actions. Release outside the
  button and cancel touches; movement must stop. Test simultaneous directions.
- Pause/resume manually, switch tabs, and blur while holding movement; verify
  paused state and no movement until fresh input after explicit resume.
- Resize desktop, portrait/landscape phone and short landscape viewports, with
  high-DPI rendering and browser zoom. Check readable objectives, accessible
  buttons, correct canvas aspect ratio and no document or parent scrolling.
- Inspect at least Chrome and Firefox; test iframe viewport fit when integration
  is separately approved.

## Limitations

Small fixed map, four simple pursuit enemies, no sound, saves or remapping.
Canvas playfield requires sight; text objectives and named buttons are provided,
but this is not a screen-reader-playable adventure. Touch layout and visual
polish remain subject to the browser checklist above. Hidden bridges can become
impassable beneath the keeper when the lantern is switched off; relight to move.
