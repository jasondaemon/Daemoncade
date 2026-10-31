import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../vendor/three/three.module.min.js';
import {DistrictRun} from './simulation.js';
import {MetroRenderer} from './renderer.js';
import {SCALE_STAGES,SCALE_COUNT,advanceScale,finishScale,journeyFraction,COLLAPSE_SECONDS} from './ascension.js';
import {ascensionGround,updateAscensionGround} from './ascension-art.js';
import {summarizeRun} from './exploration.js';
import {ALL_CONTRACTS,ASCENSION_CONTRACTS,TOTAL_MEDALS} from './worlds.js';
import {normalizeCareer,worldUnlocked,encodeBackup,decodeBackup} from './career.js';
import {sourceKey} from './world-dressing.js';

test('Infinity unlocks after Solar collapse and old saves retain all earned medals',()=>{
 const records=Object.fromEntries(ALL_CONTRACTS.slice(0,14).map(c=>[c.id,{medal:3,time:1,score:100}]));
 const old=normalizeCareer({version:1,records});assert.equal(worldUnlocked(old,'ascension'),false);records['orbit-sun']={medal:1,time:300,score:100};
 const next=normalizeCareer({version:1,records});assert.ok(worldUnlocked(next,'ascension'));assert.deepEqual(decodeBackup(encodeBackup(next)),next);assert.equal(TOTAL_MEDALS,54);assert.equal(ASCENSION_CONTRACTS.length,3);
});
function drive(r,budget=1100){
 for(let tick=0;tick<budget*60&&!r.done;tick++){
  const p=r.player,o=r.objects.filter(o=>r.eligible(o)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const x=o?o.x-p.x:0,y=o?o.z-p.z:0,d=Math.hypot(x,y)||1;r.step(1/60,{x:d<.05?0:x/d,y:d<.05?0:y/d});r.events.length=0;
 }
}
test('continuous shared space preserves growth and the ending physically consumes all remnants',()=>{
 const r=new DistrictRun({world:'ascension',free:true,seed:19});assert.equal(r.total,SCALE_COUNT*68);assert.ok(r.objects.every(o=>o.phase==='idle'));
 const large=r.objects.find(o=>o.scaleStage===1);assert.equal(r.eligible(large),false);const home=[large.homeX,large.homeZ];
 const small=r.objects.find(o=>o.scaleStage===0);const score=r.score;r.consume(r,small);r.consume(r,small);assert.equal(r.eaten,1);assert.ok(r.score>score);
 const radius=r.player.radius;r.player.vx=2;advanceScale(r);assert.equal(r.player.radius,radius);assert.equal(r.player.vx,2);assert.deepEqual([large.homeX,large.homeZ],home);
 drive(r);assert.ok(r.done&&r.won);assert.equal(r.counts.scales,SCALE_COUNT);assert.ok(r.player.radius>10000);assert.equal(r.eaten,r.total,'the ending must finish intake, not leave visible matter behind');assert.ok(r.objects.every(o=>o.phase==='consumed'));assert.equal(r.continueExploring(),false);
});
test('maximum size is not completion; the last galaxy starts a timed final intake',()=>{
 const r=new DistrictRun({world:'ascension',free:true}),atom=r.objects[0],galaxy=r.objects.find(o=>o.scaleStage===SCALE_COUNT-1);
 for(const o of r.objects)if(o!==atom&&o!==galaxy)o.phase='consumed';r.eaten=r.total-2;
 r.player.radius=1.2*3.4**SCALE_COUNT;r.player.area=r.player.radius**2;finishScale(r);
 assert.equal(r.counts.scales,SCALE_COUNT-1);assert.equal(journeyFraction(r),.99);assert.equal(summarizeRun(r).full,false);assert.equal(r.infinityCollapse,undefined);
 r.consume(r,galaxy);assert.ok(r.infinityCollapse);assert.equal(atom.phase,'diving');const score=r.score;
 for(let i=0;i<(COLLAPSE_SECONDS-1)*60;i++)r.step(1/60,{x:0,y:0});
 assert.equal(r.done,false);assert.equal(atom.phase,'diving');assert.equal(r.score,score);assert.ok(atom.intake<1&&atom.intake>0);assert.equal(journeyFraction(r),.99);
 for(let i=0;i<90;i++)r.step(1/60,{x:0,y:0});
 assert.ok(r.infinityComplete&&r.done&&r.won);assert.equal(r.eaten,r.total);assert.equal(journeyFraction(r),1);assert.equal(summarizeRun(r).full,true);const final=r.score;r.consume(r,atom);assert.equal(r.score,final);
});
test('all three continuous contracts are reachable across seeds and a short mission continues without resetting size',()=>{
 for(const seed of[1,7,23])for(const contract of ASCENSION_CONTRACTS){const r=new DistrictRun({contract,seed});drive(r);assert.ok(r.done&&r.won,contract.id+' seed '+seed);assert.ok(r.time>40,'progress must require active collecting');if(contract.target===2){const size=r.player.radius,eaten=r.eaten,position=[r.player.x,r.player.z];assert.ok(r.continueExploring());assert.equal(r.contract,null);assert.equal(r.player.radius,size);assert.equal(r.eaten,eaten);assert.deepEqual([r.player.x,r.player.z],position);drive(r);assert.equal(r.counts.scales,SCALE_COUNT);}}
});
test('scale distributions vary by seed and by range; drifting stops when no simulation steps are run',()=>{
 const a=new DistrictRun({world:'ascension',free:true,seed:1}),b=new DistrictRun({world:'ascension',free:true,seed:2});assert.notEqual(a.objects[0].x,b.objects[0].x);const o=a.objects[0],before=[o.x,o.z];a.step(1/60,{x:0,y:0});assert.notDeepEqual([o.x,o.z],before);const after=[o.x,o.z];advanceScale(a,0);assert.deepEqual([o.x,o.z],after);
 assert.notEqual(a.objects[0].homeX,a.objects[68].homeX/a.objects[68].unit);
});
test('insects, human objects and geography have distinct size hierarchies',()=>{
 const r=new DistrictRun({world:'ascension',free:true}),sizes=kind=>r.objects.filter(o=>o.scaleKind===kind).map(o=>o.radius);
 const ant=Math.max(...sizes('ant')),house=Math.min(...sizes('house')),mountain=Math.min(...sizes('mountain')),earth=Math.min(...sizes('earth'));
 assert.ok(house/ant>100,'a house must dwarf an ant');assert.ok(mountain/ant>3000,'insects and mountains must not share a visible scale');assert.ok(earth/mountain>80,'geographical steps must bridge mountains to planets');
 for(let progress=0;progress<=SCALE_COUNT;progress+=.125){const zoom=Math.max(1,1.2*3.4**progress/1.8),visible=radius=>radius/zoom>=.055&&radius/zoom<=14;assert.equal(visible(ant)&&visible(mountain),false);}
 for(const label of['Microfauna','Leaf litter','Garden','Undergrowth','Street life','Neighborhood','City','Regions','Archipelagos','Continents','Star clouds'])assert.ok(SCALE_STAGES.some(s=>s.label===label));
});
test('every scale model has finite geometry and a bounded mesh budget',()=>{
 const renderer=Object.create(MetroRenderer.prototype);renderer.materials=new Map();
 const keys=new Set(new DistrictRun({world:'ascension'}).objects.map(sourceKey));
 for(const key of keys){const root=renderer.primitive(key);assert.ok(root);root.updateMatrixWorld(true);const size=new T.Box3().setFromObject(root).getSize(new T.Vector3());let triangles=0;root.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position;assert.ok(p.array.every(Number.isFinite));triangles+=(m.geometry.index?.count||p.count)/3;});assert.ok(size.x>0&&size.y>0&&size.z>0);assert.ok(triangles>10&&triangles<15000,`${key}: ${triangles}`);}
 assert.equal(SCALE_STAGES.length,18);
});
test('every Infinity terrain palette retains the real hole cutout shader',()=>{
 const r=Object.create(MetroRenderer.prototype);Object.assign(r,{materials:new Map(),holes:[],holeCount:{value:1},underwater:{value:0},cosmic:{value:0},scene:new T.Scene(),sun:new T.DirectionalLight()});r.scene.background=new T.Color();r.scene.fog=new T.Fog(0,10,100);
 for(let stage=0;stage<SCALE_COUNT;stage++){const g=new T.Group();ascensionGround(r,g,stage);const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <alphatest_fragment>'};g.children[0].material.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('discard;'));assert.equal(shader.uniforms.holes.value,r.holes);g.children[0].geometry.dispose();g.children[0].material.dispose();}
 updateAscensionGround(r,SCALE_COUNT-3);assert.equal(r.infinitySpace.value,1);updateAscensionGround(r,SCALE_COUNT-1.5);assert.ok(r.infinitySpace.value>0&&r.infinitySpace.value<1);updateAscensionGround(r,SCALE_COUNT-1);assert.equal(r.infinitySpace.value,0);assert.equal(r.scene.background.getHex(),0);assert.equal(r.infinitySurface.color.getHex(),0);assert.equal(r.scene.fog.color.getHex(),0);
});
