import assert from "node:assert/strict";
import {environmentBudget} from "./environment-presentation.js";
assert.deepEqual(environmentBudget("low"),{layers:1,segments:72});
assert.deepEqual(environmentBudget("medium"),{layers:2,segments:120});
assert.deepEqual(environmentBudget("high"),{layers:2,segments:180});
console.log("Apex Run environment presentation budgets passed");
