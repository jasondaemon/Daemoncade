import assert from "node:assert/strict";
import {routeAnnouncement} from "./route-announcer.js";

let state={key:""},result=routeAnnouncement(state,{checkpoint:1,cue:{label:"LEFT BEND",distance:84}});
assert.equal(result.text,"LEFT BEND in 80 metres");state=result.state;
assert.equal(routeAnnouncement(state,{checkpoint:1,cue:{label:"LEFT BEND",distance:72}}).text,null,"distance changes must not repeat a live announcement");
result=routeAnnouncement(state,{checkpoint:1,cue:{label:"BRAKE",distance:39}});assert.equal(result.text,"BRAKE in 40 metres");state=result.state;
assert.equal(routeAnnouncement(state,{checkpoint:1,cue:null}).text,null);
assert.equal(routeAnnouncement(state,{checkpoint:2,cue:{label:"BRAKE",distance:110}}).text,"BRAKE in 110 metres","a new sector may announce the same cue");
console.log("Apex Run route announcer passed");
