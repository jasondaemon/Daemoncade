import assert from"node:assert/strict";
import{readFileSync}from"node:fs";
import{installGraphicsLifecycle}from"./graphics-lifecycle.js";

const listeners=new Map(),calls=[];
const window={addEventListener:(type,listener)=>listeners.set(type,listener)};
const renderer={
  setAnimationLoop:value=>calls.push(["animation",value]),
  renderLists:{dispose:()=>calls.push(["lists"])},
  dispose:()=>calls.push(["renderer"]),
  forceContextLoss:()=>calls.push(["context"]),
};
const lifecycle=installGraphicsLifecycle({window,renderer});
assert.equal(typeof listeners.get("pagehide"),"function");
assert.equal(listeners.get("pagehide")({persisted:true}),false,"bfcache navigation must keep its live renderer");
assert.equal(lifecycle.disposed,false);
assert.equal(listeners.get("pagehide")({persisted:false}),true);
assert.deepEqual(calls,[["animation",null],["lists"],["renderer"],["context"]]);
assert.equal(lifecycle.disposed,true);
assert.equal(listeners.get("pagehide")({persisted:false}),false,"teardown must be idempotent");
assert.equal(calls.length,4);
assert.throws(()=>installGraphicsLifecycle({window:null,renderer}),/required/);
const game=readFileSync(new URL("./game.js",import.meta.url),"utf8");
assert.match(game,/graphics-lifecycle\.js\?v=0\.5\.0-alpha156-webgl-lifecycle/);
for(const entry of["index.html","test.html","skyline-test.html"]){
  const html=readFileSync(new URL(`./${entry}`,import.meta.url),"utf8");
  assert.match(html,/game\.js\?v=0\.5\.0-alpha192-buttons/,`${entry} must invalidate the runtime cache`);
}
assert.match(readFileSync(new URL("./app.html",import.meta.url),"utf8"),/index\.html\?v=0\.5\.0-alpha192-buttons/);
const loadGuard=readFileSync(new URL("./load-guard.js",import.meta.url),"utf8");
assert.match(loadGuard,/source\.origin===location\.origin/,"startup guard accepts unrelated third-party resource failures");
assert.match(loadGuard,/HTMLScriptElement/,"startup guard does not limit resource failures to scripts");
assert.match(game,/sibling\.inert=false/,"successful initialization does not clear a stale startup isolation state");
console.log("Apex Run graphics lifecycle passed");
