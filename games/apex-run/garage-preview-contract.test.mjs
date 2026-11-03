import assert from "node:assert/strict";
import {GaragePreviewHost} from "./garage-preview-contract.js";
const calls=[],adapter={mount:(element,options)=>calls.push(["mount",element,options]),show:selection=>calls.push(["show",selection]),resize:(...args)=>calls.push(["resize",...args]),dispose:()=>calls.push(["dispose"])};const host=new GaragePreviewHost(adapter);await assert.rejects(()=>host.show({}),/not mounted/);await host.mount("root",{reducedMotion:true});await host.show({car:{id:"formula-apex",asset:{status:"ready"},preview:{}},cosmetic:{id:"apex-cyan",palette:{}}});host.resize(800,600,2);host.dispose();assert.deepEqual(calls.map(call=>call[0]),["mount","show","resize","dispose"]);assert.throws(()=>new GaragePreviewHost({}),/must implement/);console.log("Apex Run garage preview contract passed");
let resolveFirst;
const delayedCalls=[];
const delayed=new GaragePreviewHost({
  mount(){},
  show({carId,signal}){delayedCalls.push({carId,signal});return carId==="first"?new Promise(resolve=>{resolveFirst=resolve}):Promise.resolve("second")},
  dispose(){},
});
await delayed.mount("root");
const first=delayed.show({car:{id:"first",asset:{},preview:{}},cosmetic:null});
const second=delayed.show({car:{id:"second",asset:{},preview:{}},cosmetic:null});
assert.equal(await second,"second");assert.equal(delayedCalls[0].signal.aborted,true);resolveFirst("stale");assert.equal(await first,null,"stale preview replaced the latest selection");delayed.dispose();
