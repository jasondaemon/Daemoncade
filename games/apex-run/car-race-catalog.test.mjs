import assert from "node:assert/strict";
import fs from "node:fs";
import {CAR_CATALOG,carAssetReady,raceAssetFor} from "./car-catalog.js";

const game=fs.readFileSync(new URL("./game.js",import.meta.url),"utf8");
assert.doesNotMatch(game,/selectedGarage\.car\.id\s*===/,"race rendering still dispatches on a specific catalog id");
assert.match(game,/raceAssetFor\(selectedGarage\.car\)/,"race rendering does not resolve the catalog adapter");
assert.match(game,/selectedRaceAsset\.url/,"race rendering ignores the catalog race asset URL");
for(const car of CAR_CATALOG.filter(carAssetReady)){
  const race=raceAssetFor(car);
  assert.ok(race,`${car.id} is selectable but not drivable`);
  assert.equal(fs.existsSync(new URL(`./${race.url}`,import.meta.url)),true,`${car.id} race asset is missing: ${race.url}`);
}
console.log("Apex Run catalog-driven race visuals passed");
