import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import manifest from './manifest.mjs';
import {loadAtlas,frameAt} from './atlas.mjs';
const json=JSON.parse(await readFile(new URL('./atlas.json',import.meta.url)));
const png=await readFile(new URL(manifest.image,import.meta.url));
let offset=8;const chunks=[];
while(offset<png.length){const n=png.readUInt32BE(offset);if(png.toString('ascii',offset+4,offset+8)==='IDAT')chunks.push(png.subarray(offset+8,offset+8+n));offset+=n+12;}
const pixels=inflateSync(Buffer.concat(chunks));const stride=manifest.imageSize[0]*4+1;
function framePixels(id){const [x,y,w,h]=manifest.frames[id].rect;return Buffer.concat(Array.from({length:h},(_,i)=>pixels.subarray((y+i)*stride+1+x*4,(y+i)*stride+1+(x+w)*4)));}
test('generated module and JSON agree, expanded materials and corner masks resolve',()=>{
 assert.deepEqual(manifest,json);
 assert.equal(Object.keys(manifest.regionSets).length,18);
 for(const [land,set] of Object.entries(manifest.regionSets)){
  assert.equal(set.shore.length,16);
  for(const id of [...set.floor,...set.wall,...set.details,...set.shore,set.landmark])assert.ok(manifest.frames[id],`${land}: ${id}`);
  assert.ok(frameAt(manifest,set.water,100));
  for(let side=0;side<4;side++){
   const rgba=framePixels(set.shore[1<<side]);
   const [x,y]=[[20,0],[39,20],[20,39],[0,20]][side];
   assert.equal(rgba[(y*40+x)*4+3],255,`${land}: shoreline edge ${side}`);
   assert.equal(rgba[(20*40+20)*4+3],0,`${land}: center stays transparent`);
  }
 }
});
test('nine bosses have readable native bounds, moving attack poses and distinct tells',()=>{
 assert.equal(Object.keys(manifest.bossSets).length,9);
 const silhouettes=new Set();
 for(const family of Object.values(manifest.bossSets)){
  const base=`enemy.${family}`;
  for(const action of ['idle','walk','windup','attack','hurt','defeat'])assert.ok(manifest.animations[`${base}.${action}`]);
  assert.deepEqual(manifest.frames[`${base}.idle.0`].logicalSize,[80,80]);
  assert.notDeepEqual(framePixels(`${base}.idle.0`),framePixels(`${base}.windup.0`));
  assert.notDeepEqual(framePixels(`${base}.attack.0`),framePixels(`${base}.attack.2`));
  const rgba=framePixels(`${base}.idle.0`);silhouettes.add(Array.from(rgba).filter((_,i)=>i%4===3).join(','));
  assert.ok(framePixels(`${base}.defeat.3`).every(n=>n===0));
 }
 assert.equal(silhouettes.size,9);
});
test('keepers, distinct NPCs, enemy families and earned equipment resolve',()=>{
 for(const dir of manifest.directions)for(const action of ['idle','walk','strike','cast','use','dash','hurt'])assert.ok(frameAt(manifest,`keeper.${dir}.${action}`,180));
 const identities=new Set();
 for(const id of Object.values(manifest.npcSets)){assert.ok(frameAt(manifest,id,700));identities.add(framePixels(manifest.animations[id].frames[0]).toString('base64'));}
 assert.equal(identities.size,14);
 for(const family of Object.values(manifest.expandedEnemySets))for(const action of ['idle','walk','windup','attack','hurt','defeat'])assert.ok(frameAt(manifest,`enemy.${family}.${action}`,90));
 for(const id of ['grapnel','tide-boots','ember-gauntlet','moon-lens','storm-bow','sun-disc','eclipse-lantern','potion-health','potion-light','potion-ward'])assert.ok(manifest.frames[`prop.${id}.0`]);
});
test('local image decode succeeds before draw; decode errors and wrong sizes reject',async()=>{
 const previous=globalThis.Image;let decoded=false;
 try{
  globalThis.Image=class{naturalWidth=manifest.imageSize[0];naturalHeight=manifest.imageSize[1];async decode(){assert.ok(this.src.endsWith('/'+manifest.image));assert.ok(this.src.startsWith('file:'));decoded=true;}};
  const atlas=await loadAtlas();assert.equal(decoded,true);let draws=0;
  assert.equal(atlas.draw({drawImage(){draws++;}},'enemy.eclipse-sovereign.windup',50,50,100),true);assert.equal(draws,1);
  globalThis.Image=class{async decode(){throw new Error('decode failed');}};
  await assert.rejects(loadAtlas(),/decode failed/);
  globalThis.Image=class{naturalWidth=1;naturalHeight=1;async decode(){}};
  await assert.rejects(loadAtlas(),/dimensions/);
 }finally{if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous;}
});
test('actual expanded story and scene semantics resolve to shipped pixels',async()=>{
 const {regionalStories,equipment}=await import('../../expansion/story.mjs');
 const {rooms}=await import('../../expansion/world.mjs');
 for(const region of regionalStories){
  assert.ok(manifest.regionSets[manifest.contentBindings.lands[region.id]],region.id);
  assert.ok(manifest.regionSets[manifest.contentBindings.materials[region.art]],region.art);
  assert.ok(frameAt(manifest,manifest.contentBindings.characters[region.npc],0),region.npc);
 }
 for(const name of equipment)assert.ok(manifest.frames[`prop.${name}.0`],name);
 for(const scene of rooms)for(const detail of scene.scenery)assert.ok(frameAt(manifest,manifest.scenerySets[detail.kind],0),detail.kind);
});
