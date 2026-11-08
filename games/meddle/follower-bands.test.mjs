import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyFollowerCasualty, awardBandExperience, bandSize, bandTier, captureDwelling, followerAnimationFrame, followerGroupStatus, followerReadout, isValidGameSave, mergeFollowerBands, populationOf, releaseForReckoning } from "./rules.mjs";

const target={faction:"player",members:2,hp:14,rank:2,experience:4},source={faction:"player",members:2,hp:13,rank:2,experience:5};
const gameScript=readFileSync(new URL("./game.js",import.meta.url),"utf8");
assert.match(gameScript,/drawFollowerShadow\(q,size,champion,leader\)[\s\S]+q\.y\+size\*\.145[\s\S]+createRadialGradient/,"every raster follower rank shares a soft shadow anchored at the atlas foot line");
const before=bandSize(target)+bandSize(source);
assert.equal(mergeFollowerBands(target,source),2);
assert.equal(bandSize(target),4);
assert.equal(source.members,0);
assert.equal(target.members+source.members,before,"merging conserves represented population");
assert.equal(bandTier(target),3);
assert.equal(followerReadout(target).role,"warrior band");
const largeRecruitBand={members:4,rank:1,experience:0,hp:40};
assert.equal(bandTier(largeRecruitBand),1,"represented headcount does not grant rank");
assert.equal(awardBandExperience(largeRecruitBand,3),2,"rank is earned separately through experience");
assert.equal(followerAnimationFrame({age:0,movingUntil:0,combatUntil:0},1),0,"idle followers hold the contact pose");
assert.deepEqual([.05,.18,.32].map(age=>followerAnimationFrame({age,movingUntil:2,combatUntil:0},1)),[0,1,2],"walking cycles through three aligned frames");
assert.deepEqual([1,1.12,1.23].map(time=>followerAnimationFrame({id:0,age:.3,movingUntil:2,combatUntil:2},time)),[3,4,5],"combat cycles through ready, strike, and recovery frames");

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
save.people[0].members=4;

const lifecyclePeople=[{id:1,faction:"player",x:5,y:5,members:2,hp:18,rank:1,experience:0},{id:2,faction:"player",x:5.4,y:5.2,members:2,hp:18,rank:1,experience:0}],lifecycleHouses=[];
const lifecycleStart=populationOf(lifecyclePeople,lifecycleHouses,"player");
mergeFollowerBands(lifecyclePeople[0],lifecyclePeople[1]);lifecyclePeople.splice(1,1);
const resumedPeople=JSON.parse(JSON.stringify(lifecyclePeople));
assert.equal(populationOf(resumedPeople,lifecycleHouses,"player"),lifecycleStart,"merged band survives save/resume without changing population");
const lifecycleSnapshot=JSON.parse(JSON.stringify({...save,people:resumedPeople,houses:[]}));
assert.equal(isValidGameSave(lifecycleSnapshot,size,["player","rival"]),true,"a real serialized merged-band snapshot validates for restore");
const disaster=applyFollowerCasualty(resumedPeople[0]);
assert.deepEqual(disaster,{dead:false,lost:1},"a disaster removes exactly one represented soul");
const settlement={faction:"player",level:1,pop:0,hp:30};
captureDwelling(settlement,"player",bandSize(resumedPeople[0]));lifecycleHouses.push(settlement);resumedPeople.length=0;
assert.equal(populationOf(resumedPeople,lifecycleHouses,"player"),lifecycleStart-1,"settlement stores every surviving merged soul");
const released=releaseForReckoning(lifecycleHouses);
assert.equal(released.length,lifecycleStart-1,"Reckoning releases every stored soul after merge, resume, disaster, and settlement");

console.log("Meddle follower bands: population, tiers, casualties, capture, and save bounds OK");
