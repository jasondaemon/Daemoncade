import test from "node:test";
import assert from "node:assert/strict";
import { Run, ROUTES, LANES, sweptContact } from "./rules.js";
import { restore, record } from "./progress.js";
import { circuitPoint, circuitCurve } from "./circuit.js";
import {driver} from './driving-test-helper.mjs';
test("circuits close in position and heading and repeat the same corners", () => {
  for (let stage = 0; stage < 6; stage++) {
    const r = new Run({ mode: "race", stage }),
      route = r.route,
      a = circuitPoint(route, 0),
      b = circuitPoint(route, route.length);
    assert(Math.hypot(a.x - b.x, a.y - b.y) < 1e-8);
    assert(Math.abs(b.heading - a.heading - Math.PI * 2) < 1e-8);
    for (let z = 0; z < route.length; z += 17) {
      assert(Number.isFinite(circuitCurve(route, z)));
      assert(
        Math.abs(
          circuitCurve(route, z) - circuitCurve(route, z + route.length),
        ) < 1e-8,
      );
    }
    assert(
      Math.abs(circuitCurve(route, 0)) < 0.25,
      "start line belongs on the straight",
    );
  }
});
const playing = (options) => {
  const r = new Run(options);
  r.phase = "playing";
  return r;
};
const tick = (r, seconds, input = {}) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) r.update(1 / 60, input);
};
test("countdown and pause cannot advance the race clock", () => {
  const r = new Run();
  tick(r, 2);
  assert.equal(r.time, 0);
  assert.equal(r.player.z, 0);
  tick(r, 2);
  r.paused = true;
  const state = JSON.stringify(r);
  tick(r, 60);
  assert.equal(JSON.stringify(r), state);
});
test("swept collision catches crossings and rejects adjacent lanes", () => {
  const a = { prevZ: 0, z: 30, prevX: 0, x: 0 },
    b = { prevZ: 15, z: 15, prevX: 0, x: 0 };
  assert(sweptContact(a, b));
  assert(!sweptContact(a, { ...b, x: 0.72, prevX: 0.72 }));
});
test("collision cooldown prevents multiple damage in one contact", () => {
  const r = playing();
  r.hit();
  r.hit();
  assert.equal(r.health, 65);
  assert.equal(r.collisions, 1);
  tick(r, 1.2);
  r.hit();
  assert.equal(r.health, 30);
});
test("hard highway collision is terminal; circuit contacts cost speed not health", () => {
  const h = playing({ difficulty: "hard" });
  h.hit();
  assert.equal(h.phase, "lost");
  const r = playing({ mode: "race" });
  r.player.speed = 60;
  r.hit();
  assert.equal(r.health, 100);
  assert.equal(r.player.speed, 33);
});
test("shield absorbs one contact and completed runs cannot be damaged", () => {
  const r = playing({ difficulty: "hard" });
  r.shield = true;
  r.hit();
  assert.equal(r.health, 100);
  assert.equal(r.shield, false);
  r.recovery = 0;
  r.player.finish = 20;
  r.hit();
  assert.equal(r.health, 100);
});
test("checkpoint award is paid once", () => {
  const r = playing();
  r.player.z = r.goal;
  r.update(1 / 60);
  const score = r.score;
  tick(r, 10);
  assert.equal(r.phase, "finished");
  assert.equal(r.score, score);
});
test("new traffic waves preserve spacing against moving older waves", () => {
  const r = playing({ stage: 4 });
  r.spawnWave();
  const old = r.traffic[0];
  r.time = 6;
  r.traffic.forEach((c) => (c.z += 108));
  r.spawnWave();
  const next = r.traffic.find((c) => c.wave === 2);
  assert(next.z - old.z > 50);
});
test("finish order uses frozen crossing times", () => {
  const r = playing({ mode: "race" });
  r.time = 10;
  const a = r.rivals[0];
  a.z = r.goal + 2;
  r.finishActor(a, r.goal - 2, 1);
  assert.equal(a.finish, 9.5);
  const finish = a.finish;
  tick(r, 1);
  assert.equal(a.z, r.goal);
  assert.equal(a.finish, finish);
  r.player.finish = 10;
  assert.equal(r.position, 2);
});
test("circuit does not consume fuel", () => {
  const r = playing({ mode: "race" });
  tick(r, 15, { throttle: true, targetX: 0 });
  assert.equal(r.fuel, 100);
});
test("success and failure save scores; only qualifying finishes advance", () => {
  const p = restore(),
    r = playing();
  r.score = 42;
  r.end("wrecked");
  record(p, r);
  assert.equal(p.results["highway:normal:0"].score, 42);
  assert.equal(p.cursors["highway:normal"], 0);
  r.phase = "finished";
  r.player.finish = 30;
  record(p, r);
  assert.equal(p.cursors["highway:normal"], 1);
  assert.equal(p.cursors["race:normal"], 0);
});
test("race stars and progression follow final places", () => {
  for (let position = 1; position <= 4; position++) {
    const p = restore(),
      r = playing({ mode: "race" });
    r.phase = "finished";
    r.player.finish = 10;
    r.rivals.forEach((a, i) => (a.finish = i < position - 1 ? 9 : 11));
    const result = record(p, r);
    assert.equal(result.stars, 4 - position);
    assert.equal(result.qualified, position <= 3);
    assert.equal(p.cursors["race:normal"], position <= 3 ? 1 : 0);
  }
});
test("damaged saves are safe to restore", () => {
  for (const data of [
    null,
    42,
    "oops",
    {},
    { cursors: { "race:hard": 999 } },
  ]) {
    const p = restore(data);
    assert(p.cursors["race:hard"] >= 0 && p.cursors["race:hard"] <= 6);
  }
});
test("six routes have distinct lengths and a gentle opening", () => {
  assert.equal(new Set(ROUTES.map((r) => r.length)).size, 6);
  assert(
    ROUTES.every((r) => r.sections[0][1] === 0 && r.sections[0][0] >= 180),
  );
});
test("seeded traffic waves reserve an adjacent two-lane opening", () => {
  for (let stage = 0; stage < 6; stage++) {
    const a = playing({ stage, difficulty: "hard" }),
      b = playing({ stage, difficulty: "hard" });
    for (let i = 0; i < 10; i++) {
      a.spawnWave();
      b.spawnWave();
    }
    assert.deepEqual(a.traffic, b.traffic);
    for (const car of a.traffic) {
      assert(!car.open.includes(car.lane));
      assert.equal(car.open[1] - car.open[0], 1);
    }
  }
});
test("fixed-step integration is identical across rendering rates", () => {
  const simulate = (fps) => {
    const r = playing({ mode: "race" });
    let accumulator = 0;
    for (let f = 0; f < fps * 20; f++) {
      accumulator += 1 / fps;
      while (accumulator + 1e-9 >= 1 / 60) {
        r.update(1 / 60, { throttle: true, targetX: 0 });
        accumulator -= 1 / 60;
      }
    }
    return r;
  };
  assert.deepEqual(simulate(30), simulate(60));
  assert.deepEqual(simulate(60), simulate(120));
});
test("all route/difficulty combinations can complete with active driving", () => {
  for (const mode of ["highway", "race"])
    for (const difficulty of ["easy", "normal", "hard"])
      for (let stage = 0; stage < 6; stage++) {
        const r = playing({ mode, difficulty, stage });
        let maxObjects = 0,
          boosting = false;
        for (
          let i = 0;
          i < 14400 && !["finished", "lost"].includes(r.phase);
          i++
        ) {
          const obstacles = [...r.traffic, ...r.rivals].filter(
            (a) =>
              a.finish == null &&
              a.z - r.player.z > -8 &&
              a.z - r.player.z < 65,
          );
          const target = LANES.slice().sort((a, b) => {
            const cost = (x) =>
              obstacles.reduce(
                (s, o) =>
                  s +
                  (Math.abs(o.x - x) < 0.3
                    ? 100 / (Math.abs(o.z - r.player.z) + 4)
                    : 0),
                0,
              ) +
              Math.abs(x - r.player.x) * 0.05;
            return cost(a) - cost(b);
          })[0];
          const turning = Math.abs(target - r.player.x) > 0.25;
          if (r.boost < 1) boosting = false;
          else if (r.boost > 30 && r.player.speed > 60) boosting = true;
          r.update(1 / 60, {
            ...(mode==='race'?driver(r,target):{}),
            throttle: true,
            targetX: mode==='race'?undefined:target,
            brake:
              mode === 'race'?driver(r,target).brake:mode === "highway" &&
              turning &&
              obstacles.some((a) => a.z - r.player.z < 30),
            boost: mode === "race" && boosting && !turning,
          });
          maxObjects = Math.max(
            maxObjects,
            r.traffic.length + r.pickups.length,
          );
          r.drain();
        }
        assert.equal(
          r.phase,
          "finished",
          `${mode} ${difficulty} route ${stage + 1}: ${r.reason}`,
        );
        assert(maxObjects < 30);
        if (mode === "race")
          assert(
            r.position <= (difficulty==='hard'?4:3),
            `${difficulty} route ${stage + 1}: ${r.position}`,
          );
      }
});
