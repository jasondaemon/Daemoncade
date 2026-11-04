import assert from "node:assert/strict";
import {CAR_CATALOG,DEFAULT_CAR_ID,carAssetReady,carById,carUnlocked,cosmeticUnlocked,resolveSelection} from "./car-catalog.js";

assert.equal(CAR_CATALOG.filter(car=>carAssetReady(car)).length,2,"prepared GT asset was not cataloged");
assert.equal(carById(DEFAULT_CAR_ID).asset.url,"assets/low-poly-f1.glb");
const concept=carById("car-concept");assert.equal(concept.asset.status,"ready");assert.equal(concept.asset.license,"CC BY 4.0");assert.deepEqual(concept.preview.variants,["Apex Cyan","Summit Gold","Midnight Grid"]);assert.equal(carAssetReady(concept),true);assert.equal(concept.cosmetics.length,3);
const fallback=resolveSelection({selection:{carId:"car-concept",cosmeticId:"missing"},achievements:{}});assert.equal(fallback.car.id,DEFAULT_CAR_ID,"locked licensed asset became selectable");
const development={development:true},fresh={selection:{carId:"car-concept",cosmeticId:"gt-summit"},achievements:{}};assert.equal(resolveSelection(fresh,development).car.id,"car-concept");assert.equal(resolveSelection(fresh,development).cosmetic.id,"gt-summit");for(const car of CAR_CATALOG){assert.equal(carUnlocked(fresh,car,development),carAssetReady(car),`${car.id} development access did not follow asset readiness`);for(const cosmetic of car.cosmetics)if(carAssetReady(car))assert.equal(cosmeticUnlocked(fresh,cosmetic,development),true,`${car.id}/${cosmetic.id} remained locked in development`)}
assert.ok(Object.isFrozen(CAR_CATALOG)&&Object.isFrozen(concept.preview));
console.log("Apex Run car catalog passed");
