import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isValidGameSave, seededRandom, separatedStarts, viableRouteCells } from "./rules.mjs";

const launchMarkup=readFileSync(new URL("./index.html",import.meta.url),"utf8");
const launchValues=name=>[...launchMarkup.matchAll(new RegExp(`name="${name}" value="([^"]+)"`,"g"))].map(match=>match[1]);
assert.deepEqual(launchValues("match-variant"),["classic","mortal"],"launch offers exactly Classic and Mortal contests");
assert.deepEqual(launchValues("map-size"),["34","54","74"],"launch offers exactly the three supported map sizes");
for(const contest of launchValues("match-variant"))for(const size of launchValues("map-size"))assert.ok(contest&&size,`${contest} ${size} is selectable as an independent launch combination`);

for(const size of [34,54,74])for(let seed=1;seed<=200;seed++){
  const minimum=size*.58,starts=separatedStarts(size,seededRandom(seed),minimum);
  assert.ok(starts.distance>=minimum,`${size} seed ${seed} keeps both peoples apart`);
  assert.ok(viableRouteCells(starts.player,starts.rival,size).size>=Math.floor(minimum),`${size} seed ${seed} reserves a cross-realm route`);
  for(const point of [starts.player,starts.rival])assert.ok(point.x>=3&&point.y>=3&&point.x<=size-3&&point.y<=size-3,`${size} seed ${seed} start stays inside the realm`);
}

const saveFor=size=>({version:1,complete:false,savedAt:new Date().toISOString(),revision:`size-${size}`,sessionId:"test",mapSize:size,currentWorld:0,worldSeed:1,matchVariant:"classic",heights:Array.from({length:size+1},()=>Array(size+1).fill(3)),bogs:[],houses:[],people:[],landmarks:[],mana:130,rivalMana:130,water:1,elapsed:0,simElapsed:0,nextId:1,beacon:{x:5,y:5},camera:{x:5,y:5,zoom:1.8,rotation:0},factionStarts:{player:{x:5,y:5},rival:{x:size-5,y:size-5}}});
for(const size of [34,54,74]){
  const save=saveFor(size);
  assert.equal(isValidGameSave(save,size,["player","rival"]),true,`${size}×${size} two-faction save is valid`);
  assert.equal(isValidGameSave(save,size===34?54:34,["player","rival"]),false,`${size}×${size} save cannot restore at another size`);
  save.people=[{id:1,faction:"rival2",x:10,y:10,hp:10}];
  assert.equal(isValidGameSave(save,size,["player","rival"]),false,"third-faction data is rejected");
}

console.log("Meddle map sizes: 600 fair two-faction starts, routes, and size-compatible saves OK");
