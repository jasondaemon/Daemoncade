import assert from "node:assert/strict";
import {CAR_CATALOG,DEFAULT_CAR_ID,carAssetReady,carById,carUnlocked,cosmeticUnlocked,raceAssetFor,resolveSelection} from "./car-catalog.js";

assert.equal(CAR_CATALOG.filter(car=>carAssetReady(car)).length,6,"prepared race assets were not cataloged");
assert.equal(carById(DEFAULT_CAR_ID).asset.url,"assets/low-poly-f1.glb");
assert.deepEqual(raceAssetFor(carById(DEFAULT_CAR_ID)),{adapter:"formula",url:"assets/low-poly-f1.glb"});
const concept=carById("car-concept");assert.equal(concept.asset.status,"ready");assert.equal(concept.asset.license,"CC BY 4.0");assert.deepEqual(concept.preview.variants,["Apex Cyan","Summit Gold","Midnight Grid"]);assert.equal(carAssetReady(concept),true);assert.equal(concept.cosmetics.length,3);
assert.deepEqual(raceAssetFor(concept),{adapter:"authored-wheels",url:"assets/car-concept-race.glb"});
const sport=carById("generic-sport");assert.equal(sport.asset.license,"CC BY 4.0");assert.equal(sport.asset.metrics.race.triangles,6268);assert.deepEqual(raceAssetFor(sport),{adapter:"authored-wheels",url:"assets/cars/generic-sport.glb"});assert.equal(sport.cosmetics.length,3);
const cybertruck=carById("cybertruck");assert.equal(cybertruck.asset.license,"CC BY 4.0");assert.equal(cybertruck.asset.metrics.race.bytes,407140);assert.deepEqual(raceAssetFor(cybertruck),{adapter:"authored-wheels",url:"assets/tesla-cybertruck.glb",profile:"cybertruck"});assert.equal(cybertruck.cosmetics.length,3);
for(const[id,triangles,profile]of[["generic-offroad",6502,"trail"],["generic-minivan",7450,"tourer"]]){const car=carById(id);assert.equal(car.asset.license,"CC BY 4.0");assert.equal(car.asset.metrics.race.triangles,triangles);assert.deepEqual(raceAssetFor(car),{adapter:"authored-wheels",url:`assets/cars/${id}.glb`,profile});assert.equal(car.cosmetics.length,3)}
const fallback=resolveSelection({selection:{carId:"car-concept",cosmeticId:"missing"},achievements:{}});assert.equal(fallback.car.id,DEFAULT_CAR_ID,"locked licensed asset became selectable");
const development={development:true},fresh={selection:{carId:"car-concept",cosmeticId:"gt-summit"},achievements:{}};assert.equal(resolveSelection(fresh,development).car.id,"car-concept");assert.equal(resolveSelection(fresh,development).cosmetic.id,"gt-summit");for(const car of CAR_CATALOG){assert.equal(carUnlocked(fresh,car,development),carAssetReady(car),`${car.id} development access did not follow asset readiness`);for(const cosmetic of car.cosmetics)if(carAssetReady(car))assert.equal(cosmeticUnlocked(fresh,cosmetic,development),true,`${car.id}/${cosmetic.id} remained locked in development`)}
for(const car of CAR_CATALOG.filter(carAssetReady)){const race=raceAssetFor(car);assert.ok(race,`${car.id} is ready but has no race adapter`);assert.ok(["formula","authored-wheels"].includes(race.adapter),`${car.id} declared an unsupported race adapter`);assert.match(race.url,/\.glb$/,`${car.id} race asset is not a GLB`)}
assert.equal(raceAssetFor({...concept,asset:{...concept.asset,raceAdapter:"future-unknown"}}),null,"unknown adapters must not silently fall back to Formula");
assert.ok(Object.isFrozen(CAR_CATALOG)&&Object.isFrozen(concept.preview));
console.log("Apex Run car catalog passed");
