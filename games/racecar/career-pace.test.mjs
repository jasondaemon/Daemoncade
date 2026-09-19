import test from 'node:test';
import assert from 'node:assert/strict';
import {Run} from './rules.js';
import {newCareer,tunedCar,configureCareerRivals} from './career.js';
import {careerTrack} from './career-tracks.js';
import {driver} from './driving-test-helper.mjs';

function race(car,circuit,track,engine=0,cornerSpeed=.8) {
 const p=newCareer('normal');p.circuit=circuit;p.car=car;p.parts={[car]:{engine}};
 const r=new Run({mode:'race',difficulty:'normal'});r.car=tunedCar(p);
 r.route=careerTrack(circuit,track);r.route.laps=2;r.goal=r.route.length*2;r.careerId='pace-test';
 configureCareerRivals(r,p);
 for(let i=0;i<24000&&!['finished','lost'].includes(r.phase);i++)r.update(1/60,driver(r,0,cornerSpeed));
 assert.equal(r.phase,'finished');return r;
}
test('Pacific Coast demands more than a Metro with one engine upgrade',()=>{
 for(let track=0;track<4;track++) {
  const starter=race('metro',2,track,1),sport=race('sport',2,track,1,1);
  assert.equal(starter.collisions,0,'starter comparison must be a clean drive');
  assert.equal(starter.position,4,`Metro track ${track}`);
  assert.ok(sport.position<=3,`Sprint can podium on track ${track}`);
  assert.ok(sport.time<starter.time);
 }
});
test('faster and no-braking Metro drivers cannot win Pacific Coast',()=>{
 for(const speed of [.9,1,Infinity])for(let track=0;track<4;track++){
  const r=race('metro',2,track,1,speed);
  assert.ok(r.position>1,`Metro won track ${track}, corner multiplier ${speed}`);
 }
});
test('stock starter remains viable in the opening circuit',()=>{
 for(let track=0;track<4;track++)assert.ok(race('metro',0,track).position<=3);
});
test('rival performance is independent of the selected player car and respects difficulty',()=>{
 const make=(difficulty,car)=>{const p=newCareer(difficulty);p.car=car;p.circuit=2;const r=new Run({mode:'race',difficulty});configureCareerRivals(r,p);return r.rivals;};
 assert.deepEqual(make('normal','metro'),make('normal','apex'));
 const easy=make('easy','metro'),normal=make('normal','metro'),hard=make('hard','metro');
 for(let i=0;i<3;i++){assert.ok(easy[i].racePace<normal[i].racePace);assert.ok(hard[i].racePace>normal[i].racePace);assert.ok(normal[i].performance.accel>0);}
});
