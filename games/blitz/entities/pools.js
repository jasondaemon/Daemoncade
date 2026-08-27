export function createPool(size, factory) {
  const items = Array.from(
    { length: size },
    () => ({ active: false, ...factory() }),
  );
  return {
    items,
    alloc() {
      const free = items.find((item) => !item.active);
      if (!free) return null;
      free.active = true;
      return free;
    },
    each(fn) {
      for (const item of items) {
        if (item.active) fn(item);
      }
    },
    reset() {
      for (const item of items) item.active = false;
    },
  };
}

export function spawnBullet(pool, payload) {
  const bullet = pool.alloc();
  if (!bullet) return null;
  Object.assign(bullet, {
    x: payload.x,
    z: payload.z,
    vx: payload.vx || 0,
    vz: payload.vz,
    damage: payload.damage,
    ttl: payload.ttl || 2.5,
    pierce: payload.pierce || 0,
    kind: payload.kind || "player",
    radius: payload.radius || 2,
  });
  return bullet;
}

export function stepBullets(pool, dt, maxZ) {
  pool.each((bullet) => {
    bullet.ttl -= dt;
    bullet.x += bullet.vx * dt;
    bullet.z += bullet.vz * dt;
    if (bullet.ttl <= 0 || bullet.z < 0 || bullet.z > maxZ + 20) {
      bullet.active = false;
    }
  });
}

export function spawnCoin(pool, payload) {
  const coin = pool.alloc();
  if (!coin) return null;
  Object.assign(coin, {
    x: payload.x,
    z: payload.z,
    vz: payload.vz,
    value: payload.value || 1,
    ttl: payload.ttl || 10,
    vx: payload.vx || 0,
  });
  return coin;
}
