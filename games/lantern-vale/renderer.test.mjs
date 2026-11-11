import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import manifest from './assets/gameplay/manifest.mjs';
import {drawFrame} from './assets/gameplay/atlas.mjs';
import {drawWorld} from './renderer.mjs';
import {fresh} from './campaign.mjs';

test('runtime manifest matches distributable JSON',async()=>{
 assert.deepEqual(manifest,JSON.parse(await readFile(new URL('./assets/gameplay/atlas.json',import.meta.url))));
});
test('all campaign rooms draw real atlas frames with light, progression and attack states',()=>{
 const calls=[],names=new Set();
 const g={drawImage(...args){calls.push(args);},fillRect(){},fillText(){},save(){},restore(){},translate(){},rotate(){},createRadialGradient(){return {addColorStop(){}};}};
 const atlas={manifest,draw(context,name,x,y,time,scale){names.add(name);assert.equal(drawFrame(context,{},manifest,name,x,y,time,scale),true,name);}};
 for(let room=0;room<30;room++)for(const light of [false,true]){
  const s=fresh();s.room=room;s.light=light;
  for(const advanced of [false,true]){
   if(advanced){s.opened=[room];s.switches=[0,1,2];s.keys=[0,1,2];s.swing=.12;s.facing=[0,-1];}
   drawWorld(g,atlas,s,340,advanced);
  }
 }
 assert.ok(calls.length>17000);
 for(const name of ['keeper.right.idle','keeper.up.strike','prop.bridge.0','prop.gate.0','prop.plate-lit.0','prop.chest-open.0','enemy.tide-warden.walk','effect.sword-arc'])assert.ok(names.has(name),name);
 for(const land of Object.keys(manifest.terrainSets))assert.ok(names.has(manifest.terrainSets[land].floor[0]),land);
});

test('authored puzzles, combat tells, projectiles and damage render without mutating rules',()=>{
 const names=new Set(),labels=[],rects=[];
 const g={drawImage(){},fillText(text){labels.push(text);},fillRect(...r){rects.push(r);},save(){},restore(){},translate(){},rotate(){},createRadialGradient(){return {addColorStop(){}};}};
 const atlas={manifest,draw(context,name,x,y,time,scale){names.add(name);assert.equal(drawFrame(context,{},manifest,name,x,y,time,scale),true,name);}};
 for(const room of [0,2,11,18,22,26,27,28,29]){
  const s=fresh();s.room=room;s.light=true;s.puzzleState[room]={a:1,b:3,grown:true,charge:1};s.projectiles=[{x:4,y:4,disc:true},{x:5,y:4}];
  for(const phase of ['tell','strike','recover']){
   for(const e of s.enemies[room])Object.assign(e,{phase,aim:[1,0],target:[8,5],timer:.4});
   const before=JSON.stringify(s);drawWorld(g,atlas,s,400);assert.equal(JSON.stringify(s),before,'renderer must not mutate campaign state');
  }
  s.hp--;for(const e of s.enemies[room])e.hp--;drawWorld(g,atlas,s,450);
 }
 for(const name of ['npc.mira','prop.secondary-boomerang.0','effect.projectile','effect.danger-ring','enemy.root-warden.windup','enemy.tide-warden.attack','enemy.prism-warden.hurt','effect.spark'])assert.ok(names.has(name),name);
 for(const text of ['Mira · E','Sen · E','Oren · E','Exposed','Return · E','Keeper seal'])assert.ok(labels.includes(text),text);
 assert.ok(rects.some(r=>r[2]===640&&r[3]===400),'damage flash covers the viewport');
});
