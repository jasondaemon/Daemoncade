import assert from "node:assert/strict";
import {CAR_CATALOG,DEFAULT_CAR_ID,carAssetReady,carById,resolveSelection} from "./car-catalog.js";

assert.equal(CAR_CATALOG.filter(car=>carAssetReady(car)).length,2,"prepared GT asset was not cataloged");
assert.equal(carById(DEFAULT_CAR_ID).asset.url,"assets/low-poly-f1.glb");
const concept=carById("car-concept");assert.equal(concept.asset.status,"ready");assert.equal(concept.asset.license,"CC BY 4.0");assert.deepEqual(concept.preview.variants,["Apex Cyan","Summit Gold","Midnight Grid"]);assert.equal(carAssetReady(concept),true);assert.equal(concept.cosmetics.length,3);
const fallback=resolveSelection({selection:{carId:"car-concept",cosmeticId:"missing"},achievements:{}});assert.equal(fallback.car.id,DEFAULT_CAR_ID,"locked licensed asset became selectable");
assert.ok(Object.isFrozen(CAR_CATALOG)&&Object.isFrozen(concept.preview));
console.log("Apex Run car catalog passed");
