import assert from "node:assert/strict";
import {isValidGameSave,multiFactionOutcome,seededRandom,separatedFactionStarts,separatedStarts,viableRouteCells} from "./rules.mjs";

for(let seed=1;seed<=200;seed++){
  const starts=separatedFactionStarts(52,seededRandom(seed),3,21);
  assert.equal(starts.length,3);
  for(let a=0;a<starts.length;a++)for(let b=a+1;b<starts.length;b++)assert.ok(Math.hypot(starts[a].x-starts[b].x,starts[a].y-starts[b].y)>=21);
  assert.ok(viableRouteCells(starts[0],starts[1],52).size>40);
}
const classic=separatedStarts(34,seededRandom(44),19);assert.ok(classic.distance>=19);
const save={version:1,complete:false,savedAt:new Date().toISOString(),revision:"r",sessionId:"s",currentWorld:0,worldSeed:1,matchVariant:"classic",heights:Array.from({length:53},()=>Array(53).fill(3)),bogs:[],houses:[],people:[],landmarks:[],mana:1,rivalMana:1,water:1,elapsed:0,simElapsed:0,nextId:1,beacon:{x:1,y:1},camera:{x:1,y:1,zoom:1,rotation:0},factionStarts:{player:{x:5,y:5},rival:{x:45,y:45}}};
assert.equal(isValidGameSave(save,52),true);assert.equal(isValidGameSave(save,34),false);
const orunPerson={id:2,faction:"rival2",x:20,y:20,hp:10};save.people=[orunPerson];save.factionStarts.rival2={x:26,y:45};assert.equal(isValidGameSave(save,52,["player","rival","rival2"]),true);assert.equal(isValidGameSave(save,52),false);
assert.equal(multiFactionOutcome({player:5,rival:0,rival2:0},11),true);assert.equal(multiFactionOutcome({player:5,rival:0,rival2:2},11),null);assert.equal(multiFactionOutcome({player:0,rival:2,rival2:0},11),false);
console.log("Meddle frontier foundation: 200 seeds and dynamic save size OK");
