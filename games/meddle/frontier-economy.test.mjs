import assert from "node:assert/strict";
import {canAffordUpgrade,causewayCells,createEconomy,generateNodes,harvest,nearestReachableNode,normalizedPriorities,oceanChannels,purchaseUpgradePath,revealFog,spendUpgrade,validEconomySave,workerJob} from "./frontier-economy.mjs";

const factions=["player","rival","rival2"],stock=createEconomy(factions);
assert.deepEqual(Object.keys(stock),factions);
assert.deepEqual(normalizedPriorities({food:2,wood:1}),{food:2/3,wood:1/3,stone:0,build:0});
assert.ok(["food","wood","stone","build"].includes(workerJob(12,stock.player.priorities)));
assert.equal(canAffordUpgrade(0,{wood:10,stone:8}).ok,false);
assert.deepEqual(spendUpgrade(0,{wood:30,stone:10}).stock,{wood:8,stone:2});
assert.deepEqual(purchaseUpgradePath(1,3,{wood:120,stone:100}),{ok:true,level:3,stock:{wood:18,stone:18},missing:{}});assert.equal(purchaseUpgradePath(1,4,{wood:40,stone:30}).level,2);
const random=(()=>{let n=7;return()=>((n=n*16807%2147483647)-1)/2147483646;})(),starts=[{x:6,y:6},{x:45,y:8},{x:26,y:45}],nodes=generateNodes({size:52,starts,random,isValid:(x,y)=>x>1&&y>1&&x<50&&y<50});
for(const start of starts)for(const type of ["forest","mine"])assert.ok(nodes.some(node=>node.type===type&&Math.hypot(node.x-start.x,node.y-start.y)<=9));
const chosen=nearestReachableNode({x:0,y:0},[{id:1,type:"forest",x:2,y:0,amount:4},{id:2,type:"forest",x:1,y:0,amount:0},{id:3,type:"forest",x:3,y:0,amount:4}],"forest",(_,node)=>node.id===1?8:3);assert.equal(chosen.id,3);
const before=stock.player.wood,taken=harvest(nodes.find(node=>node.type==="forest"),stock.player,2,1.5);assert.equal(taken,3);assert.equal(stock.player.wood,before+3);
const explored=Array(52*52).fill(0);revealFog(explored,52,6,6,4);assert.ok(explored.reduce((a,b)=>a+b,0)>35);assert.equal(explored[51*52+51],0);
const ocean=Array.from({length:105},()=>Array(105).fill(4));oceanChannels(ocean,(()=>{const values=[.2,.4,.7];let index=0;return()=>values[index++%values.length];})());assert.ok(ocean.flat().some(height=>height===0));const causeway=causewayCells({x:5,y:5},{x:95,y:95},104);assert.deepEqual(causeway[0],{x:5,y:5});assert.deepEqual(causeway.at(-1),{x:95,y:95});assert.ok(causeway.length>90);const reachable=()=>{const queue=[[5,5]],seen=new Set(["5,5"]);while(queue.length){const [x,y]=queue.shift();if(x===95&&y===95)return true;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(nx<0||ny<0||nx>104||ny>104||seen.has(key)||ocean[ny][nx]<=1.4)continue;seen.add(key);queue.push([nx,ny]);}}return false;};assert.equal(reachable(),false);for(const cell of causeway)ocean[cell.y][cell.x]=3;assert.equal(reachable(),true);
assert.equal(validEconomySave({stock,nodes,farms:[],explored},factions,52),true);assert.equal(validEconomySave({stock,nodes,farms:[],explored:[]},factions,52),false);
console.log("Meddle Frontier economy: fair nodes, deterministic jobs, harvesting, upgrade gates, fog, and save validation OK");
