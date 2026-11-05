import assert from "node:assert/strict";
import fs from "node:fs";

const revision="0.5.0-alpha177-generic-sport",entryRevisions={"game.js":"0.5.0-alpha177-generic-sport","garage.js":"0.5.0-alpha177-generic-sport","garage-browser-test.js":"0.5.0-alpha177-generic-sport"},root=new URL("./",import.meta.url),origin=new URL("http://127.0.0.1:4173/games/apex-run/"),protectedModules=new Set([
  "car-catalog.js","car-visual-adapter.js","development-roster.js","garage-preview-contract.js",
  "garage-progression.js","garage-storage.js","garage-three-preview.js","race-outcome.js","track-catalog.js",
]);
const entryModules=["game.js","garage.js","garage-browser-test.js"];
const graphModules=[...entryModules,...protectedModules];
const moduleRevisions={"car-visual-adapter.js":"0.5.0-alpha177-generic-sport","garage-three-preview.js":"0.5.0-alpha177-generic-sport"};
function source(name){return fs.readFileSync(new URL(name,root),"utf8")}
function imports(text){return[...text.matchAll(/from\s+["'](\.\/[^"']+)["']/g)].map(match=>match[1])}

for(const entry of graphModules){
  for(const specifier of imports(source(entry))){
    const url=new URL(specifier,new URL(entry,origin)),name=url.pathname.split("/").at(-1);
    if(protectedModules.has(name))assert.equal(url.searchParams.get("v"),moduleRevisions[name]||(name==="track-catalog.js"?"0.5.0-alpha154-summit-descent":revision),`${entry} leaves ${name} on a stale or mismatched URL`);
  }
}
for(const [entry,html] of [["game.js","index.html"],["game.js","test.html"],["garage.js","garage.html"],["garage-browser-test.js","garage-browser-test.html"]]){
  const entryRevision=entryRevisions[entry];
  assert.match(source(html),new RegExp(`${entry.replace(".","\\.")}\\?v=${entryRevision.replaceAll(".","\\.")}`),`${html} does not bust the ${entry} entry cache`);
}

// Model a same-origin browser cache already holding the previous bare modules.
// Every protected request in the new graph must use the revisioned URL and
// therefore bypass those stale entries.
const staleCache=new Map([...protectedModules].map(name=>[new URL(name,origin).href,"STALE"]));
for(const entry of graphModules)for(const specifier of imports(source(entry))){
  const url=new URL(specifier,new URL(entry,origin)),name=url.pathname.split("/").at(-1);
  if(protectedModules.has(name))assert.notEqual(staleCache.get(url.href),"STALE",`${entry} reused stale ${name}`);
}
assert.match(source("car-catalog.js"),/raceAdapter/,"cache simulation is not exercising the current catalog");
console.log("Apex Run roster module cache contract passed");
