import assert from "node:assert/strict";
import { applyFollowerCasualty, awardBandExperience, bandSize, bandTier, recoverFollowerHealth, resolveCombatTick, seededRandom } from "./rules.mjs";

function campaign(seed, healing) {
  const random=seededRandom(seed),veteran={members:2+Math.floor(random()*3),hp:0,experience:0,rank:1,lastHarmAt:0};
  veteran.hp=18*veteran.members;
  let now=0;
  for(let encounter=0;encounter<12&&veteran.members>0;encounter++){
    const foe={members:1,hp:10,experience:0,rank:1};
    while(veteran.hp>0&&foe.hp>0){
      const dt=.1,rank=1+(bandTier(veteran)-1)*.12;
      resolveCombatTick(veteran,foe,dt*2.2*Math.sqrt(bandSize(veteran))*rank,dt*2.2);
      now+=dt;veteran.lastHarmAt=now;
    }
    if(foe.hp<=0)awardBandExperience(veteran,1);
    if(veteran.hp<=0){const casualty=applyFollowerCasualty(veteran);if(casualty.dead){veteran.members=0;break;}veteran.lastHarmAt=now;}
    const respite=2+random()*33;
    if(healing)for(let rested=0;rested<respite;rested+=.25)recoverFollowerHealth(veteran,.25,now+rested);
    now+=respite;
  }
  return {rank:veteran.members>0?bandTier(veteran):0,survivors:veteran.members};
}

let healedWarriors=0,baselineWarriors=0,healedSurvivors=0;
for(let seed=1;seed<=400;seed++){
  const healed=campaign(seed,true),baseline=campaign(seed,false);
  if(healed.rank===3)healedWarriors++;
  if(baseline.rank===3)baselineWarriors++;
  if(healed.survivors>0)healedSurvivors++;
}
console.log(`Meddle veteran balance: ${healedWarriors}/400 warriors with recovery vs ${baselineWarriors}/400 without; ${healedSurvivors}/400 bands survived`);
assert.ok(healedWarriors>baselineWarriors,"restrained recovery measurably improves the chance that a veteran reaches warrior rank");
assert.ok(healedWarriors<400,"recovery does not make warrior promotion automatic across varied encounter spacing");
assert.ok(healedSurvivors<400,"recovery does not make every campaign immortal");
