# Apex Run CC0 visual assets

The following assets are redistributed under **CC0 1.0 Universal**. They are
used only by Apex Run's presentation layer; gameplay collision remains the
authored shared road/obstacle geometry.

## Poly Haven — Concrete Road Barrier

- Source: https://polyhaven.com/a/concrete_road_barrier
- License: https://polyhaven.com/license (CC0)
- Downloaded from Poly Haven's official `dl.polyhaven.org` host.
- Included: the official 1K glTF, shared binary, diffuse, OpenGL normal and ARM
  maps.
- Modification: runtime uniform scaling and placement at existing obstacle
  colliders. No geometry or physics changes.

## ambientCG — Asphalt 031

- Source: https://ambientcg.com/view?id=Asphalt031
- License: https://docs.ambientcg.com/license/ (CC0)
- Downloaded from ambientCG's official 1K JPG package.
- Included: color, OpenGL normal and roughness maps only. Displacement, AO,
  source scene and DirectX normal files were intentionally omitted.
- Modification: repeating UV scale, reduced normal strength, and quality-tier
  anisotropy. Low quality omits the normal map.

## ambientCG — Grass 004

- Source: https://ambientcg.com/view?id=Grass004
- License: https://docs.ambientcg.com/license/ (CC0)
- Downloaded from ambientCG's official 1K JPG package.
- Included: color, OpenGL normal and roughness maps only.
- Modification: large-scale repeating UV treatment across the authored terrain
  and basin. Low quality omits the normal map.

## Poly Haven — Modular Factory Facade (garage material only)

- Source: https://polyhaven.com/a/modular_factory_facade
- License: https://polyhaven.com/license (CC0)
- Included: only the official 1K garage diffuse, OpenGL normal and ARM maps.
  The 175K-triangle complete factory kit and its unrelated materials are not
  shipped.
- Modification: applied to the existing physically scaled seven-bay paddock
  facade, tinted to Apex Run's white/graphite identity. Low quality omits the
  normal map.

## Poly Haven — Shrub 02 and Rock Moss Set 01

- Sources: https://polyhaven.com/a/shrub_02 and
  https://polyhaven.com/a/rock_moss_set_01
- License: https://polyhaven.com/license (CC0).
- Included: official 1K glTF geometry and PBR maps. The official shrub alpha
  mask is packed into the redistributed base-color PNG so glTF MASK rendering
  produces leaf cards rather than opaque rectangles.
- Modification: selected geometry is instanced with deterministic scale and
  rotation variation. Full placement bounds remain at least 12 metres beyond
  every road sample, stratified evenly across all four course quarters.

Total included transfer size is intentionally bounded to the selected models
and their optimized 1K JPG/PNG runtime maps (including the shrub alpha PNG); no
raw 4K packages or source DCC scenes ship with the game.

## Innerscene — Container Gantry Crane

- Source: https://www.innerscene.com/tools/library/3d-parts/container-gantry-crane-c8a04a92
- License: CC0 dedication embedded by the publisher in the distributed GLB.
- Runtime file: `innerscene/container-gantry-crane.glb` (6,777,512 bytes).
- Apex Run scales and grounds the model as a Harbor shipyard landmark. Low quality omits it; Medium disables its shadows.

## Poly Haven — Modular Factory Facade geometry selection

- Source: https://polyhaven.com/a/modular_factory_facade
- License: https://polyhaven.com/license (CC0)
- The Harbor bundle retains seven named garage/window/cornice modules from the official 1K glTF and its shared geometry buffer. Apex Run arranges five Medium or seven High bays; Low omits the complex.
- The complete 192-module source is not instantiated at runtime.

## Poly Haven — Ocean Buoy

- Source: https://polyhaven.com/a/ocean_buoy
- License: https://polyhaven.com/license (CC0)
- Official 1K glTF with diffuse, OpenGL-normal, ARM and emission maps. Apex Run grounds five Medium or eight High navigation buoys beside selected Harbor route sections; Low omits them.
