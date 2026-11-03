import assert from "node:assert/strict";
import {CAR_CATALOG,DEFAULT_CAR_ID,carAssetReady,carById,resolveSelection} from "./car-catalog.js";

assert.equal(CAR_CATALOG.filter(car=>carAssetReady(car)).length,1,"only the integrated F1 may be race-selectable");
assert.equal(carById(DEFAULT_CAR_ID).asset.url,"assets/low-poly-f1.glb");
const concept=carById("car-concept");assert.equal(concept.asset.status,"pending-preparation");assert.equal(concept.asset.license,"CC BY 4.0");assert.deepEqual(concept.preview.variants,["Carmine Candy","Pearly Swirly","Torched Graphite"]);assert.equal(carAssetReady(concept),false);
const fallback=resolveSelection({selection:{carId:"car-concept",cosmeticId:"missing"},achievements:{"three-clean-streak":{unlockedAt:"2026-01-01T00:00:00.000Z"}}});assert.equal(fallback.car.id,DEFAULT_CAR_ID,"unprepared licensed asset became selectable");
assert.ok(Object.isFrozen(CAR_CATALOG)&&Object.isFrozen(concept.preview));
console.log("Apex Run car catalog passed");
