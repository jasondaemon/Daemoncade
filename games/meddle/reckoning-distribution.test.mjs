import assert from "node:assert/strict";
import {chooseReckoningLoss} from "./faction-state.mjs";

const sample=(population,draws=12000)=>{const result=Object.fromEntries(Object.keys(population).map(id=>[id,0]));for(let index=0;index<draws;index++)result[chooseReckoningLoss(population,(index+.5)/draws)]++;return result;};
const equal=sample({player:10,rival:10,rival2:10});for(const count of Object.values(equal))assert.ok(Math.abs(count-4000)<=2,JSON.stringify(equal));
const weighted=sample({player:20,rival:10,rival2:10});assert.ok(weighted.player<weighted.rival&&weighted.player<weighted.rival2,JSON.stringify(weighted));
const two=sample({player:10,rival:10,rival2:0});assert.equal(two.player,6000);assert.equal(two.rival,6000);assert.equal(two.rival2,0);
console.log("Meddle Reckoning lottery: all living hosts receive correct inverse-strength casualty weight");
