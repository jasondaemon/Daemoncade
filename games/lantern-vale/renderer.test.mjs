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

// Use the runtime's versioned module identity, exactly as the renderer does.
import * as runtime from './campaign.mjs?v=0.3.0-alpha.6';
import {withDungeons} from './expansion/world.mjs';
import {campaign as depths,dungeonDefinitions} from './expansion/dungeons.mjs';
import {seals,equipment} from './expansion/story.mjs';
import {drawFallback} from './renderer.mjs';
const aliases=new Map(dungeonDefinitions.slice(3).flatMap((d,i)=>[[d.seal,seals[i]],[d.equipment,equipment[i]]]));
function vocabulary(v){if(typeof v==='string')return aliases.get(v)||v;if(Array.isArray(v))return v.map(vocabulary);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,vocabulary(x)]));return v;}
runtime.installExpansion(withDungeons(vocabulary(depths)));
function recording(){
 const calls=[];
 const g={drawImage(){},fillText(...a){calls.push(['label',...a]);},fillRect(...a){calls.push(['rect',...a]);},save(){},restore(){},translate(){},rotate(){},createRadialGradient(){return {addColorStop(){}};}};
 const atlas={manifest,draw(ctx,name,x,y,time,scale){assert.equal(drawFrame(ctx,{},manifest,name,x,y,time,scale),true,name);calls.push([name,x,y,time,scale]);}};
 return {g,atlas,calls};
}
test('entire installed registry resolves raster frames and fallback in both lighting modes',()=>{
 const {g,atlas,calls}=recording(),s=runtime.fresh();
 for(const r of runtime.rooms)for(const light of [false,true]){
  s.room=r.id;s.light=light;
  for(const p of r.puzzles||[])s.expandedPuzzles[p.id]={controls:p.controls.map(c=>c.target),charge:p.seconds/2};
  for(const phase of ['tell','strike','recover']){
   for(const e of s.enemies[r.id])Object.assign(e,{phase,aim:[1,0],target:[8,5],timer:.3});
   const before=JSON.stringify(s);drawWorld(g,atlas,s,500,true);drawFallback(g,s);assert.equal(JSON.stringify(s),before,`room ${r.id}`);
  }
  for(const p of r.puzzles||[])s.events.push(p.id);
  for(const t of r.rewards||[])s.events.push(t.id);
  drawWorld(g,atlas,s,600);
 }
 const names=new Set(calls.map(c=>c[0]));
 for(const name of ['terrain.cinder-coast.floor.0','landmark.moonwood','npc.sen','npc.oren','npc.ida','npc.merchant','enemy.ember-colossus.attack','enemy.storm-roc.attack','enemy.frost-leviathan.attack','enemy.bell-leviathan.attack','enemy.moon-weaver.attack','enemy.horizon-iris.attack'])assert.ok(names.has(name),name);
 assert.ok(runtime.rooms.length>=264);
});
test('pause freezes all raster animation clocks and keeps state pure',()=>{
 const {g,atlas,calls}=recording(),s=runtime.fresh();s.room=300;
 drawWorld(g,atlas,s,100);s.status='paused';calls.length=0;
 drawWorld(g,atlas,s,900);const first=structuredClone(calls);calls.length=0;
 drawWorld(g,atlas,s,1900);assert.deepEqual(calls,first);
 s.status='playing';calls.length=0;drawWorld(g,atlas,s,2000);assert.notDeepEqual(calls,first);
});

import {bossWarningGeometry} from './renderer.mjs';
test('expanded warning geometry covers damage samples at actual origin, aim and strike time',()=>{
 function contains(rects,x,y){return rects.some(r=>{let dx=x*40-r.x,dy=y*40-r.y;if(r.angle!==undefined){const a=r.angle;[dx,dy]=[dx*Math.cos(a)+dy*Math.sin(a),-dx*Math.sin(a)+dy*Math.cos(a)];dy+=r.h/2;}return dx>=-1e-6&&dx<=r.w+1e-6&&dy>=-1e-6&&dy<=r.h+1e-6;});}
 for(const phase of ['tell','strike'])for(const progress of [.1,.5,.9])for(const kind of ['charge','volley','ring','sweep','cross','hunt']){
  const e={kind,phase,x:8,y:5,target:[4,3],aim:[Math.cos(.7),Math.sin(.7)],strike:1,timer:1-progress};
  const rects=bossWarningGeometry(e);assert.ok(rects.length);
  const covered=(x,y)=>assert.ok(contains(rects,x,y),`${kind} ${phase} ${progress}: ${x},${y}`);
  if(kind==='cross'){covered(4,8);covered(14,3);}
  if(kind==='hunt'){covered(4,3);covered(6,4);}
  if(kind==='charge'){const distance=phase==='strike'?(1-progress)*4:3;covered(8+Math.cos(.7)*distance,5+Math.sin(.7)*distance);covered(8-Math.cos(.7)*.9,5-Math.sin(.7)*.9);}
  if(kind==='volley')for(const offset of [-.3,0,.3])covered(8+Math.cos(.7+offset)*9,5+Math.sin(.7+offset)*9);
  if(kind==='ring')for(let angle=0;angle<Math.PI*2;angle+=.1)for(const edge of [-.64,0,.64])covered(8+Math.cos(angle)*(progress*6+edge),5+Math.sin(angle)*(progress*6+edge));
  if(kind==='sweep')for(const offset of [-.19,0,.19])covered(8+Math.cos(.7+progress*Math.PI+offset)*6.9,5+Math.sin(.7+progress*Math.PI+offset)*6.9);
 }
});
