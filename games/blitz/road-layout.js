export const ROAD_TILE_LENGTH = 8;
export const ROAD_TILE_COUNT = 18;
// Camera is at z=31, looking forward. Recycle only once the whole tile
// (including its trailing edge) is behind the camera, never in the foreground.
export const ROAD_RECYCLE_Z = 40;

export function roadTileZ(index, distance) {
  const span = ROAD_TILE_COUNT * ROAD_TILE_LENGTH;
  const offset = index * ROAD_TILE_LENGTH - distance;
  return ROAD_RECYCLE_Z - ((offset % span + span) % span);
}
