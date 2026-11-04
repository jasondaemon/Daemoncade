import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const root=new URL("./",import.meta.url);
const [game,index,test,skyline,app]=await Promise.all(["game.js","index.html","test.html","skyline-test.html","app.html"].map(file=>readFile(new URL(file,root),"utf8")));
const moduleVersion="0.5.0-alpha106-skyline-art",entryVersion="0.5.0-alpha108-visible-sun-integrated";
assert.match(game,new RegExp(`skyline-environment\\.js\\?v=${moduleVersion}`));
for(const[source,name]of[[index,"production"],[test,"integration"],[skyline,"Skyline lifecycle"]])assert.match(source,new RegExp(`game\\.js\\?v=${entryVersion}`),`${name} entry can reuse stale game.js`);
assert.match(app,new RegExp(`index\\.html\\?v=${entryVersion}`),"app iframe can reuse stale index.html");
console.log("Skyline environment cache graph passed");
