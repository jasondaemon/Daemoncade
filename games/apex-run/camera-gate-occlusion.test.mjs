import assert from "node:assert/strict";import fs from "node:fs";
const source=fs.readFileSync(new URL("./game.js",import.meta.url),"utf8");
assert.match(source,/const cameraOccluders=\[\]/);
assert.match(source,/flatMap\(group=>group\.children\.filter\(child=>child\.isMesh\)\)/,"all structural gate meshes become occluders");
assert.match(source,/intersectObjects\(\[\.\.\.course,\.\.\.cameraOccluders\],false\)/);
console.log("Apex gate camera occlusion passed");
