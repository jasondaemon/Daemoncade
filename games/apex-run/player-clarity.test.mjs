import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const root=new URL("./",import.meta.url);
const [html,css,game,garage]=await Promise.all([
  readFile(new URL("index.html",root),"utf8"),
  readFile(new URL("game.css",root),"utf8"),
  readFile(new URL("game.js",root),"utf8"),
  readFile(new URL("garage.js",root),"utf8"),
]);

for(const id of["race-briefing","briefing-difficulty","briefing-checkpoints","briefing-pb","briefing-medal","briefing-target","briefing-loadout","briefing-provisional","result-next-goal"])
  assert.match(html,new RegExp(`id=["']${id}["']`),`${id} must be present in the production UI`);
assert.match(html,/brake to a full stop, release S \/ ↓, then press it again/i);
assert.match(html,/Backspace recovery makes a clean run ineligible for PBs, medals, ghosts, and achievements/i);
assert.match(html,/Sequential practice runs sectors in course order/i);
assert.doesNotMatch(html,/Practice sectors/);
assert.match(css,/\.race-briefing\{/);
assert.match(game,/panel\.hidden=!telemetryEnabled\|\|race\.state!=="racing"/,"ready/countdown/result telemetry must remain hidden");
assert.match(game,/resultNextStep\(\{track:activeTrack\(\)/,"result screen must explain the next action");
assert.match(garage,/CAR_CATALOG\.filter\(carAssetReady\)/,"preview-only catalog slots must not be player-facing");
assert.doesNotMatch(garage,/PREVIEW · ASSET NOT INTEGRATED/);
console.log("Apex Run player clarity source contract passed");
