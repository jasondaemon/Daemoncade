import assert from "node:assert/strict";
import fs from "node:fs";
import {PADDOCK_BUDGET} from "./paddock-architecture.js";

assert.ok(PADDOCK_BUDGET.meshes<=90,"paddock exceeds the bounded main-pass mesh budget");
assert.ok(PADDOCK_BUDGET.uniqueMaterials<=8,"paddock material family is no longer cohesive");
const source=fs.readFileSync(new URL("./paddock-architecture.js",import.meta.url),"utf8");
assert.match(source,/recessed garage rhythm/);
assert.match(source,/ExtrudeGeometry/,"architecture should retain rounded/beveled silhouettes");
assert.doesNotMatch(source,/pitsGarage|pitsOffice|grandStandCovered/,"authored paddock must not depend on low-poly kit hero assets");
console.log("Apex Run authored paddock architecture budget passed",PADDOCK_BUDGET);
