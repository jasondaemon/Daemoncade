import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three/three.module.min.js';
import {sampleContactShape} from './contact-shape.js';
import {supportFraction,createBody,stepBody} from './rim.js';
import {contactHint} from './contact-feedback.js';
import {DistrictRun} from './simulation.js';
const triangles=geometry=>Array.from((geometry.index?geometry.toNonIndexed():geometry).attributes.position.array);
const cylinder=()=>sampleContactShape(triangles(new THREE.CylinderGeometry(.7,.7,2,32).translate(0,1,0)),{width:1.4,depth:1.4,height:2});

test('model profiles use bounded real-surface contacts and remove invisible round corners',()=>{
 const shape=cylinder();assert.equal(shape.profile,'model');assert.ok(shape.supports.length<=12&&shape.contacts.length<=36);
 assert.ok(shape.contacts.every(p=>Math.hypot(p.x,p.z)<=.701));
 const o={x:0,z:0,yaw:0,radius:.8,shape},hole={x:.78,z:.78,radius:.12};
 assert.equal(supportFraction(o,hole),0);assert.ok(supportFraction({...o,shape:{width:1.4,depth:1.4,height:2}},hole)>0);
});
test('separated feet retain the empty gap instead of inventing support under an arch',()=>{
 const arrays=[];for(const x of[-.85,.85])arrays.push(...triangles(new THREE.BoxGeometry(.3,2,.8).translate(x,1,0)));
 arrays.push(...triangles(new THREE.BoxGeometry(2,.3,.8).translate(0,1.85,0)));
 const shape=sampleContactShape(arrays,{width:2,depth:.8,height:2}),o={x:0,z:0,yaw:0,radius:1,shape};
 assert.ok(shape.supports.every(p=>Math.abs(p.x)>=.699));assert.equal(supportFraction(o,{x:0,z:0,radius:.6}),0);
 assert.ok(supportFraction({...o,shape:{width:2,depth:.8,height:2}},{x:0,z:0,radius:.6})>0);
});
test('tapered upper sections follow the model and profiles reject malformed input safely',()=>{
 const shape=sampleContactShape(triangles(new THREE.ConeGeometry(1,3,24).translate(0,1.5,0)),{width:2,depth:2,height:3});
 assert.ok(shape.contacts.filter(p=>p.y>1.49).every(p=>Math.hypot(p.x,p.z)<.001));
 assert.equal(sampleContactShape([NaN,0,0],{width:1,depth:1,height:1}),null);assert.equal(sampleContactShape([],{}),null);
});
test('sampled contacts do not mutate shared geometry and full-descent bounds remain conservative',()=>{
 const shape=cylinder(),original=JSON.stringify(shape),o={x:0,z:0,yaw:0,radius:.8,mass:1,shape},hole={x:0,z:0,radius:1.3};o.body=createBody(o);
 assert.equal(o.body.points.length,shape.contacts.length);assert.equal(o.body.envelope.length,8);
 let result;for(let i=0;i<300;i++){result=stepBody(o,hole,1/120,i/120);if(o.body.committed)hole.x+=.05;if(result.top<-.35)break;}
 assert.ok(result.top<-.35);assert.ok(o.body.committed);assert.equal(JSON.stringify(shape),original);assert.ok(Number.isFinite(o.body.x+o.body.y+o.body.z));
 const legacy={x:0,z:0,yaw:0,radius:1,mass:1,shape:{width:1,depth:2,height:3}};assert.equal(createBody(legacy).points.length,30);
});

test('size feedback explains a real blocked overlap and clears when the object fits',()=>{
 const run=new DistrictRun({free:true}),o=run.objects.find(o=>o.type==='building');run.objects=[o];run.player.x=o.x;run.player.z=o.z;
 const hint=contactHint(run);assert.equal(hint.kind,'size');assert.ok(hint.percent>0&&hint.text.includes('wider'));
 run.player.radius=6;assert.equal(contactHint(run),null);run.player.radius=1.2;run.arena=true;assert.equal(contactHint(run),null);
});
test('sealed feedback explains prerequisites and clears for an opened, fitting object',()=>{
 const run=new DistrictRun({world:'alien',free:true}),pod=run.objects.find(o=>o.type==='pod');run.objects=[pod];run.player.x=pod.x;run.player.z=pod.z;
 assert.equal(contactHint(run).kind,'sealed');assert.ok(contactHint(run).text.includes('relay'));
 pod.phase='idle';run.player.radius=3;assert.equal(contactHint(run),null);
});
