import test from "node:test";
import assert from "node:assert/strict";
import { VehicleFactory } from "./vehicle.js";
const setup = () => {
  const factory = new VehicleFactory(),
    car = factory.create();
  return {
    factory,
    car,
    actor: { id: "player", x: 0, z: 0, speed: 20, turnRate: 0 },
    point: { x: 0, y: 0, heading: 0 },
    run: { time: 0 },
  };
};
test("3D car faces the track tangent and all wheels stay grounded", () => {
  const s = setup();
  for (const heading of [0, Math.PI / 2, Math.PI, Math.PI * 2]) {
    s.factory.update(s.car, s.actor, { ...s.point, heading }, s.run);
    assert(Math.abs(s.car.rotation.y + heading + Math.PI / 2) < 1e-8);
  }
  for (const w of s.car.userData.vehicle.wheels)
    assert.equal(w.pivot.position.y, 0.39);
  s.factory.release(s.car);
});
test("wheel spin follows distance and pause freezes the complete pose", () => {
  const s = setup();
  s.factory.update(s.car, s.actor, s.point, s.run);
  s.actor.z = 10;
  s.run.time = 1;
  s.factory.update(s.car, s.actor, s.point, s.run);
  const v = s.car.userData.vehicle;
  assert(
    Math.abs(v.wheels[0].spin.rotation.x - (-(10 / 0.38) % (Math.PI * 2))) <
      1e-9,
  );
  const snapshot = () =>
    JSON.stringify([
      v.body.rotation.toArray(),
      v.body.position.toArray(),
      v.wheels.map((w) => [w.pivot.rotation.y, w.spin.rotation.x]),
    ]);
  const before = snapshot();
  s.factory.update(s.car, s.actor, s.point, s.run);
  assert.equal(snapshot(), before);
  s.factory.release(s.car);
});
test("front wheels steer, rear wheels do not; braking lights brighten", () => {
  const s = setup();
  s.factory.update(s.car, s.actor, s.point, s.run);
  s.run.time = 1;
  s.actor = { ...s.actor, speed: 10, turnRate: 0.3, z: 10 };
  s.factory.update(s.car, s.actor, s.point, s.run);
  const v = s.car.userData.vehicle;
  assert(v.wheels.filter((w) => w.front).every((w) => w.pivot.rotation.y < 0));
  assert(
    v.wheels.filter((w) => !w.front).every((w) => w.pivot.rotation.y === 0),
  );
  assert.equal(v.brakes.emissiveIntensity, 3);
  s.factory.release(s.car);
});
test("reduced effects keeps steering and spinning but removes body sway and exhaust", () => {
  const s = setup();
  s.actor.turnRate = 0.5;
  s.actor.z = 20;
  s.run.boosting = true;
  s.factory.update(s.car, s.actor, s.point, s.run, true);
  const v = s.car.userData.vehicle;
  assert.equal(v.body.rotation.x, 0);
  assert.equal(v.body.rotation.z, 0);
  assert.equal(v.exhaust.visible, false);
  assert.notEqual(v.wheels[0].spin.rotation.x, 0);
  s.factory.release(s.car);
});
test("vehicle variants share geometry and have bounded draw calls", () => {
  const f = new VehicleFactory();
  for (const type of ["coupe", "van", "truck", "jeep", "exotic"]) {
    const c = f.create(0x2478de, type);
    let count = 0;
    c.traverse((o) => {
      if (o.isMesh) {
        count++;
        assert(o.geometry.attributes.position.count > 0);
      }
    });
    assert(count <= 18);
    f.release(c);
  }
  assert(f.hulls.size <= 3);
});
