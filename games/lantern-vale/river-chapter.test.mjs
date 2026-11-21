import test from 'node:test';
import assert from 'node:assert/strict';
import {attack, canStand, decode, encode, fresh, installExpansion, interact, step, toggle} from './campaign.mjs';
import {adventure} from './expansion/adventure.mjs';
import {riverChapter, riverStart} from './river-chapter.mjs';

installExpansion(adventure);
const previousSave = encode(fresh());
installExpansion(riverChapter);

test('older checkpoints still load with the chapter installed', () => {
  assert.equal(decode(previousSave).room, 0);
  assert.deepEqual(JSON.parse(encode(fresh())).expansion.enemies, {});
});

test('the river chapter teaches light, opens the crossing and saves progress', () => {
  const state = Object.assign(fresh(), {room:riverStart, x:5.5, y:6.5, visited:[riverStart]});
  const tick = (x=0,y=0) => step(state,{x,y},1/60);
  function walk(x,y) {
    for(let frames=0;frames<300;frames++) {
      const dx=x-state.x, dy=y-state.y;
      if(Math.hypot(dx,dy)<.06) return;
      tick(dx,dy);
    }
    assert.fail(`Could not walk to ${x},${y} in room ${state.room} from ${state.x},${state.y}`);
  }
  function cross(room,x,y) {
    const dx=x-state.x, dy=y-state.y;
    for(let frames=0;frames<40&&state.room!==room;frames++) tick(dx,dy);
    assert.equal(state.room,room);
  }

  assert.equal(interact(state),'save');
  walk(14.5,5.5);
  cross(501,16,5.5);
  assert.equal(canStand(state,10.5,5.5),false,'flooded crossing blocks travel');
  walk(7.5,5.5);
  walk(7.5,1.5);
  cross(502,7.5,-1);
  walk(8.5,8.5);
  cross(501,8.5,10);
  walk(7.5,6.5);
  toggle(state);
  for(let i=0;i<50;i++) tick();
  assert.ok(state.events.includes('river-guide-lamp'));
  walk(9.5,6.5);
  walk(9.5,8.5);
  walk(12.5,8.5);
  interact(state);
  assert.equal(state.room,503);
  walk(13.5,5.5);
  interact(state);
  assert.equal(state.room,504);
  walk(14.5,5.5);
  interact(state);
  assert.equal(state.room,504,'receiver gates the boss');
  walk(5.5,5.5);
  walk(6.5,3.5);
  walk(5.5,3.5);
  interact(state);
  walk(6.5,3.5);
  walk(6.5,5.5);
  walk(8.5,5.5);
  walk(8.5,7.5);
  walk(10.5,7.5);
  interact(state);
  walk(8.5,7.5);
  walk(8.5,5.5);
  for(let i=0;i<70;i++) tick();
  assert.ok(state.events.includes('river-sluice-aligned'));
  walk(14.5,5.5);
  interact(state);
  assert.equal(state.room,505);

  const warden=state.enemies[505][0];
  walk(9.2,5.5);
  for(let i=0;i<420&&warden.hp;i++) {
    tick();
    if(warden.phase==='recover') attack(state);
  }
  assert.equal(warden.hp,0,'the player can defeat the boss during recovery');
  walk(12.5,6.5);
  interact(state);
  assert.ok(state.equipment.includes('river-sluice-wheel'));
  walk(13.5,2.5);
  interact(state);
  assert.equal(state.room,501);
  walk(8.5,5.5);
  walk(14.5,5.5);
  cross(506,16,5.5);
  walk(9.5,5.5);
  assert.equal(interact(state),'save');
  const reloaded=decode(encode(state));
  assert.equal(reloaded.room,506);
  assert.ok(reloaded.equipment.includes('river-sluice-wheel'));
  assert.equal(reloaded.enemies[505][0].hp,0);
});
