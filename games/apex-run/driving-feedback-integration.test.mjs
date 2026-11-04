import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const [game,html]=await Promise.all([
  readFile(new URL("game.js",import.meta.url),"utf8"),
  readFile(new URL("index.html",import.meta.url),"utf8"),
]);
assert.match(game,/import \{drivingFeedback,landingFeedback\} from "\.\/driving-feedback\.js\?v=/);
assert.match(game,/feedback=drivingFeedback\(\{speed,forward:input\.forward/,"fixed-step runtime must sample real vehicle and input state");
assert.match(game,/audio\.tire\.gain\.gain\.setTargetAtTime\(feedback\.scrub/,"tire scrub must drive the audio graph");
assert.match(game,/audio\.brake\.gain\.gain\.setTargetAtTime\(feedback\.brake/,"service braking must drive the audio graph");
assert.match(game,/feedback\.haze>\.24/,"slip and braking must drive bounded tire haze");
assert.match(game,/landingFeedback\(impact\)/,"landing impact must scale camera and audio feedback");
assert.match(game,/\+feedback\.fov/,"throttle and braking must influence the chase camera");
assert.match(html,/id="route-announcer"[^>]*role="status"[^>]*aria-live="polite"/);
assert.match(game,/routeAnnouncement\(routeAnnouncementState/);
console.log("Apex Run driving feedback and accessible route cue integration passed");
