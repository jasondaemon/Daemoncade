# Apex Run implementation plan

Original single-player stadium time attack inspired by the short-form, restart-heavy
structure of Trackmania. No Trackmania code, names, art, audio, or track layouts are used.

## Research decision

Trackmania's useful design target is not a checklist of stunts: Ubisoft describes short,
pick-up-and-play tracks as driving puzzles where momentum, angle, surface, jumps, and instant
restart matter. Its private tire and steering formulas are not available, so this project
targets the same readable time-attack loop with independently tuned physics rather than
claiming exact simulation parity.

| Candidate | License/status | Decision |
| --- | --- | --- |
| Three.js r185 | MIT; already vendored here | Use for WebGL rendering, cameras, lighting, and procedural geometry. |
| Rapier 3D | Apache-2.0; already vendored here | Use its supported ray-cast vehicle controller; it gives a physical chassis, suspension, contact, and tunable grip without fragile rigid wheel joints. |
| JoltPhysics.js | MIT | Strong fallback if Rapier cannot support future wall contact or loops; larger WASM/API integration is unnecessary for the first proof. |
| Trigger Rally | GPLv3 code with separately restricted content | Do not fork. Its assets/content are not a clean reusable foundation and its existing game architecture is broader than this slice. |
| Sketchbook / community vehicle demos | MIT or project-specific | Reference only. They illustrate controller patterns but are archived demos, not a maintained game foundation. |

Primary references:

- Ubisoft overview: https://news.ubisoft.com/en-us/article/31ZNGwlldXOtDzLdapSG3k/trackmania-defy-gravity-at-high-speeds-on-july-1
- Rapier vehicle controller: https://rapier.rs/docs/user_guides/javascript/vehicle_controller/
- Three.js Rapier vehicle example: https://threejs.org/examples/physics_rapier_vehicle_controller.html
- Three.js license: https://github.com/mrdoob/three.js/blob/dev/LICENSE
- Rapier license: https://github.com/dimforge/rapier/blob/master/LICENSE

## Milestone 1: physics proof

- Fixed 120 Hz simulation independent of render rate.
- Rapier ray-cast suspension on a dynamic chassis, with tunable engine, brake, steering,
  lateral grip, and aerodynamic downforce.
- One 35–60 second stadium course with a fast straight, technical bend, bank, jump,
  three ordered checkpoints, and a finish gate.
- Chase camera, timer, speedometer, instant full restart, checkpoint recovery, and local PB.
- Procedural geometry only; laptop-friendly WebGL rendering and quality scaling.

## Acceptance gates

1. Start, complete, restart, and checkpoint-recover loops work repeatedly without reload.
2. Checkpoints cannot be skipped and the finish does not count out of order.
3. Equivalent recorded input at 30/60/144 render FPS stays within 0.1 seconds and 0.5 m.
4. Car can jump under gravity, land on suspension, slide under excess lateral load, and
   lose speed off the racing surface.
5. Personal best persists locally; stored values are validated before use.
6. No runtime network requests; all engine and physics files are vendored in Daemoncade.

## Later milestones

- PB ghost replay, medal targets, gamepad/touch controls, audio, particles, and two more tracks.
- Loops or wall rides only after a dedicated contact/adhesion prototype proves predictable.
