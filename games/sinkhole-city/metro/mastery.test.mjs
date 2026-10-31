import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ALL_CONTRACTS,RIMS,normalizeCareer,recordResult,medalCount,nextReward,earnedRewards,rimFor,encodeBackup,decodeBackup} from './career.js';
import {rimGeometry} from './rim-art.js';

test('mastery unlocks sequentially through 45 medals, never duplicates and retains old saves',()=>{
 let career=normalizeCareer({});const earned=[];
 assert.equal(nextReward(career).id,'gold');assert.equal(rimFor(career,'eclipse').id,'mint');
 for(const contract of ALL_CONTRACTS){
  const before=career;career=recordResult(career,{contract,won:true,time:1,score:100});earned.push(...earnedRewards(before,career).map(r=>r.id));
  assert.deepEqual(decodeBackup(encodeBackup(career)),career);
  for(const r of RIMS)assert.equal(rimFor(career,r.id).id,r.medals<=medalCount(career)?r.id:'mint');
  assert.deepEqual(earnedRewards(career,recordResult(career,{contract,won:true,time:2,score:200})),[]);
 }
 assert.equal(medalCount(career),54);assert.equal(nextReward(career),null);assert.deepEqual(earned,RIMS.slice(1).map(r=>r.id));
 assert.equal(rimFor(career,'unknown').id,'mint');assert.deepEqual(earnedRewards(career,normalizeCareer({})),[]);
 assert.deepEqual(RIMS.slice(0,4).map(r=>[r.id,r.medals]),[['mint',0],['gold',3],['coral',6],['violet',9]]);
});
test('rim styles are finite, static and bounded outside the gameplay opening',()=>{
 const signatures=new Set();
 for(const style of ['plain','segments','rays','facets','satellites','crown','vortex']){
  const g=rimGeometry(style),p=g.attributes.position,n=g.attributes.normal;assert.ok(p.count>0&&p.count<10000);assert.equal(p.count,n.count);
  let min=Infinity,max=0;for(let i=0;i<p.count;i++){
   const radius=Math.hypot(p.getX(i),p.getY(i));min=Math.min(min,radius);max=Math.max(max,radius);
   assert.ok(Number.isFinite(radius+p.getZ(i)+n.getX(i)+n.getY(i)+n.getZ(i)));
  }
  assert.ok(min>=.96&&max<1.26,`${style}: ${min}–${max}`);assert.ok(g.boundingSphere.radius<1.27);
  signatures.add(`${p.count}:${max.toFixed(4)}`);g.dispose();
 }
 assert.equal(signatures.size,7);
});
test('character mouths are colored single meshes with no geometry inside the opening',()=>{
 for(const style of RIMS.filter(r=>r.style).map(r=>r.style)){
  const g=rimGeometry(style),p=g.attributes.position,c=g.attributes.color;
  assert.equal(c.count,p.count);assert.ok(p.count<20000);
  const colors=new Set();let raised=false;
  for(let i=0;i<p.count;i++){
   const r=Math.hypot(p.getX(i),p.getY(i));assert.ok(r>=.999&&r<2.05,`${style} mouth clearance ${r}`);
   assert.ok(Number.isFinite(p.getZ(i)));if(p.getZ(i)<-.3)raised=true;
   colors.add([c.getX(i),c.getY(i),c.getZ(i)].join(','));
  }
  assert.ok(raised);assert.ok(colors.size>=6);g.dispose();
 }
});
test('every earned reward has a distinct character silhouette and retains its saved identity',()=>{
 assert.deepEqual(RIMS.map(r=>[r.id,r.medals]),[['mint',0],['gold',3],['coral',6],['violet',9],['tide',12],['solar',18],['prism',24],['orbital',30],['nova',36],['eclipse',45],['singularity',54]]);
 const signatures=RIMS.map(r=>{const g=rimGeometry(r.style),signature=JSON.stringify([g.attributes.position.count,g.boundingSphere.radius]);g.dispose();return signature;});
 assert.equal(new Set(signatures).size,11);
});
test('serpent coil is a closed outward-facing skin rather than an inside-out tube',()=>{
 const g=rimGeometry('serpent'),p=g.attributes.position,n=g.attributes.normal;let sampled=0;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  assert.ok(Number.isFinite(n.getX(i)+n.getY(i)+n.getZ(i)));
  if(y>.4&&Math.hypot(x,y)>1.30&&Math.abs(z+.10)<.06){assert.ok(x*n.getX(i)+y*n.getY(i)>.3);sampled++;}
 }
 assert.ok(sampled>200);g.dispose();
});
