import test from 'node:test';
import assert from 'node:assert/strict';
import {mainlandCoast,beachSites} from './coast.js';
import {careerTrack} from './career-tracks.js';
import {buildTrack} from './world-track.js';
test('all coastal tracks sit inland of a single fixed western shoreline',()=>{
 for(let i=0;i<4;i++){
  const track=buildTrack(careerTrack(2,i)),{shore,land}=mainlandCoast(track);
  const west=Math.min(...track.points.map(p=>p.x));
  assert.ok(shore.every(p=>p.x<=west-38));
  assert.equal(shore[0].z,-3000);assert.equal(shore.at(-1).z,3000);
  assert.equal(land.at(-1).x,3000);
  const reversed={...track,points:track.points.map(p=>({...p,heading:p.heading+Math.PI}))};
  assert.deepEqual(mainlandCoast(reversed),{shore,land},'viewing direction cannot move the water');
 }
});
test('beach furniture and houses are bounded, deterministic and clear of every track',()=>{
 for(let i=0;i<4;i++) {
  const track=buildTrack(careerTrack(2,i)),sites=beachSites(track);
  assert.deepEqual(sites,beachSites(track));
  assert.ok(sites.umbrellas.length>0&&sites.umbrellas.length<100);
  assert.ok(sites.houses.length>0&&sites.houses.length<80);
  for(const p of sites.umbrellas)assert.ok(Math.min(...track.points.map(q=>Math.hypot(q.x-p.x,q.y-p.z)))>17);
  for(const p of sites.houses)assert.ok(Math.min(...track.points.map(q=>Math.hypot(q.x-p.x,q.y-p.z)))>=28);
 }
});
