# Beta 2: lower playfield and phone framing

Player feedback showed an oversized side drain, no usable return behind the slings, a floating/slow ball and a misaligned splash.

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
