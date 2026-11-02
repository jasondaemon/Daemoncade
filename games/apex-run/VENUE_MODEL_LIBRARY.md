# Apex venue model identity

Runtime modules use a shared visual language rather than unrelated props:

- **Structure:** graphite metal frames, pale concrete slabs and restrained cyan/gold timing accents.
- **Scale:** all authored modules are in metres. Roadside foundations remain at least 9.5 m beyond
  the road edge at the start; grandstand tests include roofs, paving and walls, not only anchors.
- **Families:** paddock garage bays and timing pavilion; stepped grandstands; full-frame timing
  gantries; bridge piers/caps; barrier islands; reservoir terraces, buttresses, service deck and
  control building.
- **Performance:** repeated bays, windows, columns, light strips and reservoir buttresses use
  `InstancedMesh`; Low quality controls distant scenery, shadows and rail tessellation without
  changing course physics.
- **Collision:** smooth authored road/rail meshes remain authoritative. Architecture is visual
  unless explicitly declared as a gameplay obstacle; visible obstacles have matching simple
  colliders and escape tests.

New venue pieces should extend these families before introducing a new material palette or an
unrelated low-poly prop. External assets require a recorded source/license and must outperform the
authored module in chase view at the same measured render budget.
