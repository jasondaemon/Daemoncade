import test from 'node:test';import assert from 'node:assert/strict';import './gestures.js';
const make=()=>{const g=new globalThis.BlockfallGestures();g.down(1,100,200,0,24);return g;};
test('tap rotates once, jitter tolerated, long press does nothing',()=>{
 let g=make();assert.deepEqual(g.up(1,104,202,100),['rotate']);assert.deepEqual(g.up(1,104,202,150),[]);
 g=make();assert.deepEqual(g.up(1,100,200,500),[]);
});
test('horizontal drag moves cells continuously and reverses without dropping',()=>{
 const g=make();assert.deepEqual(g.move(1,149,205),['right','right']);assert.deepEqual(g.move(1,124,205),['left']);assert.deepEqual(g.up(1,124,350,200),[]);
});
test('down swipe commits exactly once on release, not on movement',()=>{
 const g=make();assert.deepEqual(g.move(1,103,270),[]);assert.deepEqual(g.up(1,103,270,180),['hard']);assert.deepEqual(g.up(1,103,270,181),[]);
});
test('up, short, diagonal, cancelled, and other-pointer gestures never drop',()=>{
 for(const [x,y] of [[100,140],[100,222],[150,250]]){const g=make();assert.deepEqual(g.up(1,x,y,100),[]);}
 const g=make();assert.equal(g.down(2,200,200,10,24),false);assert.deepEqual(g.up(2,200,400,100),[]);g.move(1,100,280);g.cancel();assert.deepEqual(g.up(1,100,280,150),[]);
});
