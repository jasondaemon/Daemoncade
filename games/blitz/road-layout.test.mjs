import test from 'node:test';
import assert from 'node:assert/strict';
import { ROAD_TILE_COUNT, ROAD_TILE_LENGTH, roadTileZ } from './road-layout.js';

test('road stays continuous from the distance through the camera across wrap boundaries', () => {
  for (const distance of [0, .001, 7.999, 8, 8.001, 143.999, 144, 144.001, 10000]) {
    const centers = Array.from({length: ROAD_TILE_COUNT}, (_, i) => roadTileZ(i, distance)).sort((a,b)=>a-b);
    for (let i=1; i<centers.length; i++) assert.ok(Math.abs(centers[i]-centers[i-1]-ROAD_TILE_LENGTH)<1e-8);
    assert.ok(centers[0]-ROAD_TILE_LENGTH/2 <= -96);
    assert.ok(centers.at(-1)+ROAD_TILE_LENGTH/2 > 31);
  }
});

test('tiles move forward smoothly and only recycle wholly behind the camera', () => {
  for (let i=0; i<ROAD_TILE_COUNT; i++) {
    for (let distance=0; distance<300; distance+=.1) {
      const before=roadTileZ(i,distance), after=roadTileZ(i,distance+.1);
      if (after < before) assert.ok(before-ROAD_TILE_LENGTH/2 > 31);
      else assert.ok(Math.abs(after-before-.1)<1e-8);
    }
  }
});
