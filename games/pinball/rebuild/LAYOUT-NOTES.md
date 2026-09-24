# Playfield layout and phone framing

## Beta 3 redesign

Player feedback exposed a weakness in the old acceptance criteria: contact with a flipper did not prove the ball could roll onto its bat and be shot. The new test sweeps actual flip timings from return-lane feeds and requires objective coverage, not just contact. The right heel trap was reproduced locally before changing the assembly.

The new layout uses two compact side ramps rather than a central enclosing loop; an open shot fan leads to a central garage bank, left mode scoop, outer orbit and right spinner. Four upper pops and three rollovers provide a separate launch area. Ramps return through constrained rail transport only after the ball physically climbs the entrance. No target-directed aiming or teleport into a ramp is used. Flipper strength is deliberately arcade-tuned, using bat contact position to vary shot angle.

References: [Bally's original Attack from Mars playfield directory and photograph](https://www.planetarypinball.com/mm5/Williams/games/atmars/playfield.html), [Bally's description of concurrent objectives](https://www.planetarypinball.com/mm5/Williams/games/atmars/index.html), and [Stern's Godzilla feature description](https://shop.sternpinball.com/products/godzilla-pinball). These informed shot variety, open aiming space and distinct goals; no art or table geometry was copied.

The LED panel no longer reserves gameplay space. A two-second display sequence can run only when all balls are captured/drained. Timers and pending launches wait with it. Live jackpots use a compact message instead; fixed-view and reduced-motion options remove the pan. The side scoop offers Checkpoints, Redline and Combos, while unique rollovers qualify a one-per-game two-ball mode.

## Beta 2 history

Earlier player feedback showed an oversized side drain, no usable return behind the slings, a floating/slow ball and a misaligned splash. The following records that earlier pass; Beta 3 supersedes its loop, side-guide and speed-cap details.

## Reference and interpretation

Stern's [Guardians of the Galaxy service manual](https://sternpinball.com/wp-content/uploads/2023/11/Guardians_LE_Pre_web.pdf) documents separate inlane/outlane devices, slingshots, flippers, ramp exits and a recommended physical pitch of 6.5°. These are reference principles, not dimensions copied from a commercial table. Our arcade simulation uses scaled world units; its acceleration constants are not a calibrated real-machine pitch.

The lower playfield should distinguish an intentional outlane drain from a protected inlane return. A return needs clearance for the ball, collision-rail thickness and lateral motion, and should guide toward the flipper heel. The back of a slingshot should not fire its kicker into that return. Validate the complete ball route, not just the drawing.

## Changes

- Fixed `.menu` also matching `body.menu`, which had applied a positioned card to the entire game.
- Replaced the nested splash card with a full-stage overlay, container-relative title sizing and smaller HUD framing.
- Enlarged clear return channels behind both slings; moved their active faces inward and shortened the sling bodies. Added a left outer guide so the side region is not one oversized drain.
- Only inward-facing sling edges now activate a kicker; rear and base edges remain passive solid rubber.
- Surface gravity 22 → 32 and downhill acceleration 3.8 → 6.2, retaining the 24-unit speed cap and 240 Hz CCD physics. Weak ramp shots can roll back; strong entries at 23–27 units/s are tested to complete.
- Added regression checks for splash containment and both return lanes at three entry speeds. Automated checks do not substitute for real-phone feel testing.
