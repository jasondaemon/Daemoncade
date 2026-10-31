import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistrictRun} from './simulation.js';
import {stepBody} from './rim.js';
test('accepted thin, tall and wide props continue downward when the player leaves at speed',()=>{
 for(const [width,height,depth]of[[.3,4,.3],[2,1,1],[1,6,1],[1.8,.25,1.2]])for(let n=0;n<12;n++){
  const o={x:0,z:0,yaw:n*Math.PI/6,radius:1,mass:2,shape:{width,height,depth}},hole={x:0,z:0,radius:2};let committed=false,ceiling=Infinity,finished=false;
  for(let tick=0;tick<1200;tick++){
   if(committed){hole.x+=.2;hole.z-=.1;}
   const result=stepBody(o,hole,1/120,tick/120);
   assert.ok(Number.isFinite(result.top+result.bottom+o.x+o.z));
   if(o.body.committed){if(committed)assert.ok(result.top<=ceiling+1e-8);committed=true;ceiling=result.top;}
   if(result.top<-.35){finished=true;break;}
  }
  assert.ok(committed&&finished,JSON.stringify({width,height,depth,n}));
 }
});
test('oversized props never enter from an edge graze or a centered opening',()=>{
 for(const distance of[0,.4,.9,1.3]){
  const r=new DistrictRun({free:true}),o=r.objects.find(o=>o.type==='building');r.objects=[o];r.total=1;r.player.radius=1.2;r.player.area=1.44;r.player.x=o.x+distance;r.player.z=o.z;
  for(let i=0;i<600;i++)r.collect(r,1/60);
  assert.equal(o.phase,'idle');assert.equal(r.eaten,0);assert.equal(r.score,0);
 }
});
