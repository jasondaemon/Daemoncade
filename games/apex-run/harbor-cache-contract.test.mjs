import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const root=new URL("./",import.meta.url),token="v=0.5.0-alpha154-summit-descent",entryToken="v=0.5.0-alpha176-gt-visible-wheels";
const source=async file=>readFile(new URL(file,root),"utf8");
for(const entry of ["index.html","app.html","test.html","skyline-test.html"]){
  assert.ok((await source(entry)).includes(entryToken),`${entry} reaches the Harbor v2 graph`);
}
const game=await source("game.js");
for(const module of ["track-model","track-catalog","simulation","race-controller","race-feedback","stadium-fill","harbor-coastal-districts","harbor-hero-assets","harbor-factory-complex","harbor-maritime-assets","harbor-waterfront","harbor-service-district","harbor-route-campus"]){
  assert.ok(game.includes(`./${module}.js?${token}`),`${module} is versioned from game.js`);
}
for(const consumer of ["harbor-waterfront.js","harbor-hero-assets.js","harbor-factory-complex.js"]){
  assert.ok((await source(consumer)).includes(`./harbor-coastal-districts.js?${token}`),`${consumer} versions its coastal layout dependency`);
}
for(const consumer of ["garage-progression.js","garage.js","race-outcome.js","track-model.js"]){
  assert.ok((await source(consumer)).includes(`track-catalog.js?${token}`),`${consumer} sees the v2 storage catalog`);
}
console.log("Harbor v2 cache graph passed");
