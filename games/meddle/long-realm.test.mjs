import assert from "node:assert/strict";
import { isValidGameSave, seededRandom, separatedStarts, viableRouteCells } from "./rules.mjs";

const SIZE=75,MINIMUM_SEPARATION=SIZE*.58;
for(let seed=1;seed<=300;seed++){
  const starts=separatedStarts(SIZE,seededRandom(seed),MINIMUM_SEPARATION);
  assert.ok(starts.distance>=MINIMUM_SEPARATION,`seed ${seed} keeps the two peoples apart`);
  assert.ok(viableRouteCells(starts.player,starts.rival,SIZE).size>70,`seed ${seed} reserves a cross-realm route`);
  for(const point of [starts.player,starts.rival])assert.ok(point.x>=3&&point.y>=3&&point.x<=SIZE-3&&point.y<=SIZE-3,`seed ${seed} start stays inside the realm`);
}

const heights=Array.from({length:SIZE+1},()=>Array(SIZE+1).fill(3));
const save={version:1,complete:false,savedAt:new Date().toISOString(),revision:"long",sessionId:"test",currentWorld:0,worldSeed:1,matchVariant:"classic",heights,bogs:[],houses:[],people:[],landmarks:[],mana:130,rivalMana:130,water:1,elapsed:0,simElapsed:0,nextId:1,beacon:{x:5,y:5},camera:{x:5,y:5,zoom:1.8,rotation:0},factionStarts:{player:{x:5,y:5},rival:{x:69,y:69}}};
assert.equal(isValidGameSave(save,SIZE,["player","rival"]),true,"two-faction 75x75 save is valid");
save.people=[{id:1,faction:"rival2",x:30,y:30,hp:10}];
assert.equal(isValidGameSave(save,SIZE,["player","rival"]),false,"third-faction data cannot enter a Long Realm save");
assert.equal(isValidGameSave({...save,people:[]},34,["player","rival"]),false,"Long Realm save cannot replace Classic");

console.log("Meddle Long Realm: 300 separated two-faction starts, route reservation, and isolated save shape OK");
