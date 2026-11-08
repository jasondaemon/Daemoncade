import assert from "node:assert/strict";
import { applyFollowerCasualty, bandSize, bandTier, captureDwelling, followerGroupStatus, followerReadout, isValidGameSave, mergeFollowerBands, populationOf } from "./rules.mjs";

const target={faction:"player",members:2,hp:14},source={faction:"player",members:2,hp:13};
const before=bandSize(target)+bandSize(source);
assert.equal(mergeFollowerBands(target,source),2);
assert.equal(bandSize(target),4);
assert.equal(source.members,0);
assert.equal(target.members+source.members,before,"merging conserves represented population");
assert.equal(bandTier(target),3);
assert.equal(followerReadout(target).role,"warrior band");

const losses=[];
while(target.members>1)losses.push(applyFollowerCasualty(target));
assert.equal(losses.length,3);
assert.equal(target.members,1);
assert.deepEqual(applyFollowerCasualty(target),{dead:true,lost:1});

const people=[{faction:"player",members:4},{faction:"player"},{faction:"rival",members:3}];
const houses=[{faction:"player",pop:7},{faction:"rival",pop:5}];
assert.equal(populationOf(people,houses,"player"),12);
assert.equal(populationOf(people,houses,"rival"),8);
assert.deepEqual(followerGroupStatus(people.slice(0,2)),{count:5,fighting:false});
const house={faction:"rival",pop:9,level:2,hp:1};
captureDwelling(house,"player",4);
assert.equal(house.pop,4,"capturing band becomes the new residents without losing souls");

const size=34,save={version:1,complete:false,currentWorld:0,worldSeed:1,heights:Array.from({length:size+1},()=>Array(size+1).fill(3)),houses:[],people:[{faction:"player",x:5,y:5,hp:20,members:4}],bogs:[],mana:1,rivalMana:1,water:1,elapsed:1,simElapsed:1,nextId:2,beacon:{x:5,y:5},camera:{x:5,y:5},factionStarts:{player:{x:5,y:5},rival:{x:25,y:25}}};
assert.equal(isValidGameSave(save,size,["player","rival"]),true);
save.people[0].members=5;
assert.equal(isValidGameSave(save,size,["player","rival"]),false,"oversized bands are rejected from saves");

console.log("Meddle follower bands: population, tiers, casualties, capture, and save bounds OK");
