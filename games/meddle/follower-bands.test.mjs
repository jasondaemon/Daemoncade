import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { advanceDwelling, applyFollowerCasualty, awardBandExperience, bandSize, bandTier, captureDwelling, dwellingVeteranExperience, followerAnimationFrame, followerGroupStatus, followerMaximumHealth, followerReadout, isValidGameSave, mergeFollowerBands, populationOf, recoverFollowerHealth, releaseForReckoning, withdrawDwellingVeteran } from "./rules.mjs";

const target={faction:"player",members:2,hp:14,rank:2,experience:4},source={faction:"player",members:2,hp:13,rank:2,experience:5};
const gameScript=readFileSync(new URL("./game.js",import.meta.url),"utf8");
assert.match(gameScript,/drawFollowerShadow\(q,size,champion,leader\)[\s\S]+q\.y\+size\*\.145[\s\S]+createRadialGradient/,"every raster follower rank shares a soft shadow anchored at the atlas foot line");
assert.match(gameScript,/order!=="reckoning"[\s\S]+recoverFollowerHealth\(p,dt,simElapsed\)/,"live recovery is withheld during Reckoning");
assert.match(gameScript,/if\(hazard>0\)p\.lastHarmAt=simElapsed/,"flood, bog, and starvation reset the shared recovery cooldown");
assert.match(gameScript,/type==="rank"[\s\S]+fx\.label/,"fighter and warrior promotion has a distinct readable battlefield cue");
assert.doesNotMatch(gameScript,/\$\{factionName\(p\.faction\)\} people seize/,"capture feedback does not duplicate the word people");
const before=bandSize(target)+bandSize(source),healthBefore=target.hp+source.hp,experienceBefore=target.experience+source.experience;
assert.equal(mergeFollowerBands(target,source),2);
assert.equal(bandSize(target),4);
assert.equal(source.members,0);
assert.equal(target.members+source.members,before,"merging conserves represented population");
assert.equal(target.hp+source.hp,healthBefore,"a complete merge conserves total remaining health");
assert.equal(target.experience+source.experience,experienceBefore,"a complete merge conserves veteran experience");
assert.equal(bandTier(target),3);
assert.equal(followerReadout(target).role,"warrior band");
for(const fixture of [
  {target:{members:3,hp:21,experience:2,rank:1},source:{members:4,hp:28,experience:8,rank:3},maximum:4,moved:1},
  {target:{members:1,hp:4,experience:0,rank:1},source:{members:4,hp:61,experience:7,rank:2},maximum:3,moved:2},
  {target:{members:2,hp:35,experience:3,rank:2},source:{members:3,hp:9,experience:6,rank:2},maximum:4,moved:2},
]){
  const population=fixture.target.members+fixture.source.members,health=fixture.target.hp+fixture.source.hp,experience=fixture.target.experience+fixture.source.experience;
  assert.equal(mergeFollowerBands(fixture.target,fixture.source,fixture.maximum),fixture.moved);
  assert.equal(fixture.target.members+fixture.source.members,population,"partial consolidation conserves represented population");
  assert.ok(Math.abs(fixture.target.hp+fixture.source.hp-health)<1e-9,"partial consolidation conserves health rather than duplicating it");
  assert.ok(Math.abs(fixture.target.experience+fixture.source.experience-experience)<1e-9,"partial consolidation conserves fractional veteran experience");
  assert.ok(fixture.target.hp<=fixture.target.members*18&&fixture.source.hp<=fixture.source.members*18,"both partial bands respect member health caps");
}
const fullTarget={members:4,hp:40,experience:2,rank:1},blockedSource={members:2,hp:20,experience:2,rank:1};
assert.equal(mergeFollowerBands(fullTarget,blockedSource),0,"a full target cannot siphon health or experience");
assert.deepEqual([fullTarget.hp,blockedSource.hp,fullTarget.experience,blockedSource.experience],[40,20,2,2]);
const largeRecruitBand={members:4,rank:1,experience:0,hp:40};
assert.equal(bandTier(largeRecruitBand),1,"represented headcount does not grant rank");
assert.equal(awardBandExperience(largeRecruitBand,3),2,"rank is earned separately through experience");
largeRecruitBand.lastHarmAt=10;
assert.equal(recoverFollowerHealth(largeRecruitBand,1,19),0,"recovery waits for ten complete safe simulated seconds");
assert.equal(recoverFollowerHealth(largeRecruitBand,1,20),.25,"a safe band recovers at the restrained shared rate");
for(let second=21;second<200;second++)recoverFollowerHealth(largeRecruitBand,1,second);
assert.equal(largeRecruitBand.hp,followerMaximumHealth(largeRecruitBand),"recovery stops at the member-based maximum without resurrection");
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
const house={faction:"rival",pop:9,level:2,hp:1,veteranExperience:6};
captureDwelling(house,"player",4,8);
assert.equal(house.pop,4,"capturing band becomes the new residents without losing souls");
assert.equal(dwellingVeteranExperience(house),8,"capture replaces the defeated lineage with the conqueror's exact experience");
assert.equal(withdrawDwellingVeteran(house),8);
assert.equal(dwellingVeteranExperience(house),0,"veteran experience leaves a dwelling exactly once");

const size=34,save={version:1,complete:false,currentWorld:0,worldSeed:1,heights:Array.from({length:size+1},()=>Array(size+1).fill(3)),houses:[],people:[{faction:"player",x:5,y:5,hp:20,members:4}],bogs:[],mana:1,rivalMana:1,water:1,elapsed:1,simElapsed:1,nextId:2,beacon:{x:5,y:5},camera:{x:5,y:5},factionStarts:{player:{x:5,y:5},rival:{x:25,y:25}}};
assert.equal(isValidGameSave(save,size,["player","rival"]),true);
save.people[0].members=5;
assert.equal(isValidGameSave(save,size,["player","rival"]),false,"oversized bands are rejected from saves");
save.people[0].members=4;
save.people[0].lastHarmAt=1;
save.people[0].experience=8;save.people[0].rank=3;
save.houses=[{faction:"player",x:6,y:6,level:2,pop:4,veteranExperience:8}];
assert.equal(isValidGameSave(JSON.parse(JSON.stringify(save)),size,["player","rival"]),true,"veteran recovery and settlement lineage survive a real JSON save round trip");
save.people[0].lastHarmAt=-1;
assert.equal(isValidGameSave(save,size,["player","rival"]),false,"malformed recovery timestamps cannot poison a resumed world");
save.people[0].lastHarmAt=1;save.houses=[];

const lifecyclePeople=[{id:1,faction:"player",x:5,y:5,members:2,hp:18,rank:1,experience:0},{id:2,faction:"player",x:5.4,y:5.2,members:2,hp:18,rank:1,experience:0}],lifecycleHouses=[];
const lifecycleStart=populationOf(lifecyclePeople,lifecycleHouses,"player");
mergeFollowerBands(lifecyclePeople[0],lifecyclePeople[1]);lifecyclePeople.splice(1,1);
const resumedPeople=JSON.parse(JSON.stringify(lifecyclePeople));
assert.equal(populationOf(resumedPeople,lifecycleHouses,"player"),lifecycleStart,"merged band survives save/resume without changing population");
const lifecycleSnapshot=JSON.parse(JSON.stringify({...save,people:resumedPeople,houses:[]}));
assert.equal(isValidGameSave(lifecycleSnapshot,size,["player","rival"]),true,"a real serialized merged-band snapshot validates for restore");
const disaster=applyFollowerCasualty(resumedPeople[0]);
assert.deepEqual(disaster,{dead:false,lost:1},"a disaster removes exactly one represented soul");
resumedPeople[0].experience=8;resumedPeople[0].rank=3;
const settlement={faction:"player",x:6,y:6,level:1,cap:3,pop:0,hp:30};
captureDwelling(settlement,"player",bandSize(resumedPeople[0]),resumedPeople[0].experience);lifecycleHouses.push(settlement);resumedPeople.length=0;
assert.equal(populationOf(resumedPeople,lifecycleHouses,"player"),lifecycleStart-1,"settlement stores every surviving merged soul");
const settledSnapshot=JSON.parse(JSON.stringify({...save,people:[],houses:lifecycleHouses}));
assert.equal(isValidGameSave(settledSnapshot,size,["player","rival"]),true,"settled veteran lineage survives a JSON save/resume boundary");
assert.equal(advanceDwelling(settlement),true,"a full veteran dwelling transfers one resident into emigration");
const emigrantExperience=withdrawDwellingVeteran(settlement),emigrant={faction:"player",members:1,hp:10,experience:emigrantExperience,rank:bandTier({experience:emigrantExperience})};
resumedPeople.push(emigrant);
assert.equal(populationOf(resumedPeople,lifecycleHouses,"player"),lifecycleStart-1,"emigration transfers rather than duplicates a resident");
assert.equal(emigrant.experience,8,"the first emigrant resumes the stored warrior lineage");
const released=releaseForReckoning(lifecycleHouses);
assert.equal(released.length,lifecycleStart-2,"Reckoning releases every resident still stored after veteran emigration");
assert.equal(released.reduce((sum,resident)=>sum+resident.experience,0),0,"Reckoning cannot duplicate experience already carried by an emigrant");
assert.equal(populationOf([...resumedPeople,...released],[],"player"),lifecycleStart-1,"merge, resume, casualty, settlement, emigration, and Reckoning conserve every surviving soul");
const collapsing={faction:"player",pop:2,veteranExperience:8},collapseExperience=withdrawDwellingVeteran(collapsing),evacuee={faction:"player",members:1,hp:10,experience:collapseExperience};
assert.equal(evacuee.experience,8,"a surviving evacuee can carry the veteran lineage from a destroyed settlement");
assert.equal(withdrawDwellingVeteran(collapsing),0,"destroying a settlement cannot release its lineage twice");

console.log("Meddle follower bands: population, tiers, casualties, capture, and save bounds OK");
