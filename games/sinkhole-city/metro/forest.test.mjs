import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {CAMP_LAYOUTS} from './habitats.js';
import {forestColor,forestHeight,trailRibbon} from './forest.js';

test('camp pitches vary by purpose while preserving all collection inventory',()=>{
 const a=new DistrictRun({world:'basecamp'}),b=new DistrictRun({world:'basecamp'});assert.deepEqual(a.objects,b.objects);assert.equal(a.total,241);
 const expected={tent:18,rv:4,picnic:9,firepit:9,pine:66,cabin:5,landmark:1,log:48,cooler:48};
 for(const [type,count]of Object.entries(expected))assert.equal(a.objects.filter(o=>o.type===type).length,count,type);
 const combinations=new Set();
 for(const [site,l]of CAMP_LAYOUTS.entries()){
  const objects=a.objects.filter(o=>o.site===site);
  for(const [type,count]of Object.entries({tent:l.tents,rv:l.rv,picnic:l.tables,log:l.logs,cooler:l.coolers,firepit:1,pine:l.pines}))assert.equal(objects.filter(o=>o.type===type).length,count,`${site} ${type}`);
  combinations.add([l.tents,l.rv,l.tables,l.logs,l.coolers].join(','));
 }
 assert.equal(combinations.size,9);assert.ok(a.objects.every(o=>Math.abs(o.x)<=54&&Math.abs(o.z)<=54));
 const supplies=a.objects.filter(o=>o.site!==undefined&&['log','cooler'].includes(o.type)),large=a.objects.filter(o=>!o.walker&&!['log','cooler'].includes(o.type));
 for(const o of supplies)for(const other of large)assert.ok(Math.hypot(o.x-other.x,o.z-other.z)>=o.radius+other.radius+.12-1e-7,'supplies stay outside reserved silhouettes');
});

test('forest floor is deterministic, softly blended, level in play and meets its surround',()=>{
 const signatures=new Set();
 for(let x=-72;x<=72;x+=1.5)for(let z=-72;z<=72;z+=1.5){
  const color=forestColor(x,z);assert.deepEqual(color,forestColor(x,z));assert.ok(color.every(c=>Number.isFinite(c)&&c>=0&&c<=1));
  signatures.add(color.map(c=>c.toFixed(2)).join(','));
  const neighbor=forestColor(x+.1,z);assert.ok(Math.max(...color.map((c,i)=>Math.abs(c-neighbor[i])))<.025,'no hard clearing boundaries');
  if(Math.max(Math.abs(x),Math.abs(z))<=54)assert.equal(forestHeight(x,z),.012);
 }
 assert.ok(signatures.size>100);
 for(const [x,z]of[[72,0],[-72,0],[0,72],[0,-72]]){assert.deepEqual(forestColor(x,z),[129/255,148/255,96/255]);assert.equal(forestHeight(x,z),-.02);}
});

test('curving trail sections share both edges without cracks at joins',()=>{
 const points=Array.from({length:81},(_,i)=>({x:Math.sin(i*.05)*20,y:.025,z:i})),p=trailRibbon(points);
 assert.equal(p.length,80*18);assert.ok(p.every(Number.isFinite));
 for(let i=0;i<79;i++){
  assert.deepEqual(p.slice(i*18+15,i*18+18),p.slice((i+1)*18,(i+1)*18+3));
  assert.deepEqual(p.slice(i*18+6,i*18+9),p.slice((i+1)*18+3,(i+1)*18+6));
 }
});
