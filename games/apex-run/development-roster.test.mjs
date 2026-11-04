import assert from "node:assert/strict";
import {carryDevelopmentRoster,developmentRosterAccess} from "./development-roster.js";

for(const hostname of["localhost","127.0.0.1","::1","[::1]"])for(const search of["","?devRoster=1"])assert.equal(developmentRosterAccess({hostname,search}).development,true,`${hostname} did not enable the development roster`);
for(const value of[{hostname:"jasondaemon.net",search:"?devRoster=1"},{hostname:"localhost",search:"?devRoster=0"}])assert.equal(developmentRosterAccess(value).development,false,`development roster leaked for ${JSON.stringify(value)}`);
const enabled=new URL("http://127.0.0.1/garage.html?track=alpine-sprint");carryDevelopmentRoster(enabled,{development:true});assert.equal(enabled.searchParams.get("devRoster"),"1");
const normal=new URL("https://example.com/garage.html");carryDevelopmentRoster(normal,{development:false});assert.equal(normal.searchParams.has("devRoster"),false);
const disabled=new URL("http://127.0.0.1/garage.html");carryDevelopmentRoster(disabled,{development:false,disabled:true});assert.equal(disabled.searchParams.get("devRoster"),"0");
console.log("Apex Run development roster access passed");
