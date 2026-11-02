# Kenney Racing Kit assets

Selected models from **Racing Kit 1.2**, created and distributed by Kenney.

- Source archive supplied by the user: `Racing Kit (1.2).zip`
- Archive SHA-256: `103acf8a85a04e94e2d3a9933fbcea12e9422c14d5e364eb013019a882af7f48`
- Original source: <https://kenney.nl/assets/racing-kit>
- License: CC0 1.0. See `License.txt` in this directory.

Only the models used by Apex Run and their matching binary buffers are copied
into the game:

- `grandStandCovered` — scaled and placed as Summit venue architecture.
- `pitsOffice` — scaled and placed as the Summit timing/marshal building.
- `pitsGarage` and its `tankcoBanner.png` material image — the close-view
  paddock garage beside Summit's opening chicane.
- `overheadRound` — the paddock timing gantry over the narrowed racing line.
- `barrierRed` and `barrierWhite` — scaled as visual markers around the
  authored attack-line obstacle columns.

The original meshes and materials are retained. Runtime transforms adapt their
scale, position, rotation and shadow settings to the Apex Run scene. Road and
vehicle collision do not depend on these decorative meshes; intentional obstacle
collision uses explicit matching runtime colliders.
