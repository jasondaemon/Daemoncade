import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import { Run } from "./rules.js";
import {
  buildTrack,
  trackPoint,
  trackStrip,
  ROAD_HALF,
  chasePose,
} from "./world-track.js";
test("fixed track vertices do not change as player advances", () => {
  const run = new Run({ mode: "race" }),
    track = buildTrack(run.route),
    before = JSON.stringify(track.points),
    strip = trackStrip(track, 200, 202, -7, 7);
  for (let s = 0; s < run.goal; s += 5) {
    run.player.z = s;
    trackPoint(track, s);
    trackStrip(track, s, s + 2, -7, 7);
  }
  assert.equal(JSON.stringify(track.points), before);
  assert.deepEqual(trackStrip(track, 200, 202, -7, 7), strip);
});
test("road width and landmark positions stay identical on every lap", () => {
  for (let stage = 0; stage < 6; stage++) {
    const r = new Run({ mode: "race", stage }),
      track = buildTrack(r.route);
    for (let s = 0; s < r.route.length; s += 7) {
      const a = trackPoint(track, s, -ROAD_HALF),
        b = trackPoint(track, s, ROAD_HALF),
        next = trackPoint(track, s + r.route.length, ROAD_HALF);
      assert(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - 14) < 1e-8);
      assert(Math.hypot(b.x - next.x, b.y - next.y) < 1e-8);
    }
  }
});
test("one perspective camera projects fixed landmarks, with repeatable lap views", () => {
  const r = new Run({ mode: "race" }),
    track = buildTrack(r.route),
    camera = new THREE.PerspectiveCamera(58, 0.5, 0.2, 1100);
  const view = (s) => {
    const pose = chasePose(track, s, 0);
    camera.position.copy(pose.position);
    camera.lookAt(pose.look.x, pose.look.y, pose.look.z);
    camera.updateMatrixWorld();
    const marker = trackPoint(track, s + 40, 14);
    return new THREE.Vector3(marker.x, 0, marker.y).project(camera);
  };
  for (let s = 0; s < r.route.length; s += 13) {
    assert(view(s).distanceTo(view(s + r.route.length)) < 1e-8);
    assert(view(s).distanceTo(view(s + 0.01)) < 0.01);
  }
});
test("chase camera keeps the player inside narrow and wide viewports", () => {
  for (let stage = 0; stage < 6; stage++) {
    const r = new Run({ mode: "race", stage }),
      track = buildTrack(r.route);
    for (const aspect of [0.39, 0.7, 1.5])
      for (const lateral of [-1.05, 0, 1.05])
        for (let s = 0; s < r.route.length; s += 9) {
          const pose = chasePose(track, s, lateral),
            camera = new THREE.PerspectiveCamera(58, aspect, 0.2, 1100);
          camera.position.copy(pose.position);
          camera.lookAt(pose.look.x, pose.look.y, pose.look.z);
          camera.updateMatrixWorld();
          const p = trackPoint(track, s, lateral * 7),
            v = new THREE.Vector3(p.x, 0.12, p.y).project(camera);
          assert(Math.abs(v.x) < 0.65);
          assert(Math.abs(v.y) < 0.85);
        }
  }
});
test("highway generates a fixed continuous route beyond the checkpoint", () => {
  const r = new Run(),
    track = buildTrack(r.route);
  assert(!track.closed);
  assert(track.points.at(-1).s > r.goal + 200);
  for (let s = 0; s < r.goal; s += 5) {
    const a = trackPoint(track, s),
      b = trackPoint(track, s + 0.01);
    assert(Math.hypot(a.x - b.x, a.y - b.y) < 0.011);
  }
});
