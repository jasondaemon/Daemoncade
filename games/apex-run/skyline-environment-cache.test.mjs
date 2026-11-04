import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const root=new URL("./",import.meta.url);
const [game,index,test,skyline,app,sunGlare,landscape,venueTerrain]=await Promise.all(["game.js","index.html","test.html","skyline-test.html","app.html","sun-glare.js","landscape-details.js","venue-terrain.js"].map(file=>readFile(new URL(file,root),"utf8")));
const moduleVersion="0.5.0-alpha108-skyline-junctions",entryVersion="0.5.0-alpha142-skyline-junctions";
assert.match(game,new RegExp(`skyline-environment\\.js\\?v=${moduleVersion}`));
for(const[source,name]of[[index,"production"],[test,"integration"],[skyline,"Skyline lifecycle"]])assert.match(source,new RegExp(`game\\.js\\?v=${entryVersion}`),`${name} entry can reuse stale game.js`);
assert.match(app,new RegExp(`index\\.html\\?v=${entryVersion}`),"app iframe can reuse stale index.html");
assert.match(game,/environment-presentation\.js\?v=0\.5\.0-alpha138-skyline-atmosphere/,"Skyline atmosphere can reuse a stale presentation module");
assert.match(sunGlare,/environment-presentation\.js\?v=0\.5\.0-alpha138-skyline-atmosphere/,"sun glare can reuse a stale sun-direction module");
assert.match(landscape,/venue-terrain\.js\?v=0\.5\.0-alpha138-skyline-atmosphere/,"landscape details can reuse a stale terrain module");
assert.match(venueTerrain,/roughnessMap:skyline\?null:maps\.roughness\|\|null/,"Skyline terrain must not re-enable the aliased roughness texture");
assert.doesNotMatch(game,/debugRender/,"render-isolation hooks must not ship");
assert.match(game,/ACTIVE_TRACK_ID==="skyline-gauntlet"\?4200:800/,"only Skyline extends the camera horizon");
console.log("Skyline environment cache graph passed");
