import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { frameAt, drawFrame } from './atlas.mjs';
const manifest = JSON.parse(await readFile(new URL('./atlas.json', import.meta.url)));
const png = await readFile(new URL(manifest.image, import.meta.url));
const [width, height] = manifest.imageSize;
let offset = 8;
const data = [];
while (offset < png.length) {
  const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') data.push(png.subarray(offset + 8, offset + 8 + length));
  offset += length + 12;
}
const raw = inflateSync(Buffer.concat(data)), stride = width * 4 + 1;
const alpha = (x, y) => raw[y * stride + 1 + x * 4 + 3];
test('PNG dimensions, opaque tiles, disjoint frames and clear gutters', () => {
  assert.deepEqual([...png.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
  assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
  assert.equal(raw.length, height * stride);
  const occupied = new Set();
  for (let y=0;y<height;y++) assert.equal(raw[y*stride],0);
  for (const [name, frame] of Object.entries(manifest.frames)) {
    const [x,y,w,h] = frame.rect;
    assert.ok(x>=2 && y>=2 && x+w+2<=width && y+h+2<=height, name);
    assert.deepEqual(frame.logicalSize,[w,h]);
    assert.ok(frame.pivot[0]>=0 && frame.pivot[0]<=w && frame.pivot[1]>=0 && frame.pivot[1]<=h);
    let visible=0;
    for (let yy=y;yy<y+h;yy++) for (let xx=x;xx<x+w;xx++) {
      const index=yy*width+xx; assert.ok(!occupied.has(index),name); occupied.add(index);
      if(alpha(xx,yy)) visible++;
      if(frame.kind==='tile') assert.equal(alpha(xx,yy),255,name);
    }
    if(!name.includes('.defeat.3')) assert.ok(visible>0,name);
    for(let yy=y-2;yy<y+h+2;yy++) for(let xx=x-2;xx<x+w+2;xx++) {
      if(xx<x||xx>=x+w||yy<y||yy>=y+h) assert.equal(alpha(xx,yy),0,`${name} gutter`);
    }
  }
});
test('all required directions, terrain sets, enemies and props resolve', () => {
  for(const direction of ['up','down','left','right']) for(const action of ['idle','walk','strike']) {
    assert.ok(manifest.animations[`keeper.${direction}.${action}`]);
  }
  assert.equal(Object.keys(manifest.terrainSets).length,6);
  assert.equal(new Set(Object.values(manifest.wardenSets)).size,3);
  for(const family of [...Object.values(manifest.enemySets),...Object.values(manifest.wardenSets)]) {
    for(const action of ['idle','walk','windup','attack','hurt','defeat']) assert.ok(manifest.animations[`enemy.${family}.${action}`]);
  }
  for(const prop of ['waystone','stairs','beacon','chest','relic-root','relic-tide','relic-prism','secondary-boomerang','tonic','key']) assert.ok(manifest.frames[`prop.${prop}.0`]);
});
test('animation timing boundaries, looping and one-shot holds', () => {
  for(const [name, animation] of Object.entries(manifest.animations)) {
    assert.equal(animation.frames.length,animation.durationsMs.length);
    let time=0;
    for(let i=0;i<animation.frames.length;i++) {
      assert.ok(animation.durationsMs[i]>0);
      assert.equal(frameAt(manifest,name,time),manifest.frames[animation.frames[i]]);
      assert.equal(frameAt(manifest,name,time+animation.durationsMs[i]-1),manifest.frames[animation.frames[i]]);
      time+=animation.durationsMs[i];
    }
    assert.equal(frameAt(manifest,name,time),manifest.frames[animation.frames[animation.loop?0:animation.frames.length-1]]);
  }
});
test('Canvas adapter uses source rectangle, pivot, scaling and disables smoothing', () => {
  let args; const image={}; const context={drawImage(...a){args=a;},imageSmoothingEnabled:true};
  assert.equal(drawFrame(context,image,manifest,'keeper.down.walk',100,120,0,2),true);
  assert.equal(context.imageSmoothingEnabled,false);
  assert.deepEqual(args,[image,...manifest.frames['keeper.down.walk.0'].rect,60,80,80,80]);
  assert.equal(drawFrame(context,image,manifest,'terrain.mossward.floor.0',80,40),true);
  assert.deepEqual(args.slice(-4),[80,40,40,40]);
  assert.equal(drawFrame(context,image,manifest,'missing',0,0),false);
});
test('floor edges tile cleanly and lantern light preserves translucency', () => {
  const pixel = (x,y) => raw.subarray(y*stride+1+x*4,y*stride+1+x*4+4);
  for(const terrain of Object.values(manifest.terrainSets)) {
    for(const id of terrain.floor) {
      const [x,y,w,h]=manifest.frames[id].rect;
      for(let i=0;i<w;i++) {
        assert.deepEqual(pixel(x+i,y),pixel(x+i,y+h-1));
        assert.deepEqual(pixel(x,y+i),pixel(x+w-1,y+i));
      }
    }
  }
  const [x,y,w,h]=manifest.frames['effect.lantern-glow.0'].rect;
  assert.ok(alpha(x+w/2,y+h/2)>0 && alpha(x+w/2,y+h/2)<100);
  assert.equal(alpha(x,y),0);
  assert.ok(alpha(x+w/2,y+h/2)>alpha(x+w/2+30,y+h/2));
});
