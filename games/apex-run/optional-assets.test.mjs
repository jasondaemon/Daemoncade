import assert from "node:assert/strict";
import {loadOptionalAssets} from "./optional-assets.js";
const loader={loadAsync:path=>path.includes("missing")?Promise.reject(new Error("fixture failure")):Promise.resolve({scene:{path}})},assets=await loadOptionalAssets(loader,["stand","missing","barrier"],"/fixture/");
assert.equal(assets.stand.path,"/fixture/stand.gltf");
assert.equal(assets.missing,null);
assert.equal(assets.barrier.path,"/fixture/barrier.gltf");
console.log("Apex Run optional scenery failure isolation passed");
