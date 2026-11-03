import assert from "node:assert/strict";
import {DEFAULT_CAR_ID,DEFAULT_COSMETIC_ID} from "./car-catalog.js";
import {GARAGE_KEY,achievementProgress,createGarageState,migrateGarage,readGarage,recordInvalidatedRun,recordRaceOutcome,saveGarage,selectGarageItem,validateRaceOutcome} from "./garage-progression.js";

class Storage{constructor(seed={}){this.data=new Map(Object.entries(seed));this.fail=false}getItem(key){if(this.fail)throw Error("denied");return this.data.get(key)??null}setItem(key,value){if(this.fail)throw Error("quota");this.data.set(key,String(value))}}
const outcome=(overrides={})=>({schema:1,source:"apex-run-race",runId:"run:20261103:0001",trackId:"alpine-sprint",time:47,finished:true,eligible:true,practice:false,debug:false,recoveryCount:0,checkpointCount:4,checkpointTimes:[10,21,34,47],...overrides});
assert.equal(validateRaceOutcome(outcome()).medal,"APEX");
for(const invalid of[{debug:true},{eligible:false},{practice:true},{recoveryCount:1},{finished:false},{checkpointCount:3},{checkpointTimes:[10,9,34,47]},{trackId:"missing"},{runId:"short"}])assert.equal(validateRaceOutcome(outcome(invalid)),null,`accepted invalid outcome ${JSON.stringify(invalid)}`);

let state=createGarageState(),result=recordRaceOutcome(state,outcome(),{now:Date.UTC(2026,10,3)});assert.equal(result.accepted,true);assert.deepEqual(result.unlocked,["first-clean-finish","apex-medal"]);state=result.state;assert.equal(state.stats.cleanFinishes,1);assert.equal(state.stats.medals.APEX,1);assert.deepEqual(achievementProgress(state,"first-clean-finish"),{value:1,target:1,complete:true});
const duplicate=recordRaceOutcome(state,outcome(),{now:1});assert.equal(duplicate.duplicate,true);assert.equal(duplicate.state.stats.cleanFinishes,1);
result=recordRaceOutcome(state,outcome({runId:"run:20261103:0002",trackId:"summit-circuit",time:150,checkpointCount:7,checkpointTimes:[20,40,60,80,100,125,150]}));state=result.state;assert.ok(result.unlocked.includes("two-track-finisher"));
result=recordRaceOutcome(state,outcome({runId:"run:20261103:0003",time:80,checkpointTimes:[20,40,60,80]}));state=result.state;assert.ok(result.unlocked.includes("three-clean-streak"));assert.equal(state.stats.cleanStreak,3);
state=recordInvalidatedRun(state);assert.equal(state.stats.cleanStreak,0);assert.ok(state.achievements["three-clean-streak"],"earned achievement was revoked");
let selection=selectGarageItem(state,{carId:DEFAULT_CAR_ID,cosmeticId:"summit-gold"});assert.equal(selection.selected,true);assert.deepEqual(selection.state.selection,{carId:DEFAULT_CAR_ID,cosmeticId:"summit-gold"});selection=selectGarageItem(state,{carId:"car-concept",cosmeticId:null});assert.equal(selection.selected,false);assert.equal(selection.reason,"car-locked");

const storage=new Storage();assert.equal(saveGarage(storage,state),true);assert.equal(readGarage(storage).stats.cleanFinishes,3);storage.data.set(GARAGE_KEY,"{bad json");assert.deepEqual(readGarage(storage).selection,{carId:DEFAULT_CAR_ID,cosmeticId:DEFAULT_COSMETIC_ID});storage.fail=true;assert.equal(saveGarage(storage,state),false);assert.deepEqual(readGarage(storage).selection,{carId:DEFAULT_CAR_ID,cosmeticId:DEFAULT_COSMETIC_ID});
const legacy=new Storage({"apex-run:selected-car:v1":DEFAULT_CAR_ID,"apex-run:selected-livery:v1":"summit-gold"}),migration=migrateGarage(legacy);assert.equal(migration.migrated,true);assert.deepEqual(migration.state.selection,{carId:DEFAULT_CAR_ID,cosmeticId:DEFAULT_COSMETIC_ID},"locked legacy cosmetic bypassed progression");assert.equal(legacy.getItem("apex-run:selected-livery:v1"),"summit-gold","migration destroyed legacy record");
console.log("Apex Run garage progression passed");
