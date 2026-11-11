import test from 'node:test';
import assert from 'node:assert/strict';
import {campaign as world,withDungeons,dungeonEntrances,continuation} from './world.mjs';
import * as story from './story.mjs';
import {installExpansion,fresh,interact,step,continueAdventure,encode,decode} from '../campaign.mjs';
const fixtureRooms=dungeonEntrances.filter(d=>d.dungeon>=3).map((d,i)=>({id:d.to,kind:'dungeon',dungeon:d.dungeon,name:`Contract fixture ${i}`,checkpoint:true,checkpointAt:[3.5,5.5],tiles:Array.from({length:10},(_,y)=>y===0||y===9?'################':'#..............#'),exits:{},rewards:[{id:`fixture-gift-${i}`,at:[12.5,5.5],seal:story.seals[i],equipment:story.equipment[i]}]}));
installExpansion(world,{rooms:fixtureRooms});

test('story introduces six regional problems, recurring keepers and explicit consequences',()=>{
 assert.equal(story.regionalStories.length,7);assert.equal(story.seals.length,6);assert.equal(story.equipment.length,6);
 for(const r of story.regionalStories){assert.ok(r.problem.length>50);assert.ok(r.goal.length>50);assert.ok(r.consequence.length>50);assert.equal(story.regionalConsequence(r.id),r.problem);}
 for(let i=0;i<6;i++){const r=story.regionalStories[i+1];assert.equal(story.regionalConsequence(r.id,{seals:[story.seals[i]]}),r.consequence);}
 assert.match(story.opening,/three hearts/);assert.match(story.opening,/six/);assert.match(story.resolution,/Sen/);assert.match(story.resolution,/Oren/);assert.match(story.resolution,/Ida/);
});

test('all story dependencies resolve without cycles, purchases or consuming rewards',()=>{
 const records=world.rooms.flatMap(r=>[...r.links,...r.characters,...r.shops,...r.puzzles,...r.rewards,...r.puzzles.map(p=>p.reward),...(r.ending?[r.ending]:[])]).concat(story.campaign.quests,story.campaign.quests.map(q=>q.reward).filter(Boolean));
 const ids=records.map(r=>r.id);assert.equal(new Set(ids).size,ids.length);
 const graph=new Map(records.map(r=>[r.id,r.requires||[]]));for(const external of ['beacon-restored',...story.seals,...story.equipment])graph.set(external,[]);
 const active=new Set(),done=new Set();function visit(id){assert.ok(graph.has(id),id);assert.ok(!active.has(id),`cycle at ${id}`);if(done.has(id))return;active.add(id);for(const dep of graph.get(id))visit(dep);active.delete(id);done.add(id);}for(const id of graph.keys())visit(id);
 for(const quest of story.campaign.quests){assert.ok(quest.requires.length);assert.ok(quest.requires.every(id=>!id.includes('tonics')));}
 assert.equal(story.campaign.quests.filter(q=>q.id.endsWith('-lamps')).length,6);
});

test('three-heart ending explicitly continues, witnesses update journals, consequences persist',()=>{
 const s=fresh();assert.equal(continueAdventure(s,continuation.room),false);Object.assign(s,{status:'won',beaconRestored:true,relics:[0,1,2]});assert.equal(continueAdventure(s,continuation.room),true);assert.equal(s.room,30);assert.deepEqual(s.relics,[0,1,2]);
 for(let i=0;i<6;i++){s.room=50+i*18;s.x=5.5;s.y=7.5;assert.equal(interact(s),true);step(s,{},.04);assert.ok(s.quests.includes(`quest-${story.regionalStories[i+1].id}-witness`));s.seals.push(story.seals[i]);step(s,{},.04);assert.ok(s.quests.includes(`quest-${story.regionalStories[i+1].id}-restored`));}
 s.room=30;s.x=3.5;s.y=5.5;const restored=decode(encode(s));assert.ok(restored);assert.deepEqual(restored.seals,s.seals);assert.deepEqual(restored.quests,s.quests);
});

test('Far Lantern requires all seals, light and the preserved beacon',()=>{
 const s=fresh();Object.assign(s,{room:47,x:8.5,y:7.5,beaconRestored:true,relics:[0,1,2],light:true,seals:story.seals.slice(0,5)});assert.equal(interact(s),true);assert.equal(s.status,'playing');s.seals.push(story.seals[5]);s.light=false;interact(s);assert.equal(s.status,'playing');s.light=true;s.beaconRestored=false;interact(s);assert.equal(s.status,'playing');s.beaconRestored=true;assert.equal(interact(s),true);assert.equal(s.expandedEnding,true);assert.equal(s.status,'won');assert.equal(s.message,story.resolution);assert.deepEqual(s.relics,[0,1,2]);
});

test('dungeon adapter binds actual numeric ranges and rejects missing regions',()=>{
 const alternate=fixtureRooms.map((r,i)=>({...r,id:600+i*20}));const bound=withDungeons({campaign:{rooms:alternate}});
 for(let i=0;i<6;i++){const p=dungeonEntrances[i+3];assert.equal(bound.rooms.find(r=>r.id===p.from).links.find(l=>l.id===`dungeon-road-${i+3}`).to,alternate[i].id);}
 assert.throws(()=>withDungeons({rooms:[]}),/Missing dungeon/);assert.equal(world.rooms.find(r=>r.id===58).links.find(l=>l.id==='dungeon-road-3').to,300);
});

test('duration evidence makes no unmeasured play-time claim',()=>{
 assert.deepEqual(story.durationEvidence.measuredPlaySessions,[]);assert.equal(story.durationEvidence.completionEstimateHours,null);assert.match(story.durationEvidence.basis,/No timed human/);
});
